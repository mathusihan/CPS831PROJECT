const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = require('socket.io')(server);

app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/CPS831 Assignment.html');
});

io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('chat_message', function(message) {
        console.log('test');
        io.emit('chat_message', '<strong>' + "socket.username" + '</strong>: ' + message);
    });
});



server.listen(8081, () => {
    console.log('listening on *:8081');
});


/*const PORT = 8081;

fs.readFile('./CPS831 Assignment.html', function(err, html) {

    if (err) throw err;

    http.createServer(function(request, response) {
        response.writeHeader(200, { "Content-Type": "text/html" });
        response.write(html);
        response.end();
    }).listen(PORT);
});*/