var express = require('express');
var bodyParser = require('body-parser');
//var routes = require('./routes/routes');

var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongoose = require("mongoose");

app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs');

app.use('/css', express.static(__dirname + '/public/css'));
app.use('/js', express.static(__dirname + '/public/js'));

// enum
var red = 1, blue = 2, empty = 3;
var waiting = 0, ready = 1, started = 2;
var start = 0, turn = 1;

var gameid = 0;

var gameStartingState = { "playersJoined": 0,
 					"turn": red,
 					"height": [5, 5, 5, 5, 5, 5, 5],
 					"grid": [[empty,empty,empty,empty,empty,empty],
 						[empty,empty,empty,empty,empty,empty],
 						[empty,empty,empty,empty,empty,empty],
 						[empty,empty,empty,empty,empty,empty],
 						[empty,empty,empty,empty,empty,empty],
 						[empty,empty,empty,empty,empty,empty],
 						[empty,empty,empty,empty,empty,empty]] };

var games = {};

// var turn = red;

// var height = [5, 5, 5, 5, 5, 5, 5];

//set up board for connect 4 
//var grid = [[empty,empty,empty,empty,empty,empty],
//			[empty,empty,empty,empty,empty,empty],
//			[empty,empty,empty,empty,empty,empty],
//			[empty,empty,empty,empty,empty,empty],
//			[empty,empty,empty,empty,empty,empty],
//			[empty,empty,empty,empty,empty,empty],
//			[empty,empty,empty,empty,empty,empty]];
			
//console.log(grid[0][0]);
//console.log(grid[6][0]);
//console.log(grid[0][5]);
//console.log(grid[6][5]);

io.on('connection', function(socket) {
    console.log('a user connected');
    
    //socket.on('disconnect', function() {
    //    console.log('user disconnected');
    //});
    
    socket.on('start', function(gameid) {
    	console.log('on start, ' + gameid);
    	socket.emit('10', 'wtf');
    	//socket.emit(red.toString() + gameid.toString(), {"action": turn });
    	//socket.emit("11");
    	
    	console.log('emit ' + red.toString() + gameid.toString() + ', "wtf"');
    });
    
    socket.on('move', function(gamedata) {
    	console.log('on move:' + JSON.stringify(gamedata));
    });
});

    // socket.on('move', function(moveJSON) {
    // 	console.log(JSON.stringify(moveJSON));
    	
    // 	if(moveJSON.color === turn && height[moveJSON.column] < 6) {
    // 		var x = moveJSON.column;
    // 		var y = height[moveJSON.column];
    		
    // 		var move = x.toString() + y.toString();
    		
    // 		grid[x][y] = turn;
    		
    // 		console.log(grid[x][y]);
    		
    // 		var responseJSON = {'turn':turn, 'valid':true, 'move':move};
    // 		console.log("RESPONSE:" + JSON.stringify(responseJSON));
    		
    // 		socket.emit('move', responseJSON);
    		
    // 		height[moveJSON.column]--;
    		
    // 		if(turn === red) {
    // 			turn = blue;
    // 		} else if(turn === blue) {
    // 			turn = red;
    // 		}
    		
    // 	} else {
    // 		var responseJSON = {'turn':turn, 'valid':false};
    // 		console.log("RESPONSE:" + JSON.stringify(responseJSON));
    		
    // 		socket.emit('move', responseJSON);
    // 	}
    // });
//});

// app.use('/', routes);

app.get('/', function(req, res) { 
	res.send('<form method="post" action="/create"><input type="submit"></form>');
	res.end();
});

app.post('/create', function(req, res) {
	//res.render('create', {"pagetitle": "Create a Game"});
	
	// Cloning gameStatingState
	var newgamestr = JSON.stringify(gameStartingState);
	var newgame = JSON.parse(newgamestr);
	
	games[gameid.toString()] = newgame;
	
	console.log('gameid:' + gameid.toString());
	
	//var gameState = games[gamedata.gameid.toString()];

    // io.on('connection', function(socket) {
    //     console.log('a user connected');
        
    //     socket.on(gameid.toString(), function(gamedata) {
    //         console.log("event - " + gamedata.gameid.toString() + "=" + JSON.stringify(gamedata));
            
    //         var gameState = games[gamedata.gameid.toString()];
            
    //         if(gamedata.action === start) {
    //             socket.emit(gamedata.gameid.toString(), { "action": start });
    //         }
    //     });
    // });

	gameid += 1;
	
	// res.send('remote:' + req.connection.remoteAddress);
	res.send('<a href="/game/' + (gameid-1).toString() + '">Start</a>');
	res.end();
});

app.get('/game/:gameid', function(req, res) {
    
	var gameid = req.params.gameid;
	console.log("/games/" + gameid);
	
	if(games.hasOwnProperty(gameid)) {
		var game = games[gameid];

		if(game.playersJoined == 0) {
			game.playersJoined++;
			
			console.log('game:' + JSON.stringify(game));
			
			//io.emit('join', {"color":red, "status":waiting});
			res.render('connect4', {"pagetitle": "Play Connect4", "gameid": gameid, "color":red, "status":waiting });

		} else if(game.playersJoined == 1) {
		    game.playersJoined++;
		    
    		console.log('game:' + JSON.stringify(game));
    		
		    //io.emit('join', {"color":blue, "status":ready});
		    res.render('connect4', {"pagetitle": "Play Connect4", "gameid": gameid, "color":blue, "status":ready });
		    
		} else {
		    res.send("This game is full.");
		    res.end();
		}
	}
	else {
		res.send("Game not found");
		res.end();
	}
});


var server = http.listen(process.env.PORT, process.env.IP, function() {
	console.log('Cloud9');
});

/*
var server = app.listen(3000, function() {
	console.log('Listening on port 3000');
});
*/