// 版本號
const CACHE_NAME = 'pipe-calculator-cache-v2';
const urlsToCache = [
  '/',
  '管用料計算工具.html',
  'style.css',
  'js/calculator.js',
  'js/config.js',
  'js/dataProcessor.js',
  'js/debugger.js',
  'js/grouping.js',
  'js/main.js',
  'js/renderer.js',
  'js/resultProcessor.js',
  'js/simple-main.js',
  'js/validator.js',
  'js/xlsx-loader.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
