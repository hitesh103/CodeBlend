import React, { useState } from 'react'
import logo from './logo.png';
import Client from '../components/Client';
import Editor from '../components/Editor';

function EditorPage() {

const [clients,setClients] = useState([
  {socketId : 1, username : 'Hitesh Prajapati'},
  {socketId : 2, username: 'Dantani Sahil'},
  {socketId : 3, username: 'Mitesh Prajapati'},
  {socketId : 4, username: 'Nayan Prajapati'}, 
]);

  return (
    <div className='mainWrap'>
      <div className='aside'>
        <div className='asideInner'>
          <div className='logo'>
            <img className='logoImage' src={logo} alt='logo'></img>
          </div>
          <h3>Connected</h3>
          <div className='clientList'>
            {clients.map((client) => (
              <Client key={client.socketId} username={client.username}/>
            ))}
          </div>
        </div>
        <button className='btn copyBtn'>Copy Room ID</button>
        <button className='btn leaveBtn'>Leave</button>
      </div>
      <div className='editorWrap'>
        <Editor/>
      </div>
    </div>
  )
}

export default EditorPage;