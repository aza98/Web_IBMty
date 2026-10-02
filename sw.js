importScripts('config/config.js');
try {
    importScripts('js/OneSignalSDK.sw.js')
} catch (error) {
    console.warn('OneSignal no está disponible.', error)
}
importScripts('js/workbox-sw.js');
const APP_SW_VERSION = typeof APP_CONFIG !== 'undefined' && APP_CONFIG.appVersion ? APP_CONFIG.appVersion : '7.1.3';
const RELEASE_ID = APP_SW_VERSION;
let preparing = null;
workbox.setConfig({
    debug: !1,
    modulePathPrefix: 'workbox/'
});
['core', 'routing', 'strategies', 'expiration', 'cacheable-response', 'precaching'].forEach(name => workbox.loadModule('workbox-' + name));
const CORE_PRECACHE_URLS = ['index.html', 'nosotros.html', 'salvacion.html', 'donativo.html', 'privacidad.html', 'settings.html', 'splash.html', 'offline.html', 'manifest.json', 'config/config.js', 'css/main.css', 'css/components/carousel.css', 'css/pages/donativo.css', 'css/pages/index.css', 'css/pages/nosotros.css', 'css/pages/privacidad.css', 'css/pages/salvacion.css', 'css/pages/settings.css', 'css/pages/splash.css', 'js/pwa-launch.js', 'js/main.js', 'js/utils/analytics.js', 'js/components/animations.js', 'js/components/carousel.js', 'js/components/missionaries-map.js', 'js/components/push.js', 'js/components/youtube-api.js', 'js/pages/nosotros.js', 'js/pages/salvacion.js', 'workbox/workbox-core.prod.js', 'workbox/workbox-precaching.prod.js', 'workbox/workbox-routing.prod.js', 'workbox/workbox-strategies.prod.js', 'workbox/workbox-expiration.prod.js', 'workbox/workbox-cacheable-response.prod.js', 'gsap-public/minified/gsap.min.js', 'gsap-public/minified/ScrollTrigger.min.js', 'leaflet/dist/leaflet.js', 'leaflet/dist/leaflet.css', 'assets/icons/icons.svg', 'assets/icons/IBMTY.svg', 'assets/icons/Logo_IBMty.png', 'assets/icons/IBMty_Logo_Mobile.webp', 'assets/icons/IBMty_Logo_Desktop.webp', 'assets/icons/IBMty_Icon_192.png', 'assets/icons/IBMty_Icon_512.png', 'assets/icons/icon-512-maskable.png', 'assets/icons/IBMty_Icon_180.png', 'assets/icons/IBMty_Icon_32.ico', 'assets/images/extras/YouVersion_QR.png', 'assets/calendar/CIMA_2026.ics', 'assets/fonts/League_Spartan/static/LeagueSpartan-SemiBold.woff2'];
const precacheEntries = CORE_PRECACHE_URLS.map(url => ({
    url,
    revision: APP_SW_VERSION
}));
workbox.precaching.addPlugins([{
    cacheDidUpdate: () => announce('downloading').catch(() => {}),
    handlerDidError: async ({
        event,
        error
    }) => {
        if (event.type === 'install') await announce('error', error);
    }
}]);
workbox.precaching.precacheAndRoute(precacheEntries, {
    ignoreURLParametersMatching: [/.*/],
    directoryIndex: 'index.html',
    cleanURLs: !0
});
workbox.precaching.cleanupOutdatedCaches();

function runtimePlugins(maxEntries, statuses = [0, 200]) {
    return [new workbox.cacheableResponse.CacheableResponsePlugin({
        statuses
    }), new workbox.expiration.ExpirationPlugin({
        maxEntries,
        maxAgeSeconds: 604800,
        purgeOnQuotaError: !0
    })]
}
workbox.routing.registerRoute(({
    request
}) => request.mode === 'navigate', new workbox.strategies.NetworkFirst({
    cacheName: 'ibmty-pages',
    networkTimeoutSeconds: 3,
    plugins: runtimePlugins(30, [200])
}));
workbox.routing.registerRoute(({
    request,
    url
}) => url.origin === self.location.origin && (request.destination === 'style' || request.destination === 'script'), new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'ibmty-assets',
    plugins: runtimePlugins(100)
}));
workbox.routing.registerRoute(({
    url
}) => url.origin === 'https://cdn.jsdelivr.net', new workbox.strategies.CacheFirst({
    cacheName: 'ibmty-cdn',
    plugins: runtimePlugins(40)
}));
workbox.routing.registerRoute(({
    request,
    url
}) => request.destination === 'font' || url.pathname.includes('/assets/fonts/'), new workbox.strategies.CacheFirst({
    cacheName: 'ibmty-fonts',
    plugins: runtimePlugins(30)
}));
workbox.routing.registerRoute(({
    url
}) => url.origin === 'https://tile.openstreetmap.org', new workbox.strategies.CacheFirst({
    cacheName: 'ibmty-map-tiles',
    plugins: runtimePlugins(160)
}));
workbox.routing.registerRoute(({
    request
}) => request.destination === 'image', new workbox.strategies.CacheFirst({
    cacheName: 'ibmty-images',
    plugins: runtimePlugins(150)
}));
workbox.routing.setCatchHandler(async ({
    request
}) => {
    if (request.mode === 'navigate') {
        const url = new URL(request.url);
        const relative = url.pathname.replace(/^\//, '');
        return (await workbox.precaching.matchPrecache(request.url)) || (relative && await workbox.precaching.matchPrecache(relative)) || (await workbox.precaching.matchPrecache('index.html')) || (await workbox.precaching.matchPrecache('offline.html')) || (await caches.match('offline.html')) || Response.error()
    }
    return Response.error()
});
async function updateStatus() {
    const cache = await caches.open(workbox.core.cacheNames.precache);
    const responses = await Promise.all(precacheEntries.map(entry => cache.match(workbox.precaching.getCacheKeyForURL(entry.url))));
    const completed = responses.filter(Boolean).length;
    return {
        version: APP_SW_VERSION,
        release: RELEASE_ID,
        ready: completed === precacheEntries.length && completed > 0,
        completed,
        total: precacheEntries.length,
        cache: workbox.core.cacheNames.precache
    }
}
async function announce(phase, error) {
    const status = await updateStatus();
    const clients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: !0
    });
    const message = Object.assign({
        type: 'IBM_APP_UPDATE',
        phase
    }, status);
    if (error) message.error = error.message;
    clients.forEach(client => client.postMessage(message));
    return status
}
async function prepareUpdate() {
    const cache = await caches.open(workbox.core.cacheNames.precache);
    for (const entry of precacheEntries) {
        const key = workbox.precaching.getCacheKeyForURL(entry.url);
        if (await cache.match(key)) continue;
        const response = await fetch(new URL(entry.url, self.registration.scope), {
            cache: 'reload'
        });
        if (!response.ok) throw new Error('No se pudo descargar ' + entry.url);
        await cache.put(key, response);
        await announce('downloading')
    }
    return announce('ready')
}
self.addEventListener('install', event => event.waitUntil(announce('downloading')));
self.addEventListener('activate', event => event.waitUntil((async () => {
    await self.clients.claim();
    const legacyNames = ['ibmty-app-v1', 'ibmty-cdn-v1', 'ibmty-external-images-v1', 'ibmty-map-tiles-v1', 'pages-cache', 'cdn-resources', 'cdn-resources-v2', 'fonts-cache', 'map-tiles', 'images-cache'];
    await Promise.all((await caches.keys()).filter(name => legacyNames.includes(name) || name.startsWith('ibmty-release-') || name.startsWith('ibmty-runtime-')).map(name => caches.delete(name)));
    const clients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: !0
    });
    clients.forEach(client => client.postMessage({
        type: 'IBM_APP_UPDATE',
        phase: 'activated',
        version: APP_SW_VERSION,
        release: RELEASE_ID,
        autoUpdated: !0
    }))
})()));
self.addEventListener('message', event => {
    const data = event.data;
    if (!data || !['GET_VERSION', 'GET_UPDATE_STATUS', 'PREPARE_UPDATE', 'SKIP_WAITING'].includes(data.type)) return;
    const port = event.ports && event.ports[0];
    event.waitUntil((async () => {
        let result;
        switch (data.type) {
            case 'GET_VERSION':
                result = APP_SW_VERSION;
                break;
            case 'GET_UPDATE_STATUS':
                result = await updateStatus();
                break;
            case 'PREPARE_UPDATE':
                if (!preparing) preparing = prepareUpdate().finally(() => {
                    preparing = null
                });
                result = await preparing;
                break;
            case 'SKIP_WAITING':
                if (data.release && data.release !== RELEASE_ID) throw new Error('La versión candidata cambió.');
                result = await updateStatus();
                if (!result.ready) throw new Error('La descarga de la nueva versión no está completa.');
                await self.skipWaiting()
        }
        if (port) port.postMessage(result);
    })().catch(error => {
        if (port) port.postMessage({
            error: error.message
        })
    }))
})