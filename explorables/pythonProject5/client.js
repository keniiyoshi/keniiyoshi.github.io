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
    isIt: false
};

// Player properties
const PLAYER_SIZE = 32;
const PLAYER_SPEED = 5;

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
            updatePlayerStatus();
            break;
            
        case 'tagged':
            gameState.isIt = data.isIt;
            updatePlayerStatus();
            break;
    }
};

// Input handling
const keys = {};
window.addEventListener('keydown', (e) => keys[e.key] = true);
window.addEventListener('keyup', (e) => keys[e.key] = false);

function handleInput() {
    if (!gameState.localPlayer) return;
    
    const movement = { x: 0, y: 0 };
    
    if (keys['ArrowUp']) movement.y -= PLAYER_SPEED;
    if (keys['ArrowDown']) movement.y += PLAYER_SPEED;
    if (keys['ArrowLeft']) movement.x -= PLAYER_SPEED;
    if (keys['ArrowRight']) movement.x += PLAYER_SPEED;
    
    if (movement.x !== 0 || movement.y !== 0) {
        socket.send(JSON.stringify({
            type: 'move',
            movement: movement
        }));
    }
}

function updatePlayerStatus() {
    playerStatus.textContent = gameState.isIt ? "You're IT!" : "Run away!";
}

function drawPlayer(x, y, isIt) {
    ctx.fillStyle = isIt ? 'red' : 'blue';
    ctx.fillRect(x, y, PLAYER_SIZE, PLAYER_SIZE);
}

function gameLoop() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Handle input
    handleInput();
    
    // Draw all players
    Object.entries(gameState.players).forEach(([id, player]) => {
        drawPlayer(player.x, player.y, player.isIt);
    });
    
    requestAnimationFrame(gameLoop);
}

// Start the game loop
gameLoop();
