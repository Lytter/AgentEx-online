const request = require('request');
const httpHost = require('./Constants').httpHost;
const constant = require('./Constants');
const http = require('http');
const agent = new http.Agent({
    keepAlive: true,
    maxSockets: 1,
    keepAliveMsecs: 7000
})
module.exports = {
    getImageForTurn: function (gameObject) {
        if (gameObject == "start")
        //return "https://ucarecdn.com/78a37f00-1383-42c4-a4fe-bbf80863c8ef/icons8contract100.png";
            return "https://ucarecdn.com/287d6ec9-4f2e-45a4-b521-f69c3c95b841/start.jpeg"
        if (gameObject == "wait")
            return "https://ucarecdn.com/7a4942a1-fd1a-4671-9bc5-b376ce012302/wait.jpeg";
        if (gameObject == "EOG")
            return "https://ucarecdn.com/6af3a752-f5af-4111-9dbc-56e5a805502e/check.jpeg";
        if (!gameObject) {
            return "https://ucarecdn.com/95f3441b-9170-4429-ac53-e6e8751acf92/kryss.jpeg";
        }
        if (gameObject.hasOwnProperty("currentTurnIndex")) {
            if (gameObject.remainingSignupTime >= 0 && gameObject.humanPlayers < gameObject.maxHumanPlayers)
                return "https://ucarecdn.com/7a4942a1-fd1a-4671-9bc5-b376ce012302/wait.jpeg";
            if (gameObject.gameHasFinished)
                return "https://ucarecdn.com/6af3a752-f5af-4111-9dbc-56e5a805502e/check.jpeg";
            else
                return "https://ucarecdn.com/0400e116-3b82-43d7-9ea4-0fce190fc57d/1.jpeg";
        } else {
            switch (gameObject.id) {
                case 0:
                    return "https://ucarecdn.com/0400e116-3b82-43d7-9ea4-0fce190fc57d/1.jpeg"
                case 1:
                    return "https://ucarecdn.com/e43b99f7-3d1f-4407-87c0-7ab139379b3e/2.jpeg"
                case 2:
                    return "https://ucarecdn.com/44be5e3d-8a83-4931-b50e-65bc183e2449/3.jpeg"
                case 3:
                    return "https://ucarecdn.com/d76607d7-2c55-46d0-9a87-6834f8e570c1/4.jpeg"
                case 4:
                    return "https://ucarecdn.com/3767ad5b-a456-4505-8529-deb06e687f33/5.jpeg"
                case 5:
                    return "https://ucarecdn.com/8145cb3b-a19d-4e5d-9ed5-17039de5e630/6.jpeg"
                case 6:
                    return "https://ucarecdn.com/9c965311-ebda-4fbb-b36a-1bfa94c49594/7.jpeg"
                case 7:
                    return "https://ucarecdn.com/3c280e76-4a12-4f85-83f9-6c1b9420292d/8.jpeg"
                case 8:
                    return "https://ucarecdn.com/80180f70-b08a-445b-a7da-6fe62bfc33ba/9.jpeg"
                case 9:
                    return "https://ucarecdn.com/0ee53a40-b821-4a92-9a84-091835ca2c8e/10.jpeg"
                case 10:
                    return "https://ucarecdn.com/1910d3f0-3ba5-491e-b057-44b5a6408561/11.jpeg"
                case 11:
                    return "https://ucarecdn.com/2c1fe71e-4f8f-4d3e-b901-35d88faf9e1b/12.jpeg"
                case 12:
                    return "https://ucarecdn.com/41a9f0ed-b9b0-40e2-9926-8e01123730a7/13.jpeg"
                case 13:
                    return "https://ucarecdn.com/3dcbdb71-4e1c-415f-850b-08c53b8b909c/14.jpeg"
                case 14:
                    return "https://ucarecdn.com/d60ad54a-99f6-42c0-9109-14e685092908/15.jpeg"
            }
        }
    },
    sendServerRequest: (url, action, callback) => {
        request('http://' + url + '/' + action, callback);
    },
    sendServerRequestWithParams: (url, action, options, callback) => {
        let handleOverload = function () {
            request.post({
                headers: {'content-type': 'application/x-www-form-urlencoded'},
                url: 'http://' + url + '/' + action,
                form: options,
                agent: agent
            }, function (error, serverresponse, body) {
                try {
                    JSON.parse(body);
                    callback(error, serverresponse, body);
                } catch (e) {
                    console.log(e);
                    callback("Wrong format on responce JSON, server is down");
                    handleServerIsDown(options);
                }
            });
        };
        handleOverload();
    },
    getPlayerIndexFromId: (userId, gameObject) => {
        for (let i = 0; i < gameObject.players.length; i++) {
            if (gameObject.players[i].id == userId)
                return i;
        }
    },
    handleServerIsDown: handleServerIsDown,
    removeGameGroup: removeGameGroup
}
function handleServerIsDown(options) {
    let groupId;
    if(options.hasOwnProperty("passWord"))
        groupId = options.passWord;
    else if(options.hasOwnProperty("playerid"))
        groupId = constant.PlayerGroup.get(playerid);
    else if (options.hasOwnProperty("gameid")) {
        let playerid = constant.PlayerOfGames.get(options.gameid)[0];
        groupId = constant.PlayerGroup.get(playerid);
    }
    else if (options.hasOwnProperty("gameId")) {
        let playerid = constant.PlayerOfGames.get(options.gameId)[0];
        groupId = constant.PlayerGroup.get(playerid);
    } else {
        console.log("CANNOT SHUT DOWN SERVER");
        console.log(options)
    }
    console.log("Cleaning up " + groupId);
    let removePlayer = [];
    let removeGame = [];
    for (let player in constant.PlayerGroup) {
        console.log("Cleaning up: " + player);
        if (constant.PlayerGames.get(player))
            removeGame.push(constant.PlayerGames.get(player).toUpperCase());
        removePlayer.push(player);
    }
    removeGameGroup(groupId, removePlayer, removeGame);
}

function removeGameGroup(key, removePlayer, removeGame) {
    console.log(removePlayer)
    console.log(removeGame)
    for (let i = 0; i < removePlayer.length; i++) {
         constant.PlayerGroup.delete(removePlayer[i]);
         constant.PlayerGames.delete(removePlayer[i]);
    }
    for (let i = 0; i < removeGame.length; i++) {
         constant.PlayerGames.delete(removeGame[i]);
         constant.PlayerOfGames.delete(removeGame[i]);
         constant.GameUrls.delete(removeGame[i]);
    }
     constant.GroupSettings.delete(key);
     constant.GroupServer.delete(key);
    constant.store("PlayerGroup");
    constant.store("PlayerGames");
    constant.store("PlayerOfGames");
    constant.store("GameUrls");
    constant.store("GroupServer");
    constant.store("GroupSettings");
}
