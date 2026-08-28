document.addEventListener('DOMContentLoaded', function() {
    var appId = typeof APP_CONFIG !== 'undefined' ? APP_CONFIG.oneSignalAppId : ''
    var INSTALL_SEEN = 'notifInstallPromptShown'
    var LEGACY_INSTALL_SEEN = 'notifAutoPromptShown'
    var FAB_PREFERENCE = 'notifFab'
    var COPY = {
        granted: ['Activadas', 'Activadas', 'bell'],
        default: ['Toca para activar', 'Activar', 'bell'],
        denied: ['Bloqueadas — actívalas desde los ajustes de tu dispositivo', 'Bloqueadas', 'bell-off'],
        loading: ['Preparando…', 'Cargando…', 'loader-circle'],
        unavailable: ['No disponible en este navegador', 'No disp.', 'bell-off']
    }
    var sdk = null
    var busy = !1
    var desired = null
    var unavailable = !1
    var syncPending = !1
    var syncTimer = null
    var controls = [
        ['notif-toggle', 'notif-label', 'notif-icon', !0],
        ['nav-notif-toggle', 'nav-notif-label', 'nav-notif-icon', !1, 'nav-notif-item'],
        ['mobile-notif-toggle', 'mobile-notif-label', 'mobile-notif-icon', !1, 'mobile-notif-item']
    ].map(function(ids) {
        return {
            button: document.getElementById(ids[0]),
            label: document.getElementById(ids[1]),
            icon: document.getElementById(ids[2]),
            wide: ids[3],
            item: ids[4] && document.getElementById(ids[4])
        }
    }).filter(function(control) {
        return control.button
    })
    if (!controls.length) return

    function permission() {
        return window.Notification ? window.Notification.permission : 'unsupported'
    }

    function state() {
        if (permission() === 'denied') return 'denied'
        if (unavailable || permission() === 'unsupported') return 'unavailable'
        if (!sdk) return 'loading'
        return permission() === 'granted' && sdk.User.PushSubscription.optedIn === !0 ? 'granted' : 'default'
    }

    function storage(key, value) {
        try {
            if (arguments.length === 2) localStorage.setItem(key, value)
            else return localStorage.getItem(key)
        } catch (error) {
            return null
        }
        return value
    }

    function standalone() {
        if (typeof window.isStandaloneMode === 'function') return window.isStandaloneMode()
        return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === !0
    }

    function element(tag, className, text) {
        var node = document.createElement(tag)
        if (className) node.className = className
        if (text) node.textContent = text
        return node
    }

    function remove(id) {
        var node = document.getElementById(id)
        if (node) node.remove()
    }

    function whatsappVisible() {
        var whatsapp = document.getElementById('whatsapp-fab')
        return !!whatsapp && getComputedStyle(whatsapp).display !== 'none'
    }

    function positionFloatingUI() {
        var visible = String(whatsappVisible());
        ['notification-fab', 'notification-denied-prompt', 'notification-install-prompt'].forEach(function(id) {
            var node = document.getElementById(id)
            if (node) node.dataset.whatsappVisible = visible
        })
    }

    function placeFloating(node) {
        var whatsapp = document.getElementById('whatsapp-fab')
        if (whatsapp && whatsapp.parentNode) whatsapp.parentNode.insertBefore(node, whatsapp.nextSibling)
        else document.body.appendChild(node)
        positionFloatingUI()
    }

    function showPrompt(id, iconName, title, message, actions) {
        if (document.getElementById(id)) return
        var panel = element('section', 'notification-permission-prompt')
        var titleId = id + '-title'
        panel.id = id
        panel.setAttribute('role', 'region')
        panel.setAttribute('aria-labelledby', titleId)
        panel.setAttribute('aria-live', 'polite')
        var heading = element('div', 'notification-permission-prompt-heading')
        var icon = element('span', 'notification-permission-prompt-icon')
        if (typeof makeIcon === 'function') icon.appendChild(makeIcon(iconName))
        heading.appendChild(icon)
        var headingText = element('h2', 'notification-permission-prompt-title', title)
        headingText.id = titleId
        heading.appendChild(headingText)
        panel.appendChild(heading)
        panel.appendChild(element('p', 'notification-permission-prompt-copy', message))
        var buttons = element('div', 'notification-permission-prompt-actions')
        actions.forEach(function(action) {
            var button = element('button', 'btn btn-app btn-app--compact ' + (action[1] ? 'btn-app--primary' : 'btn-app--secondary'), action[0])
            button.type = 'button'
            button.addEventListener('click', action[2])
            buttons.appendChild(button)
        })
        panel.appendChild(buttons)
        placeFloating(panel)
    }

    function deniedInstructions() {
        var ua = navigator.userAgent || ''
        if (/iPhone|iPad|iPod/i.test(ua)) {
            return 'Abre Ajustes > Notificaciones > IBMty y activa “Permitir notificaciones”.'
        }
        if (/Android/i.test(ua)) {
            return 'Abre Chrome > Configuración > Configuración de sitios > Notificaciones, busca www.ibmty.com y selecciona Permitir.'
        }
        return 'Abre los ajustes del navegador, busca www.ibmty.com en Notificaciones y selecciona Permitir.'
    }

    function showDeniedHelp() {
        if (permission() !== 'denied') {
            sync()
            return
        }
        showPrompt('notification-denied-prompt', 'bell-off', 'Notificaciones bloqueadas', 'No podemos volver a mostrar la solicitud desde aquí. ' + deniedInstructions(), [
            ['Ocultar botón', !1, function() {
                storage(FAB_PREFERENCE, 'off')
                remove('notification-denied-prompt')
                render(state())
            }],
            ['Entendido', !0, function() {
                remove('notification-denied-prompt')
            }]
        ])
    }

    function createNotificationFab() {
        var button = element('button', 'ctrl-app ctrl-app--float ctrl-app--fab')
        button.id = 'notification-fab'
        button.type = 'button'
        button.setAttribute('aria-label', 'Ver cómo activar las notificaciones')
        if (typeof makeIcon === 'function') button.appendChild(makeIcon('bell-off'))
        button.addEventListener('click', showDeniedHelp)
        placeFloating(button)
    }

    function createFabPreferenceToggle() {
        var mainToggle = document.getElementById('notif-toggle')
        if (!mainToggle || !mainToggle.parentNode) return null
        var button = element('button', 'settings-row settings-row--bordered')
        button.id = 'notif-fab-toggle'
        button.type = 'button'
        button.setAttribute('role', 'switch')
        button.setAttribute('aria-label', 'Botón de notificaciones flotante')
        button.setAttribute('aria-describedby', 'notif-fab-label')
        var left = element('span', 'settings-row-left')
        var icon = element('span', 'settings-row-icon')
        if (typeof makeIcon === 'function') icon.appendChild(makeIcon('bell-off'))
        left.appendChild(icon)
        var copy = element('span', 'settings-row-info')
        copy.appendChild(element('span', 'settings-row-title', 'Botón de notificaciones'))
        var label = element('span', 'settings-row-desc')
        label.id = 'notif-fab-label'
        label.setAttribute('aria-live', 'polite')
        copy.appendChild(label)
        left.appendChild(copy)
        button.appendChild(left)
        var track = element('span', 'sw-track notif-fab-sw')
        track.setAttribute('aria-hidden', 'true')
        track.appendChild(element('span', 'sw-thumb'))
        button.appendChild(track)
        button.addEventListener('click', function() {
            storage(FAB_PREFERENCE, storage(FAB_PREFERENCE) === 'off' ? 'on' : 'off')
            render(state())
        })
        mainToggle.parentNode.appendChild(button)
        return button
    }

    function renderDeniedUI() {
        var denied = permission() === 'denied'
        var showFab = denied && storage(FAB_PREFERENCE) !== 'off'
        var fab = document.getElementById('notification-fab')
        if (showFab && !fab) createNotificationFab()
        if (!showFab && fab) fab.remove()
        if (!denied) remove('notification-denied-prompt')
        var toggle = document.getElementById('notif-fab-toggle')
        if (!toggle && denied) toggle = createFabPreferenceToggle()
        if (toggle) {
            toggle.hidden = !denied
            toggle.dataset.fab = showFab ? 'on' : 'off'
            toggle.setAttribute('aria-checked', String(showFab))
            var label = document.getElementById('notif-fab-label')
            if (label) label.textContent = showFab ? 'Visible' : 'Oculto'
        }
        positionFloatingUI()
    }

    function render(next, failed) {
        var pending = next === 'loading' && desired !== null
        var checked = pending ? desired : next === 'granted'
        var copy = pending ? [desired ? 'Activando…' : 'Desactivando…', desired ? 'Activando…' : 'Desactivando…', 'loader-circle'] : COPY[next]
        controls.forEach(function(control) {
            control.button.dataset.notif = next
            control.button.disabled = next === 'unavailable' || (next === 'loading' && !pending)
            control.button.setAttribute(control.button.getAttribute('role') === 'switch' ? 'aria-checked' : 'aria-pressed', String(checked))
            control.button.setAttribute('aria-busy', String(next === 'loading'))
            if (control.label) control.label.textContent = (failed ? 'No se pudo cambiar. ' : '') + copy[control.wide ? 0 : 1]
            if (control.icon && typeof setIcon === 'function') setIcon(control.icon, copy[2])
            if (control.item) control.item.style.display = next === 'unavailable' ? 'none' : ''
        })
        renderDeniedUI()
        if (next !== 'default' || permission() !== 'default') remove('notification-install-prompt')
    }

    function sync() {
        if (busy && permission() !== 'denied') {
            syncPending = !0
            return
        }
        syncPending = !1
        render(state())
    }

    function scheduleSync() {
        syncPending = !0
        if (busy || syncTimer !== null) return
        syncTimer = setTimeout(function() {
            syncTimer = null
            sync()
        }, 0)
    }
    async function changeSubscription() {
        var failed = !1
        busy = !0
        try {
            while (desired !== null) {
                var target = desired
                var currentPermission = permission()
                if (currentPermission === 'denied' || currentPermission === 'unsupported') break
                if (target && currentPermission === 'default') {
                    await sdk.Notifications.requestPermission()
                } else if ((sdk.User.PushSubscription.optedIn === !0) !== target) {
                    await sdk.User.PushSubscription[target ? 'optIn' : 'optOut']()
                }
                if (permission() !== 'granted' || desired === target) break
            }
        } catch (error) {
            failed = !0
            console.warn('No se pudo actualizar la suscripción de notificaciones.', error)
        } finally {
            busy = !1
            desired = null
            if (failed) render(state(), !0)
            else scheduleSync()
        }
    }

    function toggleNotifications() {
        if (permission() === 'denied') {
            sync()
            showDeniedHelp()
            return
        }
        if (!sdk || unavailable) return
        desired = !(desired !== null ? desired : state() === 'granted')
        render('loading')
        if (!busy) changeSubscription()
    }

    function maybeShowInstallPrompt() {
        if (!sdk || !standalone() || permission() !== 'default') return
        if (storage(INSTALL_SEEN) === 'true' || storage(LEGACY_INSTALL_SEEN) === 'true') return
        if (document.getElementById('notification-install-prompt')) return
        storage(INSTALL_SEEN, 'true')
        showPrompt('notification-install-prompt', 'bell', 'Recibe avisos de IBMty', 'Actívalas para recibir noticias y cambios de horario.', [
            ['Ahora no', !1, function() {
                remove('notification-install-prompt')
            }],
            ['Activar', !0, function() {
                remove('notification-install-prompt')
                toggleNotifications()
            }]
        ])
    }
    if (!appId || permission() === 'unsupported') {
        unavailable = !0
        render('unavailable')
        return
    }
    render(state())
    controls.forEach(function(control) {
        control.button.addEventListener('click', toggleNotifications)
        if (control.label) control.label.setAttribute('aria-live', 'polite')
    })
    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'visible') scheduleSync()
    })
    window.addEventListener('pageshow', scheduleSync)
    if ('MutationObserver' in window) {
        var observer = new MutationObserver(positionFloatingUI)
        var whatsapp = document.getElementById('whatsapp-fab')
        if (whatsapp) observer.observe(whatsapp, {
            attributes: !0,
            attributeFilter: ['style', 'class', 'hidden']
        })
        observer.observe(document.body, {
            attributes: !0,
            attributeFilter: ['class']
        })
    }
    var sdkTimeout = setTimeout(function() {
        unavailable = !0
        sync()
    }, 15000)
    window.OneSignalDeferred = window.OneSignalDeferred || []
    window.OneSignalDeferred.push(async function(OneSignal) {
        try {
            await OneSignal.init({
                appId: appId,
                serviceWorkerPath: 'sw.js',
                serviceWorkerParam: {
                    scope: '/'
                },
                promptOptions: {
                    slidedown: {
                        prompts: [{
                            type: 'push',
                            autoPrompt: !1
                        }]
                    }
                }
            })
        } catch (error) {
            clearTimeout(sdkTimeout)
            unavailable = !0
            console.warn('No se pudo iniciar OneSignal.', error)
            sync()
            return
        }
        clearTimeout(sdkTimeout)
        if (typeof OneSignal.Notifications.isPushSupported === 'function' && !OneSignal.Notifications.isPushSupported()) {
            unavailable = !0
            sync()
            return
        }
        unavailable = !1
        sdk = OneSignal
        OneSignal.User.PushSubscription.addEventListener('change', scheduleSync)
        OneSignal.Notifications.addEventListener('permissionChange', scheduleSync)
        sync()
        maybeShowInstallPrompt()
    })
})