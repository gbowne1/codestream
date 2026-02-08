import { checkAuth, clearAuth } from './auth.js';

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
        <img src="${stream.img}" class="img-fluid mb-3"/>
        <h2 class="h5">${stream.title}</h2>
        <p class="text-muted">${stream.user}</p>
      </div>
    `;

    document.body.appendChild(modal);

    const close = () => {
      document.removeEventListener('keydown', escHandler);
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
});

/* ================= SERVICE WORKER ================= */

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js');
  });
}
