import React, {useEffect, useState, useRef, useMemo, useCallback} from 'react'
import {io} from 'socket.io-client';
import "./Three.css"
// import freeice from 'freeice';

//connecting to the server
const socket = io.connect('http://localhost:5000');


export default function Three() {

  // const [users, setUsers] = useState([]);
  // const [users, setUsers] = useState(new Set());
  const [users, setUsers] = useState({});
  const [roomId, setRoomId] = useState('');
  const userVideoRef = useRef();
  const peerConnections = useMemo(() => ({}), []); // Wrap peerConnections initialization in useMemo
  // const [uniqueUsers, setUniqueUsers] = useState(new Set());
  // useEffect(() => {
  //   setUniqueUsers(new Set(users));
  // }, [users]);



  

  const handleJoinRoom = () => {
    if (roomId.trim() !== '') {
      socket.emit('join-room', roomId);
    }
  };


  // useEffect for setting up the user's media stream
  useEffect(() => {
    const setupUserMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

        userVideoRef.current.srcObject = stream;

        Object.values(peerConnections).forEach((peerConnection) => {
          stream.getTracks().forEach((track) => {
            peerConnection.addTrack(track, stream);
          });
        });
      } catch (error) {
        console.error('Error accessing user media:', error);
      }
    };

    setupUserMedia();

    return () => {
      // Cleanup logic (if needed)
    };
  }, [peerConnections]);



  // function to create a new peer connection
  // const createPeerConnection = useCallback((userId) => {
  //   const iceServers = [
  //     // Add a free, public STUN server
  //     { urls: 'stun:stun.l.google.com:19302' },
  //     // You can add more STUN or TURN servers here if needed
  //   ];

  //   const peerConnection = new RTCPeerConnection({iceServers});

  //   const formattedUserId = userId.replace(/[^a-zA-Z0-9-_]/g, ''); // Format userId for a valid CSS class

  //   //Add user's video stream to the peer connection
  //   userVideoRef.current.srcObject.getTracks().forEach((track) => {
  //     peerConnection.addTrack(track, userVideoRef.current.srcObject);
  //   });

  //   //Event handler when an ICE candidate is generated
  //   peerConnection.onicecandidate = (event) => {
  //     if (event.candidate) {
  //       socket.emit('ice-candidate', event.candidate, userId);
  //     }
  //   };

  //   // Event handler when the remote stream is added
  //   // peerConnection.ontrack = (event) => {
  //   //   const remoteVideo = document.querySelector(`.video-frame.${userId}`);
  //   //   if(remoteVideo) {
  //   //     remoteVideo.srcObject = event.streams[0];
  //   //   }
  //   // };
  //   peerConnection.ontrack = (event) => {
  //     const remoteVideo = document.querySelector(`#video-${formattedUserId}`);
  //     if (remoteVideo) {
  //       remoteVideo.srcObject = event.streams[0];
  //     }
  //   };

  //   //create an offer and set it as the local description
  //   peerConnection
  //     .createOffer()
  //     .then((offer) => peerConnection.setLocalDescription(offer))
  //     .then(() => {
  //       socket.emit('offer', peerConnection.localDescription, userId);
  //     });

  //   // store the peer connection
  //   peerConnections[userId] = peerConnection;
  // },[peerConnections]);


  const createPeerConnection = useCallback((userId) => {
    const iceServers = [
      // Add a free, public STUN server
      { urls: 'stun:stun.l.google.com:19302' },
      // You can add more STUN or TURN servers here if needed
    ];
  
    const peerConnection = new RTCPeerConnection({ iceServers });
  
    const formattedUserId = userId.replace(/[^a-zA-Z0-9-_]/g, ''); // Format userId for a valid CSS class
  
    // Add user's video stream to the peer connection
    userVideoRef.current.srcObject.getTracks().forEach((track) => {
      peerConnection.addTrack(track, userVideoRef.current.srcObject);
    });
  
    // Event handler when an ICE candidate is generated
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', event.candidate, userId);
      }
    };
  
    // Event handler when the remote stream is added
    peerConnection.ontrack = (event) => {
      const remoteVideo = document.querySelector(`#video-${formattedUserId}`);
      if (remoteVideo) {
        remoteVideo.srcObject = event.streams[0];
      }
    };
  
    // Create an offer and set it as the local description
    peerConnection
      .createOffer()
      .then((offer) => peerConnection.setLocalDescription(offer))
      .then(() => {
        socket.emit('offer', peerConnection.localDescription, userId);
      });
  
    // Store the peer connection
    peerConnections[userId] = peerConnection;
  }, [peerConnections]);
  



  // function to close the peer connection
  const closePeerConnection = useCallback((userId) => {
    const peerConnection = peerConnections[userId];
    if(peerConnection){
      peerConnection.close();
      delete peerConnections[userId];
    }
  },[peerConnections]);


//   // Function to handle an incoming offer
// const handleOffer = useCallback(async (offer, senderUserId) => {
//   createPeerConnection(senderUserId);

//   const peerConnection = peerConnections[senderUserId];

//   try {
//     await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
//     const answer = await peerConnection.createAnswer();
//     await peerConnection.setLocalDescription(answer);

//     // Send the answer back to the user who sent the offer
//     socket.emit('answer', peerConnection.localDescription, senderUserId);
//   } catch (error) {
//     console.error('Error handling offer:', error);
//   }
// }, [peerConnections, createPeerConnection]);


  // Function to handle an incoming offer
  // const handleOffer = useCallback(async (offer, senderUserId) => {
  //   createPeerConnection(senderUserId);

  //   const peerConnection = peerConnections[senderUserId];

  //   try {
  //     // Set the remote description
  //     await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

  //     // Create an answer
  //     const answer = await peerConnection.createAnswer();

  //     // Check signaling state before setting local description
  //     if (peerConnection.signalingState === 'have-remote-offer' || peerConnection.signalingState === 'stable') {
  //       await peerConnection.setLocalDescription(answer);

  //       // Send the answer back to the user who sent the offer
  //       socket.emit('answer', peerConnection.localDescription, senderUserId);
  //     }
  //   } catch (error) {
  //     console.error('Error handling offer:', error);
  //   }
  // }, [peerConnections, createPeerConnection]);
  const handleOffer = useCallback(async (offer, senderUserId) => {
    createPeerConnection(senderUserId);
  
    const peerConnection = peerConnections[senderUserId];
  
    try {
      // Set the remote description
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  
      // Create an answer
      const answer = await peerConnection.createAnswer();
  
      // Check signaling state before setting local description
      if (peerConnection.signalingState === 'have-remote-offer' || peerConnection.signalingState === 'stable') {
        await peerConnection.setLocalDescription(answer);
  
        // Send the answer back to the user who sent the offer
        socket.emit('answer', peerConnection.localDescription, senderUserId);
      }
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  }, [peerConnections, createPeerConnection]);
  
  

// Function to handle an incoming answer
const handleAnswer = useCallback(async (answer, senderUserId) => {
  const peerConnection = peerConnections[senderUserId];

  try {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  } catch (error) {
    console.error('Error handling answer:', error);
  }
}, [peerConnections]);

// Function to handle an incoming ICE candidate
// const handleIceCandidate = useCallback(async (candidate, senderUserId) => {
//   const peerConnection = peerConnections[senderUserId];

//   try {
//     if (candidate && candidate.candidate) {
//       // Check signaling state before adding ICE candidate
//       if (peerConnection.signalingState !== 'closed') {
//         await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
//       }
//     }
//   } catch (error) {
//     console.error('Error handling ICE candidate:', error);
//   }
// }, [peerConnections]);
// Function to handle an incoming ICE candidate
const handleIceCandidate = useCallback(async (candidate, senderUserId) => {
  const peerConnection = peerConnections[senderUserId];

  try {
    if (candidate && candidate.candidate) {
      // Check if the ICE candidate includes the ufrag
      if (candidate.candidate.includes('a=ice-ufrag')) {
        // Check signaling state before adding ICE candidate
        if (peerConnection.signalingState !== 'closed') {
          await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        }
      }
    }
  } catch (error) {
    console.error('Error handling ICE candidate:', error);
  }
}, [peerConnections]);






  // //function to handle an incomming offer
  // const handleOffer = useCallback((offer, senderUserId) => {
  //   createPeerConnection(senderUserId);

  //   const peerConnection = peerConnections[senderUserId];
  //   peerConnection
  //     .setRemoteDescription(new RTCSessionDescription(offer))
  //     .then(() => peerConnection.createAnswer())
  //     .then((answer) => peerConnection.setLocalDescription(answer))
  //     .then(() => {
  //       //send the answer back to the user who sent the offer
  //       socket.emit('answer', peerConnection.localDescription, senderUserId);
  //     });
  // },[peerConnections, createPeerConnection]);

  // //function to handle an incoming answer
  // const handleAnswer = useCallback((answer, senderUserId) => {
  //   const peerConnection = peerConnections[senderUserId];
  //   peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  // },[peerConnections]);

  // //function to handle an incoming ICE candidate
  // const handleIceCandidate = useCallback((candidate, senderUserId) => {
  //   const peerConnection = peerConnections[senderUserId];
  //   peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  // },[peerConnections]);

  useEffect(() => {

    //Event handler when connection is established.
    socket.on('connect', () => {
        console.log('you are connect with id: ',socket.id );
    });

    //Event handler to reveive the list of users in the room
    // socket.on('users', (userList) => {
    //   // setUsers(userList);
    //   const uniqueUserList = Array.from(new Set(userList));
    //   setUsers(uniqueUserList);

    // });
    socket.on('users', (userList) => {
      setUsers((prevUsers) => {
        // Create a new object with unique user IDs
        const newUsers = {};
        userList.forEach((userId) => {
          if (!prevUsers[userId]) {
            newUsers[userId] = true;
          }
        });
        return { ...prevUsers, ...newUsers };
      });
    });

    //Event handler when a user has connected
    // socket.on('user-connected', (userId) => {
    //   setUsers((prevUsers) => [...prevUsers, userId]);

    //   //create peer connection with the new users
    //   createPeerConnection(userId);
    // });
    socket.on('user-connected', (userId) => {
      setUsers((prevUsers) => ({ ...prevUsers, [userId]: true }));

      createPeerConnection(userId);
    });

    // Event handler when user has disconnected
    // socket.on('user-disconnected', (userId) => {
    //   setUsers((prevUsers) => prevUsers.filter((user) => user !== userId));

    //   // close the peer connection
    //   closePeerConnection(userId);
    // });
    socket.on('user-disconnected', (userId) => {
      setUsers((prevUsers) => {
        // Create a new object without the disconnected user
        const newUsers = { ...prevUsers };
        delete newUsers[userId];
        return newUsers;
      });

      closePeerConnection(userId);
    });

    // Handle WebRTC signaling messages
    //offer
    socket.on('offer', (offer, senderUserId) => {
      handleOffer(offer,senderUserId);
    });

    //answer
    socket.on('answer', (answer, senderUserId) => {
      handleAnswer(answer, senderUserId);
    });

    //ice-candidate
    socket.on('ice-candidate', (candidate, senderUserId) => {
      handleIceCandidate(candidate,senderUserId);
    })


    //cleanup on component unmount
    return () => {
      Object.keys(peerConnections).forEach((userId) => {
        closePeerConnection(userId);
      })
    }

  },[roomId, peerConnections, closePeerConnection, createPeerConnection, handleOffer, handleAnswer, handleIceCandidate]);

  
  console.log(users);

  return (
    <div className='three'>
      <div>
        <label htmlFor='roomId'>Enter Room ID: </label>
        <input
          type='text'
          id='roomId'
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />
        <button onClick={handleJoinRoom}>Join Room</button>
      </div>
      <div className='video-container'>
        <div className={`video-frame user1`}>
          <video ref={userVideoRef} className="video-element" muted autoPlay playsInline style={{width:'300px', height:'300px'}}></video>
          <div className="user-id-label">You</div>
        </div>
        {Object.keys(users).filter((userId) => userId !== socket.id).map((userId) => (
          <div key={userId} className={`video-frame ${userId}`}>
            <video className="video-element" id={`video-${userId}`} autoPlay playsInline style={{width:'300px', height:'300px'}}></video>
            <div className="user-id-label">{userId}</div>
          </div>
        ))}
        <div className='video-controls'>video controls over here</div>
      </div>
    </div>
  );
}
