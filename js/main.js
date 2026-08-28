function isStandaloneMode() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === !0
}

function detectEnvironment() {
    var isStandalone = isStandaloneMode();
    var body = document.body;
    if (isStandalone) {
        body.classList.add('is-pwa');
        body.classList.remove('is-web')
    } else {
        body.classList.add('is-web');
        body.classList.remove('is-pwa');
        if (window.location.pathname.includes('settings.html')) {
            window.location.replace('index.html');
            return
        }
    }
}

function applyConfigValues() {
    var config = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG) ? APP_CONFIG : {};

    function resolve(path) {
        return path.split('.').reduce(function(obj, key) {
            return obj != null && obj[key] !== undefined ? obj[key] : null
        }, config)
    }
    document.querySelectorAll('[data-config-href]').forEach(function(el) {
        var key = el.dataset.configHref;
        var value = resolve(key);
        if (!value) {
            if (el.tagName === 'A') el.hidden = !0;
            return
        }
        if (key === 'email') {
            el.href = 'mailto:' + value
        } else if (key === 'phone1' || key === 'phone2') {
            el.href = 'tel:' + String(value).replace(/[^\d+]/g, '')
        } else {
            el.href = value
        }
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
var ICON_SPRITE = 'assets/icons/icons.svg#i-';

function setIcon(el, name) {
    if (!el) return;
    var use = el.querySelector ? el.querySelector('use') : null;
    if (use) use.setAttribute('href', ICON_SPRITE + name)
}

function makeIcon(name, cls) {
    var NS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', cls ? 'icon ' + cls : 'icon');
    svg.setAttribute('aria-hidden', 'true');
    var use = document.createElementNS(NS, 'use');
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
                if (toast.parentNode) toast.parentNode.removeChild(toast)
            }, 250)
        }, opts.autoDismissMs)
    }
}

function initServiceWorker() {
    if ('serviceWorker' in navigator) {
        var hadController = !!navigator.serviceWorker.controller;
        navigator.serviceWorker.addEventListener('controllerchange', function() {
            if (!hadController) return;
            if (_swUpdateInitiated) {
                _completeUpdate();
                return
            }
            _markUpdateReady()
        });
        var register = function() {
            var swScript = 'sw.js';
            navigator.serviceWorker.register(swScript, {
                updateViaCache: 'none'
            }).then(function(registration) {
                if (registration.waiting && navigator.serviceWorker.controller) {
                    _maybeShowUpdateToast(registration.waiting)
                }
                registration.addEventListener('updatefound', function() {
                    var newWorker = registration.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', function() {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                _maybeShowUpdateToast(newWorker)
                            }
                        })
                    }
                })
            }).catch(function(error) {
                console.error('Error al registrar el Service Worker:', error)
            })
        };
        if (document.readyState === 'complete') {
            register()
        } else {
            window.addEventListener('load', register)
        }
    }
}

function initPersistentStorage() {
    if (!navigator.storage || typeof navigator.storage.persist !== 'function' || typeof navigator.storage.persisted !== 'function') return;
    if (!isStandaloneMode()) return;
    navigator.storage.persisted().then(function(already) {
        if (already) return;
        navigator.storage.persist().catch(function() {})
    }).catch(function() {})
}

function _getWorkerVersion(worker) {
    return new Promise(function(resolve) {
        if (!worker || typeof MessageChannel === 'undefined') {
            resolve(null);
            return
        }
        var channel = new MessageChannel();
        var settled = !1;

        function finish(version) {
            if (settled) return;
            settled = !0;
            resolve(version || null)
        }
        channel.port1.onmessage = function(e) {
            finish(e.data)
        };
        try {
            worker.postMessage({
                type: 'GET_VERSION'
            }, [channel.port2])
        } catch (err) {
            finish(null);
            return
        }
        setTimeout(function() {
            finish(null)
        }, 2000)
    })
}

function _isNewerVersion(candidate, current) {
    if (!candidate || !current) return !0;
    if (candidate === current) return !1;
    var a = String(candidate).split('.').map(Number);
    var b = String(current).split('.').map(Number);
    for (var i = 0; i < Math.max(a.length, b.length); i++) {
        var x = a[i] || 0,
            y = b[i] || 0;
        if (x > y) return !0;
        if (x < y) return !1
    }
    return !1
}

function _maybeShowUpdateToast(worker) {
    if (document.getElementById('sw-update-toast')) return;
    _getWorkerVersion(worker).then(function(newVersion) {
        var config = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG) ? APP_CONFIG : {};
        var currentVersion = config.appVersion || null;
        if (!_isNewerVersion(newVersion, currentVersion)) return;
        _showUpdateToast(worker)
    })
}
var _swUpdateReady = !1;
var _swUpdateApplying = !1;
var _swUpdateInitiated = !1;
var _swUpdateRecoveryTimer = null;

function _showUpdateToast(worker) {
    if (document.getElementById('sw-update-toast')) return;
    makeToast('Nueva versión', {
        id: 'sw-update-toast',
        actionLabel: 'Actualizar',
        onAction: function(btn) {
            if (_swUpdateReady) {
                _openUpdatedHome(btn);
                return
            }
            _applyUpdate(worker, btn)
        }
    })
}

function _applyUpdate(worker, btn) {
    if (_swUpdateApplying) return;
    _swUpdateApplying = !0;
    _swUpdateInitiated = !0;
    btn.disabled = !0;
    btn.setAttribute('aria-busy', 'true');
    btn.innerHTML = '<svg class="icon icon-spin me-1" aria-hidden="true"><use href="' + ICON_SPRITE + 'loader-circle"></use></svg>Actualizando…';
    var toast = document.getElementById('sw-update-toast');
    var msg = toast ? toast.querySelector('span') : null;
    if (msg) msg.textContent = 'Aplicando actualización…';
    if (typeof trackEvent === 'function') trackEvent('pwa', 'update_accepted');
    try {
        worker.postMessage({
            type: 'SKIP_WAITING'
        })
    } catch (err) {}
    _swUpdateRecoveryTimer = setTimeout(function() {
        _swUpdateApplying = !1;
        _swUpdateRecoveryTimer = null;
        if (msg) msg.textContent = 'Está tardando más de lo normal';
        btn.disabled = !1;
        btn.removeAttribute('aria-busy');
        btn.innerHTML = '<svg class="icon me-1" aria-hidden="true"><use href="assets/icons/icons.svg#i-rotate-cw"></use></svg>Reintentar'
    }, 15000)
}

function _completeUpdate() {
    if (_swUpdateReady) return;
    _swUpdateReady = !0;
    if (_swUpdateRecoveryTimer) {
        clearTimeout(_swUpdateRecoveryTimer);
        _swUpdateRecoveryTimer = null
    }
    if (typeof trackEvent === 'function') trackEvent('pwa', 'update_ready');
    _restartApp()
}

function _markUpdateReady() {
    if (_swUpdateReady) return;
    _swUpdateReady = !0;
    if (typeof trackEvent === 'function') trackEvent('pwa', 'update_ready');
    var toast = document.getElementById('sw-update-toast');
    if (!toast) {
        makeToast('Actualización lista', {
            id: 'sw-update-toast',
            actionLabel: 'Abrir inicio',
            onAction: _openUpdatedHome
        });
        return
    }
    var msg = toast.querySelector('span');
    if (msg) msg.textContent = 'Actualización lista';
    var btn = toast.querySelector('button');
    if (btn) {
        btn.disabled = !1;
        btn.removeAttribute('aria-busy');
        btn.innerHTML = '<svg class="icon me-1" aria-hidden="true"><use href="assets/icons/icons.svg#i-house"></use></svg>Abrir inicio'
    }
}

function _openUpdatedHome(btn) {
    if (btn) btn.disabled = !0;
    window.location.replace('index.html')
}

function _restartApp() {
    if (typeof trackEvent === 'function') trackEvent('pwa', 'update_restart');
    window.location.replace('splash.html')
}

function installPlatform() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent) ? 'ios' : 'android_desktop'
}

function isIOSStandaloneEligible() {
    return installPlatform() === 'ios' && !window.navigator.standalone
}
var deferredPrompt = null;

function initPWAInstall() {
    window.addEventListener('beforeinstallprompt', function(e) {
        e.preventDefault();
        deferredPrompt = e;
        setInstallUIVisible(!0);
        if (typeof trackEvent === 'function') trackEvent('pwa', 'install_prompted', installPlatform());
    });
    if (isIOSStandaloneEligible()) {
        setInstallUIVisible(!0)
    }
    window.addEventListener('appinstalled', function() {
        deferredPrompt = null;
        setInstallUIVisible(!1);
        if (typeof trackEvent === 'function') trackEvent('pwa', 'installed', installPlatform());
    });
    ['nav-pwa-install-btn', 'mobile-pwa-install-btn'].forEach(function(id) {
        var b = document.getElementById(id);
        if (b) b.addEventListener('click', handlePWAInstallClick)
    });
}

function setInstallUIVisible(show) {
    var navItem = document.getElementById('nav-install-item');
    if (navItem) navItem.style.display = show ? 'block' : 'none';
    var navDivider = document.querySelector('.nav-install-divider');
    if (navDivider) navDivider.style.display = show ? 'block' : 'none';
    var mobileItem = document.getElementById('mobile-install-item');
    if (mobileItem) mobileItem.style.display = show ? 'block' : 'none'
}

function handlePWAInstallClick() {
    var isIOS = isIOSStandaloneEligible();
    var platform = isIOS ? 'ios' : 'android_desktop';
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(function(choiceResult) {
            if (typeof trackEvent === 'function') {
                if (choiceResult.outcome === 'accepted') {
                    trackEvent('pwa', 'install_accepted', platform)
                } else {
                    trackEvent('pwa', 'install_dismissed', platform)
                }
            }
            deferredPrompt = null;
            setInstallUIVisible(!1)
        })
    } else if (isIOS) {
        showIOSInstallModal()
    }
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
    var currentPage = document.body.dataset.page;
    if (!currentPage) return;
    var tabItems = document.querySelectorAll('#tabbar-pwa .tabbar-item');
    var tabbar = document.getElementById('tabbar-pwa');
    if (tabbar) tabbar.addEventListener('click', handleCurrentTabClick);
    tabItems.forEach(function(item) {
        var match = item.dataset.pageLink === currentPage;
        item.classList.toggle('active', match);
        if (match) {
            item.setAttribute('aria-current', 'page')
        } else {
            item.removeAttribute('aria-current')
        }
    });
    var navLinks = document.querySelectorAll('#navbar-web .nav-link');
    var currentPath = window.location.pathname;
    navLinks.forEach(function(link) {
        try {
            var href = link.getAttribute('href');
            if (!href || href === '#') return;
            var linkPath = new URL(link.href, window.location.origin).pathname;
            var match = linkPath === currentPath || (currentPath === '/' && linkPath === '/index.html');
            link.classList.toggle('active', match);
            if (match) {
                link.setAttribute('aria-current', 'page')
            } else {
                link.removeAttribute('aria-current')
            }
        } catch (e) {}
    })
}

function copyToClipboard(text, buttonElement) {
    var originalHTML = buttonElement ? (buttonElement._copyOriginalHTML === undefined ? buttonElement.innerHTML : buttonElement._copyOriginalHTML) : null;
    if (buttonElement) buttonElement._copyOriginalHTML = originalHTML;

    function onSuccess() {
        if (!buttonElement) return;
        if (buttonElement._copyResetTimer) clearTimeout(buttonElement._copyResetTimer);
        buttonElement.innerHTML = '<svg class="icon me-1" aria-hidden="true"><use href="assets/icons/icons.svg#i-check"></use></svg>¡Copiado!';
        var resetTimer = setTimeout(function() {
            buttonElement.innerHTML = originalHTML;
            if (buttonElement._copyResetTimer !== resetTimer) return;
            delete buttonElement._copyOriginalHTML;
            delete buttonElement._copyResetTimer
        }, 2000);
        buttonElement._copyResetTimer = resetTimer
    }

    function onFailure() {
        console.warn('copyToClipboard: Clipboard API no disponible')
    }
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        navigator.clipboard.writeText(text).then(onSuccess).catch(onFailure)
    } else {
        onFailure()
    }
}

function initCopyDelegation() {
    document.addEventListener('click', function(e) {
        var btn = e.target.closest('[data-copy]');
        if (btn) copyToClipboard(btn.dataset.copy, btn)
    })
}

function shareContent(title, text, url, imageUrl) {
    var baseData = normalizeShareData(title, text, url);
    trackShare('attempt', baseData);
    if (!canUseNativeShare(baseData)) {
        return copyShareFallback(baseData, 'unavailable')
    }
    return getBestShareData(baseData, imageUrl).then(function(shareData) {
        return shareNatively(shareData, baseData)
    }).catch(function() {
        return shareNatively(baseData, baseData)
    })
}

function normalizeShareData(title, text, url) {
    var config = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG) ? APP_CONFIG : {};
    var shareTitle = normalizeShareText(title) || document.title || config.appName || '';
    var shareText = normalizeShareText(text);
    var shareUrl = normalizeShareUrl(url);
    return compactShareData({
        title: shareTitle,
        text: shareText,
        url: shareUrl
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
        if (key === 'files') {
            if (data.files && data.files.length) clean.files = data.files;
            return
        }
        if (data[key]) clean[key] = data[key]
    });
    if (!clean.title && !clean.text && !clean.url && (!clean.files || !clean.files.length)) {
        clean.url = window.location.href
    }
    return clean
}

function canUseNativeShare(data) {
    if (typeof navigator.share !== 'function') return !1;
    if (!isWebShareAllowedByPolicy()) return !1;
    return canShareData(data)
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
var SHARE_IMAGE_EXT = /\.(avif|bmp|gif|ico|jpe?g|jfif|pjpeg|pjp|png|svgz?|tiff?|webp)(\?.*)?(#.*)?$/i;

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
        var fileData = compactShareData({
            title: baseData.title,
            text: baseData.text,
            url: baseData.url,
            files: [file]
        });
        if (canShareFiles(fileData.files) && canShareData(fileData)) return fileData;
        var fileOnlyData = compactShareData({
            title: baseData.title,
            text: baseData.text,
            files: [file]
        });
        if (canShareFiles(fileOnlyData.files) && canShareData(fileOnlyData)) return fileOnlyData;
        return baseData
    }).catch(function() {
        return baseData
    })
}
var SHARE_IMAGE_FETCH_TIMEOUT_MS = 900;

function fileFromImageUrl(imageUrl) {
    var absoluteUrl;
    try {
        absoluteUrl = new URL(imageUrl, window.location.href)
    } catch (err) {
        return Promise.reject(err)
    }
    if (absoluteUrl.origin !== window.location.origin) {
        return Promise.reject(new Error('cross-origin image share blocked'))
    }
    var controller = (typeof AbortController === 'function') ? new AbortController() : null;
    var fetchTimer = controller ? setTimeout(function() {
        controller.abort()
    }, SHARE_IMAGE_FETCH_TIMEOUT_MS) : null;
    return fetch(absoluteUrl.href, controller ? {
        credentials: 'same-origin',
        signal: controller.signal
    } : {
        credentials: 'same-origin'
    }).then(function(res) {
        if (fetchTimer) clearTimeout(fetchTimer);
        if (!res.ok) throw new Error('share image unavailable');
        return res.blob()
    }).then(function(blob) {
        var type = blob.type || guessImageMimeType(absoluteUrl.pathname);
        if (!type || type.indexOf('image/') !== 0) throw new Error('share image type unsupported');
        return new File([blob], shareFileName(absoluteUrl.pathname, type), {
            type: type
        })
    }).catch(function(err) {
        if (fetchTimer) clearTimeout(fetchTimer);
        throw err
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
    var fallbackText = composeShareText(data);

    function onCopied() {
        showShareToast('Enlace copiado', {
            actionLabel: 'WhatsApp',
            onAction: function() {
                openShareFallbackTarget(data)
            }
        });
        trackShare('copy_fallback_' + reason, data)
    }

    function onFailed() {
        trackShare('clipboard_error_' + reason, data);
        if (typeof window.prompt === 'function') {
            window.prompt('Copia manualmente:', fallbackText)
        } else {
            showShareToast('No se pudo compartir el enlace')
        }
    }
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        return navigator.clipboard.writeText(fallbackText).then(onCopied).catch(onFailed)
    }
    onFailed();
    return Promise.resolve()
}

function composeShareText(data) {
    var parts = [];
    [data.title, data.text, data.url].forEach(function(part) {
        var value = normalizeShareText(part);
        if (value && parts.indexOf(value) === -1) parts.push(value)
    });
    return parts.join('\n\n')
}

function openShareFallbackTarget(data) {
    var shareText = composeShareText(data);
    var encodedText = encodeURIComponent(shareText);
    window.open('https://wa.me/?text=' + encodedText, '_blank', 'noopener,noreferrer')
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
    var explicitUrl = (trigger.getAttribute('data-share-url') || '').trim();
    if (explicitUrl) return explicitUrl;
    var card = trigger.closest('.swiper-slide .card-app[id]');
    if (card && card.id) {
        try {
            var cardUrl = new URL(window.location.href);
            cardUrl.hash = card.id;
            return cardUrl.href
        } catch (err) {
            return window.location.pathname + '#' + card.id
        }
    }
    return window.location.href
}

function initShareDelegation() {
    document.addEventListener('click', function(e) {
        var trigger = e.target.closest('[data-share-title]');
        if (!trigger) return;
        e.preventDefault();
        e.stopPropagation();
        var title = (trigger.getAttribute('data-share-title') || '').trim();
        var text = (trigger.getAttribute('data-share-text') || '').trim();
        var url = getShareUrlForTrigger(trigger);
        var imageUrl = null;
        var imageAttr = (trigger.getAttribute('data-share-image') || '').trim();
        if (imageAttr) {
            var raw = '';
            if (/\//.test(imageAttr) || /\.(webp|jpe?g|png|gif|avif)$/i.test(imageAttr)) {
                raw = imageAttr
            } else {
                var card = trigger.closest('.card-app') || trigger.parentElement;
                var img = card ? card.querySelector(imageAttr) : null;
                if (img) raw = (img.currentSrc || img.getAttribute('src') || '')
            }
            raw = raw.trim();
            if (raw) {
                try {
                    imageUrl = new URL(raw, window.location.href).href
                } catch (errUrl) {
                    imageUrl = null
                }
            }
        }
        shareContent(title, text, url, imageUrl)
    })
}

function initWhatsAppLinks() {
    var config = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG) ? APP_CONFIG : {};
    if (!config.whatsappNumber) return;
    var url = 'https://wa.me/' + config.whatsappNumber;
    var fab = document.getElementById('whatsapp-fab');
    if (fab) fab.href = url;
    document.querySelectorAll('[data-action="open-whatsapp"]').forEach(function(el) {
        el.href = url
    })
}

function initWhatsAppFabToggle() {
    var enabled = !0;
    try {
        enabled = localStorage.getItem('whatsappFab') !== 'off'
    } catch (err) {}
    var fab = document.getElementById('whatsapp-fab');
    if (fab) fab.style.display = enabled ? '' : 'none';
    var toggle = document.getElementById('whatsapp-fab-toggle');
    if (!toggle) return;

    function render() {
        toggle.setAttribute('data-fab', enabled ? 'on' : 'off');
        toggle.setAttribute('aria-checked', enabled ? 'true' : 'false');
        var label = document.getElementById('whatsapp-fab-label');
        if (label) label.textContent = enabled ? 'Visible' : 'Oculto'
    }
    render();
    toggle.addEventListener('click', function() {
        enabled = !enabled;
        try {
            localStorage.setItem('whatsappFab', enabled ? 'on' : 'off')
        } catch (err) {}
        if (fab) fab.style.display = enabled ? '' : 'none';
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
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            clearFormErrors(form);
            var isValid = !0;
            var firstInvalid = null;
            var fields = form.querySelectorAll('input, textarea, select');
            fields.forEach(function(field) {
                var error = _validateField(field);
                if (error) {
                    isValid = !1;
                    if (!firstInvalid) firstInvalid = field;
                    var errId = _fieldErrorId(field);
                    var errorEl = document.createElement('span');
                    errorEl.className = 'field-error';
                    errorEl.id = errId;
                    errorEl.textContent = error;
                    field.classList.add('is-invalid');
                    field.setAttribute('aria-invalid', 'true');
                    var described = field.getAttribute('aria-describedby');
                    field.setAttribute('aria-describedby', described ? described + ' ' + errId : errId);
                    field.parentNode.insertBefore(errorEl, field.nextSibling)
                }
            });
            if (isValid) {
                submitFormData(form)
            } else {
                firstInvalid.focus();
                if (typeof trackFormSubmit === 'function') {
                    trackFormSubmit(form.id || 'contact-form', !1)
                }
            }
        });
        form.querySelectorAll('input, textarea, select').forEach(function(field) {
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
    if (!action) {
        form.classList.add('form-success');
        form.dispatchEvent(new CustomEvent('form-success', {
            bubbles: !1
        }));
        return
    }
    if (typeof window.fetch !== 'function') {
        form.submit();
        return
    }
    var submitBtn = form.querySelector('[type="submit"]');
    var originalLabel = submitBtn ? submitBtn.innerHTML : null;
    if (submitBtn) {
        submitBtn.disabled = !0;
        submitBtn.textContent = 'Enviando…'
    }

    function restoreButton() {
        if (!submitBtn) return;
        submitBtn.disabled = !1;
        submitBtn.innerHTML = originalLabel
    }
    fetch(action, {
        method: 'POST',
        body: new FormData(form),
        headers: {
            'Accept': 'application/json'
        }
    }).then(function(res) {
        if (!res.ok) throw new Error('Formspree ' + res.status);
        restoreButton();
        form.classList.add('form-success');
        form.dispatchEvent(new CustomEvent('form-success', {
            bubbles: !1
        }));
        form.reset();
        if (typeof trackFormSubmit === 'function') trackFormSubmit(form.id || 'contact-form', !0)
    }).catch(function() {
        restoreButton();
        _showFormSubmitError(form);
        if (typeof trackFormSubmit === 'function') trackFormSubmit(form.id || 'contact-form', !1)
    })
}

function _showFormSubmitError(form) {
    var existing = form.querySelector('.form-submit-error');
    if (existing) existing.remove();
    var errorEl = document.createElement('span');
    errorEl.className = 'field-error form-submit-error';
    errorEl.setAttribute('role', 'alert');
    errorEl.textContent = 'No se pudo enviar el mensaje. Revisa tu conexión e inténtalo de nuevo.';
    var submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) {
        submitBtn.insertAdjacentElement('afterend', errorEl)
    } else {
        form.appendChild(errorEl)
    }
}

function clearFormErrors(form) {
    form.querySelectorAll('.is-invalid').forEach(function(field) {
        _clearFieldError(field)
    });
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

function initCookieBanner() {
    if (document.getElementById('splash-screen')) return;
    try {
        if (localStorage.getItem('cookieConsent')) return
    } catch (err) {}
    if (document.getElementById('cookie-banner')) return;
    var banner = document.createElement('div');
    banner.id = 'cookie-banner';
    banner.className = 'cookie-banner';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-labelledby', 'cookie-banner-title');
    banner.innerHTML = '<span class="cookie-banner-icon" aria-hidden="true">' + '<svg class="cookie-banner-cookie" viewBox="0 0 32 32" role="presentation" focusable="false">' + '<circle cx="16" cy="16" r="13" fill="currentColor"/>' + '<g class="cookie-banner-chips">' + '<circle cx="11.6" cy="12.2" r="2.1"/>' + '<circle cx="20.6" cy="10.9" r="1.5"/>' + '<circle cx="19.9" cy="18.4" r="2.4"/>' + '<circle cx="11.2" cy="20.6" r="1.7"/>' + '<circle cx="16.1" cy="15.2" r="1.1"/>' + '</g>' + '</svg>' + '</span>' + '<div class="cookie-banner-body">' + '<h2 id="cookie-banner-title" class="cookie-banner-title">Usamos cookies</h2>' + '<p class="cookie-banner-text">Usamos cookies para mejorar un sitio que piensa en ti. Consulta el <a href="privacidad.html">Aviso de Privacidad</a>.</p>' + '</div>' + '<button type="button" class="btn btn-app btn-app--primary cookie-banner-accept">Aceptar</button>';
    document.body.appendChild(banner);
    document.body.classList.add('cookie-banner-open');

    function dismiss() {
        try {
            localStorage.setItem('cookieConsent', 'accepted')
        } catch (err) {}
        if (typeof startAnalytics === 'function') startAnalytics();
        if (typeof trackEvent === 'function') trackEvent('consent', 'cookies_accepted', 'banner');
        document.body.classList.remove('cookie-banner-open');
        banner.classList.remove('is-visible');
        var removed = !1;

        function done() {
            if (removed) return;
            removed = !0;
            banner.remove()
        }
        banner.addEventListener('transitionend', done, {
            once: !0
        });
        setTimeout(done, 500)
    }
    banner.querySelector('.cookie-banner-accept').addEventListener('click', dismiss);
    requestAnimationFrame(function() {
        banner.classList.add('is-visible')
    })
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