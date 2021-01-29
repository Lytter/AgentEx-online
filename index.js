const resetServer = require ("./serverFunctions").resetServer;

const processMessage = require('./processMessage').processMessage;
const processPostback = require('./processPostback').processPostback;
const processChatMessage = require('./processChatMessage').processChatMessage;
const serverBatch = require('./serverBatch');
const serverFunctions = require('./serverFunctions');
const sendTextWithImageAndButtons = require('./common').sendTextWithImageAndButtons;
const openWebView = require('./common').openWebView;
const common = require('./common');
const getImageForTurn = require('./utils').getImageForTurn;

const express = require('express');
const bodyParser = require('body-parser');
const constant = require("./Constants");
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));


const PORT = process.env.PORT || 3000;
console.log(PORT)

constant.SOCKET_IO = require('socket.io').listen(app.listen(PORT, () => console.log('Webhook server is listening, port ${PORT}')));
app.use(express.static('views'));



constant.SOCKET_IO.sockets.on("connection",function(socket){
    socket.on("New_Chat_Message", function (data) {
        processChatMessage({
            sender: data.senderId,
            postback: {
                payload: {
                    action: 'SEND_CHAT',
                    value: data.message
                }
            }
        }, function(err, game) {
            if(game) {
                socket.broadcast.emit("Server_Chat_Message", {game: game});
            }
        });
    });

    socket.on("Need_Messages", function (data) {
        processChatMessage({
            sender: data.senderId,
            postback: {
                payload: {
                    action: 'GET_CHAT',
                }
            }
        }, function(err, game) {
            if(game) {
                data.callback({game: game}); //spara en på clienten och kolla om den innehåller färre
            }
        });
    });

    socket.on("Register_Confidence", function (data) {
        console.log("GOT RESULT Confidence");
        processPostback({
            sender: data.senderId,
            postback: {
                payload: {
                    action: 'REGISTER_CONFIDENCE',
                    value: data.assessment
                }
            }
        });
    });
    socket.on("Register_Yield", function (body) {
        console.log("GOT RESULT Yield");
        processPostback({
            sender: body.senderId,
            postback: {
                payload: {
                    action: body.yield >= 0 ? 'ADVANCE_TURN' : 'COMMUNICATE',
                    value: body.yield
                }
            }
        });
    });

    socket.on("Register_Consent", function (body) {
        console.log("----------------REGISTER CONCENT--------------------");
        console.log("------- "+ body.senderId +" --------");
        processPostback({
            sender: body.senderId,
            postback: {
                payload: {
                    action: body.answer == "Yes" ? 'SHOW_AVAILABLE_GAMES' : 'END_SESSION',
                    value: body.password
                }
            }
        });
    });

    socket.on("Register_New_Group", function (body) {
        console.log("GOT RESULT New Group");
        if(!constant.GroupSettings.get(body.groupname))
            processPostback({
                sender: body.senderId,
                postback: {
                    payload: {
                        action: 'HANDLE_ADMIN',
                        value: {
                            groupname: body.groupname,
                            java_server: body.java_server,
                            path_to_result: body.path_to_result,
                            netlogo_model: body.netlogo_model,
                            netlogo_world: body.netlogo_world,
                            survey: body.survey,
                            valid_until: body.valid_until,
                            max_humans: body.max_humans,
                            grace: body.grace
                        },
                    }
                }
            });
        else {
            common.sendTextWithImage(body.senderId, getImageForTurn(null),"Group: " + body.groupname + " already exists!", "Please, choose a different name")
        }
    });

});




constant.load();
setTimeout(function() {
    serverBatch.batchGameGroups();
    //serverBatch.batchTurns();
}, 1000);







// set the view engine to ejs
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');

app.post('/getGame', (req, res) => {
    let body = req.body;
    if (constant.PlayerOfGames.get(body.gameId.toUpperCase()) && constant.PlayerOfGames.get(body.gameId.toUpperCase()).length > 0) {
        serverFunctions.getGame(constant.PlayerOfGames.get(body.gameId.toUpperCase())[0], "Get game for chat.",function (err, text, gameObject) {
            if (gameObject) {
                res.status(200).json({game: gameObject});
            } else {
                console.log(err);
                res.status(500).send({error: err});
            }
        });
    } else {
        res.status(500).send({error: "No active games"});
    }
});

app.get('/optionspostback', (req, res) => {
    console.log("GOT RESULT");
    let body = req.query;
    //Måste ha tag på sender ID, kolla på
    //https://blog.messengerdevelopers.com/using-the-webview-to-create-richer-bot-to-user-interactions-ed8a789523c6
    processPostback({
        sender: body.senderId,
        postback: {
            payload: {
                action: body.answer == "Yes" ? 'SHOW_AVAILABLE_GAMES' : 'END_SESSION',
                value: body.password
            }
        }
    });
    /*
    const senderId = event.sender.id;
        const payload = event.postback.payload;
     */
    //res.status(200).send('Please close this window to return to the conversation thread.');
    //callSendAPI(body.psid, response);
});


app.get('/gameStatuspostback', (req, res) => {
    console.log("GOT RESULT GAME STATUS");
    let body = req.query;
    processPostback({
        sender: body.senderId,
        postback: {
            payload: {
                action: body.yield >= 0 ? 'ADVANCE_TURN' : 'COMMUNICATE',
                value: body.yield
            }
        }
    });
});

app.get('/gameStatus', (req, res) => {

    let gameName = constant.PlayerGames.get(req.query.senderId);
    let currentResources = req.query.currentResources;
    //let previousResources = req.query.previosResources;
    let graph = req.query.graph;
    let gameHasEnded = req.query.gameHasEnded;
    let turn = req.query.turn;
    let hasSubmittedConfidence = req.query.hasSubmittedConfidence || "NO";
    console.log("IN-DATA FOR PAGE")
    let options = {
        gameName: gameName,
        currentAmount: currentResources,
        senderId: req.query.senderId,
        graph: graph,
        gameHasEnded: gameHasEnded,
        //previousAmount: previousResources,
        turn: turn,
        gameId: constant.PlayerGames.get(req.query.senderId),
        hasSubmittedConfidence: hasSubmittedConfidence
    }

    res.render('public/gameStatus.html', options);
});

app.get('/gameHasStarted', (req, res) => {
    console.log("___________________________");
    console.log(req.query.gameId);
    let gameId = req.query.gameId;
    console.log("___________________________");
    //hämta spelet som det är just nu
    //meddela alla klienter att det är klart att spela

    //its a race condition so delay this a sec or two

    setTimeout(function(){
        if (constant.PlayerOfGames.get(gameId.toUpperCase()) && constant.PlayerOfGames.get(gameId.toUpperCase()).length > 0) {
            serverFunctions.getGame(constant.PlayerOfGames.get(gameId.toUpperCase())[0], "Your game is now filled with players and ready to start.",function (err, text, gameObject) {
                if (gameObject) {
                    constant.PlayerOfGames.get(gameId.toUpperCase()).forEach(function(playerID) {
                        console.log("READY TO START, " + playerID);
                        openWebView(constant.httpHost, playerID, text, "gameStatus", gameObject);
                    });
                    serverFunctions.initiateAgentCommunication(constant.PlayerOfGames.get(gameId.toUpperCase())[0]);
                } else {
                    //skiter det sig här så får spelarna inte veta detta, tveksamt kanske
                    console.log(err);
                    console.log(gameObject);
                    console.log(text);
                }
            });

        }
    }, 1000);

    res.render('public/blank.html', {
        senderId: "blank"
    });

});

app.get('/EndOfTurn', (req, res) => {
    console.log("__________EOT_________________");
    console.log(req.query.gameId);
    let gameId = req.query.gameId;
    console.log("___________________________");
    setTimeout(function(){
        if (constant.PlayerOfGames.get(gameId.toUpperCase()) && constant.PlayerOfGames.get(gameId.toUpperCase()).length > 0) {
            serverFunctions.getGame(constant.PlayerOfGames.get(gameId.toUpperCase())[0], "Your current game has advanced one turn\n",function (err, text, gameObject) {
                console.log(gameObject)
                if (gameObject) {
                    if (constant.PlayerOfGames.get(gameId.toUpperCase())) {
                        serverFunctions.initiateAgentCommunication(constant.PlayerOfGames.get(gameId.toUpperCase())[0]);
                        constant.PlayerOfGames.get(gameId.toUpperCase()).forEach(function (playerID) {
                            console.log('__________________________')
                            console.log(gameObject)
                            console.log('==========================')
                            openWebView(constant.httpHost, playerID, text, "gameStatus", gameObject.gameTurns[gameObject.currentTurnIndex]);
                        });
                    }
                } else {
                    //skiter det sig här så får spelarna inte veta detta, tveksamt kanske
                    console.log(err);
                    console.log(gameObject);
                    console.log(text);
                }
            });

        }
    }, 1000);

    res.render('public/blank.html', {
        senderId: "blank"
    });

});

app.get('/EndOfGame', (req, res) => {
    console.log("__________EOG_________________");
    console.log(req.query.gameId);
    let gameId = req.query.gameId;
    console.log("___________________________");
    setTimeout(function(){
        if (constant.PlayerOfGames.get(gameId.toUpperCase()) && constant.PlayerOfGames.get(gameId.toUpperCase()).length > 0) {
            serverFunctions.getGame(constant.PlayerOfGames.get(gameId.toUpperCase())[0], "Your game has ended",function (err, text, gameObject) {
                let playerArray = constant.PlayerOfGames.get(gameId.toUpperCase());
                console.log(playerArray);
                if (playerArray) {
                    for (const playerID of playerArray) {
                        console.log(playerID);
                        let buttons = [{
                            type: "web_url",
                            url: constant.GroupSettings.get(constant.PlayerGroup.get(playerID)).survey,
                            title: "To survey",
                            webview_height_ratio: "full", //compact/tall/full
                            messenger_extensions: false
                        }];
                        sendTextWithImageAndButtons(playerID, getImageForTurn("EOG"), buttons,
                            "Your game has finished, thank you for your participation", "Now take our post-game survey!");
                        //(senderId, image, buttons, text, subtext)
                         constant.PlayerGames.delete(playerID);
                         constant.PlayerGroup.delete(playerID);
                        constant.store("PlayerGames");
                        constant.store("PlayerGroup");
                    }
                }
                constant.PlayerOfGames.delete(gameId.toUpperCase());
                constant.GameUrls.delete(gameId.toUpperCase());
                constant.store("PlayerOfGames");
                constant.store("GameUrls");
            });
        } else {
            //skiter det sig här så får spelarna inte veta detta, tveksamt kanske
            console.log("------- VÄRT ATT KOLLA PÅ!!")
            console.log(constant.PlayerOfGames.get(gameId.toUpperCase()));
            console.log(constant.PlayerOfGames.get(gameId.toUpperCase()).length)
        }
    }, 1000);

    res.render('public/blank.html', {
        senderId: "blank"
    });

});

app.get('/createGames', (req, res) => {
    console.log(req.query.senderId);
    let host = req.get('host')
    constant.httpHost = host;
    res.render('public/admin.html', {
        senderId: req.query.senderId
    });
});
app.get('/creategamepostback', (req, res) => {
    console.log("GOT RESULT ADMIN");
    let body = req.query;
    processPostback({
        sender: body.senderId,
        postback: {
            payload: {
                action: 'HANDLE_ADMIN',
                value: {
                    groupname: body.groupname,
                    java_server: body.java_server,
                    path_to_result: body.path_to_result,
                    netlogo_model: body.netlogo_model,
                    survey: body.survey,
                    valid_until: body.valid_until,
                    max_humans: body.max_humans,
                    grace: body.grace
                },
            }
        }
    });
});
app.get('/options', (req, res) => {
    let host = req.get('host')
    constant.httpHost = host;
    res.render('public/options.html', {
        senderId: req.query.senderId
    });




    /*
    let referer = req.get('Referer');
    if (referer) {
        if (referer.indexOf('www.messenger.com') >= 0) {
            res.setHeader('X-Frame-Options', 'ALLOW-FROM https://www.messenger.com/');
        } else if (referer.indexOf('www.facebook.com') >= 0) {
            res.setHeader('X-Frame-Options', 'ALLOW-FROM https://www.facebook.com/');
        }
        res.sendFile('public/options.html', {root: __dirname});
    }
    */
});


app.get('/', (req, res) => {
    res
        .status(200)
        .send('Hello, world!')
        .end();
});

// Creates the endpoint for our webhook 
app.post('/webhook', (req, res) => {

    let host = req.get('host')
    constant.httpHost = host;

    let body = req.body;

    // Checks this is an event from a page subscription
    if (body.object === 'page') {

        // Iterates over each entry - there may be multiple if batched
        body.entry.forEach(function (entry) {

            // Gets the message. entry.messaging is an array, but
            // will only ever contain one message, so we get index 0
            //let webhook_event = entry.messaging[0];
            console.log('New message!');
            entry.messaging.forEach(event => {
                if(event.postback && event.postback.payload) {
                    console.log('Got postback: ' + event.postback.title);
                    processPostback(event);
                }
                if (event.message && event.message.text) {
                    console.log('Got message: ' + event.message.text);
                    processMessage(event);
                }
            });
        });

        // Returns a '200 OK' response to all requests
        res.status(200).send('EVENT_RECEIVED');
    } else {
        // Returns a '404 Not Found' if event is not from a page subscription
        res.sendStatus(404);
    }

});

// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {

    // Your verify token. Should be a random string.
    let VERIFY_TOKEN = 'cpr_lytter';

    // Parse the query params
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    // Checks if a token and mode is in the query string of the request
    if (mode && token) {

        // Checks the mode and token sent is correct
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {

            // Responds with the challenge token from the request
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);

        } else {
            // Responds with '403 Forbidden' if verify tokens do not match
            res.sendStatus(403);
        }
    }
});



