/*
 * Reflects the connection on <html data-network="online|offline"> and shows a
 * notice while offline (saved pages keep working; forms and video need a connection).
 */
(function(IBMty) {
    'use strict';
    IBMty.register('pwa:connectivity', {
        init(app) {
            const update = () => {
                const online = navigator.onLine;
                document.documentElement.dataset.network = online ? 'online' : 'offline';
                if (!app.notices) return;
                if (online) app.notices.hide('offline');
                else app.notices.show({
                    id: 'offline',
                    text: 'Sin conexión. Estás viendo el contenido guardado en este dispositivo.'
                })
            };
            window.addEventListener('online', update);
            window.addEventListener('offline', update);
            update()
        }
    })
})(self.IBMty = self.IBMty || {})