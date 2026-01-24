document.addEventListener("DOMContentLoaded", () => {
  const drawerToggle = document.getElementById("drawerToggle");
  const drawer = document.getElementById("categoryDrawer");
  const drawerClose = document.getElementById("drawerClose");
  const themeToggle = document.getElementById("themeToggle");
  const searchInput = document.getElementById("searchInput");
  const clearSearch = document.getElementById("clearSearch");
  const previewContainer = document.getElementById("streamGrid");
  const popularTagsContainer = document.getElementById("popularTags");
  const loadingState = document.getElementById("loadingState");

  const emptyStateMessage = document.createElement("p");
  emptyStateMessage.id = "streamEmptyState";
  emptyStateMessage.className = "col-12 text-center text-muted py-5";
  emptyStateMessage.textContent = "No streams match your current filters.";

  const STREAM_REFRESH_INTERVAL = 20000;

  let allStreams = [];
  let activeFilter = null;
  let lastFocusedElementBeforeModal = null;
  let isFetching = false;

  const previousViewerCounts = new Map();
  const streamElements = new Map();

  const FALLBACK_IMG =
    "https://placehold.co/600x400/121212/ffffff?text=Stream+Preview";

  function hideLoadingState() {
    if (loadingState && loadingState.parentNode) {
      loadingState.remove();
    }
  }

  function showEmptyState() {
    if (!previewContainer.contains(emptyStateMessage)) {
      previewContainer.appendChild(emptyStateMessage);
    }
  }

  function hideEmptyState() {
    if (emptyStateMessage.parentNode) {
      emptyStateMessage.remove();
    }
  }

  function formatViewers(count) {
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + "K";
    }
    return count.toLocaleString();
  }

  function restartPulseAnimation(element) {
    if (!element) return;
    element.classList.remove("pulse");
    void element.offsetWidth;
    element.classList.add("pulse");
    element.addEventListener(
      "animationend",
      () => element.classList.remove("pulse"),
      { once: true }
    );
  }

  function getTags(stream) {
    return Array.isArray(stream?.tags) ? stream.tags : [];
  }

  function getStreamImage(stream) {
    return stream?.img || stream?.thumbnail || FALLBACK_IMG;
  }

  function createStreamCard(stream) {
    const card = document.createElement("article");
    card.className = "col";
    card.dataset.streamId = stream.id;
    card.tabIndex = 0;
    card.setAttribute("role", "button");

    card.innerHTML = `
      <div class="card shadow-sm h-100">
        <img class="card-img-top" loading="lazy" alt="" />
        <div class="card-body">
          <h3 class="card-title h6 mb-1"></h3>
          <p class="card-text text-muted mb-1"></p>
          <p class="viewer-count text-muted small mb-2" role="status" aria-live="polite">
            <span class="live-dot" aria-hidden="true"></span>
            <span class="sr-only live-dot-label">Live stream indicator.</span>
            <span class="viewer-number"></span>
            <span class="sr-only viewer-update-msg">Live viewer count. Updates automatically.</span>
            <span aria-hidden="true"> viewers</span>
          </p>
          <div class="tag-container d-flex flex-wrap gap-1"></div>
        </div>
      </div>
    `;

    const entry = {
      card,
      imageEl: card.querySelector(".card-img-top"),
      titleEl: card.querySelector(".card-title"),
      userEl: card.querySelector(".card-text"),
      viewerCountRegion: card.querySelector(".viewer-count"),
      viewerNumberEl: card.querySelector(".viewer-number"),
      liveAnnouncementEl: card.querySelector(".viewer-update-msg"),
      tagContainer: card.querySelector(".tag-container"),
    };

    previewContainer.appendChild(card);
    return entry;
  }

  function updateStreamCard(entry, stream, index) {
    entry.card.dataset.streamId = stream.id;
    entry.card.setAttribute("aria-label", `Open details for ${stream.title}`);
    entry.card.style.order = index;
    entry.imageEl.src = getStreamImage(stream);
    entry.imageEl.alt = `Stream preview for ${stream.title}`;
    entry.titleEl.textContent = stream.title;
    entry.userEl.textContent = stream.user;

    entry.viewerCountRegion.setAttribute(
      "aria-label",
      `${stream.title} live viewer count`
    );

    const previousViewers = previousViewerCounts.get(stream.id);
    const shouldPulse =
      previousViewers !== undefined && previousViewers !== stream.viewers;

    entry.viewerNumberEl.textContent = formatViewers(stream.viewers);
    entry.liveAnnouncementEl.textContent = `${formatViewers(
      stream.viewers
    )} people watching live.`;

    if (shouldPulse) {
      restartPulseAnimation(entry.viewerNumberEl);
    }

    previousViewerCounts.set(stream.id, stream.viewers);

    entry.tagContainer.innerHTML = getTags(stream)
      .map(
        (tag) =>
          `<span class="badge bg-primary tag-badge" role="button" tabindex="0">${tag}</span>`
      )
      .join("");
  }

  function updateStreamEntries(streams) {
    const seen = new Set();

    streams.forEach((stream, index) => {
      let entry = streamElements.get(stream.id);
      if (!entry) {
        entry = createStreamCard(stream);
        streamElements.set(stream.id, entry);
      }
      updateStreamCard(entry, stream, index);
      seen.add(stream.id);
    });

    streamElements.forEach((entry, id) => {
      if (!seen.has(id)) {
        entry.card.remove();
        streamElements.delete(id);
        previousViewerCounts.delete(id);
      }
    });
  }

  function getFilteredStreams() {
    if (!activeFilter || !activeFilter.value) {
      return allStreams;
    }

    if (activeFilter.type === "tag") {
      return allStreams.filter((stream) =>
        getTags(stream).some((tag) => tag.toLowerCase() === activeFilter.value)
      );
    }

    if (activeFilter.type === "search") {
      const term = activeFilter.value;
      return allStreams.filter((stream) => {
        const titleMatch = stream.title.toLowerCase().includes(term);
        const userMatch = stream.user.toLowerCase().includes(term);
        const tagMatch = getTags(stream).some((tag) =>
          tag.toLowerCase().includes(term)
        );
        return titleMatch || userMatch || tagMatch;
      });
    }

    return allStreams;
  }

  function renderStreams() {
    const visibleStreams = getFilteredStreams();
    const visibleIds = new Set(visibleStreams.map((stream) => stream.id));

    if (!visibleStreams.length) {
      showEmptyState();
    } else {
      hideEmptyState();
    }

    streamElements.forEach((entry, id) => {
      entry.card.classList.toggle("d-none", !visibleIds.has(id));
    });
  }

  const setActiveFilter = (filter) => {
    activeFilter = filter;
    renderStreams();
  };

  const sanitizeSearchTerm = (term = "") => {
    const normalized = term.trim().toLowerCase();
    return normalized.startsWith("#") ? normalized.slice(1) : normalized;
  };

  const handleTagFilter = (tagName) => {
    const trimmed = tagName.trim();
    if (!trimmed) return;
    const normalized = trimmed.toLowerCase();
    setActiveFilter({ type: "tag", value: normalized });
    if (searchInput) {
      searchInput.value = `#${trimmed}`;
    }
    if (clearSearch) {
      clearSearch.classList.remove("d-none");
    }
  };

  const handleGridInteraction = (e) => {
    const target = e.target;

    const badge = target.closest(".tag-badge");
    if (badge) {
      handleTagFilter(badge.textContent);
      return;
    }

    const card = target.closest("article.col");
    if (card && card.dataset.streamId) {
      const stream = allStreams.find((s) => s.id == card.dataset.streamId);
      if (stream) openStreamDetail(stream);
    }
  };

  previewContainer.addEventListener("click", handleGridInteraction);

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

    lastFocusedElementBeforeModal = document.activeElement;

    const modal = document.createElement("div");
    modal.className = "stream-detail-modal";
    const titleId = `stream-modal-title-${stream.id}`;

    modal.innerHTML = `
      <div class="stream-detail-overlay" tabindex="-1"></div>
      <div class="stream-detail-content" role="dialog" aria-modal="true" aria-labelledby="${titleId}">
        <button class="close-modal" type="button" aria-label="Close stream detail">
          <span aria-hidden="true">&times;</span>
        </button>

        <img src="${stream.img}" alt="${stream.title}" class="img-fluid mb-3"/>
        <h2 class="h5" id="${titleId}">${stream.title}</h2>
        <p class="text-muted mb-1">${stream.user}</p>
        <p class="small text-muted">
          ${formatViewers(stream.viewers)} viewers
        </p>
        <div class="mt-2">
          ${getTags(stream)
            .map(
              (tag) => `<span class="badge bg-primary me-1" tabindex="0">${tag}</span>`
            )
            .join("")}
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const dialog = modal.querySelector(".stream-detail-content");
    const closeButton = modal.querySelector(".close-modal");
    const overlay = modal.querySelector(".stream-detail-overlay");

    const focusableSelectors =
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

    const trapFocus = (event) => {
      if (event.key !== "Tab") return;
      const focusable = Array.from(
        dialog.querySelectorAll(focusableSelectors)
      );
      if (!focusable.length) {
        event.preventDefault();
        closeButton.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const closeModal = () => {
      dialog.removeEventListener("keydown", trapFocus);
      document.removeEventListener("keydown", escHandler);
      modal.remove();
      if (
        lastFocusedElementBeforeModal &&
        typeof lastFocusedElementBeforeModal.focus === "function"
      ) {
        lastFocusedElementBeforeModal.focus();
      }
    };

    const escHandler = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeModal();
      }
    };

    closeButton.addEventListener("click", closeModal);
    overlay.addEventListener("click", closeModal);
    dialog.addEventListener("keydown", trapFocus);
    document.addEventListener("keydown", escHandler);

    requestAnimationFrame(() => {
      closeButton.focus();
    });
  }

  async function fetchStreams() {
    if (isFetching) return;
    isFetching = true;
    try {
      const response = await fetch("/api/streams");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      allStreams = Array.isArray(data) ? data : [];
      updateStreamEntries(allStreams);
      hideLoadingState();
      renderStreams();
    } catch (error) {
      console.error("Failed to fetch streams:", error);
      if (!streamElements.size) {
        previewContainer.innerHTML =
          '<p class="text-danger">Error loading streams.</p>';
      }
    } finally {
      isFetching = false;
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
      const term = sanitizeSearchTerm(searchInput.value);
      clearSearch.classList.toggle("d-none", !term);
      if (!term) {
        setActiveFilter(null);
        return;
      }
      setActiveFilter({ type: "search", value: term });
    }, 300)
  );

  clearSearch.addEventListener("click", () => {
    searchInput.value = "";
    clearSearch.classList.add("d-none");
    setActiveFilter(null);
  });

  fetchStreams();
  const refreshHandle = setInterval(fetchStreams, STREAM_REFRESH_INTERVAL);
  window.addEventListener("beforeunload", () => clearInterval(refreshHandle));
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
