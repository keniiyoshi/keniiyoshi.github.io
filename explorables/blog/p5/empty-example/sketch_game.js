var bgImage;
var characterImage;
var mochiImage;
var dumplingImage;

var theSoup;
var theDumplings;

var total = 10;
var timeLimit = 10;
var timer = 0;

var x = 0;
var y = 0;
var angle = 0;
var speedX = 3;
var speedY = 3;

var moving = false;
var winner = false;
var gameOver = false;

function preload() {
  bgImage = loadImage('starwars.png');
  characterImage = loadImage('xwing.png');
  mochiImage = loadImage('mochi.png');
  dumplingImage = loadImage('dumpling.png');
}

function initGame() {
  theDumplings = new Group();
  for (var i = 0; i < total; i++) {
    var oneDumpling = createSprite(random(0, width), random(0, height));
    oneDumpling.addImage(dumplingImage);
    theDumplings.add(oneDumpling);
  }
  theSoup = createSprite(width / 2, height / 2);
  theSoup.addImage(characterImage);
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(255, 180, 255);

  characterImage.resize(characterImage.width / 5, characterImage.height / 5);
  dumplingImage.resize(dumplingImage.width / 3, dumplingImage.height / 3);
  mochiImage.resize(mochiImage.width / 10, mochiImage.height / 10);
  initGame();
}

function draw() {
  background(bgImage);

  if (gameOver || winner) {
    displayEndScreen();
  } else {
    handleGameplay();
    drawOrbitingMochis();
  }
}

function displayEndScreen() {
  fill(255);
  textAlign(CENTER);
  textSize(46);
  if (gameOver) {
    text("SORRY", width / 2, 80);
  } else if (winner) {
    text("WINNER", width / 2, 80);
  }
  textSize(24);
  text("Click mouse to restart", width / 2, 120);
}

function handleGameplay() {
  theSoup.position.x = mouseX;
  theSoup.position.y = mouseY;
  noCursor();

  theSoup.overlap(theDumplings, makeDisappear);
  drawSprites();

  timer++;
  var curTime = timeLimit - floor(timer / 60);
  fill(255);
  textAlign(CENTER);
  textSize(46);
  text(curTime, width / 2, height - 60);

  if (theDumplings.length === 0) {
    winner = true;
  }
  if (curTime === 0) {
    gameOver = true;
  }
}

function drawOrbitingMochis() {
  if (x>width || x<0){
    speedX = speedX * -1;
  }
  if (y>height || y<0){
    speedY = speedY * -1;
  }
  x = x + speedX;
  y = y + speedY; 

  image(mochiImage, x - mochiImage.width / 2, y - mochiImage.height / 2);
  image(
    mochiImage,
    x - 100 * sqrt(1 - pow(sin(angle / 50), 2)) - mochiImage.width / 2,
    y - 100 * sqrt(1 - pow(cos(angle / 50), 2)) - mochiImage.height / 2
  );
  image(
    mochiImage,
    x + 100 * sqrt(1 - pow(sin(angle / 50), 2)) - mochiImage.width / 2,
    y + 100 * sqrt(1 - pow(cos(angle / 50), 2)) - mochiImage.height / 2
  );
  image(
    mochiImage,
    x - 100 * sqrt(1 - pow(sin(angle / 50), 2)) - mochiImage.width / 2,
    y + 100 * sqrt(1 - pow(cos(angle / 50), 2)) - mochiImage.height / 2
  );
  image(
    mochiImage,
    x + 100 * sqrt(1 - pow(sin(angle / 50), 2)) - mochiImage.width / 2,
    y - 100 * sqrt(1 - pow(cos(angle / 50), 2)) - mochiImage.height / 2
  );

  angle += 1;
}

function makeDisappear(collider, target) {
  console.log("Collision!");
  target.remove();
}

function mousePressed() {
  if (winner || gameOver) {
    resetGame();
  } else {
    moving = !moving;
  }
}

function resetGame() {
  winner = false;
  gameOver = false;
  timer = 0;

  theDumplings.removeSprites();
  theSoup.remove();

  total = total * 1.5;
  timer = timeLimit * 0.5;
  initGame();
}

function keyPressed() {
  if (keyCode === LEFT_ARROW) {
    speedX *= 0.9;
    speedY *= 0.9;
  } else if (keyCode === RIGHT_ARROW) {
    speedX *= 1.1;
    speedY *= 1.1;
  }
}
