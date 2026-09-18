const STACK_BASE_OFFSET = 80;
const STACK_MIN_OFFSET = 8;

function _tallestCard(cards) {
    let tallest = 0;
    cards.forEach(function(wrapper) {
        const card = wrapper.querySelector('.card-app');
        if (card && card.offsetHeight > tallest) tallest = card.offsetHeight
    });
    return tallest
}

function _stackTopOffset(cards) {
    const fits = window.innerHeight - _tallestCard(cards) - STACK_MIN_OFFSET * 2;
    return Math.max(STACK_MIN_OFFSET, Math.min(STACK_BASE_OFFSET, fits))
}

function initSalvacionStack() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    const timeline = document.querySelector('.timeline');
    if (!timeline) return;
    const cards = gsap.utils.toArray('.timeline-item');
    if (!cards.length) return;
    if (cards.length < 2) return;
    gsap.registerPlugin(ScrollTrigger);
    gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', function() {
        const pinned = cards.slice(0, -1);
        let stackContext = null;
        let frame = 0;
        let active = !0;

        function update() {
            frame = 0;
            if (!active) return;
            const fits = _tallestCard(pinned) <= window.innerHeight - STACK_MIN_OFFSET * 2;
            if (fits === !!stackContext) return;
            if (stackContext) {
                stackContext.revert();
                stackContext = null
            }
            if (fits) {
                stackContext = gsap.context(function() {
                    pinned.forEach(function(wrapper, i) {
                        _pinStackCard(wrapper, i, cards)
                    })
                })
            }
            ScrollTrigger.refresh()
        }

        function schedule() {
            if (!frame && active) frame = requestAnimationFrame(update)
        }
        const observer = new ResizeObserver(schedule);
        pinned.forEach(function(wrapper) {
            observer.observe(wrapper.querySelector('.card-app'))
        });
        window.addEventListener('resize', schedule);
        if (document.fonts) document.fonts.ready.then(schedule);
        update();
        return function() {
            active = !1;
            cancelAnimationFrame(frame);
            observer.disconnect();
            window.removeEventListener('resize', schedule);
            if (stackContext) stackContext.revert()
        }
    })
}

function _pinStackCard(wrapper, i, cards) {
    const pinned = cards.slice(0, -1);
    const closer = cards[cards.length - 1];
    const stackTop = function() {
        return 'top ' + _stackTopOffset(pinned) + 'px'
    };
    gsap.to(wrapper.querySelector('.card-app'), {
        scale: 0.9 + 0.025 * i,
        rotationX: -10,
        transformOrigin: 'top center',
        ease: 'none',
        scrollTrigger: {
            trigger: wrapper,
            start: stackTop,
            endTrigger: closer,
            end: stackTop,
            pin: wrapper,
            pinSpacing: !1,
            scrub: !0,
            invalidateOnRefresh: !0,
            id: 'salv-stack-' + i,
        },
    })
}
var amenConfettiFrame = 0;

function launchAmenConfetti() {
    if (typeof confetti !== 'function') return;
    cancelAnimationFrame(amenConfettiFrame);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.hidden) return;
    const colors = ['#FFD700', '#FFFFFF', '#00C0F6', '#FFF3B0', '#A8D8EA'];
    const end = performance.now() + 3000;
    let lastBurst = 0;
    confetti({
        particleCount: 90,
        spread: 80,
        origin: {
            y: .55
        },
        colors: colors,
        scalar: 1.1,
        disableForReducedMotion: !0
    });

    function burst(now) {
        if (document.hidden || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            confetti.reset();
            return
        }
        if (now - lastBurst >= 80) {
            lastBurst = now;
            [0, 1].forEach(function(x) {
                confetti({
                    particleCount: 4,
                    angle: x ? 122 : 58,
                    spread: 50,
                    origin: {
                        x: x,
                        y: .6
                    },
                    colors: colors,
                    disableForReducedMotion: !0
                })
            })
        }
        if (now < end) amenConfettiFrame = requestAnimationFrame(burst)
    }
    amenConfettiFrame = requestAnimationFrame(burst)
}

function _appendDescribedBy(field, id) {
    const tokens = (field.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
    if (tokens.indexOf(id) === -1) tokens.push(id);
    field.setAttribute('aria-describedby', tokens.join(' '))
}

function _clearFollowupErrors(form) {
    form.classList.remove('form-success');
    form.querySelectorAll('.field-error').forEach(function(error) {
        error.remove()
    });
    form.querySelectorAll('.is-invalid').forEach(function(field) {
        field.classList.remove('is-invalid');
        field.removeAttribute('aria-invalid');
        const tokens = (field.getAttribute('aria-describedby') || '').split(/\s+/).filter(function(token) {
            return token && token !== 'salvacion-contact-error' && token.indexOf('-error') === -1
        });
        if (tokens.length) {
            field.setAttribute('aria-describedby', tokens.join(' '))
        } else {
            field.removeAttribute('aria-describedby')
        }
    })
}

function _showFollowupFieldError(field, message) {
    const errorId = field.id + '-error';
    const error = document.createElement('span');
    error.id = errorId;
    error.className = 'field-error';
    error.setAttribute('role', 'alert');
    error.textContent = message;
    field.classList.add('is-invalid');
    field.setAttribute('aria-invalid', 'true');
    _appendDescribedBy(field, errorId);
    const container = field.closest('.salvacion-field, .salvacion-consent') || field.parentNode;
    container.appendChild(error)
}

function _showFollowupContactError(form, phone, email) {
    const errorId = 'salvacion-contact-error';
    const error = document.createElement('span');
    error.id = errorId;
    error.className = 'field-error salvacion-contact-error';
    error.setAttribute('role', 'alert');
    error.textContent = 'Escribe un teléfono o correo para que podamos contactarte.';
    phone.classList.add('is-invalid');
    email.classList.add('is-invalid');
    phone.setAttribute('aria-invalid', 'true');
    email.setAttribute('aria-invalid', 'true');
    _appendDescribedBy(phone, errorId);
    _appendDescribedBy(email, errorId);
    form.querySelector('.salvacion-form-hint').insertAdjacentElement('afterend', error)
}

function _validateFollowupForm(form) {
    _clearFollowupErrors(form);
    const name = form.querySelector('#salvacion-followup-name');
    const age = form.querySelector('#salvacion-followup-age');
    const phone = form.querySelector('#salvacion-followup-phone');
    const email = form.querySelector('#salvacion-followup-email');
    const consent = form.querySelector('#salvacion-followup-consent');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9\s+()\-]+$/;
    let firstInvalid = null;

    function markInvalid(field, message) {
        _showFollowupFieldError(field, message);
        if (!firstInvalid) firstInvalid = field
    }
    if (!name.value.trim()) {
        markInvalid(name, 'Escribe tu nombre para saber cómo dirigirnos a ti.')
    } else if (name.value.trim().length < 2) {
        markInvalid(name, 'Escribe un nombre válido.')
    }
    if (age.value) {
        const numericAge = Number(age.value);
        if (!Number.isInteger(numericAge) || numericAge < 1 || numericAge > 120) {
            markInvalid(age, 'Ingresa una edad válida entre 1 y 120 años.')
        }
    }
    if (phone.value.trim()) {
        const phoneDigits = phone.value.replace(/\D/g, '');
        if (!phoneRegex.test(phone.value.trim()) || phoneDigits.length < 7 || phoneDigits.length > 15) {
            markInvalid(phone, 'Ingresa un número de teléfono válido.')
        }
    }
    if (email.value.trim() && !emailRegex.test(email.value.trim())) {
        markInvalid(email, 'Ingresa un correo electrónico válido.')
    }
    if (!phone.value.trim() && !email.value.trim()) {
        _showFollowupContactError(form, phone, email);
        if (!firstInvalid) firstInvalid = phone
    }
    if (!consent.checked) {
        markInvalid(consent, 'Necesitamos tu autorización para poder contactarte.')
    }
    if (firstInvalid) {
        firstInvalid.focus();
        return !1
    }
    return !0
}
document.addEventListener('DOMContentLoaded', function() {
    initSalvacionStack();
    const modalEl = document.getElementById('salvacion-modal');
    if (!modalEl || typeof bootstrap === 'undefined' || !bootstrap.Modal) return;
    const amenBtn = document.getElementById('amen-btn');
    const prayerStage = document.getElementById('salvacion-prayer-stage');
    const followupStage = document.getElementById('salvacion-followup-stage');
    const prayerActions = document.getElementById('salvacion-prayer-actions');
    const followupActions = document.getElementById('salvacion-followup-actions');
    const skipBtn = document.getElementById('salvacion-followup-skip');
    const followupForm = document.getElementById('salvacion-followup-form');
    const modalTitle = document.getElementById('salvacion-modal-label');
    const modalInstruction = document.getElementById('salvacion-modal-instruction');
    const modalIcon = modalEl.querySelector('.salvacion-cta-icon use');
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    const config = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG) ? APP_CONFIG : {};
    let celebrationPending = !1;
    let flowCompleted = !1;
    let flowCycle = 0;
    let submissionCycle = -1;
    if (!amenBtn || !prayerStage || !followupStage || !prayerActions || !followupActions || !skipBtn || !followupForm || !modalTitle || !modalInstruction) return;
    if (config.salvationFollowup && config.salvationFollowup.formspreeEndpoint) {
        followupForm.setAttribute('action', config.salvationFollowup.formspreeEndpoint)
    }

    function showStage(stage) {
        const isFollowup = stage === 'followup';
        prayerStage.hidden = isFollowup;
        prayerActions.hidden = isFollowup;
        followupStage.hidden = !isFollowup;
        followupActions.hidden = !isFollowup;
        modalEl.dataset.stage = stage;
        modalTitle.textContent = isFollowup ? '¡Ya eres parte de la familia de Dios!' : 'Oración de Invitación';
        modalInstruction.textContent = isFollowup ? 'Nos alegra celebrar este nuevo comienzo contigo' : 'Lee con fe y sinceridad';
        if (modalIcon) {
            modalIcon.setAttribute('href', 'assets/icons/icons.svg#' + (isFollowup ? 'i-circle-check' : 'i-heart-handshake'))
        }
        const modalBody = modalEl.querySelector('.modal-body');
        if (modalBody) modalBody.scrollTop = 0;
        if (isFollowup) {
            requestAnimationFrame(function() {
                modalTitle.focus({
                    preventScroll: !0
                })
            })
        }
    }

    function completeCelebration(source) {
        if (flowCompleted) return;
        flowCompleted = !0;
        celebrationPending = !0;
        if (typeof trackEvent === 'function') trackEvent('salvacion', 'seguimiento_completado', source);
        modal.hide()
    }
    amenBtn.addEventListener('click', function() {
        showStage('followup');
        if (typeof trackEvent === 'function') trackEvent('salvacion', 'seguimiento_mostrado')
    });
    skipBtn.addEventListener('click', function() {
        completeCelebration('sin_datos')
    });
    followupForm.addEventListener('input', function() {
        _clearFollowupErrors(followupForm)
    });
    followupForm.addEventListener('change', function() {
        _clearFollowupErrors(followupForm)
    });
    followupForm.addEventListener('submit', function(event) {
        event.preventDefault();
        if (!_validateFollowupForm(followupForm)) {
            if (typeof trackFormSubmit === 'function') trackFormSubmit(followupForm.id, !1);
            return
        }
        if (!followupForm.getAttribute('action') || typeof submitFormData !== 'function') {
            const error = document.createElement('span');
            error.className = 'field-error form-submit-error';
            error.setAttribute('role', 'alert');
            error.textContent = 'No pudimos preparar el envío. Inténtalo de nuevo en unos momentos.';
            followupActions.appendChild(error);
            return
        }
        submissionCycle = flowCycle;
        submitFormData(followupForm)
    });
    followupForm.addEventListener('form-success', function() {
        if (submissionCycle !== flowCycle || flowCompleted) return;
        completeCelebration('datos_enviados')
    });
    modalEl.addEventListener('shown.bs.modal', function() {
        flowCycle += 1;
        flowCompleted = !1;
        celebrationPending = !1;
        submissionCycle = -1;
        followupForm.reset();
        _clearFollowupErrors(followupForm);
        showStage('prayer');
        if (typeof trackEvent === 'function') trackEvent('salvacion', 'oracion_modal_open')
    });
    modalEl.addEventListener('hidden.bs.modal', function() {
        flowCompleted = !0;
        showStage('prayer');
        followupForm.reset();
        _clearFollowupErrors(followupForm);
        if (!celebrationPending) return;
        celebrationPending = !1;
        setTimeout(launchAmenConfetti, 100)
    })
})