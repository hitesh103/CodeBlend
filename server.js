const express = require('express');
const app = express();
const http = require('http');
const {Server} = require('socket.io');
const ACTIONS = require('./src/actions');

const server = http.createServer(app);
const io = new Server(server);

const userSocketMap = {};

function getAllConnectedClients(roomId){
    //Map
    const clients = io.sockets.adapter.rooms.get(roomId);
    if (!clients) {
        return [];
    }

    return Array.from(clients).map((socketId) => {
        return {
            socketId,
            username: userSocketMap[socketId],
        }
    });
}

io.on('connection',(socket) =>{
    console.log('socket is Connected', socket.id);

    socket.on(ACTIONS.JOIN, ({roomId,username}) => {
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
    })
})


const PORT = process.env.PORT || 5000;
server.listen(PORT,()=>{console.log(`Listening on port ${PORT}`)});