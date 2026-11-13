// IBMty-specific settings and checks for tools/verify.mjs. Each check receives the shared
// context ({ ROOT, fail, warn, rel, walk, pages, checkLocalReference }) and may return a summary.
import {
    readdirSync,
    readFileSync
} from 'node:fs';
import {
    dirname,
    join,
    resolve
} from 'node:path';
import vm from 'node:vm';
const BLOCKS = ['skip link', 'header', 'footer', 'tabbar', 'boot'];
export default {
    namespace: 'IBMty',
    chrome: {
        reference: 'index.html',
        blocks: {
            'skip link': /<a class="?skip-link[^>]*>[\s\S]*?<\/a>/,
            header: /<header class="?site-header"?>[\s\S]*?<\/header>/,
            footer: /<footer class="?site-footer"?>[\s\S]*?<\/footer>/,
            tabbar: /<nav class="?tabbar"?[\s\S]*?<\/nav>/,
            boot: /<script src="?[^>]*boot\/theme\.js"?><\/script>\s*<script src="?[^>]*boot\/pwa-launch\.js"?><\/script>/
        },
        pages: Object.fromEntries(['pages/about.html', 'pages/salvation.html', 'pages/donate.html', 'pages/privacy.html', 'app/settings.html', 'app/offline.html'].map((page) => [page, BLOCKS]))
    },
    checks: {
        'content-fragments'({
            ROOT,
            fail
        }) {
            let scrolled = !1;
            const target = {
                scrollIntoView: () => {
                    scrolled = !0
                }
            };
            const container = {
                contains: (node) => node === target
            };
            const sandbox = {
                self: {
                    IBMty: {}
                },
                location: {
                    hash: ''
                },
                document: {
                    querySelector: () => container,
                    getElementById: (id) => id === 'á' ? target : null
                },
                requestAnimationFrame: (callback) => callback()
            };
            vm.runInNewContext(readFileSync(join(ROOT, 'assets/js/services/content.js'), 'utf8'), sandbox);
            for (const hash of ['', '#%', '#%E0%A4%A', '#%C3%A1']) {
                sandbox.location.hash = hash;
                sandbox.self.IBMty.content.fill('#list', ['rendered'], (item) => item);
                if (container.innerHTML !== 'rendered') fail(`content: did not render for ${hash}`);
            }
            if (!scrolled) fail('content: valid encoded fragment did not scroll to its target');
        },
        disclosures({
            ROOT,
            fail
        }) {
            let module, click, closing, opening = 0,
                cleared = !1;
            const events = {};
            const body = {};
            const panel = {
                open: !1,
                dataset: {},
                hasAttribute: () => Object.hasOwn(panel.dataset, 'closing'),
                querySelector: (selector) => selector === 'summary' ? {
                    addEventListener: (_, fn) => {
                        click = fn
                    }
                } : body,
                addEventListener() {}
            };
            const sandbox = {
                self: {
                    IBMty: {
                        register: (_, value) => {
                            module = value
                        }
                    }
                },
                document: {
                    querySelectorAll: () => [panel],
                    querySelector: () => null
                },
                window: {
                    addEventListener: (name, fn) => {
                        events[name] = fn
                    }
                },
                location: {
                    hash: ''
                },
                matchMedia: () => ({
                    matches: !1
                }),
                gsap: {
                    fromTo: () => {
                        opening++
                    },
                    to: (_, vars) => {
                        closing = vars.onComplete
                    },
                    killTweensOf: () => {
                        closing = null
                    },
                    set: () => {
                        cleared = !0
                    }
                }
            };
            vm.runInNewContext(readFileSync(join(ROOT, 'assets/js/components/disclosure.js'), 'utf8'), sandbox);
            module.init();
            const toggle = () => click({
                preventDefault() {}
            });
            toggle();
            toggle();
            toggle();
            if (!panel.open || panel.hasAttribute() || opening !== 2 || closing) fail('disclosure: rapid second click did not reverse closing');
            toggle();
            events.beforeprint();
            if (closing) closing();
            if (!panel.open || panel.hasAttribute() || !cleared) fail('disclosure: printing left a closing or hidden panel');
        },
        navigation({
            ROOT,
            fail,
            walk,
            rel
        }) {
            const destinations = {
                home: 'index.html',
                about: 'pages/about.html',
                salvation: 'pages/salvation.html',
                donate: 'pages/donate.html',
                settings: 'app/settings.html'
            };
            const attribute = (tag, name) => {
                const match = tag.match(new RegExp(`\\b${name}=(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`));
                return match ? match[1] ?? match[2] ?? match[3] : ''
            };
            for (const file of walk(ROOT, (path) => path.endsWith('.html'))) {
                const html = readFileSync(file, 'utf8');
                for (const [nav] of html.matchAll(/<nav\b[\s\S]*?<\/nav>/g)) {
                    const classes = attribute(nav, 'class').split(/\s+/);
                    const tabbar = classes.includes('tabbar');
                    if (!tabbar && !classes.includes('navbar') && attribute(nav, 'aria-labelledby') !== 'footer-pages') continue;
                    const expected = tabbar ? Object.keys(destinations) : Object.keys(destinations).filter((key) => key !== 'settings');
                    const links = [...nav.matchAll(/<a\b[^>]*>/g)].map(([tag]) => ({
                        key: attribute(tag, 'data-page-link'),
                        href: attribute(tag, 'href')
                    })).filter((link) => link.key);
                    if (links.map((link) => link.key).join(',') !== expected.join(',')) fail(`navigation: ${rel(file)} inconsistent page order`);
                    for (const link of links) {
                        if (!destinations[link.key] || resolve(dirname(file), link.href) !== join(ROOT, destinations[link.key])) fail(`navigation: ${rel(file)} incorrect ${link.key} destination`);
                    }
                }
            }
        },
        sharedStyles({
            ROOT,
            fail
        }) {
            const linked = (page) => [...readFileSync(join(ROOT, page), 'utf8').matchAll(/<link rel="?stylesheet"? href="?[^\s>]*?assets\/css\/((?:core|components)\/[\w-]+\.css)/g)].map(([, sheet]) => sheet);
            const reference = linked('index.html');
            for (const dir of ['core', 'components']) {
                for (const name of readdirSync(join(ROOT, 'assets/css', dir))) {
                    if (name.endsWith('.css') && !reference.includes(`${dir}/${name}`)) fail(`shared styles: index.html does not link assets/css/${dir}/${name}`);
                }
            }
            for (const page of ['pages/about.html', 'pages/salvation.html', 'pages/donate.html', 'pages/privacy.html', 'app/settings.html', 'app/offline.html']) {
                if (linked(page).join() !== reference.join()) fail(`shared styles: ${page} links different shared stylesheets than index.html`);
            }
        },
        vendorSubsets({
            ROOT,
            fail,
            walk,
            rel
        }) {
            const read = (path) => readFileSync(join(ROOT, path), 'utf8');
            const defines = (css, name) => new RegExp(`\\.${name}(?![\\w-])`).test(css);
            const full = ['bootstrap/5.3.8/css/bootstrap.min.css', 'fontawesome/7.3.1/css/fontawesome.min.css', 'fontawesome/7.3.1/css/brands.min.css'].map((path) => read(`vendor/${path}`)).join('');
            const subset = read('assets/css/core/bootstrap-subset.css') + read('assets/css/core/icons.css');
            for (const file of walk(ROOT, (path) => /\.(html|js|json)$/.test(path) && !path.includes('/tools/') && !path.endsWith('skills-lock.json'))) {
                const text = readFileSync(file, 'utf8');
                const used = new Set(text.match(/\bfa-[a-z0-9-]+/g) || []);
                for (const [, icon] of text.matchAll(/"icon"\s*:\s*"([a-z0-9-]+)"/g)) used.add(`fa-${icon}`);
                for (const [, quoted, bare] of text.matchAll(/\bclass(?:Name)?\s*=\s*(?:\\?["'`]([^"'`]*)|([\w-]+))/g)) {
                    for (const name of (quoted ?? bare).split(/\s+/))
                        if (/^[a-z][\w-]*$/.test(name)) used.add(name);
                }
                for (const name of used) {
                    if (defines(full, name) && !defines(subset, name)) fail(`vendor subset: ${rel(file)} uses .${name}, missing in assets/css/core/`);
                }
            }
        },
        countdown({
            ROOT,
            fail
        }) {
            const sandbox = {
                self: {},
                Intl,
                Date,
                Number,
                String,
                Object
            };
            sandbox.self.IBMty = {
                register: () => {}
            };
            vm.createContext(sandbox);
            for (const file of ['assets/js/core/version.js', 'assets/js/core/config.js', 'assets/js/core/schedule.js']) {
                vm.runInContext(readFileSync(join(ROOT, file), 'utf8'), sandbox, {
                    filename: file
                })
            }
            const config = sandbox.self.IBMty.config;
            const untilService = (now) => sandbox.self.IBMty.schedule.serviceState(now, config).untilStart;
            const cases = [
                ['2026-10-25T16:59:00Z', 60],
                ['2026-10-25T17:00:00Z', 0],
                ['2026-10-25T18:29:59Z', 0],
                ['2026-10-25T18:30:00Z', 7 * 86400 - 90 * 60],
                ['2026-10-21T17:00:00Z', 4 * 86400]
            ];
            for (const [iso, expected] of cases) {
                const actual = untilService(new Date(iso));
                if (actual !== expected) fail(`countdown: ${iso} gave ${actual}s, expected ${expected}s`);
            }
        },
        'latest-video'({
            ROOT,
            fail
        }) {
            const modules = {};
            const sandbox = {
                self: {
                    IBMty: {
                        register: (name, module) => {
                            modules[name] = module
                        }
                    }
                },
                Date
            };
            vm.createContext(sandbox);
            vm.runInContext(readFileSync(join(ROOT, 'assets/js/components/video.js'), 'utf8'), sandbox);
            const {
                pickLatest,
                isFresh
            } = modules['component:video'];
            const stream = (id, status, ended) => ({
                id,
                snippet: {
                    title: id,
                    liveBroadcastContent: status
                },
                liveStreamingDetails: ended ? {
                    actualEndTime: ended
                } : {}
            });
            const upload = (id) => ({
                id,
                snippet: {
                    title: id,
                    liveBroadcastContent: 'none'
                }
            });
            const picks = [
                [
                    [upload('video'), stream('sunday2', 'none', 'x'), stream('sunday1', 'none', 'x')], 'sunday2'
                ],
                [
                    [upload('video'), stream('now', 'live'), stream('sunday1', 'none', 'x')], 'now'
                ],
                [
                    [stream('next', 'upcoming'), stream('sunday1', 'none', 'x')], 'sunday1'
                ],
                [
                    [upload('video'), stream('next', 'upcoming')], null
                ]
            ];
            for (const [items, expected] of picks) {
                const actual = pickLatest(items)?.id ?? null;
                if (actual !== expected) fail(`latest-video: expected ${expected}, got ${actual}`);
            }
            const H = 3600 * 1000,
                now = 1_000_000 * H;
            const idle = {
                live: !1,
                sinceStart: 3 * 3600
            };
            const live = {
                live: !0,
                sinceStart: 600
            };
            const fresh = [
                [now - 1 * H, idle, !0],
                [now - 2 * H, idle, !1],
                [now - 60 * 1000, live, !0],
                [now - 3 * 60 * 1000, live, !1]
            ];
            for (const [at, state, expected] of fresh) {
                if (isFresh(at, now, state, 90) !== expected) fail(`latest-video: isFresh(${(now - at) / 60000} min, live=${state.live}) != ${expected}`);
            }
        }
    }
}