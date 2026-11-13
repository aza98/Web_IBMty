/*
 * Google Analytics 4 with Consent Mode. Off until features.analytics and
 * services.analyticsId are set. Consent defaults to denied; gtag.js loads only after the
 * visitor accepts (storage KEYS.consent = 'granted', set by components/consent.js or Ajustes),
 * as the privacy notice promises.
 * IBMty.analytics { enabled, applyConsent() }.
 */
(function(IBMty) {
    'use strict';
    let started = !1;
    const services = () => IBMty.config.services;

    function ensureGtag() {
        window.dataLayer = window.dataLayer || [];
        if (!window.gtag) {
            window.gtag = function gtag() {
                window.dataLayer.push(arguments)
            };
            window.gtag('consent', 'default', {
                analytics_storage: 'denied',
                ad_storage: 'denied',
                ad_user_data: 'denied',
                ad_personalization: 'denied'
            })
        }
    }

    function applyConsent() {
        if (!IBMty.analytics.enabled) return;
        ensureGtag();
        if (IBMty.storage.get(IBMty.storage.KEYS.consent) !== 'granted') {
            window.gtag('consent', 'update', {
                analytics_storage: 'denied'
            });
            return
        }
        window.gtag('consent', 'update', {
            analytics_storage: 'granted'
        });
        if (!started) {
            started = !0;
            const id = services().analyticsId;
            const script = document.createElement('script');
            script.async = !0;
            script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
            document.head.appendChild(script);
            window.gtag('js', new Date());
            window.gtag('config', id)
        }
    }
    IBMty.analytics = {
        get enabled() {
            return Boolean(IBMty.config.features.analytics && services().analyticsId)
        },
        applyConsent
    }
})(self.IBMty = self.IBMty || {})