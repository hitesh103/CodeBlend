import React from 'react';
import Avatar from 'react-avatar';

/**
  * Renders a client component with the given username.
  * @param {string} username - The username of the client.
  * @returns {JSX.Element} - The client component.
  */
export default function Client({username}) {
  return (
    <div className='client'>
        <Avatar name={username} size={50} round="40px"/>
        <span className='username'>{username}</span>        
    </div>
  )
}
