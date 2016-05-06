var LOG_LEVEL = 1;

var socket = io();

socket.on('connect', function() {
  console.log('connected!', socket.id);
});

$(function() {
  socket.on('race-start', startRace);
  socket.on('race-finish', renderData);
  socket.on('racer-move', renderData);
  socket.on('racer-crash', renderData);

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
}

function renderPage(data) {
  console.log("got page", data.page, data.body.length);
  renderData({page: data.page, length: data.body.length});

  var page = document.getElementById('page');
  page.innerHTML = data.body;

  rerouteLinks();
}

function rerouteLinks() {
  var links = document.getElementsByTagName('a');

  for (var i = 0; i < links.length; i++) {
    links[i].onclick = linkClicker;
  }
}

function linkClicker(e) {
  e.preventDefault();


  console.log('clicked', e.target);
  var path = e.target.pathname;

  // ignore links without paths
  if (!path) {
    return
  }

  console.log('clicked', path);

  loadingPage(path);

  socket.emit('client-racer-move', {
    current: 'whatever',
    next: path
  });
}

function loadingPage(path) {
  var page = document.getElementById('page');
  page.textContent = "loading " + path;
}
