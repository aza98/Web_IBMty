/*
 * Offline page. The service worker sends here with ?from=<page the reader asked for>:
 * "Reintentar" goes back to that page, the connection coming back announces availability without navigating away.
 */
(function(IBMty) {
    'use strict';

    function requestedPage() {
        const value = new URLSearchParams(location.search).get('from');
        if (!value) return null;
        try {
            const from = new URL(value, location.href);
            return from.origin === location.origin ? from.href : null
        } catch {
            return null
        }
    }
    IBMty.register('page:offline', {
        init() {
            const retry = document.querySelector('[data-retry]');
            const target = requestedPage();
            if (target) retry.href = target;
            window.addEventListener('online', () => {
                IBMty.notices.show({
                    id: 'reconnected',
                    text: 'La conexión volvió. Pulsa Reintentar cuando quieras continuar.',
                    dismissLabel: 'Cerrar'
                })
            })
        }
    })
})(self.IBMty = self.IBMty || {})