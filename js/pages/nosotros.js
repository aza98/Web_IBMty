document.addEventListener('DOMContentLoaded', function() {
    var form = document.getElementById('contact-form');
    var success = document.getElementById('contact-success');
    if (form && window.APP_CONFIG && APP_CONFIG.appointments && APP_CONFIG.appointments.formspreeEndpoint) {
        form.setAttribute('action', APP_CONFIG.appointments.formspreeEndpoint)
    }
    if (!form || !success) return;
    form.addEventListener('form-success', function() {
        form.classList.add('d-none');
        success.classList.remove('d-none');
        var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        success.scrollIntoView({
            behavior: reduced ? 'auto' : 'smooth',
            block: 'center'
        })
    })
})