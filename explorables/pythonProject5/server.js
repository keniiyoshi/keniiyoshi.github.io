const WebSocket = require('ws');
const server = new WebSocket.Server({ port: 3000 });

const players = new Map();
let taggerId = null;

server.on('connection', (socket) => {
    const playerId = Date.now().toString();
    
    // Initialize player
    players.set(playerId, {
        x: Math.random() * 700,
        y: Math.random() * 500,
        isIt: players.size === 0 // First player is "it"
    });
    
    if (players.size === 1) {
        taggerId = playerId;
    }
    
    // Send initial state to new player
    socket.send(JSON.stringify({
        type: 'init',
        playerId: playerId,
        isIt: players.get(playerId).isIt
    }));
    
    // Broadcast game state to all players
    broadcastGameState();
    
    // Handle messages from clients
    socket.on('message', (message) => {
        const data = JSON.parse(message);
        
        if (data.type === 'move') {
            const player = players.get(playerId);
            if (player) {
                player.x += data.movement.x;
                player.y += data.movement.y;
                
                // Keep player in bounds
                player.x = Math.max(0, Math.min(player.x, 768));
                player.y = Math.max(0, Math.min(player.y, 568));
                
                // Check for tags
                checkForTags(playerId);
                
                broadcastGameState();
            }
        }
    });
    
    // Handle disconnection
    socket.on('close', () => {
        players.delete(playerId);
        if (taggerId === playerId && players.size > 0) {
            // Assign new tagger if the tagger disconnected
            taggerId = Array.from(players.keys())[0];
            players.get(taggerId).isIt = true;
        }
        broadcastGameState();
    });
});

function checkForTags(playerId) {
    const tagger = players.get(taggerId);
    if (!tagger) return;
    
    players.forEach((player, id) => {
        if (id !== taggerId) {
            const dx = tagger.x - player.x;
            const dy = tagger.y - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 32) { // Tag distance
                // Swap tagger
                players.get(taggerId).isIt = false;
                player.isIt = true;
                taggerId = id;
                
                // Notify players
                server.clients.forEach(client => {
                    client.send(JSON.stringify({
                        type: 'tagged',
                        isIt: client === socket
                    }));
                });
            }
        }
    });
}

function broadcastGameState() {
    const gameState = {
        type: 'gameState',
        players: Object.fromEntries(players)
    };
    
    server.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(gameState));
        }
    });
}

console.log("WebSocket server running on ws://localhost:8080");
