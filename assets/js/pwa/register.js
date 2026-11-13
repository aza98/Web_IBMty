/*
 * Registers sw.js at the site root (scope = root, updateViaCache: 'none') once the
 * page has loaded, when features.serviceWorker is on. The root is taken from the
 * page's manifest link, so it works from any folder and under a sub-path.
 * Emits `pwa:registered` with the registration for updates.js and settings.
 */
(function(IBMty) {
    'use strict';
    IBMty.register('pwa:register', {
        init(app) {
            const served = /^https?:$/.test(location.protocol);
            if (!app.config.features.serviceWorker || !('serviceWorker' in navigator) || !served || !window.isSecureContext) return;
            const scope = new URL(app.url('./')).pathname;
            const register = () => navigator.serviceWorker.getRegistration(scope).then((current) => {
                const worker = current && (current.active || current.waiting || current.installing);
                const script = worker && new URL(worker.scriptURL).pathname === new URL(app.url('sw.js')).pathname ? worker.scriptURL : app.url('sw.js');
                return navigator.serviceWorker.register(script, {
                    scope,
                    updateViaCache: 'none'
                })
            }).then((registration) => {
                app.pwa = {
                    registration
                };
                app.emit('pwa:registered', registration)
            }).catch((error) => console.warn('IBMty: service worker not registered', error));
            if (document.readyState === 'complete') register();
            else window.addEventListener('load', register, {
                once: !0
            })
        }
    })
})(self.IBMty = self.IBMty || {})