var express = require('express');
var session = require('express-session');
var app = express();
var http = require('http').Server(app);
var bodyParser = require('body-parser');
var io = require('socket.io')(http);
var mongoose = require('mongoose');

app.use(session({secret: 'cpsc473section1', saveUninitialized: true, resave: true}));

var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId; //id for each item inserted

var User = mongoose.model('User', new Schema({
	id: ObjectId,
	firstname: String,
	lastname: String,
	email: {type: String, unique: true},
	password: String,
	wins: Number,
	lose: Number,
	tie: Number
}));


//connect to databse akhil
mongoose.connect('mongodb://localhost/akhil');

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));

app.use('/css', express.static(__dirname + '/public/css'));
app.use('/js', express.static(__dirname + '/public/js'));

// enum
var red = 1, blue = 2, empty = 3;
var turn = red;
//keep track of moves 
var columns = [[], [], [], [], [], [], []];
var height = [5, 5, 5, 5, 5, 5, 5];

var users = [];
var index = 0;
var maxUsers = 0;
var newClickedNewGame = 0;

// http://codeforgeek.com/2014/09/manage-session-using-node-js-express-4/
var sess;

io.on('connection', function(socket) {
    
    socket.on('join', function(gameid) {
		socket.join(gameid);
        socket.room = gameid;
        socket.broadcast.in(socket.room).emit('join', red);
    });
    
    
    console.log('a user connected');
    users[maxUsers] = socket.id;
    console.log("socket id: ");
    console.log(socket.id);
    
    
    socket.on('disconnect', function() {
        //if one of the payers disconnect, game is over
        console.log("a user disconnected");
        if( socket.id === users[0]  || socket.id === users[1] ){
            console.log("GAME OVER!");
            socket.broadcast.emit('gameOver');
            //socket.emit('gameOver');
        }
        maxUsers--;
    });
    
    socket.on('enablePlay', function() {
    	io.emit('enablePlay');	
    });
    
//call the event to disable playing for other users
    if(maxUsers > 2) {
        socket.emit('denied');
    }

    socket.on('validateMove', function(moveJSON) {
        console.log("move of validate move")
    	console.log(JSON.stringify(moveJSON));
    	
    	if(moveJSON.color === turn && height[moveJSON.column] > -1) {
    		//x is the column
    		var x = moveJSON.column;
    		//y is row
    		var y = height[moveJSON.column];
    		var move = x.toString() + y.toString();
    		
    		var responseJSON = {'turn':turn, 'valid':true, 'move':move};
    		console.log("RESPONSE:" + JSON.stringify(responseJSON));
    		//check move status;
			moveStatus(turn,x,y);
    		socket.broadcast.emit('move', responseJSON);
    		socket.emit('move2', responseJSON);
            

    		height[moveJSON.column]--;
    		
    		if(turn === red) {
    			turn = blue;
    		} else if(turn === blue) {
    			turn = red;
    		}
    		
    	} else {
    		var responseJSON = {'turn':turn, 'valid':false};
    		console.log("RESPONSE:" + JSON.stringify(responseJSON));
    		
    		socket.broadcast.emit('move', responseJSON);
            socket.emit('move2', responseJSON);
    	}
    });

    socket.on("newGame", function() {
    	
    	console.log('This is user 0 ' + users[0]);
    	console.log('This is user 1 ' + users[1]);
        console.log("begginning of the newGame");
            clearGrid();
            socket.broadcast.emit('clearGrid');
            socket.emit('clearGrid');
            
            //I had to do this if statement cause this method doens't work to send a message to itself
            //enable click for two users:
            if(socket.id == users[0]) {

                socket.broadcast.to(users[1]).emit('enablePlay');
            } else {
                socket.broadcast.to(users[0]).emit('enablePlay');
            }

            socket.emit('enablePlay');
      
        
    });

    //logic of game source http://www.codecademy.com/Smwaters/codebits/Uln4W/edit
    //movestatus
    var moveStatus = function(turn,col,row){
   
        columns[col].push(turn);
        if(winner(turn,col,row)){
            console.log("player " + turn + " wins");
            console.log("winner on server side");
            socket.broadcast.emit('winner',turn);
            socket.emit('winner',turn);
        }
        if(columns[col].length === 6){
            checkForDraw();
        }
    };
    
    // Forward
    socket.on('joinGame', function() {
    	socket.emit('joinGame');
    });
    
    
  
});

app.get('/', function(req, res) {
	res.render('login', {"pagetitle": "Login"});
});


app.post('/login', function(req, res) {
	
	User.findOne({email: req.body.email}, function(err, user) {
		if(!user){
			res.render('login', {"pagetitle": "Login", error: "Invalid email or password"});
		} else {
			if(req.body.password === user.password){
				sess=req.session;
				
				//In this we are assigning email to sess.email variable.
				//email comes from HTML page.
				sess.user = user;
				
				res.redirect('/rooms');
			} else {
				res.render('login', {"pagetitle": "Login", error: "Invalid email or password"});
			}
		}
	});
});

app.get('/logout',function(req,res){
	req.session.destroy(function(err) {
		if(err){
			console.log(err);
		} else {
			res.redirect('/');
		}
	});
});

app.get('/rooms', function(req, res) {
	sess=req.session;
	//Session set when user Request our app via URL
	
	if(sess.user)
	{
		res.render('rooms', {"pagetitle": "Game Rooms", user:sess.user});
	}
	else{
		res.redirect('/');
	}
});

app.post('/create', function(req, res) {
    /* initalizing a game state */
	//var newgamestr = JSON.stringify(gameStartingState);
	//var newgame = JSON.parse(newgamestr);
	
	//var gameid = nextGameid;
	//nextGameid += 1;
	
	//games[gameid] = newgame;
	
	//io.emit('newRoom', gameid);
	io.emit('newRoom');
	
	//res.redirect('/game/' + gameid.toString())
	//res.redirect('/connect4/')
	res.render('connect4', {"pagetitle": "Play Connect4"});
	
	//res.send('<a href="/game/' + gameid.toString() + '">Start</a>');
	//res.end();
});

app.get('/register',function(req,res){
	res.render('register', {"pagetitle": "Sign Up!"});
});

app.get('/connect4', function(req, res) {
	sess = req.session;
    if(sess.user) {
        maxUsers++;
        io.emit('joinC4');
        console.log('joinC4');
        res.render('connect4', {"pagetitle" : "Connect4", user:sess.user});
    } else {
        res.redirect("/");
    }
});

app.post('/register',function(req,res){
	var user = new User({
		firstname: req.body.firstname,
		lastname: req.body.lastname,
		email: req.body.email,
		password: req.body.password
	});
	
	console.log(req.body);

	user.save(function(err){
		if(err){
			var error= "Something went wrong";
			if(err.code === 11000){
				error = 'That e mail is already taken';
			}

			res.render('register', {pagetitle: "Register", error: error});

		} else {
			res.redirect('/');
		}
	});
});

//locate the move made
var locate = function(turn, col, row) {
	
//	row = 5-row1;
	//console.log("this is col " + col);
	//console.log("this is row " + row);
    if((col < 0) || (col > 6)) return false;
    if((row < 0) || (row > 6 - 1)) return false;
    if(columns[col].length < (row + 1)) return false;
    return (columns[col][row] === turn);
};

//check for win
var winner = function(turn, col, row1) {
	console.log("checking for win");
	var row = 5-row1;
    if(!locate(turn, col, row)) return false;
    var direct = [[1,0], [1,1], [0,1], [1,-1]];
    var matches = 0;
    for(var i = 0; i < 4; i++) {
        for(var j = 1; ; j++)
            if(locate(turn, col+j*direct[i][0], row+j*direct[i][1])){
                matches++;
   				console.log("checking for matches" + matches);
            }
            else break;
        for(var j = 1; ; j++)
            if(locate(turn, col-j*direct[i][0], row-j*direct[i][1]))
                matches++;
            else break;
        if(matches >= 3) return true;
        matches = 0;
    }
    return false;
};


var checkForDraw = function() {
    for(var i = 0; i < columns.length; i++)
        if(columns[i].length < 6)
            return;
    var draw = "Game is a Draw!";
    io.emit('Draw', draw);
    console.log("Game is a Draw!");
};


var clearGrid = function () {
	console.log("cleargrid being called");
    newClickedNewGame = 0;
    turn = red; 
    columns = [[], [], [], [], [], [], []];
    height = [5, 5, 5, 5, 5, 5, 5];
};

var server = http.listen(3000, function() {
    console.log('locahost:3000');
});

/*var server = http.listen(process.env.PORT, process.env.IP, function() {
	console.log('Cloud9');
});*/
