/*
 * Salvation page: the path of steps (GSAP + ScrollTrigger) and the prayer modal.
 * - The path line follows the scroll and each diamond lights when its step arrives.
 * - Each illustration plays one timeline when reached; the scene builders below
 *   animate its parts (.ill__object, .ill__hand, .ill__ray...).
 * - Without GSAP, or with reduced motion, everything stays visible at rest.
 * - The modal goes prayer -> welcome (canvas-confetti) with an optional follow-up form.
 */
(function(IBMty) {
    'use strict';
    const SCENES = {
        condition(tl, $) {
            tl.fromTo($('.ill__whole'), {
                autoAlpha: 1,
                y: -56
            }, {
                y: 0,
                ease: 'power3.in',
                duration: 0.55
            }).fromTo($('.ill__object'), {
                autoAlpha: 0
            }, {
                autoAlpha: 1,
                duration: 0.05
            }).to($('.ill__whole'), {
                autoAlpha: 0,
                duration: 0.05
            }, '<').to($('.ill__object'), {
                keyframes: {
                    x: [-6, 6, -4, 3, 0]
                },
                duration: 0.45,
                ease: 'none'
            })
        },
        consequence(tl, $) {
            tl.from($('.ill__object'), {
                y: -64,
                autoAlpha: 0,
                stagger: 0.18
            }).to($('.ill__hand'), {
                y: 6,
                duration: 0.15,
                yoyo: !0,
                repeat: 1,
                ease: 'power1.inOut'
            }, '-=0.2')
        },
        gift(tl, $) {
            tl.from($('.ill__lid'), {
                x: 8,
                y: 16,
                rotation: 16,
                transformOrigin: '0% 100%',
                duration: 0.7
            }).from($('.ill__ray'), {
                scale: 0,
                autoAlpha: 0,
                transformOrigin: '50% 50%',
                stagger: 0.08
            }, '-=0.3')
        },
        accept(tl, $) {
            tl.from($('.ill__object'), {
                y: 44,
                scale: 0.4,
                autoAlpha: 0,
                transformOrigin: '50% 50%'
            }).to($('.ill__object'), {
                scale: 1.1,
                duration: 0.22,
                yoyo: !0,
                repeat: 1,
                ease: 'power1.inOut',
                transformOrigin: '50% 50%'
            })
        },
        door(tl, $) {
            tl.fromTo($('.ill__closed'), {
                autoAlpha: 1
            }, {
                autoAlpha: 0,
                duration: 0.35
            }, 0.25).fromTo($('.ill__object'), {
                autoAlpha: 0
            }, {
                autoAlpha: 1,
                duration: 0.35
            }, '<').from($('.ill__light'), {
                scaleY: 0,
                transformOrigin: '50% 0%',
                duration: 0.9
            }, '<0.1')
        },
        pray(tl, $) {
            tl.from($('.ill__object'), {
                y: 24,
                autoAlpha: 0,
                duration: 0.8
            }).from($('.ill__ray'), {
                scale: 0,
                autoAlpha: 0,
                transformOrigin: '50% 50%',
                stagger: 0.08
            }, '-=0.4')
        }
    };

    function startPath(gsap, ScrollTrigger) {
        const path = document.querySelector('[data-path]');
        const progress = path.querySelector('[data-path-progress]');
        const steps = path.querySelectorAll('[data-step]');
        steps.forEach((step) => ScrollTrigger.create({
            trigger: step,
            start: 'top 65%',
            onEnter: () => step.classList.add('is-reached'),
            onLeaveBack: () => step.classList.remove('is-reached')
        }));
        gsap.matchMedia().add({
            motion: '(prefers-reduced-motion: no-preference)',
            reduce: '(prefers-reduced-motion: reduce)'
        }, ({
            conditions
        }) => {
            if (conditions.reduce) {
                gsap.set(progress, {
                    autoAlpha: 1,
                    scaleY: 1
                });
                return
            }
            gsap.fromTo(progress, {
                autoAlpha: 1,
                scaleY: 0
            }, {
                scaleY: 1,
                ease: 'none',
                transformOrigin: '50% 0%',
                scrollTrigger: {
                    trigger: path,
                    start: 'top 65%',
                    end: 'bottom 65%',
                    scrub: !0
                }
            });
            document.querySelectorAll('[data-scene]').forEach((art) => {
                const $ = (selector) => art.querySelectorAll(selector);
                const tl = gsap.timeline({
                    defaults: {
                        duration: 0.6,
                        ease: 'expo.out'
                    },
                    scrollTrigger: {
                        trigger: art,
                        start: 'top 75%',
                        once: !0
                    }
                });
                SCENES[art.dataset.scene](tl, $)
            });
            gsap.timeline({
                defaults: {
                    duration: 0.9,
                    ease: 'expo.out'
                }
            }).from('[data-intro] > :not(.hero__diamonds)', {
                y: 24,
                autoAlpha: 0,
                stagger: 0.08
            })
        })
    }

    function startModal(modal) {
        const stages = modal.querySelectorAll('[data-stage]');
        const show = (name) => {
            stages.forEach((stage) => {
                stage.hidden = stage.dataset.stage !== name
            });
            modal.querySelector(`[data-stage="${name}"] [data-stage-title]`).focus()
        };
        modal.addEventListener('show.bs.modal', () => {
            stages.forEach((stage) => {
                stage.hidden = stage.dataset.stage !== 'prayer'
            })
        });
        modal.querySelector('[data-action="prayed"]').addEventListener('click', () => {
            show('welcome');
            if (typeof confetti === 'function') {
                confetti({
                    particleCount: 140,
                    spread: 75,
                    origin: {
                        y: 0.55
                    },
                    colors: ['#00C0F6', '#DB7A58', '#FCFAF7', '#1C1915'],
                    zIndex: 1100,
                    disableForReducedMotion: !0
                })
            }
        })
    }
    IBMty.register('page:salvation', {
        init() {
            const modal = document.getElementById('salvation-modal');
            if (modal) startModal(modal);
            if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
            gsap.registerPlugin(ScrollTrigger);
            startPath(gsap, ScrollTrigger)
        }
    })
})(self.IBMty = self.IBMty || {})