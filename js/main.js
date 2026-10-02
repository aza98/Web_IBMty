var ICON_SPRITE = 'assets/icons/icons.svg#i-';
var deferredPrompt = null;
var SHARE_IMAGE_EXT = /\.(avif|bmp|gif|ico|jpe?g|jfif|pjpeg|pjp|png|svgz?|tiff?|webp)(\?.*)?(#.*)?$/i;
var SHARE_IMAGE_FETCH_TIMEOUT_MS = 900;

function isStandaloneMode() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === !0
}

function detectEnvironment() {
    var standalone = isStandaloneMode();
    document.documentElement.classList.toggle('is-pwa', standalone);
    document.body.classList.toggle('is-pwa', standalone);
    document.body.classList.toggle('is-web', !standalone);
    if (!standalone && window.location.pathname.includes('settings.html')) window.location.replace('index.html')
}

function applyConfigValues() {
    var config = typeof APP_CONFIG !== 'undefined' && APP_CONFIG ? APP_CONFIG : {};

    function resolve(path) {
        return path.split('.').reduce(function(value, key) {
            return value != null && value[key] !== undefined ? value[key] : null
        }, config)
    }
    document.querySelectorAll('[data-config-href]').forEach(function(el) {
        var key = el.dataset.configHref;
        var value = resolve(key);
        if (!value) {
            if (el.tagName === 'A') el.hidden = !0;
            return
        }
        if (key === 'email') value = 'mailto:' + value;
        if (key === 'phone1' || key === 'phone2') value = 'tel:' + String(value).replace(/[^\d+]/g, '');
        el.href = value
    });
    document.querySelectorAll('[data-config-text]').forEach(function(el) {
        var value = resolve(el.dataset.configText);
        if (value !== null) el.textContent = value
    })
}

function initTheme() {
    var saved = null;
    try {
        saved = localStorage.getItem('theme')
    } catch (err) {}
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = saved || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
    _updateThemeIcon(theme)
}

function setIcon(el, name) {
    var use = el && el.querySelector ? el.querySelector('use') : null;
    if (use) use.setAttribute('href', ICON_SPRITE + name)
}

function makeIcon(name, cls) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    var use = document.createElementNS(svg.namespaceURI, 'use');
    svg.setAttribute('class', cls ? 'icon ' + cls : 'icon');
    svg.setAttribute('aria-hidden', 'true');
    use.setAttribute('href', ICON_SPRITE + name);
    svg.appendChild(use);
    return svg
}

function _updateThemeIcon(theme) {
    var isDark = theme === 'dark';
    var iconName = isDark ? 'sun' : 'moon';
    [
        ['theme-icon', 'theme-label', 'Modo oscuro', 'Modo claro'],
        ['nav-theme-icon', 'nav-theme-label', 'Oscuro', 'Claro'],
        ['mobile-theme-icon', 'mobile-theme-label', 'Oscuro', 'Claro']
    ].forEach(function(g) {
        var ic = document.getElementById(g[0]);
        setIcon(ic, iconName);
        var lb = document.getElementById(g[1]);
        if (lb) lb.textContent = isDark ? g[2] : g[3]
    });
    var themeSwitch = document.getElementById('theme-toggle');
    if (themeSwitch) themeSwitch.setAttribute('aria-checked', isDark ? 'true' : 'false')
}

function toggleTheme() {
    var current = document.documentElement.getAttribute('data-theme');
    var next = current === 'dark' ? 'light' : 'dark';
    try {
        localStorage.setItem('theme', next)
    } catch (err) {}
    document.documentElement.setAttribute('data-theme', next);
    _updateThemeIcon(next)
}

function makeToast(message, opts) {
    opts = opts || {};
    if (opts.id) {
        var existing = document.getElementById(opts.id);
        if (existing) existing.remove()
    }
    var hasAction = !!opts.actionLabel;
    var toast = document.createElement('div');
    toast.className = 'app-toast';
    if (opts.id) toast.id = opts.id;
    var layout = hasAction ? 'display:flex;align-items:center;gap:.75rem;padding:.6rem .75rem .6rem 1.25rem;' : 'padding:.75rem 1.25rem;pointer-events:none;';
    var bottom = document.body.classList.contains('is-pwa') ? 'calc(var(--tabbar-height) + max(1rem, env(safe-area-inset-bottom)) + 1rem)' : 'calc(2rem + env(safe-area-inset-bottom))';
    toast.style.cssText = 'position:fixed;left:50%;bottom:' + bottom + ';' + 'transform:translateX(-50%) translateY(1rem);z-index:2000;' + 'max-width:calc(100% - 2rem);' + layout + 'background:var(--color-surface);color:var(--color-text-primary);' + 'border:1px solid var(--color-border);border-radius:var(--radius-pill);' + 'box-shadow:var(--shadow-card);font-family:var(--font-secondary);' + 'font-size:.9rem;font-weight:500;opacity:0;' + 'transition:opacity var(--motion-base) var(--ease-standard), transform var(--motion-base) var(--ease-standard);';
    if (hasAction) {
        var msg = document.createElement('span');
        msg.textContent = message;
        toast.appendChild(msg);
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn-app btn-app--primary btn-app--compact';
        btn.textContent = opts.actionLabel;
        btn.style.whiteSpace = 'nowrap';
        btn.addEventListener('click', function() {
            if (typeof opts.onAction === 'function') opts.onAction(btn)
        });
        toast.appendChild(btn)
    } else {
        toast.textContent = message
    }
    document.body.appendChild(toast);
    requestAnimationFrame(function() {
        toast.setAttribute('role', 'status');
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)'
    });
    if (opts.autoDismissMs) {
        setTimeout(function() {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(1rem)';
            setTimeout(function() {
                toast.remove()
            }, 250)
        }, opts.autoDismissMs)
    }
}

function initServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    var scope = new URL('./', window.location.href);
    var pageVersion = typeof APP_CONFIG !== 'undefined' ? APP_CONFIG.appVersion : null;
    var registration = null;
    var checking = null;
    var applying = !1;
    var reloading = !1;
    var confirming = !1;
    var target = null;
    var applyTimer = null;
    var lastCheck = 0;
    var inspected = 0;
    var expectedKey = 'ibmty-update-' + scope.pathname;

    function request(worker, type, extra) {
        return new Promise(function(resolve, reject) {
            if (!worker) return reject(new Error('No hay un service worker disponible.'));
            var channel = new MessageChannel();
            var timer = setTimeout(function() {
                finish(new Error('El service worker no respondió.'))
            }, type === 'PREPARE_UPDATE' ? 180000 : 5000);

            function finish(error, value) {
                clearTimeout(timer);
                channel.port1.close();
                if (error) reject(error);
                else resolve(value)
            }
            channel.port1.onmessage = function(event) {
                if (event.data && event.data.error) finish(new Error(event.data.error));
                else finish(null, event.data)
            };
            try {
                worker.postMessage(Object.assign({
                    type: type
                }, extra), [channel.port2])
            } catch (error) {
                finish(error)
            }
        })
    }

    function compare(a, b) {
        if (!/^\d+\.\d+\.\d+$/.test(a || '') || !/^\d+\.\d+\.\d+$/.test(b || '')) return null;
        var x = a.split('.').map(Number),
            y = b.split('.').map(Number);
        for (var i = 0; i < 3; i++) {
            if (x[i] !== y[i]) return x[i] > y[i] ? 1 : -1
        }
        return 0
    }

    function render(phase, text) {
        var toast = document.getElementById('sw-update-toast');
        if (!toast) {
            makeToast('', {
                id: 'sw-update-toast',
                actionLabel: 'Actualizar',
                onAction: act
            });
            toast = document.getElementById('sw-update-toast');
            toast.style.width = 'max-content';
            toast.style.flexWrap = 'wrap';
            toast.style.justifyContent = 'center'
        }
        toast.dataset.state = phase;
        toast.querySelector('span').textContent = text;
        var button = toast.querySelector('button');
        button.hidden = phase !== 'ready' && phase !== 'error';
        button.disabled = applying;
        button.textContent = phase === 'error' ? 'Reintentar' : 'Actualizar';
        toast.setAttribute('aria-busy', phase === 'downloading' || phase === 'applying' ? 'true' : 'false')
    }

    function fail(error) {
        clearTimeout(applyTimer);
        applying = !1;
        confirming = !1;
        render('error', navigator.onLine ? 'No se pudo completar la actualización. Puedes reintentar.' : 'Sin conexión. Reconecta para completar la actualización.');
        console.warn('Actualización de IBMty:', error)
    }

    function clearNotice() {
        var toast = document.getElementById('sw-update-toast');
        if (toast) toast.remove()
    }
    async function installedVersion() {
        var worker = navigator.serviceWorker.controller;
        if (!worker) return {
            version: pageVersion
        };
        try {
            return await request(worker, 'GET_UPDATE_STATUS')
        } catch (error) {
            var legacy = await request(worker, 'GET_VERSION');
            return {
                version: String(legacy).split('.').slice(0, 3).join('.')
            }
        }
    }
    async function inspect() {
        if (!registration || applying || reloading) return;
        var cycle = ++inspected;
        var worker = registration.waiting;
        if (registration.installing) {
            render('downloading', 'Descargando actualización…');
            return
        }
        if (worker) {
            var candidate = await request(worker, 'GET_UPDATE_STATUS');
            var installed = await installedVersion();
            if (cycle !== inspected || worker !== registration.waiting || applying) return;
            if (candidate.ready !== !0 || worker.state !== 'installed') {
                target = {
                    worker: worker,
                    release: candidate.release
                };
                throw new Error('La descarga de la nueva versión no está completa.')
            }
            if (candidate.release === installed.release) {
                target = null;
                clearNotice();
                return
            }
            var order = compare(candidate.version, installed.version);
            if (order === null || order < 0) throw new Error('No se pudo validar la versión candidata.');
            target = {
                worker: worker,
                release: candidate.release,
                version: candidate.version
            };
            render('ready', 'Versión ' + candidate.version + ' descargada y lista.');
            return
        }
        worker = navigator.serviceWorker.controller;
        if (!worker) return;
        var status;
        try {
            status = await request(worker, 'GET_UPDATE_STATUS')
        } catch (error) {
            return
        }
        if (cycle !== inspected || applying) return;
        if (!status.ready) {
            target = {
                worker: worker,
                release: status.release
            };
            throw new Error('Faltan archivos de la versión instalada.')
        }
        var expected = null;
        try {
            expected = sessionStorage.getItem(expectedKey)
        } catch (error) {}
        var matches = status.version === pageVersion && (!status.clientCache || status.clientCache === status.cache);
        if (!matches) {
            if (compare(status.version, pageVersion) === -1) throw new Error('La página y el worker pertenecen a versiones incompatibles.');
            target = {
                worker: worker,
                release: status.release,
                version: status.version
            };
            var activeInput = !!document.querySelector('input:focus, textarea:focus');
            if (!activeInput && !reloading) {
                try {
                    sessionStorage.setItem(expectedKey, status.release)
                } catch (error) {}
                reloading = !0;
                window.location.reload();
                return
            }
            render('ready', 'Actualización lista para utilizarse.')
        } else {
            target = null;
            clearNotice();
            if (expected) {
                try {
                    sessionStorage.removeItem(expectedKey)
                } catch (error) {}
                makeToast('Aplicación actualizada a ' + pageVersion, {
                    id: 'sw-update-success',
                    autoDismissMs: 3500
                })
            }
        }
    }
    async function confirmActivation() {
        if (!applying || confirming || reloading || !target) return;
        var controller = navigator.serviceWorker.controller;
        if (!controller || controller.state !== 'activated') return;
        confirming = !0;
        try {
            var status = await request(controller, 'GET_UPDATE_STATUS');
            if (!applying) return;
            if (status.release !== target.release) return;
            if (!status.ready) throw new Error('La versión activada no está completa.');
            clearTimeout(applyTimer);
            try {
                sessionStorage.setItem(expectedKey, status.release)
            } catch (error) {}
            reloading = !0;
            window.location.reload()
        } catch (error) {
            fail(error)
        } finally {
            confirming = !1
        }
    }
    async function act() {
        if (applying || checking || reloading) return;
        var toast = document.getElementById('sw-update-toast');
        if (toast && toast.dataset.state === 'error') {
            render('downloading', 'Preparando de nuevo la actualización…');
            if (!registration) {
                await check(!0);
                return
            }
            checking = (async function() {
                if (!registration.installing) await registration.update();
                if (registration.installing) {
                    watch(registration.installing);
                    return
                }
                var repair = registration.waiting || navigator.serviceWorker.controller;
                if (repair) {
                    var status = await request(repair, 'GET_UPDATE_STATUS').catch(function() {
                        return null
                    });
                    if (status && !status.ready) await request(repair, 'PREPARE_UPDATE')
                }
                await inspect()
            })().catch(fail).finally(function() {
                checking = null
            });
            await checking;
            return
        }
        if (!target) return;
        applying = !0;
        render('applying', 'Activando la versión descargada…');
        applyTimer = setTimeout(function() {
            fail(new Error('La activación está tardando demasiado.'))
        }, 20000);
        try {
            var worker = registration.waiting || navigator.serviceWorker.controller;
            var ready = await request(worker, 'GET_UPDATE_STATUS');
            if (!ready.ready || ready.release !== target.release) throw new Error('La versión candidata cambió. Reintenta la comprobación.');
            if (worker.state === 'installed') await request(worker, 'SKIP_WAITING', {
                release: target.release
            });
            await confirmActivation()
        } catch (error) {
            fail(error)
        }
    }

    function watch(worker) {
        if (!worker || worker._ibmtyWatched) return;
        worker._ibmtyWatched = !0;
        render('downloading', navigator.serviceWorker.controller ? 'Descargando actualización…' : 'Preparando la aplicación para usarla sin conexión…');
        worker.addEventListener('statechange', function() {
            if (worker.state === 'installed' || worker.state === 'activated') inspect().catch(fail);
            if (worker.state === 'redundant' && !registration.waiting && worker !== navigator.serviceWorker.controller) fail(new Error('No se pudo instalar la actualización.'))
        })
    }
    async function check(force) {
        if (checking || applying || reloading) return checking;
        if (!force && (document.hidden || !navigator.onLine || Date.now() - lastCheck < 15000)) return;
        lastCheck = Date.now();
        checking = (async function() {
            if (!registration) {
                var script = new URL('sw.js', scope);
                var existing = await navigator.serviceWorker.getRegistration(scope.href);
                var existingWorker = existing && (existing.installing || existing.waiting || existing.active);
                var scriptURL = existingWorker && existing.scope === scope.href && new URL(existingWorker.scriptURL).pathname === script.pathname ? existingWorker.scriptURL : script.href;
                try {
                    registration = await navigator.serviceWorker.register(scriptURL, {
                        scope: scope.href,
                        updateViaCache: 'none'
                    })
                } catch (error) {
                    if (!existing || existing.scope !== scope.href) throw error;
                    registration = existing
                }
                registration.addEventListener('updatefound', function() {
                    watch(registration.installing)
                });
                watch(registration.installing)
            }
            var updateError = null;
            if (!registration.installing) {
                try {
                    await registration.update()
                } catch (error) {
                    updateError = error
                }
            }
            await inspect();
            if (updateError && !target && !navigator.serviceWorker.controller) throw updateError
        })().catch(function(error) {
            if (navigator.onLine || target || !navigator.serviceWorker.controller) fail(error)
        }).finally(function() {
            checking = null
        });
        return checking
    }
    navigator.serviceWorker.addEventListener('controllerchange', function() {
        var controller = navigator.serviceWorker.controller;
        if (controller) controller.addEventListener('statechange', function() {
            if (applying) confirmActivation();
            else inspect().catch(fail)
        });
        if (applying) confirmActivation();
        else inspect().catch(fail)
    });
    navigator.serviceWorker.addEventListener('message', function(event) {
        var data = event.data;
        if (!data || data.type !== 'IBM_APP_UPDATE' || !registration || applying || reloading) return;
        if (![registration.installing, registration.waiting, navigator.serviceWorker.controller].includes(event.source)) return;
        if (data.phase === 'downloading') render('downloading', 'Descargando actualización… ' + data.completed + ' de ' + data.total + ' archivos');
        if (data.phase === 'error') fail(new Error(data.error));
        if (data.phase === 'ready' || data.phase === 'activated') inspect().catch(fail)
    });
    window.addEventListener('online', function() {
        check(!0)
    });
    window.addEventListener('pageshow', function() {
        check(!1)
    });
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) check(!1)
    });
    setInterval(function() {
        check(!1)
    }, 60000);
    check(!0)
}

function initPersistentStorage() {
    if (!navigator.storage || typeof navigator.storage.persist !== 'function' || typeof navigator.storage.persisted !== 'function' || !isStandaloneMode()) return;
    navigator.storage.persisted().then(function(already) {
        if (!already) return navigator.storage.persist()
    }).catch(function() {})
}

function installPlatform() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent) ? 'ios' : 'android_desktop'
}

function isIOSStandaloneEligible() {
    return installPlatform() === 'ios' && !window.navigator.standalone
}

function initPWAInstall() {
    window.addEventListener('beforeinstallprompt', function(event) {
        event.preventDefault();
        deferredPrompt = event;
        setInstallUIVisible(!0);
        if (typeof trackEvent === 'function') trackEvent('pwa', 'install_prompted', installPlatform())
    });
    if (isIOSStandaloneEligible()) setInstallUIVisible(!0);
    window.addEventListener('appinstalled', function() {
        deferredPrompt = null;
        setInstallUIVisible(!1);
        if (typeof trackEvent === 'function') trackEvent('pwa', 'installed', installPlatform())
    });
    ['nav-pwa-install-btn', 'mobile-pwa-install-btn'].forEach(function(id) {
        var button = document.getElementById(id);
        if (button) button.addEventListener('click', handlePWAInstallClick)
    })
}

function setInstallUIVisible(show) {
    ['#nav-install-item', '.nav-install-divider', '#mobile-install-item'].forEach(function(selector) {
        var el = document.querySelector(selector);
        if (el) el.style.display = show ? 'block' : 'none'
    })
}

function handlePWAInstallClick() {
    var ios = isIOSStandaloneEligible();
    if (!deferredPrompt) {
        if (ios) showIOSInstallModal();
        return
    }
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(function(choice) {
        if (typeof trackEvent === 'function') trackEvent('pwa', choice.outcome === 'accepted' ? 'install_accepted' : 'install_dismissed', ios ? 'ios' : 'android_desktop');
        deferredPrompt = null;
        setInstallUIVisible(!1)
    })
}

function showIOSInstallModal() {
    if (document.getElementById('ios-install-modal')) return;
    if (typeof trackEvent === 'function') trackEvent('pwa', 'ios_modal_shown', 'ios');
    var config = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG) ? APP_CONFIG : {};
    var overlay = document.createElement('div');
    overlay.id = 'ios-install-modal';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'ios-install-title');
    overlay.style.cssText = 'position:fixed;inset:0;display:flex;align-items:flex-end;' + 'justify-content:center;padding:1.5rem;z-index:9999;' + 'background:rgba(0,0,0,0.55);' + 'backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);';
    var panel = document.createElement('div');
    panel.setAttribute('tabindex', '-1');
    panel.style.cssText = 'background:var(--color-surface);border-radius:1.5rem;' + 'padding:1.75rem;width:100%;max-width:400px;' + 'color:var(--color-text-primary);font-family:var(--font-secondary),-apple-system,sans-serif;font-size:0.95rem;' + 'border:1px solid var(--color-border);' + 'box-shadow:var(--shadow-card);' + 'backdrop-filter:blur(20px) saturate(180%);' + '-webkit-backdrop-filter:blur(20px) saturate(180%);';
    panel.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.25rem;">' + '<strong id="ios-install-title" style="font-size:1.05rem;">Instalar ' + (config.appName || 'IBMty') + '</strong>' + '<button type="button" class="ctrl-app ctrl-app--ghost ctrl-app--md" data-action="close-ios-install" aria-label="Cerrar">' + '<svg class="icon" aria-hidden="true"><use href="' + ICON_SPRITE + 'x"></use></svg>' + '</button>' + '</div>' + '<ol style="padding:0;list-style:none;margin:0;display:flex;flex-direction:column;gap:1.1rem;">' + '<li style="display:flex;align-items:center;gap:0.9rem;">' + '<svg class="icon ios-install-step-icon" aria-hidden="true"><use href="assets/icons/icons.svg#i-share"></use></svg>' + '<span>Toca el botón <strong>Compartir</strong> en Safari</span>' + '</li>' + '<li style="display:flex;align-items:center;gap:0.9rem;">' + '<svg class="icon ios-install-step-icon" aria-hidden="true"><use href="assets/icons/icons.svg#i-square-plus"></use></svg>' + '<span>Selecciona <strong>Agregar a pantalla de inicio</strong></span>' + '</li>' + '<li style="display:flex;align-items:center;gap:0.9rem;">' + '<svg class="icon ios-install-step-icon" aria-hidden="true"><use href="assets/icons/icons.svg#i-check"></use></svg>' + '<span>Toca <strong>Agregar</strong> para confirmar</span>' + '</li>' + '</ol>';
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay || e.target.closest('[data-action="close-ios-install"]')) closeIOSInstallModal();
    });
    overlay.appendChild(panel);
    overlay._restoreFocus = document.activeElement;
    overlay._onKeydown = function(e) {
        if (e.key === 'Escape' || e.keyCode === 27) {
            closeIOSInstallModal();
            return
        }
        if (e.key !== 'Tab' && e.keyCode !== 9) return;
        var focusables = overlay.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (!focusables.length) {
            e.preventDefault();
            return
        }
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (e.shiftKey && (document.activeElement === first || !overlay.contains(document.activeElement))) {
            e.preventDefault();
            last.focus()
        } else if (!e.shiftKey && (document.activeElement === last || !overlay.contains(document.activeElement))) {
            e.preventDefault();
            first.focus()
        }
    };
    document.addEventListener('keydown', overlay._onKeydown);
    document.body.appendChild(overlay);
    panel.focus()
}

function closeIOSInstallModal() {
    var modal = document.getElementById('ios-install-modal');
    if (!modal) return;
    if (modal._onKeydown) document.removeEventListener('keydown', modal._onKeydown);
    var restore = modal._restoreFocus;
    modal.remove();
    if (restore && typeof restore.focus === 'function') restore.focus()
}

function handleCurrentTabClick(e) {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    var item = e.target.closest('.tabbar-item[aria-current="page"]');
    if (!item) return;
    e.preventDefault();
    window.scrollTo({
        top: 0,
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    })
}

function setActiveNavItem() {
    var page = document.body.dataset.page;
    if (!page) return;
    var tabbar = document.getElementById('tabbar-pwa');
    if (tabbar) tabbar.addEventListener('click', handleCurrentTabClick);
    document.querySelectorAll('#tabbar-pwa .tabbar-item, #navbar-web .nav-link').forEach(function(link) {
        var match;
        if (link.matches('#tabbar-pwa .tabbar-item')) {
            match = link.dataset.pageLink === page
        } else {
            var href = link.getAttribute('href');
            if (!href || href === '#') return;
            try {
                var path = new URL(link.href, window.location.origin).pathname;
                match = path === window.location.pathname || (window.location.pathname === '/' && path === '/index.html')
            } catch (error) {
                return
            }
        }
        link.classList.toggle('active', match);
        if (match) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current')
    })
}

function copyToClipboard(text, buttonElement) {
    var original = buttonElement ? (buttonElement._copyOriginalHTML === undefined ? buttonElement.innerHTML : buttonElement._copyOriginalHTML) : null;
    if (buttonElement) buttonElement._copyOriginalHTML = original;

    function failed() {
        console.warn('copyToClipboard: Clipboard API no disponible')
    }
    if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') return failed();
    navigator.clipboard.writeText(text).then(function() {
        if (!buttonElement) return;
        clearTimeout(buttonElement._copyResetTimer);
        buttonElement.innerHTML = '<svg class="icon me-1" aria-hidden="true"><use href="assets/icons/icons.svg#i-check"></use></svg><span class="btn-label">¡Copiado!</span>';
        buttonElement._copyResetTimer = setTimeout(function() {
            buttonElement.innerHTML = original;
            delete buttonElement._copyOriginalHTML;
            delete buttonElement._copyResetTimer
        }, 2000)
    }).catch(failed)
}

function initCopyDelegation() {
    document.addEventListener('click', function(e) {
        var btn = e.target.closest('[data-copy]');
        if (btn) copyToClipboard(btn.dataset.copy, btn)
    })
}

function shareContent(title, text, url, imageUrl) {
    var data = normalizeShareData(title, text, url);
    trackShare('attempt', data);
    if (!canUseNativeShare(data)) return copyShareFallback(data, 'unavailable');
    return getBestShareData(data, imageUrl).then(function(best) {
        return shareNatively(best, data)
    }).catch(function() {
        return shareNatively(data, data)
    })
}

function normalizeShareData(title, text, url) {
    var config = typeof APP_CONFIG !== 'undefined' && APP_CONFIG ? APP_CONFIG : {};
    return compactShareData({
        title: normalizeShareText(title) || document.title || config.appName || '',
        text: normalizeShareText(text),
        url: normalizeShareUrl(url)
    })
}

function normalizeShareText(value) {
    return (typeof value === 'string') ? value.trim() : ''
}

function normalizeShareUrl(value) {
    var rawUrl = normalizeShareText(value) || window.location.href;
    try {
        return new URL(rawUrl, window.location.href).href
    } catch (err) {
        return window.location.href
    }
}

function compactShareData(data) {
    var clean = {};
    ['title', 'text', 'url', 'files'].forEach(function(key) {
        if (key === 'files' ? data.files && data.files.length : data[key]) clean[key] = data[key]
    });
    if (!Object.keys(clean).length) clean.url = window.location.href;
    return clean
}

function canUseNativeShare(data) {
    return typeof navigator.share === 'function' && isWebShareAllowedByPolicy() && canShareData(data)
}

function canShareData(data) {
    if (typeof navigator.canShare !== 'function') return !0;
    try {
        return navigator.canShare(data)
    } catch (err) {
        return !1
    }
}

function isWebShareAllowedByPolicy() {
    var policy = document.permissionsPolicy || document.featurePolicy;
    if (!policy || typeof policy.allowsFeature !== 'function') return !0;
    try {
        return policy.allowsFeature('web-share')
    } catch (err) {
        return !0
    }
}

function canAttemptImageShare(imageUrl) {
    return !!(imageUrl && SHARE_IMAGE_EXT.test(imageUrl) && typeof window.fetch === 'function' && typeof window.File === 'function' && typeof navigator.canShare === 'function')
}

function canShareFiles(files) {
    if (!files || !files.length || typeof navigator.canShare !== 'function') return !1;
    try {
        return navigator.canShare({
            files: files
        })
    } catch (err) {
        return !1
    }
}

function getBestShareData(baseData, imageUrl) {
    if (!canAttemptImageShare(imageUrl)) return Promise.resolve(baseData);
    return fileFromImageUrl(imageUrl).then(function(file) {
        var data = compactShareData(Object.assign({}, baseData, {
            files: [file]
        }));
        if (canShareFiles(data.files) && canShareData(data)) return data;
        delete data.url;
        if (canShareFiles(data.files) && canShareData(data)) return data;
        return baseData
    }).catch(function() {
        return baseData
    })
}

function fileFromImageUrl(imageUrl) {
    var url;
    try {
        url = new URL(imageUrl, window.location.href)
    } catch (error) {
        return Promise.reject(error)
    }
    if (url.origin !== window.location.origin) return Promise.reject(new Error('cross-origin image share blocked'));
    var controller = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = controller ? setTimeout(function() {
        controller.abort()
    }, SHARE_IMAGE_FETCH_TIMEOUT_MS) : null;
    var options = {
        credentials: 'same-origin'
    };
    if (controller) options.signal = controller.signal;
    return fetch(url.href, options).then(function(response) {
        clearTimeout(timer);
        if (!response.ok) throw new Error('share image unavailable');
        return response.blob()
    }).then(function(blob) {
        var type = blob.type || guessImageMimeType(url.pathname);
        if (!type || type.indexOf('image/') !== 0) throw new Error('share image type unsupported');
        return new File([blob], shareFileName(url.pathname, type), {
            type: type
        })
    }).catch(function(error) {
        clearTimeout(timer);
        throw error
    })
}

function guessImageMimeType(pathname) {
    var ext = String(pathname || '').split('.').pop().toLowerCase();
    var map = {
        avif: 'image/avif',
        bmp: 'image/bmp',
        gif: 'image/gif',
        ico: 'image/x-icon',
        jfif: 'image/jpeg',
        jpeg: 'image/jpeg',
        jpg: 'image/jpeg',
        pjpeg: 'image/jpeg',
        pjp: 'image/jpeg',
        png: 'image/png',
        svg: 'image/svg+xml',
        svgz: 'image/svg+xml',
        tif: 'image/tiff',
        tiff: 'image/tiff',
        webp: 'image/webp'
    };
    return map[ext] || ''
}

function shareFileName(pathname, mimeType) {
    var segment = String(pathname || '').split('/').pop();
    if (segment && segment.indexOf('.') > 0) return segment;
    var ext = (mimeType.split('/')[1] || 'jpg').replace('jpeg', 'jpg').replace('svg+xml', 'svg');
    return 'ibmty-share.' + ext
}

function shareNatively(shareData, fallbackData) {
    return navigator.share(shareData).then(function() {
        trackShare('success', fallbackData)
    }).catch(function(err) {
        var name = err && err.name ? err.name : 'unknown';
        if (name === 'AbortError') {
            trackShare('cancel', fallbackData);
            return
        }
        trackShare('error_' + name, fallbackData);
        return copyShareFallback(fallbackData, name)
    })
}

function copyShareFallback(data, reason) {
    var text = composeShareText(data);

    function failed() {
        trackShare('clipboard_error_' + reason, data);
        if (typeof window.prompt === 'function') window.prompt('Copia manualmente:', text);
        else showShareToast('No se pudo compartir el enlace')
    }
    if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') {
        failed();
        return Promise.resolve()
    }
    return navigator.clipboard.writeText(text).then(function() {
        showShareToast('Enlace copiado', {
            actionLabel: 'WhatsApp',
            onAction: function() {
                openShareFallbackTarget(data)
            }
        });
        trackShare('copy_fallback_' + reason, data)
    }).catch(failed)
}

function composeShareText(data) {
    return Array.from(new Set([data.title, data.text, data.url].map(normalizeShareText).filter(Boolean))).join('\n\n')
}

function openShareFallbackTarget(data) {
    window.open('https://wa.me/?text=' + encodeURIComponent(composeShareText(data)), '_blank', 'noopener,noreferrer')
}

function trackShare(action, data) {
    if (typeof trackEvent === 'function') trackEvent('share', action, (data && (data.title || data.url)) || '')
}

function showShareToast(message, opts) {
    opts = opts || {};
    opts.id = 'share-toast';
    opts.autoDismissMs = opts.autoDismissMs || 2600;
    makeToast(message, opts)
}

function getShareUrlForTrigger(trigger) {
    var explicit = (trigger.getAttribute('data-share-url') || '').trim();
    if (explicit) return explicit;
    var card = trigger.closest('.swiper-slide .card-app[id]');
    if (!card || !card.id) return window.location.href;
    try {
        var url = new URL(window.location.href);
        url.hash = card.id;
        return url.href
    } catch (error) {
        return window.location.pathname + '#' + card.id
    }
}

function initShareDelegation() {
    document.addEventListener('click', function(event) {
        var trigger = event.target.closest('[data-share-title]');
        if (!trigger) return;
        event.preventDefault();
        event.stopPropagation();
        var image = (trigger.getAttribute('data-share-image') || '').trim();
        if (image && !/\//.test(image) && !/\.(webp|jpe?g|png|gif|avif)$/i.test(image)) {
            var card = trigger.closest('.card-app') || trigger.parentElement;
            var img = card && card.querySelector(image);
            image = img ? img.currentSrc || img.getAttribute('src') || '' : ''
        }
        image = image.trim();
        try {
            image = image ? new URL(image, window.location.href).href : null
        } catch (error) {
            image = null
        }
        shareContent((trigger.getAttribute('data-share-title') || '').trim(), (trigger.getAttribute('data-share-text') || '').trim(), getShareUrlForTrigger(trigger), image)
    })
}

function initWhatsAppLinks() {
    var config = typeof APP_CONFIG !== 'undefined' && APP_CONFIG ? APP_CONFIG : {};
    if (!config.whatsappNumber) return;
    document.querySelectorAll('#whatsapp-fab, [data-action="open-whatsapp"]').forEach(function(el) {
        el.href = 'https://wa.me/' + config.whatsappNumber
    })
}

function initWhatsAppFabToggle() {
    var enabled = !0;
    try {
        enabled = localStorage.getItem('whatsappFab') !== 'off'
    } catch (error) {}
    var fab = document.getElementById('whatsapp-fab');
    var toggle = document.getElementById('whatsapp-fab-toggle');

    function render() {
        if (fab) fab.style.display = enabled ? '' : 'none';
        if (!toggle) return;
        toggle.setAttribute('data-fab', enabled ? 'on' : 'off');
        toggle.setAttribute('aria-checked', enabled ? 'true' : 'false');
        var label = document.getElementById('whatsapp-fab-label');
        if (label) label.textContent = enabled ? 'Visible' : 'Oculto'
    }
    render();
    if (toggle) toggle.addEventListener('click', function() {
        enabled = !enabled;
        try {
            localStorage.setItem('whatsappFab', enabled ? 'on' : 'off')
        } catch (error) {}
        render()
    })
}

function _validateField(field) {
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    var telRegex = /^[0-9\s+()\-]+$/;
    var value = field.value.trim();
    if (field.hasAttribute('required') && !value) return 'Este campo es obligatorio.';
    if (field.type === 'email' && value && !emailRegex.test(value)) return 'Ingresa un correo electrónico válido.';
    if (field.type === 'tel' && value && !telRegex.test(value)) return 'Ingresa un número de teléfono válido.';
    return null
}

function initFormValidation() {
    document.querySelectorAll('form[data-validate]').forEach(function(form) {
        var fields = form.querySelectorAll('input, textarea, select');
        form.addEventListener('submit', function(event) {
            event.preventDefault();
            clearFormErrors(form);
            var firstInvalid = null;
            form.querySelectorAll('input, textarea, select').forEach(function(field) {
                var error = _validateField(field);
                if (!error) return;
                if (!firstInvalid) firstInvalid = field;
                var errorEl = document.createElement('span');
                var id = _fieldErrorId(field);
                errorEl.className = 'field-error';
                errorEl.id = id;
                errorEl.textContent = error;
                field.classList.add('is-invalid');
                field.setAttribute('aria-invalid', 'true');
                var described = field.getAttribute('aria-describedby');
                field.setAttribute('aria-describedby', described ? described + ' ' + id : id);
                field.insertAdjacentElement('afterend', errorEl)
            });
            if (!firstInvalid) return submitFormData(form);
            firstInvalid.focus();
            if (typeof trackFormSubmit === 'function') trackFormSubmit(form.id || 'contact-form', !1)
        });
        fields.forEach(function(field) {
            field.addEventListener('input', function() {
                if (field.classList.contains('is-invalid')) _clearFieldError(field)
            })
        })
    })
}

function _fieldErrorId(field) {
    return (field.id || field.name || 'campo') + '-error'
}

function _clearFieldError(field) {
    var errId = _fieldErrorId(field);
    var errorEl = document.getElementById(errId);
    if (errorEl) errorEl.remove();
    field.classList.remove('is-invalid');
    field.removeAttribute('aria-invalid');
    var described = (field.getAttribute('aria-describedby') || '').split(/\s+/).filter(function(token) {
        return token && token !== errId
    });
    if (described.length) {
        field.setAttribute('aria-describedby', described.join(' '))
    } else {
        field.removeAttribute('aria-describedby')
    }
}

function submitFormData(form) {
    var action = form.getAttribute('action');

    function success() {
        form.classList.add('form-success');
        form.dispatchEvent(new CustomEvent('form-success', {
            bubbles: !1
        }))
    }
    if (!action) {
        success();
        return
    }
    if (typeof window.fetch !== 'function') {
        form.submit();
        return
    }
    var button = form.querySelector('[type="submit"]');
    var label = button ? button.innerHTML : null;

    function restore() {
        if (!button) return;
        button.disabled = !1;
        button.innerHTML = label
    }
    if (button) {
        button.disabled = !0;
        button.textContent = 'Enviando…'
    }
    fetch(action, {
        method: 'POST',
        body: new FormData(form),
        headers: {
            Accept: 'application/json'
        }
    }).then(function(response) {
        if (!response.ok) throw new Error('Formspree ' + response.status);
        restore();
        success();
        form.reset();
        if (typeof trackFormSubmit === 'function') trackFormSubmit(form.id || 'contact-form', !0)
    }).catch(function() {
        restore();
        _showFormSubmitError(form);
        if (typeof trackFormSubmit === 'function') trackFormSubmit(form.id || 'contact-form', !1)
    })
}

function _showFormSubmitError(form) {
    var existing = form.querySelector('.form-submit-error');
    if (existing) existing.remove();
    var error = document.createElement('span');
    error.className = 'field-error form-submit-error';
    error.setAttribute('role', 'alert');
    error.textContent = 'No se pudo enviar el mensaje. Revisa tu conexión e inténtalo de nuevo.';
    var button = form.querySelector('[type="submit"]');
    if (button) button.insertAdjacentElement('afterend', error);
    else form.appendChild(error)
}

function clearFormErrors(form) {
    form.querySelectorAll('.is-invalid').forEach(_clearFieldError);
    form.querySelectorAll('.field-error').forEach(function(el) {
        el.remove()
    });
    form.classList.remove('form-success')
}

function setCurrentYear() {
    var el = document.getElementById('current-year');
    if (el) el.textContent = new Date().getFullYear();
}

function initImageFallbacks() {
    document.querySelectorAll('img[data-img-fallback]').forEach(function(img) {
        img.addEventListener('error', function() {
            img.classList.add('d-none');
            var next = img.nextElementSibling;
            if (next) {
                next.classList.remove('d-none');
                next.classList.add('d-flex')
            }
        })
    })
}
var AppPopups = (function() {
    var queue = [],
        stack, count, observer;
    var priority = {
        cookies: 0,
        update: 1,
        notifications: 2
    };
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

    function measure() {
        if (!stack) return;
        var style = getComputedStyle(stack);
        var base = parseFloat(getComputedStyle(stack, '::before').height);
        var lift = queue.length ? Math.max(0, stack.offsetHeight + parseFloat(style.bottom) + 8 - base) : 0;
        document.documentElement.style.setProperty('--popup-lift', lift + 'px')
    }

    function ensure() {
        if (stack) return;
        stack = document.createElement('div');
        stack.className = 'popup-stack';
        count = document.createElement('span');
        count.className = 'popup-stack__count';
        count.setAttribute('aria-live', 'polite');
        stack.appendChild(count);
        document.body.appendChild(stack);
        if (window.ResizeObserver) {
            observer = new ResizeObserver(measure);
            observer.observe(stack)
        }
        window.addEventListener('resize', measure)
    }

    function layers() {
        queue.sort(function(a, b) {
            return priority[a.type] - priority[b.type]
        });
        queue.forEach(function(item, i) {
            item.node.hidden = i > 2;
            item.node.dataset.layer = String(i);
            item.node.inert = i !== 0;
            item.node.setAttribute('aria-hidden', String(i !== 0));
            item.node.querySelectorAll('button, a, input, select, textarea, [tabindex]').forEach(function(control) {
                if (i !== 0 && !control.hasAttribute('data-popup-tabindex')) {
                    control.dataset.popupTabindex = control.getAttribute('tabindex') || '';
                    control.setAttribute('tabindex', '-1')
                } else if (i === 0 && control.hasAttribute('data-popup-tabindex')) {
                    if (control.dataset.popupTabindex) control.setAttribute('tabindex', control.dataset.popupTabindex);
                    else control.removeAttribute('tabindex');
                    delete control.dataset.popupTabindex
                }
            })
        });
        count.hidden = queue.length <= 3;
        count.textContent = queue.length > 3 ? '+' + (queue.length - 3) + ' pendientes' : '';
        measure()
    }

    function enqueue(type, node) {
        ensure();
        if (queue.some(function(item) {
                return item.node === node
            })) return;
        queue.push({
            type: Object.prototype.hasOwnProperty.call(priority, type) ? type : 'notifications',
            node: node,
            origin: document.activeElement
        });
        node.inert = !0;
        node.setAttribute('aria-hidden', 'true');
        stack.insertBefore(node, count);
        node.getBoundingClientRect();
        layers()
    }

    function dismiss(node) {
        var item = queue.find(function(entry) {
            return entry.node === node
        });
        if (!item) return Promise.resolve(!1);
        var restore = node.contains(document.activeElement);
        queue = queue.filter(function(entry) {
            return entry !== item
        });
        node.style.height = node.offsetHeight + 'px';
        node.classList.add('is-exiting');
        node.removeAttribute('data-layer');
        node.inert = !0;
        if (restore) {
            var destination = queue[0] && queue[0].node.querySelector('button, a');
            if (!destination) destination = item.origin && item.origin !== document.body && item.origin.isConnected ? item.origin : document.querySelector('main');
            if (destination) {
                if (!destination.matches('a, button, input, select, textarea, [tabindex]')) destination.setAttribute('tabindex', '-1');
                if (queue[0]) queue[0].node.inert = !1;
                destination.focus({
                    preventScroll: !0
                })
            }
        }
        node.setAttribute('aria-hidden', 'true');
        layers();
        return new Promise(function(resolve) {
            var finished = !1;

            function done(event) {
                if (event && event.target !== node || finished) return;
                finished = !0;
                clearTimeout(timer);
                node.removeEventListener('transitionend', done);
                node.remove();
                measure();
                resolve(!0)
            }
            var timer = setTimeout(done, reduced.matches ? 0 : 400);
            node.addEventListener('transitionend', done)
        })
    }
    return {
        enqueue: enqueue,
        dismiss: dismiss,
        refresh: measure
    }
})();

function initCookieBanner() {
    if (document.getElementById('splash-screen')) return;
    try {
        if (['accepted', 'rejected'].includes(localStorage.getItem('cookieConsent'))) return
    } catch (err) {}
    if (document.getElementById('cookie-banner')) return;
    var banner = document.createElement('section');
    banner.id = 'cookie-banner';
    banner.className = 'popup-card popup-card--compact popup-card--plain';
    banner.setAttribute('aria-labelledby', 'cookie-banner-title');
    banner.innerHTML = '<div class="popup-card__header"><span class="popup-card__symbol" aria-hidden="true"></span><h2 class="popup-card__title" id="cookie-banner-title">Usamos cookies</h2><button type="button" class="popup-card__close" aria-label="Rechazar cookies"></button></div><p class="popup-card__body">Usamos cookies para mejorar un sitio que piensa en ti. Consulta el <a href="privacidad.html">Aviso de Privacidad</a>.</p><div class="popup-card__progress" hidden></div><button type="button" class="popup-card__accept">Aceptar</button>';
    banner.querySelector('.popup-card__symbol').appendChild(makeIcon('cookie'));
    banner.querySelector('.popup-card__close').appendChild(makeIcon('x'));
    document.body.classList.add('cookie-banner-open');

    function resolveConsent(value) {
        try {
            localStorage.setItem('cookieConsent', value)
        } catch (error) {
            if (!banner.querySelector('[role="alert"]')) {
                var warning = document.createElement('p');
                warning.className = 'popup-card__body';
                warning.setAttribute('role', 'alert');
                warning.textContent = 'No se pudo guardar tu elección. Permite el almacenamiento e inténtalo de nuevo.';
                banner.appendChild(warning)
            }
            return
        }
        if (value === 'accepted' && typeof startAnalytics === 'function') startAnalytics();
        if (value === 'accepted' && typeof trackEvent === 'function') trackEvent('consent', 'cookies_accepted', 'banner');
        AppPopups.dismiss(banner).then(function() {
            document.body.classList.remove('cookie-banner-open');
            window.dispatchEvent(new Event('cookieconsentchange'))
        })
    }
    banner.querySelector('.popup-card__accept').addEventListener('click', function() {
        resolveConsent('accepted')
    });
    banner.querySelector('.popup-card__close').addEventListener('click', function() {
        resolveConsent('rejected')
    });
    AppPopups.enqueue('cookies', banner)
}
document.addEventListener('DOMContentLoaded', function() {
    initServiceWorker();
    initPersistentStorage();
    detectEnvironment();
    applyConfigValues();
    initTheme();
    initPWAInstall();
    setCurrentYear();
    setActiveNavItem();
    initWhatsAppLinks();
    initWhatsAppFabToggle();
    initShareDelegation();
    initImageFallbacks();
    initFormValidation();
    initCopyDelegation();
    initCookieBanner();
    ['theme-toggle', 'nav-theme-toggle', 'mobile-theme-toggle'].forEach(function(id) {
        var b = document.getElementById(id);
        if (b) b.addEventListener('click', toggleTheme)
    });
})