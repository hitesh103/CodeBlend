const express = require('express');
const app = express();
const http = require('http');
const {Server} = require('socket.io');
const ACTIONS = require('./src/actions');

const server = http.createServer(app);
const io = new Server(server);

const userSocketMap = {};

/**
Retrieves all connected clients in a given room.
@param {string} roomId - The ID of the room.
@returns {Array} - An array of objects containing the socket ID and username of each connected client.
*/
function getAllConnectedClients(roomId){
    // Map
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
        (socketId) => {
            return {
                socketId,
                username: userSocketMap[socketId],
            };
        }
    );
}


/**
This function is called when a socket connection is established.
It logs the socket ID to the console.
@param {object} socket - The socket object representing the connection.
*/
io.on('connection',(socket) =>{
    console.log('socket is Connected', socket.id);
    /**
    This event is triggered when a user joins a room.
    It stores the username in the userSocketMap object using the socket ID as the key.
    The socket joins the specified room.
    It retrieves all connected clients in the room.
    For each client, it emits a JOINED event to notify them about the new user.
    @param {object} data - The data object containing the roomId and username.
    */
    socket.on(
        ACTIONS.JOIN, ({roomId,username}) => {
        userSocketMap[socket.id] = username;
        socket.join(roomId);
        const client = getAllConnectedClients(roomId);
        client.forEach(({socketId}) => {
            io.to(socketId).emit(ACTIONS.JOINED,{
                clients: client,
                username,
                socketId: socket.id,
            })
        });
    }); 

    /**
    This event is triggered when the code in a room is changed.
    It emits a CODE_CHANGE event to all sockets in the room, except the sender.
    @param {object} data - The data object containing the roomId and code.
    */
    socket.on(ACTIONS.CODE_CHANGE,({roomId,code}) => {
        socket.in(roomId).emit(ACTIONS.CODE_CHANGE, {code});
    })

    /**
    This event is triggered when a socket wants to sync its code with another socket.
    It emits a CODE_CHANGE event to the specified socket.
    @param {object} data - The data object containing the socketId and code.
    */
    socket.on(ACTIONS.SYNC_CODE,({socketId,code}) => {
        io.to(socketId).emit(ACTIONS.CODE_CHANGE, {code});
    })

    /**
    This event is triggered when a socket is disconnecting.
    It emits a DISCONNECTED event to all sockets in the rooms the socket is connected to.
    It also removes the socket ID and username from the userSocketMap object.
    The socket leaves all rooms it is connected to.
    */
    socket.on('disconnecting',()=>{
        const rooms = [...socket.rooms];
        rooms.forEach((roomId)=>{
            socket.in(roomId).emit(ACTIONS.DISCONNECTED,{
                socketId : socket.id,
                username : userSocketMap[socket.id],
            })
        })
        delete userSocketMap[socket.id];
        socket.leave();
    })

})


const PORT = process.env.PORT || 5000;
server.listen(PORT,()=>{console.log(`Listening on port ${PORT}`)});
