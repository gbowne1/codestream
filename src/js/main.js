// main.js - Entry point for DevStream DOM logic

document.addEventListener("DOMContentLoaded", () => {
  const drawerToggle = document.getElementById("drawerToggle");
  const drawer = document.getElementById("categoryDrawer");
  const drawerClose = document.getElementById("drawerClose");
  const themeToggle = document.getElementById("themeToggle");
  const searchInput = document.getElementById("searchInput");
  const clearSearch = document.getElementById("clearSearch");
  const previewContainer = document.querySelector(".row");

 let streamData = [];
  
  // Fetch streams from API
  async function fetchStreams() {
    try {
      const response = await fetch('/api/streams');
      const streamData = await response.json();
      renderStreams(streamData);
    } catch (error) {
      console.error('Failed to fetch streams:', error);
      previewContainer.innerHTML = '<p class="text-danger">Error loading streams. Please try again.</p>';
    }
  }

  // Format viewer count
  function formatViewers(count) {
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toLocaleString();
  }

  // Render streams
  function renderStreams(streams) {
    try {
      previewContainer.innerHTML = "";
      if (!streams.length) {
        previewContainer.innerHTML = '<p class="text-muted">No streams found.</p>';
        return;
      }
      streams.forEach((stream) => {
        const card = document.createElement("article");
        card.className = "col";
        card.setAttribute("role", "article");
        card.setAttribute("aria-label", `Stream: ${stream.title} by ${stream.user}`);
        card.innerHTML = `
          <div class="card shadow-sm">
            <img src="${stream.img}" class="card-img-top" width="300" height="175" alt="Stream preview for ${stream.title}" loading="lazy" />
            <div class="card-body">
              <h3 class="card-title h6">${stream.title}</h3>
              <p class="card-text text-muted mb-1">${stream.user}</p>
              <p class="viewer-count text-muted small mb-2">
                <i class="fas fa-eye" aria-hidden="true"></i> ${formatViewers(stream.viewers)} viewers
              </p>
              ${stream.tags.map(tag => `<span class="badge bg-primary">${tag}</span>`).join('')}
            </div>
          </div>`;
        previewContainer.appendChild(card);
      });
    } catch (error) {
      console.error('Error rendering streams:', error);
      previewContainer.innerHTML = '<p class="text-danger">Error loading streams. Please try again.</p>';
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
    if (drawer.classList.contains("open") && !drawer.contains(e.target) && !drawerToggle.contains(e.target)) {
      updateDrawerState(false);
    }
  });

  drawerClose.addEventListener("click", () => {
    updateDrawerState(false);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && drawer.classList.contains("open")) {
      updateDrawerState(false);
    }
  });

  // Theme toggle (unchanged)
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  const storedTheme = localStorage.getItem("theme");
  const LIGHT_THEME_COLOR = "#ffffff";
  const DARK_THEME_COLOR = "#111111";

  const applyTheme = (isDark) => {
    if (isDark) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
    const icon = themeToggle.querySelector("i");
    icon.classList.toggle("fa-moon", !isDark);
    icon.classList.toggle("fa-sun", isDark);
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', isDark ? DARK_THEME_COLOR : LIGHT_THEME_COLOR);
    }
  };

  let initialIsDark = storedTheme === "dark" || (!storedTheme && prefersDark.matches);
  applyTheme(initialIsDark);

  prefersDark.addEventListener('change', (event) => {
    if (!localStorage.getItem("theme")) {
      applyTheme(event.matches);
    }
  });

  themeToggle.addEventListener("click", () => {
    const isCurrentlyDark = document.body.classList.contains("dark");
    const newThemeIsDark = !isCurrentlyDark;
    localStorage.setItem("theme", newThemeIsDark ? "dark" : "light");
    applyTheme(newThemeIsDark);
  });

  // Search with debounce
  function debounce(func, delay) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), delay);
    };
  }

  searchInput.addEventListener("input", debounce(() => {
    const term = searchInput.value.toLowerCase();
    const filtered = streamData.filter(stream =>
      stream.title.toLowerCase().includes(term) ||
      stream.user.toLowerCase().includes(term) ||
      stream.tags.some(tag => tag.toLowerCase().includes(term))
    );
    renderStreams(filtered);
  }, 300));

  clearSearch.addEventListener("click", () => {
    searchInput.value = "";
    renderStreams(streamData);
  });

  // Tag filtering
  document.querySelectorAll('.badge').forEach(badge => {
    badge.addEventListener('click', () => {
      const tag = badge.textContent.toLowerCase();
      const filtered = streamData.filter(stream =>
        stream.tags.some(t => t.toLowerCase() === tag)
      );
      renderStreams(filtered);
    });
  });

  // Initial render (static for now, replace with fetchStreams for API)
  renderStreams(streamData);
});

// Service worker registration (unchanged)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js")
      .then(registration => {
        console.log("Service Worker registered:", registration);
      })
      .catch(error => {
        console.error("Service Worker registration failed:", error);
      });
  });
}
