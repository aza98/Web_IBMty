/*
 * Ajustes: the floating WhatsApp button switch (components/whatsapp.js), analytics consent (components/consent.js),
 * app version, connection, offline readiness, display mode and a
 * manual update check. The update itself is offered by pwa/updates.js through its notice.
 * Appearance, language and notifications are mounted by components/settings-panel.js.
 */
(function(IBMty) {
    'use strict';
    IBMty.register('page:settings', {
        init(app) {
            const $ = (selector) => document.querySelector(selector);
            const standalone = document.documentElement.dataset.display === 'standalone';
            const install = $('[data-page-install]');
            const syncInstall = () => {
                install.hidden = !app.install?.available || standalone
            };
            install.addEventListener('click', () => app.install.prompt());
            app.on('install-change', syncInstall);
            syncInstall();
            const status = $('[data-update-status]');
            const button = $('[data-check-update]');
            $('[data-release]').textContent = app.config.release.version;
            $('[data-display-label]').textContent = standalone ? 'App instalada' : 'Navegador';
            const network = () => {
                $('[data-network-label]').textContent = navigator.onLine ? 'En línea' : 'Sin conexión'
            };
            window.addEventListener('online', network);
            window.addEventListener('offline', network);
            network();
            const offline = $('[data-offline-label]');
            if (!app.config.features.serviceWorker || !('serviceWorker' in navigator)) offline.textContent = 'No disponible';
            else {
                offline.textContent = 'Preparando…';
                navigator.serviceWorker.ready.then(() => {
                    offline.textContent = 'Listo'
                })
            }
            const whatsappGroup = $('[data-whatsapp]');
            if (whatsappGroup && IBMty.whatsapp && IBMty.whatsapp.available() && standalone) {
                const toggle = $('[data-whatsapp-toggle]');
                toggle.checked = IBMty.whatsapp.visible();
                toggle.addEventListener('change', () => IBMty.whatsapp.set(toggle.checked));
                whatsappGroup.hidden = !1
            }
            const analyticsGroup = $('[data-analytics]');
            if (analyticsGroup && app.consent && app.analytics?.enabled) {
                const toggle = $('[data-analytics-toggle]');
                const render = () => {
                    toggle.checked = app.storage.get(app.storage.KEYS.consent) === 'granted'
                };
                analyticsGroup.hidden = !1;
                render();
                toggle.addEventListener('change', () => app.consent.set(toggle.checked ? 'granted' : 'denied'));
                app.on('consent-change', render)
            }
            app.on('pwa:update-ready', () => {
                status.textContent = 'Hay una nueva versión lista para instalar.'
            });
            button.addEventListener('click', async () => {
                const registration = app.pwa && app.pwa.registration;
                if (!registration) {
                    status.textContent = 'Las actualizaciones automáticas no están disponibles en este navegador.';
                    return
                }
                if (!navigator.onLine) {
                    status.textContent = 'Necesitas conexión para buscar actualizaciones.';
                    return
                }
                button.disabled = !0;
                status.textContent = 'Buscando…';
                try {
                    await registration.update();
                    status.textContent = registration.waiting ? 'Hay una nueva versión lista para instalar.' : registration.installing ? 'Descargando la actualización…' : 'No se encontró una actualización disponible.';
                    app.emit('pwa:update-check')
                } catch {
                    status.textContent = 'No se pudo comprobar. Inténtalo de nuevo más tarde.'
                } finally {
                    button.disabled = !1
                }
            })
        }
    })
})(self.IBMty = self.IBMty || {})