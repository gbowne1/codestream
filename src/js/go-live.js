import { io } from 'socket.io-client';

// ============== CONFIG ==============
const SIGNALING_SERVER = 'http://localhost:3000';
const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];

// ============== STATE ==============
let socket = null;
let localStream = null;
let roomId = null;
const peerConnections = new Map(); // viewerId -> RTCPeerConnection

// ============== DOM ELEMENTS ==============
const shareScreenBtn = document.getElementById('shareScreenBtn');
const useCameraBtn = document.getElementById('useCameraBtn');
const startStreamBtn = document.getElementById('startStreamBtn');
const stopStreamBtn = document.getElementById('stopStreamBtn');
const localPreview = document.getElementById('localPreview');
const streamNameInput = document.getElementById('streamName');
const statusAlert = document.getElementById('connectionStatus');
const streamStats = document.getElementById('streamStats');

// ============== HELPERS ==============
function updateStatus(msg, type) {
  statusAlert.className = `alert alert-${type} d-flex align-items-center`;
  statusAlert.innerHTML = `<i class="fas fa-circle me-2"></i><span>${msg}</span>`;
}

function generateStreamId() {
  return 'stream_' + Math.random().toString(36).substr(2, 9);
}

// ============== MEDIA CAPTURE ==============
async function captureScreen() {
  // Check browser support first
  if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
    updateStatus('Screen sharing not supported in this browser', 'danger');
    streamStats.textContent = 'Try using Chrome, Edge, or Firefox';
    return;
  }

  try {
    // Stop any existing stream first
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }

    localStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        cursor: 'always',
        displaySurface: 'monitor',
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
      },
    });

    localPreview.srcObject = localStream;
    startStreamBtn.disabled = false;
    streamStats.textContent = 'Screen captured. Ready to stream!';
    updateStatus('Screen captured successfully', 'success');

    // Handle user stopping share via browser UI
    localStream.getVideoTracks()[0].onended = () => {
      stopStream();
    };
  } catch (err) {
    console.error('Screen capture error:', err);

    // Provide specific error messages
    if (err.name === 'NotAllowedError') {
      updateStatus(
        'Permission denied. Please allow screen sharing.',
        'warning'
      );
      streamStats.textContent =
        'Click "Share Screen" and select a screen to share';
    } else if (err.name === 'NotFoundError') {
      updateStatus('No screen found to share', 'danger');
    } else if (err.name === 'NotReadableError') {
      updateStatus('Screen is already in use by another app', 'danger');
    } else if (err.name === 'AbortError') {
      updateStatus('Screen sharing was cancelled', 'secondary');
      streamStats.textContent = 'Click "Share Screen" to try again';
    } else {
      updateStatus(
        `Screen capture failed: ${err.message || err.name}`,
        'danger'
      );
    }
  }
}

async function captureCamera() {
  // Check browser support first
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    updateStatus('Camera not supported in this browser', 'danger');
    return;
  }

  try {
    // Stop any existing stream first
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }

    localStream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user',
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
      },
    });

    localPreview.srcObject = localStream;
    startStreamBtn.disabled = false;
    streamStats.textContent = 'Camera captured. Ready to stream!';
    updateStatus('Camera captured successfully', 'success');
  } catch (err) {
    console.error('Camera capture error:', err);

    // Provide specific error messages
    if (err.name === 'NotAllowedError') {
      updateStatus(
        'Camera permission denied. Check browser settings.',
        'warning'
      );
      streamStats.textContent = 'Allow camera access in your browser';
    } else if (err.name === 'NotFoundError') {
      updateStatus('No camera found on this device', 'danger');
    } else if (err.name === 'NotReadableError') {
      updateStatus('Camera is in use by another application', 'danger');
    } else if (err.name === 'OverconstrainedError') {
      updateStatus('Camera does not meet requirements', 'danger');
    } else {
      updateStatus(
        `Camera access failed: ${err.message || err.name}`,
        'danger'
      );
    }
  }
}

// ============== WEBRTC ==============
function createPeerConnection(viewerId) {
  const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

  // Add local tracks to the connection
  localStream.getTracks().forEach((track) => {
    pc.addTrack(track, localStream);
  });

  // Send ICE candidates to the viewer
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('ice-candidate', {
        roomId,
        candidate: event.candidate,
        targetId: viewerId,
      });
    }
  };

  pc.onconnectionstatechange = () => {
    console.log(`Connection state with ${viewerId}: ${pc.connectionState}`);

    // Handle viewer disconnect (closed tab, network loss)
    if (
      pc.connectionState === 'disconnected' ||
      pc.connectionState === 'failed' ||
      pc.connectionState === 'closed'
    ) {
      console.log(`Viewer ${viewerId} disconnected`);
      pc.close();
      peerConnections.delete(viewerId);
      updateViewerCount();
    }
  };

  peerConnections.set(viewerId, pc);
  return pc;
}

async function handleViewerJoined({ viewerId }) {
  console.log('Viewer joined:', viewerId);
  const pc = createPeerConnection(viewerId);

  try {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit('offer', { roomId, offer, viewerId });
    updateViewerCount();
  } catch (err) {
    console.error('Error creating offer:', err);
  }
}

async function handleAnswer({ answer, viewerId }) {
  const pc = peerConnections.get(viewerId);
  if (pc) {
    await pc.setRemoteDescription(new RTCSessionDescription(answer));
  }
}

async function handleIceCandidate({ candidate, senderId }) {
  const pc = peerConnections.get(senderId);
  if (pc && candidate) {
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.error('Error adding ICE candidate:', err);
    }
  }
}

function updateViewerCount() {
  streamStats.textContent = `Live | ${peerConnections.size} viewer(s)`;
}

// ============== STREAM CONTROL ==============
function startStream() {
  if (!localStream) {
    alert('Please capture screen or camera first.');
    return;
  }

  roomId = streamNameInput.value.trim() || generateStreamId();
  streamNameInput.value = roomId;

  // Connect to signaling server
  socket = io(SIGNALING_SERVER);

  socket.on('connect', () => {
    console.log('Connected to signaling server');
    socket.emit('start-stream', roomId);
  });

  socket.on('stream-started', ({ roomId: id }) => {
    updateStatus(`LIVE: ${id}`, 'danger');
    startStreamBtn.classList.add('d-none');
    stopStreamBtn.classList.remove('d-none');
    streamStats.textContent = 'Live | 0 viewers';
  });

  socket.on('viewer-joined', handleViewerJoined);
  socket.on('answer', handleAnswer);
  socket.on('ice-candidate', handleIceCandidate);

  socket.on('error', ({ message }) => {
    alert('Error: ' + message);
  });

  socket.on('disconnect', () => {
    updateStatus('Disconnected from server', 'secondary');
  });

  // Handle viewer leaving
  socket.on('viewer-left', ({ viewerId }) => {
    console.log('Viewer left:', viewerId);
    const pc = peerConnections.get(viewerId);
    if (pc) {
      pc.close();
      peerConnections.delete(viewerId);
      updateViewerCount();
    }
  });
}

function stopStream() {
  if (socket) {
    socket.emit('stop-stream', roomId);
    socket.disconnect();
    socket = null;
  }

  // Close all peer connections
  peerConnections.forEach((pc) => pc.close());
  peerConnections.clear();

  // Stop local media
  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop());
    localStream = null;
  }
  localPreview.srcObject = null;

  // Reset UI
  startStreamBtn.classList.remove('d-none');
  startStreamBtn.disabled = true;
  stopStreamBtn.classList.add('d-none');
  streamStats.textContent = 'Select a video source to begin';
  updateStatus('Stream ended', 'secondary');
  roomId = null;
}

// ============== EVENT LISTENERS ==============
shareScreenBtn.addEventListener('click', captureScreen);
useCameraBtn.addEventListener('click', captureCamera);
startStreamBtn.addEventListener('click', startStream);
stopStreamBtn.addEventListener('click', stopStream);

// ============== CLEANUP ON PAGE UNLOAD ==============
window.addEventListener('beforeunload', () => {
  if (socket && roomId) {
    // Notify server that stream is ending
    socket.emit('stop-stream', roomId);

    // Close all connections
    peerConnections.forEach((pc) => pc.close());

    // Stop media tracks
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
  }
});

// Handle visibility change (tab hidden/shown)
document.addEventListener('visibilitychange', () => {
  if (document.hidden && socket && roomId) {
    console.log('Tab hidden - stream still active');
    // Optional: Could pause or reduce quality here
  }
});
