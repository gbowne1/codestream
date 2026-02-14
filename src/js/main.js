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

  // 🔹 FILTER UI (future / optional)
  const categoryFilter = document.getElementById('categoryFilter');
  const subCategoryFilter = document.getElementById('subCategoryFilter');

  let allStreams = [];

  /* ================= HELPERS ================= */

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
    import('socket.io-client')
      .then(({ io }) => {
        socket = io('http://localhost:3000');

        socket.on('connect', () => {
          console.log('Viewer connected to signaling server');
          // Join the stream room using the stream user as roomId
          socket.emit('join-stream', stream.user);
        });

        socket.on('offer', async ({ offer, broadcasterId }) => {
          console.log('Received offer from broadcaster');
          modal.querySelector('.status-text').textContent =
            'Receiving stream...';

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
                targetId: broadcasterId,
              });
            }
          };

          // Monitor connection state for broadcaster disconnect
          peerConnection.onconnectionstatechange = () => {
            console.log(
              'Viewer connection state:',
              peerConnection.connectionState
            );
            if (
              peerConnection.connectionState === 'disconnected' ||
              peerConnection.connectionState === 'failed'
            ) {
              modal.querySelector('.status-text').textContent =
                'Connection Lost';
              modal
                .querySelector('.status-text')
                .classList.remove('text-danger');
              modal.querySelector('.status-text').classList.add('text-warning');
            }
          };

          await peerConnection.setRemoteDescription(
            new RTCSessionDescription(offer)
          );
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);
          socket.emit('answer', { roomId: stream.user, answer, broadcasterId });
        });

        socket.on('ice-candidate', async ({ candidate }) => {
          if (peerConnection && candidate) {
            try {
              await peerConnection.addIceCandidate(
                new RTCIceCandidate(candidate)
              );
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
          modal.querySelector('.status-text').textContent =
            message || 'Stream not found';
          modal.querySelector('.status-text').classList.add('text-danger');
        });

        // Handle socket disconnect (server down, network loss)
        socket.on('disconnect', () => {
          console.log('Viewer disconnected from signaling server');
          modal.querySelector('.status-text').textContent =
            'Disconnected from server';
          modal.querySelector('.status-text').classList.add('text-warning');
        });

        // Cleanup when viewer closes modal or leaves page
        window.addEventListener('beforeunload', () => {
          if (socket) {
            socket.emit('leave-stream', stream.user);
          }
        });
      })
      .catch((err) => {
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

  fetchStreams();
});

/* ================= SERVICE WORKER ================= */

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js');
  });
}
