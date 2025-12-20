import express from 'express';
import cors from 'cors';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const app = express();
const PORT = process.env.PORT || 3000;

// Recreate __dirname since it is not available in ES Modules by default
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Enable CORS so your frontend can communicate with this API
app.use(cors());

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

app.listen(PORT, () => {
    console.log(`\n✅ Server successfully started!`);
    console.log(`🏠 Home: http://localhost:${PORT}`);
});