/*
 * Current year and navbar DOM order matching the mobile/desktop visual order.
 */
(function(IBMty) {
    'use strict';
    IBMty.register('component:navigation', {
        init() {
            const settings = document.querySelector('.navbar-settings');
            if (settings) {
                const desktop = matchMedia('(min-width: 768px)');
                const reorder = () => {
                    const focused = document.activeElement === settings;
                    if (desktop.matches) settings.parentElement.append(settings);
                    else settings.parentElement.prepend(settings);
                    if (focused) settings.focus({
                        preventScroll: !0
                    })
                };
                desktop.addEventListener('change', reorder);
                reorder()
            }
            const tabbar = document.querySelector('.tabbar__list');
            if (tabbar && typeof ResizeObserver === 'function') {
                const menu = document.createElement('details');
                const summary = document.createElement('summary');
                menu.className = 'tabbar-menu';
                menu.open = !0;
                summary.textContent = 'Menú';
                tabbar.before(menu);
                menu.append(summary, tabbar);
                new ResizeObserver(() => requestAnimationFrame(() => {
                    const compact = document.documentElement.clientWidth / parseFloat(getComputedStyle(document.documentElement).fontSize) < 22;
                    if (compact !== menu.hasAttribute('data-compact')) {
                        menu.toggleAttribute('data-compact', compact);
                        menu.open = !compact
                    }
                    if (menu.offsetHeight) document.documentElement.style.setProperty('--tabbar-size', `${menu.offsetHeight}px`);
                })).observe(menu)
            }
            document.querySelectorAll('[data-current-year]').forEach((el) => {
                el.textContent = String(new Date().getFullYear())
            })
        }
    })
})(self.IBMty = self.IBMty || {})