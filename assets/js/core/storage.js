/*
 * Safe wrapper around localStorage.
 * Storage can be blocked (private mode, policies); callers must keep working.
 * Every persisted key is declared in KEYS so ownership and migrations are visible.
 */
(function(IBMty) {
    'use strict';

    const KEYS = Object.freeze({
        theme: 'ibmty:theme',
        lang: 'ibmty:lang',
        consent: 'ibmty:consent',
        pushOffer: 'ibmty:push-offer',
        whatsappButton: 'ibmty:whatsapp-button',
        latestLive: 'ibmty:latest-live'
    });

    IBMty.storage = {
        KEYS,
        get(key) {
            try {
                const raw = localStorage.getItem(key);
                return raw === null ? null : JSON.parse(raw);
            } catch {
                return null;
            }
        },
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch {
                // Blocked or full storage: the value simply is not remembered.
            }
        }
    };
})(self.IBMty = self.IBMty || {});