// main.js - Entry point for DevStream DOM logic

document.addEventListener("DOMContentLoaded", () => {
  const drawerToggle = document.getElementById("drawerToggle");
  const drawer = document.getElementById("categoryDrawer");

  // Toggle off-canvas drawer
  drawerToggle.addEventListener("click", () => {
    if (drawer.classList.contains("open")) {
      drawer.classList.remove("open");
      drawer.style.display = "none";
    } else {
      drawer.classList.add("open");
      drawer.style.display = "block";
    }
  });

  // Optional: close drawer when clicking outside
  document.addEventListener("click", (e) => {
    if (!drawer.contains(e.target) && !drawerToggle.contains(e.target)) {
      drawer.classList.remove("open");
      drawer.style.display = "none";
    }
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
  });

  // Placeholder stream data for testing (replace with dynamic loading later)
  const streamData = [
    {
      title: "Live: Building a C++ Game Engine",
      user: "@gamedevgeek",
      tags: ["C++", "Game Dev", "Unreal"],
      img: "/src/assets/images/preview-placeholder.jpg"
    },
    {
      title: "Exploring Python Async IO",
      user: "@pycoder",
      tags: ["Python", "Web Dev", "Chill"],
      img: "/src/assets/images/preview-placeholder.jpg"
    },
    {
      title: "Working on My OS Kernel",
      user: "@baremetal",
      tags: ["C", "x86", "Kernel"],
      img: "/src/assets/images/preview-placeholder.jpg"
    }
  ];

  const previewContainer = document.querySelector(".row");

  streamData.forEach((stream) => {
    const card = document.createElement("article");
    card.className = "col";
    card.innerHTML = `
      <div class="card shadow-sm">
        <img src="${stream.img}" class="card-img-top" width="300" height="175" alt="Stream Preview" />
        <div class="card-body">
          <h3 class="card-title h6">${stream.title}</h3>
          <p class="card-text text-muted mb-1">${stream.user}</p>
          ${stream.tags.map(tag => `<span class="badge bg-primary me-1">${tag}</span>`).join('')}
        </div>
      </div>`;
    previewContainer.appendChild(card);
  });
});
