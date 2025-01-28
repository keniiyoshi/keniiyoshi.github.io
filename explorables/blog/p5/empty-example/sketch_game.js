let bgImage, characterImage, mochiImage, dumplingImage;
let theSoup, theDumplings;
let total = 10, timeLimit = 10, timer = 0, x = 0, y = 0, angle = 0, speedX = 3, speedY = 3;
let moving = false, winner = false, gameOver = false;

function preload() {
  bgImage = loadImage('starwars.png');
  characterImage = loadImage('xwing.png');
  mochiImage = loadImage('mochi.png');
  dumplingImage = loadImage('dumpling.png');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  [characterImage, dumplingImage, mochiImage].forEach(img => img.resize(img.width / (img === mochiImage ? 10 : img === dumplingImage ? 3 : 5), 0));
  initGame();
}

function initGame() {
  theDumplings = new Group();
  for (let i = 0; i < total; i++) {
    let oneDumpling = createSprite(random(0, width), random(0, height));
    oneDumpling.addImage(dumplingImage);
    theDumplings.add(oneDumpling);
  }
  theSoup = createSprite(width / 2, height / 2);
  theSoup.addImage(characterImage);
}

function draw() {
  background(bgImage);
  gameOver || winner ? displayEndScreen() : handleGameplay();
}

function displayEndScreen() {
  fill(255);
  textAlign(CENTER);
  textSize(46);
  text(gameOver ? "SORRY" : "WINNER", width / 2, 80);
  textSize(24);
  text("Click mouse to restart", width / 2, 120);
}

function handleGameplay() {
  theSoup.position.set(mouseX, mouseY);
  noCursor();
  theSoup.overlap(theDumplings, (_, target) => target.remove());
  drawSprites();
  updateTimer();
  drawOrbitingMochis();
}

function updateTimer() {
  timer++;
  let curTime = timeLimit - floor(timer / 60);
  fill(255);
  textAlign(CENTER);
  textSize(46);
  text(curTime, width / 2, height - 60);
  if (!theDumplings.length) winner = true;
  if (curTime === 0) gameOver = true;
}

function drawOrbitingMochis() {
  [x, y] = [x + speedX, y + speedY];
  if (x > width || x < 0) speedX *= -1;
  if (y > height || y < 0) speedY *= -1;

  let offsets = [-1, 1];
  offsets.forEach(offsetX => {
    offsets.forEach(offsetY => {
      let dx = 100 * sqrt(1 - pow(sin(angle / 50), 2)) * offsetX;
      let dy = 100 * sqrt(1 - pow(cos(angle / 50), 2)) * offsetY;
      image(mochiImage, x + dx - mochiImage.width / 2, y + dy - mochiImage.height / 2);
    });
  });
  image(mochiImage, x - mochiImage.width / 2, y - mochiImage.height / 2);
  angle++;
}

function mousePressed() {
  winner || gameOver ? resetGame() : moving = !moving;
}

function resetGame() {
  [winner, gameOver, timer] = [false, false, 0];
  theDumplings.removeSprites();
  theSoup.remove();
  total *= 1.5;
  timer = timeLimit * 0.5;
  initGame();
}

function keyPressed() {
  if (keyCode === LEFT_ARROW || keyCode === RIGHT_ARROW) {
    let factor = keyCode === LEFT_ARROW ? 0.9 : 1.1;
    speedX *= factor;
    speedY *= factor;
  }
}
