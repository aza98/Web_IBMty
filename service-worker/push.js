/*
 * Push notices through OneSignal (page side: assets/js/services/push.js). Its worker SDK
 * shows the notices and handles taps inside this worker. It loads only while features.push
 * and services.oneSignalAppId are set; importScripts only works during the worker's first
 * evaluation, so a new app id takes effect with the next worker update.
 */
(function(IBMty) {
    'use strict';

    const {
        features,
        services
    } = IBMty.config;
    if (!features.push || !services.oneSignalAppId) return;
    importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');
})(self.IBMty);