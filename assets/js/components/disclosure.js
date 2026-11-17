/*
 * Folding panels on <details data-disclosure>. Native <details> opens and closes; CSS animates
 * the height (::details-content in pages/privacy.css). A [data-disclosure-all] button opens or
 * closes every panel. Opening from a fragment and before printing.
 */
(function(IBMty) {
    'use strict';
    IBMty.register('component:disclosure', {
        init() {
            const panels = Array.from(document.querySelectorAll('details[data-disclosure]'));
            if (!panels.length) return;
            const toggleAll = document.querySelector('[data-disclosure-all]');
            const allOpen = () => panels.every((panel) => panel.open);
            const sync = () => {
                if (!toggleAll) return;
                toggleAll.setAttribute('aria-expanded', String(allOpen()));
                toggleAll.querySelector('[data-disclosure-label]').textContent = allOpen() ? 'Cerrar todo' : 'Abrir todo'
            };
            const setAll = (open) => panels.forEach((panel) => {
                panel.open = open
            });
            panels.forEach((panel) => panel.addEventListener('toggle', sync));
            if (toggleAll) {
                toggleAll.hidden = !1;
                toggleAll.addEventListener('click', () => setAll(!allOpen()));
                sync()
            }
            const openFromHash = () => {
                const panel = panels.find((item) => `#${item.id}` === location.hash);
                if (panel) panel.open = !0;
            };
            openFromHash();
            window.addEventListener('hashchange', openFromHash);
            window.addEventListener('beforeprint', () => setAll(!0))
        }
    })
})(self.IBMty = self.IBMty || {})
