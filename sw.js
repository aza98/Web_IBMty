/*
 * Service worker entry. It must live at the site root so its scope (./)
 * covers every page. Keep it thin: logic lives in service-worker/*.js.
 * Workbox and the app files are local; only the optional OneSignal worker SDK
 * (service-worker/push.js) comes from a CDN.
 */
importScripts('assets/js/core/version.js', 'assets/js/core/config.js');
importScripts('vendor/workbox/7.4.1/workbox-sw.js');

// Workbox enables debug on localhost and would then request *.dev.js builds,
// which are not vendored. Always use the local production modules.
workbox.setConfig({
    modulePathPrefix: 'vendor/workbox/7.4.1/',
    debug: false
});

// Workbox modules load on first use, which must happen during this first evaluation:
// every module below touches them at top level, never inside an event handler.
importScripts(
    'service-worker/config.js',
    'service-worker/precache-manifest.js',
    'service-worker/precache.js',
    'service-worker/routes.js',
    'service-worker/messages.js',
    'service-worker/push.js'
);