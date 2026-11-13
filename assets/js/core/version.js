/*
 * Release identity shared by pages and the service worker.
 * Loaded with <script> in pages and importScripts() in sw.js, so it only uses `self`.
 * Bump `version` on every deploy: it drives cache names and update prompts.
 */
(function(scope) {
    'use strict';
    scope.IBMTY_RELEASE = Object.freeze({
        version: '8.0.0',
        date: '2026-11-13'
    })
})(self)