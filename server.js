const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server,{
    cors : {origin : "*"}
});

let icecandidates;
let userId;

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// app.use('/static', express.static('node_modules'));


io.on('connection', (socket) => {
  console.log("A user is connected");

    socket.on('iceCandidateCollection', (UserId,msg) => {
      console.log('message recieve is : ' + msg , 'UserId' , UserId);
   
      // socket.to(userId).emit("recieve-iceCandidates",icecandidates,userId)


    });

    socket.on('onOfferSend', (offer,UserId,SenderId,iceCandidateCollection) => {
      console.log('offer at server : ' , offer,UserId);
      socket.to(UserId).emit("offer-recieve",[offer,SenderId,iceCandidateCollection])
    });

    socket.on('onAnswerSend', (offer,UserId,calleeCandidatesCollection) => {
      console.log('Answer at server : ' , offer,UserId);
      socket.to(UserId).emit("answer-recieve",offer,calleeCandidatesCollection)
    });




  });

  

server.listen(3000, () => {
  console.log('listening on *:3000');
});