try {
  importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');
} catch (error) {
  // OneSignal es opcional: si el CDN falla, el resto del SW sigue funcionando
}

importScripts('js/workbox-sw.js');

if (workbox) {
  // Configuración de Workbox
  workbox.setConfig({ debug: false });
  self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
  });
  self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
  workbox.loadModule('workbox-precaching');
  workbox.loadModule('workbox-routing');
  workbox.loadModule('workbox-strategies');
  workbox.loadModule('workbox-expiration');
  workbox.precaching.precacheAndRoute([
    { url: 'index.html', revision: '7.0.0' },
    { url: 'nosotros.html', revision: '7.0.0' },
    { url: 'salvacion.html', revision: '7.0.0' },
    { url: 'donativo.html', revision: '7.0.0' },
    { url: 'privacidad.html', revision: '7.0.0' },
    { url: 'settings.html', revision: '7.0.0' },
    { url: 'splash.html', revision: '7.0.0' },
    { url: 'manifest.json', revision: '7.0.0' },
    { url: 'css/main.css', revision: '7.0.0' },
    { url: 'css/components/carousel.css', revision: '7.0.0' },
    { url: 'css/pages/donativo.css', revision: '7.0.0' },
    { url: 'css/pages/index.css', revision: '7.0.0' },
    { url: 'css/pages/nosotros.css', revision: '7.0.0' },
    { url: 'css/pages/privacidad.css', revision: '7.0.0' },
    { url: 'css/pages/salvacion.css', revision: '7.0.0' },
    { url: 'css/pages/settings.css', revision: '7.0.1' },
    { url: 'css/pages/splash.css', revision: '7.0.0' },
    { url: 'config/config.js', revision: '7.0.1' },
    { url: 'js/main.js', revision: '7.0.1' },
    { url: 'js/utils/analytics.js', revision: '7.0.0' },
    { url: 'js/components/animations.js', revision: '7.0.0' },
    { url: 'js/components/carousel.js', revision: '7.0.0' },
    { url: 'js/pages/nosotros.js', revision: '7.0.0' },
    { url: 'js/pages/salvacion.js', revision: '7.0.0' },
    { url: 'js/components/youtube-api.js', revision: '7.0.0' },
    { url: 'js/components/missionaries-map.js', revision: '7.0.0' },
    { url: 'js/components/push.js', revision: '7.0.0' },
    { url: 'gsap-public/minified/gsap.min.js', revision: '3.12.5' },
    { url: 'gsap-public/minified/ScrollTrigger.min.js', revision: '3.12.5' },
    { url: 'leaflet/dist/leaflet.js', revision: '1.9.4' },
    { url: 'leaflet/dist/leaflet.css', revision: '1.9.4' },
    { url: 'assets/icons/Logo_IBMty.png', revision: '1.0' },
    { url: 'assets/icons/IBMty_Logo_Mobile.webp', revision: '1.0' },
    { url: 'assets/icons/IBMty_Logo_Desktop.webp', revision: '1.0' },
    { url: 'assets/icons/IBMty_Icon_192.png', revision: '1.0' },
    { url: 'assets/icons/IBMty_Icon_512.png', revision: '1.0' },
    { url: 'assets/icons/icon-512-maskable.png', revision: '1.0' },
    { url: 'assets/icons/IBMty_Icon_180.png', revision: '1.0' },
    { url: 'assets/icons/IBMty_Icon_32.png', revision: '1.0' },
    { url: 'assets/icons/IBMty_Icon_32.ico', revision: '1.0' }
  ]);

  workbox.precaching.cleanupOutdatedCaches();

  // 2. Estrategia para Páginas HTML (NetworkFirst)
  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'document',
    new workbox.strategies.NetworkFirst({
      cacheName: 'pages-cache',
      networkTimeoutSeconds: 3,
    })
  );

  // 3. Estrategia para recursos externos (CDN de Bootstrap, Swiper y Font Awesome).
  workbox.routing.registerRoute(
    ({ url }) => url.origin === 'https://cdn.jsdelivr.net',
    new workbox.strategies.CacheFirst({
      cacheName: 'cdn-resources',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 40,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 días
        }),
      ],
    })
  );

  // 4. Estrategia para Fuentes Locales (CacheFirst)
  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'font' || request.url.includes('assets/fonts/'),
    new workbox.strategies.CacheFirst({
      cacheName: 'fonts-cache',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 30,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 año
        }),
      ],
    })
  );

  // 5. Estrategia para CSS y JS propios no precacheados (StaleWhileRevalidate)
  workbox.routing.registerRoute(
    ({ url, request }) =>
      url.origin === self.location.origin &&
      (request.destination === 'style' || request.destination === 'script'),
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'static-resources',
    })
  );

  // 5b. Tiles del mapa (CartoDB Voyager/Dark Matter) — caché propia.
  workbox.routing.registerRoute(
    ({ url }) => url.hostname.endsWith('basemaps.cartocdn.com'),
    new workbox.strategies.CacheFirst({
      cacheName: 'map-tiles',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 160,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 días
        }),
      ],
    })
  );

  // 6. Estrategia para Imágenes dinámicas (CacheFirst)
  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'image',
    new workbox.strategies.CacheFirst({
      cacheName: 'images-cache',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 80,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 días
        }),
      ],
    })
  );
}
