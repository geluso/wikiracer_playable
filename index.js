var express = require('express');
var bodyParser = require('body-parser');
var ejsLayouts = require('express-ejs-layouts');
var session = require('express-session');
var flash = require('connect-flash');

var app = express()
var http = require('http').Server(app)
var io = require('socket.io')(http);

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/static'));

app.use(bodyParser.urlencoded({extended: true}));
app.use(ejsLayouts);
app.use(flash());

app.use(session({
  secret: 'wikiracer--duh',
  resave: false,
  saveUninitialized: true
}));

var currentRace = {
  start: '/wiki/Scotland',
  finish: '/wiki/NASCAR'
};

var isRacing = false;

var racers = 0;
var minRacers = 2;

io.on('connect', function(socket) {
  console.log('connected:', socket.id);

  racers++;
  console.log('racers:', racers);
  if (racers >= minRacers) {
    startRace();
  } else {
    waiting();
  }

  socket.on('client-racer-move', function(move) {
    console.log(socket.id, "moves to", move);
    if (move.next === currentRace.finish) {
      finishRace(socket.id);
    } else {
      io.emit('racer-move', move);
    }
  });
});

io.on('disconnect', function(socket) {
  racers--;

  io.emit('crash', {
    racer: socket.id
  });
});

function waiting() {
  io.emit('waiting', {
    racers: racers
  });
}

function startRace() {
  isRacing = true;
  io.emit('race-start', currentRace);
}

function finishRace(winnerId) {
  isRacing = false;
  io.emit('race-finish', {
    winner: winnerId
  });
}


app.get('/', function(req, res) {
  res.render('index');
});

http.listen(3000);
