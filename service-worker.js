/**
 * Service Worker con Workbox
 * Iglesia Bautista de Monterrey - PWA
 * Versión: 3.0.0 con Workbox
 */

// Importar Workbox desde CDN
importScripts('https://cdnjs.cloudflare.com/ajax/libs/workbox-sw/7.3.0/workbox-sw.min.js');

// Verificar que Workbox se haya cargado correctamente
if (workbox) {
  console.log('✅ Workbox cargado correctamente');

  // Configuración de Workbox
  workbox.setConfig({
    debug: false, // Cambiar a true para modo depuración
  });

  // ============================================
  // PRECACHING - Recursos críticos
  // ============================================
  workbox.precaching.precacheAndRoute([
    // Páginas principales
    { url: '/index.html', revision: '3.0.1' },
    { url: '/nosotros.html', revision: '3.0.1' },
    { url: '/ministerios.html', revision: '3.0.1' },
    { url: '/salvacion.html', revision: '3.0.1' },
    { url: '/donativo.html', revision: '3.0.1' },
    { url: '/privacidad.html', revision: '3.0.1' },

    // Manifest
    { url: '/manifest.json', revision: '3.0.1' },

    // Scripts críticos
    { url: '/context/utils.js', revision: '3.0.1' },
    { url: '/context/btn-install.js', revision: '3.0.1' },
    { url: '/context/sw-registration.js', revision: '3.0.1' },
    { url: '/context/carousel-manager.js', revision: '3.0.1' },
    { url: '/context/parallax.js', revision: '3.0.1' },
    { url: '/context/YouTubeManager.js', revision: '3.0.1' },

    // Iconos principales
    { url: '/assets/icons/IBMty_Icon_32.png', revision: '3.0.1' },
    { url: '/assets/icons/IBMty_Icon_152.png', revision: '3.0.1' },
    { url: '/assets/icons/IBMty_Icon_180.png', revision: '3.0.1' },
    { url: '/assets/icons/IBMty_Icon_512.png', revision: '3.0.1' },
    { url: '/assets/icons/IBMty_Logo_Mobile.png', revision: '3.0.1' },
    { url: '/assets/icons/IBMty_Logo_Desktop.png', revision: '3.0.1' },
  ]);

  // ============================================
  // ESTRATEGIA 1: CacheFirst
  // Para recursos estáticos que rara vez cambian
  // ============================================

  // CSS y JavaScript locales
  workbox.routing.registerRoute(
    ({ request, url }) =>
      request.destination === 'style' ||
      request.destination === 'script' &&
      url.origin === self.location.origin,
    new workbox.strategies.CacheFirst({
      cacheName: 'ibmty-static-assets-v3',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 60,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 días
          purgeOnQuotaError: true,
        }),
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    })
  );

  // Imágenes locales
  workbox.routing.registerRoute(
    ({ request, url }) =>
      request.destination === 'image' &&
      url.origin === self.location.origin,
    new workbox.strategies.CacheFirst({
      cacheName: 'ibmty-images-v3',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 60 * 24 * 60 * 60, // 60 días
          purgeOnQuotaError: true,
        }),
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    })
  );

  // Fuentes locales
  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'font',
    new workbox.strategies.CacheFirst({
      cacheName: 'ibmty-fonts-v3',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 30,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 año
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

  // Páginas HTML
  workbox.routing.registerRoute(
    ({ request }) => request.mode === 'navigate',
    new workbox.strategies.NetworkFirst({
      cacheName: 'ibmty-pages-v3',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 días
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

  // Google Fonts
  workbox.routing.registerRoute(
    ({ url }) =>
      url.origin === 'https://fonts.googleapis.com' ||
      url.origin === 'https://fonts.gstatic.com',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'ibmty-google-fonts-v3',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 20,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 año
          purgeOnQuotaError: true,
        }),
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    })
  );

  // CDN externos (Bootstrap, Font Awesome, AOS, Swiper, etc.)
  workbox.routing.registerRoute(
    ({ url }) =>
      url.origin === 'https://cdn.jsdelivr.net' ||
      url.origin === 'https://cdnjs.cloudflare.com',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'ibmty-cdn-assets-v3',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 días
          purgeOnQuotaError: true,
        }),
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    })
  );

  // YouTube embeds (solo metadata, no videos completos)
  workbox.routing.registerRoute(
    ({ url }) => url.origin === 'https://www.youtube.com' || url.origin === 'https://i.ytimg.com',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'ibmty-youtube-v3',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 10,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 días
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

  // Configurar página de fallback para navegación offline
  workbox.routing.setDefaultHandler(
    new workbox.strategies.NetworkFirst({
      cacheName: 'ibmty-default-v3',
    })
  );

  // Manejar errores de navegación (mostrar página principal offline)
  workbox.routing.setCatchHandler(({ event }) => {
    if (event.request.mode === 'navigate') {
      return caches.match('/index.html');
    }
    return Response.error();
  });

  // ============================================
  // EVENTOS DEL SERVICE WORKER
  // ============================================

  // Evento de instalación
  self.addEventListener('install', (event) => {
    console.log('📦 Service Worker: Instalando...');
    // Forzar activación inmediata
    self.skipWaiting();
  });

  // Evento de activación
  self.addEventListener('activate', (event) => {
    console.log('✅ Service Worker: Activado');
    // Tomar control de todas las páginas inmediatamente
    event.waitUntil(self.clients.claim());

    // Limpiar cachés antiguas
    const currentCaches = [
      'ibmty-static-assets-v3',
      'ibmty-images-v3',
      'ibmty-fonts-v3',
      'ibmty-pages-v3',
      'ibmty-google-fonts-v3',
      'ibmty-cdn-assets-v3',
      'ibmty-youtube-v3',
      'ibmty-default-v3',
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

  // Manejar mensajes desde la aplicación
  self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
      self.skipWaiting();
    }

    if (event.data && event.data.type === 'CACHE_URLS') {
      event.waitUntil(
        caches.open('ibmty-runtime-v3').then((cache) => {
          return cache.addAll(event.data.urls);
        })
      );
    }
  });

  console.log('🚀 Service Worker configurado con Workbox');

} else {
  console.error('❌ Error: Workbox no pudo ser cargado');
}