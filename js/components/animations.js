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
    scaleExit: 0.9,
};
var SCROLL_TRIGGER_DEFAULTS = {
    start: ANIM.scrollStart,
    toggleActions: 'play none none none',
};

function initAnimations() {
    if (typeof ScrollTrigger === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.set('[data-gsap]', {
            opacity: 1,
            y: 0,
            x: 0,
            scale: 1
        });
        return
    }
    initPageTransition();
    initHeroAnimation();
    initSalvacionHero();
    initScrollAnimations();
    initSectionHeadingAnimations();
    initTextSplitAnimations();
    initNavbarAnimation();
    initModalAnimations()
}
var navigating = !1;

function initPageTransition() {
    if ('startViewTransition' in document) return;
    gsap.from('main', {
        opacity: 0,
        y: ANIM.ySm,
        duration: ANIM.durationReveal,
        ease: ANIM.ease,
        clearProps: 'all',
    });
    document.querySelectorAll('a[href]').forEach(function(link) {
        if (link.getAttribute('target') === '_blank' || link.getAttribute('href').indexOf('#') === 0 || link.id === 'whatsapp-fab') {
            return
        }
        if (link.classList.contains('tabbar-item')) return;
        if (link.dataset.pageLink && link.dataset.pageLink === document.body.dataset.page) return;
        try {
            var href = link.href;
            var isSameOrigin = new URL(href, window.location.origin).origin === window.location.origin;
            if (!isSameOrigin) return
        } catch (e) {
            return
        }
        link.addEventListener('click', function(e) {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
            if (navigating) return;
            e.preventDefault();
            navigating = !0;
            var url = link.href;
            var navigated = !1;

            function doNavigate() {
                if (navigated) return;
                navigated = !0;
                window.location.href = url
            }
            gsap.to('main', {
                opacity: 0,
                y: -ANIM.ySm,
                duration: ANIM.durationExit,
                ease: ANIM.easeInOut,
                onComplete: doNavigate,
            });
            setTimeout(doNavigate, Math.round(ANIM.durationExit * 1000) + 50)
        })
    })
}

function initHeroAnimation() {
    if (!document.getElementById('hero-section')) return;
    var heroTl = gsap.timeline({
        delay: ANIM.delayChrome,
        defaults: {
            duration: ANIM.durationReveal,
            ease: ANIM.ease,
        },
    });
    heroTl.from('#hero-content h1', {
        clipPath: 'inset(-15% 100% -15% 0%)',
        duration: ANIM.durationSlow,
    }, 0).from('#hero-parallax-bg', {
        scale: 1.06,
        duration: ANIM.durationSlow,
    }, 0).from('#hero-content p', {
        opacity: 0,
        y: ANIM.ySm,
    }, ANIM.heroLead).from('#hero-content .btn-app', {
        opacity: 0,
        y: ANIM.ySm,
    }, ANIM.heroAction);
    gsap.to('#hero-parallax-bg', {
        yPercent: 30,
        ease: ANIM.easeLinear,
        scrollTrigger: {
            trigger: '#hero-section',
            start: 'top top',
            end: 'bottom top',
            scrub: !0,
        },
    })
}

function initSalvacionHero() {
    if (!document.querySelector('.salvacion-hero')) return;
    var heroTl = gsap.timeline({
        delay: ANIM.delayChrome,
        defaults: {
            duration: ANIM.durationReveal,
        },
    });
    heroTl.from('.salvacion-hero-title', {
        clipPath: 'inset(-15% 100% -15% 0%)',
        duration: ANIM.durationSlow,
        ease: ANIM.ease,
    }, 0).from('.salvacion-hero .badge-outlined', {
        autoAlpha: 0,
        y: ANIM.ySm,
        ease: ANIM.ease,
    }, 0).from('.salvacion-hero-lead', {
        autoAlpha: 0,
        y: ANIM.ySm,
        ease: ANIM.ease,
    }, ANIM.heroLead)
}

function initScrollAnimations() {
    var SCROLL_VARIANTS = {
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
    Object.keys(SCROLL_VARIANTS).forEach(function(kind) {
        gsap.utils.toArray('[data-gsap="' + kind + '"]').forEach(function(el) {
            gsap.from(el, Object.assign({
                opacity: 0,
                duration: ANIM.durationReveal,
                ease: ANIM.ease,
                scrollTrigger: Object.assign({
                    trigger: el
                }, SCROLL_TRIGGER_DEFAULTS, {
                    start: _revealStart(el)
                })
            }, SCROLL_VARIANTS[kind]))
        })
    });
    gsap.utils.toArray('[data-gsap="stagger-children"]').forEach(function(container) {
        gsap.from(container.children, {
            opacity: 0,
            y: ANIM.y,
            duration: ANIM.durationReveal,
            ease: ANIM.ease,
            stagger: Math.min(ANIM.stagger, ANIM.staggerCap / container.children.length),
            scrollTrigger: Object.assign({
                trigger: container
            }, SCROLL_TRIGGER_DEFAULTS, {
                start: _revealStart(container)
            }),
        })
    });
    initClipReveals();
    initScrollLinked();
    initSalvacionTimeline();
    initCollapseRefresh()
}

function _revealStart(el) {
    return function() {
        return el.offsetHeight > window.innerHeight * 0.8 ? ANIM.scrollStartTall : ANIM.scrollStart
    }
}

function initClipReveals() {
    var wipe = function(el, trigger) {
        gsap.from(el, {
            clipPath: 'inset(-15% 100% -15% 0%)',
            duration: ANIM.durationReveal,
            ease: ANIM.ease,
            scrollTrigger: Object.assign({
                trigger: trigger || el
            }, SCROLL_TRIGGER_DEFAULTS, {
                start: _revealStart(trigger || el)
            }),
        })
    };
    gsap.utils.toArray('.section-heading-title').forEach(function(el) {
        wipe(el, el.closest('.section-heading') || el)
    });
    gsap.utils.toArray('.misioneros-legend').forEach(function(el) {
        wipe(el)
    })
}

function initScrollLinked() {
    var histImg = document.querySelector('.historia-img img');
    if (!histImg) return;
    gsap.fromTo(histImg, {
        clipPath: 'inset(0% 0% 100% 0%)',
        scale: 1.08,
    }, {
        clipPath: 'inset(0% 0% 0% 0%)',
        scale: 1,
        ease: ANIM.easeLinear,
        scrollTrigger: {
            trigger: '.historia-media',
            start: 'top 90%',
            end: 'top 45%',
            scrub: .5,
            invalidateOnRefresh: !0,
        },
    })
}

function initSalvacionTimeline() {
    var timeline = document.querySelector('.timeline');
    if (!timeline) return;
    var timelineItems = gsap.utils.toArray('.timeline-item');
    timelineItems.forEach(function(item) {
        var node = item.querySelector('.timeline-node');
        var card = item.querySelector('.card-app');
        var innerImg = item.querySelector('.timeline-inner-image');
        var tl = gsap.timeline({
            scrollTrigger: Object.assign({
                trigger: item
            }, SCROLL_TRIGGER_DEFAULTS),
        });
        if (node) {
            tl.from(node, {
                scale: 0,
                opacity: 0,
                duration: ANIM.durationFast,
                ease: ANIM.ease,
            })
        }
        var cardPos = node ? '-=0.3' : 0;
        if (innerImg) {
            tl.from(card, {
                y: ANIM.y,
                duration: ANIM.durationReveal,
                ease: ANIM.ease,
            }, cardPos).from(innerImg, {
                scale: 1.15,
                opacity: 0,
                duration: ANIM.durationReveal + 0.1,
                ease: ANIM.ease,
            }, '-=0.6')
        } else {
            tl.from(card, {
                y: ANIM.y,
                duration: ANIM.durationReveal,
                ease: ANIM.ease,
            }, cardPos)
        }
    })
}

function initCollapseRefresh() {
    ['shown.bs.collapse', 'hidden.bs.collapse'].forEach(function(ev) {
        document.addEventListener(ev, function() {
            ScrollTrigger.refresh()
        })
    })
}

function initSectionHeadingAnimations() {
    document.querySelectorAll('.section-heading').forEach(function(heading) {
        var lead = heading.querySelector('.section-heading-lead');
        var desc = heading.querySelector('.section-heading-desc');
        var tl = gsap.timeline({
            scrollTrigger: Object.assign({
                trigger: heading
            }, SCROLL_TRIGGER_DEFAULTS, {
                start: _revealStart(heading)
            }),
            defaults: {
                ease: ANIM.ease,
            },
        });
        if (lead) {
            tl.from(lead, {
                opacity: 0,
                y: ANIM.ySm,
                duration: ANIM.durationReveal,
            })
        }
        if (desc) {
            tl.from(desc, {
                opacity: 0,
                y: 14,
                duration: ANIM.durationFast,
            }, '-=0.25')
        }
    })
}

function initTextSplitAnimations() {
    var els = gsap.utils.toArray('main h1, main h2, main h3, main h4');
    els.forEach(function(el) {
        if (el.closest('#hero-section') || el.closest('.salvacion-hero') || el.closest('.section-heading') || el.querySelector('button') || el.querySelector('a')) return;
        if (el.children.length > 0) return;
        var words = el.textContent.trim().split(/\s+/);
        if (!words[0]) return;
        el.innerHTML = words.map(function(w) {
            return '<span class="sv-wrap"><span class="sv-inner">' + w + '</span></span>'
        }).join(' ');
        gsap.from(el.querySelectorAll('.sv-inner'), {
            y: '110%',
            duration: ANIM.durationReveal,
            stagger: {
                each: ANIM.staggerWords,
                from: 'start'
            },
            ease: ANIM.ease,
            scrollTrigger: Object.assign({
                trigger: el
            }, SCROLL_TRIGGER_DEFAULTS, {
                start: _revealStart(el)
            }),
        })
    })
}

function initNavbarAnimation() {
    var navbar = document.getElementById('navbar-web');
    if (!navbar) return;
    var navIntroShown = !1;
    try {
        navIntroShown = !!sessionStorage.getItem('navIntroShown');
        if (!navIntroShown) sessionStorage.setItem('navIntroShown', '1')
    } catch (err) {}
    if (!navIntroShown) {
        gsap.from(navbar, {
            y: -80,
            autoAlpha: 0,
            duration: ANIM.durationReveal,
            ease: ANIM.ease,
            delay: ANIM.delayChrome,
        })
    }
    ScrollTrigger.create({
        start: 'top -80px',
        onUpdate: function(self) {
            if (self.direction === -1) {
                gsap.to(navbar, {
                    y: 0,
                    autoAlpha: 1,
                    duration: ANIM.durationFast,
                    ease: ANIM.easeFeedback,
                    overwrite: 'auto',
                })
            } else {
                gsap.to(navbar, {
                    y: -100,
                    autoAlpha: 0,
                    duration: ANIM.durationFast,
                    ease: ANIM.easeFeedback,
                    overwrite: 'auto',
                })
            }
        },
    });
    navbar.addEventListener('focusin', function() {
        gsap.to(navbar, {
            y: 0,
            autoAlpha: 1,
            duration: ANIM.durationFast,
            ease: ANIM.easeFeedback,
            overwrite: 'auto',
        })
    })
}

function initModalAnimations() {
    if (typeof bootstrap === 'undefined' || !bootstrap.Modal) return;
    document.querySelectorAll('.modal').forEach(function(modalEl) {
        modalEl.addEventListener('show.bs.modal', function() {
            gsap.set(modalEl.querySelector('.modal-dialog'), {
                scale: ANIM.scaleIn,
                opacity: 0,
                y: ANIM.y,
            })
        });
        modalEl.addEventListener('shown.bs.modal', function() {
            gsap.to(modalEl.querySelector('.modal-dialog'), {
                scale: 1,
                opacity: 1,
                y: 0,
                duration: ANIM.durationReveal,
                ease: ANIM.ease,
            })
        });
        modalEl.addEventListener('hide.bs.modal', function(e) {
            if (modalEl.dataset.closing === 'true') return;
            e.preventDefault();
            modalEl.dataset.closing = 'true';
            gsap.to(modalEl.querySelector('.modal-dialog'), {
                scale: ANIM.scaleExit,
                opacity: 0,
                y: ANIM.ySm,
                duration: ANIM.durationFast,
                ease: ANIM.easeInOut,
                onComplete: function() {
                    var instance = bootstrap.Modal.getInstance(modalEl);
                    if (instance) instance.hide();
                },
            })
        });
        modalEl.addEventListener('hidden.bs.modal', function() {
            delete modalEl.dataset.closing;
            gsap.set(modalEl.querySelector('.modal-dialog'), {
                scale: 1,
                opacity: 1,
                y: 0
            })
        })
    })
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
    if (!document.getElementById('splash-screen')) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setTimeout(goToIndex, 200);
        return
    }
    var splashTl = gsap.timeline({
        onComplete: function() {
            gsap.to('#splash-screen', {
                opacity: 0,
                duration: ANIM.durationFast,
                ease: ANIM.easeInOut,
                onComplete: goToIndex,
            })
        },
    });
    splashTl.from('#splash-logo', {
        opacity: 0,
        scale: 0.92,
        duration: ANIM.durationReveal,
        ease: ANIM.easeFeedback,
    }).from('#splash-loader', {
        opacity: 0,
        duration: ANIM.durationExit,
    }, '-=0.15').to('.splash-progress-line', {
        scaleX: 1,
        duration: 0.45,
        ease: ANIM.ease,
    }, '-=0.1').from('.splash-subtitle', {
        opacity: 0,
        y: 4,
        duration: ANIM.durationReveal,
        ease: ANIM.ease,
    }, '<')
}

function initHintAnimations() {
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function setupHint(hintEl, observeEl, stopTarget, stopEvents) {
        if (!hintEl || !observeEl || reduce || typeof IntersectionObserver === 'undefined') return;
        var interacted = !1;

        function stop() {
            interacted = !0;
            hintEl.classList.remove('is-hinting')
        }

        function show() {
            if (interacted || reduce) return;
            hintEl.classList.add('is-hinting')
        }

        function bind() {
            stopEvents.forEach(function(ev) {
                stopTarget.addEventListener(ev, stop, {
                    once: !0,
                    passive: !0,
                    capture: !0
                })
            })
        }

        function unbind() {
            stopEvents.forEach(function(ev) {
                stopTarget.removeEventListener(ev, stop, {
                    capture: !0
                })
            })
        }
        var io = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    interacted = !1;
                    show();
                    bind()
                } else {
                    hintEl.classList.remove('is-hinting')
                    unbind()
                }
            })
        }, {
            threshold: 0.3
        });
        io.observe(observeEl)
    }
    document.querySelectorAll('.scroll-hint.hint').forEach(function(el) {
        if (reduce) return;
        var ticking = !1;

        function update() {
            ticking = !1;
            el.classList.toggle('is-hinting', window.scrollY < 30)
        }
        window.addEventListener('scroll', function() {
            if (ticking) return;
            ticking = !0;
            requestAnimationFrame(update)
        }, {
            passive: !0
        });
        update()
    });
    ['eventos-swiper', 'ministerios-swiper'].forEach(function(id) {
        var swiper = document.getElementById(id);
        if (!swiper) return;
        var hint = swiper.parentNode.querySelector('.carousel-hint');
        setupHint(hint, swiper, swiper, ['pointerdown', 'keydown'])
    });
    var mapEl = document.getElementById('missionaries-map');
    if (mapEl) {
        var mapHint = document.createElement('div');
        mapHint.className = 'hint map-hint';
        mapHint.setAttribute('aria-hidden', 'true');
        mapHint.innerHTML = '<svg class="icon" aria-hidden="true"><use href="assets/icons/icons.svg#i-pointer"></use></svg>Toca los pines o haz zoom';
        mapEl.appendChild(mapHint);
        setupHint(mapHint, mapEl, mapEl, ['pointerdown', 'keydown'])
    }
}
document.addEventListener('DOMContentLoaded', function() {
    var splash = document.getElementById('splash-screen');
    if (splash) initSplashFailsafe();
    if (typeof gsap === 'undefined') {
        var progress = splash ? splash.querySelector('.splash-progress-line') : null;
        if (progress) progress.style.transform = 'scaleX(1)';
        return
    }
    initAnimations();
    initHintAnimations();
    if (splash) initSplashAnimation()
});
window.addEventListener('pageshow', function(e) {
    navigating = !1;
    if (e.persisted && typeof gsap !== 'undefined') {
        gsap.set('main', {
            clearProps: 'all'
        })
    }
})