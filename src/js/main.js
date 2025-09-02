// main.js - Entry point for DevStream DOM logic

document.addEventListener("DOMContentLoaded", () => {
  const drawerToggle = document.getElementById("drawerToggle");
  const drawer = document.getElementById("categoryDrawer");
  const drawerClose = document.getElementById("drawerClose");

  // Function to update drawer state
  const updateDrawerState = (isOpen) => {
    if (isOpen) {
      drawer.classList.add("open");
      drawerToggle.setAttribute('aria-expanded', 'true');
    } else {
      drawer.classList.remove("open");
      drawerToggle.setAttribute('aria-expanded', 'false');
    }
  };

  // Toggle drawer open/close
  drawerToggle.addEventListener("click", () => {
    const isOpen = drawer.classList.contains("open");
    updateDrawerState(!isOpen);
  });

  // Close drawer by clicking outside
  document.addEventListener("click", (e) => {
    // Ensure drawer is open before trying to close by outside click
    if (drawer.classList.contains("open") && !drawer.contains(e.target) && !drawerToggle.contains(e.target)) {
      updateDrawerState(false);
    }
  });

  // Close drawer with close (×) button
  drawerClose.addEventListener("click", () => {
    updateDrawerState(false);
  });

  // 🌙 Theme toggle
  const themeToggle = document.getElementById("themeToggle");
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  const storedTheme = localStorage.getItem("theme");

  // Define the actual colors to be used for the theme-color meta tag
  const LIGHT_THEME_COLOR = "#ffffff"; // Or "#f4f4f4" if that's your preferred light status bar color
  const DARK_THEME_COLOR = "#111111"; // Or "#222222" if that matches your dark header

  // Function to apply/remove dark mode class and update meta tag/icon
  const applyTheme = (isDark) => {
    if (isDark) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }

    // Update theme toggle icon
    const icon = themeToggle.querySelector("i");
    icon.classList.toggle("fa-moon", !isDark); // If not dark, show moon (for light mode)
    icon.classList.toggle("fa-sun", isDark);   // If dark, show sun (for dark mode)

    // Update theme-color meta tag based on current theme
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) { // Check if the meta tag exists
      themeColorMeta.setAttribute('content', isDark ? DARK_THEME_COLOR : LIGHT_THEME_COLOR);
    }
  };

  // Determine initial theme on page load
  let initialIsDark = false;
  if (storedTheme === "dark") {
    initialIsDark = true;
  } else if (storedTheme === "light") {
    initialIsDark = false;
  } else { // No stored theme, use system preference
    initialIsDark = prefersDark.matches;
  }
  applyTheme(initialIsDark);


  // Listen for changes in system theme preference (e.g., user changes OS theme)
  prefersDark.addEventListener('change', (event) => {
    // Only auto-switch if no theme preference is explicitly stored
    if (!localStorage.getItem("theme")) {
      applyTheme(event.matches);
    }
  });


  // Handle manual theme toggle button click
  themeToggle.addEventListener("click", () => {
    const isCurrentlyDark = document.body.classList.contains("dark");
    const newThemeIsDark = !isCurrentlyDark; // Toggle the state

    localStorage.setItem("theme", newThemeIsDark ? "dark" : "light"); // Store user preference
    applyTheme(newThemeIsDark); // Apply the new theme
  });

  // 🎥 Stream data (rest of your stream logic...)
  const streamData = [
    {
      title: "Live: Building a C++ Game Engine",
      user: "@gamedevgeek",
      tags: ["C++", "Game Dev", "Unreal"],
      img: "/src/assets/images/preview-placeholder.jpg",
      viewers: 1247
    },
    {
      title: "Exploring Python Async IO",
      user: "@pycoder",
      tags: ["Python", "Web Dev", "Chill"],
      img: "/src/assets/images/preview-placeholder.jpg",
      viewers: 1247
    },
    {
      title: "Working on My OS Kernel",
      user: "@baremetal",
      tags: ["C", "x86", "Kernel"],
      img: "/src/assets/images/preview-placeholder.jpg",
      viewers: 1247
    }
  ];

  const previewContainer = document.querySelector(".row");

  // 🔁 Render function (used for initial render and filtered results)
  function renderStreams(streams) {
    previewContainer.innerHTML = ""; // Clear existing
    streams.forEach((stream) => {
      const card = document.createElement("article");
      card.className = "col";
      card.innerHTML = `
         <div class="card shadow-sm">
        <img src="${stream.img}" class="card-img-top" width="300" height="175" alt="Stream Preview" />
        <div class="card-body">
          <h3 class="card-title h6">${stream.title}</h3>
          <p class="card-text text-muted mb-1">${stream.user}</p>
          <p class="viewer-count text-muted small mb-2">
            <i class="fas fa-eye"></i> ${stream.viewers.toLocaleString()} viewers
          </p>
          ${stream.tags.map(tag => `<span class="badge bg-primary me-1">${tag}</span>`).join('')}
        </div>
      </div>`;
      previewContainer.appendChild(card);
    });
  }

  // Initial render
  renderStreams(streamData);

  // 🔍 Search functionality
  const searchInput = document.getElementById("searchInput");
  const clearSearch = document.getElementById("clearSearch");

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
  });

  clearSearch.addEventListener("click", () => {
    searchInput.value = "";
    renderStreams(streamData);
  });
});

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
