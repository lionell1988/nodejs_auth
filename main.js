const PORT = 8080;
var express = require('express');
var app = express();
var http = require('http');
var httpServer = http.createServer(app);
var io = require('socket.io')(httpServer);
var mysql = require('mysql');
var jwt = require('jsonwebtoken');
var socket_array;

var exMiddl = require('./middlewares/middl_ex');

//var data = new Object();
//data.name = "Leonardo";
//data.pwd = "111213";

socket_array = new Array();

app.get('/', (req, res) => {
    res.send('hello');
});

//io.use(exMiddl);//example middleware

//MIDDLEWARE EXAMPLE
io.use((socket, next) => {

    console.log('connected cl');
    next(handleSocket(socket));//let to go on. Without next, the code breaks in these brackets. next() or next(fn) lets to see io in the next lines outside the {}s

});


function handleSocket(socket) {
    console.log('middleware recall');
    console.log('new client connected');
    //console.log(socket.handshake.query);

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });

    socket.on('auth', (u) => {
        console.log('try to authenticate ' + u.name);
        authenticate(u).then((auth) => {
            if (auth) {
                console.log(u.name + ' succefully authenticated');
                socket.emit('server_auth', 'you are authenticated.'); //io.to(socket.id).emit() pheraps is powerful.
                io.emit('server_msg', 'new client connected');//broadcast
                token = createToken(u);
                console.log(token);
                socket_array.push(socket);
                startService(u,socket);
                
                //var decoded_token = jwt.verify(token,'secret');
                //console.log('From token:'+decoded_token.name);
            } else {
                console.log('User not found.');
            }
        }).catch((error) => {
            console.log('Failed to authenticate ' + u.name + '. ' + error);
        });
    });
}


///

//io.on('connection', (socket) => {
//    console.log('new client connected');
//    console.log(socket.handshake.query);
//
//    socket.on('disconnect', () => {
//        console.log('Client disconnected');
//    });
//
//    socket.on('auth', (u) => {
//        console.log('try to authenticate ' + u.name);
//        authenticate(u).then((auth) => {
//            if (auth) {
//                console.log(u.name + ' succefully authenticated');
//                socket.emit('server_auth', 'you are authenticated.'); //io.to(socket.id).emit() pheraps is powerful.
//                io.emit('server_msg', 'new client connected');
//                token = createToken(u);
//                console.log(token);
//                socket_array.push(socket);
//                //var decoded_token = jwt.verify(token,'secret');
//                //console.log('From token:'+decoded_token.name);
//            }else{
//                console.log('User not found.');
//            }
//        }).catch((error) => {
//            console.log('Failed to authenticate ' + u.name + '. ' + error);
//        });
//    });


//});

function createToken(u) {
    var token = jwt.sign(u, 'secret', {
        expiresIn: 1440
    });
    return token;
}

function check_client(socket) {
    var auth = false;
    return auth;
}

function delete_client(socket) {
    const socket_array_len = socket_array.length;
    for (i = 0; i < socket_array_len; i++) {
        if (socket_array[i] === socket) {
            socket_array.splice(i, 1);
            i = socket_array_len;
        }
    }
}

function authenticate(u) {
    return new Promise((resolve, reject) => {
        var auth = false;
        var name = u.name;
        var pwd = u.pwd;
        var query = 'SELECT * FROM users WHERE name ="' + name + '" AND pwd = ' + pwd;
        var con = mysql.createConnection({
            host: "localhost",
            user: "root",
            password: "",
            database: "chat_db"
        });
        con.connect((err) => {
            console.log('connection to db');
            if (err)
                return reject(err);
            con.query(query, function (err, result, fields) {
                if (err)
                    return reject(err);
                if (result.length > 0)
                    auth = true;
                resolve(auth);
                // console.log(result[0].name);
            });

        });

    });
}

httpServer.listen(PORT, () => {
    console.log('listening on *:' + PORT);
});


