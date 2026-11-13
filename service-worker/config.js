/*
 * Worker-wide settings. Runtime caches that hold project files carry the release
 * in their name, so a new release starts clean; vendor paths are versioned and
 * images and map tiles expire on their own.
 */
(function(SW) {
    'use strict';
    const version = self.IBMTY_RELEASE.version;
    SW.config = Object.freeze({
        version,
        offlineUrl: 'app/offline.html',
        caches: Object.freeze({
            pages: `ibmty-pages-${version}`,
            assets: `ibmty-assets-${version}`,
            vendor: 'ibmty-vendor',
            images: 'ibmty-images',
            tiles: 'ibmty-map-tiles'
        }),
        limits: Object.freeze({
            images: {
                maxEntries: 120,
                maxAgeSeconds: 30 * 24 * 60 * 60
            },
            tiles: {
                maxEntries: 200,
                maxAgeSeconds: 7 * 24 * 60 * 60
            }
        })
    })
})