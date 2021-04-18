const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = require('socket.io')(server);
const { MongoClient, Timestamp } = require('mongodb');
const uri = "mongodb+srv://Mathusihan:CPS831@cluster0.tnbgf.mongodb.net/CPS831ASSIGNMENT?retryWrites=true&w=majority";
const client = new MongoClient(uri);
var currentUser;
var conversations = [];
var allUsers = [];

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

class Message {
    constructor(sender, content) {
        this.sender = sender;
        this.content = content;
        this.timestamp = Date.now();
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
        allUsers.push({ username: username, socketID: socket.id });
        (async function() {
            var returnobj = null;
            returnobj = await getUser(username, password);
            if (returnobj != null && returnobj != undefined) {
                io.to(socket.id).emit('login_successful', returnobj.currentUser, returnobj.conversation);
            } else
                io.to(socket.id).emit('login_fail');
        })();

    });


    socket.on('chat_message', function(message, recievers, convoID, sender) {
        var message_object = new Message(sender, message);
        var MessageList = client.db("CPS831ASSIGNMENT").collection("MessageList");
        (async function() {
            var query = { id: convoID };
            var update_document = { $push: { "messages": message_object } };
            var update = await MessageList.updateOne(query, update_document);
        })();
        for (var i = 0; i < allUsers.length; i++) {
            for (var j = 0; j < recievers.length; j++) {
                if (allUsers[i].username == recievers[j])
                    io.to(allUsers[i].socketID).emit('chat_message', '<strong>' + sender + '</strong>: ' + message, message_object, recievers);
            }
        }

    });

    socket.on('send_friend_request', function(sender, reciever) {
        var UserList = client.db("CPS831ASSIGNMENT").collection("UserList");
        (async function() {
            var query = { username: reciever };
            var update_document = { $push: { "pendingFriends": sender } };
            var update = await UserList.updateOne(query, update_document);
        })();
        for (var i = 0; i < allUsers.length; i++) {
            if (allUsers[i].username == reciever)
                io.to(allUsers[i].socketID).emit('sent_request', sender);
        }

    });

    socket.on('accept_friend_request', function(sender, reciever) {
        var UserList = client.db("CPS831ASSIGNMENT").collection("UserList");
        var MessageList = client.db("CPS831ASSIGNMENT").collection("MessageList");
        var newConvo = new Conversation([sender, reciever], [])
            (async function() {
                var query = { username: reciever };
                var update_document = { $pull: { "pendingFriends": sender } };
                var update = await UserList.updateOne(query, update_document);
                MessageList.insertOne(newConvo, function(err, res) {
                    if (err) throw err;
                    console.log("1 document inserted");
                    client.close();
                });
            })();
        io.to(socket.id).emit('accepted_request', sender, newConvo);
    });

    socket.on('delete_friend_request', function(sender, reciever) {
        var UserList = client.db("CPS831ASSIGNMENT").collection("UserList");
        (async function() {
            var query = { username: reciever };
            var update_document = { $pull: { "pendingFriends": sender } };
        })();
        io.to(socket.id).emit('deleted_pending_friend', sender);
    });

    socket.on('create_user', function(username, password) {
        var UserList = client.db("CPS831ASSIGNMENT").collection("UserList");
        var newUser = new User(username, password, "", [], []);
        (async function() {
            UserList.insertOne(newUser, function(err, res) {
                if (err) throw err;
                console.log("1 document inserted");
                client.close();
            });
        })();
        io.to(socket.id).emit('login_successful', newUser, []);
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