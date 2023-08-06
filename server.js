const express = require('express');
const app = express();
const http = require('http');
const {Server} = require('socket.io');
const ACTIONS = require('./src/actions');

const server = http.createServer(app);
const io = new Server(server);

const userSocketMap = {};

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

io.on('connection',(socket) =>{
    console.log('socket is Connected', socket.id);

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

    socket.on(ACTIONS.CODE_CHANGE,({roomId,code}) => {
        socket.in(roomId).emit(ACTIONS.CODE_CHANGE, {code});
    })


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
