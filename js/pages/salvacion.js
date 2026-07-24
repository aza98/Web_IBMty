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
    if (typeof gsap === 'undefined') return;
    const timeline = document.querySelector('.timeline');
    if (!timeline) return;
    const cards = gsap.utils.toArray('.timeline-item');
    if (!cards.length) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (cards.length < 2) return;
    const pinned = cards.slice(0, -1);
    if (_tallestCard(pinned) > window.innerHeight - STACK_MIN_OFFSET * 2) return;
    pinned.forEach(function(wrapper, i) {
        _pinStackCard(wrapper, i, cards)
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
        willChange: 'transform',
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

function launchAmenConfetti() {
    if (typeof confetti !== 'function') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const colors = ['#FFD700', '#FFFFFF', '#00C0F6', '#FFF3B0', '#A8D8EA'];
    const end = Date.now() + 3000;
    confetti({
        particleCount: 90,
        spread: 80,
        origin: {
            y: .55
        },
        colors: colors,
        scalar: 1.1
    });
    (function burst() {
        confetti({
            particleCount: 4,
            angle: 58,
            spread: 50,
            origin: {
                x: 0,
                y: .6
            },
            colors: colors
        });
        confetti({
            particleCount: 4,
            angle: 122,
            spread: 50,
            origin: {
                x: 1,
                y: .6
            },
            colors: colors
        });
        if (Date.now() < end) {
            requestAnimationFrame(burst)
        } else {
            confetti.reset()
        }
    })()
}
document.addEventListener('DOMContentLoaded', function() {
    initSalvacionStack();
    const modalEl = document.getElementById('salvacion-modal');
    if (!modalEl) return;
    const amenBtn = document.getElementById('amen-btn');
    let amenPending = !1;
    if (amenBtn) {
        amenBtn.addEventListener('click', function() {
            amenPending = !0;
            const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
            modal.hide()
        })
    }
    modalEl.addEventListener('shown.bs.modal', function() {
        if (typeof trackEvent === 'function') trackEvent('salvacion', 'oracion_modal_open')
    });
    modalEl.addEventListener('hidden.bs.modal', function() {
        if (!amenPending) return;
        amenPending = !1;
        setTimeout(launchAmenConfetti, 100)
    })
})