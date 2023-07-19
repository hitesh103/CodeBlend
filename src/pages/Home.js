import React from 'react';
import logo from './logo.png';
import './style/style.css';


function Home() {
  return (
    <div className='homePageWrapper'>
        <div className='formWrapper'>
            <img className='logo' src={logo} alt='na'/>
            <h4 className='mainLabel'>Paste Invation Room ID</h4>
            <div className='inputGroup'>
              <input type='text' className='inputBox' placeholder='ROOM ID'></input>
              <input type='text' className='inputBox' placeholder='User Name'></input>
              <button className='btn joinBtn'>Join</button>
              <span className='createInfo'>If you don't have invite create &nbsp;
              <a href='' className='Create New'>Create Room</a>
              </span>
            </div>
        </div>
        <footer>Crafted with 💜 By &nbsp;
          <a href='https://github.com/Hitesh103'>Hitesh</a>.</footer>
    </div>
  )
}

export default Home;
