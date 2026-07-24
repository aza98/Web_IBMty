(function() {
    var SESSION_KEY = 'ibmtyPwaLaunchStarted';
    var isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === !0;
    if (!isStandalone) return;
    var isSplash = /(?:^|\/)splash\.html$/.test(window.location.pathname);
    try {
        if (isSplash) {
            sessionStorage.setItem(SESSION_KEY, '1');
            return
        }
        if (sessionStorage.getItem(SESSION_KEY)) return;
        sessionStorage.setItem(SESSION_KEY, '1')
    } catch (error) {
        return
    }
    window.location.replace('splash.html')
})();
