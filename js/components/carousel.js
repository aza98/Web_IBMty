document.addEventListener('DOMContentLoaded', function() {
    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function getTotalSlides(swiper) {
        var indexedSlides = new Set(Array.from(swiper.slides).map(function(slide) {
            return slide.getAttribute('data-swiper-slide-index')
        }).filter(function(index) {
            return index !== null
        }));
        return indexedSlides.size || swiper.slides.length
    }

    function updateIndicator(swiper, selector) {
        var indicator = document.querySelector(selector);
        if (!indicator) return;
        indicator.setAttribute('aria-live', 'polite');
        indicator.setAttribute('aria-atomic', 'true');
        var total = getTotalSlides(swiper);
        var current = swiper.params.loop ? swiper.realIndex + 1 : Math.min((swiper.snapIndex || swiper.realIndex) + 1, total);
        indicator.textContent = current + ' / ' + total
    }

    function equalizeCardHeights(swiper) {
        var cards = swiper.el.querySelectorAll('.card-app');
        if (!cards.length) return;
        cards.forEach(function(card) {
            card.style.minHeight = ''
        });
        var max = 0;
        cards.forEach(function(card) {
            if (card.offsetHeight > max) max = card.offsetHeight
        });
        if (max > 0) {
            cards.forEach(function(card) {
                card.style.minHeight = max + 'px'
            })
        }
    }

    function slideToHashTarget(swiper) {
        if (!swiper || !window.location.hash) return;
        var targetId = decodeURIComponent(window.location.hash.slice(1));
        if (!targetId) return;
        var targetIndex = -1;
        Array.from(swiper.slides).some(function(slide, index) {
            var hasTarget = Array.from(slide.querySelectorAll('.card-ministerio[id]')).some(function(card) {
                return card.id === targetId
            });
            if (!hasTarget) return !1;
            targetIndex = index;
            return !0
        });
        if (targetIndex < 0) return;
        swiper.slideTo(targetIndex, prefersReducedMotion ? 0 : 300);
        setTimeout(function() {
            var target = document.getElementById(targetId);
            if (!target) return;
            var scrollTarget = target.closest('.carousel-clip') || swiper.el;
            scrollTarget.scrollIntoView({
                behavior: prefersReducedMotion ? 'auto' : 'smooth',
                block: 'center',
                inline: 'nearest'
            })
        }, prefersReducedMotion ? 0 : 320)
    }

    function bindHashNavigation(swiper) {
        slideToHashTarget(swiper);
        window.addEventListener('load', function() {
            slideToHashTarget(swiper)
        });
        window.addEventListener('hashchange', function() {
            slideToHashTarget(swiper)
        })
    }

    var coverflowConfig = {
        rotate: 4,
        stretch: 0,
        depth: 48,
        modifier: 1,
        slideShadows: !1,
    };

    function buildCarousel(elementId, scopeSelector, overrides) {
        if (!document.getElementById(elementId)) return;
        var baseConfig = {
            effect: 'coverflow',
            grabCursor: !0,
            centeredSlides: !0,
            slidesPerView: 1.08,
            spaceBetween: 16,
            loop: !1,
            watchSlidesProgress: !0,
            speed: prefersReducedMotion ? 0 : 400,
            coverflowEffect: coverflowConfig,
            keyboard: {
                enabled: !0,
                onlyInViewport: !0
            },
            a11y: {
                enabled: !0,
                prevSlideMessage: 'Slide anterior',
                nextSlideMessage: 'Slide siguiente',
                firstSlideMessage: 'Este es el primer slide',
                lastSlideMessage: 'Este es el último slide',
            },
            navigation: {
                nextEl: scopeSelector + ' .carousel-btn-next',
                prevEl: scopeSelector + ' .carousel-btn-prev',
            },
            on: {
                init: function() {
                    updateIndicator(this, scopeSelector + ' .carousel-indicator');
                    equalizeCardHeights(this)
                },
                slideChange: function() {
                    updateIndicator(this, scopeSelector + ' .carousel-indicator')
                },
                snapIndexChange: function() {
                    updateIndicator(this, scopeSelector + ' .carousel-indicator')
                },
                resize: function() {
                    equalizeCardHeights(this)
                },
                imagesReady: function() {
                    equalizeCardHeights(this)
                },
            },
        };
        Object.assign(baseConfig, overrides);
        var swiper = new Swiper('#' + elementId, baseConfig);
        var clip = swiper.el.closest('.carousel-clip');
        if (clip) {
            clip.addEventListener('scroll', function() {
                clip.scrollLeft = 0;
                clip.scrollTop = 0
            }, {
                passive: !0
            })
        }
        swiper.el.querySelectorAll('img').forEach(function(img) {
            if (!img.complete) {
                img.addEventListener('load', function() {
                    equalizeCardHeights(swiper)
                }, {
                    once: !0
                })
            }
        });
        return swiper
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
        initialSlide: 3,
        breakpoints: responsiveBreakpoints
    });
    var ministeriosSwiper = buildCarousel('ministerios-swiper', '#lideres', {
        rewind: !0,
        breakpoints: responsiveBreakpoints
    });
    bindHashNavigation(ministeriosSwiper)
})
