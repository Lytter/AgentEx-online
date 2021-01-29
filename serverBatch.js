const constant = require("./Constants");
const utils = require("./utils");
const sendTextMessage = require('./common').sendTextMessage;
const sendImage = require('./common').sendImage;
const openWebView = require('./common').openWebView;
const sendTextWithImageAndButtons = require('./common').sendTextWithImageAndButtons;
const sendTextWithImage = require('./common').sendTextWithImage;
const FACEBOOK_ACCESS_TOKEN = 'FB Access Token';
const serverFunctions = require("./serverFunctions");
const registerChatMessage = require("./processChatMessage").registerChatMessage;
const getImageForTurn = require('./utils').getImageForTurn;

const httpHost = process.argv[3] || "SET_THIS_ON_START";

const request = require('request');

const sendServerRequestWithParams = require("./utils").sendServerRequestWithParams;

let batchgg;
let batcht;

module.exports = {
    batchGameGroups: function() {
        if(batchgg != null)
            clearInterval(batchgg);
        batchgg = setInterval(function() {
            let now = new Date();

            console.log(constant.PlayerGroup)
            console.log(constant.PlayerGames)
            console.log(constant.PlayerOfGames)
            console.log(constant.GameUrls)
            console.log(constant.GroupSettings)
            console.log(constant.GroupServer)

            //för varje groupsetting
            for (let key in constant.GroupSettings) {
                let expDate = constant.GroupSettings.get(key).valid_until;
                let d = new Date(expDate);
                console.log(now)
                console.log(d)
                if (d.getTime() < now.getTime()) {
                    console.log("Cleaning up " + key);
                    let removePlayer = [];
                    let removeGame = [];
                    for (let player in constant.PlayerGroup) {
                        console.log("Cleaning up: " + player);
                        removeGame.push(constant.PlayerGames.get(player).toUpperCase());
                        removePlayer.push(player);
                    }
                    utils.removeGameGroup(key, removePlayer, removeGame);
                    /*
                    if (removeGame.length > 0)
                        sendServerRequestWithParams(constant.GameUrls[removeGame[0]], 'unregistergamegroup', {
                            passWord: key
                        }, function (error, serverresponse, body) {
                            if(!error) {
                                utils.removeGameGroup(key, removePlayer, removeGame);
                            } else
                                console.log(error);
                        });
                     */
                }
                else
                    console.log("Keeping " + key + " alive");
            }
        }, 120000);
    },
    /*
    batchTurns: function () {
console.log("BATCHAR TURNS")
        if(batcht != null)
            clearInterval(batcht);
        console.log('Handle batch control gameturns');
        setInterval(function () {
            if (Object.keys(constant.GameUrls).length === 0) {
                return;
            }
            for (const key in constant.GameUrls) {
                sendServerRequestWithParams(constant.GameUrls[key], 'checkIfTurnIsFinnished', {
                    gameid: key
                }, function (error, serverresponse, body) {
                    if (error) {
                        ;
                    } else {
                        let BODY
                        BODY = JSON.parse(body);
                        if (BODY.status === 200) { //running game
                            if (constant.PlayerOfGames[key.toUpperCase()]) {
                                serverFunctions.initiateAgentCommunication(constant.PlayerOfGames[key.toUpperCase()][0]);
                                constant.PlayerOfGames[key.toUpperCase()].forEach(function (playerID) {
                                    openWebView(httpHost, playerID, "Your current game has advanced one turn\n", "gameStatus", BODY);
                                });
                            }
                        } else if (BODY.status === 201) {  //last turn has finished
                            sendServerRequestWithParams(constant.GameUrls[key], 'getGameResult', {
                                gameid: key
                            }, function (error, serverresponse, body) {
                                if (error) {
                                    console.log(error);
                                } else {
                                    let game = JSON.parse(body);

                                    let playerArray = constant.PlayerOfGames[key.toUpperCase()];
                                    if (playerArray) {
                                        for (const playerID of playerArray) {
                                            let buttons = [{
                                                type: "web_url",
                                                url: constant.GroupSettings[constant.PlayerGroup[playerID]].survey,
                                                title: "To survey",
                                                webview_height_ratio: "full", //compact/tall/full
                                                messenger_extensions: false
                                            }];
                                            sendTextWithImageAndButtons(playerID, getImageForTurn(game), buttons,
                                                "Your game has finished, thank you for your participation", "Now take our post-game survey!");
                                            //(senderId, image, buttons, text, subtext)
                                            delete constant.PlayerGames[playerID];
                                            delete constant.PlayerGroup[playerID];
                                            constant.store("PlayerGames");
                                            constant.store("PlayerGroup");
                                        }
                                    }
                                    delete constant.PlayerOfGames[key.toUpperCase()];
                                    delete constant.GameUrls[key.toUpperCase()];
                                    constant.store("PlayerOfGames");
                                    constant.store("GameUrls");
                                }
                            });
                        }
                    }
                });
            }
        }, 6000);
    }
    */
};
