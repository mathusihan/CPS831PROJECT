const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = require('socket.io')(server);
const { MongoClient } = require('mongodb');
const uri = "mongodb+srv://Mathusihan:CPS831@cluster0.tnbgf.mongodb.net/CPS831ASSIGNMENT?retryWrites=true&w=majority";
const client = new MongoClient(uri);
var currentUser;
var conversations = [];

class User {

    constructor(username, email, password, firends, pendingFriends) {
        this.username = username;
        this.email = email;
        this.password = password;
        this.friends = firends;
        this.pendingFriends = pendingFriends;
    }

}

class Conversation {

    constructor(usernames, messages) {
        this.usernames = usernames;
        this.messages = messages;
        this.messages.sort(function(a, b) { return b.timestamp - a.timestamp }); // Sort newest first
    }

}

class ReturnObj {
    constructor(currentUser, conversation) {
        this.currentUser = currentUser;
        this.conversation = conversation;
    }
}


async function getUser(username, password) {
    try {
        // Connect to the MongoDB cluster
        await client.connect();
        var UserList = client.db("CPS831ASSIGNMENT").collection("UserList");
        var MessageList = client.db("CPS831ASSIGNMENT").collection("MessageList");
        var query = { username: username };
        currentUser = await UserList.findOne(query);
        if (currentUser != undefined && currentUser != null && password == currentUser.password) {
            query = { usernames: { $all: [username] } };
            var messasgesArray = await MessageList.find(query).toArray();
            messasgesArray.forEach(element => conversations.push(new Conversation(element.usernames, element.messages)));
            return new ReturnObj(currentUser, messasgesArray);
        } else {
            return null;
        }

    } catch (e) {
        console.error(e);
        return null;
    }
    /*finally {
           await client.close();
       }*/
}


async function close() {
    await client.close();
}

app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/CPS831 Assignment.html');
});

io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('login', function(username, password) {
        (async function() {
            var returnobj = null;
            returnobj = await getUser(username, password);
            if (returnobj != null && returnobj != undefined) {
                io.emit('login_successful', returnobj.currentUser, returnobj.conversation);
            } else
                io.emit('login_fail');
        })();

    });


    socket.on('chat_message', function(message) {
        io.emit('chat_message', '<strong>' + "socket.username" + '</strong>: ' + message);
    });

    socket.on('close_client', function() {
        close();
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