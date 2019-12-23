// alert("Hello Ken!");
/*
console.log("Hello");

var me = "Craig";

var buttonOne = document.getElementById("button-one");
// var doSomething = function(){
//   //alert("You clicked Act 1");
//   var theInstructions = document.getElementById("instruction");
//   theInstructions.innerHTML = "Yeah!! You clicked Act 1!"
// };
buttonOne.addEventListener("click", function(evt){
  console.log(evt);
  var theInstructions = document.getElementById("instruction");
  theInstructions.innerHTML = "Yeah!! You clicked Act 1!"
});

var buttonTwo = document.getElementById("button-two");
var doSomethingTwo = function(){
  var theInstructions = document.getElementById("instruction");
  theInstructions.innerHTML = "Yeah!! You clicked Act 2!"
};
buttonTwo.addEventListener("click", doSomethingTwo);

var buttonThree = document.getElementById("button-three");
var doSomethingThree = function(){
  var theInstructions = document.getElementById("instruction");
  theInstructions.innerHTML = "Yeah!! You clicked Act 3!"
};
buttonThree.addEventListener("click", doSomethingThree);
*/

$("#button-one").click(function(){
	//update page for button one
	console.log("Button One was pressed!");
	$(".content").hide();
	$("#content-one").show();
});

$("#button-two").click(function(){
	//update page for button two
	console.log("Button Two was pressed!");
	$(".content").hide();
	$("#content-two").show();
});

$("#button-three").click(function(){
	//update page for button three
	console.log("Button Three was pressed!");
	$(".content").hide();
	$("#content-three").show();
});

$("#button-four").click(function(){
	//update page for button four
	console.log("Button Four was pressed!");
	$(".content").hide();
	$("#content-four").show();
});

$("#button-five").click(function(){
	//update page for button five
	console.log("Button Five was pressed!");
	$(".content").hide();
	$("#content-five").show();
});

$("#button-six").click(function(){
	//update page for button six
	console.log("Button Six was pressed!");
	$(".content").hide();
	$("#content-six").show();
});

$("#button-seven").click(function(){
	//update page for button six
	console.log("Button Seven was pressed!");
	$(".content").hide();
	$("#content-seven").show();
});

function initMap() {
	//top-left corner coordinate
	var centerpoint = {lat: 31.2272, lng: 121.48 };
	//marker coordinate variables in order: 1 Waitan, 2 Nanjing Lu, 3 Yuyuan, 4 Xintiandi, 5 Tianzifang
	var Waitan = {lat: 31.2403, lng: 121.4906};
	var Nanjing = {lat: 31.2347, lng: 121.4749};
	var Yuyuan = {lat: 31.2272, lng: 121.4921};
	var Xintiandi = {lat: 31.2190, lng: 121.4747};
	var Tianzifang = {lat: 31.2087, lng: 121.4689};
	var map = new google.maps.Map(document.getElementById('map'), {
	  zoom: 13,
	  center: centerpoint
	});
	var marker1 = new google.maps.Marker({
	  position: Waitan,
	  map: map
	});
	var marker2 = new google.maps.Marker({
	  position: Nanjing,
	  map: map
	});
	var marker3 = new google.maps.Marker({
	  position: Yuyuan,
	  map: map
	});
	var marker4 = new google.maps.Marker({
	  position: Xintiandi,
	  map: map
	});
	var marker5 = new google.maps.Marker({
	  position: Tianzifang,
	  map: map
	});

}