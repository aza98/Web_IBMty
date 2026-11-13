/*
 * Shared scroll motion for pages built as a stack of sheets (components/sheets.css),
 * with GSAP + ScrollTrigger:
 * - each .sheet (and the footer of a [data-sheets] page) lifts into place as it arrives;
 * - outlined diamonds (.hero__diamonds, .sheet__diamonds) drift and turn at
 *   depth-based speeds; a [data-diamonds-lean] group also leans toward the pointer;
 * - [data-reveal] inside a sheet rises in once, each element as it reaches the viewport
 *   (ScrollTrigger.batch: those arriving together stagger in reading order);
 *   [data-reveal] outside a sheet (a page hero) rises in on load.
 * Trigger points are measured again when the page changes height (lists from JSON, the
 * missionary stage, lazy photos), so late layout never leaves content hidden.
 * Everything runs inside gsap.matchMedia: without GSAP or under reduced motion (also when
 * the preference changes with the page open) nothing moves and everything is visible.
 */
(function(IBMty) {
    'use strict';
    const HIDDEN = {
        autoAlpha: 0,
        y: 28,
        transition: 'none'
    };

    function show(items) {
        gsap.to(items, {
            autoAlpha: 1,
            y: 0,
            duration: 0.8,
            ease: 'expo.out',
            stagger: gsap.utils.distribute({
                amount: Math.min(0.1 * items.length, 0.6)
            }),
            overwrite: !0,
            clearProps: 'transform,transition'
        })
    }

    function lean(group) {
        const {
            toArray,
            distribute,
            mapRange,
            clamp,
            pipe
        } = gsap.utils;
        const area = group.parentElement;
        const shapes = toArray(group.children);
        const reach = distribute({
            base: 28,
            amount: -18
        });
        const movers = shapes.map((el, i) => ({
            x: gsap.quickTo(el, 'x', {
                duration: 0.9,
                ease: 'power3.out'
            }),
            reach: reach(i, el, shapes)
        }));
        let toUnit = null;
        const move = (event) => {
            if (!toUnit) {
                const rect = area.getBoundingClientRect();
                toUnit = pipe(mapRange(rect.left, rect.right, -1, 1), clamp(-1, 1))
            }
            const unit = toUnit(event.clientX);
            movers.forEach(({
                x,
                reach: r
            }) => x(unit * r))
        };
        const leave = () => {
            toUnit = null;
            movers.forEach(({
                x
            }) => x(0))
        };
        area.addEventListener('pointermove', move);
        area.addEventListener('pointerleave', leave);
        return () => {
            area.removeEventListener('pointermove', move);
            area.removeEventListener('pointerleave', leave)
        }
    }

    function remeasure() {
        const main = document.querySelector('main');
        if (!main || !('ResizeObserver' in window)) return () => {};
        let height = main.offsetHeight;
        let timer = 0;
        const observer = new ResizeObserver(() => {
            if (main.offsetHeight === height) return;
            height = main.offsetHeight;
            clearTimeout(timer);
            timer = setTimeout(() => ScrollTrigger.refresh(), 150)
        });
        observer.observe(main);
        return () => {
            observer.disconnect();
            clearTimeout(timer)
        }
    }

    function start() {
        const {
            toArray,
            distribute
        } = gsap.utils;
        const lifts = toArray('.sheet, [data-sheets] .site-footer').map((sheet) => ({
            sheet,
            tall: sheet.offsetHeight > window.innerHeight * 2,
            y: parseFloat(getComputedStyle(sheet).getPropertyValue('--sheet-lift')) || 72
        }));
        lifts.forEach(({
            sheet,
            tall,
            y
        }) => {
            if (tall) return;
            gsap.from(sheet, {
                y,
                ease: 'none',
                scrollTrigger: {
                    trigger: sheet,
                    start: 'top bottom',
                    end: 'top 55%',
                    scrub: 0.6
                }
            })
        });
        toArray('.hero__diamonds, .sheet__diamonds').forEach((group) => {
            const depth = distribute({
                base: 1,
                amount: -0.6
            });
            gsap.to(toArray(group.children), {
                y: (i, el, all) => -140 * depth(i, el, all),
                rotation: (i, el, all) => 90 * depth(i, el, all),
                ease: 'none',
                scrollTrigger: {
                    trigger: group.parentElement,
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: 1
                }
            })
        });
        const cleanups = window.matchMedia('(pointer: fine)').matches ? toArray('[data-diamonds-lean]').map(lean) : [];
        const reveals = toArray('[data-reveal]');
        const inSheets = reveals.filter((el) => el.closest('.sheet'));
        const onLoad = reveals.filter((el) => !el.closest('.sheet'));
        gsap.set(reveals, HIDDEN);
        if (onLoad.length) show(onLoad);
        if (inSheets.length) {
            ScrollTrigger.batch(inSheets, {
                start: 'top 88%',
                once: !0,
                onEnter: show
            })
        }
        cleanups.push(remeasure());
        return () => cleanups.forEach((cleanup) => cleanup())
    }
    IBMty.register('component:animations', {
        init() {
            if (typeof gsap !== 'object' || typeof ScrollTrigger !== 'function') return;
            gsap.registerPlugin(ScrollTrigger);
            gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', start)
        }
    })
})(self.IBMty = self.IBMty || {})