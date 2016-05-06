var socket = io();

socket.on('connect', function() {
  console.log('connected!', socket.id);
});

$(function() {
  // send chats
  $('#move').on('click', function(e) {
    socket.emit('client-racer-move', {
      'current': '/wiki/Scotland',
      'next': Math.random()
    });
  });

  $('#finish').on('click', function(e) {
    socket.emit('client-racer-move', {
      'current': '/wiki/Scotland',
      'next': '/wiki/NASCAR'
    });
  });

  socket.on('race-start', renderData);
  socket.on('race-start', renderData);
  socket.on('race-finish', renderData);
  socket.on('racer-move', renderData);
  socket.on('racer-crash', renderData);

  socket.on('receive-page', renderPage);
});

function renderData(data) {
  console.log(data)

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

function renderPage(data) {
  console.log("got page", data.page, data.body.length);
  renderData({page: data.page, length: data.body.length});
  var page = document.getElementById('page');
  page.innerHTML = data.body;
}
