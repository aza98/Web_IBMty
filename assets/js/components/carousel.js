/*
 * Swiper on [data-carousel] elements. The attribute value is the id of an
 * optional pagination element, drawn as a line of labels (slide data-label)
 * whose marker travels to the active slide. Opens on the first slide with
 * data-status="upcoming", or on the slide named by the URL hash. An optional sibling [data-carousel-nav] holds
 * [data-carousel-prev] / [data-carousel-next] buttons and an optional [data-carousel-count]
 * that shows the position ("3 de 9"); data-carousel-align="start"
 * aligns slides to the left edge instead of centring the active one.
 * Slides loop endlessly; a short list is repeated (copies without id, data-share-id instead)
 * because Swiper's loop needs spare slides on both sides or it jumps over cards.
 * Without Swiper, CSS keeps a scroll-snap row.
 */
(function(IBMty) {
    'use strict';
    const LOOP_MIN = 8;

    function start(root) {
        const slides = Array.from(root.querySelectorAll('.swiper-slide'));
        const line = document.getElementById(root.dataset.carousel);
        const upcoming = slides.findIndex((slide) => slide.dataset.status === 'upcoming');
        const linked = location.hash ? slides.findIndex((slide) => `#${slide.id}` === location.hash) : -1;
        const nav = root.parentElement.querySelector('[data-carousel-nav]');
        if (!slides.length) {
            if (nav) nav.hidden = !0;
            return
        }
        const total = slides.length;
        const loop = total > 1;
        const wrapper = slides[0].parentElement;
        while (loop && wrapper.children.length < LOOP_MIN) slides.forEach((slide) => {
            const copy = slide.cloneNode(!0);
            copy.dataset.shareId = slide.id;
            copy.removeAttribute('id');
            wrapper.append(copy)
        });
        Array.from(wrapper.children).forEach((slide, i) => slide.setAttribute('aria-label', `${i % total + 1} de ${total}`));
        const count = nav && nav.querySelector('[data-carousel-count]');
        let swiper;
        if (line) {
            const e = IBMty.escapeHtml;
            line.innerHTML = slides.map((slide) => `<button type="button" class="month-line__item" data-status="${e(slide.dataset.status || '')}">` + `${e(slide.dataset.label)}<span class="visually-hidden">: ${e(slide.querySelector('h3')?.textContent.trim() || '')}</span></button>`).join('');
            Array.from(line.children).forEach((item, index) => item.addEventListener('click', () => swiper.slideToLoop(index)))
        }
        const update = (instance) => {
            const index = instance.realIndex % total;
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
        swiper = new Swiper(root, {
            loop,
            initialSlide: linked >= 0 ? linked : Math.max(upcoming, 0),
            centeredSlides: root.dataset.carouselAlign !== 'start',
            slidesPerView: 1.08,
            spaceBetween: 16,
            keyboard: {
                enabled: !0
            },
            breakpoints: {
                768: {
                    slidesPerView: 1.5,
                    spaceBetween: 24
                },
                1200: {
                    slidesPerView: 2,
                    spaceBetween: 32
                }
            },
            a11y: {
                slideLabelMessage: '',
                prevSlideMessage: 'Anterior',
                nextSlideMessage: 'Siguiente'
            },
            navigation: nav ? {
                prevEl: nav.querySelector('[data-carousel-prev]'),
                nextEl: nav.querySelector('[data-carousel-next]'),
                disabledClass: 'is-disabled'
            } : !1,
            on: {
                afterInit: update,
                slideChange: update,
                resize: update
            }
        })
    }
    IBMty.register('component:carousel', {
        init() {
            if (typeof Swiper !== 'function') return;
            document.querySelectorAll('[data-carousel]').forEach(start)
        }
    })
})(self.IBMty = self.IBMty || {})