var LOG_LEVEL = 1;

var socket = io();

socket.on('connect', function() {
  console.log('connected!', socket.id);
});

$(function() {
  socket.on('race-start', startRace);
  socket.on('race-finish', renderData);
  socket.on('racer-new', racerNew);
  socket.on('racer-move', renderData);
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

function startRace(data) {
	$("#start").text(data.start);
	$("#finish").text(data.finish);

  loadingPage(data.start);
	displayMove(data.start);
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
    $(links[i]).on('click', linkClicker);
  }
}

function linkClicker(e) {
  e.preventDefault();

	if (e.target.tagName !== 'A') {
		displayMove('non-wiki');
	}

  console.log('clicked', e.target);
  var path = e.target.pathname;

  // ignore links without paths
  if (!path) {
    return
  }

	if (!path.startsWith('/wiki')) {
		displayMove('non-wiki');
	}

  console.log('clicked', path);

  loadingPage(path);
	displayMove(path);

  socket.emit('client-racer-move', {
    current: 'whatever',
    next: path
  });
}

function loadingPage(path) {
  var page = document.getElementById('page');
  page.textContent = "loading " + path;
}

function displayMove(page) {
	var lane = document.querySelector('#racetrack .lane ol');
	var li = document.createElement('li');
	li.textContent = page;

	lane.appendChild(li);

  resizePage();
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
  }

  socket.emit('racer-ready', {id: socket.id});
}

function racerCrash(data) {
  var lane = document.getElementById(data.id);
  if (lane) {
    lane.className += " crash"

    setTimeout(function() {
      $(lane).remove();
    }, 2000);
  }

}

function buildLane(data) {
  var track = document.getElementById('racetrack');

  if (document.getElementById(data.id)) {
    return flase;
  }

  var lane = document.createElement('div');
  lane.id = data.id;
  lane.className = 'lane'

  var info = document.createElement('div');
  info.className = 'racer-info';
  var time = document.createElement('span');
  time.textContent = '0:00 ';
  var name = document.createElement('span');
  name.textContent = data.name;
  var moves = document.createElement('ol');

  track.appendChild(lane);
    lane.appendChild(info);
      info.appendChild(time);
      info.appendChild(name);
    lane.appendChild(moves);

  return lane;
}
