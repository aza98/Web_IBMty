document.addEventListener('DOMContentLoaded', function() {
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
});

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