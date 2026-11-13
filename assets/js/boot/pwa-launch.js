/*
 * Runs synchronously in <head>: detects standalone (installed) mode and sets
 * <html data-display="standalone|browser"> so CSS can adapt before first paint.
 */
(function() {
    'use strict';
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === !0;
    document.documentElement.dataset.display = standalone ? 'standalone' : 'browser'
})()