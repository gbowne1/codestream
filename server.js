import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as AuthControllers from './src/controllers/AuthControllers.js';
import { auth, authorizeRole } from './src/middleware/auth.js';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

// Create HTTP server and attach Socket.IO
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: ['http://localhost:5173', 'http://localhost:3000'],
        methods: ['GET', 'POST']
    }
});

// Recreate __dirname since it is not available in ES Modules by default
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Enable CORS so your frontend can communicate with this API
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'] }));
app.use(express.json());

// DATABASE CONNECTION
mongoose.connect(MONGODB_URI)
    .then(() => console.log('[SUCCESS] MongoDB connected successfully.'))
    .catch(err => console.error('[ERROR] MongoDB connection error:', err));

//  AUTH ROUTES
app.post('/api/auth/register', AuthControllers.register);
app.post('/api/auth/login', AuthControllers.login);

app.get('/api/auth/me', auth, AuthControllers.getUserDetails);

app.get('/api/admin/dashboard', auth, authorizeRole(['admin']), (req, res) => {
    res.json({ message: `Access granted, Admin ID: ${req.user.id}.` });
});

app.get('/', (req, res) => {
    res.send(`
        <div style="font-family: sans-serif; text-align: center; padding-top: 50px;">
            <h1>🚀 DevStream API is Online</h1>
            <p>The server is running correctly.</p>
            <p>Access your data here: <a href="/api/streams">/api/streams</a></p>
        </div>
    `);
});

app.get('/api/streams', (req, res) => {
    const dataPath = join(__dirname, 'streams.json');

    fs.readFile(dataPath, 'utf8', (err, data) => {
        if (err) {
            console.error("Error reading streams.json:", err);
            return res.status(500).json({ error: "Internal Server Error: Could not read data file." });
        }
        try {
            res.json(JSON.parse(data));
        } catch (parseErr) {
            console.error("Error parsing JSON:", parseErr);
            res.status(500).json({ error: "Internal Server Error: Invalid JSON format." });
        }
    });
});

// ============== WEBRTC SIGNALING SERVER ==============
// Track active streams: { roomId: { broadcaster: socketId, viewers: [socketId] } }
const activeStreams = new Map();

// API: Get list of active live streams
app.get('/api/live-streams', (req, res) => {
    const streams = [];
    activeStreams.forEach((value, key) => {
        streams.push({ roomId: key, viewerCount: value.viewers.length });
    });
    res.json(streams);
});

io.on('connection', (socket) => {
    console.log(`[SOCKET] User connected: ${socket.id}`);

    // Broadcaster starts a stream
    socket.on('start-stream', (roomId) => {
        if (activeStreams.has(roomId)) {
            socket.emit('error', { message: 'Room already exists' });
            return;
        }
        socket.join(roomId);
        activeStreams.set(roomId, { broadcaster: socket.id, viewers: [] });
        console.log(`[LIVE] Stream started: ${roomId} by ${socket.id}`);
        socket.emit('stream-started', { roomId });
    });

    // Viewer joins a stream
    socket.on('join-stream', (roomId) => {
        const stream = activeStreams.get(roomId);
        if (!stream) {
            socket.emit('error', { message: 'Stream not found' });
            return;
        }
        socket.join(roomId);
        stream.viewers.push(socket.id);
        console.log(`[VIEWER] ${socket.id} joined ${roomId}`);

        // Notify broadcaster that a new viewer joined
        io.to(stream.broadcaster).emit('viewer-joined', { viewerId: socket.id });
    });

    // WebRTC signaling: Offer
    socket.on('offer', ({ roomId, offer, viewerId }) => {
        io.to(viewerId).emit('offer', { offer, broadcasterId: socket.id });
    });

    // WebRTC signaling: Answer
    socket.on('answer', ({ roomId, answer, broadcasterId }) => {
        io.to(broadcasterId).emit('answer', { answer, viewerId: socket.id });
    });

    // WebRTC signaling: ICE Candidate
    socket.on('ice-candidate', ({ roomId, candidate, targetId }) => {
        io.to(targetId).emit('ice-candidate', { candidate, senderId: socket.id });
    });

    // Stop stream
    socket.on('stop-stream', (roomId) => {
        if (activeStreams.has(roomId)) {
            io.to(roomId).emit('stream-ended');
            activeStreams.delete(roomId);
            console.log(`[ENDED] Stream ended: ${roomId}`);
        }
    });

    // Disconnect handling
    socket.on('disconnect', () => {
        console.log(`[SOCKET] User disconnected: ${socket.id}`);

        // Check all streams for this socket
        activeStreams.forEach((stream, roomId) => {
            if (stream.broadcaster === socket.id) {
                // Broadcaster disconnected - end the stream for all viewers
                io.to(roomId).emit('stream-ended', { reason: 'Broadcaster disconnected' });
                activeStreams.delete(roomId);
                console.log(`[ENDED] Stream ${roomId} ended (broadcaster disconnected)`);
            } else if (stream.viewers.includes(socket.id)) {
                // Viewer disconnected - remove from list and notify broadcaster
                stream.viewers = stream.viewers.filter(id => id !== socket.id);
                io.to(stream.broadcaster).emit('viewer-left', {
                    viewerId: socket.id,
                    viewerCount: stream.viewers.length
                });
                console.log(`[VIEWER] ${socket.id} left ${roomId}. Viewers remaining: ${stream.viewers.length}`);
            }
        });
    });
});

httpServer.listen(PORT, () => {
    console.log(`\n[SUCCESS] Server successfully started!`);
    console.log(`[HOME] http://localhost:${PORT}`);
    console.log(`[SIGNALING] WebRTC Signaling: ws://localhost:${PORT}`);
});