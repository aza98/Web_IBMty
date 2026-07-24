try {
    importScripts('js/OneSignalSDK.sw.js')
} catch (error) {}
const APP_SW_VERSION = '7.0.0';
self.addEventListener('message', (event) => {
    if (!event.data) return;
    if (event.data.type === 'SKIP_WAITING') self.skipWaiting();
    if (event.data.type === 'GET_VERSION' && event.ports && event.ports[0]) {
        event.ports[0].postMessage(APP_SW_VERSION)
    }
});
self.addEventListener('activate', (event) => event.waitUntil(Promise.all([self.clients.claim(), caches.delete('cdn-resources')])));
importScripts('js/workbox-sw.js');
if (workbox) {
    const PRECACHE_VERSION = APP_SW_VERSION;
    workbox.setConfig({
        debug: !1,
        modulePathPrefix: 'workbox/'
    });
    workbox.loadModule('workbox-precaching');
    workbox.loadModule('workbox-routing');
    workbox.loadModule('workbox-strategies');
    workbox.loadModule('workbox-expiration');
    workbox.loadModule('workbox-cacheable-response');
    const PRECACHE_URLS = [
        'index.html',
        'nosotros.html',
        'salvacion.html',
        'donativo.html',
        'privacidad.html',
        'settings.html',
        'splash.html',
        'offline.html',
        'manifest.json',
        'css/main.css',
        'css/components/carousel.css',
        'css/pages/donativo.css',
        'css/pages/index.css',
        'css/pages/nosotros.css',
        'css/pages/privacidad.css',
        'css/pages/salvacion.css',
        'css/pages/settings.css',
        'css/pages/splash.css',
        'config/config.js',
        'js/pwa-launch.js',
        'js/main.js',
        'js/utils/analytics.js',
        'js/components/animations.js',
        'js/components/carousel.js',
        'js/pages/nosotros.js',
        'js/pages/salvacion.js',
        'js/components/youtube-api.js',
        'js/components/missionaries-map.js',
        'js/components/push.js',
        'workbox/workbox-core.prod.js',
        'workbox/workbox-precaching.prod.js',
        'workbox/workbox-routing.prod.js',
        'workbox/workbox-strategies.prod.js',
        'workbox/workbox-expiration.prod.js',
        'workbox/workbox-cacheable-response.prod.js',
        'gsap-public/minified/gsap.min.js',
        'gsap-public/minified/ScrollTrigger.min.js',
        'leaflet/dist/leaflet.js',
        'leaflet/dist/leaflet.css',
        'assets/icons/Logo_IBMty.png',
        'assets/icons/IBMty_Logo_Mobile.webp',
        'assets/icons/IBMty_Logo_Desktop.webp',
        'assets/icons/IBMty_Icon_192.png',
        'assets/icons/IBMty_Icon_512.png',
        'assets/icons/icon-512-maskable.png',
        'assets/icons/IBMty_Icon_180.png',
        'assets/icons/IBMty_Icon_32.png',
        'assets/icons/IBMty_Icon_32.ico',
    ];
    workbox.precaching.precacheAndRoute(PRECACHE_URLS.map((url) => ({
        url,
        revision: PRECACHE_VERSION
    })));
    workbox.precaching.cleanupOutdatedCaches();
    workbox.routing.registerRoute(({
        request
    }) => request.destination === 'document', new workbox.strategies.NetworkFirst({
        cacheName: 'pages-cache',
        networkTimeoutSeconds: 3,
        plugins: [new workbox.expiration.ExpirationPlugin({
            maxEntries: 20,
            purgeOnQuotaError: !0,
        }), ],
    }));
    workbox.routing.registerRoute(({
        url
    }) => url.origin === 'https://cdn.jsdelivr.net', new workbox.strategies.CacheFirst({
        cacheName: 'cdn-resources-v2',
        plugins: [new workbox.cacheableResponse.CacheableResponsePlugin({
            statuses: [0, 200]
        }), new workbox.expiration.ExpirationPlugin({
            maxEntries: 40,
            maxAgeSeconds: 30 * 24 * 60 * 60,
            purgeOnQuotaError: !0,
        }), ],
    }));
    workbox.routing.registerRoute(({
        request
    }) => request.destination === 'font' || request.url.includes('assets/fonts/'), new workbox.strategies.CacheFirst({
        cacheName: 'fonts-cache',
        plugins: [new workbox.cacheableResponse.CacheableResponsePlugin({
            statuses: [0, 200]
        }), new workbox.expiration.ExpirationPlugin({
            maxEntries: 30,
            maxAgeSeconds: 60 * 60 * 24 * 365,
            purgeOnQuotaError: !0,
        }), ],
    }));
    workbox.routing.registerRoute(({
        url
    }) => url.hostname.endsWith('basemaps.cartocdn.com'), new workbox.strategies.CacheFirst({
        cacheName: 'map-tiles',
        plugins: [new workbox.cacheableResponse.CacheableResponsePlugin({
            statuses: [0, 200]
        }), new workbox.expiration.ExpirationPlugin({
            maxEntries: 160,
            maxAgeSeconds: 30 * 24 * 60 * 60,
            purgeOnQuotaError: !0,
        }), ],
    }));
    workbox.routing.registerRoute(({
        request
    }) => request.destination === 'image', new workbox.strategies.CacheFirst({
        cacheName: 'images-cache',
        plugins: [new workbox.cacheableResponse.CacheableResponsePlugin({
            statuses: [0, 200]
        }), new workbox.expiration.ExpirationPlugin({
            maxEntries: 80,
            maxAgeSeconds: 30 * 24 * 60 * 60,
            purgeOnQuotaError: !0,
        }), ],
    }));
    workbox.routing.setCatchHandler(async ({
        request
    }) => {
        if (request.destination === 'document') {
            const cached = await workbox.precaching.matchPrecache('offline.html');
            if (cached) return cached
        }
        return Response.error()
    })
}
