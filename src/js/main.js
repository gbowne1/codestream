document.addEventListener("DOMContentLoaded", () => {
  const drawerToggle = document.getElementById("drawerToggle");
  const drawer = document.getElementById("categoryDrawer");
  const drawerClose = document.getElementById("drawerClose");
  const themeToggle = document.getElementById("themeToggle");
  const searchInput = document.getElementById("searchInput");
  const clearSearch = document.getElementById("clearSearch");
  const previewContainer = document.getElementById("streamGrid");
  const popularTagsContainer = document.getElementById("popularTags");

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
        <div class="card shadow-sm h-100">
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

      fragment.appendChild(card);
    });

    previewContainer.appendChild(fragment);
  }

  /**
   * Helper function to handle the filtering logic
   */
  const handleTagFilter = (tagName) => {
    const tag = tagName.trim().toLowerCase();
    const filtered = allStreams.filter((stream) =>
      stream.tags.some((t) => t.toLowerCase() === tag)
    );
    renderStreams(filtered);
    searchInput.value = `#${tagName.trim()}`;
    if (clearSearch) clearSearch.classList.remove("d-none");
  };

  /**
   * EVENT DELEGATION: Single handler for the entire grid
   */
  const handleGridInteraction = (e) => {
    const target = e.target;

    // 1. Check if a Tag Badge was clicked
    const badge = target.closest(".tag-badge");
    if (badge) {
      handleTagFilter(badge.textContent);
      return; 
    }

    // 2. Check if the Stream Card itself was clicked
    const card = target.closest("article.col");
    if (card && card.dataset.streamId) {
      const stream = allStreams.find((s) => s.id == card.dataset.streamId);
      if (stream) openStreamDetail(stream);
    }
  };

  // Attach dynamic grid listeners ONCE
  previewContainer.addEventListener("click", handleGridInteraction);
  
  // Handle accessibility (Enter/Space) via delegation
  previewContainer.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      if (e.target.classList.contains("tag-badge")) {
        e.preventDefault();
        handleTagFilter(e.target.textContent);
      } else {
        handleGridInteraction(e);
      }
    }
  });

  // Delegate listeners for the "Popular Tags" section
  if (popularTagsContainer) {
    popularTagsContainer.addEventListener("click", (e) => {
      const filterBadge = e.target.closest(".tag-filter");
      if (filterBadge) {
        handleTagFilter(filterBadge.textContent);
      }
    });
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
            .map((tag) => `<span class="badge bg-primary me-1">${tag}</span>`)
            .join("")}
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const close = () => {
      document.removeEventListener("keydown", escHandler);
      modal.remove();
    };

    const escHandler = (e) => {
      if (e.key === "Escape") close();
    };

    modal.querySelector(".close-modal").onclick = close;
    modal.querySelector(".stream-detail-overlay").onclick = close;
    document.addEventListener("keydown", escHandler);
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

  // --- UI CONTROLS ---

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

  const applyTheme = (isDark) => {
    document.body.classList.toggle("dark", isDark);
    const icon = themeToggle.querySelector("i");
    icon.classList.toggle("fa-moon", !isDark);
    icon.classList.toggle("fa-sun", isDark);
  };

  let isDark = localStorage.getItem("theme") === "dark";
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
      clearSearch.classList.toggle("d-none", !term);
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
    clearSearch.classList.add("d-none");
    renderStreams(allStreams);
  });

  fetchStreams();
});

// RESTORED: Service Worker registration
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