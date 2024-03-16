import React, { useState } from 'react';
import logo from './logo.png';
import './style/style.css';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

/**
 * Home component
 * Renders the home page with a form to join or create a room
 */
function Home() {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');

  /**
   * Creates a new room
   * @param {Event} e - The event object
   */
  const createNewRoom = (e) => {
    e.preventDefault();
    const id = uuidv4();
    setRoomId(id);
    toast.success('Created New Room');
  };

  /**
   * Handles the Enter key press event on the input fields
   * Calls the joinRoom function if the Enter key is pressed
   * @param {Event} e - The event object
   */
  const handleInputEnter = (e) => {
    if(e.code === 'Enter'){
      joinRoom();
    }
  }

  /**
   * Joins a room
   * Redirects to the editor page with the roomId and username as state
   */
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
            //This function is triggered when the value of an input element changes.
            //It updates the roomId state variable with the new value.
            onChange={(e) => setUsername(e.target.value)}
            value={username}
            onKeyUp={handleInputEnter}
          />
          <button className="btn joinBtn" onClick={joinRoom} >
            Join
          </button>
          <span className="createInfo">
            If you don't have invite &nbsp;
            <a onClick={createNewRoom} href="" className="Create New">
            &#8618; Create Room 
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
