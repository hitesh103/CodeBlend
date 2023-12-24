import React, { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import ACTIONS from "../actions";
import logo from "./logo.png";
import Client from "../components/Client";
import Editor from "../components/Editor";
import { initSocket } from "../socket";
import {
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

function removeDuplicateClasses(classNames) {
  const classesArray = classNames.split(" ");
  const uniqueClasses = new Set(classesArray);
  return Array.from(uniqueClasses).join(" ");
}

function EditorPage() {
  const socketRef = useRef(null);
  const codeRef = useRef(null);
  const location = useLocation();
  const { roomId } = useParams();
  const reactNavigator = useNavigate();

  const [clients, setClients] = useState([]);

  // // Define the event handler functions outside of useEffect
  // const handleJoined = ({ clients, username, socketId }) => {
  //   if (username !== location.state.username) {
  //     toast.success(`${username} joined the room.`);
  //     console.log(`${username} joined`);
  //   }
  //   setClients(clients);
  // };

  const handleDisconnected = ({ socketId, username }) => {
    toast.success(`${username} left the room.`);
    setClients((prev) => {
      return prev.filter((client) => client.socketId !== socketId);
    });
  };

  useEffect(() => {
    const init = async () => {
      console.debug("Entered init");
      socketRef.current = await initSocket();
      socketRef.current.on("connect_error", (err) => handleErrors(err));
      socketRef.current.on("connect_failed", (err) => handleErrors(err));

      function handleErrors(e) {
        console.log("socket error", e);
        toast.error("Socket connection failed, try again later");
        reactNavigator("/");
      }

      socketRef.current.emit(ACTIONS.JOIN, {
        roomId,
        username: location.state?.username,
      });

      //Listening For joined event
      socketRef.current.on(
        ACTIONS.JOINED,
        ({ clients, username, socketId }) => {
          if (username !== location.state.username) {
            toast.success(`${username} joined the room.`);
            console.log(`${username} joined`);
          }

          let uniqueUsernames = new Set();

          // Use filter to remove duplicates in the existing array
          clients = clients.filter(client => {
              // If the username is not in the set, add it and keep the object
              if (!uniqueUsernames.has(client.username)) {
                  uniqueUsernames.add(client.username);
                  return true;
              }
              return false;
          });

          setClients(clients);
          socketRef.current.emit(ACTIONS.SYNC_CODE, {
            code: codeRef.current,
            socketId,
          });
        }
      );

      //Listening For Disconnected
      socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
        toast.success(`${username} left the room.`);
        setClients((prev) => {
          return prev.filter((client) => client.socketId !== socketId);
        });
      });
    };
    function remElement(className) {
      var elements = document.getElementsByClassName(className);
      while (elements.length > 1) {
        elements[0].parentNode.removeChild(elements[1]);
      }
    
      var editorElement = document.querySelector(".cm-s-dracula");
      if (editorElement) {
        editorElement.style.height = "97.90vh";
      }
    }
    init();
    remElement("cm-s-dracula");
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current.off(ACTIONS.JOINED);
        socketRef.current.off(ACTIONS.DISCONNECTED);
        socketRef.current.off(ACTIONS.CODE_CHANGE);
      }
    };
  }, []);

  async function copyRoomId(roomId) {
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success("Room Id is copied.");
    } catch (err) {
      toast.error("Not copied room Id.");
      console.error(err);
    }
  }

  function leaveRoom() {
    reactNavigator("/");
  }

  if (!location.state) {
    return <Navigate to="/" />;
  }

  return (
    <div className="mainWrap">
      <div className="aside">
        <div className="asideInner">
          <div className="logo">
            <img className="logoImage" src={logo} alt="logo"></img>
          </div>
        <button
          className="btn copyBtn"
          onClick={() => copyRoomId(roomId.toString())}
        >
          Copy Room ID
        </button>
        <button className="btn leaveBtn" onClick={leaveRoom}>
          Leave
        </button>
          <h3>Connected</h3>
          <div className="clientList">
            {clients.map((client) => (
              <Client key={client.socketId} username={client.username} />
            ))}
          </div>
        </div>
      </div>
      <div className="editorWrap">
        <Editor
          socketRef={socketRef}
          roomId={roomId}
          onCodeChange={(code) => {
            codeRef.current = code;
          }}
          className={removeDuplicateClasses("CodeMirror cm-s-dracula cm-s-default")}
        />
      </div>
    </div>
  );
}

export default EditorPage;




