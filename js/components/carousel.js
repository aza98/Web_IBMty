document.addEventListener('DOMContentLoaded', function() {
    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function newestSlideIndex(elementId) {
        var el = document.getElementById(elementId);
        if (!el) return 0;
        return Math.max(0, el.querySelectorAll('.swiper-slide').length - 1)
    }

    function updateIndicator(swiper, indicator) {
        if (!indicator) return;
        indicator.textContent = (swiper.realIndex + 1) + ' / ' + swiper.slides.length
    }

    function syncSlideInteractivity(swiper) {
        var activeSlide = swiper.slides[swiper.activeIndex];
        if (!activeSlide) return;
        var focused = document.activeElement;
        var moveFocus = Array.from(swiper.slides).some(function(slide) {
            return slide !== activeSlide && slide.contains(focused)
        });
        Array.from(swiper.slides).forEach(function(slide) {
            slide.inert = slide !== activeSlide
        });
        if (moveFocus) swiper.el.focus({
            preventScroll: !0
        })
    }

    function equalizeCardHeights(swiper) {
        var cards = swiper.el.querySelectorAll('.card-app');
        if (!cards.length) return;
        cards.forEach(function(card) {
            card.style.minHeight = ''
        });
        var max = 0;
        cards.forEach(function(card) {
            var height = card.offsetHeight;
            if (height > max) max = height
        });
        if (max > 0) {
            cards.forEach(function(card) {
                card.style.minHeight = max + 'px'
            })
        }
        if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh()
    }

    function buildCarousel(elementId, scopeSelector, overrides) {
        var element = document.getElementById(elementId);
        if (!element || typeof Swiper === 'undefined' || (element.swiper && !element.swiper.destroyed)) return;
        var indicator = document.querySelector(scopeSelector + ' .carousel-indicator');
        if (indicator) {
            indicator.setAttribute('aria-live', 'polite');
            indicator.setAttribute('aria-atomic', 'true')
        }
        overrides = overrides || {};
        var heightFrame = 0;
        var swiper;
        var keyboardVisibility;
        var originalTabindex = element.getAttribute('tabindex');
        element.setAttribute('tabindex', '-1');

        function scheduleHeights() {
            if (heightFrame) return;
            heightFrame = requestAnimationFrame(function() {
                heightFrame = 0;
                if (swiper && !swiper.destroyed) equalizeCardHeights(swiper)
            })
        }

        function linkedSlideIndex() {
            var target;
            try {
                target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)))
            } catch (err) {}
            return Array.from(element.querySelectorAll('.swiper-slide')).findIndex(function(slide) {
                return target && (slide === target || slide.contains(target))
            })
        }

        function followHash() {
            var index = linkedSlideIndex();
            if (index < 0 || swiper.destroyed) return;
            swiper.slideTo(index, 0);
            syncSlideInteractivity(swiper)
        }
        var baseConfig = {
            effect: 'slide',
            grabCursor: !0,
            centeredSlides: !0,
            slidesPerView: 1.15,
            spaceBetween: 16,
            loop: !1,
            touchEventsTarget: 'container',
            speed: prefersReducedMotion ? 0 : 400,
            keyboard: {
                enabled: !1,
                onlyInViewport: !1
            },
            a11y: {
                enabled: !0,
                prevSlideMessage: 'Diapositiva anterior',
                nextSlideMessage: 'Diapositiva siguiente',
                firstSlideMessage: 'Esta es la primera diapositiva',
                lastSlideMessage: 'Esta es la última diapositiva',
                slideLabelMessage: 'Diapositiva {{index}} de {{slidesLength}}',
            },
            navigation: {
                nextEl: scopeSelector + ' .carousel-btn-next',
                prevEl: scopeSelector + ' .carousel-btn-prev',
            },
            on: {
                init: function() {
                    updateIndicator(this, indicator);
                    syncSlideInteractivity(this);
                    equalizeCardHeights(this)
                },
                slideChange: function() {
                    updateIndicator(this, indicator)
                },
                activeIndexChange: function() {
                    syncSlideInteractivity(this)
                },
                loopFix: function() {
                    syncSlideInteractivity(this)
                },
                transitionEnd: function() {
                    syncSlideInteractivity(this)
                },
                resize: scheduleHeights,
                destroy: function() {
                    cancelAnimationFrame(heightFrame);
                    if (keyboardVisibility) keyboardVisibility.disconnect();
                    element.removeEventListener('load', scheduleHeights, !0);
                    window.removeEventListener('hashchange', followHash);
                    Array.from(this.slides).forEach(function(slide) {
                        slide.inert = !1
                    });
                    element.querySelectorAll('.card-app').forEach(function(card) {
                        card.style.minHeight = ''
                    });
                    if (originalTabindex === null) element.removeAttribute('tabindex');
                    else element.setAttribute('tabindex', originalTabindex)
                },
            },
        };
        Object.assign(baseConfig, overrides);
        var linkedIndex = linkedSlideIndex();
        if (linkedIndex >= 0) baseConfig.initialSlide = linkedIndex;
        swiper = new Swiper(element, baseConfig);
        keyboardVisibility = new IntersectionObserver(function(entries) {
            if (swiper.destroyed) return;
            if (entries[0].isIntersecting) swiper.keyboard.enable();
            else swiper.keyboard.disable()
        });
        keyboardVisibility.observe(element);
        element.addEventListener('load', scheduleHeights, !0);
        window.addEventListener('hashchange', followHash);
        if (document.fonts) document.fonts.ready.then(function() {
            if (!swiper.destroyed) scheduleHeights()
        })
    }
    var responsiveBreakpoints = {
        640: {
            slidesPerView: 2,
            spaceBetween: 24
        },
        1024: {
            slidesPerView: 3,
            spaceBetween: 28
        },
        1280: {
            slidesPerView: 3,
            spaceBetween: 32
        },
    };
    buildCarousel('eventos-swiper', '#eventos', {
        rewind: !0,
        initialSlide: newestSlideIndex('eventos-swiper'),
        breakpoints: responsiveBreakpoints
    });
    buildCarousel('ministerios-swiper', '#lideres', {
        loop: !0,
        breakpoints: responsiveBreakpoints
    })
})