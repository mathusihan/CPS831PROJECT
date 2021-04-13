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

// Function connects to MongoDB
async function main() {

    getUser("test1");

}
main().catch(console.error);

async function getUser(username) {
    try {
        // Connect to the MongoDB cluster
        await client.connect();
        var UserList = client.db("CPS831ASSIGNMENT").collection("UserList");
        var MessageList = client.db("CPS831ASSIGNMENT").collection("MessageList");
        var query = { username: username };
        currentUser = await UserList.findOne(query);
        query = { usernames: { $all: [currentUser.username] } };
        var x = await MessageList.find({}).toArray(function(err, result) {
            if (err) throw err;
            result.forEach(element => {
                // console.log(element);
                var convo = new Conversation(element.usernames, element.messages);
                conversations.push(convo);
            });
            conversations.sort(function(a, b) { return b.messages[b.messages.length - 1].timestamp - a.messages[a.messages.length - 1].timestamp });
            console.log(conversations);
        });;


    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}


/* code to insert values into database
const UserList = client.db("CPS831ASSIGNMENT").collection("UserList");
var newUser = new User('test2', 'test2@email.com', 'test2pass', ['test1'], ['test3', 'test4']);
        UserList.insertOne(newUser, function(err, res) {
            if (err) throw err;
            console.log("1 document inserted");
            client.close();
        });

UPDATE DATABASE
        var query = { usernames: { $all: [currentUser.username] } };
        var y = await MessageList.updateOne(query, { $set: { "messages.$.timestamp": 3 } });
*/