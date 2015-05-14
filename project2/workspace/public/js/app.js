// enum
var red = 1, blue = 2, empty = 3;
var turn = red;
var isOver = false;
var socket = io();
//socket.emit('assignToken', turn);

function updateGrid(moveJSON, isBroadcast) {
    if(moveJSON.valid) {
        if(moveJSON.turn === red) {
            $("#" + moveJSON.move).addClass("piece").addClass("red");
            if(isBroadcast === true) {
                turn = blue;
            }
        } else {
            $("#" + moveJSON.move).addClass("piece").addClass("blue");
            if(isBroadcast === true) {
                turn = red;
                //setInterval(computermove(),10000);
            }

        }
    } 
}

//disable the ability to click on the grid
function blockClick() {
    $(".piece").css( 'pointer-events', 'none' );
}

socket.on('move', function(moveJSON) {
    //var isBroadcast = true;
    if(moveJSON.valid) {
        updateGrid(moveJSON, true);   
    }
});


socket.on('move2', function(moveJSON) {
    //var isBroadcast = false;
    if(moveJSON.valid) {      
        updateGrid(moveJSON, false);
    } else {
        window.alert("Invalid move");
    }
    
});

socket.on('winner', function(turn) {
  isOver = true;
  blockClick();
  console.log("winner is called o client side");
  $("body .message p").text("Player " + turn + " win.");
  $("body .message").append($("<button>").text("click here to play again."));
  
  $("body .message button").click(function () {
    console.log("listener of button");
    $("body .message p").text(" ");
    $("body .message button").remove();
    socket.emit("newGame");

    });
  
});

socket.on('gameOver', function() {
    isOver = true;
    blockClick();
    $("body .message p").text("Game Over. One of the players disconnected.");
});

//include a message to tell the user that the room is full
socket.on('denied', function () {
    $("body .message p").text("This room is full. You can not play.");
    blockClick();
});

socket.on('clearGrid', function() {
    console.log("clearGrid is being called ");  
    var i;
    var j;
    for (i = 0; i < 6; i++) {
            console.log( "#" + i);
            $("#0" + i).removeClass();
            $("#1" + i).removeClass();
            $("#2" + i).removeClass();
            $("#3" + i).removeClass();
            $("#4" + i).removeClass();
            $("#5" + i).removeClass();
            $("#6" + i).removeClass();
    }
});

socket.on('enablePlay', function() {
    console.log('enablePlay is being called');
    $(".piece").css( 'pointer-events', 'auto' );
    $("button").remove();
    $("body .message p").text(" ");
});


$("div.c4-control div.piece").hover(
    // hover over
    function () {
        if (turn === red) {
            $(this).addClass("red");
        } else if(turn === blue) {
            $(this).addClass("blue");
        }
    },
    // hover out
    function () {
        $(this).removeClass("red").removeClass("blue");
    }
);

/*$(this).removeClass("red").removeClass("blue");
    var moveJSON = {'color': turn, 'column':column };
    // alert("click " + JSON.stringify(moveJSON));
    socket.emit('validateMove', moveJSON);
});*/

var possiblemoves = [0,1,2,4,3,5,6];

var setTime = 10000;
//click even to drop the token
$("div.c4-control div.piece").click(function () {
    var column = parseInt($(this).attr("id"));

    setTime = 10000;
    console.log("player clicked, reset timer back to 10 secs " + setTime);
    //reset time if player makes a move.
    
    //socket.emit("timer",setTime);
    $(this).removeClass("red").removeClass("blue");
    var moveJSON = {'color': turn, 'column':column };
    // alert("click " + JSON.stringify(moveJSON));
    socket.emit('validateMove', moveJSON);
});

//if no button is click set start the timer countdown


//setInterval(computermove,setTime);
console.log("now entering the computer move " + setTime);
function computermove(){
    
    var compmove = Math.floor((Math.random()* possiblemoves.length));
    var compChoice = possiblemoves[compmove];
    console.log("this is random comp move " + compChoice);
    $(this).removeClass("red").removeClass("blue");
    var moveJSON = {'color': turn, 'column':compChoice };
    // alert("click " + JSON.stringify(moveJSON));
    if(!isOver) {
        socket.emit('validateMove', moveJSON);
    
    }
    
};
