#!/usr/bin/env node
// Dependency-free project checks. Requires Node.js 18+.
// This file is identical in RIBBI and IBMty; project-specific checks live in
// tools/verify.project.mjs, which exports { namespace, checks: { name: (ctx) => count? } }.
//
//   node tools/verify.mjs                   Run every check.
//   node tools/verify.mjs --write-hashes    Recompute vendor hashes into vendor/vendor.json.
//   node tools/verify.mjs --write-precache  Rebuild service-worker/precache-manifest.js.
//
// Common checks: vendor inventory (files, licenses, integrity, unlisted files); local
// references (exact letter case) in HTML, CSS url(), JS path strings, assets/data/*.json
// and the manifest; precache entries; chrome repeated across pages (project.chrome);
// translation coverage (every Spanish text in the HTML has an English entry, unless a
// dictionary lists it in `keep`); JS syntax.
import {
    createHash
} from 'node:crypto';
import {
    existsSync,
    readFileSync,
    readdirSync,
    statSync,
    writeFileSync
} from 'node:fs';
import {
    dirname,
    join,
    relative,
    resolve,
    sep
} from 'node:path';
import {
    fileURLToPath
} from 'node:url';
import {
    spawnSync
} from 'node:child_process';
import vm from 'node:vm';
import project from './verify.project.mjs';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const VENDOR_JSON = join(ROOT, 'vendor', 'vendor.json');
const IGNORED_DIRS = new Set(['.git', '.claude', '.agents', '.codex', '.gemini', '.impeccable', 'node_modules', 'vendor', 'tools', 'docs', 'source-assets']);
const PRECACHE_MANIFEST = join(ROOT, 'service-worker', 'precache-manifest.js');
const writeHashes = process.argv.includes('--write-hashes');
const writePrecache = process.argv.includes('--write-precache');
const errors = [];
const warnings = [];
const fail = (message) => errors.push(message);
const warn = (message) => warnings.push(message);
const rel = (path) => relative(ROOT, path).split(sep).join('/');

function walk(dir, filter, skip = IGNORED_DIRS) {
    const found = [];
    for (const entry of readdirSync(dir)) {
        if (entry === '.DS_Store') continue;
        const path = join(dir, entry);
        if (statSync(path).isDirectory()) {
            if (!skip.has(entry)) found.push(...walk(path, filter, skip));
        } else if (filter(path)) {
            found.push(path)
        }
    }
    return found
}

function integrity(path) {
    return 'sha384-' + createHash('sha384').update(readFileSync(path)).digest('base64')
}

function checkVendor() {
    const inventory = JSON.parse(readFileSync(VENDOR_JSON, 'utf8'));
    const listed = new Set([rel(VENDOR_JSON)]);
    for (const pkg of inventory.packages) {
        const base = join(ROOT, 'vendor', pkg.name, pkg.version);
        const id = `${pkg.name}@${pkg.version}`;
        if (!existsSync(base)) {
            fail(`vendor: missing directory for ${id}`);
            continue
        }
        if (!pkg.license) fail(`vendor: ${id} has no license identifier`);
        const licensePath = join(base, pkg.licenseFile || 'LICENSE');
        listed.add(rel(licensePath));
        if (!existsSync(licensePath)) fail(`vendor: ${id} has no license file`);
        for (const [file, expected] of Object.entries(pkg.files)) {
            const path = join(base, file);
            listed.add(rel(path));
            if (!existsSync(path)) {
                fail(`vendor: missing ${rel(path)}`);
                continue
            }
            const actual = integrity(path);
            if (writeHashes) pkg.files[file] = actual;
            else if (!expected) warn(`vendor: no hash recorded for ${rel(path)}`);
            else if (expected !== actual) fail(`vendor: integrity mismatch for ${rel(path)}`);
        }
    }
    for (const item of inventory.derived || []) {
        if (!existsSync(join(ROOT, item.path))) fail(`vendor: derived asset missing ${item.path}`);
    }
    for (const path of walk(join(ROOT, 'vendor'), () => !0, new Set())) {
        if (!listed.has(rel(path))) fail(`vendor: undeclared file ${rel(path)}`);
    }
    if (writeHashes) {
        inventory.reviewed = new Date().toISOString().slice(0, 10);
        writeFileSync(VENDOR_JSON, JSON.stringify(inventory, null, 2) + '\n');
        console.log('vendor/vendor.json hashes updated.')
    }
}

function existsExact(path) {
    if (!existsSync(path)) return !1;
    let current = ROOT;
    for (const part of rel(path).split('/')) {
        if (part === '..' || !readdirSync(current).includes(part)) return part === '..';
        current = join(current, part)
    }
    return !0
}

function checkLocalReference(fromFile, url, label) {
    if (!url || /^(?:[a-z][a-z0-9+.-]*:|\/\/|#|\$\{)/i.test(url)) return;
    const clean = decodeURI(url.split(/[?#]/)[0]);
    if (!clean) return;
    const target = clean.startsWith('/') ? join(ROOT, clean) : resolve(dirname(fromFile), clean);
    if (!existsSync(target)) fail(`${label}: ${rel(fromFile)} -> ${url} not found`);
    else if (!existsExact(target)) fail(`${label}: ${rel(fromFile)} -> ${url} differs in letter case`);
}
const LOCAL_PATH = /^(?:assets|vendor|pages|app|service-worker)\/[^\s'"`$]+\.[a-z0-9]+$/i;

function checkCss() {
    const sheets = walk(join(ROOT, 'assets', 'css'), (path) => path.endsWith('.css'));
    for (const sheet of sheets) {
        for (const [, url] of readFileSync(sheet, 'utf8').matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) {
            if (!url.startsWith('data:')) checkLocalReference(sheet, url, 'css');
        }
    }
    return sheets.length
}

function checkScriptPaths() {
    for (const script of [join(ROOT, 'sw.js'), ...walk(ROOT, (path) => path.endsWith('.js'))]) {
        for (const [, value] of readFileSync(script, 'utf8').matchAll(/['"`]((?:assets|vendor|pages|app|service-worker)\/[^'"`\s$]+\.[a-z0-9]+)['"`]/gi)) {
            checkLocalReference(join(ROOT, 'index.html'), value, `js ${rel(script)}`)
        }
    }
}

function checkData() {
    const dir = join(ROOT, 'assets', 'data');
    if (!existsSync(dir)) return 0;
    const files = readdirSync(dir).filter((name) => name.endsWith('.json'));
    const visit = (value, file) => {
        if (typeof value === 'string' && LOCAL_PATH.test(value)) checkLocalReference(join(ROOT, 'index.html'), value, `data ${file}`);
        else if (value && typeof value === 'object') Object.values(value).forEach((item) => visit(item, file));
    };
    for (const file of files) visit(JSON.parse(readFileSync(join(dir, file), 'utf8')), file);
    return files.length
}
const pages = () => walk(ROOT, (path) => path.endsWith('.html'));

function checkHtml() {
    const attr = /\s(?:href|src)=(?:"([^"]+)"|'([^']+)'|([^\s"'>]+))/g;
    const list = pages();
    for (const page of list) {
        const html = readFileSync(page, 'utf8');
        if (!/^<!doctype html>/i.test(html)) fail(`html: ${rel(page)} lacks <!doctype html>`);
        if (!/<html[^>]+lang=["']?es/.test(html)) fail(`html: ${rel(page)} lacks lang="es…"`);
        if (!/<title>[^<]+<\/title>/.test(html)) fail(`html: ${rel(page)} lacks <title>`);
        for (const [, double, single, bare] of html.matchAll(attr)) checkLocalReference(page, double || single || bare, 'html')
    }
    return list.length
}

function checkManifest() {
    const path = join(ROOT, 'manifest.webmanifest');
    const manifest = JSON.parse(readFileSync(path, 'utf8'));
    for (const key of ['id', 'name', 'short_name', 'start_url', 'scope', 'display', 'icons']) {
        if (!(key in manifest)) fail(`manifest: missing "${key}"`);
    }
    checkLocalReference(path, manifest.start_url, 'manifest');
    for (const icon of manifest.icons || []) checkLocalReference(path, icon.src, 'manifest')
}

function readPrecacheManifest() {
    const sandbox = {
        self: {}
    };
    vm.createContext(sandbox);
    vm.runInContext(readFileSync(PRECACHE_MANIFEST, 'utf8'), sandbox, {
        filename: 'precache-manifest.js'
    });
    return sandbox.self[`${project.namespace}SW`].precacheManifest
}

function collectPrecache(list, extra, ignore = []) {
    const files = new Map();
    const isLocal = (url) => url && !/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(url);
    const add = (path) => {
        const key = rel(path);
        if (files.has(key) || !existsSync(path) || ignore.some((prefix) => key.startsWith(prefix))) return;
        files.set(key, createHash('md5').update(readFileSync(path)).digest('hex').slice(0, 12));
        if (path.endsWith('.css')) {
            for (const [, url] of readFileSync(path, 'utf8').matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) {
                if (isLocal(url)) add(resolve(dirname(path), url.split(/[?#]/)[0]));
            }
        }
        if (path.endsWith('.webmanifest')) {
            for (const icon of JSON.parse(readFileSync(path, 'utf8')).icons || []) add(resolve(dirname(path), icon.src))
        }
    };
    for (const page of list) {
        const file = join(ROOT, page);
        add(file);
        for (const [tag] of readFileSync(file, 'utf8').matchAll(/<(?:link|script)\b[^>]*>/g)) {
            const [, double, single, bare] = tag.match(/\s(?:href|src)=(?:"([^"]+)"|'([^']+)'|([^\s"'>]+))/) || [];
            const url = double || single || bare;
            if (isLocal(url)) add(resolve(dirname(file), url.split(/[?#]/)[0]));
        }
    }
    for (const path of extra) {
        const full = join(ROOT, path);
        if (existsSync(full) && statSync(full).isDirectory()) walk(full, () => !0).forEach(add);
        else add(full)
    }
    return Object.fromEntries([...files].sort(([a], [b]) => a.localeCompare(b)))
}

function checkPrecache() {
    const manifest = readPrecacheManifest();
    const expected = collectPrecache(manifest.pages, manifest.extra, manifest.ignore);
    if (writePrecache) {
        const source = readFileSync(PRECACHE_MANIFEST, 'utf8');
        const block = (name, value) => `    ${name}: ${JSON.stringify(value, null, 2).replace(/\n/g, '\n    ')}`;
        const keys = ['pages', 'extra', ...(manifest.ignore ? ['ignore'] : [])];
        const body = [...keys.map((key) => block(key, manifest[key])), block('files', expected)].join(',\n');
        writeFileSync(PRECACHE_MANIFEST, source.replace(/SW\.precacheManifest = \{[\s\S]*?\n {2}\};/, `SW.precacheManifest = {\n${body}\n  };`));
        console.log(`service-worker/precache-manifest.js rebuilt (${Object.keys(expected).length} files).`);
        return Object.keys(expected).length
    }
    if (!manifest.pages.length) fail('precache: no pages listed in service-worker/precache-manifest.js');
    const keys = new Set([...Object.keys(expected), ...Object.keys(manifest.files)]);
    const stale = [...keys].filter((key) => expected[key] !== manifest.files[key]);
    if (stale.length) {
        fail(`precache: ${stale.length} file(s) changed or missing in the manifest (${stale.slice(0, 5).join(', ')}${stale.length > 5 ? ', …' : ''}); run node tools/verify.mjs --write-precache`)
    }
    for (const url of Object.keys(manifest.files)) checkLocalReference(join(ROOT, 'sw.js'), url, 'precache');
    return Object.keys(manifest.files).length
}

function checkChrome() {
    const chrome = project.chrome;
    if (!chrome) return 0;
    const block = (page, name) => {
        const html = readFileSync(join(ROOT, page), 'utf8');
        const match = html.match(chrome.blocks[name]);
        if (!match) return null;
        return match[0].replace(/(\s[\w:-]+)=(?:'([^']*)'|([^\s"'>]+))/g, (all, attr, q, b) => `${attr}="${q ?? b}"`).replace(/(\s(?:href|src)=)(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g, (all, attr, d, q, b) => {
            const url = d ?? q ?? b;
            if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(url)) return `${attr}"${url}"`;
            return `${attr}"/${rel(resolve(dirname(join(ROOT, page)), url))}"`
        }).replace(/\saria-current="page"/g, '').replace(/\s+/g, ' ').replace(/>\s+/g, '>').replace(/\s+</g, '<')
    };
    let compared = 0;
    for (const [page, names] of Object.entries(chrome.pages)) {
        for (const name of names) {
            const expected = block(chrome.reference, name);
            const actual = block(page, name);
            if (expected === null) {
                fail(`chrome: ${chrome.reference} has no ${name}`);
                continue
            }
            compared++;
            if (actual === null) {
                fail(`chrome: ${page} has no ${name}`);
                continue
            }
            if (actual !== expected) {
                let i = 0;
                while (i < actual.length && actual[i] === expected[i]) i++;
                fail(`chrome: ${page} ${name} differs from ${chrome.reference} near …${actual.slice(Math.max(0, i - 40), i + 60)}…`)
            }
        }
    }
    return compared
}
const ENTITIES = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    nbsp: '\u00a0',
    copy: '©',
    reg: '®',
    ndash: '–',
    mdash: '—',
    hellip: '…',
    laquo: '«',
    raquo: '»'
};
const decode = (text) => text.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (all, code) => (code[0] === '#' ? String.fromCodePoint(code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : Number(code.slice(1))) : ENTITIES[code.toLowerCase()] ?? all));
const textKey = (text) => decode(text).replace(/\s+/g, ' ').trim();

function pageTexts(html) {
    const body = html.replace(/<(script|style|code|noscript)\b[\s\S]*?<\/\1>/gi, ' ');
    const keys = new Set();
    const add = (value) => {
        const key = textKey(value || '');
        if (/\p{L}/u.test(key)) keys.add(key);
    };
    for (const [, text] of body.matchAll(/>([^<]+)</g)) add(text);
    for (const [, , d, q, b] of body.matchAll(/\s(aria-label|title|alt|placeholder)=(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g)) add(d ?? q ?? b);
    for (const [tag] of html.matchAll(/<meta\b[^>]*>/g)) {
        if (/(?:name=["']?description|property=["']?og:(?:title|description))/.test(tag)) add((tag.match(/content=(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/) || []).slice(1).find((v) => v !== undefined));
    }
    add((html.match(/<title>([^<]*)<\/title>/) || [])[1]);
    return keys
}

function loadDictionaries(files) {
    const dictionaries = {};
    const keep = new Set();
    const i18n = {
        add(lang, entry) {
            const dictionary = dictionaries[lang] || (dictionaries[lang] = {
                texts: {},
                patterns: []
            });
            Object.assign(dictionary.texts, entry.texts || {});
            dictionary.patterns.push(...(entry.patterns || []));
            (entry.keep || []).forEach((text) => keep.add(text))
        },
        translate: () => null
    };
    const sandbox = {
        self: {
            [project.namespace]: {
                i18n
            }
        }
    };
    vm.createContext(sandbox);
    for (const file of files) vm.runInContext(readFileSync(file, 'utf8'), sandbox, {
        filename: rel(file)
    });
    return {
        dictionaries,
        keep
    }
}

function checkTranslations() {
    const used = new Map();
    let checked = 0;
    for (const page of pages()) {
        const html = readFileSync(page, 'utf8');
        const files = [...html.matchAll(/<script\b[^>]*\ssrc=["']?([^"'\s>]*assets\/js\/i18n\/[^"'\s>]+\.js)/g)].map(([, src]) => resolve(dirname(page), src));
        if (!files.length) continue;
        const {
            dictionaries,
            keep
        } = loadDictionaries(files);
        for (const [lang, dictionary] of Object.entries(dictionaries)) {
            for (const key of Object.keys(dictionary.texts))
                if (!used.has(`${lang}:${key}`)) used.set(`${lang}:${key}`, !1);
            const missing = [];
            for (const key of pageTexts(html)) {
                checked++;
                if (Object.prototype.hasOwnProperty.call(dictionary.texts, key)) {
                    used.set(`${lang}:${key}`, !0);
                    continue
                }
                if (keep.has(key) || dictionary.patterns.some(([test]) => test.test(key))) continue;
                missing.push(key)
            }
            if (missing.length) fail(`i18n: ${rel(page)} has ${missing.length} text(s) without ${lang} entry: ${missing.slice(0, process.env.VERBOSE ? Infinity : 4).map((key) => JSON.stringify(key)).join(', ')}${missing.length > 4 && !process.env.VERBOSE ? ', …' : ''}`);
        }
    }
    const scripts = walk(join(ROOT, 'assets'), (path) => /\.(?:js|json)$/.test(path) && !path.includes(`${sep}i18n${sep}`)).map((path) => decode(readFileSync(path, 'utf8'))).join('\n');
    for (const [id, seen] of used) {
        const key = id.slice(id.indexOf(':') + 1);
        if (!seen && !scripts.includes(key)) warn(`i18n: unused entry ${JSON.stringify(key)}`);
    }
    return checked
}

function checkScripts() {
    const scripts = [join(ROOT, 'sw.js'), ...walk(ROOT, (path) => /\.(?:m?js)$/.test(path))];
    for (const script of new Set(scripts)) {
        const result = spawnSync(process.execPath, ['--check', script], {
            encoding: 'utf8'
        });
        if (result.status !== 0) fail(`js: ${rel(script)}\n${result.stderr.trim()}`);
    }
    return scripts.length
}
const run = (name, check) => {
    try {
        return check()
    } catch (error) {
        fail(`${name}: ${error.message}`);
        return 0
    }
};
const context = {
    ROOT,
    fail,
    warn,
    rel,
    walk,
    pages,
    checkLocalReference
};
run('vendor', checkVendor);
if (!writeHashes) {
    const pageCount = run('html', checkHtml);
    run('manifest', checkManifest);
    run('css', checkCss);
    run('script paths', checkScriptPaths);
    const dataFiles = run('data', checkData);
    const precached = run('precache', checkPrecache);
    const chromeBlocks = run('chrome', checkChrome);
    const texts = run('i18n', checkTranslations);
    const extra = [];
    for (const [name, check] of Object.entries(project.checks)) {
        const summary = run(name, () => check(context));
        if (typeof summary === 'string') extra.push(summary);
    }
    const scripts = run('js', checkScripts);
    console.log(`Checked ${pageCount} pages, ${precached} precache entries, ${dataFiles} data files, ${chromeBlocks} repeated blocks, ${texts} texts, ${scripts} scripts${extra.length ? ', ' + extra.join(', ') : ''}.`)
}
for (const message of warnings) console.warn(`warn  ${message}`);
for (const message of errors) console.error(`error ${message}`);
if (errors.length) process.exit(1);
console.log(warnings.length ? 'Done with warnings.' : 'All checks passed.');