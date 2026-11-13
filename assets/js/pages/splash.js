/*
 * PWA launch screen: plays the CSS intro (splash.css), then opens the home page.
 * The intro fits inside INTRO_MS, which matches the page's meta refresh fallback,
 * so launch never waits on an animation. Reduced motion skips straight ahead.
 */
(function(IBMty) {
    'use strict';
    const INTRO_MS = 1000;
    IBMty.register('page:splash', {
        init() {
            const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            setTimeout(() => location.replace('../index.html'), reduced ? 300 : INTRO_MS)
        }
    })
})(self.IBMty = self.IBMty || {})