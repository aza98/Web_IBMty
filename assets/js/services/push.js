/*
 * OneSignal Web SDK v16, loaded on demand. Permission alone is not a subscription.
 * state(), enable() and disable() publish push-change and resolve to the shared state:
 * on, off, denied, install-required, unsupported, unavailable or error.
 * enabling/disabling lock every control while a choice is being processed.
 * OneSignal shares sw.js with the PWA; paths are relative to the deployment root.
 */
(function(IBMty) {
    'use strict';
    const SDK = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
    const TIMEOUT = 8000;
    const MESSAGES = Object.freeze({
        unsupported: 'Este navegador no admite notificaciones. Prueba con un navegador compatible y actualizado.',
        'install-required': 'En iPhone o iPad, agrega IBMty a la pantalla de inicio y ábrela desde su icono para activar los avisos. Requiere iOS 16.4 o posterior.',
        unavailable: 'Los avisos de la iglesia todavía no están disponibles.',
        denied: 'Las notificaciones están bloqueadas. Revisa el permiso de este sitio en el navegador o de IBMty en los ajustes del dispositivo.',
        error: 'No se pudo confirmar el estado de los avisos. Revisa tu conexión y vuelve a comprobar. Si continúa, recarga la página.',
        enabling: 'Activando…',
        disabling: 'Desactivando…',
        off: 'Recibe aquí los avisos que publique la iglesia. Actívalos en cada navegador o app instalada que uses.',
        on: 'Los avisos de la iglesia están activados en este navegador o app instalada.'
    });
    const supported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    const installed = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === !0;
    const ios = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    function bounded(promise) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error('Push request timed out')), TIMEOUT);
            Promise.resolve(promise).then(resolve, reject).finally(() => clearTimeout(timer))
        })
    }
    IBMty.register('service:push', {
        init(app) {
            const appId = app.config.services.oneSignalAppId;
            const configured = app.config.features.push && appId;
            let download = null;
            let initialization = null;
            let client = null;
            let operation = null;
            let mutation = null;
            let observed = !1;
            let revision = 0;
            let current = 'unavailable';
            const publish = (next) => {
                current = next;
                app.emit('push-change', next);
                return next
            };
            const blocked = () => {
                if (!configured) return 'unavailable';
                if (ios() && !installed()) return 'install-required';
                if (!supported() || !app.config.features.serviceWorker || !window.isSecureContext) return 'unsupported';
                return Notification.permission === 'denied' ? 'denied' : null
            };

            function load() {
                if (download) return download;
                window.OneSignalDeferred = window.OneSignalDeferred || [];
                download = new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    const fail = () => {
                        clearTimeout(timer);
                        script.onload = script.onerror = null;
                        script.remove();
                        download = null;
                        reject(new Error('OneSignal SDK unavailable'))
                    };
                    const timer = setTimeout(fail, TIMEOUT);
                    script.defer = !0;
                    script.src = SDK;
                    script.onerror = fail;
                    script.onload = () => {
                        clearTimeout(timer);
                        window.OneSignalDeferred.push(resolve)
                    };
                    document.head.append(script)
                });
                return download
            }
            async function sdk() {
                const OneSignal = await bounded(load());
                if (!initialization) {
                    initialization = Promise.resolve().then(() => OneSignal.init({
                        appId,
                        serviceWorkerPath: new URL(app.url('sw.js')).pathname.slice(1),
                        serviceWorkerParam: {
                            scope: new URL(app.url('./')).pathname
                        },
                        notifyButton: {
                            enable: !1
                        },
                        promptOptions: {
                            slidedown: {
                                prompts: [{
                                    type: 'push',
                                    autoPrompt: !1
                                }]
                            }
                        }
                    })).then(() => {
                        client = OneSignal;
                        OneSignal.Notifications.addEventListener('permissionChange', refresh);
                        OneSignal.User.PushSubscription.addEventListener('change', refresh);
                        refresh();
                        return OneSignal
                    })
                }
                return bounded(initialization)
            }

            function snapshot(OneSignal) {
                const stop = blocked();
                if (stop) return stop;
                if (!OneSignal.Notifications.isPushSupported()) return 'unsupported';
                if (!OneSignal.Notifications.permission) return 'off';
                const subscription = OneSignal.User.PushSubscription;
                if (!subscription.optedIn) return 'off';
                return subscription.id && subscription.token ? 'on' : 'error'
            }
            async function read() {
                const stop = blocked();
                if (stop) return stop;
                if (Notification.permission === 'default') return 'off';
                return snapshot(client || await sdk())
            }
            async function state() {
                observed = !0;
                if (operation) return operation;
                if (mutation) return publish('error');
                const request = ++revision;
                let next;
                try {
                    next = await read()
                } catch {
                    next = blocked() || 'error'
                }
                return request === revision ? publish(next) : current
            }

            function refresh() {
                if (observed && !operation) state();
            }

            function change(enabled) {
                observed = !0;
                if (operation) return operation;
                if (mutation) return Promise.resolve(publish('error'));
                const stop = blocked();
                if (stop) return Promise.resolve(publish(stop));
                ++revision;
                publish(enabled ? 'enabling' : 'disabling');
                const action = (async () => {
                    if (enabled && Notification.permission === 'default') await Notification.requestPermission();
                    if (Notification.permission !== 'granted') return blocked() || 'off';
                    const OneSignal = await sdk();
                    if (!OneSignal.Notifications.isPushSupported()) return 'unsupported';
                    mutation = Promise.resolve(enabled ? OneSignal.User.PushSubscription.optIn() : OneSignal.User.PushSubscription.optOut());
                    const settle = () => {
                        mutation = null;
                        refresh()
                    };
                    mutation.then(settle, settle);
                    await bounded(mutation);
                    return snapshot(OneSignal)
                })();
                operation = action.then((next) => {
                    operation = null;
                    return publish(next)
                }, () => {
                    operation = null;
                    return publish(blocked() || 'error')
                });
                return operation
            }
            window.addEventListener('focus', refresh);
            window.addEventListener('pageshow', refresh);
            window.addEventListener('online', refresh);
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') refresh();
            });
            if (configured && navigator.permissions) {
                navigator.permissions.query({
                    name: 'notifications'
                }).then((permission) => {
                    permission.addEventListener('change', refresh)
                }).catch(() => {})
            }
            IBMty.push = {
                messages: MESSAGES,
                state,
                enable: () => change(!0),
                disable: () => change(!1)
            }
        }
    })
})(self.IBMty = self.IBMty || {})