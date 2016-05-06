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
  console.log('racers', idsToNames);

  io.emit('racer-new', {
    id: socket.id,
    name: name
  });

  socket.on('racer-ready', function(data) {
    racers++;
    console.log('racers:', racers);
    if (racers >= minRacers) {
      raceStart();
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

  socket.on('disconnect', function() {
    racers--;
    console.log('disconnect', socket.id, "racers:", racers);
    console.log('racers', idsToNames);

    var name = idsToNames[socket.id];
    names.push(name);
    delete idsToNames[socket.id];

    io.emit('racer-crash', {
      id: socket.id,
      name: idsToNames
    });
  });
});

function waiting() {
  io.emit('waiting', {
    racers: racers
  });
}

var SECONDS = 0;
var CLOCK = undefined;
var MAX_DURATION = 120 * 1000;
function raceStart() {
  isRacing = true;
  io.emit('race-start', currentRace);

  SECONDS = 0;
  CLOCK = setInterval(function() {
    SECONDS++;
    io.emit('race-tick', {seconds: SECONDS});
  }, 1000);

  // stop the clock after max race length
  setTimeout(function() {
    clearInterval(CLOCK);
  }, MAX_DURATION);
}

function finishRace(winnerId) {
  isRacing = false;

  clearInterval(CLOCK);

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
