const FACEBOOK_ACCESS_TOKEN = 'FB ACCESS TOKEN';


const request = require('request-promise');
const constant = require("./Constants");
const getImageForTurn = require('./utils').getImageForTurn;

//uploadFiles();
//{ attachment_id: '558928994629913' }
function uploadFiles() {
    console.log("UPLOADING FILES");
    request({
        url: 'https://graph.facebook.com/v2.6/me/message_attachments',
        qs: {access_token: FACEBOOK_ACCESS_TOKEN},
        method: 'POST',
        json: {
            message: {
                attachment: {
                    type: "image",
                    payload: {
                        "is_reusable": true,
                        "url": "https://ucarecdn.com/8a0cf621-4132-443c-97a3-35fb9130b9a4/kryss.png"
                    }
                }
            },
        },
    })
        //.then(function (body) {
        //    console.log(body);
        //})
        //.on('response', function (res) {
        //    console.log(res);
        //})
        .catch(function (err) {
            console.log("Somethig went very bad!")
            console.log(senderId);
        });
}

function andreasMenu(text, type, imageUrl, url, urlAdmin) {
    return {
        template_type: "generic",
        elements: [
            {
                title: text,
                image_url: imageUrl,
                buttons: [{
                    type: "web_url",
                    url: url,
                    title: type == "options" ? "Leave consent" : "View game status",
                    webview_height_ratio: "full", //compact/tall/full
                    messenger_extensions: true
                },
                    {
                        type: "web_url",
                        url: urlAdmin,
                        title: "Setup group",
                        webview_height_ratio: "full", //compact/tall/full
                        messenger_extensions: true
                    }]
            }
        ]
    }
}



function ordinaryMenu(text, type, imageUrl, url) {
    return {
        "template_type": "generic",
        "elements": [
            {
            "title": text,
            //"subtitle": "Tap a button to answer.",
            "image_url": imageUrl,
            buttons: [{
                type: "web_url",
                url: url,
                title: type == "options" ? "Leave consent" : "View game status",
                webview_height_ratio: "full", //compact/tall/full
                messenger_extensions: true
            }]
        }]
    }
}

function ordinaryMenu_(text, type, url) {
    return {
        template_type: "button",
        text: text,
        buttons: [{
            type: "web_url",
            url: url,
            title: type == "options" ? "Leave consent" : "View game status",
            webview_height_ratio: "full", //compact/tall/full
            messenger_extensions: true
        }]
    }
}

const openWebView = (httpHost, senderId, text, type, gameObject) => {
    let resourceOut = 0;
    let resources_in = 0;
    let graph = 0;
    let gameHasEnded = "NO";
    let gameTurn = 1;
    let hasSubmittedConfidence = "NO";
    console.log("Sender: " + senderId);
    if (gameObject) {
        if (gameObject.hasOwnProperty("resoutcesOut")) {
            console.log("IT IS A GAMETURN");
            resourceOut = gameObject.resoutcesOut;
            resources_in = gameObject.resources_in;
            graph = gameObject.yieldsGraph;
            gameTurn = gameObject.id + 1;
            let array = gameObject.conficenceInOptimalStockSize;
            for (let i = 0; i < array.length; i++) {
                if(array[i].playerid == senderId)
                    hasSubmittedConfidence = "YES"
            }
        } else {
            console.log("IT IS A GAME");
            resources_in = gameObject.gameTurns[gameObject.currentTurnIndex].resources_in;
            graph = gameObject.totalExtractionGraph || 0;
            gameHasEnded = gameObject.gameHasFinished ? "YES" : "NO";
            let array = gameObject.gameTurns[gameObject.currentTurnIndex].conficenceInOptimalStockSize;
            for (let i = 0; i < array.length; i++) {
                if(array[i].playerid == senderId)
                    hasSubmittedConfidence = "YES"
            }
        }
        console.log("hasSubmittedConfidence: " + hasSubmittedConfidence);
    }

    let url = "https://" + constant.httpHost + "/" + type + "?senderId=" + senderId + (gameObject ? "&currentResources=" + resources_in : "")
        + (gameObject ? "&graph=" + graph : "")
        + (gameObject ? "&gameHasEnded=" + gameHasEnded : "")
        //+ (gameObject ? "&previousResources=" + resources_in : "")
        + (gameObject ? "&turn=" + gameTurn : "")
        + (gameObject ? "&hasSubmittedConfidence=" + hasSubmittedConfidence : "");

    let urlAdmin = "https://" + constant.httpHost + "/createGames?senderId=" + senderId;

    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: FACEBOOK_ACCESS_TOKEN},
        method: 'POST',
        json: {
            recipient: {id: senderId},
            message: {
                attachment: {
                    type: "template",
                    payload: type == "options" ? (senderId == "2179476705443686") ? andreasMenu(text, type, getImageForTurn("start"), url, urlAdmin) : ordinaryMenu(text, type, getImageForTurn("start"), url) : ordinaryMenu(text, type, getImageForTurn(gameObject), url)
                }
            },
        }
    }).catch(function (err) {
        console.log("Somethig went very bad!")
        console.log(err);
        console.log(senderId);
    });
};

const sendThinking = (senderId) => {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: FACEBOOK_ACCESS_TOKEN},
        method: 'POST',
        json: {
            "recipient":{
                "id":senderId
            },
            "sender_action":"typing_on"
        },
    });
}

const sendTextWithImage = (senderId, imageUrl, text, subtext) => {

    console.log("SENDING");

    let message = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [{
                    "title": text,
                    "image_url": imageUrl,
                }]
            }
        }
    }
    if(subtext)
        message.attachment.payload.elements[0].subtitle = subtext;

    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: FACEBOOK_ACCESS_TOKEN},
        method: 'POST',
        json: {
            recipient: {id: senderId},
            message: message
            },
    });
};

const sendTextWithImageAndButtons = (senderId, image, buttons, text, subtext) => {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: FACEBOOK_ACCESS_TOKEN},
        method: 'POST',
        json: {
            recipient: {id: senderId},
            message: {
                "attachment": {
                    "type": "template",
                    "payload": {
                        "template_type": "generic",
                        "elements": [
                            {
                                "image_url": image,
                                "title": text,
                                "subtitle": subtext,
                                "buttons": buttons
                            },
                        ]
                    }
                }
            },
        }
    });
};

const sendTextMessage = (senderId, text) => {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: FACEBOOK_ACCESS_TOKEN},
        method: 'POST',
        json: {
            recipient: {id: senderId},
            message: {text},
        }
    });
};



//FUNKAR INTE
const sendImage = (senderId, imageUrl, text) => {

    console.log("SENDING");

    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: FACEBOOK_ACCESS_TOKEN},
        method: 'POST',
        json: {
            recipient: {id: senderId},
            message: {
                "attachment": {
                    "type": "image",
                    "payload": {
                        "url": imageUrl,
                        "is_reusable": true,
                    }
                }
            },
        }
    })
        .then(function (parsedBody) {
            print(parsedBody);
        });
};


module.exports = {
    sendTextMessage: sendTextMessage,
    sendImage: sendImage,
    sendTextWithImage: sendTextWithImage,
    sendTextWithImageAndButtons: sendTextWithImageAndButtons,
    openWebView: openWebView,
    sendThinking: sendThinking
}
