/*
 * Floating WhatsApp button on every page, shown only while church.whatsapp is set.
 * In the installed app the person can hide it from Ajustes (IBMty.whatsapp.set(false));
 * the browser always shows it. The choice lives under storage.KEYS.whatsappButton.
 * Defined at load, not in init, so pages/settings.js can use it from its own init.
 */
(function(IBMty, document) {
    'use strict';
    const MESSAGE = 'Hola, tengo una pregunta para la Iglesia Bautista de Monterrey.';
    const installed = () => document.documentElement.dataset.display === 'standalone';
    const number = () => String((IBMty.config && IBMty.config.church.whatsapp) || '').replace(/\D/g, '');
    let button;
    const wanted = () => !(installed() && IBMty.storage.get(IBMty.storage.KEYS.whatsappButton) === 'hidden');

    function render() {
        if (button) button.hidden = !wanted();
    }
    IBMty.whatsapp = {
        available: () => Boolean(number()),
        visible: wanted,
        set(visible) {
            IBMty.storage.set(IBMty.storage.KEYS.whatsappButton, visible ? 'shown' : 'hidden');
            render()
        }
    };
    IBMty.register('component:whatsapp', {
        init() {
            if (!number()) return;
            button = document.createElement('a');
            button.className = 'float-btn whatsapp-fab';
            button.href = `https://wa.me/${number()}?text=${encodeURIComponent(MESSAGE)}`;
            button.target = '_blank';
            button.rel = 'noopener';
            button.setAttribute('aria-label', 'Escribir por WhatsApp');
            button.innerHTML = '<i class="fa-brands fa-whatsapp" aria-hidden="true"></i>';
            document.body.append(button);
            render()
        }
    })
})(self.IBMty = self.IBMty || {}, document)