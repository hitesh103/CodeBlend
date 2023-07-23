import React, { useState } from 'react';
import logo from './logo.png';
import './style/style.css';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');

  const createNewRoom = (e) => {
    e.preventDefault();
    const id = uuidv4();
    setRoomId(id);
    toast.success('Created New Room');
  };

  const  handleInputEnter = (e) => {
    if(e.code === 'Enter'){
      joinRoom();
    }
  }

  const joinRoom = () => {
    if (!roomId || !username) {
      toast.error('Room Id & username is required');
      return;
    }

    // Redirect
    navigate(`/editor/${roomId}`, {
      state: {
        username,
      },
    });
  };

  return (
    <div className="homePageWrapper">
      <div className="formWrapper">
        <img className="logo" src={logo} alt="na" />
        <h4 className="mainLabel">Paste Invation Room ID</h4>
        <div className="inputGroup">
          <input
            type="text"
            className="inputBox"
            placeholder="ROOM ID"
            onChange={(e) => setRoomId(e.target.value)}
            value={roomId}
            onKeyUp={handleInputEnter}
          />
          <input
            type="text"
            className="inputBox"
            placeholder="User Name"
            onChange={(e) => setUsername(e.target.value)}
            value={username}
            onKeyUp={handleInputEnter}
          />
          <button className="btn joinBtn" onClick={joinRoom} >
            Join
          </button>
          <span className="createInfo">
            If you don't have invite create &nbsp;
            <a onClick={createNewRoom} href="" className="Create New">
              Create Room
            </a>
          </span>
        </div>
      </div>
      <footer>
        Crafted with 💜 By &nbsp;
        <a href="https://github.com/Hitesh103">Hitesh</a>.
      </footer>
    </div>
  );
}

export default Home;
