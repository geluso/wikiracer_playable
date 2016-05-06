var LOG_LEVEL = 1;

var socket = io();

socket.on('connect', function() {
  console.log('connected!', socket.id);
});

$(function() {
  socket.on('info-racers', infoRacers);

  socket.on('race-start', raceStart);
  socket.on('race-tick', raceTick);
  socket.on('race-finish', renderData);

  socket.on('racer-new', racerNew);
  socket.on('racer-move', racerMove);
  socket.on('racer-crash', racerCrash);

  socket.on('receive-page', renderPage);
});

function renderData(data) {
	if (LOG_LEVEL < 1) {
		return;
	}

  console.log(data)

	if (LOG_LEVEL < 2) {
		return;
	}

  var msg = document.getElementById('msg');
  var p = document.createElement('p');
  msg.appendChild(p);

  for (key in data) {
    var strong = document.createElement('strong');
    var span = document.createElement('span');
    p.appendChild(strong);
    p.appendChild(span);

    strong.textContent = key + ": ";
    span.textContent = data[key] + " ";
  }
}

function infoRacers(data) {
  console.log('inforacers', data);
  for (var id in data.names) {
    var name = data.names[id];
    var moves = data.moves[id];

    racerNew({id: id, name: name});
    if (moves) {
      console.log('got moves', id, moves);
      for (var move in moves) {
        displayRacerMove(id, move);
      }
    } else {
      console.log('no moves', id, moves);
    }
  }
}

function raceStart(data) {
	$("#time").text('0:00');

  var startText = data.start.replace('/wiki/', '');
  var finishText = data.finish.replace('/wiki/', '');

	$("#start").text(startText);
	$("#finish").text(finishText);

  loadingPage(data.start);
}

function raceTick(data) {
  var minutes = Math.floor(data.seconds / 60);
  var seconds = data.seconds % 60;
  if (seconds < 10) {
    seconds = '0' + seconds;
  }

  var timestamp = minutes + ':' + seconds;
  $("#time").text(timestamp);
}

function renderPage(data) {
  console.log("got page", data.page, data.body.length);
  renderData({page: data.page, length: data.body.length});

  var page = document.getElementById('page');
  page.innerHTML = data.body;

	attachScrollers();
  rerouteLinks();
}

function rerouteLinks() {
  var links = document.getElementsByTagName('a');

  for (var i = 0; i < links.length; i++) {
    $(links[i]).on('mouseup', linkClicker);
  }
}

function linkClicker(e) {
  e.preventDefault();

	if (e.target.tagName !== 'A') {
		// displayMove('non-wiki');
	}

  console.log('clicked', e.target);
  var path = e.target.pathname;

  // ignore links without paths
  if (!path) {
    return
  }

	if (!path.startsWith('/wiki')) {
		// displayMove('non-wiki');
	}

  console.log('clicked', path);

  loadingPage(path);

  socket.emit('client-racer-move', {
    id: '/#' + socket.id,
    page: path
  });
}

function loadingPage(path) {
  var page = document.getElementById('page');
  page.textContent = "loading " + path;
}

function resizePage() {
	var height = $("#racetrack").outerHeight() + 10;
	$("#page").css({marginTop: height + 'px'});
}

function attachScrollers() {
  var links = $(".toctext");
	links.each(function(i, link) {
		$(link).on('click', function() {
			var id = link.textContent.replace(/ /g, '_');
			console.log('toc scroll', id);
			scrollTo(id);
		});
	});

}

function scrollTo(id) {
	id = "#" + id;

	var height = $("#racetrack").outerHeight() + 10;

	$('html, body').animate({
  	scrollTop: $(id).offset().top - height
  }, 2000);
}

function racerNew(data) {
  renderData(data);

  var lane = buildLane(data);

  var socketId = "/#" + socket.id;
  if (lane && data.id === socketId) {
    resizePage();
    lane.className += " self";
    socket.emit('racer-ready', {id: socket.id});
  }
}

function racerMove(data) {
  displayRacerMove(data.id, data.page);
}

function displayRacerMove(id, page) {
  console.log('moving', id, page);
	var lane = document.getElementById(id)

  if (!lane) {
    console.log("couldn't find lane:", id);
    return
  }

  lane = lane.querySelector('ol');

	var li = document.createElement('li');

  var text = page.replace('/wiki/', '');
	li.textContent = text;

	lane.appendChild(li);

  resizePage();
}

function racerCrash(data) {
  var lane = document.getElementById(data.id);
  if (lane) {
    lane.className += " crash"

    setTimeout(function() {
      $(lane).remove();
    }, 5000);
  }

}

function buildLane(data) {
  var track = document.getElementById('racetrack');

  if (document.getElementById(data.id)) {
    return false;
  }

  var lane = document.createElement('div');
  lane.id = data.id;
  lane.className = 'lane'

  var info = document.createElement('div');
  info.className = 'racer-info';
  var time = document.createElement('span');
  time.textContent = '';
  var name = document.createElement('span');
  name.textContent = data.name;
  var moves = document.createElement('ol');

  var clear = document.createElement('div');
  clear.className = 'clear';

  track.appendChild(lane);
    lane.appendChild(info);
      info.appendChild(time);
      info.appendChild(name);
    lane.appendChild(moves);
    lane.appendChild(clear);

  return lane;
}

