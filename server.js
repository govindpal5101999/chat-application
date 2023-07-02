const express = require('express');

const app = express();

const server = require('http').createServer(app);

const io = require('socket.io')(server);

let bodyparser = require('body-parser');

const path = require('path');

var mysql = require('mysql');

var fileUpload = require('express-fileupload');

// const peerServer = require('Peer');

app.use(express.static('public'));

app.set('view engine', 'ejs');

app.use('/node_modules', express.static(path.join(__dirname, 'node_modules',)));

app.use(fileUpload());
app.use(bodyparser.json());

let clientSocketIds = [];
let connectedUsers = [];
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'chat'
});

//sign-up---->

connection.connect()

global.db = connection;

app.post('/', function (req, res) {
    message = '';
    if (req.method == "POST") {
        var post = req.body;
        var name = post.user_name;
        var pass = post.password;
        var cpass = post.cpassword;
        var fname = post.first_name;
        var lname = post.last_name;
        var mob = post.mob_no;
        var gen = post.gender;

        if (!req.files)
            return res.status(400).send('No files were uploaded.');

        var file = req.files.uploaded_image;
        var img_name = file.name;

        if (file.mimetype == "image/jpeg" || file.mimetype == "image/png" || file.mimetype == "image/jpg") {

            file.mv('public/images/upload_images/' + file.name, function (err) {

                if (err)

                    return res.status(500).send(err);
                var sql = "INSERT INTO `users_data`(`first_name`, `last_name`,`Gender`, `mob_no`, `image`, `user_name`, `password`, `cpassword`) VALUES ('" + fname + "','" + lname + "','" + gen + "','" + mob + "','" + img_name + "','" + name + "','" + pass + "', '" + cpass + "')";

                var query = db.query(sql, function (err, result) {
                    res.redirect('/');
                });
            });
        } else {
            message = "This format is not allowed , please upload file with '.png','.gif','.jpg'";
            res.render('room.ejs');
        }
    } else {
        res.render('room.ejs');
    }
});

// for Private chat ---->

count = -1;

app.post('/login', (req, res) => {


    username = req.body.username
    password = req.body.password
    firstname = req.body.firstname

    connection.query("SELECT * FROM users_data WHERE first_name = '" + firstname + "' AND user_name = '" + username + "' AND password = '" + password + "'", function (error, results) {
        if (error) throw error;

        if (results.length == 1) {
            res.send({ status: true, data: results[0] })
        } else {
            res.send({ status: false })
        }
    });
})

const getSocketByUserId = (userId) => {
    let socket = '';
    for (let i = 0; i < clientSocketIds.length; i++) {
        if (clientSocketIds[i].userId == userId) {
            socket = clientSocketIds[i].socket;
            break;
        }
    }
    return socket;
}

/* socket function starts */
io.on('connection', socket => {
    console.log('conected')
    socket.on('disconnect', () => {
        console.log("disconnected")
        connectedUsers = connectedUsers.filter(item => item.socketId != socket.id);
        io.emit('updateUserList', connectedUsers)
    });

    socket.on('loggedin', function (user) {
        clientSocketIds.push({ socket: socket, userId: user.user_id });
        connectedUsers = connectedUsers.filter(item => item.user_id != user.user_id);
        connectedUsers.push({ ...user, socketId: socket.id })
        io.emit('updateUserList', connectedUsers)
        console.log(count)
        count++
        io.emit('usercount', count)
    
        socket.on('disconnect', () => {
            count--
            io.emit('usercount', count)
    
        })
    });

    socket.on('create', function (data) {
        console.log("create room")
        socket.join(data.room);
        let withSocket = getSocketByUserId(data.withUserId);
        socket.broadcast.to(withSocket.id).emit("invite", { room: data })
    });
    socket.on('joinRoom', function (data) {
        socket.join(data.room.room);
    });

    socket.on('message', function (data) {
        socket.broadcast.to(data.room).emit('message', data);
    })
});
/* socket function ends */

app.get('/', (req, res) => {
    res.render('room.ejs')
});


//for  Public chat --->
const users = {};

io.on('connection', socket => {
    socket.on('new-user-joined', username => {
        users[socket.id] = username;
        console.log(username);
        socket.broadcast.emit('user-joined', username);
    });

    socket.on('send', message => {
        socket.broadcast.emit('receive', { message: message, username: users[socket.id] })
    });

    socket.on('disconnect', (left) => {
        socket.broadcast.emit('disconnected', users[socket.id])
    });

    //notification new public message--->
    socket.on('send-public-notification', (data) => {
        socket.broadcast.emit('new-public-notification', data);
    });


    //notification for new private message----->
    socket.on('send-private-notification', (data) => {
        socket.broadcast.emit('new-private-notification', data);
    });

    //call-notification---->
    socket.on('call-user', (data) => {
        socket.broadcast.emit('new-call-notification', data);
    });

});


app.post('/check', (req, res) => {

    username = req.body.username;
    
    connection.query("SELECT * FROM users_data WHERE user_name = '" + username + "'", function (error, results) {
        if (error) throw error;

        if (results.length == 1) {
            res.send({ status: true, data: results[0] })
        } else {
            res.send({ status: false })
        }
    });
})

//for video chat -->

// let clients = 0;

// io.on('connection' , (socket) => {
//     socket.on('new-client' , () => {
//         if(clients < 2){
//             if(client == 1 ){
//                  this.emit('createpeer')
//             }else{
//                 this.emit('sessionActive')
//                 clients++;
//             }
//         }
//     })
// })
/************************************server-chat-end**************************************************/

server.listen(3000);

/*****************************************create-database********************************************/
// CREATE TABLE `users_data` (
//     `user_id` int(5)PRIMARY KEY NOT NULL AUTO_INCREMENT,
//     `first_name` varchar(255) NOT NULL,
//     `last_name` varchar(255) NOT NULL,
//     `Gender` varchar(255) NOT NULL,
//     `mob_no` varchar(11) NOT NULL,
//     `image` varchar(255) NOT NULL,  
//     `user_name` varchar(255) NOT NULL,
//     `password` varchar(255) NOT NULL,
//     `cpassword` varchar(255) NOT NULL    
//   )

