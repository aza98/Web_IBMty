/*
 * Privacy: the parts of the notice that describe an integration show only while that
 * integration is configured. [data-feature="analytics|push|forms"] marks one part;
 * [data-feature-any="push forms"] marks a group that shows while any of them is on.
 */
(function(IBMty) {
    'use strict';
    IBMty.register('page:privacy', {
        init(app) {
            const {
                features,
                services
            } = app.config;
            const active = {
                analytics: app.analytics.enabled,
                push: Boolean(features.push && services.oneSignalAppId),
                forms: Boolean(features.forms && Object.values(services.formEndpoints).some(Boolean))
            };
            document.querySelectorAll('[data-feature]').forEach((element) => {
                element.hidden = !active[element.dataset.feature]
            });
            document.querySelectorAll('[data-feature-any]').forEach((element) => {
                element.hidden = !element.dataset.featureAny.split(' ').some((name) => active[name])
            })
        }
    })
})(self.IBMty = self.IBMty || {})