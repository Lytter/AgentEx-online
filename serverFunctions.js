const constant = require("./Constants");

const API_AI_TOKEN = 'API_TOKEN For your DialogFlow chatbot';
const apiAiClient = require('apiai')(API_AI_TOKEN);
const FACEBOOK_ACCESS_TOKEN = 'CREATE A FB-PAGE and add developer key here';
const request = require('request');
const sendTextMessage = require('./common').sendTextMessage;
const sendTextWithImage = require('./common').sendTextWithImage;
const getImageForTurn = require('./utils').getImageForTurn;
const registerChatMessage = require('./processChatMessage').registerChatMessage;
const utils = require("./utils");


const br = " \u000A";

const sendServerRequestWithParams = require("./utils").sendServerRequestWithParams;
const sendServerRequest = require("./utils").sendServerRequest;

module.exports = {
    resetServer: function () {
        console.log('RESETTING SERVER');
        //Vi kan inte reset server att start up för vi vet inte var servern finns
    },
    startAGame: function (senderId, customserver, callback) {
        let actualServer = constant.GroupServer.get(constant.PlayerGroup.get(senderId));
        console.log("Starting a new game: " + constant.PlayerGroup.get(senderId));
        sendServerRequestWithParams(actualServer, 'startgame', {
            passWord: constant.PlayerGroup.get(senderId)
        }, function (error, serverresponse, body) {
            if (!error) {
                BODY = JSON.parse(body);
                if (BODY.status == 200) {
                    constant.GameUrls.set(BODY.id.toUpperCase(), actualServer);
                    constant.store("GameUrls");
                    let text = "Your game is now ready at " + actualServer
                        + " \nYour game has GameID: " + BODY.id;
                    callback(null, text, BODY.id);
                } else {
                    let text = "There was an error when I tried to start a new game for you, at: " +
                        actualServer + '\n\n' + BODY.message;
                    console.log(text);
                    callback(text);
                }
            } else {
                let text = 'The server at A: ' + actualServer + ' does not respond ';
                callback(text);
            }
        });
    },
    addPlayerToAGame: function (senderId, gameId, callback) {
        if (constant.PlayerGames.get(senderId)) {
            callback({
                message: {
                    status: 500,
                    message: "You are already in a game: " + constant.PlayerGames.get(senderId) + ". You have to finish that game before you  register for a new one."
                }
            });
            return;
        }
        let groupServer = constant.GroupServer.get(constant.PlayerGroup.get(senderId));
        let server = gameId === "LookingForGroup" ? groupServer : constant.GameUrls.get(gameId.toUpperCase());
        console.log(groupServer)
        console.log(gameId)
        console.log("addPlayerToGame");
        if (!server) {
            callback({
                message: "The specified game does not exit on any registred server",
                submessage: "please check your game ID and try again"
            });
        } else {
            sendServerRequestWithParams(server, 'addplayer', {
                playerid: senderId,
                gameid: gameId,
                passWord: constant.PlayerGroup.get(senderId)
            }, function (error, serverresponse, body) {
                if (!error) {
                    let BODY = JSON.parse(body);
                    if (BODY.status == 200) {
                        let gameObject = BODY;
                        constant.PlayerGames.set(senderId, BODY.id);
                        if (constant.PlayerOfGames.get(BODY.id.toUpperCase()))
                            constant.PlayerOfGames.get(BODY.id.toUpperCase()).push(senderId);
                        else
                            constant.PlayerOfGames.set(BODY.id.toUpperCase(), [senderId]);
                        constant.store("PlayerGames");
                        constant.store("PlayerOfGames");
                        let extra = " Please wait for some more players to join...";
                        if (BODY.humanPlayers != BODY.maxHumanPlayers) //Annars är matchningen klar och ett separat meddelande kommer från servern
                            callback(null, "You are now connected to a game.", (BODY.humanPlayers == BODY.maxHumanPlayers ? "Game ID: " + BODY.id : extra), BODY.id, gameObject);
                    } else if (gameId == "LookingForGroup") {
                        console.log("LFG");
                        callback({message: BODY});
                    } else
                        callback({message: BODY.message});
                } else {
                    callback({
                        message: 'The server at B: ' + server + ' does not respond ',
                        submessage: 'Please contact your administrator and check that the server is running'
                    });
                }
            });
        }
    },
    getGame: getGame,
    withdrawResources: function (senderId, amount, callback) {
        let gameName = constant.PlayerGames.get(senderId);
        if (gameName) gameName = gameName.toUpperCase();
        let server = constant.GameUrls.get(gameName);
        if (!server) {
            sendTextWithImage(senderId, getImageForTurn(null), "You are not registred as a player in any running game, please delete this conversation and start over");
        } else {
            sendServerRequestWithParams(server, 'registerYield', {
                playerid: senderId,
                yield: amount,
                passWord: constant.PlayerGroup.get(senderId)
            }, function (error, serverresponse, body) {
                if (!error) {

                    let BODY = JSON.parse(body);
                    if (BODY.status == 200)
                        sendTextWithImage(senderId, getImageForTurn("wait"), "You have withdrawn " + amount + ' resources this turn.', 'Please wait for the turn to end.');
                    else
                        sendTextWithImage(senderId, getImageForTurn(null), BODY.message);
                } else {
                    sendTextWithImage(senderId, getImageForTurn(null), 'The server at C: ' + server + ' does not respond ');
                }
            });
        }
    },
    registerConfidence: function (senderId, assessment, callback) {
        let gameName = constant.PlayerGames.get(senderId);
        if (gameName) gameName = gameName.toUpperCase();
        let server = constant.GameUrls.get(gameName);
        console.log("SENDING");
        sendServerRequestWithParams(server, 'registerConfidence', {
            playerid: senderId,
            assessment: assessment,
            passWord: constant.PlayerGroup.get(senderId)
        }, function (error, serverresponse, body) {
            if (error) {
                callback(error);
            }
        });
    },
    createNewGameGroup: function (senderId, group_settings, omitConfirmation) {
        console.log("createNewGameGroup")
        constant.GroupServer.set(group_settings.groupname, group_settings.java_server);
        constant.store("GroupServer");

        constant.GroupSettings.set(group_settings.groupname, group_settings);
        constant.store("GroupSettings");

        sendServerRequestWithParams(group_settings.java_server, 'newgamegroup', {
            playerid: senderId,
            passWord: group_settings.groupname,
            path_to_result: group_settings.path_to_result,
            node_server: constant.httpHost,
            netlogo_model: group_settings.netlogo_model,
            netlogo_world: group_settings.netlogo_world,
            survey: group_settings.survey,
            valid_until: group_settings.valid_until,
            max_humans: group_settings.max_humans,
            grace: group_settings.grace
        }, function (error, serverresponse, body) {
            if (!omitConfirmation)
                if(!error)
                    sendTextMessage(senderId, "Skapade ny grupp med id: " + group_settings.groupname);
                else
                    sendTextMessage(senderId, "Kunde inte skapa grupp med id: " + group_settings.groupname);
        });
    },
    initiateAgentCommunication: function (sender) {
        console.log("----------------INITIATE COMMUNICATION FOR NEXT ROUND--------------------");
        getGame(sender, "Get game for chat initialization.", function (err, text, game) {
            console.log("--------GAME FETCHED TO INIT COMMUNICATION---------");
            if (game) {
                //för varje spelare
                game.players.forEach(function (player) {
                    //if (!player.human)
                        if (player.speaker) {
                            const server_ = constant.GameUrls.get(game.id.toUpperCase());
                            const password = constant.PlayerGroup.get(sender);
                            registerChatMessage(server_, player.id, password, game.id, player.optimalStockSize, function (error, body, senderId,) {
                                console.log("--------MESSAGE SENT TO SERVER---------");
                                if (!error) {
                                    console.log("INSIDE_initiateAgentCommunication")
                                    let game = JSON.parse(body);
                                    if(game.status == 200)
                                        setTimeout(function () {
                                            constant.SOCKET_IO.emit("Server_Chat_Message", {game: game});
                                        }, game.players[utils.getPlayerIndexFromId(senderId, game)].typingSkill * 1000);
                                } else {
                                    console.log("Exception thrown in processChatMessage!!");
                                    console.log(error);
                                }
                            });
                        }
                });
            } else {
                console.log(err);
            }
        });

    }
}


//servern som används här måste bytas ut till ngt generellt så att man i framtiden ska kunna ha flera servers
function getGame (senderId, text, callback) {
    let gameName = constant.PlayerGames.get(senderId);
    if (gameName) gameName = gameName.toUpperCase();
    let groupServer = constant.GroupServer.get(constant.PlayerGroup.get(senderId));
    console.log("GET_GAME")
    sendServerRequestWithParams(groupServer, 'getGameAsItIsRightNow', {
        playerid: senderId,
        passWord: constant.PlayerGroup.get(senderId)
    }, function (error, serverresponse, body) {
        if (!error) {
            let BODY = JSON.parse(body);
            if (BODY.status == 200) {
                callback(null, text, BODY);
            } else
                callback(BODY.message);
        } else {
            console.log(error)
            callback('The server at D: ' + groupServer + ' does not respond ');
        }
    });
}
