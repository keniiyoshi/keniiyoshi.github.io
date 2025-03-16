const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 3000 });

// Game state
const players = new Map();
const furBalls = new Map();
const npcs = [];
let furBallId = 0;
let npcId = 0;

// Game constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PLAYER_SIZE = 40;
const FURBALL_SIZE = 10;
const FURBALL_SPEED = 7;
const DAMAGE = 10;
const NPC_SPEED = 2;
const NPC_SIZE = 64; // Scaled sprite size

// Initialize NPCs
function initNPCs() {
    // Add 3 NPCs at different positions
    for (let i = 0; i < 3; i++) {
        npcs.push({
            id: npcId++,
            x: 100 + (i * 200),
            y: 300,
            frameX: 0,
            frameY: 0, // Down direction
            health: 100,
            direction: 'down',
            targetX: null,
            targetY: null,
            lastDirectionChange: Date.now()
        });
    }
}

// Update NPCs movement and behavior
function updateNPCs() {
    const now = Date.now();
    
    npcs.forEach(npc => {
        // Change direction randomly every 2-4 seconds
        if (now - npc.lastDirectionChange > 2000 + Math.random() * 2000) {
            const directions = ['up', 'down', 'left', 'right', 'idle'];
            npc.direction = directions[Math.floor(Math.random() * directions.length)];
            npc.lastDirectionChange = now;
            
            // Update frameY based on direction
            switch(npc.direction) {
                case 'down': npc.frameY = 0; break;
                case 'left': npc.frameY = 1; break;
                case 'right': npc.frameY = 2; break;
                case 'up': npc.frameY = 3; break;
                case 'idle': break; // Keep current frameY
            }
        }
        
        // Animate sprite
        if (now % 200 < 50) { // Update animation frame every ~200ms
            npc.frameX = (npc.frameX + 1) % 4;
        }
        
        // Move NPC based on direction
        if (npc.direction !== 'idle') {
            switch(npc.direction) {
                case 'up': npc.y -= NPC_SPEED; break;
                case 'down': npc.y += NPC_SPEED; break;
                case 'left': npc.x -= NPC_SPEED; break;
                case 'right': npc.x += NPC_SPEED; break;
            }
            
            // Keep NPC in bounds
            npc.x = Math.max(0, Math.min(npc.x, CANVAS_WIDTH - NPC_SIZE));
            npc.y = Math.max(0, Math.min(npc.y, CANVAS_HEIGHT - NPC_SIZE));
        }
        
        // Check for collisions with fur balls
        furBalls.forEach((furBall, furBallId) => {
            const hitbox = {
                x: furBall.x - FURBALL_SIZE/2,
                y: furBall.y - FURBALL_SIZE/2,
                width: FURBALL_SIZE,
                height: FURBALL_SIZE
            };

            const npcBox = {
                x: npc.x,
                y: npc.y,
                width: NPC_SIZE,
                height: NPC_SIZE
            };

            if (checkCollision(hitbox, npcBox)) {
                // NPC hit by fur ball
                npc.health -= DAMAGE;
                furBalls.delete(furBallId);
                
                if (npc.health <= 0) {
                    // NPC defeated - respawn after 5 seconds
                    npc.health = 0;
                    setTimeout(() => {
                        npc.health = 100;
                        npc.x = Math.random() * (CANVAS_WIDTH - NPC_SIZE);
                        npc.y = Math.random() * (CANVAS_HEIGHT - NPC_SIZE);
                    }, 5000);
                }
            }
        });
    });
}

// Helper functions
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function updateFurBalls() {
    furBalls.forEach((furBall, id) => {
        // Update position
        furBall.x += Math.cos(furBall.rotation) * FURBALL_SPEED;
        furBall.y += Math.sin(furBall.rotation) * FURBALL_SPEED;

        // Check wall collisions
        if (furBall.x < 0 || furBall.x > CANVAS_WIDTH ||
            furBall.y < 0 || furBall.y > CANVAS_HEIGHT) {
            furBalls.delete(id);
            return;
        }

        // Check player collisions
        players.forEach((player, playerId) => {
            if (playerId !== furBall.playerId) { // Don't hit self
                const hitbox = {
                    x: furBall.x - FURBALL_SIZE/2,
                    y: furBall.y - FURBALL_SIZE/2,
                    width: FURBALL_SIZE,
                    height: FURBALL_SIZE
                };

                const playerBox = {
                    x: player.x,
                    y: player.y,
                    width: PLAYER_SIZE,
                    height: PLAYER_SIZE
                };

                if (checkCollision(hitbox, playerBox)) {
                    // Hit detected!
                    player.health -= DAMAGE;
                    furBalls.delete(id);
                    broadcastGameState();

                    if (player.health <= 0) {
                        handlePlayerDefeat(playerId);
                    }
                }
            }
        });
    });
}

function handlePlayerDefeat(playerId) {
    const player = players.get(playerId);
    
    broadcastToAll({
        type: 'playerDefeated',
        playerId: playerId
    });

    // Reset player
    player.health = 100;
    player.x = Math.random() * (CANVAS_WIDTH - PLAYER_SIZE);
    player.y = Math.random() * (CANVAS_HEIGHT - PLAYER_SIZE);
}

function broadcastToAll(message) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
}

function broadcastGameState() {
    const gameState = {
        type: 'gameState',
        players: Object.fromEntries(players),
        furBalls: Object.fromEntries(furBalls),
        npcs: npcs
    };
    broadcastToAll(gameState);
}

// WebSocket connection handling
wss.on('connection', (socket) => {
    const playerId = Date.now().toString();
    
    // Initialize player
    players.set(playerId, {
        x: Math.random() * (CANVAS_WIDTH - PLAYER_SIZE),
        y: Math.random() * (CANVAS_HEIGHT - PLAYER_SIZE),
        rotation: 0,
        health: 100
    });

    // Send initial state
    socket.send(JSON.stringify({
        type: 'init',
        playerId: playerId
    }));

    broadcastGameState();

    // Handle messages
    socket.on('message', (message) => {
        const data = JSON.parse(message);
        const player = players.get(playerId);

        switch(data.type) {
            case 'move':
                if (player) {
                    // Update position
                    player.x += data.movement.x;
                    player.y += data.movement.y;
                    player.rotation = data.rotation;

                    // Keep in bounds
                    player.x = Math.max(0, Math.min(player.x, CANVAS_WIDTH - PLAYER_SIZE));
                    player.y = Math.max(0, Math.min(player.y, CANVAS_HEIGHT - PLAYER_SIZE));

                    broadcastGameState();
                }
                break;

            case 'shoot':
                if (player) {
                    const newFurBall = {
                        id: furBallId++,
                        x: data.position.x,
                        y: data.position.y,
                        rotation: data.rotation,
                        playerId: playerId
                    };
                    furBalls.set(newFurBall.id, newFurBall);
                    broadcastGameState();
                }
                break;
        }
    });

    // Handle disconnection
    socket.on('close', () => {
        players.delete(playerId);
        broadcastGameState();
    });
});

// Game loop
setInterval(() => {
    updateFurBalls();
    updateNPCs();
    broadcastGameState();
}, 1000 / 60); // 60 FPS

// Initialize NPCs when server starts
initNPCs();

console.log('Kitty Battle server running on port 3000');
