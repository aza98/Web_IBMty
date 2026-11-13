// Run with node --test tools/test-push.mjs. No SDK download or real subscriptions.
import assert from 'node:assert/strict';
import {
    readFileSync
} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
const source = readFileSync(new URL('../assets/js/services/push.js', import.meta.url), 'utf8');
const tick = () => new Promise((resolve) => setImmediate(resolve));
const deferred = () => {
    let resolve, reject;
    const promise = new Promise((yes, no) => {
        resolve = yes;
        reject = no
    });
    return {
        promise,
        resolve,
        reject
    }
};

function target() {
    const listeners = new Map();
    return {
        addEventListener(name, callback) {
            if (!listeners.has(name)) listeners.set(name, new Set());
            listeners.get(name).add(callback)
        },
        removeEventListener(name, callback) {
            listeners.get(name)?.delete(callback)
        },
        fire(name, detail) {
            for (const callback of listeners.get(name) || []) callback(detail || {
                type: name
            })
        }
    }
}

function setup(options = {}) {
    const scripts = [],
        events = [],
        timers = new Map();
    const calls = {
        init: 0,
        optIn: 0,
        optOut: 0,
        permission: 0,
        nativeSubscription: 0
    };
    let module, timerId = 0;
    const window = target();
    const document = Object.assign(target(), {
        visibilityState: 'visible',
        documentElement: {
            dataset: {
                display: options.installed ? 'standalone' : 'browser'
            }
        },
        createElement() {
            return {
                remove() {
                    this.removed = !0
                }
            }
        },
        head: {
            append(script) {
                scripts.push(script)
            }
        }
    });
    const permission = Object.assign(target(), {
        state: options.permission || 'granted'
    });
    const Notification = {
        get permission() {
            return permission.state
        },
        requestPermission() {
            calls.permission++;
            if (options.requestPermission) return options.requestPermission(permission);
            permission.state = options.promptResult || 'granted';
            return Promise.resolve(permission.state)
        }
    };
    const registration = {
        scope: 'https://example.invalid/review/',
        active: {
            scriptURL: 'https://example.invalid/review/sw.js'
        },
        pushManager: {
            async getSubscription() {
                calls.nativeSubscription++;
                return {
                    endpoint: 'mock-subscription'
                }
            }
        }
    };
    const navigator = {
        userAgent: options.ios ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)' : 'Mozilla/5.0 Chrome/130',
        platform: options.ipad ? 'MacIntel' : options.ios ? 'iPhone' : 'Linux',
        maxTouchPoints: options.ipad || options.ios ? 5 : 0,
        standalone: !!options.installed,
        onLine: !0,
        serviceWorker: Object.assign(target(), {
            ready: Promise.resolve(registration),
            getRegistration: async () => registration
        }),
        permissions: {
            query: async () => permission
        }
    };
    const subscription = Object.assign(target(), {
        optedIn: options.optedIn ?? !0,
        id: options.id === undefined ? 'mock-id' : options.id,
        token: options.token === undefined ? 'mock-token' : options.token,
        async optIn() {
            calls.optIn++;
            if (options.optIn) return options.optIn(subscription);
            subscription.optedIn = !0
        },
        async optOut() {
            calls.optOut++;
            if (options.optOut) return options.optOut(subscription);
            subscription.optedIn = !1
        }
    });
    const sdk = {
        async init(config) {
            calls.init++;
            calls.config = config;
            if (options.init) return options.init();
        },
        Notifications: Object.defineProperty(Object.assign(target(), {
            isPushSupported: () => !0
        }), 'permission', {
            get: () => permission.state === 'granted'
        }),
        User: {
            PushSubscription: subscription
        }
    };
    const app = {
        config: {
            features: {
                push: options.configured !== !1,
                serviceWorker: options.serviceWorker !== !1
            },
            services: {
                oneSignalAppId: options.configured === !1 ? '' : '00000000-0000-4000-8000-000000000001'
            }
        },
        register(name, value) {
            assert.equal(name, 'service:push');
            module = value
        },
        emit(name, state) {
            assert.equal(name, 'push-change');
            events.push(state)
        },
        url: (relative) => new URL(relative, 'https://example.invalid/review/').href
    };
    Object.assign(window, {
        navigator,
        Notification,
        PushManager: function() {},
        isSecureContext: options.secure !== !1,
        matchMedia: () => ({
            matches: !!options.installed
        })
    });
    if (options.unsupported) delete window.PushManager;
    const sandbox = {
        self: {
            IBMty: app
        },
        window,
        navigator,
        document,
        Notification,
        URL,
        console,
        setTimeout(callback, delay) {
            const id = ++timerId;
            timers.set(id, {
                callback,
                delay
            });
            return id
        },
        clearTimeout(id) {
            timers.delete(id)
        }
    };
    vm.runInNewContext(source, sandbox, {
        filename: 'assets/js/services/push.js'
    });
    module.init(app);
    return {
        app,
        push: app.push,
        calls,
        scripts,
        events,
        sdk,
        subscription,
        permission,
        window,
        document,
        load(index = scripts.length - 1) {
            const queue = window.OneSignalDeferred || [];
            const callbacks = Array.from(queue);
            queue.push = (...items) => {
                items.forEach((callback) => callback(sdk));
                return 0
            };
            window.OneSignalDeferred = queue;
            window.OneSignal = sdk;
            callbacks.forEach((callback) => callback(sdk));
            scripts[index]?.onload?.()
        },
        expire() {
            const pending = [...timers.values()];
            timers.clear();
            pending.forEach(({
                callback
            }) => callback())
        }
    }
}
test('unconfigured and unsupported devices never download the SDK or request permission', async () => {
    for (const [options, expected] of [
            [{
                configured: !1
            }, 'unavailable'],
            [{
                unsupported: !0
            }, 'unsupported'],
            [{
                secure: !1
            }, 'unsupported'],
            [{
                serviceWorker: !1
            }, 'unsupported']
        ]) {
        const h = setup(options);
        assert.equal(await h.push.state(), expected);
        assert.equal(await h.push.enable(), expected);
        assert.equal(h.events.at(-1), expected);
        assert.equal(h.scripts.length, 0);
        assert.equal(h.calls.permission, 0)
    }
});
test('iOS browser explains installation; an installed app can offer activation', async () => {
    for (const options of [{
            ios: !0
        }, {
            ipad: !0
        }]) {
        const browser = setup({
            ...options,
            permission: 'default'
        });
        assert.equal(await browser.push.state(), 'install-required');
        assert.equal(await browser.push.enable(), 'install-required');
        assert.equal(browser.calls.permission, 0);
        const installed = setup({
            ...options,
            installed: !0,
            permission: 'default'
        });
        assert.equal(await installed.push.state(), 'off');
        assert.equal(installed.scripts.length, 0)
    }
});
test('permission alone does not mean subscribed, and a native fallback cannot claim success', async () => {
    const h = setup({
        optedIn: !1
    });
    const result = h.push.state();
    h.load();
    assert.equal(await result, 'off');
    assert.equal(h.calls.nativeSubscription, 0);
    const failed = setup();
    const failure = failed.push.state();
    failed.scripts[0].onerror();
    assert.equal(await failure, 'error');
    assert.equal(failed.events.at(-1), 'error');
    assert.equal(failed.calls.nativeSubscription, 0)
});
test('on requires a OneSignal subscription id and token as well as opt-in', async () => {
    for (const options of [{
            id: null
        }, {
            token: null
        }, {}]) {
        const h = setup(options);
        const result = h.push.state();
        h.load();
        assert.equal(await result, options.id === null || options.token === null ? 'error' : 'on')
    }
});
test('permission request starts in the activating gesture and rejected permission propagates', async () => {
    const choice = deferred();
    const h = setup({
        permission: 'default',
        requestPermission: async (permission) => {
            permission.state = await choice.promise;
            return permission.state
        }
    });
    const activation = h.push.enable();
    assert.equal(h.calls.permission, 1, 'must request before yielding out of the user gesture');
    choice.resolve('denied');
    assert.equal(await activation, 'denied');
    assert.equal(h.events.at(-1), 'denied');
    assert.equal(h.calls.optIn, 0)
});
test('enable and disable publish shared progress and confirmed terminal states', async () => {
    const h = setup({
        permission: 'default',
        optedIn: !1
    });
    const enabling = h.push.enable();
    await tick();
    h.load();
    assert.equal(await enabling, 'on');
    assert.ok(h.events.includes('enabling'));
    assert.equal(h.events.at(-1), 'on');
    assert.equal(await h.push.disable(), 'off');
    assert.ok(h.events.includes('disabling'));
    assert.equal(h.events.at(-1), 'off');
    assert.equal(h.calls.init, 1);
    assert.equal(h.calls.optIn, 1);
    assert.equal(h.calls.optOut, 1);
    assert.equal(h.calls.config.serviceWorkerPath, 'review/sw.js');
    assert.equal(h.calls.config.serviceWorkerParam.scope, '/review/')
});
test('a failed download can be retried without initializing the SDK twice', async () => {
    const h = setup();
    const first = h.push.state();
    h.scripts[0].onerror();
    assert.equal(await first, 'error');
    const second = h.push.state();
    h.load();
    assert.equal(await second, 'on');
    assert.equal(h.calls.init, 1);
    assert.equal(h.scripts.length, 2)
});
test('stalled SDK initialization expires and late completion recovers without another init', async () => {
    const init = deferred();
    const h = setup({
        init: () => init.promise
    });
    const first = h.push.enable();
    h.load();
    await tick();
    h.expire();
    assert.equal(await first, 'error');
    init.resolve();
    await tick();
    assert.equal(await h.push.state(), 'on');
    assert.equal(h.calls.init, 1)
});
test('failed init remains an error on recheck instead of calling init a second time', async () => {
    const h = setup({
        init: async () => {
            throw new Error('invalid configuration')
        }
    });
    const first = h.push.state();
    h.load();
    assert.equal(await first, 'error');
    assert.equal(await h.push.state(), 'error');
    assert.equal(h.calls.init, 1)
});
test('SDK subscription and permission events update all consumers without another click', async () => {
    const h = setup();
    const initial = h.push.state();
    h.load();
    assert.equal(await initial, 'on');
    h.subscription.optedIn = !1;
    h.subscription.fire('change', {
        current: {
            optedIn: !1
        }
    });
    await tick();
    assert.equal(h.events.at(-1), 'off');
    h.permission.state = 'denied';
    h.sdk.Notifications.fire('permissionChange', !1);
    await tick();
    assert.equal(h.events.at(-1), 'denied')
});
test('returning to the page rechecks external permissions and respects hidden tabs', async () => {
    const h = setup();
    const initial = h.push.state();
    h.load();
    await initial;
    for (const event of ['focus', 'pageshow', 'online']) {
        h.permission.state = 'denied';
        h.window.fire(event);
        await tick();
        assert.equal(h.events.at(-1), 'denied', event);
        h.permission.state = 'granted';
        await h.push.state()
    }
    h.document.visibilityState = 'hidden';
    h.permission.state = 'denied';
    h.document.fire('visibilitychange');
    await tick();
    assert.equal(h.events.at(-1), 'on');
    h.document.visibilityState = 'visible';
    h.document.fire('visibilitychange');
    await tick();
    assert.equal(h.events.at(-1), 'denied')
});
test('concurrent controls share one subscription mutation', async () => {
    const pending = deferred();
    const h = setup({
        optedIn: !1,
        optIn: async (subscription) => {
            await pending.promise;
            subscription.optedIn = !0
        }
    });
    const first = h.push.enable();
    h.load();
    await tick();
    const second = h.push.enable();
    const opposite = h.push.disable();
    assert.equal(h.calls.optIn, 1);
    assert.equal(h.calls.optOut, 0);
    pending.resolve();
    assert.deepEqual(await Promise.all([first, second, opposite]), ['on', 'on', 'on'])
});
test('a stalled opt-in expires instead of leaving every control busy', async () => {
    const h = setup({
        optedIn: !1,
        optIn: () => new Promise(() => {})
    });
    const result = h.push.enable();
    h.load();
    await tick();
    h.expire();
    assert.equal(await result, 'error');
    assert.equal(h.events.at(-1), 'error')
});
test('a download timeout permits a fresh request without leftover initialization callbacks', async () => {
    const h = setup();
    const first = h.push.state();
    h.expire();
    assert.equal(await first, 'error');
    assert.equal(h.scripts[0].removed, !0);
    const retry = h.push.state();
    h.load();
    assert.equal(await retry, 'on');
    assert.equal(h.calls.init, 1)
});
test('a timed-out mutation cannot be duplicated and its eventual result updates the UI', async () => {
    const pending = deferred();
    const h = setup({
        optedIn: !1,
        optIn: async (subscription) => {
            await pending.promise;
            subscription.optedIn = !0
        }
    });
    const activation = h.push.enable();
    h.load();
    await tick();
    h.expire();
    assert.equal(await activation, 'error');
    assert.equal(await h.push.enable(), 'error');
    assert.equal(await h.push.disable(), 'error');
    assert.equal(h.calls.optIn, 1);
    assert.equal(h.calls.optOut, 0);
    pending.resolve();
    await tick();
    assert.equal(h.events.at(-1), 'on')
});
test('permission revoked during SDK initialization supersedes the old read', async () => {
    const pending = deferred();
    const h = setup({
        init: () => pending.promise
    });
    const oldRead = h.push.state();
    h.load();
    await tick();
    h.permission.state = 'denied';
    h.window.fire('focus');
    await tick();
    assert.equal(h.events.at(-1), 'denied');
    pending.resolve();
    assert.equal(await oldRead, 'denied');
    assert.equal(h.events.at(-1), 'denied');
    assert.ok(!h.events.includes('on'))
});
test('an incomplete subscription becomes confirmed when OneSignal assigns its id', async () => {
    const h = setup({
        id: null
    });
    const initial = h.push.state();
    h.load();
    assert.equal(await initial, 'error');
    h.subscription.id = 'assigned-id';
    h.subscription.fire('change', {
        current: {
            id: 'assigned-id',
            optedIn: !0,
            token: 'mock-token'
        }
    });
    await tick();
    assert.equal(h.events.at(-1), 'on')
})