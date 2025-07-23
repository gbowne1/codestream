// service-worker.js
const CACHE_NAME = "devstream-v1";

// List of resources to cache
const CACHE_RESOURCES = [
    "/",
    "/index.html",
    "/src/css/style.css",
    "/src/js/main.js",
    "/manifest.json",
    "/src/assets/images/preview-placeholder.jpg",
    "/src/assets/icons/icon-192x192.png",
    "/src/assets/icons/icon-512x512.png",
    "/src/assets/icons/maskable-icon-192x192.png",
    "/src/assets/icons/maskable-icon-512x512.png"
];

// Install event handler
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log("Installing service worker...");
            return cache.addAll(CACHE_RESOURCES);
        }).catch(error => {
            console.error("Error during cache installation:", error);
        })
    );
});

// Activate event handler
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log("Removing outdated cache:", cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Fetch event handler with cache-first strategy
self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            if (response) {
                // Update cache in background while serving cached response
                event.waitUntil(
                    fetch(event.request).then((newResponse) => {
                        if (newResponse.ok) {
                            caches.open(CACHE_NAME).then((cache) => {
                                cache.put(event.request, newResponse.clone());
                            });
                        }
                    }).catch(error => {
                        console.error("Failed to update cache:", error);
                    })
                );
                return response;
            }
            
            // Handle non-cached requests
            return fetch(event.request).catch(error => {
                console.error("Network request failed:", error);
                
                // Serve offline fallback for navigation requests
                if (event.request.mode === 'navigate') {
                    return caches.match('/offline.html');
                }
            });
        })
    );
});

// Message event handler for debugging
self.addEventListener("message", (event) => {
    if (event.data === "skipWaiting") {
        self.skipWaiting();
    }
});
