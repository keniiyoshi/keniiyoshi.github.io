const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 3000 });

// Game state
let gameState = {
    players: {},
    lastPlayerId: 0
};

// Scoring system
const SCORING = {
    JUMP: 10,
    SPIN: 5,
    SPECIAL_MOVE: 20
};

wss.on('connection', (ws) => {
    // Assign player ID
    const playerId = ++gameState.lastPlayerId;
    const isPlayer1 = Object.keys(gameState.players).length === 0;

    // Initialize player
    gameState.players[playerId] = {
        position: {
            x: isPlayer1 ? -10 : 10,
            y: 0,
            z: 0,
            rotation: 0
        },
        score: 0,
        jumps: 0,
        spins: 0,
        specialMoves: 0
    };

    // Send initialization data to client
    ws.send(JSON.stringify({
        type: 'init',
        playerId: playerId,
        isPlayer1: isPlayer1
    }));

    // Broadcast updated game state to all clients
    broadcastGameState();

    // Handle messages from client
    ws.on('message', (message) => {
        const data = JSON.parse(message);

        switch(data.type) {
            case 'move':
                // Update player position
                if (gameState.players[data.playerId]) {
                    gameState.players[data.playerId].position = data.position;
                    broadcastGameState();
                }
                break;

            case 'jump':
                // Handle jump action
                if (gameState.players[data.playerId]) {
                    gameState.players[data.playerId].jumps++;
                    gameState.players[data.playerId].score += SCORING.JUMP;
                    
                    // Broadcast jump animation to all clients
                    broadcast(JSON.stringify({
                        type: 'playerJump',
                        playerId: data.playerId
                    }));

                    // Broadcast score update
                    broadcast(JSON.stringify({
                        type: 'playerScore',
                        playerId: data.playerId,
                        score: gameState.players[data.playerId].score
                    }));
                }
                break;

            case 'spin':
                // Handle spin action
                if (gameState.players[data.playerId]) {
                    gameState.players[data.playerId].spins++;
                    gameState.players[data.playerId].score += SCORING.SPIN;
                    
                    // Broadcast spin animation to all clients
                    broadcast(JSON.stringify({
                        type: 'playerSpin',
                        playerId: data.playerId
                    }));

                    // Broadcast score update
                    broadcast(JSON.stringify({
                        type: 'playerScore',
                        playerId: data.playerId,
                        score: gameState.players[data.playerId].score
                    }));
                }
                break;
        }
    });

    // Handle client disconnect
    ws.on('close', () => {
        delete gameState.players[playerId];
        broadcastGameState();
    });
});

// Broadcast game state to all clients
function broadcastGameState() {
    broadcast(JSON.stringify({
        type: 'gameState',
        players: gameState.players
    }));
}

// Broadcast message to all clients
function broadcast(message) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

console.log('Figure Skating Game Server running on ws://localhost:8080'); 