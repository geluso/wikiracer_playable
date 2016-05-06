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
	$('html, body').animate({
  	scrollTop: $(id).offset().top
  }, 2000);
}
