/*
 * Install guidance: keeps the beforeinstallprompt event (Chromium) so the settings panel can
 * offer "Instalar la app". IBMty.install { available, prompt() }; emits install-change.
 */
(function(IBMty) {
    'use strict';
    let deferred = null;
    IBMty.install = {
        get available() {
            return deferred !== null
        },
        async prompt() {
            if (!deferred) return;
            const event = deferred;
            deferred = null;
            IBMty.emit('install-change');
            await event.prompt()
        }
    };
    window.addEventListener('beforeinstallprompt', (event) => {
        event.preventDefault();
        deferred = event;
        IBMty.emit('install-change')
    });
    window.addEventListener('appinstalled', () => {
        deferred = null;
        IBMty.emit('install-change')
    })
})(self.IBMty = self.IBMty || {})