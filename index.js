var express = require('express');
var bodyParser = require('body-parser');
var ejsLayouts = require('express-ejs-layouts');
var session = require('express-session');
var flash = require('connect-flash');
var request = require('request');

var topPages = require('./top-pages');
console.log('top pages', topPages.length);

var app = express()
var http = require('http').Server(app)
var io = require('socket.io')(http);
io.emit('server-reset')

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/static'));

app.use(bodyParser.urlencoded({ extended: true }));
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
var idsToMoves = {};

var WIKI_URL = "http://en.wikipedia.org";

function generateRace() {
  var r1, r2;
  do {
    r1 = Math.floor(Math.random() * topPages.length);
    r2 = Math.floor(Math.random() * topPages.length);
  } while (r1 == r2)

  var start = topPages[r1];
  var finish = topPages[r2];

  return {
    start: start,
    finish: finish
  }
}

var currentRace = generateRace();

var isRacing = false;

var racers = 0;
var minRacers = 2;

io.on('connect', function (socket) {
  console.log('connected:', socket.id, socket);

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

  infoRacers();

  socket.on('racer-ready', function (data) {
    racers++;
    console.log('racers:', racers);
    if (racers >= minRacers && !isRacing) {
      console.log("race starting in 3.. 2.. 1.. GO!!");
      setTimeout(raceStart, 3000);
    } else if (isRacing) {
      infoRacers();
    }
  });

  socket.on('info-racers-request', infoRacers);

  socket.on('client-racer-move', function (data) {
    console.log(socket.id, "moves to", data);
    let isWinner = false
    if (data.page === currentRace.finish) {
      isWinner = true
      racerMove(data.id, data.page, isWinner);
      finishRace(socket.id);
    } else {
      racerMove(data.id, data.page, isWinner);
    }
  });

  socket.on('disconnect', function () {
    racers--;
    console.log('disconnect', socket.id, "racers:", racers);
    console.log('racers', idsToNames);

    var name = idsToNames[socket.id];
    names.push(name);
    delete idsToNames[socket.id];
    delete idsToMoves[socket.id];

    io.emit('racer-crash', {
      id: socket.id,
      name: idsToNames
    });
  });
});

function infoRacers() {
  var data = {
    race: currentRace,
    moves: idsToMoves,
    names: idsToNames
  };

  console.log('inforacers', data);
  io.emit('info-racers', data);
}

var START = 0;
var CLOCK = undefined;
var MAX_DURATION = 1000 * 1000;
function raceStart() {
  isRacing = true;
  currentRace = generateRace();

  console.log('start:', currentRace.start);
  console.log('finish:', currentRace.finish);

  io.emit('server-reset', currentRace);
  io.emit('race-start', currentRace);

  START = new Date().getTime();
  CLOCK = setInterval(function () {
    seconds = new Date().getTime() - START;
    seconds = Math.floor(seconds / 1000);
    io.emit('race-tick', { seconds: seconds });
  }, 1000);

  // send the first page to all current racers
  for (var id in idsToNames) {
    racerMove(id, currentRace.start);
  }

  // stop the clock after max race length
  setTimeout(function () {
    clearInterval(CLOCK);
  }, MAX_DURATION);
}

function finishRace(winnerId) {
  isRacing = false;

  clearInterval(CLOCK);

  io.emit('race-finish', {
    id: winnerId,
    winner: idsToNames[winnerId]
  });
}

function racerMove(id, href, isWinner = false) {
  var url = WIKI_URL + href;
  console.log('getting:', url);

  request(url, function (err, response, body) {
    if (!err && response.statusCode === 200) {
      console.log("got page ok:", url, body.length);

      console.log('sending page to:', id);
      io.to(id).emit('receive-page', {
        page: href,
        body: body
      });
    } else {
      console.log("error fetching:", url);
    }
  });

  // default to an empty list
  if (!idsToMoves[id]) {
    idsToMoves[id] = [];
    console.log('racer moves 1st')
  }

  var moves = idsToMoves[id];

  // prevent adding weird dupes
  if (moves[moves.length - 1] !== href) {
    moves.push(href);
  }

  console.log('racer moves', id, moves)

  io.emit('racer-move', {
    id: id,
    page: href
  });
}

app.get('/', function (req, res) {
  res.render('index');
});

http.listen(3000);
