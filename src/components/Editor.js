import React, { useEffect, useRef } from 'react';
import Codemirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/theme/dracula.css';
import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/edit/closebrackets';
import ACTIONS from '../actions';

/**
 * Editor component for real-time code editing with CodeMirror.
 * @param {Object} props - The props object.
 * @param {Object} props.socketRef - A reference to the WebSocket connection.
 * @param {string} props.roomId - The ID of the room for real-time collaboration.
 * @param {Function} props.onCodeChange - A callback function to handle code changes.
 */
const Editor = ({socketRef, roomId, onCodeChange}) => {
 const editorRef = useRef(null);

 /**
   * Initializes the CodeMirror editor instance.
   * Sets up event listeners for editor changes and server updates.
   */
 useEffect(() => {
    async function init() {
      editorRef.current = Codemirror.fromTextArea(document.getElementById('realtimeEditor'), {
        mode: { name: 'javascript', json: true },
        theme: 'dracula',
        autoCloseTags : true,
        autoCloseBrackets : true,
        lineNumbers : true,
      });

      editorRef.current.on('change',(instance,changes)=>{
        const {origin} = changes;
        const code = instance.getValue();
        onCodeChange(code); 
        if(origin !== 'setValue'){
          socketRef.current.emit(ACTIONS.CODE_CHANGE,{
            roomId,
            code,
          });
        }
       })
    }
    init();
 }, []); 

 /**
   * Listens for code changes from the server and updates the editor accordingly.
   */
 useEffect(() => {
    if(socketRef.current){
      socketRef.current.on(ACTIONS.CODE_CHANGE,({code})=>{
        if(code !== null){
          editorRef.current.setValue(code);
        }
      })
    }
 },[socketRef.current]);

 return (
    <textarea id='realtimeEditor'></textarea>
 );
};

export default Editor;