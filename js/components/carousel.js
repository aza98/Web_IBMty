document.addEventListener('DOMContentLoaded', function() {
    if (typeof Swiper === 'undefined') return;
    var motion = window.matchMedia('(prefers-reduced-motion: reduce)');

    function buildCarousel(id, scope, loop) {
        var element = document.getElementById(id);
        if (!element || (element.swiper && !element.swiper.destroyed)) return;
        var indicator = document.querySelector(scope + ' .carousel-indicator');
        var originalTabindex = element.getAttribute('tabindex');
        var frame = 0,
            swiper;
        element.setAttribute('tabindex', '-1');
        if (indicator) {
            indicator.setAttribute('aria-live', 'polite');
            indicator.setAttribute('aria-atomic', 'true')
        }

        function sync() {
            var active = this.slides[this.activeIndex];
            if (!active) return;
            if (indicator) indicator.textContent = (this.realIndex + 1) + ' / ' + this.slides.length;
            var moveFocus = this.slides.some(function(slide) {
                return slide !== active && slide.contains(document.activeElement)
            });
            this.slides.forEach(function(slide) {
                slide.inert = slide !== active
            });
            if (moveFocus) element.focus({
                preventScroll: !0
            })
        }

        function scheduleRefresh() {
            if (frame) return;
            frame = requestAnimationFrame(function() {
                frame = 0;
                if (!swiper.destroyed && typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh()
            })
        }

        function linkedSlideIndex() {
            var target;
            try {
                target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)))
            } catch (error) {}
            return Array.from(element.querySelectorAll('.swiper-slide')).findIndex(function(slide) {
                return target && (slide === target || slide.contains(target))
            })
        }

        function followHash() {
            var index = linkedSlideIndex();
            if (index < 0 || swiper.destroyed) return;
            if (swiper.animating) settle();
            swiper.slideTo(index, 0);
            sync.call(swiper)
        }

        function settle() {
            swiper.wrapperEl.getAnimations().forEach(function(animation) {
                animation.finish()
            });
            swiper.setTransition(0);
            swiper.setTranslate(swiper.translate);
            swiper.transitionEnd()
        }

        function syncMotion() {
            swiper.params.speed = motion.matches ? 0 : 400;
            if (motion.matches) settle()
        }
        var linked = linkedSlideIndex();
        swiper = new Swiper(element, {
            effect: 'slide',
            centeredSlides: !0,
            slidesPerView: 1.15,
            spaceBetween: 16,
            loop: loop,
            rewind: !loop,
            initialSlide: linked >= 0 ? linked : loop ? 0 : element.querySelectorAll('.swiper-slide').length - 1,
            grabCursor: !0,
            touchEventsTarget: 'container',
            speed: motion.matches ? 0 : 400,
            preventInteractionOnTransition: !0,
            keyboard: {
                enabled: !1,
                onlyInViewport: !1
            },
            a11y: {
                prevSlideMessage: 'Diapositiva anterior',
                nextSlideMessage: 'Diapositiva siguiente',
                firstSlideMessage: 'Esta es la primera diapositiva',
                lastSlideMessage: 'Esta es la última diapositiva',
                slideLabelMessage: 'Diapositiva {{index}} de {{slidesLength}}'
            },
            navigation: {
                nextEl: scope + ' .carousel-btn-next',
                prevEl: scope + ' .carousel-btn-prev'
            },
            breakpoints: {
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
                }
            },
            on: {
                init: function() {
                    sync.call(this);
                    scheduleRefresh()
                },
                slideChange: sync,
                activeIndexChange: sync,
                loopFix: sync,
                transitionEnd: sync,
                resize: scheduleRefresh,
                destroy: function() {
                    cancelAnimationFrame(frame);
                    motion.removeEventListener('change', syncMotion);
                    keyboardVisibility.disconnect();
                    element.removeEventListener('load', scheduleRefresh, !0);
                    window.removeEventListener('hashchange', followHash);
                    this.slides.forEach(function(slide) {
                        slide.inert = !1
                    });
                    if (originalTabindex === null) element.removeAttribute('tabindex');
                    else element.setAttribute('tabindex', originalTabindex)
                }
            }
        });
        var keyboardVisibility = new IntersectionObserver(function(entries) {
            if (swiper.destroyed) return;
            if (entries[0].isIntersecting) swiper.keyboard.enable();
            else swiper.keyboard.disable()
        });
        keyboardVisibility.observe(element);
        motion.addEventListener('change', syncMotion);
        element.addEventListener('load', scheduleRefresh, !0);
        window.addEventListener('hashchange', followHash);
        if (document.fonts) document.fonts.ready.then(function() {
            if (!swiper.destroyed) scheduleRefresh()
        })
    }
    buildCarousel('eventos-swiper', '#eventos', !1);
    buildCarousel('ministerios-swiper', '#lideres', !0)
})