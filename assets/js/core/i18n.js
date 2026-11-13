/*
 * Client-side translation overlay. Spanish is the source language of the HTML and of
 * every string in JS; another language is applied in place: each exact Spanish text
 * (whitespace collapsed) maps to its translation, and the dictionary's patterns cover
 * text that mixes words with numbers or dates.
 *
 * Translates text nodes, aria-label/title/alt/placeholder and the description and
 * Open Graph meta. A MutationObserver translates content that modules render later;
 * switching back to Spanish restores the original text.
 *
 * Dictionaries register with IBMty.i18n.add(lang, { texts, patterns }) from assets/js/i18n/.
 * IBMty.i18n { lang, locale, set(lang), translate(text) }; emits ibmty:language-change.
 * The choice is stored under storage KEYS.lang; by default it follows the browser.
 */
(function(IBMty, document) {
    'use strict';
    const SOURCE = 'es';
    const LOCALES = {
        es: 'es-MX',
        en: 'en'
    };
    const sourceLang = document.documentElement.lang || SOURCE;
    const ATTRIBUTES = ['aria-label', 'title', 'alt', 'placeholder'];
    const META = ['meta[name="description"]', 'meta[property="og:title"]', 'meta[property="og:description"]'];
    const SKIP = /^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA|CODE)$/;
    const ATTRIBUTE_SELECTOR = `[${ATTRIBUTES.join('],[')}]`;
    const dictionaries = {};
    let current = SOURCE;
    const sourceText = new WeakMap();
    const shownText = new WeakMap();
    const sourceAttr = new WeakMap();

    function add(lang, {
        texts = {},
        patterns = []
    }) {
        const dictionary = dictionaries[lang] || (dictionaries[lang] = {
            texts: {},
            patterns: []
        });
        Object.assign(dictionary.texts, texts);
        dictionary.patterns.push(...patterns)
    }

    function translate(value) {
        const dictionary = dictionaries[current];
        if (!dictionary) return null;
        const [, before, body, after] = value.match(/^(\s*)([\s\S]*?)(\s*)$/);
        const key = body.replace(/\s+/g, ' ');
        if (!key) return null;
        let result = Object.prototype.hasOwnProperty.call(dictionary.texts, key) ? dictionary.texts[key] : null;
        if (result === null) {
            const pattern = dictionary.patterns.find(([test]) => test.test(key));
            if (pattern) result = key.replace(pattern[0], pattern[1]);
        }
        return result === null ? null : before + result + after
    }

    function localizeText(node) {
        const value = node.data;
        if (shownText.get(node) === value) return;
        sourceText.set(node, value);
        shownText.delete(node);
        if (current === SOURCE) return;
        const result = translate(value);
        if (result !== null && result !== value) {
            shownText.set(node, result);
            node.data = result
        }
    }

    function localizeAttribute(element, name) {
        const value = element.getAttribute(name);
        if (value === null) return;
        let record = sourceAttr.get(element);
        if (!record) {
            record = {};
            sourceAttr.set(element, record)
        }
        if (record[name] && record[name].shown === value) return;
        record[name] = {
            source: value,
            shown: null
        };
        if (current === SOURCE) return;
        const result = translate(value);
        if (result !== null && result !== value) {
            record[name].shown = result;
            element.setAttribute(name, result)
        }
    }

    function localizeTree(root) {
        if (root.nodeType === Node.TEXT_NODE) {
            if (root.parentNode && !SKIP.test(root.parentNode.nodeName)) localizeText(root);
            return
        }
        if (root.nodeType !== Node.ELEMENT_NODE || SKIP.test(root.nodeName)) return;
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
            acceptNode: (node) => (SKIP.test(node.parentNode.nodeName) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT)
        });
        while (walker.nextNode()) localizeText(walker.currentNode);
        for (const element of [root, ...root.querySelectorAll(ATTRIBUTE_SELECTOR)]) {
            for (const name of ATTRIBUTES) {
                if (element.hasAttribute && element.hasAttribute(name)) localizeAttribute(element, name);
            }
        }
    }

    function localizeMeta() {
        for (const selector of META) {
            const meta = document.querySelector(selector);
            if (meta) localizeAttribute(meta, 'content');
        }
    }

    function restoreSource(root) {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
            const node = walker.currentNode;
            if (shownText.get(node) === node.data) {
                node.data = sourceText.get(node);
                shownText.delete(node)
            }
        }
        for (const element of root.querySelectorAll(ATTRIBUTE_SELECTOR)) {
            const record = sourceAttr.get(element);
            for (const name of ATTRIBUTES) {
                if (record && record[name] && record[name].shown !== null && element.getAttribute(name) === record[name].shown) {
                    element.setAttribute(name, record[name].source);
                    record[name].shown = null
                }
            }
        }
        for (const selector of META) {
            const meta = document.querySelector(selector);
            const record = meta && sourceAttr.get(meta);
            if (record && record.content && record.content.shown !== null) {
                meta.setAttribute('content', record.content.source);
                record.content.shown = null
            }
        }
    }

    function detect() {
        const stored = IBMty.storage.get(IBMty.storage.KEYS.lang);
        if (stored === 'es' || stored === 'en') return stored;
        const preferred = (navigator.languages && navigator.languages[0]) || navigator.language || SOURCE;
        return /^en/i.test(preferred) ? 'en' : SOURCE
    }

    function apply(lang) {
        current = lang;
        document.documentElement.lang = lang === SOURCE ? sourceLang : lang;
        if (lang === SOURCE) {
            restoreSource(document.documentElement)
        } else {
            localizeTree(document.documentElement);
            localizeMeta()
        }
        IBMty.emit('language-change', lang)
    }
    IBMty.i18n = {
        add,
        translate,
        get lang() {
            return current
        },
        get locale() {
            return LOCALES[current] || current
        },
        set(lang) {
            IBMty.storage.set(IBMty.storage.KEYS.lang, lang);
            apply(lang)
        }
    };
    IBMty.register('core:i18n', {
        init() {
            new MutationObserver((records) => {
                for (const record of records) {
                    if (record.type === 'childList') record.addedNodes.forEach(localizeTree);
                    else if (record.type === 'characterData') localizeTree(record.target);
                    else if (record.type === 'attributes') localizeAttribute(record.target, record.attributeName);
                }
            }).observe(document.documentElement, {
                childList: !0,
                subtree: !0,
                characterData: !0,
                attributes: !0,
                attributeFilter: ATTRIBUTES
            });
            window.addEventListener('storage', (event) => {
                if (event.key === IBMty.storage.KEYS.lang) apply(detect());
            });
            apply(detect())
        }
    })
})(self.IBMty = self.IBMty || {}, document)