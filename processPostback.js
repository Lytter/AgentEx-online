const API_AI_TOKEN = 'Dialogflow api_token';
const apiAiClient = require('apiai')(API_AI_TOKEN);
const FACEBOOK_ACCESS_TOKEN = 'FB Access-Token';
const request = require('request');
const sendTextMessage = require('./common').sendTextMessage;
const sendImage = require('./common').sendImage;
const openWebView = require('./common').openWebView;
const sendTextWithImage = require('./common').sendTextWithImage;
const sendTextWithButtons = require('./common').sendTextWithButtons;
const serverFunctions = require('./serverFunctions');
const getImageForTurn = require('./utils').getImageForTurn;
const constant = require("./Constants");
const sendThinking = require("./common").sendThinking;

//ngrok help: https://stackoverflow.com/questions/25522360/ngrok-configure-multiple-port-in-same-domain
//start ngrok: ngrok start --all


module.exports = {
    processPostback: function (event) {
        console.log("----------------HANDLE POSTBACK--------------------");
        const senderId = event.sender.id || event.sender;
        const payload = event.postback.payload.action || event.postback.payload;
        const value = event.postback.payload.value;
        console.log("------------ " + payload +" ------------" )

        if (payload == "test")
            if (constant.PlayerGames.get(senderId)) {
                serverFunctions.getGame(senderId, "Welcome back! You are already registred in an ongoing game.", function (err, text, gameObject) {
                    if (gameObject) {
                        if (gameObject.currentTurnIndex == 0)
                            openWebView(constant.httpHost, senderId, text, "gameStatus", gameObject);
                        else
                            openWebView(constant.httpHost, senderId, text, "gameStatus", gameObject.gameTurns[gameObject.currentTurnIndex]);
                    } else {
                        sendTextWithImage(senderId, getImageForTurn(null), err);
                    }
                });
            } else {
                openWebView(constant.httpHost, senderId, constant.instructions, "options");
            }

        //sendTextWithButtons(senderId, instructions_buttons, instructions);
        if (payload == 'SHOW_AVAILABLE_GAMES') {
            console.log("----------------SHOW_AVAILABLE_GAMES--------------------");
            let orininalPW = constant.PlayerGroup.get(senderId);
            constant.PlayerGroup.set(senderId, value);
            constant.store("PlayerGroup");
            //First try to add player to existing game
            serverFunctions.addPlayerToAGame(senderId, "LookingForGroup", function (err, text, subtext, gameid, gameObject) {
                if (err) {
                    if (err.message.status == 404) { //group id not found on server, set it up again
                        serverFunctions.createNewGameGroup(senderId, constant.GroupSettings.get(constant.PlayerGroup.get(senderId)), "YES");
                        sendTextWithImage(senderId, getImageForTurn(null),"There was a problem with your game", "Please try again.")
                        return;
                    }
                    if (err.message.status != 507) { //No open games
                        console.log("----------------ERROR !507--------------------");
                        if (orininalPW) {
                            constant.PlayerGroup.set(senderId, orininalPW);
                            constant.store("PlayerGroup");
                        }
                        let message = " ";
                        let subMessage = " ";
                        if (err.message.hasOwnProperty('message')) {
                            let doDevide = err.message.message.indexOf('.') >= 0;
                            if (doDevide) {
                                message = err.message.message.substring(0, err.message.message.indexOf('.') + 1);
                                subMessage = err.message.message.substring(err.message.message.indexOf('.') + 1);
                            } else
                                message = err.message.message;
                        }
                        else if(err.hasOwnProperty('submessage')) {
                            message = err.message;
                            submessage = err.submessage;
                        }
                        sendTextWithImage(senderId, getImageForTurn(null), message, subMessage);
                        return;
                    }
                    //Then try to start a new game
                    serverFunctions.startAGame(senderId, null, function (err, text, gameid) {
                        console.log("----------------NEW GAME STARTED--------------------");
                        if (gameid) {
                            //add player to that game and start round one
                            serverFunctions.addPlayerToAGame(senderId, gameid, function (err, text, subtext, gameid, gameObject) {
                                console.log("----------------PLAYER ADDED TO NEW GAME-------------------");
                                if (text) {
                                    sendTextWithImage(senderId, getImageForTurn(gameObject), text, subtext);
                                }
                                else {
                                    console.log(err)
                                    sendTextWithImage(senderId, getImageForTurn(null), err.message, err.submessage);
                                }
                            });
                        } else {
                            console.log(err)
                            if(err.hasOwnProperty('message') && err.hasOwnProperty('submessage'))
                                sendTextWithImage(senderId, getImageForTurn(null), err.message, err.submessage);
                            else
                                sendTextWithImage(senderId, getImageForTurn(null), err);
                        }
                    });
                } else {
                    console.log("----------------PLAYER ADDED TO EXISTING GAME--------------------");
                    //openWebView(constant.httpHost, senderId, text, "gameStatus", gameObject);
                    sendTextWithImage(senderId, getImageForTurn(gameObject), text, subtext);
                }
            });
        }
        //sendTextWithButtons(senderId, games_buttons, games_intro_text);
        if (payload == 'END_SESSION')
            sendTextWithImage(senderId, getImageForTurn(null), "Thanks for your interrest in this study.", "Participation require your consent");

        if (payload == 'ADVANCE_TURN') {
            console.log('Advancing turn!');
            serverFunctions.withdrawResources(senderId, value, function (err, text, gameObject) {
                if (text)
                    openWebView(constant.httpHost, senderId, text, "gameStatus", gameObject);
                else
                    sendTextWithImage(senderId, getImageForTurn(null), err);
            });
        }
        if (payload == "REGISTER_CONFIDENCE") {
            console.log("REGISTER_CONFIDENCE")
            console.log(value)
            serverFunctions.registerConfidence(senderId, value, function (err, text, gameObject) {
                if (err)
                    console.log(err);
            });
        }
        if (payload == 'HANDLE_ADMIN') {
            serverFunctions.createNewGameGroup(senderId, value);
        }
    }
};
