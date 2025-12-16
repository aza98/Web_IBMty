/**
 * Service Worker con Workbox
 * Iglesia Bautista de Monterrey - PWA
 * Versión: 4.0.1 con Workbox
 */

importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");
importScripts('https://cdnjs.cloudflare.com/ajax/libs/workbox-sw/7.3.0/workbox-sw.min.js');

if (workbox) {
  console.log('✅ Workbox cargado correctamente');
  workbox.setConfig({
    debug: false,
  });

  // ============================================
  // PRECACHING - Recursos críticos (Solo Assets)
  // ============================================
  workbox.precaching.precacheAndRoute([
    { url: '/', revision: '4.0.2' },
    { url: '/index.html', revision: '4.0.2' },
    { url: '/manifest.json', revision: '4.0.2' },

    { url: '/context/utils.js', revision: '4.0.2' },
    { url: '/context/btn-install.js', revision: '4.0.2' },
    { url: '/context/sw-registration.js', revision: '4.0.2' },

    { url: '/assets/icons/IBMty_Icon_32.png', revision: '4.0.2' },
    { url: '/assets/icons/IBMty_Icon_152.png', revision: '4.0.2' },
    { url: '/assets/icons/IBMty_Icon_180.png', revision: '4.0.2' },
    { url: '/assets/icons/IBMty_Icon_512.png', revision: '4.0.2' },
    { url: '/assets/icons/IBMty_Logo_Mobile.png', revision: '4.0.2' },
    { url: '/assets/icons/IBMty_Logo_Desktop.png', revision: '4.0.2' },
  ]);

  // ============================================
  // ESTRATEGIA 1: NetworkFirst
  // CSS y JS propios para asegurar actualización en PWA instalada
  // ============================================

  workbox.routing.registerRoute(
    ({ request, url }) =>
      (request.destination === 'style' ||
       request.destination === 'script') &&
      url.origin === self.location.origin,
    new workbox.strategies.NetworkFirst({
      cacheName: 'ibmty-static-assets-v4',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60,
          purgeOnQuotaError: true,
        }),
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    })
  );

  workbox.routing.registerRoute(
    ({ request, url }) =>
      request.destination === 'image' &&
      url.origin === self.location.origin,
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'ibmty-images-v4',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 24 * 60 * 60,
          purgeOnQuotaError: true,
        }),
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    })
  );

  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'font',
    new workbox.strategies.CacheFirst({
      cacheName: 'ibmty-fonts-v4',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 30,
          maxAgeSeconds: 365 * 24 * 60 * 60,
          purgeOnQuotaError: true,
        }),
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    })
  );

  // ============================================
  // ESTRATEGIA 2: NetworkFirst
  // Para contenido que debe estar actualizado
  // ============================================

  workbox.routing.registerRoute(
    ({ request }) => request.mode === 'navigate',
    new workbox.strategies.NetworkFirst({
      cacheName: 'ibmty-pages-v4',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 7 * 24 * 60 * 60,
          purgeOnQuotaError: true,
        }),
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    })
  );

  // ============================================
  // ESTRATEGIA 3: StaleWhileRevalidate
  // Para recursos de CDN que pueden actualizarse
  // ============================================

  workbox.routing.registerRoute(
    ({ url }) =>
      url.origin === 'https://fonts.googleapis.com' ||
      url.origin === 'https://fonts.gstatic.com',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'ibmty-google-fonts-v4',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 20,
          maxAgeSeconds: 365 * 24 * 60 * 60,
          purgeOnQuotaError: true,
        }),
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    })
  );

  workbox.routing.registerRoute(
    ({ url }) =>
      url.origin === 'https://cdn.jsdelivr.net' ||
      url.origin === 'https://cdnjs.cloudflare.com',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'ibmty-cdn-assets-v4',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60, // 24 horas
          purgeOnQuotaError: true,
        }),
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    })
  );

  workbox.routing.registerRoute(
    ({ url }) => url.origin === 'https://www.youtube.com' || url.origin === 'https://i.ytimg.com',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'ibmty-youtube-v4',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 10,
          maxAgeSeconds: 7 * 24 * 60 * 60,
          purgeOnQuotaError: true,
        }),
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    })
  );

  // ============================================
  // NAVEGACIÓN OFFLINE
  // ============================================

  workbox.routing.setDefaultHandler(
    new workbox.strategies.NetworkFirst({
      cacheName: 'ibmty-default-v4',
    })
  );

  workbox.routing.setCatchHandler(async ({ event }) => {
    if (event.request.mode === 'navigate') {
      return await caches.match('/index.html', {
        cacheName: workbox.core.cacheNames.precache,
      });
    }
    return Response.error();
  });

  // ============================================
  // EVENTOS DEL SERVICE WORKER
  // ============================================

  self.addEventListener('install', (event) => {
    console.log('Service Worker: Instalando...');
    event.waitUntil(self.skipWaiting());
  });

  self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activado');
    event.waitUntil(
      (async () => {
        await self.clients.claim();
        const clients = await self.clients.matchAll({ type: 'window' });
        clients.forEach(client => {
          client.postMessage({ type: 'SW_UPDATED' });
        });
      })()
    );
    const currentCaches = [
      'ibmty-static-assets-v4',
      'ibmty-images-v4',
      'ibmty-fonts-v4',
      'ibmty-pages-v4',
      'ibmty-google-fonts-v4',
      'ibmty-cdn-assets-v4',
      'ibmty-youtube-v4',
      'ibmty-default-v4',
      'ibmty-runtime-v4',
      workbox.core.cacheNames.precache,
    ];
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!currentCaches.includes(cacheName)) {
              console.log('🗑️ Eliminando caché antigua:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
    );
  });

  self.addEventListener('message', async (event) => {
    if (!event.data) return;

    if (event.data.type === 'SKIP_WAITING') {
      await self.skipWaiting();
    }

    if (event.data.type === 'CACHE_URLS' && Array.isArray(event.data.urls)) {
      const cache = await caches.open('ibmty-runtime-v4');
      await cache.addAll(event.data.urls);
    }
  });

  console.log('Service Worker configurado con Workbox');

} else {
  console.error('Error: Workbox no pudo ser cargado');
}