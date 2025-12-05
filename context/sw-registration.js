/**
 * Service Worker Registration
 * Iglesia Bautista de Monterrey - PWA
 */

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("/service-worker.js")
            .then((registration) => {
                console.log(
                    "✅ Service Worker registrado correctamente:",
                    registration.scope
                );
                registration.addEventListener("updatefound", () => {
                    const newWorker = registration.installing;
                    console.log("🔄 Nueva versión del Service Worker detectada");
                    newWorker.addEventListener("statechange", () => {
                        if (
                            newWorker.state === "installed" &&
                            navigator.serviceWorker.controller
                        ) {
                            console.log(
                                "✨ Nueva versión disponible. Por favor, recarga la página."
                            );
                        }
                    });
                });
                const CHECK_INTERVAL = 24 * 60 * 60 * 1000;
                let lastCheck = Date.now();
                const checkForUpdates = () => {
                    const now = Date.now();
                    if (now - lastCheck > CHECK_INTERVAL) {
                        console.log("🕒 Verificando actualizaciones (Programado)...");
                        registration.update();
                        lastCheck = now;
                    }
                };
                setInterval(checkForUpdates, CHECK_INTERVAL);
                document.addEventListener("visibilitychange", () => {
                    if (document.visibilityState === "visible") {
                        checkForUpdates();
                    }
                });
            })
            .catch((error) => {
                console.error("❌ Error al registrar el Service Worker:", error);
            });
        navigator.serviceWorker.addEventListener("message", (event) => {
            if (event.data && event.data.type === "CACHE_UPDATED") {
                console.log("📦 Caché actualizada:", event.data.url);
            }
        });
        navigator.serviceWorker.addEventListener("controllerchange", () => {
            console.log("🔄 Service Worker actualizado y activado");
        });
    });
} else {
    console.warn("⚠️ Service Workers no están soportados en este navegador");
    console.log("La aplicación funcionará sin capacidades offline");
}