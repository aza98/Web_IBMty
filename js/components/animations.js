var ANIM = {
    durationReveal: 0.42,
    durationFast: 0.35,
    durationExit: 0.2,
    durationSlow: 0.8,
    ease: 'expo.out',
    easeFeedback: 'power2.out',
    easeInOut: 'power2.inOut',
    easeLinear: 'none',
    stagger: 0.1,
    staggerCap: 0.6,
    staggerWords: 0.04,
    delayChrome: 0.1,
    heroLead: 0.18,
    heroAction: 0.28,
    scrollStart: 'top 85%',
    scrollStartTall: 'top 70%',
    y: 40,
    ySm: 20,
    xSlide: 60,
    scaleIn: 0.85,
};
var SCROLL_TRIGGER_DEFAULTS = {
    start: ANIM.scrollStart,
    toggleActions: 'play none none none'
};

function _revealTrigger(element) {
    return Object.assign({}, SCROLL_TRIGGER_DEFAULTS, {
        trigger: element,
        start: function() {
            return element.offsetHeight > window.innerHeight * 0.8 ? ANIM.scrollStartTall : ANIM.scrollStart
        }
    })
}

function _reveal(target, properties, trigger) {
    return gsap.from(target, Object.assign({
        duration: ANIM.durationReveal,
        ease: ANIM.ease,
        scrollTrigger: _revealTrigger(trigger || target)
    }, properties))
}

function initAnimations() {
    if (typeof ScrollTrigger === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);
    if (document.fonts) document.fonts.ready.then(function() {
        ScrollTrigger.refresh()
    });
    ['shown.bs.collapse', 'hidden.bs.collapse'].forEach(function(event) {
        document.addEventListener(event, function() {
            ScrollTrigger.refresh()
        })
    });
    gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', function() {
        if (!('CSSViewTransitionRule' in window)) {
            gsap.from('main', {
                opacity: 0,
                duration: ANIM.durationReveal,
                ease: ANIM.ease,
                clearProps: 'opacity'
            })
        }
        initHeroAnimations();
        initScrollAnimations();
        initSalvacionTimeline();
        initSectionHeadingAnimations();
        var restoreText = initTextSplitAnimations();
        var restoreNavbar = initNavbarAnimation();
        return function() {
            restoreText();
            if (restoreNavbar) restoreNavbar()
        }
    })
}

function initHeroAnimations() {
    if (document.getElementById('hero-section')) {
        gsap.timeline({
            delay: ANIM.delayChrome,
            defaults: {
                duration: ANIM.durationReveal,
                ease: ANIM.ease
            }
        }).from('#hero-content h1', {
            clipPath: 'inset(-15% 100% -15% 0%)',
            duration: ANIM.durationSlow
        }, 0).from('#hero-parallax-bg', {
            scale: 1.06,
            duration: ANIM.durationSlow
        }, 0).from('#hero-content p', {
            opacity: 0,
            y: ANIM.ySm
        }, ANIM.heroLead).from('#hero-content .btn-app', {
            opacity: 0,
            y: ANIM.ySm
        }, ANIM.heroAction);
        gsap.to('#hero-parallax-bg', {
            yPercent: 30,
            ease: ANIM.easeLinear,
            scrollTrigger: {
                trigger: '#hero-section',
                start: 'top top',
                end: 'bottom top',
                scrub: !0
            }
        })
    }
    if (document.querySelector('.salvacion-hero')) {
        gsap.timeline({
            delay: ANIM.delayChrome,
            defaults: {
                duration: ANIM.durationReveal,
                ease: ANIM.ease
            }
        }).from('.salvacion-hero-title', {
            clipPath: 'inset(-15% 100% -15% 0%)',
            duration: ANIM.durationSlow
        }, 0).from('.salvacion-hero .badge-outlined', {
            autoAlpha: 0,
            y: ANIM.ySm
        }, 0).from('.salvacion-hero-lead', {
            autoAlpha: 0,
            y: ANIM.ySm
        }, ANIM.heroLead)
    }
}

function initScrollAnimations() {
    var variants = {
        'fade-up': {
            y: ANIM.y
        },
        'fade-left': {
            x: ANIM.xSlide
        },
        'fade-right': {
            x: -ANIM.xSlide
        },
        'scale-up': {
            scale: ANIM.scaleIn
        }
    };
    Object.keys(variants).forEach(function(kind) {
        document.querySelectorAll('[data-gsap="' + kind + '"]').forEach(function(element) {
            _reveal(element, Object.assign({
                opacity: 0,
                clearProps: 'opacity,transform'
            }, variants[kind]))
        })
    });
    document.querySelectorAll('[data-gsap="stagger-children"]').forEach(function(container) {
        _reveal(container.children, {
            opacity: 0,
            y: ANIM.y,
            stagger: Math.min(ANIM.stagger, ANIM.staggerCap / container.children.length),
            clearProps: 'opacity,transform'
        }, container)
    });
    document.querySelectorAll('.section-heading-title, .misioneros-legend').forEach(function(element) {
        _reveal(element, {
            clipPath: 'inset(-15% 100% -15% 0%)'
        }, element.closest('.section-heading') || element)
    });
    var image = document.querySelector('.historia-img img');
    if (image) {
        gsap.fromTo(image, {
            clipPath: 'inset(0% 0% 100% 0%)',
            scale: 1.08
        }, {
            clipPath: 'inset(0% 0% 0% 0%)',
            scale: 1,
            ease: ANIM.easeLinear,
            scrollTrigger: {
                trigger: '.historia-media',
                start: 'top 90%',
                end: 'top 45%',
                scrub: .5,
                invalidateOnRefresh: !0
            }
        })
    }
}

function initSalvacionTimeline() {
    document.querySelectorAll('.timeline-item').forEach(function(item) {
        var node = item.querySelector('.timeline-node');
        var card = item.querySelector('.card-app');
        var content = card.querySelector('.card-body') || card.querySelector('.timeline-step-title').parentNode;
        var image = item.querySelector('.timeline-inner-image');
        var timeline = gsap.timeline({
            defaults: {
                duration: ANIM.durationReveal,
                ease: ANIM.ease
            },
            scrollTrigger: Object.assign({
                trigger: item
            }, SCROLL_TRIGGER_DEFAULTS)
        });
        if (node) timeline.from(node, {
            scale: 0,
            opacity: 0,
            duration: ANIM.durationFast
        });
        timeline.from(content, {
            y: ANIM.y
        }, node ? '-=0.3' : 0);
        if (image) timeline.from(image, {
            scale: 1.15,
            opacity: 0,
            duration: ANIM.durationReveal + .1
        }, '<')
    })
}

function initSectionHeadingAnimations() {
    document.querySelectorAll('.section-heading').forEach(function(heading) {
        var lead = heading.querySelector('.section-heading-lead');
        var description = heading.querySelector('.section-heading-desc');
        var timeline = gsap.timeline({
            scrollTrigger: _revealTrigger(heading),
            defaults: {
                ease: ANIM.ease
            }
        });
        if (lead) timeline.from(lead, {
            opacity: 0,
            y: ANIM.ySm,
            duration: ANIM.durationReveal
        });
        if (description) timeline.from(description, {
            opacity: 0,
            y: 14,
            duration: ANIM.durationFast
        }, '-=0.25')
    })
}

function initTextSplitAnimations() {
    var originals = [];
    document.querySelectorAll('main h1, main h2, main h3, main h4').forEach(function(element) {
        if (element.children.length || element.closest('.modal, .collapse, .swiper, [data-gsap], .timeline, #hero-section, .salvacion-hero, .section-heading')) return;
        var words = element.textContent.trim().split(/\s+/);
        if (!words[0]) return;
        originals.push({
            element: element,
            text: element.textContent
        });
        element.replaceChildren();
        words.forEach(function(word, index) {
            var wrap = document.createElement('span');
            var inner = document.createElement('span');
            wrap.className = 'sv-wrap';
            inner.className = 'sv-inner';
            inner.textContent = word;
            wrap.appendChild(inner);
            if (index) element.appendChild(document.createTextNode(' '));
            element.appendChild(wrap)
        });
        _reveal(element.querySelectorAll('.sv-inner'), {
            y: '110%',
            stagger: ANIM.staggerWords
        }, element)
    });
    return function() {
        originals.forEach(function(original) {
            original.element.textContent = original.text
        })
    }
}

function initNavbarAnimation() {
    var navbar = document.getElementById('navbar-web');
    if (!navbar || document.body.classList.contains('is-pwa')) return;
    var shown = !0,
        previousScroll = window.scrollY,
        travel = 0,
        tween, introShown = !1;
    try {
        introShown = !!sessionStorage.getItem('navIntroShown');
        sessionStorage.setItem('navIntroShown', '1')
    } catch (error) {}
    if (!introShown) {
        tween = gsap.from(navbar, {
            yPercent: -100,
            y: -navbar.offsetTop - 24,
            opacity: 0,
            duration: ANIM.durationReveal,
            ease: ANIM.ease,
            delay: ANIM.delayChrome,
            clearProps: 'opacity,transform'
        })
    }

    function setShown(next) {
        if (shown === next) return;
        shown = next;
        if (tween) tween.kill();
        tween = gsap.to(navbar, {
            yPercent: next ? 0 : -100,
            y: next ? 0 : -navbar.offsetTop - 24,
            opacity: 1,
            duration: ANIM.durationFast,
            ease: ANIM.easeFeedback,
            overwrite: 'auto'
        })
    }
    var trigger = ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: function(self) {
            var scroll = self.scroll(),
                delta = scroll - previousScroll;
            previousScroll = scroll;
            travel = delta * travel < 0 ? delta : travel + delta;
            if (scroll < 80 || navbar.contains(document.activeElement) || navbar.querySelector('.show, .collapsing')) setShown(!0);
            else if (Math.abs(travel) > 10) setShown(travel < 0)
        }
    });

    function show() {
        setShown(!0)
    }
    navbar.addEventListener('focusin', show);
    navbar.addEventListener('show.bs.collapse', show);
    return function() {
        trigger.kill();
        if (tween) tween.kill();
        gsap.set(navbar, {
            clearProps: 'opacity,transform'
        });
        navbar.removeEventListener('focusin', show);
        navbar.removeEventListener('show.bs.collapse', show)
    }
}
var splashRedirected = !1;

function goToIndex() {
    if (splashRedirected) return;
    splashRedirected = !0;
    window.location.replace('index.html')
}

function initSplashFailsafe() {
    setTimeout(goToIndex, 2500)
}

function initSplashAnimation() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setTimeout(goToIndex, 200);
        return
    }
    gsap.timeline({
        onComplete: function() {
            gsap.to('#splash-screen', {
                opacity: 0,
                duration: ANIM.durationFast,
                ease: ANIM.easeInOut,
                onComplete: goToIndex
            })
        }
    }).from('#splash-logo', {
        opacity: 0,
        scale: .92,
        duration: ANIM.durationReveal,
        ease: ANIM.easeFeedback
    }).from('#splash-loader', {
        opacity: 0,
        duration: ANIM.durationExit
    }, '-=0.15').to('.splash-progress-line', {
        scaleX: 1,
        duration: .45,
        ease: ANIM.ease
    }, '-=0.1').from('.splash-subtitle', {
        opacity: 0,
        y: 4,
        duration: ANIM.durationReveal,
        ease: ANIM.ease
    }, '<')
}

function initHintAnimations() {
    var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    motion.addEventListener('change', function(event) {
        if (event.matches) document.querySelectorAll('.is-hinting').forEach(function(element) {
            element.classList.remove('is-hinting')
        })
    });

    function setupHint(hint, target) {
        if (!hint || motion.matches || typeof IntersectionObserver === 'undefined') return;
        var options = {
            once: !0,
            passive: !0,
            capture: !0
        };

        function unbind() {
            target.removeEventListener('pointerdown', stop, !0);
            target.removeEventListener('keydown', stop, !0)
        }

        function stop() {
            hint.classList.remove('is-hinting');
            observer.disconnect();
            unbind()
        }
        var observer = new IntersectionObserver(function(entries) {
            var visible = entries[0].isIntersecting;
            hint.classList.toggle('is-hinting', visible && !motion.matches);
            if (visible) {
                target.addEventListener('pointerdown', stop, options);
                target.addEventListener('keydown', stop, options)
            } else unbind()
        }, {
            threshold: .3
        });
        observer.observe(target)
    }
    var scrollHints = document.querySelectorAll('.scroll-hint.hint');
    if (scrollHints.length && !motion.matches) {
        var frame = 0;

        function update() {
            frame = 0;
            scrollHints.forEach(function(hint) {
                hint.classList.toggle('is-hinting', !motion.matches && window.scrollY < 30)
            })
        }
        window.addEventListener('scroll', function() {
            if (!frame) frame = requestAnimationFrame(update)
        }, {
            passive: !0
        });
        update()
    } ['eventos-swiper', 'ministerios-swiper'].forEach(function(id) {
        var swiper = document.getElementById(id);
        if (swiper) setupHint(swiper.parentNode.querySelector('.carousel-hint'), swiper)
    });
    var map = document.getElementById('missionaries-map');
    if (map) {
        var hint = document.createElement('div');
        hint.className = 'hint map-hint';
        hint.setAttribute('aria-hidden', 'true');
        hint.innerHTML = '<svg class="icon" aria-hidden="true"><use href="assets/icons/icons.svg#i-pointer"></use></svg>Toca los pines o haz zoom';
        map.appendChild(hint);
        setupHint(hint, map)
    }
}
document.addEventListener('DOMContentLoaded', function() {
    var splash = document.getElementById('splash-screen');
    if (splash) initSplashFailsafe();
    if (typeof gsap === 'undefined') {
        var progress = splash && splash.querySelector('.splash-progress-line');
        if (progress) progress.style.transform = 'scaleX(1)';
        return
    }
    if (splash) initSplashAnimation();
    else {
        initAnimations();
        initHintAnimations()
    }
});
window.addEventListener('pageshow', function(event) {
    if (event.persisted && typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh()
})