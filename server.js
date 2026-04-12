const dotenv = require('dotenv');
dotenv.config();
dotenv.config({ path: '.env.local' });
const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const ACTIONS = require('./src/actions');
const cors = require('cors');
const { connectMongo } = require('./server/db');
const createFsRouter = require('./server/routes/fs');
const createAuthRouter = require('./server/routes/auth');

const app = express();
const server = http.createServer(app);

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
const CORS_ORIGIN = ALLOWED_ORIGINS.length ? ALLOWED_ORIGINS : '*';

app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '1mb' }));

const io = new Server(server, {
    cors: {
        origin: CORS_ORIGIN,
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

const userSocketMap = {};

// Mongo-backed file storage API (optional, enabled when MONGODB_URI is set)
connectMongo(process.env.MONGODB_URI).catch((err) => {
    console.error('Mongo connection failed:', err.message);
});
app.use('/fs', createFsRouter());
app.use('/auth', createAuthRouter());

app.use(express.static(path.join(__dirname, 'build')));

function getAllConnectedClients(roomId) {
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map((socketId) => ({
        socketId,
        username: userSocketMap[socketId],
    }));
}

io.on('connection', (socket) => {
    console.log('socket connected:', socket.id);

    socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
        userSocketMap[socket.id] = username;
        socket.join(roomId);
        const clients = getAllConnectedClients(roomId);
        clients.forEach(({ socketId }) => {
            io.to(socketId).emit(ACTIONS.JOINED, {
                clients,
                username,
                socketId: socket.id,
            });
        });
    });

    socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
        socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
        io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    socket.on(ACTIONS.TYPING, ({ roomId, username, isTyping }) => {
        socket.in(roomId).emit(ACTIONS.TYPING, { username, isTyping });
    });

    socket.on(ACTIONS.CURSOR_CHANGE, ({ roomId, username, cursor }) => {
        socket.in(roomId).emit(ACTIONS.CURSOR_CHANGE, { username, cursor });
    });

    socket.on('disconnecting', () => {
        const rooms = [...socket.rooms];
        rooms.forEach((roomId) => {
            socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
                socketId: socket.id,
                username: userSocketMap[socket.id],
            });
        });
        delete userSocketMap[socket.id];
    });
});

app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1');
server.listen(PORT, HOST, () => console.log(`Listening on http://${HOST}:${PORT}`));
