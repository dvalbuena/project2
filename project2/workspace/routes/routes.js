
// Use router from express.
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var router = express.Router();

// Use the data file to find user information.
var appdata = require('../data.json');

// Start without an active user.
var currentuser = null;

// Authentication for logging in.
function authenticate(email, password) {
	// Grab the list of users and their information.
	var users = appdata.users;
	// Find the user who is logging in.

	//filter sample from stackoverflow http://stackoverflow.com/questions/2722159/javascript-how-to-filter-object-array-based-on-attributes
	var loginuser = users.filter(
		// If the user email and password both match, return true.
		function(user){ 
			return user.email === email && user.password === password 
		}
	)[0];
	// If loginuser returns undefined, return false.
	if(loginuser === undefined) {
		return false;
	}
	// Otherwise, log the user in.
	else {
		currentuser = loginuser;
		return true;
	}
}

// enum
var red = 1, blue = 2, empty = 3;
var waiting = 0, started = 1;

var gameid = 0;

var gamestate = { "playersEntered": 0,
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

io.on('connection', function(socket) {
    console.log('a user connected');
    
    socket.on('disconnect', function() {
        console.log('user disconnected');
    });
    
    socket.on('join', function(gameid) {
    	console.log("A player joined gameid " + gameid);
    });
    
    socket.on('play', function(clientdata) {
    	console.log(clientdata.gameid);
    });
});


// route to login since index do not have anything on there so when the user type in it reached into the login page
router.get('/', function(req, res) {
	res.render('login', {"pagetitle": "Login"});
});

// Route to the login page.
router.get('/login', function(req, res) {
	res.render('login', {"pagetitle": "Login"});
});

router.get('/create', function(req, res) {
	//res.render('create', {"pagetitle": "Create a Game"});
	
	games[gameid] = gamestate;

	gameid += 1;
	
	res.redirect('game/' + gameid);
});

router.get('/game/:gameid', function(req, res) {
	var gameid = req.params.gameid;
	
	res.render('connect4', {"pagetitle": "Play Connect4", "gameid": gameid });
});

router.get('/connect4', function(req, res) {
	var gameid = req.params.gameid;
	
	res.render('connect4', {"pagetitle": "Play Connect4"});
});

module.exports = router;