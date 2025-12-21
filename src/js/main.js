document.addEventListener("DOMContentLoaded", () => {
  const drawerToggle = document.getElementById("drawerToggle");
  const drawer = document.getElementById("categoryDrawer");
  const drawerClose = document.getElementById("drawerClose");
  const themeToggle = document.getElementById("themeToggle");
  const searchInput = document.getElementById("searchInput");
  const clearSearch = document.getElementById("clearSearch");
  const previewContainer = document.getElementById("streamGrid");

  let allStreams = [];

  function formatViewers(count) {
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + "K";
    }
    return count.toLocaleString();
  }

  function renderStreams(streams) {
    previewContainer.innerHTML = "";
    if (!streams || streams.length === 0) {
      previewContainer.innerHTML =
        '<p class="text-muted">No streams found.</p>';
      return;
    }

    const fragment = document.createDocumentFragment();

    streams.forEach((stream) => {
      const card = document.createElement("article");
      card.className = "col";
      card.dataset.streamId = stream.id;

      card.innerHTML = `
        <div class="card shadow-sm">
          <img src="${stream.img}" class="card-img-top" loading="lazy"
               alt="Stream preview for ${stream.title}" />
          <div class="card-body">
            <h3 class="card-title h6">${stream.title}</h3>
            <p class="card-text text-muted mb-1">${stream.user}</p>
            <p class="viewer-count text-muted small mb-2">
              <span class="viewer-number">${formatViewers(
                stream.viewers
              )}</span> viewers
            </p>
            ${stream.tags
              .map(
                (tag) =>
                  `<span class="badge bg-primary tag-badge" role="button" tabindex="0">${tag}</span>`
              )
              .join("")}
          </div>
        </div>
      `;

      card.addEventListener("click", () => openStreamDetail(stream));
      fragment.appendChild(card);
    });

    previewContainer.appendChild(fragment);
    attachTagListeners();
  }

  function openStreamDetail(stream) {
    const existingModal = document.querySelector(".stream-detail-modal");
    if (existingModal) existingModal.remove();

    const modal = document.createElement("div");
    modal.className = "stream-detail-modal";

    modal.innerHTML = `
      <div class="stream-detail-overlay"></div>
      <div class="stream-detail-content">
        <button class="close-modal" aria-label="Close stream detail">&times;</button>

        <img src="${stream.img}" alt="${stream.title}" class="img-fluid mb-3"/>

        <h2 class="h5">${stream.title}</h2>
        <p class="text-muted mb-1">${stream.user}</p>

        <p class="small text-muted">
          ${formatViewers(stream.viewers)} viewers
        </p>

        <div class="mt-2">
          ${stream.tags
            .map(
              (tag) => `<span class="badge bg-primary me-1">${tag}</span>`
            )
            .join("")}
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const escHandler = (e) => {
      if (e.key === "Escape") {
        close();
      }
    };

    const close = () => {
      document.removeEventListener("keydown", escHandler);
      modal.remove();
    };

    modal.querySelector(".close-modal").onclick = close;
    modal.querySelector(".stream-detail-overlay").onclick = close;

    document.addEventListener("keydown", escHandler);
  }

  function updateViewerCount(streamId, newCount) {
    const card = document.querySelector(`[data-stream-id="${streamId}"]`);
    if (!card) return;

    const viewerEl = card.querySelector(".viewer-number");
    if (!viewerEl) return;

    const formatted = formatViewers(newCount);

    if (viewerEl.textContent !== formatted) {
      viewerEl.textContent = formatted;
      viewerEl.classList.add("pulse");
      setTimeout(() => viewerEl.classList.remove("pulse"), 300);
    }
  }

  function attachTagListeners() {
    document.querySelectorAll(".tag-badge").forEach((badge) => {
      const clickHandler = (e) => {
        e.stopPropagation();
        const tag = badge.textContent.trim().toLowerCase();
        const filtered = allStreams.filter((stream) =>
          stream.tags.some((t) => t.toLowerCase() === tag)
        );
        renderStreams(filtered);
        searchInput.value = `#${badge.textContent.trim()}`;
      };

      badge.onclick = clickHandler;
      badge.onkeydown = (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          clickHandler(e);
        }
      };
    });
  }

  async function fetchStreams() {
    try {
      const response = await fetch("/api/streams");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      allStreams = data;
      renderStreams(allStreams);
    } catch (error) {
      console.error("Failed to fetch streams:", error);
      previewContainer.innerHTML =
        '<p class="text-danger">Error loading streams.</p>';
    }
  }

  const updateDrawerState = (isOpen) => {
    if (isOpen) {
      drawer.classList.add("open");
      drawerToggle.setAttribute("aria-expanded", "true");
    } else {
      drawer.classList.remove("open");
      drawerToggle.setAttribute("aria-expanded", "false");
    }
  };

  drawerToggle.addEventListener("click", () => {
    updateDrawerState(!drawer.classList.contains("open"));
  });

  document.addEventListener("click", (e) => {
    if (
      drawer.classList.contains("open") &&
      !drawer.contains(e.target) &&
      !drawerToggle.contains(e.target)
    ) {
      updateDrawerState(false);
    }
  });

  drawerClose.addEventListener("click", () => updateDrawerState(false));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && drawer.classList.contains("open")) {
      updateDrawerState(false);
    }
  });

  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
  const LIGHT_THEME_COLOR = "#ffffff";
  const DARK_THEME_COLOR = "#111111";

  const applyTheme = (isDark) => {
    document.body.classList.toggle("dark", isDark);
    const icon = themeToggle.querySelector("i");
    icon.classList.toggle("fa-moon", !isDark);
    icon.classList.toggle("fa-sun", isDark);

    const themeColorMeta = document.querySelector(
      'meta[name="theme-color"]'
    );
    if (themeColorMeta) {
      themeColorMeta.setAttribute(
        "content",
        isDark ? DARK_THEME_COLOR : LIGHT_THEME_COLOR
      );
    }
  };

  let isDark =
    localStorage.getItem("theme") === "dark" ||
    (localStorage.getItem("theme") === null && prefersDark.matches);

  applyTheme(isDark);

  themeToggle.addEventListener("click", () => {
    isDark = !isDark;
    localStorage.setItem("theme", isDark ? "dark" : "light");
    applyTheme(isDark);
  });

  function debounce(func, delay) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), delay);
    };
  }

  searchInput.addEventListener(
    "input",
    debounce(() => {
      const term = searchInput.value.trim().toLowerCase();
      if (!term) return renderStreams(allStreams);

      renderStreams(
        allStreams.filter(
          (s) =>
            s.title.toLowerCase().includes(term) ||
            s.user.toLowerCase().includes(term) ||
            s.tags.some((t) => t.toLowerCase().includes(term))
        )
      );
    }, 300)
  );

  clearSearch.addEventListener("click", () => {
    searchInput.value = "";
    searchInput.focus();
    renderStreams(allStreams);
  });

  fetchStreams();
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("service-worker.js")
      .then((reg) => console.log("Service Worker registered:", reg))
      .catch((err) =>
        console.error("Service Worker registration failed:", err)
      );
  });
}
