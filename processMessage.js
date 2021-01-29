const API_AI_TOKEN = 'Dialogflow api token';
const apiAiClient = require('apiai')(API_AI_TOKEN);
const FACEBOOK_ACCESS_TOKEN = 'FB access token';
const request = require('request');
const sendTextMessage = require('./common').sendTextMessage;
const sendImage = require('./common').sendImage;
const sendTextWithImage = require('./common').sendTextWithImage;
const serverFunctions = require('./serverFunctions');
const processPostback = require('./processPostback').processPostback;
const openWebView = require('./common').openWebView;

const constant = require("./Constants");

const sendServerRequestWithParams = require("./utils").sendServerRequestWithParams;




module.exports = {
    processMessage: function (event) {
        console.log('Handle event');
        const senderId = event.sender.id;
        const message = event.message.text;
        console.log(event);
        const apiaiSession = apiAiClient.textRequest(message, {sessionId: 'cpr_lytter_bot'});
        apiaiSession.on('response', (response) => {
            const result = response.result.fulfillment.speech;
            console.log(result);
            if (result)
                sendTextMessage(senderId, result);

            if(response.result && response.result.action == "GET_STARTED") {
                if (constant.PlayerGames.get(senderId)) {
                    serverFunctions.getGame(senderId, "Welcome back! You are already registred in an ongoing game.",function (err, text, gameObject) {
                        //LÄGG TILL SPELET I LISTA OCH HANTERA SERVER MED MERA
                        if (gameObject) {
                            if (gameObject.currentTurnIndex == 0)
                                openWebView(constant.httpHost, senderId, text, "gameStatus", gameObject);
                            else
                                openWebView(constant.httpHost, senderId, text, "gameStatus", gameObject.gameTurns[gameObject.currentTurnIndex]);
                        } else {
                            sendTextMessage(senderId, err);
                        }
                    });
                } else {
                    openWebView(constant.httpHost, senderId, constant.instructions, "options");
                }
            }


            if (response.result && response.result.action === 'HELP') {
                let gameid = constant.PlayerGames.get(senderId);
                let server;
                server = gameid ? GameUrls.get(gameid.toUpperCase()) : null;
                if (!server) {
                    sendTextMessage(senderId, "You are not registred as a player in any game I manage! \n\n" +
                        "If you have a GameID, please tell me that you want me to add you to the game.\n\n" +
                        "If you do not have a GameId, please contact your Game administrator to get one.");
                return;
                }
                //Ta reda på status för spelaren och kommunicera tillbaka
                sendServerRequestWithParams(server, 'gameStatus', {
                    playerid: senderId
                }, function (error, serverresponse, body) {
                    if (!error) {
                        try {
                            let BODY = JSON.parse(body);
                            if (BODY.status == 200) {
                                sendTextMessage(senderId, "You are connected to a game with ID: " + BODY.id
                                + "\nTo proceed to the next turn, please register your yield for this turn.");
                            } else
                                sendTextMessage(senderId, BODY.message);
                        } catch (e) {
                            sendTextMessage(senderId, "I cannot find a suitable server, at " + server);
                        }
                    } else {
                        sendTextMessage(senderId, 'The server at: ' + server + ' does not respond ' +
                            '\n\nPlease contact your administrator and check that the server is running');
                    }
                });
            }


        });
        apiaiSession.on('error', error => console.log(error));
        apiaiSession.end();
    }
}
