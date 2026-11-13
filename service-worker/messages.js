/*
 * Lifecycle and the update protocol with assets/js/pwa/updates.js.
 * Messages are plain objects { type }:
 *
 *   GET_VERSION   -> replies { type: 'VERSION', version } on the event's port or source
 *   SKIP_WAITING  -> this (waiting) worker activates; pages reload once it controls them
 *
 * New releases wait for the reader to apply them, so an open page is not
 * switched mid-session. On the very first install
 * there is no previous worker, so it activates and claims the open pages at once.
 */
(function(SW, workbox) {
    'use strict';
    workbox.core.clientsClaim();
    const canActivate = (active) => new Promise((resolve) => {
        const channel = new MessageChannel();
        const finish = (activate) => {
            clearTimeout(timer);
            channel.port1.close();
            resolve(activate)
        };
        const timer = setTimeout(() => finish(!1), 3000);
        channel.port1.onmessage = ({
            data
        }) => {
            finish(typeof data === 'string' || (active.scriptURL !== self.location.href && data && data.type === 'VERSION' && data.version === SW.config.version))
        };
        try {
            active.postMessage({
                type: 'GET_VERSION'
            }, [channel.port2])
        } catch {
            finish(!1)
        }
    });
    self.addEventListener('install', (event) => {
        const active = self.registration.active;
        if (!active) return;
        event.waitUntil(canActivate(active).then((activate) => activate && self.skipWaiting()))
    });
    self.addEventListener('message', (event) => {
        const type = event.data && event.data.type;
        if (type === 'SKIP_WAITING') {
            self.skipWaiting()
        } else if (type === 'GET_VERSION') {
            const reply = {
                type: 'VERSION',
                version: SW.config.version
            };
            (event.ports[0] || event.source).postMessage(reply)
        }
    })
})(self.IBMtySW, self.workbox)