// variables for audios
var intro = document.getElementById("intro"); 
var waitan = document.getElementById("tatooine");
var tianzifang = document.getElementById("revealed");
var nanjing = document.getElementById("training");
var yuyuan = document.getElementById("lift");
var xintiandi = document.getElementById("seeing");
var finale = document.getElementById("throneroom");
var about = document.getElementById("endroll");

//boolean variables for custom ending, assuming INTJ are all true (ESFP are all false)
var I=true;
var N=true;
var T=true;
var J=true;

// volume setting is magic number
intro.volume = 0.1;//standard
waitan.volume = 0.3;//raised
tianzifang.volume = 1.0;//raised a lot
nanjing.volume = 1.0;//raised a lot
yuyuan.volume = 1.0;//raised a lot
xintiandi.volume = 0.3;//raised 
finale.volume = 0.2;//raised
about.volume = 0.2;//raised

// initial scene- play music, hide audio button, hide all content except content-zero.
intro.play(); 
$("#intro").hide();
$(".content").hide();
$("#content-zero").show();

function ending() {
	// have the logic for showing 1 of the 16 endings. In order listed in the index.html file
	// INTJ
	if (I==true && N==true && T==true && J==true){
		$(".end").hide();
		$("#INTJ").show();
	}
	//INTP
	if (I==true && N==true && T==true && J==false){
		$(".end").hide();
		$("#INTP").show();
	}
	//ENTJ
	if (I==false && N==true && T==true && J==true){
		$(".end").hide();
		$("#ENTJ").show();
	}
	//ENTP
	if (I==false && N==true && T==true && J==false){
		$(".end").hide();
		$("#ENTP").show();
	}
	//INFJ
	if (I==true && N==true && T==false && J==true){
		$(".end").hide();
		$("#INFJ").show();
	}
	//INFP
	if (I==true && N==true && T==false && J==false){
		$(".end").hide();
		$("#INFP").show();
	}
	//ENFJ
	if (I==false && N==true && T==false && J==true){
		$(".end").hide();
		$("#ENFJ").show();
	}
	//ENFP
	if (I==false && N==true && T==false && J==false){
		$(".end").hide();
		$("#ENFP").show();
	}
	//ISTJ
	if (I==true && N==false && T==true && J==true){
		$(".end").hide();
		$("#ISTJ").show();
	}
	//ISFJ
	if (I==true && N==false && T==false && J==true){
		$(".end").hide();
		$("#ISFJ").show();
	}
	//ESTJ
	if (I==false && N==false && T==true && J==true){
		$(".end").hide();
		$("#ESTJ").show();
	}
	//ESFJ
	if (I==false && N==false && T==false && J==true){
		$(".end").hide();
		$("#ESFJ").show();
	}
	//ISTP
	if (I==true && N==false && T==true && J==false){
		$(".end").hide();
		$("#ISTP").show();
	}
	//ISFP
	if (I==true && N==false && T==false && J==false){
		$(".end").hide();
		$("#ISFP").show();
	}
	//ESTP
	if (I==false && N==false && T==true && J==false){
		$(".end").hide();
		$("#ESTP").show();
	}
	//ESFP
	if (I==false && N==false && T==false && J==false){
		$(".end").hide();
		$("#ESFP").show();
	}
}

//decision menu clicks
	// About
		$("#button-start").click(function(){
			//update page for button-start
			console.log("Button-start was pressed!");
			$(".content").hide();
			$("#content-one").show();
			$("#tatooine").hide();
			intro.pause(); 
			waitan.play(); 
		});

	// Act 1
		$("#button-continue").click(function(){
			//update page for button-continue
			console.log("Button-continue was pressed!");
			$(".content").hide();
			$("#content-two").show();
			$("#revealed").hide();
			waitan.pause();
			tianzifang.play();
		});

	// Act 2
		$("#button-E").click(function(){
			//update page for button-E
			console.log("Button-E was pressed!");
			$(".content").hide();
			$("#content-three").show();
			$("#training").hide();
			tianzifang.pause();
			nanjing.play();
			I=false;
		});

		$("#button-I").click(function(){
			//update page for button-I
			console.log("Button-I was pressed!");
			$(".content").hide();
			$("#content-three").show();
			$("#training").hide();
			tianzifang.pause();
			nanjing.play();
			I=true;
		});

	// Act 3
		$("#button-S").click(function(){
			//update page for button-S
			console.log("Button-S was pressed!");
			$(".content").hide();
			$("#content-four").show();
			$("#lift").hide();
			nanjing.pause();
			yuyuan.play();
			N=false;
		});

		$("#button-N").click(function(){
			//update page for button-N
			console.log("Button-N was pressed!");
			$(".content").hide();
			$("#content-four").show();
			$("#lift").hide();
			nanjing.pause();
			yuyuan.play();
			N=true;
		});

	// Act 4
		$("#button-T").click(function(){
			//update page for button-T
			console.log("Button-T was pressed!");
			$(".content").hide();
			$("#content-five").show();
			$("#seeing").hide();
			yuyuan.pause();
			xintiandi.play();
			T=true;
		});

		$("#button-F").click(function(){
			//update page for button-F
			console.log("Button-F was pressed!");
			$(".content").hide();
			$("#content-five").show();
			$("#seeing").hide();
			yuyuan.pause();
			xintiandi.play();
			T=false;
		});

	// Act 5
		$("#button-J").click(function(){
			//update page for button-J
			console.log("Button-J was pressed!");
			$(".content").hide();
			$("#content-six").show();
			$("#throneroom").hide();
			xintiandi.pause();
			finale.play();
			J=true;
			ending();
			
		});

		$("#button-P").click(function(){
			//update page for button-P
			console.log("Button-P was pressed!");
			$(".content").hide();
			$("#content-six").show();
			$("#throneroom").hide();
			xintiandi.pause();
			finale.play();
			J=false;
			ending();
		});

	// FINALE1
		$("#button-aboutcredit").click(function(){
			//update page for button-aboutcredit
			console.log("Button-aboutcredit was pressed!");
			//show map here and keep it that way.
			$("#map").hide();
			$(".content").hide();
			$(".button-main").hide();
			$("#content-seven").show();
			$("#endroll").hide();
			finale.pause();
			about.play();
		});

	// ABOUT/Credit
		$("#button-back").click(function(){
			//update page for button-back
			console.log("Button-back was pressed!");
			$(".content").hide();
			$("#content-zero").show();
			$(".button-main").show();
			about.pause();
			intro.play();
		});