const CACHE_NAME = 'mochi-mood-v14';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './icon.png',
  './src/main.js',
  './src/config.js',
  './src/state.js',
  './src/api.js',
  './src/utils.js',
  './src/modules/auth.js',
  './src/modules/home.js',
  './src/modules/entry.js',
  './src/modules/journal.js',
  './src/modules/stats.js',
  './src/modules/profile.js',
  './src/modules/partner.js',
  './src/modules/camera.js',
  './src/modules/gallery.js',
  './src/modules/onboarding.js',
  './src/modules/moodjar.js'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS).catch(err => console.log('SW Cache error:', err));
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      })
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  
  // Skip caching for Supabase API calls
  if (event.request.url.includes('supabase.co')) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then(response => {
          if (response) return response;
          // Fallback if both network and cache fail
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
          return new Response('Not found', { status: 404, statusText: 'Not Found' });
        });
      })
  );
});
