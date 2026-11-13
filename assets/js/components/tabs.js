/*
 * Accessible tabs on [data-tabs] (WAI-ARIA tabs pattern, automatic activation).
 * Markup: buttons [role="tab"][aria-controls] and panels [role="tabpanel"].
 * Without JavaScript every panel stays visible, read in sequence.
 */
(function(IBMty) {
    'use strict';

    function start(root) {
        const tabs = Array.from(root.querySelectorAll('[role="tab"]'));
        const select = (tab, focus) => {
            tabs.forEach((other) => {
                const on = other === tab;
                other.setAttribute('aria-selected', String(on));
                other.tabIndex = on ? 0 : -1;
                document.getElementById(other.getAttribute('aria-controls')).hidden = !on
            });
            if (focus) tab.focus();
        };
        tabs.forEach((tab, index) => {
            tab.addEventListener('click', () => select(tab, !1));
            tab.addEventListener('keydown', (event) => {
                const moves = {
                    ArrowRight: 1,
                    ArrowLeft: -1,
                    Home: -index,
                    End: tabs.length - 1 - index
                };
                if (!(event.key in moves)) return;
                event.preventDefault();
                select(tabs[(index + moves[event.key] + tabs.length) % tabs.length], !0)
            })
        });
        root.dataset.tabsReady = '';
        select(tabs.find((tab) => tab.getAttribute('aria-selected') === 'true') || tabs[0], !1)
    }
    IBMty.register('component:tabs', {
        init() {
            document.querySelectorAll('[data-tabs]').forEach(start)
        }
    })
})(self.IBMty = self.IBMty || {})