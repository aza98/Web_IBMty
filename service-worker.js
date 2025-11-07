const CACHE_NAME = 'ibmty-cache-v2';
const OFFLINE_URL = '/index.html';

const urlsToCache = [
  '/',
  '/index.html',
  '/nosotros.html',
  '/ministerios.html',
  '/salvacion.html',
  '/donativo.html',
  '/privacidad.html',
  '/manifest.json',
  '/context/Utils.js',
  '/context/InstallApp.js',
  '/context/YouTubeManager.js',
  '/context/events/Evento1.ics',
  '/context/events/Evento2.ics',
  '/styles/ministerios.css',
  '/styles/parallax.css',
  '/styles/eventsCarousel.css',
  '/styles/install.css',
  '/styles/salvacion.css',
  '/styles/responsive-fixes.css',
  '/components/navbar.css',
  '/components/footer.css',
  '/components/floating-bottom.css',
  '/assets/icons/IBMty_Icon_32.png',
  '/assets/icons/IBMty_Icon_152.png',
  '/assets/icons/IBMty_Icon_167.png',
  '/assets/icons/IBMty_Icon_180.png',
  '/assets/icons/IBMty_Icon_512.png',
  '/assets/images/extras/Bienvenida_desktop.png',
  '/assets/images/extras/Bienvenida_mobile.jpg',
  '/assets/images/extras/Historia.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Archivos agregados al caché');
        return cache.addAll(urlsToCache);
      })
      .catch((err) => console.error('Error al agregar archivos al caché:', err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Eliminando caché antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => caches.match(OFFLINE_URL));
    })
  );
});