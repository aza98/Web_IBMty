/*
 * Folding panels on <details data-disclosure> with a .disclosure__body.
 * Native <details> works on its own; with GSAP the body eases open and closed.
 * A [data-disclosure-all] button opens or closes every panel, staggered with
 * gsap.utils.distribute. Reduced motion opens instantly. Everything opens before printing.
 */
(function(IBMty) {
    'use strict';
    IBMty.register('component:disclosure', {
        init() {
            const panels = Array.from(document.querySelectorAll('details[data-disclosure]'));
            if (!panels.length) return;
            const toggleAll = document.querySelector('[data-disclosure-all]');
            const animate = typeof gsap !== 'undefined' && !matchMedia('(prefers-reduced-motion: reduce)').matches;
            const isOpen = (panel) => panel.open && !panel.hasAttribute('data-closing');
            const sync = () => {
                if (!toggleAll) return;
                const allOpen = panels.every(isOpen);
                toggleAll.setAttribute('aria-expanded', String(allOpen));
                toggleAll.querySelector('[data-disclosure-label]').textContent = allOpen ? 'Cerrar todo' : 'Abrir todo'
            };
            const setOpen = (panel, open, delay = 0) => {
                if (isOpen(panel) === open) return;
                const body = panel.querySelector('.disclosure__body');
                if (!animate) {
                    panel.open = open;
                    sync();
                    return
                }
                gsap.killTweensOf(body);
                delete panel.dataset.closing;
                if (open) {
                    panel.open = !0;
                    gsap.fromTo(body, {
                        height: 0,
                        autoAlpha: 0
                    }, {
                        height: 'auto',
                        autoAlpha: 1,
                        duration: 0.45,
                        delay,
                        ease: 'expo.out',
                        clearProps: 'height,opacity,visibility'
                    });
                    sync()
                } else {
                    panel.dataset.closing = '';
                    sync();
                    gsap.to(body, {
                        height: 0,
                        autoAlpha: 0,
                        duration: 0.3,
                        delay,
                        ease: 'power2.inOut',
                        onComplete: () => {
                            delete panel.dataset.closing;
                            panel.open = !1;
                            gsap.set(body, {
                                clearProps: 'height,opacity,visibility'
                            });
                            sync()
                        }
                    })
                }
            };
            panels.forEach((panel) => {
                panel.querySelector('summary').addEventListener('click', (event) => {
                    event.preventDefault();
                    setOpen(panel, !isOpen(panel))
                });
                panel.addEventListener('toggle', sync)
            });
            if (toggleAll) {
                toggleAll.hidden = !1;
                toggleAll.addEventListener('click', () => {
                    const opening = !panels.every(isOpen);
                    const delay = animate ? gsap.utils.distribute({
                        amount: 0.3
                    }) : () => 0;
                    panels.forEach((panel, index) => setOpen(panel, opening, delay(index, panel, panels)))
                });
                sync()
            }
            const openFromHash = () => {
                const panel = panels.find((item) => `#${item.id}` === location.hash);
                if (panel) setOpen(panel, !0);
            };
            openFromHash();
            window.addEventListener('hashchange', openFromHash);
            window.addEventListener('beforeprint', () => {
                panels.forEach((panel) => {
                    if (typeof gsap !== 'undefined') {
                        const body = panel.querySelector('.disclosure__body');
                        gsap.killTweensOf(body);
                        gsap.set(body, {
                            clearProps: 'height,opacity,visibility'
                        })
                    }
                    delete panel.dataset.closing;
                    panel.open = !0
                });
                sync()
            })
        }
    })
})(self.IBMty = self.IBMty || {})