let GameUrls = new Map(); //gameId : url
let PlayerGames = new Map(); //playerId : current game
let PlayerOfGames = new Map(); //gameId : [list of players]
let PlayerGroup = new Map(); //playerId: group(or passWord)
let GroupServer = new Map(); //GroupID: www.hhh.se
let GroupSettings = new Map(); //GroupId: {properties...}
let SOCKET_IO;
const admin = require('firebase-admin');
admin.initializeApp({
    credential: admin.credential.cert(require('./views/js/crp-lytter-firebase-adminsdk-a48pn-ac2989e583.json')),
    databaseURL: 'https://crp-lytter.firebaseio.com/'
});

const httpHost = "";//process.argv[3] || "SET_THIS_ON_START (This server)"; //sätts när jag skapar en grupp
const br = " \u000A";
const instructions = 'Before you start the experiment you need to accept the terms for this study.';


function store(constant) {

    console.log("*****************STORE************************");
    let db = admin.database();
    let serverRef = db.ref("data");

    if (constant == "GroupSettings") {
        serverRef.update({
            GroupSettings: mapToObject(GroupSettings),
        });
    } else if (constant == "GroupServer") {
        serverRef.update({
            GroupServer: mapToObject(GroupServer),
        });
    } else if (constant == "PlayerGroup") {
        console.log(PlayerGroup);
        console.log(mapToObject(PlayerGroup))
        serverRef.update({
            PlayerGroup: mapToObject(PlayerGroup),
        });
        console.log(PlayerGroup);
    } else if (constant == "PlayerOfGames") {
        serverRef.update({
            PlayerOfGames: mapToObject(PlayerOfGames),
        });
        console.log(PlayerOfGames);
    } else if (constant == "PlayerGames") {
        serverRef.update({
            PlayerGames: mapToObject(PlayerGames),
        });
        console.log(PlayerGames);
    } else if (constant == "GameUrls") {
        serverRef.update({
            GameUrls: mapToObject(GameUrls),
        });
        console.log(GameUrls);
    }
}

function mapToObject(map) {
    let result = {};
    let keys = map.keys();
    let done = false;
    do {
        let key = keys.next();
        if(key.value) {
            result[key.value] = map.get(key.value);
            console.log(result);
        }
        done = key.done;
    }while(!done);
    return result;
}

function load() {

    let db = admin.database();
    let serverRef = db.ref("data");
    serverRef.child("GroupSettings").on('child_added', function (snapshot) {
        if (snapshot.exists()) {
            GroupSettings.set(snapshot.key, snapshot.val())
        }
    });
    serverRef.child("GroupServer").on('child_added', function (snapshot) {
        if (snapshot.exists()) {
            GroupServer.set(snapshot.key, snapshot.val());
        }
    });
    serverRef.child("PlayerGroup").on('child_added', function (snapshot) {
        if (snapshot.exists()) {
            PlayerGroup.set(snapshot.key, snapshot.val());
        }
    });
    serverRef.child("PlayerOfGames").on('child_added', function (snapshot) {
        if (snapshot.exists()) {
            PlayerOfGames.set(snapshot.key, snapshot.val());
        }
    });
    serverRef.child("PlayerGames").on('child_added', function (snapshot) {
        if (snapshot.exists()) {
            PlayerGames.set(snapshot.key, snapshot.val());
        }
    });
    serverRef.child("GameUrls").on('child_added', function (snapshot) {
        if (snapshot.exists()) {
            GameUrls.set(snapshot.key, snapshot.val());
        }
    });
    serverRef.child("GroupSettings").on('child_removed', function (snapshot) {
        GroupSettings.delete(snapshot.key);
    });
    serverRef.child("GroupServer").on('child_removed', function (snapshot) {
        GroupServer.delete(snapshot.key);
    });
    serverRef.child("PlayerGroup").on('child_removed', function (snapshot) {
        PlayerGroup.delete(snapshot.key);
    });
    serverRef.child("PlayerOfGames").on('child_removed', function (snapshot) {
        PlayerOfGames.delete(snapshot.key);
    });
    serverRef.child("PlayerGames").on('child_removed', function (snapshot) {
        PlayerGames.delete(snapshot.key);
    });
    serverRef.child("GameUrls").on('child_removed', function (snapshot) {
        GameUrls.delete(snapshot.key);
    });
    console.log("*****************LOAD************************");
}

module.exports = {
    GameUrls,
    PlayerGames,
    PlayerOfGames,
    PlayerGroup,
    GroupServer,
    GroupSettings,
    httpHost,
    br,
    instructions,
    SOCKET_IO,
    load,
    store
};