/*
 * Application namespace and module registry.
 *
 * Every script registers itself with IBMty.register(name, { prepare, init }) and the
 * registry starts all modules once the DOM is ready, in script order. A failing
 * module is isolated so the page keeps working (progressive enhancement).
 * prepare() is optional and may be async: every prepare() finishes before the first
 * init(), so content rendered from assets/data/ exists when components start.
 *
 * Page modules use the name `page:<data-page>` and only run on that page.
 * IBMty.url(path) resolves a path from the site root, IBMty.root is the relative prefix
 * from this page to the root ('' or '../'), and IBMty.escapeHtml(value) escapes text
 * for template markup.
 */
(function(IBMty, document) {
    'use strict';

    const modules = new Map();
    let started = false;

    const applies = (name) => !name.startsWith('page:') || name === `page:${IBMty.page}`;

    function register(name, module) {
        if (modules.has(name)) throw new Error(`IBMty: module "${name}" already registered`);
        modules.set(name, module);
        if (started) initModule(name, module);
    }

    function initModule(name, module) {
        if (typeof module.init !== 'function' || !applies(name)) return;
        try {
            module.init(IBMty);
        } catch (error) {
            console.error(`IBMty: module "${name}" failed to start`, error);
        }
    }

    async function prepareModule(name, module) {
        if (typeof module.prepare !== 'function' || !applies(name)) return;
        try {
            await module.prepare(IBMty);
        } catch (error) {
            console.error(`IBMty: module "${name}" failed to prepare`, error);
        }
    }

    async function start() {
        IBMty.page = document.body.dataset.page || '';
        await Promise.all([...modules].map(([name, module]) => prepareModule(name, module)));
        started = true;
        modules.forEach((module, name) => initModule(name, module));
        emit('app:ready');
    }

    function emit(type, detail) {
        document.dispatchEvent(new CustomEvent(`ibmty:${type}`, {
            detail
        }));
    }

    function on(type, listener) {
        document.addEventListener(`ibmty:${type}`, listener);
    }

    const manifest = () => document.querySelector('link[rel="manifest"]');

    function url(path) {
        const link = manifest();
        return new URL(path, link ? link.href : document.baseURI).href;
    }

    function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, (character) => `&#${character.charCodeAt(0)};`);
    }

    Object.assign(IBMty, {
        register,
        emit,
        on,
        url,
        escapeHtml
    });
    Object.defineProperty(IBMty, 'root', {
        get: () => (manifest()?.getAttribute('href') || '').replace(/[^/]*$/, '')
    });

    document.addEventListener('DOMContentLoaded', start, {
        once: true
    });
})(self.IBMty = self.IBMty || {}, document);