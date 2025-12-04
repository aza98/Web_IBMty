/**
 * Service Worker Registration
 * Iglesia Bautista de Monterrey - PWA
 * 
 * Este archivo maneja el registro correcto del service worker
 * y gestiona su ciclo de vida (instalación, actualización, activación)
 */

if ('serviceWorker' in navigator) {
    // Registrar el service worker cuando la página termine de cargar
    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('/service-worker.js')
            .then((registration) => {
                console.log('✅ Service Worker registrado correctamente:', registration.scope);

                // Verificar si hay una actualización disponible
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    console.log('🔄 Nueva versión del Service Worker detectada');

                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // Hay una nueva versión disponible
                            console.log('✨ Nueva versión disponible.');
                            showUpdateToast(registration);
                        }
                    });
                });

                // Verificar actualizaciones cada hora
                setInterval(() => {
                    registration.update();
                }, 60 * 60 * 1000); // 1 hora
            })
            .catch((error) => {
                console.error('❌ Error al registrar el Service Worker:', error);
            });

        // Manejar mensajes del service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'CACHE_UPDATED') {
                console.log('📦 Caché actualizada:', event.data.url);
            }
        });

        // Detectar cuando el service worker toma control
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('🔄 Service Worker actualizado y activado');
        });
    });

    function showUpdateToast(registration) {
        // Evitar bucle si acabamos de recargar por actualización
        if (sessionStorage.getItem('pwa_update_reloaded')) {
            console.log('🚫 Notificación suprimida para evitar bucle tras recarga.');
            sessionStorage.removeItem('pwa_update_reloaded');
            return;
        }

        // Si ya existe el toast, no crear otro
        if (document.getElementById('pwa-update-toast')) return;

        const toastHTML = `
            <div id="pwa-update-toast" class="position-fixed bottom-0 end-0 p-3" style="z-index: 11000">
                <div class="toast show align-items-center text-bg-dark border-0 shadow-lg" role="alert" aria-live="assertive" aria-atomic="true">
                    <div class="d-flex">
                        <div class="toast-body">
                            <i class="fas fa-sync-alt me-2"></i>Nueva versión disponible.
                        </div>
                        <button type="button" id="pwa-update-btn" class="btn btn-info btn-sm text-white me-2 m-auto fw-bold">Actualizar</button>
                        <button type="button" class="btn-close btn-close-white me-2 m-auto" onclick="this.closest('#pwa-update-toast').remove()" aria-label="Cerrar"></button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', toastHTML);

        document.getElementById('pwa-update-btn').addEventListener('click', () => {
            const waitingWorker = registration.waiting;
            if (waitingWorker) {
                waitingWorker.postMessage({ type: 'SKIP_WAITING' });
            }
            sessionStorage.setItem('pwa_update_reloaded', 'true');
            window.location.reload();
        });
    }
} else {
    console.warn('⚠️ Service Workers no están soportados en este navegador');
    console.log('La aplicación funcionará sin capacidades offline');
}