const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const connectionStatus = document.getElementById('connection-status');
const playerStatus = document.getElementById('player-status');

// Set canvas size
canvas.width = 800;
canvas.height = 600;

// Audio setup
const bgMusic = new Audio();
bgMusic.src = '../pythonProject3/html5-rpg/music/field.mp3';
bgMusic.loop = true;
bgMusic.volume = 0.5; // Set volume to 50%

// Sound effects
const soundEffects = {
    shoot: new Audio('https://raw.githubusercontent.com/daleharvey/pacman/master/audio/eatpill.mp3'), // Pacman power-up sound
    hit: new Audio('https://themushroomkingdom.net/sounds/wav/smb/smb_jump-small.wav'),    // Mario jump sound
    wallHit: new Audio(), // New sound effect for wall hits
    wallDestroy: new Audio('https://freesound.org/data/previews/156/156031_2703579-lq.mp3') // Bubble pop sound for wall destruction
};

// Create a custom wall hit sound using the Web Audio API
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
        Music: ON
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
dialogContent.textContent = 'The eternal chase between Tom and Garfield continues...';

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
        document.getElementById('toggleMusic').textContent = 'Music: OFF';
        document.getElementById('toggleMusic').style.background = '#F44336';
    } else {
        bgMusic.play();
        document.getElementById('toggleMusic').textContent = 'Music: ON';
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
    furBalls: [],
    health: {},
    npcs: [], // Add NPCs to the game state
    walls: [], // Add walls to the game state
    animations: [], // Add animations for effects like wall destruction
    npcHitEffects: {}, // Track NPC hit effects (jumping and flashing)
    playerHitEffects: {}, // Track player hit effects (jumping and flashing)
    storyState: {
        currentStory: 0,
        waitingForInput: true,
        lastEvent: null,
        storyQueue: []
    },
    battleStats: {
        // Stats for Tom (player 1)
        tom: {
            wallsDestroyed: 0,
            economicDamage: 0,
            hitsLanded: 0,
            furballsFired: 0
        },
        // Stats for Garfield (player 2)
        garfield: {
            wallsDestroyed: 0,
            economicDamage: 0,
            hitsLanded: 0,
            furballsFired: 0
        }
    }
};

// Constants
const PLAYER_SIZE = 40;
const PLAYER_SPEED = 4;
const FURBALL_SPEED = 7;
const FURBALL_SIZE = 10;
const WALL_SIZE = 40;

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
                        
                        // Note: Wall destruction stats are updated when we receive the 'wallDestroyed' event
                        // which includes the player ID of who destroyed it
                    }
                });
            }
            
            gameState.players = data.players;
            gameState.furBalls = data.furBalls || [];
            gameState.npcs = data.npcs || [];
            gameState.walls = data.walls || [];
            updatePlayerStatus();
            break;
            
        case 'playerDefeated':
            if (data.playerId === gameState.localPlayer) {
                playerStatus.textContent = "You were defeated! Respawning...";
                setTimeout(() => updatePlayerStatus(), 2000);
            }
            break;
            
        case 'playerHit':
            // Play hit sound when any player is hit, not just the local player
            soundEffects.hit.currentTime = 0;
            soundEffects.hit.play().catch(e => console.log('Error playing hit sound:', e));
            
            // Add visual hit effect for the player
            if (data.playerId !== undefined) {
                gameState.playerHitEffects[data.playerId] = {
                    jumpOffset: 15, // Initial jump height
                    flashIntensity: 1.0, // Full red flash
                    duration: 20 // Effect duration in frames
                };
                
                // Add story event
                const randomPlayerHitStory = eventStories.playerHit[Math.floor(Math.random() * eventStories.playerHit.length)];
                updateStoryDialog(randomPlayerHitStory, true);
                
                // Update battle stats - increment hits landed for the shooter
                if (data.shooterId !== undefined) {
                    const playerIds = Object.keys(gameState.players).sort();
                    const isTomShooter = data.shooterId === playerIds[0];
                    
                    if (isTomShooter) {
                        gameState.battleStats.tom.hitsLanded++;
                    } else {
                        gameState.battleStats.garfield.hitsLanded++;
                    }
                    
                    // Update the stats display
                    updateBattleStats();
                }
            }
            break;
            
        case 'npcHit':
            // Play hit sound when an NPC is hit (same as player hit sound)
            soundEffects.hit.currentTime = 0;
            soundEffects.hit.play().catch(e => console.log('Error playing hit sound:', e));
            
            // Add visual hit effect for the NPC
            if (data.npcId !== undefined) {
                gameState.npcHitEffects[data.npcId] = {
                    jumpOffset: 15, // Initial jump height
                    flashIntensity: 1.0, // Full red flash
                    duration: 20 // Effect duration in frames
                };
                
                // Add story event
                const randomNpcHitStory = eventStories.npcHit[Math.floor(Math.random() * eventStories.npcHit.length)];
                updateStoryDialog(randomNpcHitStory, true);
            }
            break;
            
        case 'wallHit':
            // Play custom wall hit sound
            createWallHitSound();
            break;
            
        case 'wallDestroyed':
            // Update battle stats for wall destruction
            if (data.playerId !== undefined) {
                const playerIds = Object.keys(gameState.players).sort();
                const isTomDestroyer = data.playerId === playerIds[0];
                const wallValue = 100; // Economic value of a wall
                
                if (isTomDestroyer) {
                    gameState.battleStats.tom.wallsDestroyed++;
                    gameState.battleStats.tom.economicDamage += wallValue;
                } else {
                    gameState.battleStats.garfield.wallsDestroyed++;
                    gameState.battleStats.garfield.economicDamage += wallValue;
                }
                
                // Update the stats display
                updateBattleStats();
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
    
    // Play shoot sound
    soundEffects.shoot.currentTime = 0;
    soundEffects.shoot.play().catch(e => console.log('Error playing shoot sound:', e));
    
    // Update furball count for the shooter
    const playerIds = Object.keys(gameState.players).sort();
    const isTomShooter = gameState.localPlayer === playerIds[0];
    
    if (isTomShooter) {
        gameState.battleStats.tom.furballsFired++;
    } else {
        gameState.battleStats.garfield.furballsFired++;
    }
    
    // Update the stats display
    updateBattleStats();
    
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
    // Determine if the local player is Tom or Garfield
    const playerIds = Object.keys(gameState.players).sort();
    const isTom = gameState.localPlayer === playerIds[0];
    
    // Update status text to show character and game status
    if (gameState.isIt) {
        playerStatus.textContent = `You're ${isTom ? 'Tom' : 'Garfield'} - IT'S YOUR TURN!`;
    } else {
        playerStatus.textContent = `You're ${isTom ? 'Tom' : 'Garfield'} - Run away!`;
    }
}

function drawKitty(x, y, rotation, health) {
    const playerId = Object.keys(gameState.players).find(id => 
        gameState.players[id].x === x && gameState.players[id].y === y);
    
    // Get hit effect for this player if it exists
    const hitEffect = gameState.playerHitEffects[playerId] || null;
    
    // Calculate position with jump offset if hit
    const yOffset = hitEffect ? -hitEffect.jumpOffset : 0;
    
    // Determine character based on player ID
    // Use the first player to join as Tom, second as Garfield
    // This ensures consistent character assignment across all clients
    const playerIds = Object.keys(gameState.players).sort();
    const isTom = playerId === playerIds[0]; // First player is Tom
    
    ctx.save();
    ctx.translate(x + PLAYER_SIZE/2, y + PLAYER_SIZE/2 + yOffset); // Apply jump offset
    ctx.rotate(rotation);
    
    if (isTom) {
        // Draw Tom (gray cat from Tom and Jerry)
        // Body (circular)
        ctx.beginPath();
        ctx.fillStyle = '#A9A9A9'; // Gray color for Tom
        ctx.arc(0, 0, PLAYER_SIZE/2, 0, Math.PI * 2);
        ctx.fill();
        
        // Ears
        ctx.beginPath();
        ctx.moveTo(-5, -PLAYER_SIZE/2);
        ctx.lineTo(-15, -PLAYER_SIZE/2 - 10);
        ctx.lineTo(-25, -PLAYER_SIZE/2);
        ctx.fillStyle = '#A9A9A9';
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(5, -PLAYER_SIZE/2);
        ctx.lineTo(15, -PLAYER_SIZE/2 - 10);
        ctx.lineTo(25, -PLAYER_SIZE/2);
        ctx.fill();
        
        // Inner ears
        ctx.beginPath();
        ctx.moveTo(-10, -PLAYER_SIZE/2 - 2);
        ctx.lineTo(-15, -PLAYER_SIZE/2 - 8);
        ctx.lineTo(-20, -PLAYER_SIZE/2 - 2);
        ctx.fillStyle = '#FFC0CB'; // Pink inner ears
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(10, -PLAYER_SIZE/2 - 2);
        ctx.lineTo(15, -PLAYER_SIZE/2 - 8);
        ctx.lineTo(20, -PLAYER_SIZE/2 - 2);
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
        ctx.fillStyle = '#FFC0CB'; // Pink nose
        ctx.beginPath();
        ctx.arc(0, 2, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Whiskers
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1.5;
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
        
        // Add a small indicator if this is the local player
        if (playerId === gameState.localPlayer) {
            ctx.fillStyle = '#4CAF50'; // Green indicator
            ctx.beginPath();
            ctx.arc(0, -PLAYER_SIZE/2 - 5, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
    } else {
        // Draw Garfield (orange cat)
        // Body (circular)
        ctx.beginPath();
        ctx.fillStyle = '#FF8C00'; // Dark orange for Garfield
        ctx.arc(0, 0, PLAYER_SIZE/2, 0, Math.PI * 2);
        ctx.fill();
        
        // Ears
        ctx.beginPath();
        ctx.moveTo(-5, -PLAYER_SIZE/2);
        ctx.lineTo(-15, -PLAYER_SIZE/2 - 8);
        ctx.lineTo(-25, -PLAYER_SIZE/2);
        ctx.fillStyle = '#FF8C00';
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(5, -PLAYER_SIZE/2);
        ctx.lineTo(15, -PLAYER_SIZE/2 - 8);
        ctx.lineTo(25, -PLAYER_SIZE/2);
        ctx.fill();
        
        // Face
        // Eyes
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(-8, -5, 6, 0, Math.PI * 2);
        ctx.arc(8, -5, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Pupils - half-closed lazy eyes for Garfield
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(-8, -3, 3, 0, Math.PI, true);
        ctx.arc(8, -3, 3, 0, Math.PI, true);
        ctx.fill();
        
        // Nose
        ctx.fillStyle = '#FF6347'; // Red-orange nose
        ctx.beginPath();
        ctx.arc(0, 2, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Mouth - Garfield's smirk
        ctx.strokeStyle = '#8B4513'; // Dark brown
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 8, 8, 0.2 * Math.PI, 0.8 * Math.PI);
        ctx.stroke();
        
        // Whiskers
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1.5;
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
        
        // Garfield's stripes
        ctx.strokeStyle = '#8B4513'; // Dark brown
        ctx.lineWidth = 2;
        ctx.beginPath();
        // Back stripes
        ctx.moveTo(-15, -10);
        ctx.lineTo(-5, -10);
        ctx.moveTo(-18, 0);
        ctx.lineTo(-8, 0);
        ctx.moveTo(-15, 10);
        ctx.lineTo(-5, 10);
        ctx.stroke();
        
        // Add a small indicator if this is the local player
        if (playerId === gameState.localPlayer) {
            ctx.fillStyle = '#4CAF50'; // Green indicator
            ctx.beginPath();
            ctx.arc(0, -PLAYER_SIZE/2 - 5, 3, 0, Math.PI * 2);
            ctx.fill();
        }
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
        
        if (anim.type === 'smoke') {
            // Draw smoke particle
            ctx.beginPath();
            ctx.fillStyle = anim.color;
            ctx.arc(anim.x, anim.y, anim.size, 0, Math.PI * 2);
            ctx.fill();
        } else if (anim.type === 'debris') {
            // Draw debris particle
            ctx.fillStyle = anim.color;
            ctx.fillRect(anim.x - anim.size/2, anim.y - anim.size/2, anim.size, anim.size);
        }
    });
    
    // Reset global alpha
    ctx.globalAlpha = 1.0;
}

// Add a function to update NPC hit effects
function updateNPCHitEffects() {
    // Update each NPC hit effect
    Object.keys(gameState.npcHitEffects).forEach(npcId => {
        const effect = gameState.npcHitEffects[npcId];
        
        // Decrease duration
        effect.duration--;
        
        // Update jump offset (create a bouncing effect)
        effect.jumpOffset = Math.max(0, effect.jumpOffset - 1.5);
        
        // Update flash intensity (fade out)
        effect.flashIntensity = effect.duration / 20; // Fade based on remaining duration
        
        // Remove effect when duration is over
        if (effect.duration <= 0) {
            delete gameState.npcHitEffects[npcId];
        }
    });
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
    "The eternal chase between Tom and Garfield continues...",
    "Two cats, locked in a never-ending game of cat and... cat.",
    "Legend says their rivalry began over the last can of tuna.",
    "Today, they battle once again in the maze of brick walls.",
    "Who will emerge victorious? Only time will tell..."
];

// Event-based story elements
const eventStories = {
    playerHit: [
        "OUCH! That's gotta hurt!",
        "A direct hit! The fur flies!",
        "That furball found its mark!",
        "A painful reminder that cats aren't invincible."
    ],
    wallDestroyed: [
        "The wall crumbles to dust! A new path opens.",
        "CRASH! Another wall bites the dust.",
        "The brick wall is no more. Onward!",
        "With a satisfying crumble, the wall is destroyed."
    ],
    npcHit: [
        "The innocent bystander takes a hit!",
        "Collateral damage! The NPC won't forget this.",
        "Wrong target! The NPC wasn't even involved in this feud.",
        "The NPC winces in pain. This isn't their fight!"
    ],
    regenerateWalls: [
        "The maze reshapes itself! New challenges await.",
        "The walls have returned, stronger than before.",
        "A new labyrinth forms around the battling cats.",
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
const battleStatsDisplay = document.createElement('div');
battleStatsDisplay.id = 'battle-stats';
battleStatsDisplay.style.position = 'absolute';
battleStatsDisplay.style.bottom = '120px'; // Position above the story dialog
battleStatsDisplay.style.left = '50%';
battleStatsDisplay.style.transform = 'translateX(-50%)';
battleStatsDisplay.style.width = '80%';
battleStatsDisplay.style.padding = '10px';
battleStatsDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
battleStatsDisplay.style.color = 'white';
battleStatsDisplay.style.borderRadius = '5px';
battleStatsDisplay.style.border = '2px solid #4CAF50';
battleStatsDisplay.style.fontFamily = "'Courier New', monospace";
battleStatsDisplay.style.fontSize = '14px';
battleStatsDisplay.style.zIndex = '99';
battleStatsDisplay.style.display = 'flex';
battleStatsDisplay.style.justifyContent = 'space-between';

// Create stats sections for each cat
const tomStats = document.createElement('div');
tomStats.id = 'tom-stats';
tomStats.style.flex = '1';
tomStats.style.borderRight = '1px solid #4CAF50';
tomStats.style.padding = '0 10px';
tomStats.innerHTML = `
    <h3 style="color: #A9A9A9; margin: 0 0 5px 0; text-align: center;">Tom's Stats</h3>
    <div style="display: flex; flex-direction: column; gap: 3px;">
        <div>Walls Destroyed: <span id="tom-walls">0</span></div>
        <div>Economic Damage: $<span id="tom-damage">0</span></div>
        <div>Hits Landed: <span id="tom-hits">0</span></div>
        <div>Furballs Fired: <span id="tom-furballs">0</span></div>
    </div>
`;

const garfieldStats = document.createElement('div');
garfieldStats.id = 'garfield-stats';
garfieldStats.style.flex = '1';
garfieldStats.style.padding = '0 10px';
garfieldStats.innerHTML = `
    <h3 style="color: #FF8C00; margin: 0 0 5px 0; text-align: center;">Garfield's Stats</h3>
    <div style="display: flex; flex-direction: column; gap: 3px;">
        <div>Walls Destroyed: <span id="garfield-walls">0</span></div>
        <div>Economic Damage: $<span id="garfield-damage">0</span></div>
        <div>Hits Landed: <span id="garfield-hits">0</span></div>
        <div>Furballs Fired: <span id="garfield-furballs">0</span></div>
    </div>
`;

// Add stats sections to the display
battleStatsDisplay.appendChild(tomStats);
battleStatsDisplay.appendChild(garfieldStats);

// Add the battle stats display to the document
document.body.appendChild(battleStatsDisplay);

// Function to update battle stats display
function updateBattleStats() {
    // Update Tom's stats
    document.getElementById('tom-walls').textContent = gameState.battleStats.tom.wallsDestroyed;
    document.getElementById('tom-damage').textContent = gameState.battleStats.tom.economicDamage;
    document.getElementById('tom-hits').textContent = gameState.battleStats.tom.hitsLanded;
    document.getElementById('tom-furballs').textContent = gameState.battleStats.tom.furballsFired;
    
    // Update Garfield's stats
    document.getElementById('garfield-walls').textContent = gameState.battleStats.garfield.wallsDestroyed;
    document.getElementById('garfield-damage').textContent = gameState.battleStats.garfield.economicDamage;
    document.getElementById('garfield-hits').textContent = gameState.battleStats.garfield.hitsLanded;
    document.getElementById('garfield-furballs').textContent = gameState.battleStats.garfield.furballsFired;
}

function gameLoop() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    drawBackground();
    
    // Handle input
    handleInput();
    
    // Update animations
    updateAnimations();
    
    // Update NPC hit effects
    updateNPCHitEffects();
    
    // Update player hit effects
    updatePlayerHitEffects();
    
    // Draw walls
    if (gameState.walls) {
        gameState.walls.forEach(wall => {
            drawWall(wall);
        });
    }
    
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
    
    // Draw animations (on top of other elements)
    drawAnimations();
    
    // Update battle stats display periodically
    updateBattleStats();
    
    requestAnimationFrame(gameLoop);
}

// Start the game when images are loaded
Promise.all([
    new Promise(resolve => npcSprite.onload = resolve),
    new Promise(resolve => backgroundImage.onload = resolve)
]).then(() => {
    // Start background music when game loads
    bgMusic.play().catch(error => {
        console.log('Audio autoplay was prevented. Click the music button to start audio.');
        musicPlaying = false;
        document.getElementById('toggleMusic').textContent = 'Music: OFF';
        document.getElementById('toggleMusic').style.background = '#F44336';
    });

gameLoop();
});
