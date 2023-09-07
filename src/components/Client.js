import React from 'react';
import Avatar from 'react-avatar';

export default function Client({username}) {
  return (
    <div className='client'>
        <Avatar name={username} size={50} round="40px"/>
        <span className='username'>{username}</span>        
    </div>
  )
}
