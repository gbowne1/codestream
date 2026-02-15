import { checkAuth, clearAuth } from './auth.js';
// WebRTC-based streaming - no external player library needed

document.addEventListener('DOMContentLoaded', () => {
  const drawerToggle = document.getElementById('drawerToggle');
  const drawer = document.getElementById('categoryDrawer');
  const drawerClose = document.getElementById('drawerClose');
  const drawerOverlay = document.getElementById('drawerOverlay');
  const themeToggle = document.getElementById('themeToggle');
  const searchInput = document.getElementById('searchInput');
  const clearSearch = document.getElementById('clearSearch');
  const previewContainer = document.getElementById('streamGrid');
  const popularTagsContainer = document.getElementById('popularTags');
  const loginNav = document.getElementById('authNavLogin');
  const logoutNav = document.getElementById('authNavLogout');
  const logoutBtn = document.getElementById('logoutBtn');

  // 🔹 FILTER UI (future / optional)
  const categoryFilter = document.getElementById('categoryFilter');
  const subCategoryFilter = document.getElementById('subCategoryFilter');

  let allStreams = [];

  /* ================= HELPERS ================= */

  const updateAuthNav = async () => {
    const isAuthenticated = await checkAuth();
    if (loginNav && logoutNav) {
      loginNav.classList.toggle('d-none', isAuthenticated);
      logoutNav.classList.toggle('d-none', !isAuthenticated);
    }
  };

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      clearAuth();
      window.location.href = '/login.html';
    });
  }

  function formatViewers(count) {
    if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
    return count.toLocaleString();
  }

  // 🔹 DEBOUNCE HELPER
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /* ================= RENDER STREAMS ================= */

  function renderStreams(streams) {
    previewContainer.innerHTML = '';

    if (!streams || streams.length === 0) {
      previewContainer.innerHTML =
        '<p class="text-muted">No streams found.</p>';
      return;
    }

    const fragment = document.createDocumentFragment();

    streams.forEach((stream) => {
      const card = document.createElement('article');
      card.className = 'col';
      card.dataset.streamId = stream.id;

      // build tag HTML separately so the template stays clean and ESLint-friendly
      const tagsHtml = (stream.tags || [])
        .map(
          (tag) =>
            `<span class="badge bg-primary tag-badge" role="button" tabindex="0">${tag}</span>`
        )
        .join('');

      card.innerHTML = `
        <div class="card shadow-sm h-100">
          <img src="${stream.img}" class="card-img-top" loading="lazy"
            alt="Stream preview for ${stream.title}" />
          <div class="card-body">
            <h3 class="card-title h6">${stream.title}</h3>
            <p class="text-muted mb-1">${stream.user}</p>
            <p class="small text-muted mb-2">
              ${formatViewers(stream.viewers)} viewers
            </p>
            ${stream.tags
          .map(
            (tag) =>
              `<span class="badge bg-primary tag-badge" role="button" tabindex="0">${tag}</span>`
          )
          .join('')}
            ${tagsHtml}
          </div>
        </div>
      `;

      fragment.appendChild(card);
    });

    previewContainer.appendChild(fragment);
  }

  /* ================= FILTERING LOGIC ================= */

  function getFilteredStreams(streams, filters) {
    return streams.filter((stream) => {
      if (filters.category && stream.category !== filters.category) {
        return false;
      }

      if (filters.subCategory && stream.subCategory !== filters.subCategory) {
        return false;
      }

      if (
        filters.programmingLanguages?.length &&
        !filters.programmingLanguages.some((lang) =>
          stream.programmingLanguages?.includes(lang)
        )
      ) {
        return false;
      }

      if (filters.mature === false && stream.mature) {
        return false;
      }

      return true;
    });
  }

  function applyFilters() {
    const filters = {
      category: categoryFilter?.value || '',
      subCategory: subCategoryFilter?.value || '',
      mature: false,
    };

    const filtered = getFilteredStreams(allStreams, filters);
    renderStreams(filtered);
  }

  /* ================= TAG FILTER ================= */

  const handleTagFilter = (tagName) => {
    const tag = tagName.trim().toLowerCase();

    renderStreams(
      allStreams.filter((stream) =>
        stream.tags.some((t) => t.toLowerCase() === tag)
      )
    );

    searchInput.value = `#${tagName}`;
    clearSearch.classList.remove('d-none');
  };

  /* ================= EVENT DELEGATION ================= */

  previewContainer.addEventListener('click', (e) => {
    const badge = e.target.closest('.tag-badge');
    if (badge) {
      handleTagFilter(badge.textContent);
      return;
    }

    const card = e.target.closest('article.col');
    if (card) {
      const stream = allStreams.find(
        (s) => s.id === Number(card.dataset.streamId)
      );
      if (stream) openStreamDetail(stream);
    }
  });

  previewContainer.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (e.target.classList.contains('tag-badge')) {
        handleTagFilter(e.target.textContent);
      }
    }
  });

  popularTagsContainer?.addEventListener('click', (e) => {
    const badge = e.target.closest('.tag-filter');
    if (badge) handleTagFilter(badge.textContent);
  });

  /* ================= MODAL ================= */

  function openStreamDetail(stream) {
    document.querySelector('.stream-detail-modal')?.remove();

    const modal = document.createElement('div');
    modal.className = 'stream-detail-modal';

    modal.innerHTML = `
      <div class="stream-detail-overlay"></div>
      <div class="stream-detail-content">
        <button class="close-modal" aria-label="Close">&times;</button>
        <div class="ratio ratio-16x9 mb-3 bg-black">
            <video id="streamPlayer" controls autoplay playsinline class="w-100 h-100"></video>
        </div>
        <h2 class="h5">${stream.title}</h2>
        <p class="text-muted status-text">Connecting to Live Stream...</p>
        <p class="text-muted small">${stream.user}</p>
      </div>
    `;

    document.body.appendChild(modal);

    const videoElement = modal.querySelector('#streamPlayer');
    let socket = null;
    let peerConnection = null;

    // WebRTC Configuration
    const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];

    // Dynamic import for Socket.IO client
    import('socket.io-client').then(({ io }) => {
      socket = io('http://localhost:3000');

      socket.on('connect', () => {
        console.log('Viewer connected to signaling server');
        // Join the stream room using the stream user as roomId
        socket.emit('join-stream', stream.user);
      });

      socket.on('offer', async ({ offer, broadcasterId }) => {
        console.log('Received offer from broadcaster');
        modal.querySelector('.status-text').textContent = 'Receiving stream...';

        peerConnection = new RTCPeerConnection({ iceServers: ICE_SERVERS });

        peerConnection.ontrack = (event) => {
          console.log('Received remote track');
          videoElement.srcObject = event.streams[0];
          modal.querySelector('.status-text').textContent = 'LIVE';
          modal.querySelector('.status-text').classList.remove('text-muted');
          modal.querySelector('.status-text').classList.add('text-danger');
        };

        peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('ice-candidate', {
              roomId: stream.user,
              candidate: event.candidate,
              targetId: broadcasterId
            });
          }
        };

        // Monitor connection state for broadcaster disconnect
        peerConnection.onconnectionstatechange = () => {
          console.log('Viewer connection state:', peerConnection.connectionState);
          if (peerConnection.connectionState === 'disconnected' ||
            peerConnection.connectionState === 'failed') {
            modal.querySelector('.status-text').textContent = 'Connection Lost';
            modal.querySelector('.status-text').classList.remove('text-danger');
            modal.querySelector('.status-text').classList.add('text-warning');
          }
        };

        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit('answer', { roomId: stream.user, answer, broadcasterId });
      });

      socket.on('ice-candidate', async ({ candidate }) => {
        if (peerConnection && candidate) {
          try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (err) {
            console.error('Error adding ICE candidate:', err);
          }
        }
      });

      socket.on('stream-ended', () => {
        modal.querySelector('.status-text').textContent = 'Stream Ended';
        modal.querySelector('.status-text').classList.add('text-warning');
      });

      socket.on('error', ({ message }) => {
        modal.querySelector('.status-text').textContent = message || 'Stream not found';
        modal.querySelector('.status-text').classList.add('text-danger');
      });

      // Handle socket disconnect (server down, network loss)
      socket.on('disconnect', () => {
        console.log('Viewer disconnected from signaling server');
        modal.querySelector('.status-text').textContent = 'Disconnected from server';
        modal.querySelector('.status-text').classList.add('text-warning');
      });

      // Cleanup when viewer closes modal or leaves page
      window.addEventListener('beforeunload', () => {
        if (socket) {
          socket.emit('leave-stream', stream.user);
        }
      });
    }).catch(err => {
      console.error('Failed to load socket.io-client:', err);
      modal.querySelector('.status-text').textContent = 'Failed to connect';
      modal.querySelector('.status-text').classList.add('text-danger');
    });

    const close = () => {
      document.removeEventListener('keydown', escHandler);
      if (peerConnection) {
        peerConnection.close();
      }
      if (socket) {
        socket.disconnect();
      }
      modal.remove();
    };

    const escHandler = (e) => {
      if (e.key === 'Escape') close();
    };

    modal.querySelector('.close-modal').onclick = close;
    modal.querySelector('.stream-detail-overlay').onclick = close;
    document.addEventListener('keydown', escHandler);
  }

  /* ================= FETCH STREAMS ================= */

  async function fetchStreams() {
    try {
      const res = await fetch('/api/streams');

      if (!res.ok) {
        throw new Error(`Server returned ${res.status} ${res.statusText}`);
      }

      const data = await res.json();

      allStreams = data.map((s) => ({
        ...s,
        img: s.thumbnail || s.img,
        tags: s.tags || [s.category],
      }));

      renderStreams(allStreams);
    } catch (err) {
      console.error('Failed to load streams:', err);
      previewContainer.innerHTML =
        '<div class="text-center py-5"><p class="text-danger">Failed to load streams. Please refresh the page.</p></div>';
    }
  }

  /* ================= FILTER LISTENERS ================= */

  categoryFilter?.addEventListener('change', applyFilters);
  subCategoryFilter?.addEventListener('change', applyFilters);

  // 🔹 SEARCH LOGIC (extracted for debounce)
  function performSearch() {
    const term = searchInput.value.toLowerCase().trim();
    clearSearch.classList.toggle('d-none', !term);

    if (!term) return renderStreams(allStreams);

    renderStreams(
      allStreams.filter(
        (s) =>
          s.title.toLowerCase().includes(term) ||
          s.user.toLowerCase().includes(term) ||
          s.tags.some((t) => t.toLowerCase().includes(term))
      )
    );
  }

  // 🔹 DEBOUNCED SEARCH (250ms delay)
  const debouncedSearch = debounce(performSearch, 250);

  searchInput.addEventListener('input', debouncedSearch);

  clearSearch.addEventListener('click', () => {
    searchInput.value = '';
    clearSearch.classList.add('d-none');
    renderStreams(allStreams);
  });

  /* ================= SEARCH ================= */

  searchInput.addEventListener('input', () => {
    const term = searchInput.value.toLowerCase().trim();
    clearSearch.classList.toggle('d-none', !term);

    if (!term) return renderStreams(allStreams);

    renderStreams(
      allStreams.filter(
        (s) =>
          s.title.toLowerCase().includes(term) ||
          s.user.toLowerCase().includes(term) ||
          s.tags.some((t) => t.toLowerCase().includes(term))
      )
    );
  });

  clearSearch.addEventListener('click', () => {
    searchInput.value = '';
    clearSearch.classList.add('d-none');
    renderStreams(allStreams);
  });

  /* ================= DRAWER ================= */

  const updateDrawerState = (open) => {
    drawer.classList.toggle('open', open);
    drawerOverlay.classList.toggle('d-none', !open);
    drawerToggle.setAttribute('aria-expanded', open);
  };

  drawerToggle.onclick = () =>
    updateDrawerState(!drawer.classList.contains('open'));
  drawerClose.onclick = () => updateDrawerState(false);
  drawerOverlay.onclick = () => updateDrawerState(false);

  /* ================= THEME ================= */

  let isDark = localStorage.getItem('theme') === 'dark';

  const applyTheme = () => {
    document.body.classList.toggle('dark', isDark);
    themeToggle.querySelector('i').className = isDark
      ? 'fas fa-sun'
      : 'fas fa-moon';
  };

  applyTheme();

  themeToggle.onclick = () => {
    isDark = !isDark;
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    applyTheme();
  };

  updateAuthNav();
  fetchStreams();

  /* ================= CHAT FUNCTIONALITY ================= */
  
  const chatMessages = document.getElementById('chatMessages');
  const chatInput = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendBtn');

  // Check if chat elements exist before initializing
  if (!chatMessages || !chatInput || !sendBtn) {
    console.warn('Chat elements not found, skipping chat initialization');
    return;
  }

  // Get or create persistent user ID (MUST be before socket connection)
  let persistentUserId = localStorage.getItem('chatUserId');
  if (!persistentUserId) {
    // Generate a unique ID and save it
    persistentUserId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem('chatUserId', persistentUserId);
    console.log('🆔 Generated new persistent user ID:', persistentUserId);
  } else {
    console.log('🆔 Using existing user ID:', persistentUserId);
  }
  
  // Initialize Socket.IO connection
  // Connect directly to the API server (port 3000) - CORS is configured to allow this
  const isDevelopment = window.location.port === '5173' || window.location.hostname === 'localhost';
  const socketUrl = isDevelopment ? 'http://localhost:3000' : window.location.origin;
  
  console.log('🔌 Attempting to connect to Socket.IO server at:', socketUrl);
  
  const socket = io(socketUrl, {
    auth: {
      token: localStorage.getItem('token') || null,
      persistentUserId: persistentUserId
    },
    // Try polling first, then upgrade to websocket if available
    transports: ['polling', 'websocket'],
    // Auto-reconnect settings
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    timeout: 20000
  });

  // Get user info from token or default to 'user'
  let currentUserRole = 'user';
  let currentUsername = null;
  try {
    const token = localStorage.getItem('token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      currentUserRole = payload.role || 'user';
      currentUsername = payload.username || null;
    }
  } catch (e) {
    // Token parsing failed, use default role
  }

  // If no authenticated username, use persistent ID as username for message matching
  if (!currentUsername) {
    currentUsername = persistentUserId;
  }
  
  // Store persistent ID for message matching
  const userPersistentId = persistentUserId;

  // Role badge colors
  const roleColors = {
    user: 'secondary',
    vip: 'warning',
    moderator: 'info',
    broadcaster: 'success',
    administrator: 'danger',
    admin: 'danger',
    bot: 'dark'
  };

  // Role display names
  const roleNames = {
    user: 'User',
    vip: 'VIP',
    moderator: 'Mod',
    broadcaster: 'Broadcaster',
    administrator: 'Admin',
    admin: 'Admin',
    bot: 'Bot'
  };

  // Function to format timestamp
  function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  // Function to add message to chat
  function addMessageToChat(messageData) {
    if (!chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message';
    messageDiv.dataset.messageId = messageData.id;

    const isSystem = messageData.type === 'system';
    const roleColor = roleColors[messageData.role] || 'secondary';
    const roleName = roleNames[messageData.role] || 'User';
    
    // Check if this is the current user's message
    // Match by persistent ID, userId, or username
    const isOwnMessage = (currentUsername && messageData.username && 
      messageData.username.toLowerCase() === currentUsername.toLowerCase()) ||
      (messageData.userId && messageData.userId === userPersistentId) ||
      (messageData.persistentId && messageData.persistentId === userPersistentId) ||
      (messageData.username && messageData.username === userPersistentId);
    
    if (isOwnMessage) {
      messageDiv.classList.add('own-message');
    }

    if (isSystem) {
      messageDiv.className += ' text-muted text-center small';
      messageDiv.innerHTML = `<em>${escapeHtml(messageData.message)}</em>`;
    } else {
      if (isOwnMessage) {
        // Right-aligned for own messages
        messageDiv.innerHTML = `
          <div class="d-flex justify-content-end" style="width: 100%;">
            <div class="own-message-content" style="margin-left: auto; margin-right: 0;">
              <div class="d-flex align-items-center justify-content-end gap-2 mb-1">
                <span class="text-muted small">${formatTime(messageData.timestamp)}</span>
                <strong>${escapeHtml(messageData.username)}</strong>
                <span class="badge bg-${roleColor}">${roleName}</span>
                <span class="badge bg-primary">You</span>
              </div>
              <div class="own-message-bubble">${escapeHtml(messageData.message)}</div>
            </div>
          </div>
        `;
      } else {
        // Left-aligned for other users' messages
        messageDiv.innerHTML = `
          <div class="d-flex align-items-start gap-2">
            <div class="flex-grow-1">
              <div class="d-flex align-items-center gap-2 mb-1">
                <span class="badge bg-${roleColor}">${roleName}</span>
                <strong>${escapeHtml(messageData.username)}</strong>
                <span class="text-muted small">${formatTime(messageData.timestamp)}</span>
              </div>
              <div class="other-message-bubble">${escapeHtml(messageData.message)}</div>
            </div>
          </div>
        `;
      }
    }

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  
  // Update username when socket connects (server sends user info)
  socket.on('userInfo', (userInfo) => {
    if (userInfo) {
      // Use persistent ID for message matching (most reliable)
      if (userInfo.persistentId) {
        // Keep persistent ID for matching, but use username for display
        if (userInfo.username && userInfo.username !== userInfo.persistentId) {
          // Authenticated user - use username for display but persistentId for matching
          currentUsername = userInfo.persistentId; // Use persistent ID for matching
          localStorage.setItem('chatUsername', userInfo.username);
        } else {
          currentUsername = userInfo.persistentId;
        }
      } else if (userInfo.id) {
        currentUsername = userInfo.id;
      } else if (userInfo.username) {
        currentUsername = userInfo.username;
      }
      console.log('👤 Current user info:', {
        username: userInfo.username,
        id: userInfo.id,
        persistentId: userInfo.persistentId,
        currentUsername: currentUsername,
        userPersistentId: userPersistentId
      });
    }
  });

  // Helper function to escape HTML
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Handle incoming chat messages
  socket.on('chatMessage', (messageData) => {
    addMessageToChat(messageData);
  });

  // Handle chat history on connection
  socket.on('chatHistory', (history) => {
    if (!chatMessages) return;
    
    // Clear existing messages (except any error messages)
    const errorMessages = chatMessages.querySelectorAll('.alert');
    chatMessages.innerHTML = '';
    errorMessages.forEach(err => chatMessages.appendChild(err));
    
    // Load history messages
    if (Array.isArray(history) && history.length > 0) {
      history.forEach(messageData => {
        addMessageToChat(messageData);
      });
      console.log(`📜 Loaded ${history.length} chat history messages`);
    } else {
      // If no history, show welcome message
      addMessageToChat({
        id: Date.now(),
        username: 'System',
        message: 'Welcome to DevStream Chat!',
        role: 'bot',
        timestamp: new Date().toISOString(),
        type: 'system'
      });
    }
  });

  // Handle message deletion (for moderators)
  socket.on('deleteMessage', ({ messageId }) => {
    const messageElement = chatMessages.querySelector(`[data-message-id="${messageId}"]`);
    if (messageElement) {
      messageElement.remove();
    }
  });

  // Handle timeout
  socket.on('timeout', ({ duration, reason }) => {
    chatInput.disabled = true;
    sendBtn.disabled = true;
    chatInput.placeholder = `You are timed out for ${duration} seconds${reason ? `: ${reason}` : ''}`;
    
    setTimeout(() => {
      chatInput.disabled = false;
      sendBtn.disabled = false;
      chatInput.placeholder = 'Send a message...';
    }, duration * 1000);
  });

  // Handle ban
  socket.on('banned', ({ reason }) => {
    chatInput.disabled = true;
    sendBtn.disabled = true;
    chatInput.placeholder = `You have been banned${reason ? `: ${reason}` : ''}`;
    socket.disconnect();
  });

  // Handle errors
  socket.on('error', ({ message }) => {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger alert-dismissible fade show';
    errorDiv.innerHTML = `
      ${escapeHtml(message)}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    chatMessages.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
  });

  socket.on('disconnect', () => {
    console.log('❌ Disconnected from chat server');
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Chat connection error:', error);
    console.error('Error details:', {
      message: error.message,
      type: error.type,
      description: error.description
    });
    
    if (chatMessages) {
      // Remove any existing error messages
      const existingError = chatMessages.querySelector('.alert-warning');
      if (existingError) existingError.remove();
      
      const errorMsg = document.createElement('div');
      errorMsg.className = 'alert alert-warning alert-dismissible fade show';
      errorMsg.innerHTML = `
        <strong>Chat Connection Error:</strong> Unable to connect to chat server. 
        Please make sure the server is running on port 3000.
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      `;
      chatMessages.appendChild(errorMsg);
    }
  });
  
  socket.on('reconnect_attempt', () => {
    console.log('🔄 Attempting to reconnect to chat server...');
  });
  
  socket.on('reconnect', (attemptNumber) => {
    console.log(`✅ Reconnected to chat server after ${attemptNumber} attempts`);
    if (chatMessages) {
      const existingError = chatMessages.querySelector('.alert-warning');
      if (existingError) existingError.remove();
    }
  });
  
  socket.on('reconnect_failed', () => {
    console.error('❌ Failed to reconnect to chat server');
    if (chatMessages) {
      const errorMsg = document.createElement('div');
      errorMsg.className = 'alert alert-danger';
      errorMsg.textContent = 'Failed to reconnect to chat. Please refresh the page.';
      chatMessages.appendChild(errorMsg);
    }
  });

  // Send message function
  function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    socket.emit('chatMessage', { message });
    chatInput.value = '';
  }

  // Event listeners for sending messages
  sendBtn.addEventListener('click', sendMessage);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Handle connection - history will be loaded via chatHistory event
  socket.on('connect', () => {
    console.log('✅ Connected to chat server');
    // Welcome message will be added only if no history is received
    // (handled in chatHistory event handler)
  });
});

/* ================= SERVICE WORKER ================= */

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js');
  });
}
