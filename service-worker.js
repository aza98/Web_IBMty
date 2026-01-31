/**
 * Service Worker con Workbox
 * Iglesia Bautista de Monterrey - PWA
 * Versión: 4.2.0
 */

importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");
importScripts('https://cdnjs.cloudflare.com/ajax/libs/workbox-sw/7.3.0/workbox-sw.min.js');

if (workbox) {
  console.log('✅ Workbox cargado correctamente');

  workbox.setConfig({ debug: false });

  const { registerRoute, setDefaultHandler, setCatchHandler } = workbox.routing;
  const { NetworkFirst, StaleWhileRevalidate, CacheFirst } = workbox.strategies;
  const { ExpirationPlugin } = workbox.expiration;
  const { CacheableResponsePlugin } = workbox.cacheableResponse;
  const { precacheAndRoute, matchPrecache } = workbox.precaching;

  const CACHE_VERSION = 'v4';
  const CACHE_NAMES = {
    static: `ibmty-static-assets-${CACHE_VERSION}`,
    images: `ibmty-images-${CACHE_VERSION}`,
    fonts: `ibmty-fonts-${CACHE_VERSION}`,
    pages: `ibmty-pages-${CACHE_VERSION}`,
    googleFonts: `ibmty-google-fonts-${CACHE_VERSION}`,
    cdn: `ibmty-cdn-assets-${CACHE_VERSION}`,
    youtube: `ibmty-youtube-${CACHE_VERSION}`,
    default: `ibmty-default-${CACHE_VERSION}`,
    runtime: `ibmty-runtime-${CACHE_VERSION}`,
  };

  // ============================================
  // 1. PRECACHING - Recursos críticos
  // ============================================
  precacheAndRoute([
    { url: '/', revision: '4.2.0' },
    { url: '/index.html', revision: '4.2.0' },
    { url: '/manifest.json', revision: '4.2.0' },
    { url: '/styles/main.css', revision: '4.2.0' },
    { url: '/styles/btn-whatsapp.css', revision: '4.2.0' },
    { url: '/context/utils.js', revision: '4.2.0' },
    { url: '/context/btn-install.js', revision: '4.2.0' },
    { url: '/context/sw-registration.js', revision: '4.2.0' },
    { url: '/assets/icons/IBMty_Icon_32.png', revision: '4.2.0' },
    { url: '/assets/icons/IBMty_Icon_180.png', revision: '4.2.0' },
    { url: '/assets/icons/IBMty_Icon_192.png', revision: '4.2.0' },
    { url: '/assets/icons/IBMty_Icon_512.png', revision: '4.2.0' },
    { url: '/assets/icons/IBMty_Logo_Desktop.png', revision: '4.2.0' },
    { url: '/assets/icons/IBMty_Logo_Mobile.png', revision: '4.2.0' },
    { url: '/assets/images/extras/Bienvenida_mobile.webp', revision: '4.2.0' },
    { url: '/assets/images/extras/Bienvenida_desktop.webp', revision: '4.2.0' },
  ]);

  // ============================================
  // 2. RUTAS DE NAVEGACIÓN (Páginas HTML)
  // ============================================
  registerRoute(
    ({ request }) => request.mode === 'navigate',
    new NetworkFirst({
      cacheName: CACHE_NAMES.pages,
      networkTimeoutSeconds: 3,
      plugins: [
        new ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 7 * 24 * 60 * 60,
          purgeOnQuotaError: true,
        }),
        new CacheableResponsePlugin({ statuses: [0, 200] }),
      ],
    })
  );

  // ============================================
  // 3. ASSETS PROPIOS (CSS, JS)
  // ============================================
  registerRoute(
    ({ request, url }) =>
      (request.destination === 'style' || request.destination === 'script') &&
      url.origin === self.location.origin,
    new NetworkFirst({
      cacheName: CACHE_NAMES.static,
      networkTimeoutSeconds: 3,
      plugins: [
        new ExpirationPlugin({
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        }),
        new CacheableResponsePlugin({ statuses: [0, 200] }),
      ],
    })
  );

  // ============================================
  // 4. IMÁGENES
  // ============================================
  registerRoute(
    ({ request, url }) =>
      request.destination === 'image' &&
      url.origin === self.location.origin,
    new CacheFirst({
      cacheName: CACHE_NAMES.images,
      plugins: [
        new ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60,
          purgeOnQuotaError: true,
        }),
        new CacheableResponsePlugin({ statuses: [0, 200] }),
      ],
    })
  );

  // ============================================
  // 5. FUENTES Y RECURSOS EXTERNOS (CDN)
  // ============================================
  registerRoute(
    ({ request, url }) =>
      request.destination === 'font' ||
      url.origin === 'https://fonts.googleapis.com' ||
      url.origin === 'https://fonts.gstatic.com',
    new CacheFirst({
      cacheName: CACHE_NAMES.fonts,
      plugins: [
        new ExpirationPlugin({
          maxEntries: 30,
          maxAgeSeconds: 365 * 24 * 60 * 60,
        }),
        new CacheableResponsePlugin({ statuses: [0, 200] }),
      ],
    })
  );

  registerRoute(
    ({ url }) =>
      url.origin === 'https://cdn.jsdelivr.net' ||
      url.origin === 'https://cdnjs.cloudflare.com',
    new StaleWhileRevalidate({
      cacheName: CACHE_NAMES.cdn,
      plugins: [
        new ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60,
        }),
        new CacheableResponsePlugin({ statuses: [0, 200] }),
      ],
    })
  );

  registerRoute(
    ({ url }) => url.origin === 'https://www.youtube.com' || url.origin === 'https://i.ytimg.com',
    new StaleWhileRevalidate({
      cacheName: CACHE_NAMES.youtube,
      plugins: [
        new ExpirationPlugin({
          maxEntries: 15,
          maxAgeSeconds: 3 * 24 * 60 * 60,
        }),
        new CacheableResponsePlugin({ statuses: [0, 200] }),
      ],
    })
  );

  // ============================================
  // FALLBACK Y OFFLINE
  // ============================================
  setDefaultHandler(
    new NetworkFirst({
      cacheName: CACHE_NAMES.default,
      networkTimeoutSeconds: 5,
    })
  );

  setCatchHandler(async ({ request }) => {
    if (request.mode === 'navigate' || request.destination === 'document') {
      return matchPrecache('/index.html');
    }
    return Response.error();
  });

  // ============================================
  // EVENTOS DEL SERVICE WORKER
  // ============================================
  self.addEventListener('install', (event) => {
    console.log('SW: Instalando v4.2.0...');
    event.waitUntil(self.skipWaiting());
  });

  self.addEventListener('activate', (event) => {
    console.log('SW: Activado');
    event.waitUntil(
      (async () => {
        await self.clients.claim();

        const clients = await self.clients.matchAll({ type: 'window' });
        clients.forEach(client => client.postMessage({ type: 'SW_UPDATED' }));

        const cacheNames = await caches.keys();
        const expectedCaches = Object.values(CACHE_NAMES).concat([workbox.core.cacheNames.precache]);

        await Promise.all(
          cacheNames.map((cacheName) => {
            if (!expectedCaches.includes(cacheName) && !cacheName.includes('onesignal')) {
              console.log('Eliminando caché obsoleta:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })()
    );
  });

  self.addEventListener('message', async (event) => {
    if (!event.data) return;

    if (event.data.type === 'SKIP_WAITING') {
      await self.skipWaiting();
    }

    if (event.data.type === 'CACHE_URLS' && Array.isArray(event.data.urls)) {
      const cache = await caches.open(CACHE_NAMES.runtime);
      await cache.addAll(event.data.urls);
    }
  });

} else {
  console.error('Error: Workbox no pudo ser cargado');
}