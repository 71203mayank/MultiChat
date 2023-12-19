import React, { useEffect, useRef, useState} from 'react'
import { io } from 'socket.io-client'
import Peer from 'simple-peer'

const socket = io.connect('http://localhost:5000')

export default function Multiuser() {
  
  const [roomId, setRoomId] = useState('')
  const [userId,setUserId] = useState('')
  const [users, setUsers] = useState([]);

  const userVideoRef = useRef();
  const [stream, setStream] = useState()

  const [peers, setPeers] = useState([]);
  const peersRef = useRef([]);

  
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      setStream(stream)
      userVideoRef.current.srcObject = stream
		})
    
    return () => {
      
    }
  },[]);
  
  
  const handleJoinRoom = () => {
      socket.emit('join-room', roomId);

      socket.on('users',(userList) => {
        setUsers(userList);
  
        const peers = [];
        userList.forEach(id => {
          console.log(id)
          // now offer new peer to these users:
          const peer = createInitiatorPeerConnection(id);
          peersRef.current.push({
            id: id,
            peer
          });
          peers.push(peer)
        });

        setPeers(peers);
      });

      socket.on('incoming-call', ({signal, from}) => {
        createNonInititatorPeerConnection(signal, from);
      })

      socket.on('incoming-answer', ({signal, from}) => {
        // for that particular peer, do peer.signal(signal)
        const peer = peersRef.current.find( element => element.id === from);
        peer.peer.signal(signal);
      })
  }


  const createNonInititatorPeerConnection = (signal, id) => {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream
    })
    peer.on('signal', (data) => {
      socket.emit('answer-call',({userId: id, signal: data}));
    });

    peer.on('stream', (remoteStream) => {
      const otherUserVideo = document.createElement('video');
      otherUserVideo.srcObject = remoteStream;
      document.querySelector('.other-users-video-container').appendChild(otherUserVideo);
    });

    //sending the video stream of the 
    peer.signal(signal);
  };

  const createInitiatorPeerConnection = (id) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream
    })

    peer.on('signal', (data) => {
      socket.emit('call-user',({userId: id, signalData: data}));
    })

    peer.on('stream',( remoteStream) => {
      const otherUerVideo = document.createElement('video');
      otherUerVideo.srcObject = remoteStream;
      document.querySelector('.other-users-video-container').appendChild(otherUerVideo);
    });

    // peer.signal()

    return peer;
  }

  useEffect(() => {
    socket.on('connect', () => {
      console.log('you are connected with id: ', socket.id);
      setUserId(socket.id);
    });
  },[])

  return (
    <div className='multi-user'>
      <div>Your UserId: {userId}</div>
      <div>
        <input 
        type = 'text'
        id = 'roomId'
        value = {roomId} 
        onChange={(e) => setRoomId(e.target.value) }
        />
        <button onClick={handleJoinRoom}> JOIN ROOM</button>
      </div>
      <div className='video-container'>
        <div className='user-video-container'>
          <video ref={userVideoRef} className="video-element" muted autoPlay playsInline style={{width:'300px', height:'300px'}}></video>
        </div>
        <div className='other-users-video-container'>

        </div>
      </div>
      <div>
        <h2>List of all Users</h2>
        {users.map((userName, id) => ( 
          <div key={id}>{userName}</div>
        ))}

        <h2>List of all Peers</h2>
        {peers.map((peer, id) => (
          <div key={id}>{peer.id}</div>
        ))}
      </div>
    </div>
  )
}
