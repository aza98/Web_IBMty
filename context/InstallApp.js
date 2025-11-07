(function() {
    'use strict';

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker
                .register('/service-worker.js')
                .then(reg => console.log('Service Worker registrado:', reg.scope))
                .catch(err => console.error('Error al registrar el Service Worker:', err));
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        const elements = {
            installBtn: document.getElementById('install-btn'),
            iosPopup: document.getElementById('ios-popup'),
            closePopup: document.getElementById('close-popup')
        };

        if (!elements.installBtn || !elements.iosPopup || !elements.closePopup) {
            console.error('No se encontraron los elementos necesarios');
            return;
        }

        const isIOS = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
        const isStandalone = 'standalone' in navigator && navigator.standalone;

        let deferredPrompt = null;

        if (isIOS && !isStandalone) {
            elements.installBtn.style.display = 'flex';
            
            elements.installBtn.addEventListener('click', (e) => {
                e.preventDefault();
                elements.iosPopup.classList.add('active');
            });

            elements.closePopup.addEventListener('click', () => {
                elements.iosPopup.classList.remove('active');
            });

            elements.iosPopup.addEventListener('click', (e) => {
                if (e.target === elements.iosPopup) {
                    elements.iosPopup.classList.remove('active');
                }
            });
        }

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            elements.installBtn.style.display = 'flex';
            console.log('Evento beforeinstallprompt detectado');
        });

        elements.installBtn.addEventListener('click', async () => {
            if (!deferredPrompt) return;
            
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            
            console.log(outcome === 'accepted' 
                ? 'Usuario aceptó instalar la PWA' 
                : 'Usuario canceló la instalación');
            
            deferredPrompt = null;
            elements.installBtn.style.display = 'none';
        });

        window.addEventListener('appinstalled', () => {
            console.log('PWA instalada correctamente');
            elements.installBtn.style.display = 'none';
        });
    }
})();