document.addEventListener('DOMContentLoaded', function() {
    const appId = typeof APP_CONFIG !== 'undefined' ? APP_CONFIG.oneSignalAppId : '';
    const PROMPT_SEEN = 'notifInstallPromptShown';
    const COPY = {
        granted: ['Activadas', 'Activadas', 'bell'],
        default: ['Toca para activar', 'Activar', 'bell'],
        denied: ['Bloqueadas — actívalas desde los ajustes de tu dispositivo', 'Bloqueadas', 'bell-off'],
        loading: ['Procesando…', 'Procesando…', 'loader-circle'],
        unavailable: ['No disponible en este navegador', 'No disp.', 'bell-off']
    };
    const controls = ['notif', 'nav-notif', 'mobile-notif'].map(id => ({
        button: document.getElementById(id + '-toggle'),
        label: document.getElementById(id + '-label'),
        icon: document.getElementById(id + '-icon'),
        item: document.getElementById(id + '-item'),
        wide: id === 'notif'
    })).filter(control => control.button);
    const supported = !!(appId && window.Notification && navigator.serviceWorker && window.PushManager);
    let sdk = null;
    let busy = !1;

    // Sin SDK todavía se asume el permiso concedido como suscrito; el SDK corrige el estado al cargar.
    function subscribed() {
        if (!supported || Notification.permission !== 'granted') return !1;
        return sdk ? sdk.User.PushSubscription.optedIn === !0 : !0
    }

    function state() {
        if (!supported) return 'unavailable';
        if (busy) return 'loading';
        if (Notification.permission === 'denied') return 'denied';
        return subscribed() ? 'granted' : 'default'
    }

    function render() {
        const next = state();
        const copy = COPY[next];
        controls.forEach(({ button, label, icon, item, wide }) => {
            button.dataset.notif = next;
            button.disabled = next === 'loading' || next === 'unavailable';
            button.setAttribute(button.getAttribute('role') === 'switch' ? 'aria-checked' : 'aria-pressed', String(subscribed()));
            button.setAttribute('aria-busy', String(next === 'loading'));
            if (label) label.textContent = copy[wide ? 0 : 1];
            if (icon) setIcon(icon, copy[2]);
            if (item) item.hidden = next === 'unavailable'
        })
    }

    function notify(message) {
        makeToast(message, { id: 'notif-toast', autoDismissMs: 6000 })
    }

    function deniedHelp() {
        const ua = navigator.userAgent || '';
        if (/iPhone|iPad|iPod/i.test(ua)) return 'Abre Ajustes > Notificaciones > IBMty y activa “Permitir notificaciones”.';
        if (/Android/i.test(ua)) return 'Abre Chrome > Configuración > Configuración de sitios > Notificaciones, busca www.ibmty.com y selecciona Permitir.';
        return 'Abre los ajustes del navegador, busca www.ibmty.com en Notificaciones y selecciona Permitir.'
    }

    async function toggle() {
        if (busy || !supported) return;
        if (Notification.permission === 'denied') return notify('Notificaciones bloqueadas. ' + deniedHelp());
        if (!sdk) return notify('Las notificaciones aún se están preparando. Intenta de nuevo en unos segundos.');
        const enable = !subscribed();
        busy = !0;
        render();
        try {
            if (enable && Notification.permission === 'default') await Notification.requestPermission();
            if (Notification.permission === 'granted') await sdk.User.PushSubscription[enable ? 'optIn' : 'optOut']()
        } catch (error) {
            console.warn('No se pudieron actualizar las notificaciones.', error);
            notify('No se pudo completar. Revisa tu conexión e intenta de nuevo.')
        }
        busy = !1;
        render()
    }

    function offerOnce() {
        if (!isStandaloneMode() || Notification.permission !== 'default') return;
        try {
            if (localStorage.getItem(PROMPT_SEEN) === 'true') return;
            localStorage.setItem(PROMPT_SEEN, 'true')
        } catch (error) {
            return
        }
        const card = document.createElement('section');
        card.id = 'notification-install-prompt';
        card.className = 'popup-card popup-card--compact popup-card--plain';
        card.setAttribute('aria-labelledby', 'notification-install-title');
        card.innerHTML = '<div class="popup-card__header"><span class="popup-card__symbol" aria-hidden="true"></span><h2 class="popup-card__title" id="notification-install-title">Recibe avisos de IBMty</h2><button type="button" class="popup-card__close" aria-label="Ahora no"></button></div><p class="popup-card__body">Actívalas para recibir noticias y cambios de horario.</p><button type="button" class="popup-card__accept">Activar</button>';
        card.querySelector('.popup-card__symbol').appendChild(makeIcon('bell'));
        card.querySelector('.popup-card__close').appendChild(makeIcon('x'));
        card.querySelector('.popup-card__close').addEventListener('click', () => AppPopups.dismiss(card));
        card.querySelector('.popup-card__accept').addEventListener('click', () => {
            AppPopups.dismiss(card);
            toggle()
        });
        AppPopups.enqueue('notifications', card)
    }

    controls.forEach(({ button }) => button.addEventListener('click', toggle));
    document.addEventListener('visibilitychange', render);
    render();
    if (!supported) return;
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async OneSignal => {
        try {
            const scope = new URL('./', location.href);
            await OneSignal.init({
                appId,
                path: scope.pathname,
                serviceWorkerPath: 'sw.js',
                serviceWorkerParam: { scope: scope.pathname },
                promptOptions: { slidedown: { prompts: [{ type: 'push', autoPrompt: !1 }] } }
            });
            // OneSignal registra sw.js sin updateViaCache: 'none'; se restaura para que las actualizaciones de la app eviten la caché HTTP.
            const registration = await navigator.serviceWorker.getRegistration(scope.href);
            const worker = registration && (registration.installing || registration.waiting || registration.active);
            if (worker && registration.updateViaCache !== 'none' && new URL(worker.scriptURL).pathname === new URL('sw.js', scope).pathname) {
                await navigator.serviceWorker.register(worker.scriptURL, { scope: scope.href, updateViaCache: 'none' })
            }
            sdk = OneSignal;
            OneSignal.User.PushSubscription.addEventListener('change', render);
            OneSignal.Notifications.addEventListener('permissionChange', render);
            render();
            offerOnce()
        } catch (error) {
            console.warn('No se pudieron preparar las notificaciones.', error)
        }
    })
})
