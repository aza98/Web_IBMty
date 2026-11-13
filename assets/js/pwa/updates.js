/*
 * Client side of the update protocol (service-worker/messages.js). When a new
 * worker finishes installing while this page is controlled by an older one, a
 * notice offers "Actualizar"; accepting sends SKIP_WAITING and the page reloads
 * once the new worker takes control. The first install never reloads anything.
 * Updates are also checked when the app comes back to the foreground.
 */
(function(IBMty) {
    'use strict';
    IBMty.register('pwa:updates', {
        init(app) {
            if (!('serviceWorker' in navigator)) return;
            let accepted = !1;
            const editedForm = () => [...document.querySelectorAll('form[data-form]')].some((form) => form.getAttribute('aria-busy') === 'true' || [...form.elements].some((field) => !field.disabled && field.type !== 'hidden' && ('defaultValue' in field || 'defaultChecked' in field) && (field.type === 'checkbox' || field.type === 'radio' ? field.checked !== field.defaultChecked : field.value !== field.defaultValue)));
            const defer = () => app.notices.show({
                id: 'update',
                text: 'Termina o vacía el formulario antes de actualizar. Después, busca actualizaciones en Ajustes.',
                dismissLabel: 'Cerrar'
            });
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (accepted) {
                    if (editedForm()) {
                        app.notices.show({
                            id: 'update',
                            text: 'La actualización está instalada. Termina el formulario y vuelve a abrir la página.',
                            dismissLabel: 'Cerrar'
                        })
                    } else location.reload()
                }
            });
            const version = (worker) => new Promise((resolve) => {
                const channel = new MessageChannel();
                const finish = (data) => {
                    clearTimeout(timer);
                    channel.port1.close();
                    resolve(data)
                };
                const timer = setTimeout(() => finish(null), 3000);
                channel.port1.onmessage = ({
                    data
                }) => finish(data);
                try {
                    worker.postMessage({
                        type: 'GET_VERSION'
                    }, [channel.port2])
                } catch {
                    finish(null)
                }
            });
            const offer = async (worker) => {
                const active = navigator.serviceWorker.controller;
                if (!active || worker.state !== 'installed') return;
                if (worker.scriptURL !== active.scriptURL) {
                    const [current, next] = await Promise.all([version(active), version(worker)]);
                    if (typeof current === 'string' || (current && next && current.type === 'VERSION' && next.type === 'VERSION' && typeof current.version === 'string' && current.version === next.version)) {
                        if (worker.state === 'installed') worker.postMessage({
                            type: 'SKIP_WAITING'
                        });
                        return
                    }
                }
                if (worker.state !== 'installed') return;
                app.notices.show({
                    id: 'update',
                    text: 'Hay una nueva versión de la app. Al actualizar, esta página se recargará.',
                    action: {
                        label: 'Actualizar',
                        onClick: () => {
                            if (editedForm()) {
                                defer();
                                return
                            }
                            accepted = !0;
                            worker.postMessage({
                                type: 'SKIP_WAITING'
                            })
                        }
                    },
                    dismissLabel: 'Más tarde'
                });
                app.emit('pwa:update-ready', worker)
            };
            app.on('pwa:registered', ({
                detail: registration
            }) => {
                const hasController = () => Boolean(navigator.serviceWorker.controller);
                if (registration.waiting && hasController()) offer(registration.waiting);
                app.on('pwa:update-check', () => {
                    if (registration.waiting && hasController()) offer(registration.waiting);
                });
                registration.addEventListener('updatefound', () => {
                    const worker = registration.installing;
                    worker.addEventListener('statechange', () => {
                        if (worker.state === 'installed' && hasController()) offer(worker);
                    })
                });
                document.addEventListener('visibilitychange', () => {
                    if (document.visibilityState === 'visible' && navigator.onLine) registration.update().catch(() => {})
                })
            })
        }
    })
})(self.IBMty = self.IBMty || {})