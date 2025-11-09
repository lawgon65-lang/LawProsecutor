const CACHE_NAME = 'LawNeed-cache-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap',
  'https://fonts.gstatic.com/s/sarabun/v14/DtVjJFi8kj-yKDiC_GgO_kS4EwiD-3I.woff2',
  'https://fonts.gstatic.com/s/sarabun/v14/DtVjJFi8kj-yKDiC_Gg_kS4EwiD-3I.woff2'
];

self.addEventListener('install', event => {
  console.log('[Service Worker] Install event');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching all static assets');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('[Service Worker] Cache addAll failed:', err);
      })
  );
});

self.addEventListener('fetch', event => {
  // console.log('[Service Worker] Fetching:', event.request.url);
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached response if it exists
        if (response) {
          console.log('[Service Worker] Serving from cache:', event.request.url);
          return response;
        }

        // Clone the request as it's a stream and can only be consumed once
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest)
          .then(response => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response so we can put one copy in the cache
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(error => {
            console.error('[Service Worker] Fetch failed:', error);
            // This is the key part for offline support.
            // If the fetch fails (due to no network), you can return a fallback page.
            // In this case, we'll try to return the cached index.html.
            return caches.match('./index.html').then(fallbackResponse => {
              if (fallbackResponse) {
                console.log('[Service Worker] Network failed, serving fallback from cache.');
                return fallbackResponse;
              } else {
                console.log('[Service Worker] Network failed and no fallback available.');
                // You could also create a simple offline page here
                return new Response('<h1>Offline</h1><p>The page you are looking for is not available offline.</p>', {
                  headers: { 'Content-Type': 'text/html' }
                });
              }
            });
          });
      })
  );
});

self.addEventListener('activate', event => {
  console.log('[Service Worker] Activate event');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log(`[Service Worker] Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
