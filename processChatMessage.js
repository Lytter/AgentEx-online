const API_AI_TOKEN = 'Dialogflow api-key';
const apiAiClient = require('apiai')(API_AI_TOKEN);

const sendServerRequestWithParams = require("./utils").sendServerRequestWithParams;
const constant = require("./Constants");
const common = require("./common");
const utils = require("./utils");

function processMessage(senderId, message, game, server, password) {

    updateGroupAndUserKnowledge(server, senderId, password, game.id, message, function (error, body) {
        if (!error) {
            let game = JSON.parse(body);
            for (let i = 0; i < game.players.length; i++) {
                let user = game.players[i];
                if (!user.human)
                    if (user.speaker) {
                        console.log("updateGroupAndUserKnowledge");
                        registerChatMessage(server, user.id, password, game.id, user.optimalStockSize, function (error, body, senderId,) {
                            if (!error) {
                                let game = JSON.parse(body);
                                setTimeout(function () {
                                    constant.SOCKET_IO.emit("Server_Chat_Message", {game: game});
                                }, game.players[utils.getPlayerIndexFromId(senderId, game)].typingSkill * 1000);
                            } else {
                                console.log("Exception thrown in processChatMessage!!");
                                console.log(error);
                            }
                        });
                    }
            }
        } else {
            console.log("Exception thrown in updateGroupAndUserKnowledge!!");
            console.log(error);
        }
    });
}

function processChatMessage(event, callback) {
    console.log('Handle send chat');
    const senderId = event.sender.id || event.sender;
    const value = event.postback.payload.value;
    const payload = event.postback.payload.action || event.postback.payload;
    const gameid = constant.PlayerGames.get(senderId) || event.postback.payload.gameid;
    const serverId = event.postback.payload.server;

    if (payload === "SEND_CHAT") {
        let server = gameid ? constant.GameUrls.get(gameid.toUpperCase()) : serverId;
        let password = constant.PlayerGroup.get(senderId) ? constant.PlayerGroup.get(senderId) : event.postback.payload.password;
        if (!server) {
            console.log("You are not registred as a player in any game I manage!");
            return;
        }
        registerChatMessage(server, senderId, password, gameid, value, function (error, body, senderId) {
            if (!error) {
                let game = JSON.parse(body);
                processMessage(senderId, value, game, server, password);
                callback(null, game, senderId);
            } else {
                console.log("Exception thrown in processChatMessage!");
                console.log(error);
                callback(error);
            }
        });
    }
}

function updateGroupAndUserKnowledge(server, senderId, password, gameid, value, callback) {
    sendServerRequestWithParams(server, 'updateGroupAndUserKnowledge', {
        playerid: senderId,
        passWord: password,
        gameId: gameid,
        knowledge: value
    }, function (error, serverresponse, body) {
        callback(error, body, senderId)
    });
}

function registerChatMessage(server, senderId, password, gameid, value, callback) {
    console.log("*registerChatMessage*");
    sendServerRequestWithParams(server, 'registerChatMessage', {
        playerid: senderId,
        passWord: password,
        gameId: gameid,
        chatmessage: value
    }, function (error, serverresponse, body) {
        callback(error, body, senderId)
    });
}

function calculateBeliefOfPoolSize(user) {
    //om större eller mindre
    //om belief i egen är hög/låg

}

module.exports = {
    processChatMessage: processChatMessage,
    registerChatMessage: registerChatMessage
}
