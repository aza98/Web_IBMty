/*
 * Runs synchronously in <head> before first paint: applies the saved or system theme
 * to <html data-bs-theme> and syncs <meta name="theme-color">. Must not depend on other scripts.
 * In the installed app the bar takes the page's --color-status-bar (the color at its
 * top edge), so status bar and hero read as one surface; the browser keeps BARS.
 * Exposes IBMty.theme { mode, resolved, set(mode) } with mode "light" | "dark" | "auto".
 */
(function(IBMty) {
    'use strict';
    const KEY = 'ibmty:theme';
    const BARS = {
        light: '#FCFAF7',
        dark: '#14110E'
    };
    const system = window.matchMedia('(prefers-color-scheme: dark)');

    function read() {
        try {
            const value = JSON.parse(localStorage.getItem(KEY));
            return value === 'light' || value === 'dark' ? value : 'auto'
        } catch {
            return 'auto'
        }
    }
    let mode = read();
    const resolve = () => (mode === 'auto' ? (system.matches ? 'dark' : 'light') : mode);

    function apply() {
        const resolved = resolve();
        document.documentElement.dataset.bsTheme = resolved;
        const bar = document.querySelector('meta[name="theme-color"]');
        const installed = document.documentElement.dataset.display === 'standalone' && document.body;
        const page = installed ? getComputedStyle(document.body).getPropertyValue('--color-status-bar').trim() : '';
        if (bar) bar.content = page || BARS[resolved];
        document.dispatchEvent(new CustomEvent('ibmty:theme-change', {
            detail: {
                mode,
                resolved
            }
        }))
    }
    IBMty.theme = {
        get mode() {
            return mode
        },
        get resolved() {
            return resolve()
        },
        set(next) {
            mode = next === 'light' || next === 'dark' ? next : 'auto';
            try {
                if (mode === 'auto') localStorage.removeItem(KEY);
                else localStorage.setItem(KEY, JSON.stringify(mode))
            } catch {}
            apply()
        }
    };
    system.addEventListener('change', () => {
        if (mode === 'auto') apply();
    });
    document.documentElement.dataset.bsTheme = resolve();
    document.addEventListener('DOMContentLoaded', apply, {
        once: !0
    })
})(self.IBMty = self.IBMty || {})