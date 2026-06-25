function initAnalytics() {
    if (!APP_CONFIG.gaEnabled || !APP_CONFIG.gaTrackingId || APP_CONFIG.gaTrackingId.trim() === '') {
        return
    }
    var script = document.createElement('script');
    script.async = !0;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + APP_CONFIG.gaTrackingId;
    document.head.appendChild(script);
    window.dataLayer = window.dataLayer || [];

    function gtag() {
        window.dataLayer.push(arguments)
    }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', APP_CONFIG.gaTrackingId, {
        send_page_view: !1
    })
}

function trackEvent(category, action, label, value) {
    if (typeof window.gtag === 'function') {
        var eventParams = {
            event_category: category
        };
        if (label !== undefined) eventParams.event_label = label;
        if (value !== undefined) eventParams.value = value;
        window.gtag('event', action, eventParams)
    }
}

function trackPageView() {
    if (typeof window.gtag === 'function') {
        window.gtag('event', 'page_view', {
            page_title: document.title,
            page_path: window.location.pathname
        })
    }
}

function initAnalyticsEvents() {
    document.addEventListener('click', function(e) {
        var el = e.target.closest('[data-track-action]');
        if (!el) return;
        trackEvent(el.getAttribute('data-track-category') || 'general', el.getAttribute('data-track-action'), el.getAttribute('data-track-label'))
    })
}

function trackFormSubmit(formId, success) {
    var action = success ? 'form_submit_success' : 'form_submit_error';
    trackEvent('form', action, formId)
}
document.addEventListener('DOMContentLoaded', function() {
    initAnalytics();
    trackPageView();
    initAnalyticsEvents()
})