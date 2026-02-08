import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as AuthControllers from './src/controllers/AuthControllers.js';
import { auth, authorizeRole } from './src/middleware/auth.js';

const app = express();
app.use(morgan('dev'));
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

// Recreate __dirname since it is not available in ES Modules by default
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Enable CORS so your frontend can communicate with this API
// Middleware setup (must be before routes)
app.use(cors({ origin: 'http://localhost:3000' })); // SECURE CORS
app.use(express.json());

// DATABASE CONNECTION
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('🟢 MongoDB connected successfully.');
  } catch (err) {
    console.error('🔴 MongoDB connection error:', err);
  }
};
connectDB();
if (MONGODB_URI) {
    mongoose.connect(MONGODB_URI)
        .then(() => console.log(' MongoDB connected successfully.'))
        .catch(err => console.error(' MongoDB connection error:', err));
} else {
    console.log('MONGODB_URI not defined. Skipping database connection (Mock mode).');
}

// Secure CORS with env based origin
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  })
);

//  AUTH ROUTES 
app.post('/api/auth/register', AuthControllers.register);
app.post('/api/auth/login', AuthControllers.login);

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
            <h1> DevStream API is Online</h1>
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

// 404 Not Found handler (must be after all routes)
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
  });
});

app.listen(PORT, () => {
  console.log(`\n✅ Server successfully started!`);
  console.log('\n✅ Server successfully started!');
  console.log(`🏠 Home: http://localhost:${PORT}`);
});
