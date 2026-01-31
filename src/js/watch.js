import { io } from 'socket.io-client';

// ============== CONFIG ==============
const SIGNALING_SERVER = 'http://localhost:3000';
const ICE_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' }
];

// ============== STATE ==============
let socket = null;
let peerConnection = null;
let currentRoomId = null;

// ============== DOM ELEMENTS ==============
const joinSection = document.getElementById('joinSection');
const playerSection = document.getElementById('playerSection');
const roomIdInput = document.getElementById('roomIdInput');
const joinBtn = document.getElementById('joinBtn');
const leaveBtn = document.getElementById('leaveBtn');
const streamPlayer = document.getElementById('streamPlayer');
const streamTitle = document.getElementById('streamTitle');
const statusBadge = document.getElementById('statusBadge');
const connectionInfo = document.getElementById('connectionInfo');

// ============== UI HELPERS ==============
function showPlayer() {
    joinSection.classList.add('d-none');
    playerSection.classList.remove('d-none');
}

function showJoinForm() {
    playerSection.classList.add('d-none');
    joinSection.classList.remove('d-none');
}

function updateStatus(text, badgeClass) {
    statusBadge.textContent = text;
    statusBadge.className = `badge status-badge ${badgeClass}`;
}

function updateConnectionInfo(text) {
    connectionInfo.innerHTML = `<i class="fas fa-wifi me-1"></i> ${text}`;
}

// ============== WEBRTC ==============
function createPeerConnection(broadcasterId) {
    peerConnection = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    peerConnection.ontrack = (event) => {
        streamPlayer.srcObject = event.streams[0];
        updateStatus('LIVE', 'bg-danger');
        updateConnectionInfo('Receiving live stream');
    };

    peerConnection.onicecandidate = (event) => {
        if (event.candidate && socket) {
            socket.emit('ice-candidate', {
                roomId: currentRoomId,
                candidate: event.candidate,
                targetId: broadcasterId
            });
        }
    };

    peerConnection.onconnectionstatechange = () => {
        const state = peerConnection.connectionState;

        if (state === 'connected') {
            updateConnectionInfo('Connected to broadcaster');
        } else if (state === 'disconnected') {
            updateStatus('Reconnecting...', 'bg-warning');
            updateConnectionInfo('Connection interrupted');
        } else if (state === 'failed') {
            updateStatus('Connection Lost', 'bg-danger');
            updateConnectionInfo('Failed to maintain connection');
        } else if (state === 'closed') {
            updateStatus('Ended', 'bg-secondary');
            updateConnectionInfo('Stream connection closed');
        }
    };

    return peerConnection;
}

// ============== JOIN STREAM ==============
function joinStream() {
    const roomId = roomIdInput.value.trim();

    if (!roomId) {
        alert('Please enter a stream room ID');
        return;
    }

    currentRoomId = roomId;
    streamTitle.textContent = roomId;
    showPlayer();
    updateStatus('Connecting...', 'bg-warning');
    updateConnectionInfo('Connecting to signaling server...');

    // Connect to signaling server
    socket = io(SIGNALING_SERVER);

    socket.on('connect', () => {
        updateConnectionInfo('Connected to server, joining stream...');
        socket.emit('join-stream', currentRoomId);
    });

    socket.on('offer', async ({ offer, broadcasterId }) => {
        updateConnectionInfo('Received stream offer, connecting...');

        const pc = createPeerConnection(broadcasterId);

        try {
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('answer', {
                roomId: currentRoomId,
                answer,
                broadcasterId
            });
        } catch (err) {
            updateStatus('Error', 'bg-danger');
            updateConnectionInfo('Failed to establish connection');
        }
    });

    socket.on('ice-candidate', async ({ candidate }) => {
        if (peerConnection && candidate) {
            try {
                await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (_err) {
                // ICE candidate error - non-critical
            }
        }
    });

    socket.on('stream-ended', () => {
        updateStatus('Stream Ended', 'bg-secondary');
        updateConnectionInfo('The broadcaster ended the stream');
        streamPlayer.srcObject = null;
    });

    socket.on('error', ({ message }) => {
        updateStatus('Error', 'bg-danger');
        updateConnectionInfo(message || 'Stream not found');
    });

    socket.on('disconnect', () => {
        updateStatus('Disconnected', 'bg-secondary');
        updateConnectionInfo('Lost connection to server');
    });
}

// ============== LEAVE STREAM ==============
function leaveStream() {
    if (socket) {
        socket.emit('leave-stream', currentRoomId);
        socket.disconnect();
        socket = null;
    }

    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }

    streamPlayer.srcObject = null;
    currentRoomId = null;
    roomIdInput.value = '';
    showJoinForm();
}

// ============== EVENT LISTENERS ==============
joinBtn.addEventListener('click', joinStream);
leaveBtn.addEventListener('click', leaveStream);

roomIdInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        joinStream();
    }
});

// ============== URL PARAMETER SUPPORT ==============
// Allow joining via URL: /watch.html?room=STREAM_NAME
const urlParams = new URLSearchParams(window.location.search);
const roomFromUrl = urlParams.get('room');
if (roomFromUrl) {
    roomIdInput.value = roomFromUrl;
    joinStream();
}

// ============== CLEANUP ON PAGE UNLOAD ==============
window.addEventListener('beforeunload', () => {
    if (socket && currentRoomId) {
        socket.emit('leave-stream', currentRoomId);
    }
});
