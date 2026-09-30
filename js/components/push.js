document.addEventListener('DOMContentLoaded', function() {
    const appId = typeof APP_CONFIG !== 'undefined' ? APP_CONFIG.oneSignalAppId : '';
    const PROMPT_SEEN = 'notifInstallPromptShown';
    const FAB_PREFERENCE = 'notifFab';
    const COPY = {
        granted: ['Activadas', 'Activadas', 'bell'],
        default: ['Toca para activar', 'Activar', 'bell'],
        denied: ['Bloqueadas — actívalas desde los ajustes de tu dispositivo', 'Bloqueadas', 'bell-off'],
        loading: ['Preparando…', 'Cargando…', 'loader-circle'],
        error: ['No se pudo completar. Toca para reintentar', 'Reintentar', 'rotate-cw'],
        unavailable: ['No disponible en este navegador', 'No disp.', 'bell-off']
    };
    const controls = ['notif', 'nav-notif', 'mobile-notif'].map(id => ({
        button: document.getElementById(id + '-toggle'),
        label: document.getElementById(id + '-label'),
        icon: document.getElementById(id + '-icon'),
        item: document.getElementById(id + '-item'),
        wide: id === 'notif'
    })).filter(control => control.button);
    if (!controls.length) return;
    let sdk = null;
    let resolveSdk;
    const sdkReady = new Promise(resolve => {
        resolveSdk = resolve
    });
    let subscription = null;
    let fault = null;
    let faultCause = '';
    let operation = null;
    let loadingTimer = null;
    let initCalled = !1;
    let promptAnswered = !1;
    window.__notifPromptPending = standalone() && !!appId && supported() && permission() === 'default' && storage(PROMPT_SEEN) !== 'true';

    function permission() {
        return window.Notification ? Notification.permission : 'unsupported'
    }

    function supported() {
        return !!(window.Notification && navigator.serviceWorker && window.PushManager)
    }

    function standalone() {
        return typeof window.isStandaloneMode === 'function' ? window.isStandaloneMode() : matchMedia('(display-mode: standalone)').matches || navigator.standalone === !0
    }

    function storage(key, value) {
        try {
            if (arguments.length === 1) return localStorage.getItem(key);
            localStorage.setItem(key, value)
        } catch (error) {
            return null
        }
        return value
    }

    function subscribed() {
        const current = (sdk && sdk.User.PushSubscription) || subscription;
        return permission() === 'granted' && !!current && current.optedIn === !0
    }

    function state() {
        if (!supported()) return 'unavailable';
        if (permission() === 'denied') return 'denied';
        if (fault) return fault;
        if (permission() !== 'granted') return 'default';
        if (!sdk) return 'loading';
        return subscribed() ? 'granted' : 'default'
    }

    function fail(kind, error) {
        fault = kind;
        faultCause = error ? String(error.message || error) : '';
        if (operation) operation.expired = !0;
        resolveSdk(null);
        if (error) console.warn('No se pudieron preparar o actualizar las notificaciones.', error);
        sync()
    }

    function element(tag, className, text) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (text) node.textContent = text;
        return node
    }

    function remove(id) {
        const node = document.getElementById(id);
        if (node) node.remove();
    }

    function finishInstallPrompt() {
        if (window.__notifPromptPending !== !0) return;
        remove('notification-install-prompt');
        window.__notifPromptPending = !1;
        window.dispatchEvent(new Event('notifpromptdone'))
    }

    function positionFloatingUI() {
        const whatsapp = document.getElementById('whatsapp-fab');
        const visible = String(!!whatsapp && getComputedStyle(whatsapp).display !== 'none');
        ['notification-fab', 'notification-denied-prompt', 'notification-install-prompt'].forEach(id => {
            const node = document.getElementById(id);
            if (node) node.dataset.whatsappVisible = visible
        })
    }

    function placeFloating(node) {
        const whatsapp = document.getElementById('whatsapp-fab');
        if (whatsapp) whatsapp.after(node);
        else document.body.appendChild(node);
        positionFloatingUI()
    }

    function showPrompt(id, iconName, title, message, actions) {
        if (document.getElementById(id)) return;
        const panel = element('section', 'notification-permission-prompt');
        panel.id = id;
        panel.setAttribute('role', 'region');
        panel.setAttribute('aria-labelledby', id + '-title');
        panel.setAttribute('aria-live', 'polite');
        const heading = element('div', 'notification-permission-prompt-heading');
        const icon = element('span', 'notification-permission-prompt-icon');
        if (typeof makeIcon === 'function') icon.appendChild(makeIcon(iconName));
        const headingText = element('h2', 'notification-permission-prompt-title', title);
        headingText.id = id + '-title';
        heading.append(icon, headingText);
        const buttons = element('div', 'notification-permission-prompt-actions');
        actions.forEach(([label, primary, action, buttonId]) => {
            const button = element('button', 'btn btn-app btn-app--compact ' + (primary ? 'btn-app--primary' : 'btn-app--secondary'), label);
            button.type = 'button';
            if (buttonId) button.id = buttonId;
            button.addEventListener('click', action);
            buttons.appendChild(button)
        });
        panel.append(heading, element('p', 'notification-permission-prompt-copy', message), buttons);
        placeFloating(panel)
    }

    function showDeniedHelp() {
        if (permission() !== 'denied') return sync();
        const ua = navigator.userAgent || '';
        const instructions = /iPhone|iPad|iPod/i.test(ua) ? 'Abre Ajustes > Notificaciones > IBMty y activa “Permitir notificaciones”.' : /Android/i.test(ua) ? 'Abre Chrome > Configuración > Configuración de sitios > Notificaciones, busca www.ibmty.com y selecciona Permitir.' : 'Abre los ajustes del navegador, busca www.ibmty.com en Notificaciones y selecciona Permitir.';
        showPrompt('notification-denied-prompt', 'bell-off', 'Notificaciones bloqueadas', 'No podemos volver a mostrar la solicitud desde aquí. ' + instructions, [
            ['Ocultar botón', !1, () => {
                storage(FAB_PREFERENCE, 'off');
                remove('notification-denied-prompt');
                sync()
            }],
            ['Entendido', !0, () => remove('notification-denied-prompt')]
        ])
    }

    function createFabPreferenceToggle() {
        const mainToggle = document.getElementById('notif-toggle');
        if (!mainToggle || !mainToggle.parentNode) return null;
        const button = element('button', 'settings-row settings-row--bordered');
        button.id = 'notif-fab-toggle';
        button.type = 'button';
        button.setAttribute('role', 'switch');
        button.setAttribute('aria-label', 'Botón de notificaciones flotante');
        button.setAttribute('aria-describedby', 'notif-fab-label');
        const left = element('span', 'settings-row-left');
        const icon = element('span', 'settings-row-icon');
        if (typeof makeIcon === 'function') icon.appendChild(makeIcon('bell-off'));
        const copy = element('span', 'settings-row-info');
        const label = element('span', 'settings-row-desc');
        label.id = 'notif-fab-label';
        label.setAttribute('aria-live', 'polite');
        copy.append(element('span', 'settings-row-title', 'Botón de notificaciones'), label);
        left.append(icon, copy);
        const track = element('span', 'sw-track notif-fab-sw');
        track.setAttribute('aria-hidden', 'true');
        track.appendChild(element('span', 'sw-thumb'));
        button.append(left, track);
        button.addEventListener('click', () => {
            storage(FAB_PREFERENCE, storage(FAB_PREFERENCE) === 'off' ? 'on' : 'off');
            sync()
        });
        mainToggle.parentNode.appendChild(button);
        return button
    }

    function renderDeniedUI() {
        const denied = supported() && permission() === 'denied';
        const showFab = denied && storage(FAB_PREFERENCE) !== 'off';
        let fab = document.getElementById('notification-fab');
        if (showFab && !fab) {
            fab = element('button', 'ctrl-app ctrl-app--float ctrl-app--fab');
            fab.id = 'notification-fab';
            fab.type = 'button';
            fab.setAttribute('aria-label', 'Ver cómo activar las notificaciones');
            if (typeof makeIcon === 'function') fab.appendChild(makeIcon('bell-off'));
            fab.addEventListener('click', showDeniedHelp);
            placeFloating(fab)
        }
        if (!showFab && fab) fab.remove();
        if (!denied) remove('notification-denied-prompt');
        const toggle = document.getElementById('notif-fab-toggle') || (denied && createFabPreferenceToggle());
        if (toggle) {
            toggle.hidden = !denied;
            toggle.dataset.fab = showFab ? 'on' : 'off';
            toggle.setAttribute('aria-checked', String(showFab));
            document.getElementById('notif-fab-label').textContent = showFab ? 'Visible' : 'Oculto'
        }
        positionFloatingUI()
    }

    function renderInstallPrompt(next) {
        if (!window.__notifPromptPending) return;
        if (next === 'unavailable' || permission() !== 'default' || promptAnswered || !standalone() || storage(PROMPT_SEEN) === 'true') {
            if (!operation || operation.expired) finishInstallPrompt();
            return
        }
        if (operation && !operation.expired) return;
        showPrompt('notification-install-prompt', 'bell', 'Recibe avisos de IBMty', 'Actívalas para recibir noticias y cambios de horario.', [
            ['Ahora no', !1, () => {
                promptAnswered = !0;
                storage(PROMPT_SEEN, 'true');
                finishInstallPrompt()
            }],
            ['Activar', !0, () => {
                if (fault === 'error') return toggleNotifications();
                if (operation || fault) return;
                promptAnswered = !0;
                storage(PROMPT_SEEN, 'true');
                remove('notification-install-prompt');
                toggleNotifications()
            }, 'notification-install-activate']
        ]);
        const button = document.getElementById('notification-install-activate');
        button.disabled = next === 'loading' || next === 'unavailable';
        button.setAttribute('aria-busy', String(next === 'loading'));
        button.textContent = next === 'loading' ? 'Preparando…' : COPY[next][1]
    }

    function sync() {
        let next = state();
        if (operation && !operation.expired && !['denied', 'unavailable', 'error'].includes(next)) {
            if (operation.enable ? next !== 'granted' : next !== 'default') next = 'loading'
        }
        const waiting = next === 'loading' || (!sdk && next === 'default');
        if (waiting && loadingTimer === null) {
            loadingTimer = setTimeout(() => fail('error', new Error('La preparación tardó demasiado. Revisa tu conexión y vuelve a intentarlo.')), 10000)
        } else if (!waiting) {
            clearTimeout(loadingTimer);
            loadingTimer = null
        }
        const checked = next === 'loading' && operation && (!operation.enable || permission() === 'granted') ? operation.enable : subscribed();
        const copy = next === 'loading' && operation ? [operation.enable ? 'Activando…' : 'Desactivando…', operation.enable ? 'Activando…' : 'Desactivando…', 'loader-circle'] : COPY[next];
        controls.forEach(({
            button,
            label,
            icon,
            item,
            wide
        }) => {
            button.dataset.notif = next;
            button.disabled = next === 'loading' || next === 'unavailable';
            if (next === 'error' && faultCause) button.setAttribute('title', 'Causa: ' + faultCause);
            else button.removeAttribute('title');
            button.setAttribute(button.getAttribute('role') === 'switch' ? 'aria-checked' : 'aria-pressed', String(checked));
            button.setAttribute('aria-busy', String(next === 'loading'));
            if (label) label.textContent = copy[wide ? 0 : 1];
            if (icon && typeof setIcon === 'function') setIcon(icon, copy[2]);
            if (item) item.style.display = next === 'unavailable' ? 'none' : ''
        });
        renderDeniedUI();
        if (permission() !== 'default') remove('notification-install-prompt');
        renderInstallPrompt(next)
    }
    async function changeSubscription(current) {
        try {
            subscription = null;
            if (current.enable && permission() === 'default') await Notification.requestPermission();
            if (permission() === 'granted') {
                sync();
                const ready = sdk || await sdkReady;
                if (!ready || current.expired || fault) return;
                await ready.User.PushSubscription[current.enable ? 'optIn' : 'optOut']()
            }
            if (!current.expired) {
                fault = null;
                faultCause = ''
            }
        } catch (error) {
            fail('error', error)
        } finally {
            operation = null;
            sync()
        }
    }

    function toggleNotifications() {
        if (permission() === 'denied') return showDeniedHelp();
        if (operation) {
            if (operation.expired) location.reload();
            return
        }
        if (!sdk && fault === 'error') return startSdk();
        if ((!sdk && permission() !== 'default') || fault === 'unavailable') return;
        fault = null;
        faultCause = '';
        operation = {
            enable: !subscribed(),
            expired: !1
        };
        sync();
        changeSubscription(operation)
    }

    function startSdk() {
        if (sdk) return;
        if (initCalled) return location.reload();
        initCalled = !0;
        fault = null;
        faultCause = '';
        window.OneSignalDeferred = window.OneSignalDeferred || [];
        window.OneSignalDeferred.push(async OneSignal => {
            try {
                if (typeof OneSignal.Notifications.isPushSupported === 'function' && !OneSignal.Notifications.isPushSupported()) return fail('unavailable');
                OneSignal.User.PushSubscription.addEventListener('change', event => {
                    subscription = event.current;
                    if (sdk && subscribed()) {
                        fault = null;
                        faultCause = ''
                    }
                    sync()
                });
                OneSignal.Notifications.addEventListener('permissionChange', sync);
                const scope = new URL('./', location.href);
                await OneSignal.init({
                    appId,
                    path: scope.pathname,
                    serviceWorkerPath: 'sw.js',
                    serviceWorkerParam: {
                        scope: scope.pathname
                    },
                    promptOptions: {
                        slidedown: {
                            prompts: [{
                                type: 'push',
                                autoPrompt: !1
                            }]
                        }
                    }
                });
                const registration = await navigator.serviceWorker.getRegistration(scope.href);
                const worker = registration && (registration.installing || registration.waiting || registration.active);
                if (worker && registration.scope === scope.href && new URL(worker.scriptURL).pathname === new URL('sw.js', scope).pathname && registration.updateViaCache !== 'none') {
                    await navigator.serviceWorker.register(worker.scriptURL, {
                        scope: scope.href,
                        updateViaCache: 'none'
                    })
                }
                sdk = OneSignal;
                resolveSdk(sdk);
                fault = null;
                faultCause = '';
                sync()
            } catch (error) {
                fail('error', error)
            }
        });
        sync()
    }
    controls.forEach(({
        button,
        label
    }) => {
        button.addEventListener('click', toggleNotifications);
        if (label) label.setAttribute('aria-live', 'polite');
    });
    if (!supported()) fail('unavailable');
    else if (!appId) fail('error', new Error('Falta la configuración de notificaciones. Recarga la página o contacta a IBMty.'));
    else startSdk();
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') sync()
    });
    window.addEventListener('pageshow', sync);
    window.addEventListener('focus', sync);
    if (navigator.serviceWorker) navigator.serviceWorker.addEventListener('controllerchange', sync);
    const whatsapp = document.getElementById('whatsapp-fab');
    if (whatsapp && window.MutationObserver) new MutationObserver(positionFloatingUI).observe(whatsapp, {
        attributes: !0,
        attributeFilter: ['style', 'class', 'hidden']
    })
})