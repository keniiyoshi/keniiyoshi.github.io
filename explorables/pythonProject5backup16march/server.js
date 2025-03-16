const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 3000 });

// Game state
const players = new Map();
const furBalls = new Map();
const npcs = [];
const walls = [];
let furBallId = 0;
let npcId = 0;
let wallId = 0;

// Game constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PLAYER_SIZE = 40;
const FURBALL_SIZE = 10;
const FURBALL_SPEED = 7;
const DAMAGE = 10;
const NPC_SPEED = 2;
const NPC_SIZE = 64; // Scaled sprite size
const WALL_SIZE = 40;
const WALL_HEALTH = 100;
const WALL_DAMAGE = 25;

// Initialize walls
function initWalls() {
    // Create a simple maze-like structure with walls
    
    // Horizontal walls
    for (let i = 0; i < 5; i++) {
        createWall(100 + (i * WALL_SIZE), 150);
        createWall(400 + (i * WALL_SIZE), 150);
        createWall(100 + (i * WALL_SIZE), 450);
        createWall(400 + (i * WALL_SIZE), 450);
    }
    
    // Vertical walls
    for (let i = 0; i < 3; i++) {
        createWall(300, 200 + (i * WALL_SIZE));
        createWall(500, 200 + (i * WALL_SIZE));
    }
    
    // Add some random walls
    for (let i = 0; i < 5; i++) {
        const x = 100 + Math.floor(Math.random() * (CANVAS_WIDTH - 200) / WALL_SIZE) * WALL_SIZE;
        const y = 100 + Math.floor(Math.random() * (CANVAS_HEIGHT - 200) / WALL_SIZE) * WALL_SIZE;
        
        // Check if position is already occupied
        if (!isPositionOccupied(x, y)) {
            createWall(x, y);
        }
    }
}

function createWall(x, y) {
    walls.push({
        id: wallId++,
        x: x,
        y: y,
        health: WALL_HEALTH
    });
}

function isPositionOccupied(x, y) {
    // Check if there's already a wall at this position
    return walls.some(wall => 
        wall.x === x && wall.y === y
    );
}

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
        
        // Check for collisions with walls
        let npcCollided = false;
        walls.forEach(wall => {
            if (checkCollision(
                { x: npc.x, y: npc.y, width: NPC_SIZE, height: NPC_SIZE },
                { x: wall.x, y: wall.y, width: WALL_SIZE, height: WALL_SIZE }
            )) {
                npcCollided = true;
                
                // Move NPC away from wall
                switch(npc.direction) {
                    case 'up': npc.y += NPC_SPEED; break;
                    case 'down': npc.y -= NPC_SPEED; break;
                    case 'left': npc.x += NPC_SPEED; break;
                    case 'right': npc.x -= NPC_SPEED; break;
                }
                
                // Change direction
                npc.direction = ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)];
                npc.lastDirectionChange = now;
            }
        });
        
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
                
                // Send hit event for sound effect
                broadcastToAll({
                    type: 'npcHit',
                    npcId: npc.id
                });
                
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

        // Check wall collisions (boundaries)
        if (furBall.x < 0 || furBall.x > CANVAS_WIDTH ||
            furBall.y < 0 || furBall.y > CANVAS_HEIGHT) {
            furBalls.delete(id);
            return;
        }
        
        // Check collisions with walls
        for (let i = 0; i < walls.length; i++) {
            const wall = walls[i];
            const hitbox = {
                x: furBall.x - FURBALL_SIZE/2,
                y: furBall.y - FURBALL_SIZE/2,
                width: FURBALL_SIZE,
                height: FURBALL_SIZE
            };
            
            const wallBox = {
                x: wall.x,
                y: wall.y,
                width: WALL_SIZE,
                height: WALL_SIZE
            };
            
            if (checkCollision(hitbox, wallBox)) {
                // Wall hit!
                wall.health -= WALL_DAMAGE;
                furBalls.delete(id);
                
                // Send wall hit event for sound effect
                broadcastToAll({
                    type: 'wallHit',
                    wallId: wall.id
                });
                
                // Remove wall if destroyed
                if (wall.health <= 0) {
                    walls.splice(i, 1);
                }
                
                return; // Fur ball is gone, no need to check other collisions
            }
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
                    
                    // Send hit event for sound effect
                    broadcastToAll({
                        type: 'playerHit',
                        playerId: playerId
                    });

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
        npcs: npcs,
        walls: walls
    };
    broadcastToAll(gameState);
}

function handlePlayerMovement(player, movement) {
    // Store old position
    const oldX = player.x;
    const oldY = player.y;
    
    // Update position
    player.x += movement.x;
    player.y += movement.y;
    
    // Keep in bounds
    player.x = Math.max(0, Math.min(player.x, CANVAS_WIDTH - PLAYER_SIZE));
    player.y = Math.max(0, Math.min(player.y, CANVAS_HEIGHT - PLAYER_SIZE));
    
    // Check wall collisions
    let playerCollided = false;
    walls.forEach(wall => {
        if (checkCollision(
            { x: player.x, y: player.y, width: PLAYER_SIZE, height: PLAYER_SIZE },
            { x: wall.x, y: wall.y, width: WALL_SIZE, height: WALL_SIZE }
        )) {
            playerCollided = true;
        }
    });
    
    // If collided, revert to old position
    if (playerCollided) {
        player.x = oldX;
        player.y = oldY;
    }
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
                    // Update rotation
                    player.rotation = data.rotation;
                    
                    // Handle movement with collision detection
                    handlePlayerMovement(player, data.movement);
                    
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

// Initialize game elements
initWalls();
initNPCs();

console.log('Kitty Battle server running on port 3000');
