// main.js - Entry point for DevStream DOM logic

document.addEventListener("DOMContentLoaded", () => {
  const drawerToggle = document.getElementById("drawerToggle");
  const drawer = document.getElementById("categoryDrawer");
  const drawerClose = document.getElementById("drawerClose");

  // Toggle drawer open/close
  drawerToggle.addEventListener("click", () => {
    if (drawer.classList.contains("open")) {
      drawer.classList.remove("open");
      drawer.style.display = "none";
    } else {
      drawer.classList.add("open");
      drawer.style.display = "block";
    }
  });

  // Close drawer by clicking outside
  document.addEventListener("click", (e) => {
    if (!drawer.contains(e.target) && !drawerToggle.contains(e.target)) {
      drawer.classList.remove("open");
      drawer.style.display = "none";
    }
  });

  // Close drawer with close (×) button
  drawerClose.addEventListener("click", () => {
    drawer.classList.remove("open");
    drawer.style.display = "none";
  });


  // 🌙 Theme toggle
  const themeToggle = document.getElementById("themeToggle");
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const storedTheme = localStorage.getItem("theme");

  if (storedTheme === "dark" || (!storedTheme && prefersDark)) {
    document.body.classList.add("dark");
  } else {
    document.body.classList.remove("dark");
  }

  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");

    const icon = themeToggle.querySelector("i");
    icon.classList.toggle("fa-moon", !isDark);
    icon.classList.toggle("fa-sun", isDark);

    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    themeColorMeta.setAttribute('content', isDark ? '#222' : '#f4f4f4');
  });

  // 🎥 Stream data
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

  searchInput.addEventListener("input", () => {
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
