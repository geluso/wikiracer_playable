var express = require('express');
var bodyParser = require('body-parser');
var ejsLayouts = require('express-ejs-layouts');
var session = require('express-session');
var flash = require('connect-flash');
var request = require('request');

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

var names = [
  "Jeff Gordon",
  "Dale Earnhardt Jr.",
  "Speed Racer",
  "Richard Petty",
  "Mario Andretti",
  "Dale Earnhardt",
  "Michael Schumacher",
  "Ayrton Senna",
  "James Hunt"
];

var idsToNames = {};

var WIKI_URL = "http://en.wikipedia.org";

var currentRace = {
  start: '/wiki/Scotland',
  finish: '/wiki/NASCAR'
};

var isRacing = false;

var racers = 0;
var minRacers = 3;

io.on('connect', function(socket) {
  console.log('connected:', socket.id);

  var name = "Mystery Racer";
  if (names.length > 0) {
    name = names.pop();
  }
  idsToNames[socket.id] = name;

  io.emit('racer-new', {
    id: socket.id,
    name: name
  });

  socket.on('racer-ready', function(data) {
    racers++;
    console.log('racers:', racers);
    if (racers >= minRacers) {
      startRace();
      racerMove(currentRace.start);
    } else {
      waiting();
    }
  });

  socket.on('client-racer-move', function(move) {
    console.log(socket.id, "moves to", move);
    if (move.next === currentRace.finish) {
      finishRace(socket.id);
    } else {
      io.emit('racer-move', move);
      racerMove(move.next);
    }
  });
});

io.on('disconnect', function(socket) {
  racers--;

  var name = idsToNames[socket.id];
  names.push(name);

  io.emit('crash', {
    id: socket.id,
    name: idsToNames
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

function racerMove(href) {
  var url = WIKI_URL + href;
  console.log('getting:', url);

  request(url, function(err, response, body) {
    if (!err && response.statusCode === 200) {
      console.log("got page ok:", url, body.length);

      io.emit('receive-page', {
        page: href,
        body: body
      });
    } else {
      console.log("error fetching:", url);
    }
  });
}

app.get('/', function(req, res) {
  res.render('index');
});

http.listen(3000);
