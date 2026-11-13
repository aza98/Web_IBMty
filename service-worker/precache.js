/*
 * App shell: every file in the precache manifest is installed with the worker
 * and served cache-first; a changed revision refetches only that file.
 * Query parameters the app adds itself (?source=pwa on launch, ?from= on the
 * offline page) are ignored so those URLs still match their precached file.
 */
(function(SW, workbox) {
    'use strict';
    const entries = Object.entries(SW.precacheManifest.files).map(([url, revision]) => ({
        url,
        revision
    }));
    workbox.precaching.cleanupOutdatedCaches();
    workbox.precaching.precacheAndRoute(entries, {
        ignoreURLParametersMatching: [/^utm_/, /^fbclid$/, /^source$/, /^from$/]
    })
})(self.IBMtySW, self.workbox)