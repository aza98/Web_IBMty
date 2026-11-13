/*
 * Donate: a link to #fund-local or #fund-missions (e.g. from About) opens with that
 * fund already chosen, so the account data below matches the link.
 */
(function(IBMty) {
    'use strict';
    IBMty.register('page:donate', {
        init() {
            const choose = () => {
                const input = document.getElementById(location.hash.slice(1));
                if (input?.matches('.fund__input')) input.checked = !0
            };
            choose();
            addEventListener('hashchange', choose)
        }
    })
})(self.IBMty = self.IBMty || {})