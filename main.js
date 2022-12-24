const socket = io('http://localhost:3000/');

  // when client connects to the server.

socket.on("connect", () => {
    console.log(socket.connected);
    console.log('A user connected to the server with id : ', socket.id); 
  });
  
socket.on("disconnect", () => {
    console.log(socket.connected); 
  });

const configuration = {
  iceServers: [
    {
      urls: [
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302',
      ],
    },
  ],
  iceCandidatePoolSize: 10,
};

let localStream = null;
let remoteStream = null;
let peerConnection = null;
let iceCandidateCollection = []
let calleeCandidatesCollection = []

function init() {



    document.querySelector('#openMedia').addEventListener('click', openUserMedia);
    // document.querySelector('#hangUp').addEventListener('click', hangUp);
    document.querySelector('#call').addEventListener('click', createRoom);
    // document.querySelector('#accept').addEventListener('click', joinRoom);  

  }

  async function openUserMedia(e) {
    const stream = await navigator.mediaDevices.getUserMedia(
        {video: true, audio: true});
    document.querySelector('#localVideo').srcObject = stream;
    localStream = stream;
    remoteStream = new MediaStream();
    document.querySelector('#remoteVideo').srcObject = remoteStream;
  
    console.log('Stream:', document.querySelector('#localVideo').srcObject);
    document.querySelector('#openMedia').disabled = true;
    document.querySelector('#call').disabled = false;
    document.querySelector('#accept').disabled = false;
    document.querySelector('#hangUp').disabled = false;
  }


  async function createRoom() {

    document.querySelector('#call').disabled = true;
    document.querySelector('#accept').disabled = true;

    console.log('Create PeerConnection with configuration: ', configuration);
    peerConnection = new RTCPeerConnection(configuration);

   registerPeerConnectionListeners();

   localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  });

    // send this offer to the other user 
   
    let UserId = document.querySelector('#userId').value;

    // Code for creating a room below
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    
    console.log('Created offer:', offer);

    const roomWithOffer = {
      'offer': {
        type: offer.type,
        sdp: offer.sdp,
      },
    };
    
    // Code for collecting ICE candidates below
    
    peerConnection.addEventListener('icecandidate', event => {
      if (!event.candidate) {
        console.log('Got final candidate!');
        // socket.emit('iceCandidateCollection',UserId,iceCandidateCollection)

        // sending offer
        let senderId = socket.id;
        console.log('ice canddiate collection :',iceCandidateCollection)
        socket.emit('onOfferSend',roomWithOffer,UserId,senderId,iceCandidateCollection)
        
        return;
      }
      console.log('Got candidate: ', event.candidate);
      // collection of iceCandidates
      iceCandidateCollection.push(event.candidate.toJSON())
      // send offer to the other user with clientCandidates collection
        
    });   
  
    // when offer accepted

// getting remote stream from the other peer

    peerConnection.addEventListener('track', event => {
      console.log('Got remote track:', event.streams[0]);
      event.streams[0].getTracks().forEach(track => {
        console.log('Add a track to the remoteStream:', track);
        remoteStream.addTrack(track);
      });
    });
    
    

  }


  async function acceptOffer(roomWithOffer,senderId,iceCandidateCollection){

      await openUserMedia()
      console.log('offer recieve is',roomWithOffer)

      peerConnection = new RTCPeerConnection(configuration);
      registerPeerConnectionListeners();

      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });

      peerConnection.addEventListener('track', event => {
        console.log('Got remote track:', event.streams[0]);
        event.streams[0].getTracks().forEach(track => {
          console.log('Add a track to the remoteStream:', track);
          remoteStream.addTrack(track);
        });
      });
      // getting the offer

      let offer = roomWithOffer.offer
        console.log('Got offer:', offer);
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.createAnswer();
        console.log('Created answer:', answer);
        await peerConnection.setLocalDescription(answer);

        const roomWithAnswer = {
          answer: {
            type: answer.type,
            sdp: answer.sdp,
          },
        };

        

     // Code for collecting ICE candidates below

  
     peerConnection.addEventListener('icecandidate', event => {
      if (!event.candidate) {
        console.log('Got final candidate!');
        // send offer to the other user with clientCandidates collection
        // socket.emit('calleeCandidatesCollection',UserId,iceCandidateCollection)

        // sending answer back to the caller

      let userId = senderId
      socket.emit('onAnswerSend',roomWithAnswer,userId,calleeCandidatesCollection)
  
        return;
      }
      console.log('Got calleeCandidatesCollection candidate: ', event.candidate);
      // collection of iceCandidates
      calleeCandidatesCollection.push(event.candidate.toJSON())
        
    });   

    // when connection create
    

    console.log('ice candidate',iceCandidateCollection)
    iceCandidateCollection.forEach( async element => {
      await peerConnection.addIceCandidate(new RTCIceCandidate(element));
    });


    

  }


socket.on('offer-recieve',(data) => {

  let a = document.querySelector('#remoteCandidates');
  a.innerHTML = data[0];
  console.log('offer recive is',data[0])
 
  // accept or reject the offer

   acceptOffer(data[0],data[1],data[2]);


})


socket.on('answer-recieve', async (data,calleeCandidatesCollection) => {
  const rtcSessionDescription = new RTCSessionDescription(data.answer);
  await peerConnection.setRemoteDescription(rtcSessionDescription);

  calleeCandidatesCollection.forEach( async element => {
    await peerConnection.addIceCandidate(new RTCIceCandidate(element));
  });

})

function registerPeerConnectionListeners() {
  peerConnection.addEventListener('icegatheringstatechange', () => {
    console.log(
        `ICE gathering state changed: ${peerConnection.iceGatheringState}`);
  });

  peerConnection.addEventListener('connectionstatechange', () => {
    console.log(`Connection state change: ${peerConnection.connectionState}`);
  });

  peerConnection.addEventListener('signalingstatechange', () => {
    console.log(`Signaling state change: ${peerConnection.signalingState}`);
  });

  peerConnection.addEventListener('iceconnectionstatechange ', () => {
    console.log(
        `ICE connection state change: ${peerConnection.iceConnectionState}`);
  });
}


  init()