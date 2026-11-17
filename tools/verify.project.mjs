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
import {
    brotliDecompressSync
} from 'node:zlib';

// Codepoints in a WOFF2 font's cmap (formats 4 and 12). Tables follow the directory unpadded.
function woff2Codepoints(file) {
    const buffer = readFileSync(file);
    let at = 48;
    const base128 = () => {
        let value = 0;
        for (let i = 0; i < 5; i++) {
            const byte = buffer[at++];
            value = value * 128 + (byte & 127);
            if (!(byte & 128)) return value
        }
    };
    const tables = [];
    for (let i = 0; i < buffer.readUInt16BE(12); i++) {
        const flags = buffer[at++];
        const tag = (flags & 63) === 63 ? buffer.toString('latin1', at, at += 4) : flags & 63;
        const length = base128();
        const transformed = tag === 10 || tag === 11 ? flags >> 6 === 0 : flags >> 6 !== 0;
        tables.push([tag, transformed ? base128() : length]);
    }
    const data = brotliDecompressSync(buffer.subarray(at, at + buffer.readUInt32BE(20)));
    let cmap = 0;
    for (const [tag, length] of tables) {
        if (tag === 0) break;
        cmap += length
    }
    const u16 = (o) => data.readUInt16BE(o);
    const u32 = (o) => data.readUInt32BE(o);
    const points = new Set();
    for (let i = 0; i < u16(cmap + 2); i++) {
        const sub = cmap + u32(cmap + 8 + i * 8);
        if (u16(sub) === 4) {
            const segments = u16(sub + 6) / 2;
            for (let s = 0; s < segments; s++) {
                const end = u16(sub + 14 + s * 2);
                for (let c = u16(sub + 16 + segments * 2 + s * 2); c <= end && c !== 0xffff; c++) points.add(c)
            }
        } else if (u16(sub) === 12) {
            for (let g = 0; g < u32(sub + 12); g++) {
                for (let c = u32(sub + 16 + g * 12); c <= u32(sub + 20 + g * 12); c++) points.add(c)
            }
        }
    }
    return points
}
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
            let module, click;
            const events = {};
            const toggleAll = {
                setAttribute() {},
                querySelector: () => ({}),
                addEventListener: (_, fn) => {
                    click = fn
                }
            };
            const panels = ['a', 'b'].map((id) => ({
                id,
                open: !1,
                addEventListener() {}
            }));
            const sandbox = {
                self: {
                    IBMty: {
                        register: (_, value) => {
                            module = value
                        }
                    }
                },
                document: {
                    querySelectorAll: () => panels,
                    querySelector: () => toggleAll
                },
                window: {
                    addEventListener: (name, fn) => {
                        events[name] = fn
                    }
                },
                location: {
                    hash: '#b'
                }
            };
            vm.runInNewContext(readFileSync(join(ROOT, 'assets/js/components/disclosure.js'), 'utf8'), sandbox);
            module.init();
            if (panels[0].open || !panels[1].open) fail('disclosure: the fragment did not open only its panel');
            click();
            if (!panels.every((panel) => panel.open)) fail('disclosure: open all left a panel closed');
            click();
            if (panels.some((panel) => panel.open)) fail('disclosure: close all left a panel open');
            events.beforeprint();
            if (!panels.every((panel) => panel.open)) fail('disclosure: printing left a closed panel');
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
        serviceWorkerConfig({
            ROOT,
            fail
        }) {
            const sandbox = {
                self: {
                    IBMTY_RELEASE: {
                        version: '0'
                    }
                }
            };
            vm.runInNewContext(readFileSync(join(ROOT, 'service-worker/config.js'), 'utf8'), sandbox);
            if (!sandbox.self.IBMtySW?.config?.caches) fail('service worker: service-worker/config.js did not define IBMtySW.config (the worker would not install)');
        },
        iconFonts({
            ROOT,
            fail
        }) {
            const css = readFileSync(join(ROOT, 'assets/css/core/icons.css'), 'utf8');
            const cut = css.indexOf('Font Awesome 7 Brands');
            for (const section of [css.slice(0, cut), css.slice(cut)]) {
                const font = section.match(/src:\s*url\(([^)]+)\)/)[1];
                const points = woff2Codepoints(resolve(ROOT, 'assets/css/core', font));
                for (const [, name, hex] of section.matchAll(/\.(fa-[a-z0-9-]+)\s*\{\s*--fa:\s*"\\([0-9a-f]+)"/g)) {
                    if (!points.has(parseInt(hex, 16))) fail(`icon fonts: .${name} has no glyph in ${font.replace(/^(\.\.\/)+/, '')}; regenerate the subset (docs/development.md)`);
                }
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
            const full = ['bootstrap/5.3.9/css/bootstrap.min.css', 'fontawesome/7.3.1/css/fontawesome.min.css', 'fontawesome/7.3.1/css/brands.min.css'].map((path) => read(`vendor/${path}`)).join('');
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