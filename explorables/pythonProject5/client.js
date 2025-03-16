const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const connectionStatus = document.getElementById('connection-status');
const playerStatus = document.getElementById('player-status');

// Set canvas size
canvas.width = 800;
canvas.height = 600;

// Game state
let gameState = {
    players: {},
    localPlayer: null,
    furBalls: [],
    health: {},
    npcs: [] // Add NPCs to the game state
};

// Constants
const PLAYER_SIZE = 40;
const PLAYER_SPEED = 4;
const FURBALL_SPEED = 7;
const FURBALL_SIZE = 10;

// Sprite character properties for NPC
const SPRITE_WIDTH = 32;
const SPRITE_HEIGHT = 32;
const SPRITE_SCALE = 2;
const SPRITE_SCALED_WIDTH = SPRITE_WIDTH * SPRITE_SCALE;
const SPRITE_SCALED_HEIGHT = SPRITE_HEIGHT * SPRITE_SCALE;

// Load images
const npcSprite = new Image();
npcSprite.src = '../pythonProject/spritesheet.png';

const backgroundImage = new Image();
backgroundImage.src = '../pythonProject/background.png';

// Connect to WebSocket server
const socket = new WebSocket('wss://3ba440f4-f292-4905-9d9f-527f81074ff7-00-30pdhdek6zv36.pike.replit.dev/');

// WebSocket event handlers
socket.onopen = () => {
    connectionStatus.textContent = 'Connected!';
};

socket.onclose = () => {
    connectionStatus.textContent = 'Disconnected - Refresh to reconnect';
};

socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    switch(data.type) {
        case 'init':
            gameState.localPlayer = data.playerId;
            gameState.isIt = data.isIt;
            break;
            
        case 'gameState':
            gameState.players = data.players;
            gameState.furBalls = data.furBalls || [];
            gameState.npcs = data.npcs || [];
            updatePlayerStatus();
            break;
            
        case 'playerDefeated':
            if (data.playerId === gameState.localPlayer) {
                playerStatus.textContent = "You were defeated! Respawning...";
                setTimeout(() => updatePlayerStatus(), 2000);
            }
            break;
    }
};

// Input handling
const keys = {};
window.addEventListener('keydown', (e) => keys[e.key] = true);
window.addEventListener('keyup', (e) => keys[e.key] = false);
window.addEventListener('click', handleShoot);

function handleInput() {
    if (!gameState.localPlayer) return;
    
    const movement = { x: 0, y: 0 };
    let rotation = 0;
    
    if (keys['ArrowUp']) movement.y -= PLAYER_SPEED;
    if (keys['ArrowDown']) movement.y += PLAYER_SPEED;
    if (keys['ArrowLeft']) movement.x -= PLAYER_SPEED;
    if (keys['ArrowRight']) movement.x += PLAYER_SPEED;
    
    // Calculate rotation based on mouse position
    const mouseX = lastMousePos.x - canvas.getBoundingClientRect().left;
    const mouseY = lastMousePos.y - canvas.getBoundingClientRect().top;
    const player = gameState.players[gameState.localPlayer];
    rotation = Math.atan2(mouseY - (player.y + PLAYER_SIZE/2), 
                         mouseX - (player.x + PLAYER_SIZE/2));
    
    if (movement.x !== 0 || movement.y !== 0 || rotation !== player.rotation) {
        socket.send(JSON.stringify({
            type: 'move',
            movement: movement,
            rotation: rotation
        }));
    }
}

// Track mouse position for aiming
let lastMousePos = { x: 0, y: 0 };
canvas.addEventListener('mousemove', (e) => {
    lastMousePos = { x: e.clientX, y: e.clientY };
});

function handleShoot(e) {
    if (!gameState.localPlayer) return;
    
    const player = gameState.players[gameState.localPlayer];
    socket.send(JSON.stringify({
        type: 'shoot',
        position: {
            x: player.x + PLAYER_SIZE/2,
            y: player.y + PLAYER_SIZE/2
        },
        rotation: player.rotation
    }));
}

function updatePlayerStatus() {
    playerStatus.textContent = gameState.isIt ? "You're IT!" : "Run away!";
}

function drawKitty(x, y, rotation, health) {
    ctx.save();
    ctx.translate(x + PLAYER_SIZE/2, y + PLAYER_SIZE/2);
    ctx.rotate(rotation);
    
    // Body (circular)
    ctx.beginPath();
    ctx.fillStyle = '#FFA7D1'; // Pink kitty
    ctx.arc(0, 0, PLAYER_SIZE/2, 0, Math.PI * 2);
    ctx.fill();
    
    // Ears
    ctx.beginPath();
    ctx.moveTo(-5, -PLAYER_SIZE/2);
    ctx.lineTo(-15, -PLAYER_SIZE/2 - 10);
    ctx.lineTo(-25, -PLAYER_SIZE/2);
    ctx.fillStyle = '#FFA7D1';
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(5, -PLAYER_SIZE/2);
    ctx.lineTo(15, -PLAYER_SIZE/2 - 10);
    ctx.lineTo(25, -PLAYER_SIZE/2);
    ctx.fill();
    
    // Face
    // Eyes
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(-8, -5, 6, 0, Math.PI * 2);
    ctx.arc(8, -5, 6, 0, Math.PI * 2);
    ctx.fill();
    
    // Pupils
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(-8, -5, 3, 0, Math.PI * 2);
    ctx.arc(8, -5, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Nose
    ctx.fillStyle = '#FF9CC4';
    ctx.beginPath();
    ctx.arc(0, 2, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Whiskers
    ctx.strokeStyle = '#FFC1D9';
    ctx.lineWidth = 2;
    ctx.beginPath();
    // Left whiskers
    ctx.moveTo(-5, 2);
    ctx.lineTo(-25, -2);
    ctx.moveTo(-5, 2);
    ctx.lineTo(-25, 2);
    ctx.moveTo(-5, 2);
    ctx.lineTo(-25, 6);
    // Right whiskers
    ctx.moveTo(5, 2);
    ctx.lineTo(25, -2);
    ctx.moveTo(5, 2);
    ctx.lineTo(25, 2);
    ctx.moveTo(5, 2);
    ctx.lineTo(25, 6);
    ctx.stroke();
    
    // Health bar
    ctx.resetTransform();
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(x, y - 10, PLAYER_SIZE, 5);
    ctx.fillStyle = '#00FF00';
    ctx.fillRect(x, y - 10, PLAYER_SIZE * (health/100), 5);
    
    ctx.restore();
}

function drawFurBall(x, y, rotation) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    
    // Fluffy fur ball
    ctx.beginPath();
    ctx.fillStyle = '#FFC1D9';
    ctx.arc(0, 0, FURBALL_SIZE, 0, Math.PI * 2);
    ctx.fill();
    
    // Add some fluff details
    ctx.strokeStyle = '#FFD9E8';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(Math.cos(i * Math.PI/2) * 3, 
                Math.sin(i * Math.PI/2) * 3, 
                FURBALL_SIZE/2, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    ctx.restore();
}

function drawNPC(npc) {
    // Draw character from spritesheet
    ctx.drawImage(
        npcSprite,
        npc.frameX * SPRITE_WIDTH,
        npc.frameY * SPRITE_HEIGHT,
        SPRITE_WIDTH,
        SPRITE_HEIGHT,
        npc.x,
        npc.y,
        SPRITE_SCALED_WIDTH,
        SPRITE_SCALED_HEIGHT
    );
    
    // Health bar
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(npc.x, npc.y - 10, SPRITE_SCALED_WIDTH, 5);
    ctx.fillStyle = '#00FF00';
    ctx.fillRect(npc.x, npc.y - 10, SPRITE_SCALED_WIDTH * (npc.health/100), 5);
}

function drawBackground() {
    if (backgroundImage.complete) {
        // Draw the loaded image
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    } else {
        // Fallback: Create a grid pattern similar to many 2D games
        ctx.fillStyle = '#8FBC8F'; // Soft green background
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw grid lines
        ctx.strokeStyle = '#7CAA7C';
        ctx.lineWidth = 1;
        
        // Vertical lines
        for (let x = 0; x < canvas.width; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y < canvas.height; y += 40) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
        
        // Add some decorative elements
        for (let i = 0; i < 10; i++) {
            const x = (i * 90) % canvas.width;
            const y = ((i * 70) + 50) % canvas.height;
            
            // Draw a small paw print
            ctx.fillStyle = '#6B8E6B';
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.arc(x + 10, y, 5, 0, Math.PI * 2);
            ctx.arc(x + 5, y + 10, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

function gameLoop() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    drawBackground();
    
    // Handle input
    handleInput();
    
    // Draw all players (kitties)
    Object.entries(gameState.players).forEach(([id, player]) => {
        drawKitty(player.x, player.y, player.rotation, player.health || 100);
    });
    
    // Draw NPCs (sprite characters)
    gameState.npcs.forEach(npc => {
        drawNPC(npc);
    });
    
    // Draw fur balls
    if (gameState.furBalls) {
        Object.values(gameState.furBalls).forEach(furBall => {
            drawFurBall(furBall.x, furBall.y, furBall.rotation);
        });
    }
    
    requestAnimationFrame(gameLoop);
}

// Start the game when images are loaded
Promise.all([
    new Promise(resolve => npcSprite.onload = resolve),
    new Promise(resolve => backgroundImage.onload = resolve)
]).then(() => {
    gameLoop();
});
