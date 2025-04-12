// Three.js setup
let scene, camera, renderer, controls;
let iceRink, skater1, skater2;
let mixer1, mixer2;
let clock = new THREE.Clock();
let gameState = {
    players: {},
    localPlayer: null,
    isPlayer1: false,
    animations: [],
    gameStats: {
        player1: {
            score: 0,
            jumps: 0,
            spins: 0,
            specialMoves: 0
        },
        player2: {
            score: 0,
            jumps: 0,
            spins: 0,
            specialMoves: 0
        }
    }
};

// Add physics properties to the game state
let skaterPhysics = {
    velocity: new THREE.Vector3(),
    maxSpeed: 0.5,
    acceleration: 0.02,
    deceleration: 0.01,
    braking: 0.05,
    currentSpeed: 0
};

// Add NPC properties
let npcSkaters = [];
const NPC_COLORS = [0xFFFF00, 0x00FF00, 0x00FFFF]; // Yellow, Green, Cyan
const NPC_POSITIONS = [
    { x: -15, z: -15 },
    { x: 0, z: 15 },
    { x: 15, z: -15 }
];

// Add NPC physics properties
let npcPhysics = [
    { currentSpeed: 0, direction: new THREE.Vector3(0, 0, -1), targetRotation: 0 },
    { currentSpeed: 0, direction: new THREE.Vector3(0, 0, -1), targetRotation: 0 },
    { currentSpeed: 0, direction: new THREE.Vector3(0, 0, -1), targetRotation: 0 }
];

// Add cake to game state
let cake = null;
let cakeCollected = false;

// Add birthday decorations
let confettiParticles = [];
let balloons = [];
let birthdaySigns = [];

// Initialize Three.js scene
function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue background

    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    // Initial camera position will be set in animate()
    camera.lookAt(0, 0, 0);

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.getElementById('game-container').appendChild(renderer.domElement);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 20, 10);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Create ice rink
    createIceRink();

    // Load skater models
    loadSkaterModels();

    // Remove orbit controls since we're using follow camera
    // controls = new THREE.OrbitControls(camera, renderer.domElement);
    // controls.enableDamping = true;
    // controls.dampingFactor = 0.05;

    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);

    // Add birthday decorations
    createConfetti();
    createBalloons();
    createBirthdaySigns();

    // Start animation loop
    animate();
}

// Create ice rink with fences
function createIceRink() {
    // Create ice surface
    const iceGeometry = new THREE.PlaneGeometry(50, 50);
    const iceMaterial = new THREE.MeshPhongMaterial({
        color: 0xE0FFFF,
        shininess: 100,
        side: THREE.DoubleSide
    });
    iceRink = new THREE.Mesh(iceGeometry, iceMaterial);
    iceRink.rotation.x = -Math.PI / 2;
    iceRink.receiveShadow = true;
    scene.add(iceRink);

    // Add rink border
    const borderGeometry = new THREE.RingGeometry(24, 25, 64);
    const borderMaterial = new THREE.MeshPhongMaterial({
        color: 0xFFFFFF,
        side: THREE.DoubleSide
    });
    const border = new THREE.Mesh(borderGeometry, borderMaterial);
    border.rotation.x = -Math.PI / 2;
    border.position.y = 0.01;
    scene.add(border);

    // Add fences around the rink
    const fenceHeight = 2;
    const fenceMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFFFF });
    
    // Create fence posts
    const postGeometry = new THREE.CylinderGeometry(0.2, 0.2, fenceHeight, 8);
    const postMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFFFF });
    
    // Add fence posts around the perimeter
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 16) {
        const x = Math.cos(angle) * 25;
        const z = Math.sin(angle) * 25;
        
        const post = new THREE.Mesh(postGeometry, postMaterial);
        post.position.set(x, fenceHeight / 2, z);
        scene.add(post);
    }
    
    // Add horizontal fence rails along the edges
    const railLength = 50;
    const railGeometry = new THREE.CylinderGeometry(0.1, 0.1, railLength, 8);
    
    // Top rail (north)
    const topRail = new THREE.Mesh(railGeometry, fenceMaterial);
    topRail.position.set(0, fenceHeight, -25);
    topRail.rotation.z = Math.PI / 2;
    scene.add(topRail);
    
    // Bottom rail (south)
    const bottomRail = new THREE.Mesh(railGeometry, fenceMaterial);
    bottomRail.position.set(0, fenceHeight, 25);
    bottomRail.rotation.z = Math.PI / 2;
    scene.add(bottomRail);
    
    // Left rail (west)
    const leftRail = new THREE.Mesh(railGeometry, fenceMaterial);
    leftRail.position.set(-25, fenceHeight, 0);
    scene.add(leftRail);
    
    // Right rail (east)
    const rightRail = new THREE.Mesh(railGeometry, fenceMaterial);
    rightRail.position.set(25, fenceHeight, 0);
    scene.add(rightRail);

    // Load and add cake
    const loader = new THREE.GLTFLoader();
    loader.load('assets/cake.glb',
        (gltf) => {
            cake = gltf.scene;
            cake.scale.set(0.01, 0.01, 0.01); // Reduced scale 50x from 0.5
            // Position cake at a random location within the rink
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 20; // Keep cake within rink bounds
            cake.position.set(
                Math.cos(angle) * radius,
                0.5,
                Math.sin(angle) * radius
            );
            cake.castShadow = true;
            scene.add(cake);
        },
        undefined,
        (error) => {
            console.error('Error loading cake model:', error);
        }
    );
}

// Create simple skater model
function createSimpleSkater(color) {
    const group = new THREE.Group();

    // Body
    const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 8);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: color });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1;
    group.add(body);

    // Head
    const headGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const headMaterial = new THREE.MeshPhongMaterial({ color: color });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 2.5;
    group.add(head);

    // Arms
    const armGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1.5, 8);
    const armMaterial = new THREE.MeshPhongMaterial({ color: color });

    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.7, 1.5, 0);
    leftArm.rotation.z = Math.PI / 4;
    group.add(leftArm);

    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.7, 1.5, 0);
    rightArm.rotation.z = -Math.PI / 4;
    group.add(rightArm);

    // Legs
    const legGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.5, 8);
    const legMaterial = new THREE.MeshPhongMaterial({ color: color });

    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.3, 0, 0);
    leftLeg.rotation.x = Math.PI / 6;
    group.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.3, 0, 0);
    rightLeg.rotation.x = -Math.PI / 6;
    group.add(rightLeg);

    // Skates
    const skateGeometry = new THREE.BoxGeometry(0.8, 0.2, 2);
    const skateMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });

    const leftSkate = new THREE.Mesh(skateGeometry, skateMaterial);
    leftSkate.position.set(-0.3, -0.85, 0);
    group.add(leftSkate);

    const rightSkate = new THREE.Mesh(skateGeometry, skateMaterial);
    rightSkate.position.set(0.3, -0.85, 0);
    group.add(rightSkate);

    return group;
}

// Modify loadSkaterModels function to adjust NPC scales
function loadSkaterModels() {
    const loader = new THREE.GLTFLoader();

    // Try to load Japanese male dancer model for skater 1
    loader.load('assets/dance-japanese-male.glb', 
        (gltf) => {
            skater1 = gltf.scene;
            skater1.scale.set(2.5, 2.5, 2.5); // Reduced scale by 4x from 10.0
            skater1.position.set(-10, 0, 0);
            skater1.castShadow = true;
            skater1.visible = true; // Ensure visibility
            scene.add(skater1);

            // Set up animations
            mixer1 = new THREE.AnimationMixer(skater1);
            const clips = gltf.animations;
            clips.forEach(clip => {
                mixer1.clipAction(clip).play();
            });
        },
        undefined,
        (error) => {
            console.error('Error loading dance-japanese-male.glb, using simple model instead:', error);
            skater1 = createSimpleSkater(0xff0000); // Always red
            skater1.scale.set(0.5, 0.5, 0.5);
            skater1.position.set(-10, 0, 0);
            skater1.castShadow = true;
            scene.add(skater1);
        }
    );

    // Try to load ballerina model for skater 2
    loader.load('assets/the_ballerina.glb', 
        (gltf) => {
            skater2 = gltf.scene;
            skater2.scale.set(1.0, 1.0, 1.0); // Increased scale 10x
            skater2.position.set(10, 0, 0);
            skater2.castShadow = true;
            skater2.visible = true; // Ensure visibility
            scene.add(skater2);

            // Set up animations
            mixer2 = new THREE.AnimationMixer(skater2);
            const clips = gltf.animations;
            clips.forEach(clip => {
                mixer2.clipAction(clip).play();
            });
        },
        undefined,
        (error) => {
            console.error('Error loading the_ballerina.glb, using simple model instead:', error);
            skater2 = createSimpleSkater(0x0000ff); // Always blue
            skater2.scale.set(0.5, 0.5, 0.5);
            skater2.position.set(10, 0, 0);
            skater2.castShadow = true;
            scene.add(skater2);
        }
    );

    // Create NPC skaters
    for (let i = 0; i < 3; i++) {
        if (i === 0) { // First NPC (yellow) uses hype dance model
            loader.load('assets/hype_dance_free_animation.glb',
                (gltf) => {
                    const npcSkater = gltf.scene;
                    npcSkater.scale.set(2.0, 2.0, 2.0); // Increased scale 2x
                    npcSkater.position.set(NPC_POSITIONS[i].x, 0, NPC_POSITIONS[i].z);
                    npcSkater.castShadow = true;
                    npcSkater.visible = true;
                    scene.add(npcSkater);
                    npcSkaters.push(npcSkater);

                    // Set up animations
                    const mixer = new THREE.AnimationMixer(npcSkater);
                    const clips = gltf.animations;
                    clips.forEach(clip => {
                        mixer.clipAction(clip).play();
                    });
                },
                undefined,
                (error) => {
                    console.error('Error loading hype_dance_free_animation.glb, using simple model instead:', error);
                    const npcSkater = createSimpleSkater(NPC_COLORS[i]);
                    npcSkater.scale.set(0.5, 0.5, 0.5);
                    npcSkater.position.set(NPC_POSITIONS[i].x, 0, NPC_POSITIONS[i].z);
                    npcSkater.castShadow = true;
                    scene.add(npcSkater);
                    npcSkaters.push(npcSkater);
                }
            );
        } else if (i === 1) { // Second NPC (green) uses koala model
            loader.load('assets/koalakoalas_march.glb',
                (gltf) => {
                    const npcSkater = gltf.scene;
                    npcSkater.scale.set(0.01, 0.01, 0.01); // Keep koala at small scale
                    npcSkater.position.set(NPC_POSITIONS[i].x, 0, NPC_POSITIONS[i].z);
                    npcSkater.castShadow = true;
                    npcSkater.visible = true;
                    scene.add(npcSkater);
                    npcSkaters.push(npcSkater);

                    // Set up animations
                    const mixer = new THREE.AnimationMixer(npcSkater);
                    const clips = gltf.animations;
                    clips.forEach(clip => {
                        mixer.clipAction(clip).play();
                    });
                },
                undefined,
                (error) => {
                    console.error('Error loading koalakoalas_march.glb, using simple model instead:', error);
                    const npcSkater = createSimpleSkater(NPC_COLORS[i]);
                    npcSkater.scale.set(0.5, 0.5, 0.5);
                    npcSkater.position.set(NPC_POSITIONS[i].x, 0, NPC_POSITIONS[i].z);
                    npcSkater.castShadow = true;
                    scene.add(npcSkater);
                    npcSkaters.push(npcSkater);
                }
            );
        } else if (i === 2) { // Third NPC (cyan) uses Zurich male model
            loader.load('assets/zurich_3d_male_model.glb',
                (gltf) => {
                    const npcSkater = gltf.scene;
                    npcSkater.scale.set(1.5, 1.5, 1.5); // Increased scale 10x
                    npcSkater.position.set(NPC_POSITIONS[i].x, 0, NPC_POSITIONS[i].z);
                    npcSkater.castShadow = true;
                    npcSkater.visible = true; // Ensure visibility
                    scene.add(npcSkater);
                    npcSkaters.push(npcSkater);

                    // Set up animations
                    const mixer = new THREE.AnimationMixer(npcSkater);
                    const clips = gltf.animations;
                    clips.forEach(clip => {
                        mixer.clipAction(clip).play();
                    });
                },
                undefined,
                (error) => {
                    console.error('Error loading zurich_3d_male_model.glb, using simple model instead:', error);
                    const npcSkater = createSimpleSkater(NPC_COLORS[i]);
                    npcSkater.scale.set(0.5, 0.5, 0.5);
                    npcSkater.position.set(NPC_POSITIONS[i].x, 0, NPC_POSITIONS[i].z);
                    npcSkater.castShadow = true;
                    scene.add(npcSkater);
                    npcSkaters.push(npcSkater);
                }
            );
        }
    }
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    // Update animations
    if (mixer1) mixer1.update(delta);
    if (mixer2) mixer2.update(delta);

    // Update decorations
    updateDecorations(delta);

    // Update NPC behavior
    updateNPCBehavior();

    // Update camera to follow player's skater
    if (gameState.localPlayer) {
        const skater = gameState.isPlayer1 ? skater1 : skater2;
        if (skater) {
            // Position camera behind and above the skater
            const cameraOffset = new THREE.Vector3(0, 5, 10);
            const skaterPosition = skater.position.clone();
            const skaterRotation = skater.rotation.y;
            
            // Calculate camera position based on skater's position and rotation
            cameraOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), skaterRotation);
            camera.position.copy(skaterPosition).add(cameraOffset);
            
            // Make camera look at the skater
            camera.lookAt(skaterPosition);
        }
    }

    // Render scene
    renderer.render(scene, camera);
}

// Initialize WebSocket connection
const socket = new WebSocket('https://3ba440f4-f292-4905-9d9f-527f81074ff7-00-30pdhdek6zv36.pike.replit.dev/');

socket.onopen = () => {
    console.log('Connected to server');
};

socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    switch(data.type) {
        case 'init':
            gameState.localPlayer = data.playerId;
            gameState.isPlayer1 = data.isPlayer1;
            updatePlayerStatus();
            break;

        case 'gameState':
            gameState.players = data.players;
            updateSkaterPositions();
            break;

        case 'playerScore':
            updateScore(data.playerId, data.score);
            break;

        case 'playerJump':
            playJumpAnimation(data.playerId);
            break;

        case 'playerSpin':
            playSpinAnimation(data.playerId);
            break;
    }
};

// Handle keyboard input
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    handleInput();
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Modify handleInput to fix jump and spin functionality
function handleInput() {
    if (!gameState.localPlayer) return;

    const turnSpeed = 0.05;
    const skater = gameState.isPlayer1 ? skater1 : skater2;

    // Get skater's forward direction
    const skaterDirection = new THREE.Vector3(0, 0, -1);
    skaterDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), skater.rotation.y);

    if (keys['ArrowUp']) {
        // Accelerate forward
        skaterPhysics.currentSpeed = Math.min(
            skaterPhysics.currentSpeed + skaterPhysics.acceleration,
            skaterPhysics.maxSpeed
        );
    } else if (keys['ArrowDown']) {
        // Brake
        skaterPhysics.currentSpeed = Math.max(
            skaterPhysics.currentSpeed - skaterPhysics.braking,
            0
        );
    } else {
        // Natural deceleration when no keys are pressed
        skaterPhysics.currentSpeed = Math.max(
            skaterPhysics.currentSpeed - skaterPhysics.deceleration,
            0
        );
    }

    if (keys['ArrowLeft']) {
        // Turn left
        skater.rotation.y += turnSpeed;
    }
    if (keys['ArrowRight']) {
        // Turn right
        skater.rotation.y -= turnSpeed;
    }
    if (keys[' ']) { // Space for jump
        playJumpAnimation(gameState.localPlayer);
        socket.send(JSON.stringify({
            type: 'jump',
            playerId: gameState.localPlayer
        }));
    }
    if (keys['Shift']) { // Shift for spin
        playSpinAnimation(gameState.localPlayer);
        socket.send(JSON.stringify({
            type: 'spin',
            playerId: gameState.localPlayer
        }));
    }

    // Apply movement based on current speed and direction
    if (skaterPhysics.currentSpeed > 0) {
        const movement = skaterDirection.clone().multiplyScalar(skaterPhysics.currentSpeed);
        const newPosition = skater.position.clone().add(movement);
        
        // Check if new position is within rink bounds
        const distanceFromCenter = Math.sqrt(newPosition.x * newPosition.x + newPosition.z * newPosition.z);
        if (distanceFromCenter < 24) { // Keep skaters inside the fence
            skater.position.copy(newPosition);
        }
    }

    // Check for cake collection
    if (cake && !cakeCollected) {
        const distanceToCake = skater.position.distanceTo(cake.position);
        if (distanceToCake < 2) {
            cakeCollected = true;
            scene.remove(cake);
            // Update score
            const isPlayer1 = gameState.isPlayer1;
            gameState.gameStats[isPlayer1 ? 'player1' : 'player2'].score += 10;
            updateScore(gameState.localPlayer, gameState.gameStats[isPlayer1 ? 'player1' : 'player2'].score);
            
            // Send score update to server
            socket.send(JSON.stringify({
                type: 'score',
                playerId: gameState.localPlayer,
                score: gameState.gameStats[isPlayer1 ? 'player1' : 'player2'].score
            }));
        }
    }

    // Send position update to server
    socket.send(JSON.stringify({
        type: 'move',
        playerId: gameState.localPlayer,
        position: {
            x: skater.position.x,
            y: skater.position.y,
            z: skater.position.z,
            rotation: skater.rotation.y
        }
    }));
}

// Update skater positions based on server data
function updateSkaterPositions() {
    Object.entries(gameState.players).forEach(([id, player]) => {
        // Determine which skater to update based on player ID
        const isLocalPlayer = id === gameState.localPlayer;
        const isPlayer1 = id === Object.keys(gameState.players)[0]; // First player in the list is Player 1
        
        // Assign skaters based on player number, not local player status
        const skater = isPlayer1 ? skater1 : skater2;

        if (skater) {
            // Update position and rotation
            skater.position.set(player.position.x, player.position.y, player.position.z);
            skater.rotation.y = player.position.rotation;
            
            // Make sure skaters don't overlap
            const otherSkater = isPlayer1 ? skater2 : skater1;
            if (otherSkater) {
                const distance = skater.position.distanceTo(otherSkater.position);
                if (distance < 2) { // Minimum distance between skaters
                    const direction = new THREE.Vector3().subVectors(skater.position, otherSkater.position).normalize();
                    skater.position.addScaledVector(direction, 2 - distance);
                }
            }
        }
    });
}

// Add NPC behavior update function
function updateNPCBehavior() {
    npcSkaters.forEach((npc, index) => {
        const physics = npcPhysics[index];
        
        // Random movement changes
        if (Math.random() < 0.02) { // 2% chance each frame
            // Change direction
            physics.targetRotation = Math.random() * Math.PI * 2;
        }
        
        if (Math.random() < 0.01) { // 1% chance each frame
            // Random jump
            playJumpAnimation('npc' + index);
        }
        
        if (Math.random() < 0.005) { // 0.5% chance each frame
            // Random spin
            playSpinAnimation('npc' + index);
        }
        
        // Smooth rotation towards target
        const currentRotation = npc.rotation.y;
        const rotationDiff = physics.targetRotation - currentRotation;
        npc.rotation.y += rotationDiff * 0.05;
        
        // Update movement direction
        physics.direction.set(0, 0, -1);
        physics.direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), npc.rotation.y);
        
        // Random speed changes
        if (Math.random() < 0.05) { // 5% chance each frame
            physics.currentSpeed = Math.random() * 0.3; // Random speed up to 30% of max
        }
        
        // Apply movement
        if (physics.currentSpeed > 0) {
            const movement = physics.direction.clone().multiplyScalar(physics.currentSpeed);
            npc.position.add(movement);
            
            // Keep NPCs within rink bounds
            const rinkSize = 25;
            npc.position.x = Math.max(-rinkSize, Math.min(rinkSize, npc.position.x));
            npc.position.z = Math.max(-rinkSize, Math.min(rinkSize, npc.position.z));
        }
    });
}

// Modify playJumpAnimation to ensure NPCs return to ground level
function playJumpAnimation(playerId) {
    let skater;
    if (playerId.startsWith('npc')) {
        const npcIndex = parseInt(playerId.replace('npc', ''));
        skater = npcSkaters[npcIndex];
    } else {
        skater = playerId === gameState.localPlayer ? 
            (gameState.isPlayer1 ? skater1 : skater2) :
            (gameState.isPlayer1 ? skater2 : skater1);
    }

    if (skater) {
        // Store original position
        const originalY = skater.position.y;
        
        // Jump animation
        const jumpHeight = 2;
        const jumpDuration = 0.5;
        let startTime = Date.now();
        
        const animateJump = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            const progress = Math.min(elapsed / jumpDuration, 1);
            
            // Parabolic jump motion
            const jumpProgress = Math.sin(progress * Math.PI);
            skater.position.y = originalY + jumpHeight * jumpProgress;
            
            // Continue animation if not complete
            if (progress < 1) {
                requestAnimationFrame(animateJump);
            } else {
                // Ensure skater returns to ground level
                skater.position.y = originalY;
            }
        };
        
        animateJump();
    }
}

// Modify playSpinAnimation to ensure NPCs stay on ground
function playSpinAnimation(playerId) {
    let skater;
    if (playerId.startsWith('npc')) {
        const npcIndex = parseInt(playerId.replace('npc', ''));
        skater = npcSkaters[npcIndex];
    } else {
        skater = playerId === gameState.localPlayer ? 
            (gameState.isPlayer1 ? skater1 : skater2) :
            (gameState.isPlayer1 ? skater2 : skater1);
    }

    if (skater) {
        const spinDuration = 1;
        const startRotation = skater.rotation.y;
        let startTime = Date.now();
        
        const animateSpin = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            const progress = Math.min(elapsed / spinDuration, 1);
            
            // Smooth spin rotation
            skater.rotation.y = startRotation + progress * Math.PI * 2;
            
            // Continue animation if not complete
            if (progress < 1) {
                requestAnimationFrame(animateSpin);
            } else {
                // Reset rotation to original
                skater.rotation.y = startRotation;
                // Ensure skater is on ground level
                skater.position.y = 0;
            }
        };
        
        animateSpin();
    }
}

// Update score display
function updateScore(playerId, score) {
    const isPlayer1 = playerId === Object.keys(gameState.players)[0];
    const scoreElement = isPlayer1 ? document.getElementById('score1') : document.getElementById('score2');
    scoreElement.textContent = score;
}

// Update player status
function updatePlayerStatus() {
    const statusElement = document.getElementById('story-dialog');
    statusElement.textContent = gameState.isPlayer1 ? 
        "You're Skater 1 - Perform your best moves!" : 
        "You're Skater 2 - Show off your skills!";
}

// Create confetti particles
function createConfetti() {
    const confettiCount = 100;
    const confettiGeometry = new THREE.PlaneGeometry(0.2, 0.2);
    
    for (let i = 0; i < confettiCount; i++) {
        const color = new THREE.Color(
            Math.random(),
            Math.random(),
            Math.random()
        );
        const confettiMaterial = new THREE.MeshPhongMaterial({
            color: color,
            side: THREE.DoubleSide
        });
        
        const confetti = new THREE.Mesh(confettiGeometry, confettiMaterial);
        
        // Random position within the rink
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 20;
        confetti.position.set(
            Math.cos(angle) * radius,
            Math.random() * 10 + 5, // Random height between 5 and 15
            Math.sin(angle) * radius
        );
        
        // Random rotation
        confetti.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );
        
        // Add physics properties
        confetti.userData = {
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.1,
                (Math.random() - 0.5) * 0.1,
                (Math.random() - 0.5) * 0.1
            ),
            rotationSpeed: new THREE.Vector3(
                (Math.random() - 0.5) * 0.1,
                (Math.random() - 0.5) * 0.1,
                (Math.random() - 0.5) * 0.1
            )
        };
        
        scene.add(confetti);
        confettiParticles.push(confetti);
    }
}

// Create balloons
function createBalloons() {
    const balloonCount = 20;
    const balloonGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    
    for (let i = 0; i < balloonCount; i++) {
        const color = new THREE.Color(
            Math.random(),
            Math.random(),
            Math.random()
        );
        const balloonMaterial = new THREE.MeshPhongMaterial({
            color: color,
            shininess: 100
        });
        
        const balloon = new THREE.Mesh(balloonGeometry, balloonMaterial);
        
        // Position balloons around the rink
        const angle = Math.random() * Math.PI * 2;
        const radius = 22; // Just inside the fence
        balloon.position.set(
            Math.cos(angle) * radius,
            Math.random() * 3 + 2, // Random height between 2 and 5
            Math.sin(angle) * radius
        );
        
        // Add string
        const stringGeometry = new THREE.CylinderGeometry(0.02, 0.02, 1, 8);
        const stringMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFFFF });
        const string = new THREE.Mesh(stringGeometry, stringMaterial);
        string.position.y = -0.5;
        balloon.add(string);
        
        // Add physics properties
        balloon.userData = {
            floatSpeed: Math.random() * 0.02 + 0.01,
            floatHeight: balloon.position.y
        };
        
        scene.add(balloon);
        balloons.push(balloon);
    }
}

// Create birthday signs
function createBirthdaySigns() {
    const signCount = 4;
    const signGeometry = new THREE.PlaneGeometry(5, 2);
    const signMaterial = new THREE.MeshPhongMaterial({
        color: 0xFFD700,
        side: THREE.DoubleSide
    });
    
    const positions = [
        { x: -20, z: -20, rotation: Math.PI / 4 },
        { x: 20, z: -20, rotation: -Math.PI / 4 },
        { x: -20, z: 20, rotation: -Math.PI / 4 },
        { x: 20, z: 20, rotation: Math.PI / 4 }
    ];
    
    for (let i = 0; i < signCount; i++) {
        const sign = new THREE.Mesh(signGeometry, signMaterial);
        sign.position.set(positions[i].x, 3, positions[i].z);
        sign.rotation.y = positions[i].rotation;
        sign.rotation.x = Math.PI / 2;
        
        // Add text to sign
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const context = canvas.getContext('2d');
        context.fillStyle = '#FF0000';
        context.font = 'bold 48px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText('HAPPY BIRTHDAY!', 128, 64);
        
        const texture = new THREE.CanvasTexture(canvas);
        sign.material.map = texture;
        sign.material.needsUpdate = true;
        
        scene.add(sign);
        birthdaySigns.push(sign);
    }
}

// Update decorations in animation loop
function updateDecorations(delta) {
    // Update confetti
    confettiParticles.forEach(confetti => {
        // Update position
        confetti.position.add(confetti.userData.velocity);
        confetti.rotation.x += confetti.userData.rotationSpeed.x;
        confetti.rotation.y += confetti.userData.rotationSpeed.y;
        confetti.rotation.z += confetti.userData.rotationSpeed.z;
        
        // Reset position if confetti falls below ground
        if (confetti.position.y < 0) {
            confetti.position.y = 15;
            confetti.position.x = (Math.random() - 0.5) * 40;
            confetti.position.z = (Math.random() - 0.5) * 40;
        }
    });
    
    // Update balloons
    balloons.forEach(balloon => {
        // Float up and down
        balloon.position.y = balloon.userData.floatHeight + 
            Math.sin(Date.now() * 0.001 * balloon.userData.floatSpeed) * 0.5;
    });
}

// Initialize the game
init(); 