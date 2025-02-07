const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 600;
canvas.height = 400;

const socket = new WebSocket("https://lovely-dependent-ability-ki573.replit.app/");

let player = { x: 100, y: 100, width: 20, height: 20, color: "blue", isIt: false };
let opponent = { x: 300, y: 200, width: 20, height: 20, color: "red", isIt: true };
let playerId = null;
let gameStarted = false;

socket.onopen = () => {
    document.getElementById("status").innerText = "Connected! Waiting for another player...";
};

socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === "assign") {
        playerId = data.id;
        player.isIt = data.isIt;
        player.color = player.isIt ? "red" : "blue";
    }

    if (data.type === "update") {
        opponent = data.opponent;
        gameStarted = true;
        document.getElementById("status").innerText = player.isIt ? "You're IT! Tag the other player!" : "Run!";
    }

    if (data.type === "tag") {
        player.isIt = data.isIt;
        opponent.isIt = !data.isIt;
        player.color = player.isIt ? "red" : "blue";
        document.getElementById("status").innerText = player.isIt ? "You're IT! Tag the other player!" : "Run!";
    }
};

const keys = {};
window.addEventListener("keydown", (e) => keys[e.key] = true);
window.addEventListener("keyup", (e) => keys[e.key] = false);

function update() {
    let speed = 4;
    if (keys["ArrowUp"]) player.y -= speed;
    if (keys["ArrowDown"]) player.y += speed;
    if (keys["ArrowLeft"]) player.x -= speed;
    if (keys["ArrowRight"]) player.x += speed;

    if (player.x < 0) player.x = 0;
    if (player.y < 0) player.y = 0;
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
    if (player.y + player.height > canvas.height) player.y = canvas.height - player.height;

    if (gameStarted) {
        socket.send(JSON.stringify({ type: "move", player }));
        
        // Check for tag
        if (player.isIt && Math.abs(player.x - opponent.x) < 20 && Math.abs(player.y - opponent.y) < 20) {
            socket.send(JSON.stringify({ type: "tag" }));
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);

    ctx.fillStyle = opponent.color;
    ctx.fillRect(opponent.x, opponent.y, opponent.width, opponent.height);
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
