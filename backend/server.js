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
  socket.on('join-room', (roomId) => {
    if (!activeRooms[roomId]) {
      activeRooms[roomId] = [];
    }

    activeRooms[roomId].push(socket.id);
    socket.join(roomId);

    // Send the list of users in the room to the newly joined user
    socket.emit('users', activeRooms[roomId].filter(id => id !== socket.id));

    // Broadcast to other users that a new user has joined
    io.to(roomId).emit('user-connected', socket.id); // Fix here

    // Handle WebRTC signaling messages
    socket.on('offer', (offer, targetUserId) => {
      io.to(targetUserId).emit('offer', offer, socket.id);
    });

    socket.on('answer', (answer, targetUserId) => {
      io.to(targetUserId).emit('answer', answer, socket.id);
    });

    socket.on('ice-candidate', (candidate, targetUserId) => {
      io.to(targetUserId).emit('ice-candidate', candidate, socket.id);
    });

    // Handle user disconnection
    socket.on('disconnect', () => {
      activeRooms[roomId] = activeRooms[roomId].filter(id => id !== socket.id);
      io.to(roomId).emit('user-disconnected', socket.id);
    });
  });
});


// // to keep track of different rooms and the users.
// const activeRooms = {};

// //create a connection through our socket 
// io.on("connection",(socket) => {
//   console.log(socket.id);

//   //signal logic here
//   socket.on('join-room', (roomId) => {
    
//     //if room doesn't exit in the activeRooms, create a new array with the given Id;
//     if(!activeRooms[roomId]){
//       activeRooms[roomId] = [];
//     }

//     //add the socket id of the current user in the array for joined arrays
//     activeRooms[roomId].push(socket.id);

//     // Join the socket to the specified room
//     socket.join(roomId);

//     // Send the list of users in the room to the newly joined user
//     socket.emit('users', activeRooms[roomId].filter( id => id !== socket.id));

//     // Broadcast to other users that a new user has joined
//     socket.to(roomId).broadcast.emit('user-connected', socket.id);

//     //Handle user disconnection
//     socket.on('disconnect', () => {
//       // Remove the disconnected user's socket Id from the array for the room
//       activeRooms[roomId] = activeRooms[roomId].filter(id => id !== socket.id);

//       // Broadcast to other users that a user has disconnected
//       socket.to(roomId).broadcast.emit('user-disconnected', socket.id);
//     });


//     // Handling webRTC signals
//     //Offrer handling
//     socket.on('offer', (offer, targetUserId) => {
//       io.to(targetUserId).emit('offer',offer, socket.id);
//     });

//     //answer handling
//     socket.on('answer', (answer, targetUserId) => {
//       io.to(targetUserId).emit('answer', answer, socket.id);
//     });

//     //ICE candidate handling
//     socket.on('ice-candidate', (candidate, targetUserId) => {
//       io.to(targetUserId).emit('ice-candidate', candidate, socket.id);
//     });

    
//   });

// });

server.listen(5000,() => console.log("server is running at port 5000"));
