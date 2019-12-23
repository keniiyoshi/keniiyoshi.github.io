var x = 0;
var y = 0;
var angle=0;
var speedX=3;
var speedY=3;
var color=0;

var bgImage;
var characterImage;

function preload(){

  bgImage=loadImage('starwars.png');
  characterImage=loadImage('xwing.png');

}

function setup() {
  // put setup code here
  createCanvas(windowWidth,windowHeight);
  background(255,180,255);

}

//60fps- animation loop
function draw() {
  // put drawing code here
  background(bgImage);
  fill (255,100,50);
  //ellipse(mouseX,mouseY,(mouseY+50)/10, (mouseX+50)/10);

  // noStroke();
  if (mouseIsPressed) {
    fill(0);
  } else {
    fill(255);
  }
  //ellipse(mouseX,mouseY,mouseY/10, mouseX/10);

  image(characterImage,x-characterImage.width/5/2,y-characterImage.height/5/2, characterImage.width/5,characterImage.height/5);
  image(characterImage,x-100*sqrt(1-pow(sin(angle/50),2))-characterImage.width/10/2, y-100*sqrt(1-pow(cos(angle/50),2))-characterImage.height/10/2, characterImage.width/10, characterImage.height/10);
  image(characterImage,x+100*sqrt(1-pow(sin(angle/50),2))-characterImage.width/10/2, y+100*sqrt(1-pow(cos(angle/50),2))-characterImage.height/10/2, characterImage.width/10, characterImage.height/10);
  image(characterImage,x-100*sqrt(1-pow(sin(angle/50),2))-characterImage.width/10/2, y+100*sqrt(1-pow(cos(angle/50),2))-characterImage.height/10/2, characterImage.width/10, characterImage.height/10);
  image(characterImage,x+100*sqrt(1-pow(sin(angle/50),2))-characterImage.width/10/2, y-100*sqrt(1-pow(cos(angle/50),2))-characterImage.height/10/2, characterImage.width/10, characterImage.height/10);
  // ellipse(x+100*sin(x/50), y, 20, 20);
  // ellipse(x-100*sin(x/50), y+100, 20, 20);
  if (x>width || x<0){
    speedX = speedX * -1;
  }
  if (y>height || y<0){
    speedY = speedY * -1;
  }


  if (moving){
    x = x + speedX;
    y = y + speedY;    
  }

  angle=angle+1;
  color=color+0.1;
  // var a = 0.0;
  // var inc = TWO_PI / 25.0;
  // for (var i = 0; i < windowWidth/20; i++) {
  //   line(i * 20, height/2, i * 20, height/2 + sin(a) * windowHeight/2);
  //   a = a + inc;
  // }
}

var moving=false;
function mousePressed() {
  moving=!moving;
  console.log(moving);
}

function keyPressed() {
  if (keyCode === LEFT_ARROW) {
    speedX=speedX*0.9;
    speedY=speedY*0.9;

  } 
  else if (keyCode === RIGHT_ARROW) {
    speedX=speedX*1.1;
    speedY=speedY*1.1;
  }
}