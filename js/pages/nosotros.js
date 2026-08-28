document.addEventListener('DOMContentLoaded', function() {
    var form = document.getElementById('contact-form');
    var success = document.getElementById('contact-success');
    var config = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG) ? APP_CONFIG : {};
    if (form && config.appointments && config.appointments.formspreeEndpoint) {
        form.setAttribute('action', config.appointments.formspreeEndpoint)
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