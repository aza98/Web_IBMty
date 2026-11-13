/*
 * Runtime caching, registered after the precache route (precached files never reach these):
 *
 *   Request                         Strategy                     Cache
 *   ------------------------------  ---------------------------  -----------------------
 *   Page navigations                NetworkFirst (4 s timeout)   pages; offline or 5xx -> cached copy,
 *                                                                else app/offline.html?from=<url>
 *   Same-origin CSS and JS          StaleWhileRevalidate         assets
 *   vendor/<name>/<version>/        CacheFirst                   vendor (immutable paths)
 *   Same-origin images              CacheFirst + expiry          images
 *   tile.openstreetmap.org          CacheFirst + expiry          map tiles (only tiles already viewed;
 *                                                                the OSM policy forbids bulk prefetch)
 *   Everything else (YouTube, GA4,  network only (no route)      —
 *   Formspree, OneSignal, Maps)
 */
(function(SW, workbox) {
    'use strict';
    const {
        registerRoute
    } = workbox.routing;
    const {
        NetworkFirst,
        StaleWhileRevalidate,
        CacheFirst
    } = workbox.strategies;
    const {
        ExpirationPlugin
    } = workbox.expiration;
    const {
        CacheableResponsePlugin
    } = workbox.cacheableResponse;
    const {
        caches: names,
        limits,
        offlineUrl
    } = SW.config;
    const ok = new CacheableResponsePlugin({
        statuses: [200]
    });
    const sameOrigin = (url) => url.origin === self.location.origin;
    const offlinePage = (request) => {
        const target = new URL(offlineUrl, self.registration.scope);
        target.searchParams.set('from', request.url);
        return Response.redirect(target.href, 302)
    };
    workbox.navigationPreload.enable();
    registerRoute(({
        request
    }) => request.mode === 'navigate', new NetworkFirst({
        cacheName: names.pages,
        networkTimeoutSeconds: 4,
        plugins: [ok, {
            handlerDidError: async ({
                request
            }) => offlinePage(request),
            handlerWillRespond: async ({
                request,
                response
            }) => response.status < 500 ? response : (await caches.match(request, {
                cacheName: names.pages
            })) || offlinePage(request)
        }]
    }));
    registerRoute(({
        url
    }) => sameOrigin(url) && url.pathname.includes('/vendor/'), new CacheFirst({
        cacheName: names.vendor,
        plugins: [ok]
    }));
    registerRoute(({
        url,
        request
    }) => sameOrigin(url) && (request.destination === 'style' || request.destination === 'script'), new StaleWhileRevalidate({
        cacheName: names.assets,
        plugins: [ok]
    }));
    registerRoute(({
        url,
        request
    }) => sameOrigin(url) && request.destination === 'image', new CacheFirst({
        cacheName: names.images,
        plugins: [ok, new ExpirationPlugin({
            ...limits.images,
            purgeOnQuotaError: !0
        })]
    }));
    registerRoute(({
        url
    }) => url.hostname === 'tile.openstreetmap.org', new CacheFirst({
        cacheName: names.tiles,
        plugins: [ok, new ExpirationPlugin({
            ...limits.tiles,
            purgeOnQuotaError: !0
        })]
    }));
    self.addEventListener('activate', (event) => {
        const current = new Set(Object.values(names));
        event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith('ibmty-') && !current.has(key)).map((key) => caches.delete(key)))))
    })
})(self.IBMtySW, self.workbox)