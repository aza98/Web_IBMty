function hasAnalyticsConsent() {
    try {
        return localStorage.getItem('cookieConsent') === 'accepted'
    } catch (error) {
        return !1
    }
}
var _analyticsStarted = !1;

function startAnalytics() {
    if (_analyticsStarted || !hasAnalyticsConsent()) return;
    var config = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG) ? APP_CONFIG : {};
    if (!config.gaEnabled || typeof config.gaTrackingId !== 'string' || config.gaTrackingId.trim() === '') {
        return
    }
    var trackingId = config.gaTrackingId.trim();
    _analyticsStarted = !0;
    var script = document.createElement('script');
    script.async = !0;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + trackingId;
    document.head.appendChild(script);
    window.dataLayer = window.dataLayer || [];

    function gtag() {
        window.dataLayer.push(arguments)
    }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', trackingId, {
        send_page_view: !1
    });
    trackPageView()
}

function trackEvent(category, action, label) {
    if (hasAnalyticsConsent() && typeof window.gtag === 'function') {
        var eventParams = {
            event_category: category
        };
        if (label !== undefined) eventParams.event_label = label;
        window.gtag('event', action, eventParams)
    }
}

function trackPageView() {
    if (hasAnalyticsConsent() && typeof window.gtag === 'function') {
        window.gtag('event', 'page_view', {
            page_title: document.title,
            page_path: window.location.pathname
        })
    }
}

function trackFormSubmit(formId, success) {
    var action = success ? 'form_submit_success' : 'form_submit_error';
    trackEvent('form', action, formId)
}

function initAnalyticsEvents() {
    document.addEventListener('click', function(e) {
        var el = e.target.closest('[data-track-action]');
        if (!el) return;
        trackEvent(el.getAttribute('data-track-category') || 'general', el.getAttribute('data-track-action'), el.getAttribute('data-track-label'))
    })
}
document.addEventListener('DOMContentLoaded', function() {
    initAnalyticsEvents();
    var consent = null;
    try {
        consent = localStorage.getItem('cookieConsent')
    } catch (err) {}
    if (consent === 'accepted') startAnalytics()
})