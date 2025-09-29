const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const connectionStatus = document.getElementById('connection-status');
const playerStatus = document.getElementById('player-status');

// Set canvas size
canvas.width = 800;
canvas.height = 600;

// Audio setup
const bgMusic = new Audio();
bgMusic.src = 'assets/stardewvalley-bgm.mp3';
bgMusic.loop = true;
bgMusic.volume = 0.4; // Set volume to 40% (slightly lower than before)

// Sound effects
const soundEffects = {
    shoot: new Audio('https://raw.githubusercontent.com/daleharvey/pacman/master/audio/eatpill.mp3'), // Pacman power-up sound
    hit: new Audio('https://themushroomkingdom.net/sounds/wav/smb/smb_jump-small.wav'),    // Mario jump sound
    wallHit: new Audio(), // New sound effect for wall hits
    wallDestroy: new Audio('https://freesound.org/data/previews/156/156031_2703579-lq.mp3') // Bubble pop sound for wall destruction
};

// Audio context for potential custom sounds
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Function to create a wall hit sound
function createWallHitSound() {
    // Create oscillator for the "thud" sound
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(150, audioContext.currentTime); // Low frequency for a "thud"
    oscillator.frequency.exponentialRampToValueAtTime(80, audioContext.currentTime + 0.2); // Descending pitch
    
    // Create gain node for volume control
    const gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime); // Start at 30% volume
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3); // Quick fade out
    
    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Start and stop the sound
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.3);
}

// Set lower volume for sound effects
soundEffects.shoot.volume = 0.3;
soundEffects.hit.volume = 0.6;
soundEffects.wallHit.volume = 0.3;
soundEffects.wallDestroy.volume = 0.5; // Medium volume for wall destruction

// Add audio controls to the UI
const audioControls = document.createElement('div');
audioControls.style.position = 'absolute';
audioControls.style.top = '10px';
audioControls.style.right = '10px';
audioControls.style.color = 'white';
audioControls.innerHTML = `
    <button id="toggleMusic" style="padding: 5px; background: #4CAF50; color: white; border: none; border-radius: 3px; cursor: pointer;">
        Stardew Music: ON
    </button>
`;
document.body.appendChild(audioControls);

// Add game controls to the UI
const gameControls = document.createElement('div');
gameControls.style.position = 'absolute';
gameControls.style.top = '10px';
gameControls.style.left = '10px';
gameControls.style.color = 'white';
gameControls.innerHTML = `
    <button id="regenerateWalls" style="padding: 5px; background: #FF9800; color: white; border: none; border-radius: 3px; cursor: pointer;">
        Regenerate Walls
    </button>
`;
document.body.appendChild(gameControls);

// Add story dialog box
const storyDialog = document.createElement('div');
storyDialog.id = 'story-dialog';
storyDialog.style.position = 'absolute';
storyDialog.style.bottom = '10px';
storyDialog.style.left = '50%';
storyDialog.style.transform = 'translateX(-50%)';
storyDialog.style.width = '80%';
storyDialog.style.padding = '15px';
storyDialog.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
storyDialog.style.color = 'white';
storyDialog.style.borderRadius = '5px';
storyDialog.style.border = '2px solid #FFD700';
storyDialog.style.fontFamily = "'Press Start 2P', 'Courier New', monospace";
storyDialog.style.fontSize = '14px';
storyDialog.style.zIndex = '100';
storyDialog.style.display = 'flex';
storyDialog.style.flexDirection = 'column';
storyDialog.style.gap = '10px';

// Dialog content
const dialogContent = document.createElement('div');
dialogContent.id = 'dialog-content';
dialogContent.style.minHeight = '60px';
dialogContent.style.maxHeight = '80px';
dialogContent.style.overflowY = 'hidden';
dialogContent.textContent = 'Bo and Jiji are hungry for their favorite foods!';

// Dialog prompt
const dialogPrompt = document.createElement('div');
dialogPrompt.id = 'dialog-prompt';
dialogPrompt.style.alignSelf = 'flex-end';
dialogPrompt.style.fontSize = '12px';
dialogPrompt.style.color = '#FFD700';
dialogPrompt.innerHTML = 'Press <span style="border: 1px solid #FFD700; padding: 2px 5px; margin: 0 5px;">SPACE</span> to continue';
dialogPrompt.style.animation = 'blink 1s infinite';

// Add style for blinking animation
const style = document.createElement('style');
style.textContent = `
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  @font-face {
    font-family: 'Press Start 2P';
    src: url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
  }
`;
document.head.appendChild(style);

// Add elements to dialog
storyDialog.appendChild(dialogContent);
storyDialog.appendChild(dialogPrompt);
document.body.appendChild(storyDialog);

// Music toggle functionality
let musicPlaying = true;
document.getElementById('toggleMusic').addEventListener('click', () => {
    if (musicPlaying) {
        bgMusic.pause();
        document.getElementById('toggleMusic').textContent = 'Stardew Music: OFF';
        document.getElementById('toggleMusic').style.background = '#F44336';
    } else {
        bgMusic.play();
        document.getElementById('toggleMusic').textContent = 'Stardew Music: ON';
        document.getElementById('toggleMusic').style.background = '#4CAF50';
    }
    musicPlaying = !musicPlaying;
});

// Regenerate walls functionality
document.getElementById('regenerateWalls').addEventListener('click', () => {
    // Send request to server to regenerate walls
    socket.send(JSON.stringify({
        type: 'regenerateWalls'
    }));
    
    // Visual feedback for button press
    const button = document.getElementById('regenerateWalls');
    button.style.background = '#FFC107';
    button.textContent = 'Regenerating...';
    
    // Reset button after a short delay
    setTimeout(() => {
        button.style.background = '#FF9800';
        button.textContent = 'Regenerate Walls';
    }, 1000);
    
    // Add story event
    const randomRegenerateStory = eventStories.regenerateWalls[Math.floor(Math.random() * eventStories.regenerateWalls.length)];
    updateStoryDialog(randomRegenerateStory, true);
});

// Game state
let gameState = {
    players: {},
    localPlayer: null,
    items: [], // Items (cookies, carrots, and tuna cans)
    health: {},
    npcs: [], // Add NPCs to the game state
    walls: [], // Add walls to the game state
    animations: [], // Add animations for effects
    playerHitEffects: {}, // Track player hit effects (jumping and flashing)
    npcHitEffects: {}, // Track NPC hit effects
    storyState: {
        currentStory: 0,
        waitingForInput: true,
        lastEvent: null,
        storyQueue: []
    },
    gameStats: {
        // Stats for Bo (player 1)
        bo: {
            cookiesEaten: 0,
            carrotsHit: 0,
            tunaHit: 0,
            score: 0,
            wallsDestroyed: 0 // Add wall destruction stats
        },
        // Stats for Jiji (player 2)
        jiji: {
            cookiesHit: 0,
            carrotsHit: 0,
            tunaEaten: 0,
            score: 0,
            wallsDestroyed: 0 // Add wall destruction stats
        }
    },
    lastItemSpawn: 0, // Track when the last item was spawned
    itemSpawnRate: 1000 // Spawn a new item every 1000ms (1 second)
};

// Constants
const PLAYER_SIZE = 40;
const PLAYER_SPEED = 4;
const ITEM_SPEED = 3;
const ITEM_SIZE = 15;
const WALL_SIZE = 40; // Add wall size constant

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
backgroundImage.src = 'assets/bakery.jpeg';

// Add character images
const jijiImage = new Image();
jijiImage.src = 'assets/jiji1.jpeg';

const boImage = new Image();
boImage.src = 'assets/bo3.jpeg';

// Add item images
const cookieImage = new Image();
cookieImage.src = 'assets/cookie.jpeg';

const carrotImage = new Image();
carrotImage.src = 'assets/carrot.jpeg';

const tunaImage = new Image();
tunaImage.src = 'assets/tuna.jpeg';

// Connect to WebSocket server
const socket = new WebSocket('wss://d6d4bfd4-c636-4afa-996b-36f020065740-00-1sjapflo38jfq.sisko.replit.dev:3000');

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
            gameState.isJiji = data.isJiji; // Instead of isIt, now it's isJiji
            break;
            
        case 'gameState':
            // Check for destroyed walls
            if (data.walls && gameState.walls.length > 0) {
                // Look for walls that existed before but are now gone (destroyed)
                gameState.walls.forEach(oldWall => {
                    // If a wall from previous state is not in the new state, it was destroyed
                    const stillExists = data.walls.some(newWall => 
                        newWall.x === oldWall.x && newWall.y === oldWall.y);
                    
                    if (!stillExists) {
                        // Play wall destruction sound
                        soundEffects.wallDestroy.currentTime = 0;
                        soundEffects.wallDestroy.play().catch(e => console.log('Error playing wall destroy sound:', e));
                        
                        // Create destruction animation
                        createWallDestructionAnimation(oldWall.x, oldWall.y);
                        
                        // Add story event
                        const randomWallDestroyStory = eventStories.wallDestroyed[Math.floor(Math.random() * eventStories.wallDestroyed.length)];
                        updateStoryDialog(randomWallDestroyStory, true);
                    }
                });
            }
            
            gameState.players = data.players;
            // We're now generating items locally, so we don't need to get them from the server
            gameState.npcs = data.npcs || [];
            gameState.walls = data.walls || []; // Add walls to game state
            updatePlayerStatus();
            break;
            
        case 'playerDefeated':
            if (data.playerId === gameState.localPlayer) {
                playerStatus.textContent = "Game Over! Too many wrong foods!";
                setTimeout(() => updatePlayerStatus(), 2000);
            }
            break;
            
        case 'wallHit':
            // Play custom wall hit sound
            createWallHitSound();
            break;
            
        case 'wallDestroyed':
            // Update stats for wall destruction
            if (data.playerId !== undefined) {
                const playerIds = Object.keys(gameState.players).sort();
                const isJijiDestroyer = data.playerId === playerIds[0];
                
                if (isJijiDestroyer) {
                    gameState.gameStats.jiji.wallsDestroyed++;
                    gameState.gameStats.jiji.score += 5; // Bonus points for destroying walls
                } else {
                    gameState.gameStats.bo.wallsDestroyed++;
                    gameState.gameStats.bo.score += 5; // Bonus points for destroying walls
                }
                
                // Update the stats display
                updateGameStats();
            }
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
    
    // Both Bo and Jiji can move freely in all four directions using arrow keys
    if (keys['ArrowLeft']) movement.x -= PLAYER_SPEED;
    if (keys['ArrowRight']) movement.x += PLAYER_SPEED;
    if (keys['ArrowUp']) movement.y -= PLAYER_SPEED;
    if (keys['ArrowDown']) movement.y += PLAYER_SPEED;
    
    // Only send movement if there's actual movement
    if (movement.x !== 0 || movement.y !== 0) {
        socket.send(JSON.stringify({
            type: 'move',
            movement: movement
        }));
    }
}

// Track mouse position for aiming
let lastMousePos = { x: 0, y: 0 };
canvas.addEventListener('mousemove', (e) => {
    lastMousePos = { x: e.clientX, y: e.clientY };
});

function updatePlayerStatus() {
    // Determine if the local player is Bo or Jiji
    const playerIds = Object.keys(gameState.players).sort();
    const isJiji = gameState.isJiji;
    
    // Update status text to show character and game status
    if (isJiji) {
        playerStatus.textContent = `You're Jiji - Move with arrow keys in any direction! Catch tuna!`;
    } else {
        playerStatus.textContent = `You're Bo - Move with arrow keys in any direction! Catch cookies!`;
    }
}

function drawCharacter(x, y, isJiji, health) {
    const playerId = Object.keys(gameState.players).find(id => 
        gameState.players[id].x === x && gameState.players[id].y === y);
    
    // Get hit effect for this player if it exists
    const hitEffect = gameState.playerHitEffects[playerId] || null;
    
    // Calculate position with jump offset if hit
    const yOffset = hitEffect ? -hitEffect.jumpOffset : 0;
    
    ctx.save();
    
    // Draw the appropriate character image
    if (isJiji) {
        // Draw Jiji using the image
        ctx.drawImage(jijiImage, x, y + yOffset, PLAYER_SIZE, PLAYER_SIZE);
    } else {
        // Draw Bo using the image
        ctx.drawImage(boImage, x, y + yOffset, PLAYER_SIZE, PLAYER_SIZE);
    }
    
    // Add a small indicator if this is the local player
    if (playerId === gameState.localPlayer) {
        ctx.fillStyle = '#4CAF50'; // Green indicator
        ctx.beginPath();
        ctx.arc(x + PLAYER_SIZE/2, y + yOffset - 5, 3, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.restore();
    
    // Apply red flash effect if hit
    if (hitEffect && hitEffect.flashIntensity > 0) {
        ctx.globalAlpha = hitEffect.flashIntensity * 0.6; // Control flash opacity
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(x, y + yOffset, PLAYER_SIZE, PLAYER_SIZE);
        ctx.globalAlpha = 1.0; // Reset alpha
    }
    
    // Health bar - adjusted for jump offset
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(x, y + yOffset - 10, PLAYER_SIZE, 5);
    ctx.fillStyle = '#00FF00';
    ctx.fillRect(x, y + yOffset - 10, PLAYER_SIZE * (health/100), 5);
}

function drawItem(x, y, type) {
    ctx.save();
    ctx.translate(x, y);
    
    const itemSize = ITEM_SIZE * 2; // Make items a bit larger for visibility
    
    if (type === 'cookie') {
        // Draw cookie using the image
        ctx.drawImage(cookieImage, -itemSize/2, -itemSize/2, itemSize, itemSize);
    } else if (type === 'carrot') {
        // Draw carrot using the image
        ctx.drawImage(carrotImage, -itemSize/2, -itemSize/2, itemSize, itemSize);
    } else if (type === 'tuna') {
        // Draw tuna can using the image
        ctx.drawImage(tunaImage, -itemSize/2, -itemSize/2, itemSize, itemSize);
    }
    
    ctx.restore();
}

function drawNPC(npc) {
    // Get hit effect for this NPC if it exists
    const hitEffect = gameState.npcHitEffects[npc.id] || null;
    
    // Calculate position with jump offset if hit
    const yOffset = hitEffect ? -hitEffect.jumpOffset : 0;
    
    // Draw character from spritesheet with potential y offset
    ctx.drawImage(
        npcSprite,
        npc.frameX * SPRITE_WIDTH,
        npc.frameY * SPRITE_HEIGHT,
        SPRITE_WIDTH,
        SPRITE_HEIGHT,
        npc.x,
        npc.y + yOffset, // Apply jump offset
        SPRITE_SCALED_WIDTH,
        SPRITE_SCALED_HEIGHT
    );
    
    // Apply red flash effect if hit
    if (hitEffect && hitEffect.flashIntensity > 0) {
        ctx.globalAlpha = hitEffect.flashIntensity * 0.6; // Control flash opacity
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(npc.x, npc.y + yOffset, SPRITE_SCALED_WIDTH, SPRITE_SCALED_HEIGHT);
        ctx.globalAlpha = 1.0; // Reset alpha
    }
    
    // Health bar
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(npc.x, npc.y + yOffset - 10, SPRITE_SCALED_WIDTH, 5);
    ctx.fillStyle = '#00FF00';
    ctx.fillRect(npc.x, npc.y + yOffset - 10, SPRITE_SCALED_WIDTH * (npc.health/100), 5);
}

function drawBackground() {
    if (backgroundImage.complete) {
        // Draw the loaded bakery image
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    } else {
        // Fallback: Create a simple background if image isn't loaded
        ctx.fillStyle = '#F5DEB3'; // Wheat color as fallback
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add some text indicating image is loading
        ctx.fillStyle = '#8B4513';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Loading background image...', canvas.width/2, canvas.height/2);
    }
}

// Function to update animations
function updateAnimations() {
    // Update each animation
    for (let i = gameState.animations.length - 1; i >= 0; i--) {
        const anim = gameState.animations[i];
        
        // Update position
        anim.x += anim.velX;
        anim.y += anim.velY;
        
        // Apply gravity if applicable
        if (anim.gravity) {
            anim.velY += anim.gravity;
        }
        
        // Reduce lifetime
        anim.lifetime--;
        
        // Update alpha based on lifetime
        anim.alpha = anim.lifetime / anim.maxLifetime;
        
        // Remove dead animations
        if (anim.lifetime <= 0) {
            gameState.animations.splice(i, 1);
        }
    }
}

// Function to draw animations
function drawAnimations() {
    gameState.animations.forEach(anim => {
        ctx.globalAlpha = anim.alpha;
        
        // Draw particle based on type
        if (anim.type === 'smoke') {
            // Draw smoke particle (semi-transparent circle)
            ctx.beginPath();
            ctx.fillStyle = anim.color;
            ctx.arc(anim.x, anim.y, anim.size, 0, Math.PI * 2);
            ctx.fill();
        } else if (anim.type === 'debris') {
            // Draw debris particle (small rectangle)
            ctx.fillStyle = anim.color;
            ctx.fillRect(anim.x - anim.size/2, anim.y - anim.size/2, anim.size, anim.size);
        } else {
            // Default particle (circle)
            ctx.beginPath();
            ctx.fillStyle = anim.color;
            ctx.arc(anim.x, anim.y, anim.size, 0, Math.PI * 2);
            ctx.fill();
        }
    });
    
    // Reset global alpha
    ctx.globalAlpha = 1.0;
}

// Add a function to update player hit effects
function updatePlayerHitEffects() {
    // Update each player hit effect
    Object.keys(gameState.playerHitEffects).forEach(playerId => {
        const effect = gameState.playerHitEffects[playerId];
        
        // Decrease duration
        effect.duration--;
        
        // Update jump offset (create a bouncing effect)
        effect.jumpOffset = Math.max(0, effect.jumpOffset - 1.5);
        
        // Update flash intensity (fade out)
        effect.flashIntensity = effect.duration / 20; // Fade based on remaining duration
        
        // Remove effect when duration is over
        if (effect.duration <= 0) {
            delete gameState.playerHitEffects[playerId];
        }
    });
}

// Story progression
const storyLines = [
    "Bo and Jiji can move freely around the bakery!",
    "Bo loves cookies, while Jiji prefers tuna cans.",
    "Use the arrow keys to move in any direction.",
    "Catch your favorite foods and avoid the others!",
    "Enjoy the relaxing Stardew Valley music while you play!",
    "Who will score the most points? The race is on!",
    "Break through walls to find hidden paths and treasures!"
];

// Event-based story elements
const eventStories = {
    cookieEaten: [
        "Yum! Bo munches happily on a cookie!",
        "Another cookie devoured! Bo's sweet tooth is satisfied.",
        "Cookie acquired! Bo's sugar rush intensifies.",
        "Bo gobbles up the cookie with delight!"
    ],
    carrotHit: [
        "Ugh! Bo grimaces as he collides with a carrot.",
        "A carrot hit! Bo is not pleased.",
        "Bo reluctantly accepts the healthy vegetable.",
        "Carrots again? Bo would prefer cookies!"
    ],
    itemDropped: [
        "Items are raining from the sky!",
        "Look out below! More food is falling.",
        "Incoming! Catch the right items for points.",
        "Heads up! Don't let your favorite foods hit the ground."
    ],
    wallDestroyed: [
        "The wall crumbles to dust! A new path opens.",
        "CRASH! Another wall bites the dust.",
        "The brick wall is no more. Onward!",
        "With a satisfying crumble, the wall is destroyed."
    ],
    regenerateWalls: [
        "The maze reshapes itself! New challenges await.",
        "The walls have returned, stronger than before.",
        "A new labyrinth forms around Bo and Jiji.",
        "The playing field has changed! Adapt or perish."
    ]
};

// Function to update the story dialog
function updateStoryDialog(text, isEvent = false) {
    const dialogContent = document.getElementById('dialog-content');
    
    // If this is an event-triggered story, add it to the queue
    if (isEvent) {
        gameState.storyState.storyQueue.push(text);
        
        // If we're waiting for input, show the next story immediately
        if (gameState.storyState.waitingForInput) {
            showNextStory();
        }
    } else {
        // For regular story progression
        dialogContent.textContent = text;
        gameState.storyState.waitingForInput = true;
    }
}

// Function to show the next story from the queue or progress the main story
function showNextStory() {
    const dialogContent = document.getElementById('dialog-content');
    
    // If there are event stories in the queue, show those first
    if (gameState.storyState.storyQueue.length > 0) {
        dialogContent.textContent = gameState.storyState.storyQueue.shift();
    } else {
        // Otherwise progress the main story
        gameState.storyState.currentStory = (gameState.storyState.currentStory + 1) % storyLines.length;
        dialogContent.textContent = storyLines[gameState.storyState.currentStory];
    }
    
    gameState.storyState.waitingForInput = true;
}

// Add space bar event listener for story progression
window.addEventListener('keydown', (e) => {
    if (e.key === ' ' && gameState.storyState.waitingForInput) {
        showNextStory();
        e.preventDefault(); // Prevent scrolling
    }
});

// Add battle stats display
const statsDisplay = document.createElement('div');
statsDisplay.id = 'game-stats';
statsDisplay.style.position = 'absolute';
statsDisplay.style.bottom = '120px'; // Position above the story dialog
statsDisplay.style.left = '50%';
statsDisplay.style.transform = 'translateX(-50%)';
statsDisplay.style.width = '80%';
statsDisplay.style.padding = '10px';
statsDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
statsDisplay.style.color = 'white';
statsDisplay.style.borderRadius = '5px';
statsDisplay.style.border = '2px solid #4CAF50';
statsDisplay.style.fontFamily = "'Courier New', monospace";
statsDisplay.style.fontSize = '14px';
statsDisplay.style.zIndex = '99';
statsDisplay.style.display = 'flex';
statsDisplay.style.justifyContent = 'space-between';

// Create stats sections for each character
const boStats = document.createElement('div');
boStats.id = 'bo-stats';
boStats.style.flex = '1';
boStats.style.borderRight = '1px solid #4CAF50';
boStats.style.padding = '0 10px';
boStats.innerHTML = `
    <h3 style="color: #FFD700; margin: 0 0 5px 0; text-align: center;">Bo's Stats</h3>
    <div style="display: flex; flex-direction: column; gap: 3px;">
        <div>Cookies Eaten: <span id="bo-cookies">0</span></div>
        <div>Carrots Hit: <span id="bo-carrots">0</span></div>
        <div>Tuna Hit: <span id="bo-tuna">0</span></div>
        <div>Walls Destroyed: <span id="bo-walls">0</span></div>
        <div>Score: <span id="bo-score">0</span></div>
    </div>
`;

const jijiStats = document.createElement('div');
jijiStats.id = 'jiji-stats';
jijiStats.style.flex = '1';
jijiStats.style.padding = '0 10px';
jijiStats.innerHTML = `
    <h3 style="color: #000000; margin: 0 0 5px 0; text-align: center;">Jiji's Stats</h3>
    <div style="display: flex; flex-direction: column; gap: 3px;">
        <div>Cookies Hit: <span id="jiji-cookies">0</span></div>
        <div>Carrots Hit: <span id="jiji-carrots">0</span></div>
        <div>Tuna Eaten: <span id="jiji-tuna">0</span></div>
        <div>Walls Destroyed: <span id="jiji-walls">0</span></div>
        <div>Score: <span id="jiji-score">0</span></div>
    </div>
`;

// Add stats sections to the display
statsDisplay.appendChild(boStats);
statsDisplay.appendChild(jijiStats);

// Add the stats display to the document
document.body.appendChild(statsDisplay);

// Function to update game stats display
function updateGameStats() {
    // Update Bo's stats
    document.getElementById('bo-cookies').textContent = gameState.gameStats.bo.cookiesEaten;
    document.getElementById('bo-carrots').textContent = gameState.gameStats.bo.carrotsHit;
    document.getElementById('bo-tuna').textContent = gameState.gameStats.bo.tunaHit;
    document.getElementById('bo-walls').textContent = gameState.gameStats.bo.wallsDestroyed;
    document.getElementById('bo-score').textContent = gameState.gameStats.bo.score;
    
    // Update Jiji's stats
    document.getElementById('jiji-cookies').textContent = gameState.gameStats.jiji.cookiesHit;
    document.getElementById('jiji-carrots').textContent = gameState.gameStats.jiji.carrotsHit;
    document.getElementById('jiji-tuna').textContent = gameState.gameStats.jiji.tunaEaten;
    document.getElementById('jiji-walls').textContent = gameState.gameStats.jiji.wallsDestroyed;
    document.getElementById('jiji-score').textContent = gameState.gameStats.jiji.score;
}

// Function to spawn a new raining item
function spawnRainingItem() {
    const currentTime = Date.now();
    
    // Check if it's time to spawn a new item
    if (currentTime - gameState.lastItemSpawn > gameState.itemSpawnRate) {
        // Update the last spawn time
        gameState.lastItemSpawn = currentTime;
        
        // Randomly determine the item type
        const itemTypes = ['cookie', 'carrot', 'tuna'];
        const randomType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
        
        // Random x position within the canvas
        const randomX = Math.random() * (canvas.width - ITEM_SIZE * 2) + ITEM_SIZE;
        
        // Create the new item at the top of the screen
        const newItem = {
            x: randomX,
            y: 0, // Start at the top
            type: randomType,
            velocity: 2 + Math.random() * 2 // Random fall speed
        };
        
        // Add the item to the game state
        gameState.items.push(newItem);
    }
}

// Function to update raining items
function updateRainingItems() {
    // Move each item down
    for (let i = gameState.items.length - 1; i >= 0; i--) {
        const item = gameState.items[i];
        
        // Move the item down
        item.y += item.velocity;
        
        // Remove items that have fallen off the bottom of the screen
        if (item.y > canvas.height) {
            gameState.items.splice(i, 1);
        }
    }
}

// Function to check for item collisions with players
function checkItemCollisions() {
    // Check each item against each player
    for (let i = gameState.items.length - 1; i >= 0; i--) {
        const item = gameState.items[i];
        
        // Check against each player
        Object.entries(gameState.players).forEach(([playerId, player]) => {
            // Calculate collision box (slightly smaller than player for better feel)
            const collisionMargin = 5;
            const playerBox = {
                x: player.x + collisionMargin,
                y: player.y + collisionMargin,
                width: PLAYER_SIZE - collisionMargin * 2,
                height: PLAYER_SIZE - collisionMargin * 2
            };
            
            // Check if item is within player's collision box
            if (
                item.x > playerBox.x && 
                item.x < playerBox.x + playerBox.width &&
                item.y > playerBox.y && 
                item.y < playerBox.y + playerBox.height
            ) {
                // Determine which player (Bo or Jiji)
                const playerIds = Object.keys(gameState.players).sort();
                const isJiji = playerId === playerIds[0]; // First player is Jiji
                
                // Handle scoring based on player and item type
                if (isJiji) {
                    // Jiji gets points for tuna, loses for others
                    if (item.type === 'tuna') {
                        gameState.gameStats.jiji.tunaEaten++;
                        gameState.gameStats.jiji.score += 10;
                        // Play eat sound
                        soundEffects.hit.currentTime = 0;
                        soundEffects.hit.play().catch(e => console.log('Error playing eat sound:', e));
                        // Add story event
                        updateStoryDialog("Jiji happily munches on the tuna!", true);
                    } else if (item.type === 'cookie') {
                        gameState.gameStats.jiji.cookiesHit++;
                        gameState.gameStats.jiji.score -= 5;
                        // Add visual hit effect
                        gameState.playerHitEffects[playerId] = {
                            jumpOffset: 15,
                            flashIntensity: 1.0,
                            duration: 20
                        };
                        // Play hit sound
                        soundEffects.shoot.currentTime = 0;
                        soundEffects.shoot.play().catch(e => console.log('Error playing hit sound:', e));
                        // Add story event
                        updateStoryDialog("Jiji doesn't like sweet cookies!", true);
                    } else if (item.type === 'carrot') {
                        gameState.gameStats.jiji.carrotsHit++;
                        gameState.gameStats.jiji.score -= 5;
                        // Add visual hit effect
                        gameState.playerHitEffects[playerId] = {
                            jumpOffset: 15,
                            flashIntensity: 1.0,
                            duration: 20
                        };
                        // Play hit sound
                        soundEffects.shoot.currentTime = 0;
                        soundEffects.shoot.play().catch(e => console.log('Error playing hit sound:', e));
                        // Add story event
                        updateStoryDialog("Jiji dislikes vegetables!", true);
                    }
                } else {
                    // Bo gets points for cookies, loses for others
                    if (item.type === 'cookie') {
                        gameState.gameStats.bo.cookiesEaten++;
                        gameState.gameStats.bo.score += 10;
                        // Play eat sound
                        soundEffects.hit.currentTime = 0;
                        soundEffects.hit.play().catch(e => console.log('Error playing eat sound:', e));
                        // Add story event
                        updateStoryDialog("Bo loves cookies!", true);
                    } else if (item.type === 'carrot') {
                        gameState.gameStats.bo.carrotsHit++;
                        gameState.gameStats.bo.score -= 5;
                        // Add visual hit effect
                        gameState.playerHitEffects[playerId] = {
                            jumpOffset: 15,
                            flashIntensity: 1.0,
                            duration: 20
                        };
                        // Play hit sound
                        soundEffects.shoot.currentTime = 0;
                        soundEffects.shoot.play().catch(e => console.log('Error playing hit sound:', e));
                        // Add story event
                        updateStoryDialog("Bo grimaces at the carrot!", true);
                    } else if (item.type === 'tuna') {
                        gameState.gameStats.bo.tunaHit++;
                        gameState.gameStats.bo.score -= 5;
                        // Add visual hit effect
                        gameState.playerHitEffects[playerId] = {
                            jumpOffset: 15,
                            flashIntensity: 1.0,
                            duration: 20
                        };
                        // Play hit sound
                        soundEffects.shoot.currentTime = 0;
                        soundEffects.shoot.play().catch(e => console.log('Error playing hit sound:', e));
                        // Add story event
                        updateStoryDialog("Bo doesn't like tuna!", true);
                    }
                }
                
                // Remove the item
                gameState.items.splice(i, 1);
                
                // Update the stats display
                updateGameStats();
                
                // Break the loop since we've removed this item
                return;
            }
        });
    }
}

// Add wall drawing function
function drawWall(wall) {
    ctx.fillStyle = wall.health > 50 ? '#8B4513' : '#A0522D'; // Brown color, lighter when damaged
    ctx.fillRect(wall.x, wall.y, WALL_SIZE, WALL_SIZE);
    
    // Add brick pattern
    ctx.strokeStyle = '#5D4037';
    ctx.lineWidth = 2;
    
    // Horizontal lines
    for (let y = wall.y + WALL_SIZE/3; y < wall.y + WALL_SIZE; y += WALL_SIZE/3) {
        ctx.beginPath();
        ctx.moveTo(wall.x, y);
        ctx.lineTo(wall.x + WALL_SIZE, y);
        ctx.stroke();
    }
    
    // Vertical lines - staggered brick pattern
    for (let x = wall.x + WALL_SIZE/4; x < wall.x + WALL_SIZE; x += WALL_SIZE/2) {
        // Top section
        ctx.beginPath();
        ctx.moveTo(x, wall.y);
        ctx.lineTo(x, wall.y + WALL_SIZE/3);
        ctx.stroke();
        
        // Middle section - offset
        ctx.beginPath();
        ctx.moveTo(x - WALL_SIZE/4, wall.y + WALL_SIZE/3);
        ctx.lineTo(x - WALL_SIZE/4, wall.y + 2*WALL_SIZE/3);
        ctx.stroke();
        
        // Bottom section
        ctx.beginPath();
        ctx.moveTo(x, wall.y + 2*WALL_SIZE/3);
        ctx.lineTo(x, wall.y + WALL_SIZE);
        ctx.stroke();
    }
    
    // Add cracks when damaged
    if (wall.health <= 75) {
        ctx.strokeStyle = '#3E2723';
        ctx.beginPath();
        ctx.moveTo(wall.x + WALL_SIZE/4, wall.y);
        ctx.lineTo(wall.x + WALL_SIZE/2, wall.y + WALL_SIZE/2);
        ctx.stroke();
    }
    
    if (wall.health <= 50) {
        ctx.beginPath();
        ctx.moveTo(wall.x + 3*WALL_SIZE/4, wall.y);
        ctx.lineTo(wall.x + WALL_SIZE/2, wall.y + 3*WALL_SIZE/4);
        ctx.stroke();
    }
    
    if (wall.health <= 25) {
        ctx.beginPath();
        ctx.moveTo(wall.x, wall.y + WALL_SIZE/4);
        ctx.lineTo(wall.x + WALL_SIZE/2, wall.y + WALL_SIZE/2);
        ctx.stroke();
    }
}

// Add a function to create a wall destruction animation
function createWallDestructionAnimation(x, y) {
    // Create multiple smoke particles
    const particleCount = 15;
    const baseLifetime = 30; // frames
    
    for (let i = 0; i < particleCount; i++) {
        // Random position within the wall
        const posX = x + Math.random() * WALL_SIZE;
        const posY = y + Math.random() * WALL_SIZE;
        
        // Random velocity
        const velX = (Math.random() - 0.5) * 3;
        const velY = (Math.random() - 0.5) * 3 - 1; // Slight upward bias
        
        // Random size
        const size = 5 + Math.random() * 15;
        
        // Random lifetime variation
        const lifetime = baseLifetime + Math.random() * 20;
        
        // Add particle to animations
        gameState.animations.push({
            type: 'smoke',
            x: posX,
            y: posY,
            velX: velX,
            velY: velY,
            size: size,
            alpha: 0.8,
            lifetime: lifetime,
            maxLifetime: lifetime,
            color: Math.random() > 0.7 ? '#FFA500' : '#555555' // Some orange embers among the smoke
        });
    }
    
    // Add some brick debris particles
    for (let i = 0; i < 10; i++) {
        const posX = x + WALL_SIZE/2;
        const posY = y + WALL_SIZE/2;
        
        // Random velocity - stronger than smoke
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 4;
        const velX = Math.cos(angle) * speed;
        const velY = Math.sin(angle) * speed;
        
        // Random size for debris
        const size = 3 + Math.random() * 7;
        
        // Add debris particle
        gameState.animations.push({
            type: 'debris',
            x: posX,
            y: posY,
            velX: velX,
            velY: velY,
            size: size,
            alpha: 1.0,
            lifetime: baseLifetime * 0.7, // Debris disappears faster than smoke
            maxLifetime: baseLifetime * 0.7,
            color: '#8B4513', // Brown brick color
            gravity: 0.2 // Debris is affected by gravity
        });
    }
}

function gameLoop() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    drawBackground();
    
    // Handle input
    handleInput();
    
    // Spawn new raining items
    spawnRainingItem();
    
    // Update raining items
    updateRainingItems();
    
    // Check for item collisions
    checkItemCollisions();
    
    // Update animations
    updateAnimations();
    
    // Update player hit effects
    updatePlayerHitEffects();
    
    // Draw walls
    if (gameState.walls) {
        gameState.walls.forEach(wall => {
            drawWall(wall);
        });
    }
    
    // Draw all players (Bo and Jiji)
    Object.entries(gameState.players).forEach(([id, player]) => {
        const playerIds = Object.keys(gameState.players).sort();
        const isJiji = id === playerIds[0]; // First player is Jiji
        drawCharacter(player.x, player.y, isJiji, player.health || 100);
    });
    
    // Draw items (cookies, carrots, and tuna)
    if (gameState.items) {
        gameState.items.forEach(item => {
            drawItem(item.x, item.y, item.type);
        });
    }
    
    // Draw animations (on top of other elements)
    drawAnimations();
    
    // Update game stats display
    updateGameStats();
    
    requestAnimationFrame(gameLoop);
}

// When the game starts, initialize the game state
Promise.all([
    new Promise(resolve => npcSprite.onload = resolve),
    new Promise(resolve => backgroundImage.onload = resolve),
    new Promise(resolve => jijiImage.onload = resolve),
    new Promise(resolve => boImage.onload = resolve),
    new Promise(resolve => cookieImage.onload = resolve),
    new Promise(resolve => carrotImage.onload = resolve),
    new Promise(resolve => tunaImage.onload = resolve)
]).then(() => {
    // Initialize game stats
    gameState.gameStats = {
        bo: {
            cookiesEaten: 0,
            carrotsHit: 0,
            tunaHit: 0,
            score: 0,
            wallsDestroyed: 0 // Add wall destruction stats
        },
        jiji: {
            cookiesHit: 0,
            carrotsHit: 0,
            tunaEaten: 0,
            score: 0,
            wallsDestroyed: 0 // Add wall destruction stats
        }
    };
    
    // Initialize last item spawn time
    gameState.lastItemSpawn = Date.now();
    
    // Start Stardew Valley background music when game loads
    bgMusic.play().catch(error => {
        console.log('Audio autoplay was prevented. Click the music button to start audio.');
        musicPlaying = false;
        document.getElementById('toggleMusic').textContent = 'Stardew Music: OFF';
        document.getElementById('toggleMusic').style.background = '#F44336';
    });
    
    // Show initial story message
    updateStoryDialog("Welcome to Bo and Jiji's Food Adventure! Enjoy the Stardew Valley music!");

    // Start the game loop
gameLoop();
});
