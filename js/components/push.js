document.addEventListener('DOMContentLoaded', function() {
    var appId = (typeof APP_CONFIG !== 'undefined') ? APP_CONFIG.oneSignalAppId : '';
    var COPY = {
        granted: {
            wide: 'Activadas',
            short: 'Activadas',
            icon: 'fa-solid fa-bell'
        },
        default: {
            wide: 'Toca para activar',
            short: 'Activar',
            icon: 'fa-regular fa-bell'
        },
        denied: {
            wide: 'Bloqueadas — revisa los ajustes del navegador',
            short: 'Bloqueadas',
            icon: 'fa-solid fa-bell-slash'
        },
        loading: {
            wide: 'Preparando…',
            short: 'Cargando…',
            icon: 'fa-regular fa-bell'
        },
        unavailable: {
            wide: 'No disponible en este navegador',
            short: 'No disp.',
            icon: 'fa-solid fa-bell-slash'
        }
    };
    var toggles = [{
        btn: el('notif-toggle'),
        label: el('notif-label'),
        icon: el('notif-icon'),
        wide: !0,
        item: null
    }, {
        btn: el('nav-notif-toggle'),
        label: el('nav-notif-label'),
        icon: el('nav-notif-icon'),
        wide: !1,
        item: el('nav-notif-item')
    }, {
        btn: el('mobile-notif-toggle'),
        label: el('mobile-notif-label'),
        icon: el('mobile-notif-icon'),
        wide: !1,
        item: el('mobile-notif-item')
    }].filter(function(t) {
        return t.btn
    });
    if (toggles.length === 0) return;
    var sdk = null;
    var busy = !1;
    if (!appId || !('Notification' in window)) {
        render('unavailable');
        return
    }
    render('loading');
    toggles.forEach(function(t) {
        t.btn.addEventListener('click', onClick)
    });
    initAutoPrompt();
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function(OneSignal) {
        try {
            await OneSignal.init({
                appId: appId,
                serviceWorkerPath: 'sw.js',
                serviceWorkerParam: {
                    scope: '/'
                },
                allowLocalhostAsSecure: !0
            })
        } catch (e) {
            console.warn('[push] OneSignal.init falló:', e);
            render('unavailable');
            return
        }
        if (typeof OneSignal.Notifications.isPushSupported === 'function' && !OneSignal.Notifications.isPushSupported()) {
            render('unavailable');
            return
        }
        sdk = OneSignal;
        render(state());
        OneSignal.User.PushSubscription.addEventListener('change', sync);
        OneSignal.Notifications.addEventListener('permissionChange', sync)
    });

    function el(id) {
        return document.getElementById(id)
    }

    function sync() {
        if (!busy) render(state());
    }

    function state() {
        if (!sdk) return 'loading';
        if (Notification.permission === 'denied') return 'denied';
        return sdk.User.PushSubscription.optedIn === !0 ? 'granted' : 'default'
    }

    function initAutoPrompt() {
        if (localStorage.getItem('notifAutoPromptShown')) return;
        var isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === !0;
        if (!isStandalone) return;
        if (Notification.permission !== 'default') {
            localStorage.setItem('notifAutoPromptShown', 'true');
            return
        }
        armAutoPrompt()
    }

    function armAutoPrompt() {
        document.addEventListener('click', onAutoPromptTap, {
            once: !0
        });
        document.addEventListener('touchend', onAutoPromptTap, {
            once: !0
        })
    }

    function onAutoPromptTap() {
        document.removeEventListener('click', onAutoPromptTap);
        document.removeEventListener('touchend', onAutoPromptTap);
        if (!sdk) {
            armAutoPrompt();
            return
        }
        localStorage.setItem('notifAutoPromptShown', 'true');
        if (busy || state() !== 'default') return;
        onClick()
    }

    function onClick() {
        if (busy || !sdk) return;
        var s = state();
        if (s === 'denied' || s === 'unavailable') return;
        busy = !0;
        render('loading');
        var sub = sdk.User.PushSubscription;
        var action = sub.optedIn === !0 ? sub.optOut() : sub.optIn();
        Promise.resolve(action).catch(function(e) {
            console.warn('[push] no se pudo cambiar la suscripción:', e)
        }).then(function() {
            busy = !1;
            render(state())
        })
    }

    function render(s) {
        var copy = COPY[s] || COPY.default;
        toggles.forEach(function(t) {
            t.btn.dataset.notif = s;
            t.btn.disabled = (s === 'loading' || s === 'unavailable');
            t.btn.setAttribute('aria-pressed', s === 'granted' ? 'true' : 'false');
            if (t.label) t.label.textContent = t.wide ? copy.wide : copy.short;
            if (t.icon) t.icon.className = copy.icon;
            if (!t.wide && t.item && s === 'unavailable') t.item.style.display = 'none'
        })
    }
})