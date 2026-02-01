// service-worker.js
const CACHE_NAME = 'devstream-v1';

// List of resources to cache
const CACHE_RESOURCES = [
  '/',
  '/index.html',
  '/src/css/style.css',
  '/src/js/main.js',
  '/manifest.json',
  '/src/assets/images/preview-placeholder.jpg',
  '/src/assets/icons/icon-192x192.png',
  '/src/assets/icons/icon-512x512.png',
  '/src/assets/icons/maskable-icon-192x192.png',
  '/src/assets/icons/maskable-icon-512x512.png',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js',
  'https://fonts.googleapis.com/css2?family=Roboto:wght@400&display=swap',
  'https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Mu4mxK.woff2',
];

// Install event handler
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log('Installing service worker...');
        return cache.addAll(CACHE_RESOURCES);
      })
      .catch((error) => {
        console.error('Error during cache installation:', error);
      })
  );
});

// Activate event handler
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Removing outdated cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event handler with cache-first strategy
self.addEventListener('fetch', (event) => {
  if (!event.request.url.startsWith('http')) return;
  const url = new URL(event.request.url);

  // Do not cache API requests (like/ api/streams)
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        // Update cache in background while serving cached response
        event.waitUntil(
          fetch(event.request)
            .then((newResponse) => {
              if (newResponse.ok) {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(event.request, newResponse.clone());
                });
              }
            })
            .catch((error) => {
              console.error('Failed to update cache:', error);
            })
        );
        return response;
      }

      // Handle non-cached requests
      return fetch(event.request).catch((error) => {
        console.error('Network request failed:', error);

        // Serve offline fallback for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/offline.html');
        }
      });
    })
  );
});

// Message event handler for debugging
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});

// Push notification handler
self.addEventListener('push', (event) => {
  let data = {};

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { body: event.data.text() };
    }
  }

  const title = data.title || 'DevStreamer is Live!';
  const options = {
    body: data.body || 'Your favorite DevStreamer just went live.',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: {
      url: data.url || '/',
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(clients.openWindow(event.notification.data.url));
});
