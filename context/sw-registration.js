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
                            console.log('✨ Nueva versión disponible. Por favor, recarga la página.');

                            // Opcional: Mostrar notificación al usuario
                            // if (confirm('Hay una nueva versión disponible. ¿Deseas recargar la página?')) {
                            //    window.location.reload();
                            // }
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
} else {
    console.warn('⚠️ Service Workers no están soportados en este navegador');
    console.log('La aplicación funcionará sin capacidades offline');
}