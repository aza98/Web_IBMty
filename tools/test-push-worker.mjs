import assert from 'node:assert/strict';
import {
    readFileSync
} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
const workerSource = readFileSync(new URL('../service-worker/messages.js', import.meta.url), 'utf8');
const pushSource = readFileSync(new URL('../service-worker/push.js', import.meta.url), 'utf8');
const pageSource = readFileSync(new URL('../assets/js/pwa/updates.js', import.meta.url), 'utf8');
const root = 'https://example.test/church/sw.js';
const nextUrl = root + '?appId=test';
const release = (version) => ({
    type: 'VERSION',
    version
});
const flush = () => new Promise((resolve) => setImmediate(resolve));

function eventTarget() {
    const listeners = new Map();
    return {
        addEventListener(type, listener) {
            if (!listeners.has(type)) listeners.set(type, []);
            listeners.get(type).push(listener)
        },
        dispatch(type, event = {}) {
            for (const listener of listeners.get(type) || []) listener(event)
        }
    }
}

function environment() {
    const timers = new Map();
    return {
        MessageChannel: class {
            constructor() {
                let closed = !1;
                this.port1 = {
                    onmessage: null,
                    close() {
                        closed = !0
                    }
                };
                this.port2 = {
                    postMessage: (data) => queueMicrotask(() => {
                        if (!closed) this.port1.onmessage?.({
                            data
                        })
                    })
                }
            }
        },
        setTimeout(callback) {
            const id = Symbol();
            timers.set(id, callback);
            return id
        },
        clearTimeout(id) {
            timers.delete(id)
        },
        expire() {
            for (const callback of [...timers.values()]) callback()
        }
    }
}

function worker(scriptURL, reply, state = 'activated') {
    return {
        ...eventTarget(),
        scriptURL,
        state,
        messages: [],
        postMessage(message, ports) {
            this.messages.push(message.type);
            if (message.type === 'GET_VERSION' && reply !== undefined) ports[0].postMessage(reply);
            if (message.type === 'SKIP_WAITING') this.state = 'activating'
        }
    }
}

function workerInstall(active, url = nextUrl) {
    const clock = environment();
    let skipped = 0;
    const self = {
        ...eventTarget(),
        registration: {
            active
        },
        location: {
            href: url
        },
        IBMtySW: {
            config: {
                version: '8.1.0'
            }
        },
        workbox: {
            core: {
                clientsClaim() {}
            }
        },
        skipWaiting() {
            skipped++;
            return Promise.resolve()
        }
    };
    vm.runInNewContext(workerSource, {
        ...clock,
        self
    });
    let completion = Promise.resolve();
    self.dispatch('install', {
        waitUntil(promise) {
            completion = promise
        }
    });
    return {
        clock,
        completion,
        skipped: () => skipped
    }
}
for (const [name, reply, url, expected] of [
        ['same release with a new URL', release('8.1.0'), nextUrl, 1],
        ['new release with a new URL', release('8.0.0'), nextUrl, 0],
        ['same URL still waits for approval', release('8.1.0'), root, 0],
        ['malformed version does not authorize activation', {
            version: '8.1.0'
        }, nextUrl, 0],
        ['legacy migration with the same URL', '7.0.0', root, 1],
        ['legacy migration with a new URL', '7.0.0', nextUrl, 1]
    ]) {
    test(`worker: ${name}`, async () => {
        const run = workerInstall(worker(root, reply), url);
        await run.completion;
        assert.equal(run.skipped(), expected)
    })
}
test('worker: no version response keeps a changed URL waiting', async () => {
    const run = workerInstall(worker(root, undefined));
    run.clock.expire();
    await run.completion;
    assert.equal(run.skipped(), 0)
});
test('worker: an unreachable active worker does not fail installation', async () => {
    const run = workerInstall({
        scriptURL: root,
        postMessage() {
            throw Error('redundant')
        }
    });
    await run.completion;
    assert.equal(run.skipped(), 0)
});
test('worker: first installation does not request skipWaiting', async () => {
    const run = workerInstall(null);
    await run.completion;
    assert.equal(run.skipped(), 0)
});
test('push worker: imports the SDK only when push and its App ID are configured', () => {
    for (const [push, oneSignalAppId, expected] of [
            [!1, 'test-app', 0],
            [!0, '', 0],
            [!0, 'test-app', 1]
        ]) {
        const imports = [];
        vm.runInNewContext(pushSource, {
            self: {
                IBMty: {
                    config: {
                        features: {
                            push
                        },
                        services: {
                            oneSignalAppId
                        }
                    }
                }
            },
            importScripts(url) {
                imports.push(url)
            }
        });
        assert.equal(imports.length, expected);
        if (expected) assert.equal(imports[0], 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');
    }
});
test('push worker: a failed SDK import aborts evaluation instead of installing without push', () => {
    const failure = new Error('SDK unavailable');
    assert.throws(() => vm.runInNewContext(pushSource, {
        self: {
            IBMty: {
                config: {
                    features: {
                        push: !0
                    },
                    services: {
                        oneSignalAppId: 'test-app'
                    }
                }
            }
        },
        importScripts() {
            throw failure
        }
    }), (error) => error === failure)
});

function page(active, candidate, {
    waiting = !0,
    forms = []
} = {}) {
    const clock = environment();
    const notices = [];
    const emitted = [];
    const appEvents = eventTarget();
    const serviceWorker = {
        ...eventTarget(),
        controller: active
    };
    const registration = {
        ...eventTarget(),
        waiting: waiting ? candidate : null,
        installing: waiting ? null : candidate
    };
    let module;
    let reloads = 0;
    const app = {
        register(name, value) {
            module = value
        },
        on: appEvents.addEventListener,
        emit(type, detail) {
            emitted.push(type);
            appEvents.dispatch(type, {
                detail
            })
        },
        notices: {
            show(notice) {
                notices.push(notice)
            }
        }
    };
    vm.runInNewContext(pageSource, {
        ...clock,
        self: {
            IBMty: app
        },
        navigator: {
            serviceWorker,
            onLine: !0
        },
        document: {
            ...eventTarget(),
            querySelectorAll: () => forms
        },
        location: {
            reload() {
                reloads++
            }
        }
    });
    module.init(app);
    app.emit('pwa:registered', registration);
    return {
        clock,
        notices,
        emitted,
        registration,
        serviceWorker,
        app,
        reloads: () => reloads
    }
}
test('page: a new release at a changed URL is offered and activates only after acceptance', async () => {
    const candidate = worker(nextUrl, release('8.1.0'), 'installed');
    const run = page(worker(root, release('8.0.0')), candidate);
    await flush();
    assert.equal(run.notices.length, 1);
    assert.ok(run.emitted.includes('pwa:update-ready'));
    assert.ok(!candidate.messages.includes('SKIP_WAITING'));
    run.notices[0].action.onClick();
    assert.ok(candidate.messages.includes('SKIP_WAITING'));
    run.serviceWorker.dispatch('controllerchange');
    assert.equal(run.reloads(), 1)
});
test('page: same-release URL migration activates without an update notice or reload', async () => {
    const candidate = worker(nextUrl, release('8.1.0'), 'installed');
    const run = page(worker(root, release('8.1.0')), candidate);
    await flush();
    assert.equal(run.notices.length, 0);
    assert.ok(candidate.messages.includes('SKIP_WAITING'));
    run.serviceWorker.dispatch('controllerchange');
    assert.equal(run.reloads(), 0)
});
test('page: unknown active version still offers the waiting update', async () => {
    const candidate = worker(nextUrl, release('8.1.0'), 'installed');
    const run = page(worker(root, undefined), candidate);
    run.clock.expire();
    await flush();
    assert.equal(run.notices.length, 1);
    assert.ok(!candidate.messages.includes('SKIP_WAITING'))
});
test('page: updatefound offers a new release even when the URL changed', async () => {
    const candidate = worker(nextUrl, release('8.1.0'), 'installing');
    const run = page(worker(root, release('8.0.0')), candidate, {
        waiting: !1
    });
    run.registration.dispatch('updatefound');
    candidate.state = 'installed';
    run.registration.waiting = candidate;
    candidate.dispatch('statechange');
    await flush();
    assert.equal(run.notices.length, 1)
});
test('page: an edited form prevents acceptance of a changed-URL release', async () => {
    const candidate = worker(nextUrl, release('8.1.0'), 'installed');
    const form = {
        getAttribute: () => null,
        elements: [{
            type: 'text',
            defaultValue: '',
            value: 'Draft'
        }]
    };
    const run = page(worker(root, release('8.0.0')), candidate, {
        forms: [form]
    });
    await flush();
    run.notices[0].action.onClick();
    assert.ok(!candidate.messages.includes('SKIP_WAITING'));
    assert.match(run.notices.at(-1).text, /formulario/)
})