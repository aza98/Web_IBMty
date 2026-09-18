(function() {
    var standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === !0;
    document.documentElement.classList.toggle('is-pwa', standalone);
    if (!standalone) return;
    var key = 'ibmtyPwaLaunchStarted';
    var splash = /(?:^|\/)splash\.html$/.test(location.pathname);
    try {
        if (!splash && sessionStorage.getItem(key)) return;
        sessionStorage.setItem(key, '1')
    } catch (error) {
        return
    }
    if (!splash && /^\/(?:index\.html)?$/.test(location.pathname) && !location.search && !location.hash) {
        location.replace('splash.html')
    }
})()