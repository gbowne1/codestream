// public/sw.js
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("devstream-v1").then((cache) => {
      return cache.addAll([
        "/",
        "/index.html",
        "/src/css/style.css",
        "/src/js/main.js",
        "/src/assets/images/preview-placeholder.jpg",
        "/manifest.json",
        "/src/assets/icons/icon-192x192.png",
        "/src/assets/icons/icon-512x512.png"
      ]);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
