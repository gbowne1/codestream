import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import * as AuthControllers from './src/controllers/AuthControllers.js';
import { auth, authorizeRole } from './src/middleware/auth.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ],
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Authorization'],
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
});
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;

// Recreate __dirname since it is not available in ES Modules by default
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Security headers
app.use(helmet());

// Secure CORS with env based origin
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  })
);

app.use(express.json());
// DATABASE CONNECTION
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log('🟢 MongoDB connected successfully.'))
  .catch((err) => console.error('🔴 MongoDB connection error:', err));

//  AUTH ROUTES
app.post('/api/auth/register', AuthControllers.register);
app.post('/api/auth/login', AuthControllers.login);

/**
 * @route GET /api/auth/me
 * @desc Gets the currently logged-in user's details (eg: username, role).
 * This endpoint demonstrates basic 'auth' middleware protection.
 */
app.get('/api/auth/me', auth, AuthControllers.getUserDetails);

/**
 * @route GET /api/admin/dashboard
 * @desc Example of a route restricted to 'admin' roles only.
 * This demonstrates Role-Based Access Control.
 */
app.get('/api/admin/dashboard', auth, authorizeRole(['admin']), (req, res) => {
  // req.user is available here due to the 'auth' middleware
  res.json({ message: `Access granted, Admin ID: ${req.user.id}.` });
});

/**
 * Root Route
 * This fixes the "Cannot GET /" error by providing a landing page.
 */
app.get('/', (req, res) => {
  res.send(`
        <div style="font-family: sans-serif; text-align: center; padding-top: 50px;">
            <h1>🚀 DevStream API is Online</h1>
            <p>The server is running correctly.</p>
            <p>Access your data here: <a href="/api/streams">/api/streams</a></p>
        </div>
    `);
});

/**
 * API Endpoint: /api/streams
 * Reads the mock data from streams.json and returns it as JSON.
 */
app.get('/api/streams', (req, res) => {
  const dataPath = join(__dirname, 'streams.json');

  fs.readFile(dataPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading streams.json:', err);
      return res
        .status(500)
        .json({ error: 'Internal Server Error: Could not read data file.' });
    }
    try {
      res.json(JSON.parse(data));
    } catch (parseErr) {
      console.error('Error parsing JSON:', parseErr);
      res
        .status(500)
        .json({ error: 'Internal Server Error: Invalid JSON format.' });
    }
  });
});

// ================= SOCKET.IO CHAT =================

// Store connected users with their roles
const connectedUsers = new Map();

// Store chat message history (in-memory, max 100 messages)
const chatHistory = [];
const MAX_HISTORY = 100;

// Role hierarchy for permissions (higher number = more permissions)
const roleHierarchy = {
  user: 1,
  vip: 2,
  moderator: 3,
  broadcaster: 4,
  administrator: 5,
  admin: 5,
  bot: 6,
};

// Helper function to verify socket token
const verifySocketToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
};

// Helper function to check if user has permission
const hasPermission = (userRole, requiredRole) => {
  return (roleHierarchy[userRole] || 0) >= (roleHierarchy[requiredRole] || 0);
};

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  const persistentUserId = socket.handshake.auth.persistentUserId;

  if (!token) {
    // Use persistent user ID if provided, otherwise generate guest ID
    const username = persistentUserId || `Guest_${socket.id.substring(0, 6)}`;
    socket.user = {
      id: persistentUserId || socket.id,
      username: username,
      role: 'user',
      persistentId: persistentUserId,
    };
    return next();
  }

  const decoded = verifySocketToken(token);
  if (decoded) {
    // If authenticated, use token data but preserve persistent ID for message matching
    socket.user = {
      ...decoded,
      persistentId: persistentUserId || decoded.id,
    };
    next();
  } else {
    // Allow connection but with limited user role, use persistent ID
    const username = persistentUserId || `Guest_${socket.id.substring(0, 6)}`;
    socket.user = {
      id: persistentUserId || socket.id,
      username: username,
      role: 'user',
      persistentId: persistentUserId,
    };
    next();
  }
});

io.on('connection', (socket) => {
  const user = socket.user;
  // Use persistent ID if available, otherwise use socket ID
  const userId = user.persistentId || user.id || socket.id;
  const username = user.username || `Guest_${socket.id.substring(0, 6)}`;
  const role = user.role || 'user';

  // Store user info with persistent ID
  connectedUsers.set(socket.id, {
    id: userId,
    persistentId: user.persistentId || userId,
    username,
    role,
    socketId: socket.id,
  });

  // Send user info to client so they can identify their own messages
  socket.emit('userInfo', {
    username,
    role,
    id: userId,
    persistentId: user.persistentId || userId,
  });

  // Send chat history to newly connected user
  if (chatHistory.length > 0) {
    socket.emit('chatHistory', chatHistory);
  }

  console.log(
    `👤 User connected: ${username} (${role}) [ID: ${userId}] [Socket: ${socket.id}]`
  );

  // Broadcast user joined (only for non-bot users)
  if (role !== 'bot') {
    const joinMessage = {
      id: Date.now(),
      username: 'System',
      message: `${username} joined the chat`,
      role: 'bot',
      timestamp: new Date().toISOString(),
      type: 'system',
    };

    // Add system messages to history (but don't count toward MAX_HISTORY limit)
    chatHistory.push(joinMessage);
    if (chatHistory.length > MAX_HISTORY * 2) {
      // Only trim if it gets really large
      chatHistory.splice(0, chatHistory.length - MAX_HISTORY);
    }

    io.emit('chatMessage', joinMessage);
  }

  // Handle chat messages
  socket.on('chatMessage', (data) => {
    const userInfo = connectedUsers.get(socket.id);
    if (!userInfo) return;

    const { message } = data;

    // Validate message
    if (
      !message ||
      typeof message !== 'string' ||
      message.trim().length === 0
    ) {
      socket.emit('error', { message: 'Message cannot be empty' });
      return;
    }

    if (message.length > 500) {
      socket.emit('error', {
        message: 'Message is too long (max 500 characters)',
      });
      return;
    }

    // Create message object with persistent ID for client matching
    const chatMessage = {
      id: Date.now(),
      username: userInfo.username,
      message: message.trim(),
      role: userInfo.role,
      timestamp: new Date().toISOString(),
      type: 'user',
      userId: userInfo.id,
      persistentId: userInfo.persistentId || userInfo.id,
    };

    // Add to chat history
    chatHistory.push(chatMessage);

    // Keep only the last MAX_HISTORY messages
    if (chatHistory.length > MAX_HISTORY) {
      chatHistory.shift(); // Remove oldest message
    }

    // Broadcast message to all clients
    io.emit('chatMessage', chatMessage);
    console.log(`💬 [${userInfo.role}] ${userInfo.username}: ${message}`);
  });

  // Moderator/Broadcaster/Admin actions
  socket.on('modAction', (data) => {
    const userInfo = connectedUsers.get(socket.id);
    if (!userInfo) return;

    const { action, targetUsername, reason } = data;

    // Check if user has moderator permissions
    if (!hasPermission(userInfo.role, 'moderator')) {
      socket.emit('error', {
        message: 'Insufficient permissions for this action',
      });
      return;
    }

    switch (action) {
      case 'timeout':
        // Find target user and timeout them
        const targetSocket = Array.from(connectedUsers.values()).find(
          (u) => u.username === targetUsername
        )?.socketId;

        if (targetSocket) {
          io.to(targetSocket).emit('timeout', {
            duration: data.duration || 60,
            reason,
          });
          io.emit('chatMessage', {
            id: Date.now(),
            username: 'System',
            message: `${targetUsername} has been timed out${reason ? `: ${reason}` : ''}`,
            role: 'bot',
            timestamp: new Date().toISOString(),
            type: 'system',
          });
        }
        break;

      case 'ban':
        const banTarget = Array.from(connectedUsers.values()).find(
          (u) => u.username === targetUsername
        )?.socketId;

        if (banTarget) {
          io.to(banTarget).emit('banned', { reason });
          io.to(banTarget).disconnectSockets();
          io.emit('chatMessage', {
            id: Date.now(),
            username: 'System',
            message: `${targetUsername} has been banned${reason ? `: ${reason}` : ''}`,
            role: 'bot',
            timestamp: new Date().toISOString(),
            type: 'system',
          });
        }
        break;

      case 'delete':
        // Delete a message by ID (broadcast to all)
        io.emit('deleteMessage', { messageId: data.messageId });
        break;
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const userInfo = connectedUsers.get(socket.id);
    if (userInfo && userInfo.role !== 'bot') {
      const leaveMessage = {
        id: Date.now(),
        username: 'System',
        message: `${userInfo.username} left the chat`,
        role: 'bot',
        timestamp: new Date().toISOString(),
        type: 'system',
      };

      // Add to history
      chatHistory.push(leaveMessage);
      if (chatHistory.length > MAX_HISTORY * 2) {
        chatHistory.splice(0, chatHistory.length - MAX_HISTORY);
      }

      io.emit('chatMessage', leaveMessage);
    }
    connectedUsers.delete(socket.id);
    console.log(`👋 User disconnected: ${socket.id}`);
  });
});

// ================= SERVER START =================

httpServer.listen(PORT, () => {
  console.log(`\n✅ Server successfully started!`);
  console.log(`🏠 Home: http://localhost:${PORT}`);
  console.log(`💬 Socket.IO server running on port ${PORT}`);
});
