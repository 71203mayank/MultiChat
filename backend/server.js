const express = require('express')
const http = require('http')
const app = express()
const server = http.createServer(app)
const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:3000",
    method: ["GET","POST"]
  }
})

const activeRooms = {};

io.on('connection', (socket) => {
  console.log('user connected with socket id:', socket.id);

  // 'join-room' request
  socket.on('join-room', (roomId) => {
        //if room doesn't exist, create a new with the id
        if(!activeRooms[roomId]){
            activeRooms[roomId]=[];
        }
        //send the list of existing users to the new user
        io.emit('users', activeRooms[roomId]);

        //add the requesting user in the room
        activeRooms[roomId].push(socket.id);
  });

  socket.on('disconnect', () => {

  });

  socket.on('call-user', ({userId, signalData}) => {
    console.log(`${socket.id} calling to user ${userId} `);
    io.to(userId).emit('incoming-call', {signal: signalData, from: socket.id});
  });

  socket.on('answer-call', ({ userId, signal}) => {
    console.log(`${socket.id} is answering ${userId}`);
    io.to(userId).emit('incoming-answer', {signal: signal, from: socket.id});
  })

});

server.listen(5000, () => console.log('server2 running at port: 5000'));