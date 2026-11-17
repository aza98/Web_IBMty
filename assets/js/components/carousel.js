/*
 * Carousels on [data-carousel]: a native scroll-snap row (.carousel-track of .carousel-slide),
 * swipeable and readable without JavaScript. This script adds the active card (.is-active),
 * the optional pagination named by the attribute value (a line of labels from each slide's
 * data-label whose marker travels to the active slide) and an optional sibling
 * [data-carousel-nav] with [data-carousel-prev] / [data-carousel-next] buttons, which loop from
 * the last slide to the first, and [data-carousel-count] («3 de 9»). Opens on the slide named
 * by the URL hash, otherwise the first with data-status="upcoming".
 */
(function(IBMty) {
    'use strict';

    function start(root) {
        const track = root.querySelector('.carousel-track');
        const slides = Array.from(track.children);
        const total = slides.length;
        const line = document.getElementById(root.dataset.carousel);
        const nav = root.parentElement.querySelector('[data-carousel-nav]');
        if (nav) nav.hidden = total < 2;
        if (!total) return;
        const count = nav && nav.querySelector('[data-carousel-count]');
        const snap = (slide) => {
            const left = slide.offsetLeft - (track.clientWidth - slide.offsetWidth) / 2;
            return Math.min(Math.max(left, 0), track.scrollWidth - track.clientWidth)
        };
        let current = 0;
        const mark = (index) => {
            current = index;
            slides.forEach((slide, i) => slide.classList.toggle('is-active', i === index));
            if (count) count.textContent = `${index + 1} de ${total}`;
            if (!line) return;
            Array.from(line.children).forEach((item, i) => {
                item.classList.toggle('is-active', i === index);
                if (i === index) item.setAttribute('aria-current', 'true');
                else item.removeAttribute('aria-current')
            });
            const item = line.children[index];
            line.style.setProperty('--marker-x', `${item.offsetLeft + item.offsetWidth / 2}px`)
        };
        const go = (index, behavior) => {
            index = (index + total) % total;
            track.scrollTo({
                left: snap(slides[index]),
                behavior
            });
            mark(index)
        };
        const settle = () => {
            const distance = (i) => Math.abs(snap(slides[i]) - track.scrollLeft);
            const closest = slides.reduce((best, _, i) => distance(i) < distance(best) ? i : best, current);
            if (closest !== current) mark(closest)
        };
        slides.forEach((slide, i) => slide.setAttribute('aria-label', `${i + 1} de ${total}`));
        if (line) {
            const e = IBMty.escapeHtml;
            line.innerHTML = slides.map((slide) => `<button type="button" class="month-line__item" data-status="${e(slide.dataset.status || '')}">` + `${e(slide.dataset.label)}<span class="visually-hidden">: ${e(slide.querySelector('h3')?.textContent.trim() || '')}</span></button>`).join('');
            Array.from(line.children).forEach((item, index) => item.addEventListener('click', () => go(index)))
        }
        if (nav) {
            nav.querySelector('[data-carousel-prev]')?.addEventListener('click', () => go(current - 1));
            nav.querySelector('[data-carousel-next]')?.addEventListener('click', () => go(current + 1))
        }
        let frame;
        track.addEventListener('scroll', () => {
            if (frame) return;
            frame = requestAnimationFrame(() => {
                frame = 0;
                settle()
            })
        }, {
            passive: !0
        });
        if (total > 1) {
            const hint = document.createElement('p');
            hint.className = 'carousel-hint';
            hint.innerHTML = `<svg viewBox="0 0 28 20" width="28" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
                <rect x="9.5" y="3.5" width="9" height="13" rx="2"/>
                <path d="M6 7 3 10l3 3m16-6 3 3-3 3"/>
            </svg><span>Desliza para ver más</span>`;
            root.append(hint);
            let reminder;
            let interacted = false;
            const dismiss = () => {
                interacted = true;
                hint.classList.add('is-dismissed');
                clearTimeout(reminder);
                reminder = setTimeout(() => hint.classList.remove('is-dismissed'), 12000)
            };
            ['pointerdown', 'keydown', 'click', 'wheel'].forEach((type) => root.addEventListener(type, dismiss, { passive: !0 }));
            track.addEventListener('scroll', () => {
                if (interacted) dismiss()
            }, { passive: !0 });
            nav?.addEventListener('click', dismiss);
            line?.addEventListener('click', dismiss)
        }
        new ResizeObserver(() => { settle(); mark(current) }).observe(track);
        const linked = location.hash ? slides.findIndex((slide) => `#${slide.id}` === location.hash) : -1;
        go(linked >= 0 ? linked : Math.max(slides.findIndex((slide) => slide.dataset.status === 'upcoming'), 0), 'instant');
        root.dataset.carouselReady = ''
    }
    IBMty.register('component:carousel', {
        init() {
            document.querySelectorAll('[data-carousel]').forEach(start)
        }
    })
})(self.IBMty = self.IBMty || {})
