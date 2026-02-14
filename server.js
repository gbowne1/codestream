import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import fs from 'fs';
import helmet from 'helmet';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as AuthControllers from './src/controllers/AuthControllers.js';
import { auth, authorizeRole } from './src/middleware/auth.js';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

// Middleware
app.use(helmet());
app.use(morgan('dev'));
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json());

// MongoDB
if (MONGODB_URI) {
  mongoose
    .connect(MONGODB_URI)
    .then(() => console.log('🟢 MongoDB connected'))
    .catch((err) => console.error('🔴 MongoDB error:', err));
} else {
  console.log('⚠️ No MongoDB URI defined (mock mode)');
}

// ES Module __dirname fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// AUTH ROUTES
app.post('/api/auth/register', AuthControllers.register);
app.post('/api/auth/login', AuthControllers.login);
app.get('/api/auth/me', auth, AuthControllers.getUserDetails);

// Admin example
app.get('/api/admin/dashboard', auth, authorizeRole(['admin']), (req, res) => {
  res.json({ message: `Access granted, Admin ID: ${req.user.id}.` });
});

// Streams JSON route
app.get('/api/streams', (req, res) => {
  const dataPath = join(__dirname, 'streams.json');

  fs.readFile(dataPath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Could not read data file.' });
    }
    res.json(JSON.parse(data));
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ========== SOCKET.IO ==========
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

const activeStreams = new Map();

io.on('connection', (socket) => {
  console.log(`[SOCKET] Connected: ${socket.id}`);

  socket.on('start-stream', (roomId) => {
    if (activeStreams.has(roomId)) return;
    socket.join(roomId);
    activeStreams.set(roomId, { broadcaster: socket.id, viewers: [] });
  });

  socket.on('disconnect', () => {
    activeStreams.forEach((stream, roomId) => {
      if (stream.broadcaster === socket.id) {
        io.to(roomId).emit('stream-ended');
        activeStreams.delete(roomId);
      }
    });
  });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`\n✅ Server running at http://localhost:${PORT}`);
});
