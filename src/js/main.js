document.addEventListener("DOMContentLoaded", () => {
  const drawerToggle = document.getElementById("drawerToggle");
  const drawer = document.getElementById("categoryDrawer");
  const drawerClose = document.getElementById("drawerClose");
  const themeToggle = document.getElementById("themeToggle");
  const searchInput = document.getElementById("searchInput");
  const clearSearch = document.getElementById("clearSearch");
  const previewContainer = document.querySelector(".row");

  let allStreams = []; // Renamed for clarity: holds full list from API

  // Format viewer count
  function formatViewers(count) {
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toLocaleString();
  }

  // Render streams
  function renderStreams(streams) {
    previewContainer.innerHTML = "";
    if (!streams || streams.length === 0) {
      previewContainer.innerHTML = '<p class="text-muted">No streams found.</p>';
      return;
    }

    const fragment = document.createDocumentFragment(); // Better performance

    streams.forEach((stream) => {
      const card = document.createElement("article");
      card.className = "col";
      card.setAttribute("role", "article");
      card.setAttribute("aria-label", `Stream: ${stream.title} by ${stream.user}`);

      card.innerHTML = `
        <div class="card shadow-sm">
          <img src="${stream.img}" class="card-img-top" width="300" height="175" 
               alt="Stream preview for ${stream.title}" loading="lazy" />
          <div class="card-body">
            <h3 class="card-title h6">${stream.title}</h3>
            <p class="card-text text-muted mb-1">${stream.user}</p>
            <p class="viewer-count text-muted small mb-2">
              <i class="fas fa-eye" aria-hidden="true"></i> ${formatViewers(stream.viewers)} viewers
            </p>
            ${stream.tags.map(tag => 
              `<span class="badge bg-primary tag-badge" role="button" tabindex="0">${tag}</span>`
            ).join('')}
          </div>
        </div>`;

      fragment.appendChild(card);
    });

    previewContainer.appendChild(fragment);

    // Attach tag click listeners AFTER rendering
    attachTagListeners();
  }

  // Attach click/keyboard handlers to tag badges
  function attachTagListeners() {
    document.querySelectorAll('.tag-badge').forEach(badge => {
      const clickHandler = () => {
        const tag = badge.textContent.trim().toLowerCase();
        const filtered = allStreams.filter(stream =>
          stream.tags.some(t => t.toLowerCase() === tag)
        );
        renderStreams(filtered);
        // Optional: update search input to show active tag
        searchInput.value = `#${badge.textContent.trim()}`;
      };

      badge.onclick = clickHandler;
      badge.onkeydown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          clickHandler();
        }
      };
    });
  }

  // Fetch streams from API
  async function fetchStreams() {
    try {
      const response = await fetch('/api/streams');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      allStreams = data; // Update the master list
      renderStreams(allStreams);
    } catch (error) {
      console.error('Failed to fetch streams:', error);
      previewContainer.innerHTML = '<p class="text-danger">Error loading streams. Please try again later.</p>';
    }
  }

  // Drawer functionality (unchanged)
  const updateDrawerState = (isOpen) => {
    if (isOpen) {
      drawer.classList.add("open");
      drawerToggle.setAttribute('aria-expanded', 'true');
    } else {
      drawer.classList.remove("open");
      drawerToggle.setAttribute('aria-expanded', 'false');
    }
  };

  drawerToggle.addEventListener("click", () => {
    const isOpen = drawer.classList.contains("open");
    updateDrawerState(!isOpen);
  });

  document.addEventListener("click", (e) => {
    if (drawer.classList.contains("open") && 
        !drawer.contains(e.target) && 
        !drawerToggle.contains(e.target)) {
      updateDrawerState(false);
    }
  });

  drawerClose.addEventListener("click", () => updateDrawerState(false));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && drawer.classList.contains("open")) {
      updateDrawerState(false);
    }
  });

  // Theme toggle (unchanged)
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  const LIGHT_THEME_COLOR = "#ffffff";
  const DARK_THEME_COLOR = "#111111";

  const applyTheme = (isDark) => {
    document.body.classList.toggle("dark", isDark);
    const icon = themeToggle.querySelector("i");
    icon.classList.toggle("fa-moon", !isDark);
    icon.classList.toggle("fa-sun", isDark);

    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', isDark ? DARK_THEME_COLOR : LIGHT_THEME_COLOR);
    }
  };

  const storedTheme = localStorage.getItem("theme");
  let isDark = storedTheme === "dark" || (storedTheme === null && prefersDark.matches);
  applyTheme(isDark);

  prefersDark.addEventListener('change', (e) => {
    if (localStorage.getItem("theme") === null) {
      applyTheme(e.matches);
    }
  });

  themeToggle.addEventListener("click", () => {
    isDark = !isDark;
    localStorage.setItem("theme", isDark ? "dark" : "light");
    applyTheme(isDark);
  });

  // Search with debounce
  function debounce(func, delay) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), delay);
    };
  }

  searchInput.addEventListener("input", debounce(() => {
    const term = searchInput.value.trim().toLowerCase();
    if (term === "") {
      renderStreams(allStreams);
      return;
    }

    const filtered = allStreams.filter(stream =>
      stream.title.toLowerCase().includes(term) ||
      stream.user.toLowerCase().includes(term) ||
      stream.tags.some(tag => tag.toLowerCase().includes(term))
    );
    renderStreams(filtered);
  }, 300));

  clearSearch.addEventListener("click", () => {
    searchInput.value = "";
    searchInput.focus();
    renderStreams(allStreams);
  });

  // === INITIALIZATION ===
  fetchStreams(); // Actually fetch the data!

  // Remove the old: renderStreams(streamData); // This was rendering empty data
});

// Service worker registration
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js")
      .then(reg => console.log("Service Worker registered:", reg))
      .catch(err => console.error("Service Worker registration failed:", err));
  });
}
