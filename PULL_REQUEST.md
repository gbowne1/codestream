# Pull Request: Add Go Live Feature (WebRTC Browser Streaming)

## Summary

This PR implements a "Go Live" feature that allows users to stream directly from their browser using WebRTC. No external software (like OBS) is required.

## Changes

### Backend (`server.js`)

- Added Socket.IO signaling server for WebRTC peer connection establishment
- New endpoint `GET /api/live-streams` to list active streams
- Room-based stream management with automatic cleanup on disconnect

### Frontend - Broadcaster (`go-live.html`, `src/js/go-live.js`)

- New "Go Live Dashboard" page accessible from navigation
- "Share Screen" and "Use Camera" buttons for media capture
- Real-time viewer count display
- Comprehensive error handling for permission denials

### Frontend - Viewer (`src/js/main.js`)

- Updated stream detail modal to use WebRTC playback
- Connects to signaling server and receives live video via peer connection
- Shows stream status (connecting, live, ended, offline)

### Dependencies Added

- `socket.io` - Server-side real-time communication
- `socket.io-client` - Client-side Socket.IO

### Security

- CORS restricted to localhost origins
- Room-based isolation prevents cross-stream access
- STUN-only ICE configuration (no TURN relay)
- All connections go through signaling server (no direct IP exposure)

## Testing Instructions

1. Start the server: `node server.js`
2. Start the frontend: `npm run dev`
3. Open `/go-live.html` in one browser tab
4. Click "Share Screen" or "Use Camera", then "Start Streaming"
5. Open the home page in another tab and click the matching stream card
6. Verify video plays in the modal

## Files Changed

- `server.js` - Added Socket.IO signaling
- `go-live.html` - New broadcaster dashboard
- `src/js/go-live.js` - WebRTC broadcaster logic
- `src/js/main.js` - WebRTC viewer logic
- `index.html` - Added Go Live nav link
- `package.json` - Added socket.io dependencies
