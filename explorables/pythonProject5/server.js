const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 3000 });
let players = {};
let playerCount = 0;

wss.on("connection", (ws) => {
    if (playerCount >= 2) {
        ws.close();
        return;
    }

    const playerId = playerCount++;
    players[playerId] = {
        ws,
        x: playerId === 0 ? 100 : 300,
        y: playerId === 0 ? 100 : 200,
        isIt: playerId === 1
    };

    ws.send(JSON.stringify({ type: "assign", id: playerId, isIt: players[playerId].isIt }));

    if (playerCount === 2) {
        broadcastGameState();
    }

    ws.on("message", (message) => {
        const data = JSON.parse(message);

        if (data.type === "move") {
            if (players[data.player.id]) {
                players[data.player.id].x = data.player.x;
                players[data.player.id].y = data.player.y;
            }
        }

        if (data.type === "tag") {
            if (players[0].isIt && playersCollide(players[0], players[1])) {
                players[0].isIt = false;
                players[1].isIt = true;
                broadcast({ type: "tag", isIt: false });
            } else if (players[1].isIt && playersCollide(players[1], players[0])) {
                players[1].isIt = false;
                players[0].isIt = true;
                broadcast({ type: "tag", isIt: true });
            }
        }

        broadcastGameState();
    });

    ws.on("close", () => {
        delete players[playerId];
        playerCount--;
    });
});

function broadcastGameState() {
    if (playerCount < 2) return;

    const gameState = {
        type: "update",
        opponent: {
            x: players[1].x,
            y: players[1].y,
            isIt: players[1].isIt
        }
    };

    players[0].ws.send(JSON.stringify(gameState));

    gameState.opponent = {
        x: players[0].x,
        y: players[0].y,
        isIt: players[0].isIt
    };
    players[1].ws.send(JSON.stringify(gameState));
}

function playersCollide(p1, p2) {
    return Math.abs(p1.x - p2.x) < 20 && Math.abs(p1.y - p2.y) < 20;
}

function broadcast(data) {
    Object.values(players).forEach(player => {
        player.ws.send(JSON.stringify(data));
    });
}

console.log("WebSocket server running on ws://localhost:3000");
