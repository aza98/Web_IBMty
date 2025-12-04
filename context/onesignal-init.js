/**
 * OneSignal Initialization
 * Iglesia Bautista de Monterrey - PWA
 */

window.OneSignalDeferred = window.OneSignalDeferred || [];
OneSignalDeferred.push(async function (OneSignal) {
    await OneSignal.init({
        appId: "6485b5c7-d74a-4a30-aa1e-905ce09210b5",
        safari_web_id: "web.onesignal.auto.2b30b273-8f48-4327-8bae-bed77c33071b",
        notifyButton: {
            enable: true,
        },
        allowLocalhostAsSecureOrigin: true,
        serviceWorkerPath: 'service-worker.js',
    });
    console.log('✅ OneSignal inicializado');
});