/*
 * Public, client-side configuration. Everything here is served to browsers:
 * never place secrets, private keys or personal data in this file.
 * Loaded by pages and by sw.js (importScripts), so it only uses `self`.
 * Integrations stay disabled until their feature flag is turned on and their id is set.
 */
(function(IBMty) {
    'use strict';

    IBMty.config = Object.freeze({
        release: self.IBMTY_RELEASE,
        locale: 'es-MX',
        timeZone: 'America/Monterrey',

        // Contact and location: fill these in. Empty values leave their buttons disabled.
        church: Object.freeze({
            name: 'Iglesia Bautista de Monterrey',
            shortName: 'IBMty',
            email: '', // Correo, p. ej. 'contacto@dominio.mx'
            phone: '', // Teléfono con lada, p. ej. '+52 81 0000 0000'
            whatsapp: '', // WhatsApp con código de país, p. ej. '+52 81 0000 0000'
            address: 'Av. Eugenio Garza Sada 6309, MTY.', // Dirección como se mostrará en la página
            directionsUrl: 'https://maps.app.goo.gl/uekoBnmFoU2Vxx7K7', // Enlace de Google Maps para “Cómo llegar”
            mapEmbedUrl: 'https://www.google.com/maps?q=25.6040381,-100.2669626(Iglesia%20Bautista%20de%20Monterrey)&z=16&output=embed', // Google Maps → Compartir → Insertar un mapa → la URL de src
        }),

        features: Object.freeze({
            serviceWorker: true,
            analytics: true,
            push: true,
            video: true,
            forms: true,
            map: true
        }),

        // Sunday service and live broadcast, in timeZone wall-clock time.
        service: Object.freeze({
            weekday: 0,
            hour: 11,
            minute: 0,
            durationMinutes: 90
        }),

        links: Object.freeze({
            youversion: 'https://www.bible.com/organizations/eb81cf60-79a0-496a-b2f4-13d0f42e0a15',
            bible: 'https://www.bible.com/es/versions/149-rvr1960-biblia-reina-valera-1960'
        }),

        services: Object.freeze({
            // Google Analytics 4 (services/analytics.js), with features.analytics. It starts only
            // after the visitor accepts the cookie notice (components/consent.js).
            analyticsId: '', // ID de medición de GA4, p. ej. 'G-XXXXXXXXXX'
            // OneSignal push (services/push.js, service-worker/push.js), with features.push.
            oneSignalAppId: '', // App ID de OneSignal (Settings → Keys & IDs)
            youTubeChannelId: '', // ID de canal de YouTube 
            // Clave API de YouTube Data API v3; vacía, la última transmisión no se muestra.
            // Restríngela en Google Cloud a los dominios del sitio y solo a YouTube Data API v3.
            youTubeApiKey: '',
            formEndpoints: Object.freeze({
                contact: '',
                salvation: ''
            })
        }),

        social: Object.freeze({
            facebook: '',
            instagram: '',
            youtube: 'https://www.youtube.com/channel/UCfhSTnqLb6vFO28eNm_n0qw'
        })
    });
})(self.IBMty = self.IBMty || {});