function isStandaloneMode() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === !0
}

function detectEnvironment() {
    var isStandalone = isStandaloneMode();
    var body = document.body;
    var pathname = window.location.pathname;
    if (isStandalone) {
        body.classList.add('is-pwa');
        body.classList.remove('is-web')
    } else {
        body.classList.add('is-web');
        body.classList.remove('is-pwa');
        if (pathname.includes('settings.html')) {
            window.location.replace('index.html');
            return
        }
    }
}

function applyConfigValues() {
    function resolve(path) {
        return path.split('.').reduce(function(obj, key) {
            return obj != null && obj[key] !== undefined ? obj[key] : null
        }, APP_CONFIG)
    }
    document.querySelectorAll('[data-config-href]').forEach(function(el) {
        var key = el.dataset.configHref;
        var value = resolve(key);
        if (!value) return;
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
    var saved = localStorage.getItem('theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = saved || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
    _updateThemeIcon(theme)
}

function _updateThemeIcon(theme) {
    var isDark = theme === 'dark';
    var iconCls = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    [
        ['theme-icon', 'theme-label', 'Modo oscuro', 'Modo claro'],
        ['nav-theme-icon', 'nav-theme-label', 'Oscuro', 'Claro'],
        ['mobile-theme-icon', 'mobile-theme-label', 'Oscuro', 'Claro']
    ].forEach(function(g) {
        var ic = document.getElementById(g[0]);
        if (ic) ic.className = iconCls;
        var lb = document.getElementById(g[1]);
        if (lb) lb.textContent = isDark ? g[2] : g[3]
    });
    var themeSwitch = document.getElementById('theme-toggle');
    if (themeSwitch) themeSwitch.setAttribute('aria-checked', isDark ? 'true' : 'false')
}

function toggleTheme() {
    var current = document.documentElement.getAttribute('data-theme');
    var next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', next);
    document.documentElement.setAttribute('data-theme', next);
    _updateThemeIcon(next)
}

function makeToast(message, opts) {
    opts = opts || {};
    var hasAction = !!opts.actionLabel;
    var toast = document.createElement('div');
    if (opts.id) toast.id = opts.id;
    var layout = hasAction ? 'display:flex;align-items:center;gap:.75rem;padding:.6rem .75rem .6rem 1.25rem;' : 'padding:.75rem 1.25rem;pointer-events:none;';
    var bottom = document.body.classList.contains('is-pwa') ? 'calc(var(--tabbar-height) + 1rem + env(safe-area-inset-bottom))' : 'calc(2rem + env(safe-area-inset-bottom))';
    toast.style.cssText = 'position:fixed;left:50%;bottom:' + bottom + ';' + 'transform:translateX(-50%) translateY(1rem);z-index:2000;' + 'max-width:calc(100% - 2rem);' + layout + 'background:var(--color-surface);color:var(--color-text-primary);' + 'border:1px solid var(--color-border);border-radius:var(--radius-pill);' + 'box-shadow:var(--shadow-card);font-family:var(--font-secondary);' + 'font-size:.9rem;font-weight:500;opacity:0;' + 'transition:opacity var(--motion-base) var(--ease-standard), transform var(--motion-base) var(--ease-standard);';
    if (hasAction) {
        var msg = document.createElement('span');
        msg.textContent = message;
        toast.appendChild(msg);
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-primary-pill';
        btn.textContent = opts.actionLabel;
        btn.style.cssText = 'padding:.35rem .9rem;font-size:.85rem;white-space:nowrap;';
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
                    _maybeShowUpdateToast(registration, registration.waiting)
                }
                registration.addEventListener('updatefound', function() {
                    var newWorker = registration.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', function() {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                _maybeShowUpdateToast(registration, newWorker)
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
    if (!navigator.storage || !navigator.storage.persist) return;
    var isStandalone = isStandaloneMode();
    if (!isStandalone) return;
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

function _maybeShowUpdateToast(registration, worker) {
    if (document.getElementById('sw-update-toast')) return;
    _getWorkerVersion(worker).then(function(newVersion) {
        var currentVersion = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG && APP_CONFIG.appVersion) ? APP_CONFIG.appVersion : null;
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
    var spinnerClass = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'fa-solid fa-spinner me-1' : 'fa-solid fa-spinner fa-spin me-1';
    btn.innerHTML = '<i class="' + spinnerClass + '" aria-hidden="true"></i>Actualizando…';
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
        btn.innerHTML = '<i class="fa-solid fa-rotate-right me-1" aria-hidden="true"></i>Reintentar'
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
        btn.innerHTML = '<i class="fa-solid fa-house me-1" aria-hidden="true"></i>Abrir inicio'
    }
}

function _openUpdatedHome(btn) {
    if (btn) btn.disabled = !0;
    window.location.replace('index.html')
}

function _restartApp(btn) {
    if (btn) btn.disabled = !0;
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
    var isIOS = isIOSStandaloneEligible();
    window.addEventListener('beforeinstallprompt', function(e) {
        e.preventDefault();
        deferredPrompt = e;
        setInstallUIVisible(!0);
        if (typeof trackEvent === 'function') trackEvent('pwa', 'install_prompted', installPlatform());
    });
    if (isIOS) {
        setInstallUIVisible(!0)
    }
    window.addEventListener('appinstalled', function() {
        deferredPrompt = null;
        setInstallUIVisible(!1);
        if (typeof trackEvent === 'function') trackEvent('pwa', 'installed', installPlatform());
    });
    ['pwa-install-btn', 'nav-pwa-install-btn', 'mobile-pwa-install-btn'].forEach(function(id) {
        var b = document.getElementById(id);
        if (b) b.addEventListener('click', handlePWAInstallClick)
    });
}

function setInstallUIVisible(show) {
    var btn = document.getElementById('pwa-install-btn');
    if (btn) {
        btn.style.display = show ? 'inline-flex' : 'none';
        var row = btn.closest('.settings-install-row');
        if (row) row.style.display = show ? 'flex' : 'none'
    }
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
            deferredPrompt = null
        })
    } else if (isIOS) {
        showIOSInstallModal()
    }
}

function showIOSInstallModal() {
    if (document.getElementById('ios-install-modal')) return;
    if (typeof trackEvent === 'function') trackEvent('pwa', 'ios_modal_shown', 'ios');
    var overlay = document.createElement('div');
    overlay.id = 'ios-install-modal';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'ios-install-title');
    overlay.style.cssText = 'position:fixed;inset:0;display:flex;align-items:flex-end;' + 'justify-content:center;padding:1.5rem;z-index:9999;' + 'background:rgba(0,0,0,0.55);' + 'backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);';
    var panel = document.createElement('div');
    panel.setAttribute('tabindex', '-1');
    panel.style.cssText = 'background:var(--color-surface);border-radius:1.5rem;' + 'padding:1.75rem;width:100%;max-width:400px;' + 'color:var(--color-text-primary);font-family:var(--font-secondary),-apple-system,sans-serif;font-size:0.95rem;' + 'border:1px solid var(--color-border);' + 'box-shadow:var(--shadow-card);' + 'backdrop-filter:blur(20px) saturate(180%);' + '-webkit-backdrop-filter:blur(20px) saturate(180%);';
    panel.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.25rem;">' + '<strong id="ios-install-title" style="font-size:1.05rem;">Instalar ' + APP_CONFIG.appName + '</strong>' + '<button data-action="close-ios-install" aria-label="Cerrar" style="background:none;border:none;' + 'color:var(--color-text-muted);font-size:1.5rem;cursor:pointer;padding:0;line-height:1;">' + '&times;' + '</button>' + '</div>' + '<ol style="padding:0;list-style:none;margin:0;display:flex;flex-direction:column;gap:1.1rem;">' + '<li style="display:flex;align-items:center;gap:0.9rem;">' + '<i class="fa-solid fa-arrow-up-from-bracket" style="color:var(--color-brand);font-size:1.2rem;width:24px;text-align:center;flex-shrink:0;"></i>' + '<span>Toca el botón <strong>Compartir</strong> en Safari</span>' + '</li>' + '<li style="display:flex;align-items:center;gap:0.9rem;">' + '<i class="fa-solid fa-plus-square" style="color:var(--color-brand);font-size:1.2rem;width:24px;text-align:center;flex-shrink:0;"></i>' + '<span>Selecciona <strong>Agregar a pantalla de inicio</strong></span>' + '</li>' + '<li style="display:flex;align-items:center;gap:0.9rem;">' + '<i class="fa-solid fa-check" style="color:var(--color-brand);font-size:1.2rem;width:24px;text-align:center;flex-shrink:0;"></i>' + '<span>Toca <strong>Agregar</strong> para confirmar</span>' + '</li>' + '</ol>';
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

function setActiveNavItem() {
    var currentPage = document.body.dataset.page;
    if (!currentPage) return;
    var tabItems = document.querySelectorAll('#tabbar-pwa .tabbar-item');
    tabItems.forEach(function(item) {
        var match = item.dataset.pageLink === currentPage;
        item.classList.toggle('active', match);
        if (match) {
            item.setAttribute('aria-current', 'page');
            item.addEventListener('click', function(e) {
                e.preventDefault();
                var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                window.scrollTo({
                    top: 0,
                    behavior: reducedMotion ? 'auto' : 'smooth'
                })
            })
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

function forceTabbarRepaint() {
    var tabbar = document.getElementById('tabbar-pwa');
    if (!tabbar || !document.body.classList.contains('is-pwa')) return;
    var display = tabbar.style.display;
    tabbar.style.display = 'none';
    void tabbar.offsetHeight;
    tabbar.style.display = display
}

function initTabbarStability() {
    if (!document.getElementById('tabbar-pwa')) return;
    window.addEventListener('pageshow', forceTabbarRepaint);
    window.addEventListener('orientationchange', forceTabbarRepaint);
    var resizeTicking = !1;
    window.addEventListener('resize', function() {
        if (resizeTicking) return;
        resizeTicking = !0;
        requestAnimationFrame(function() {
            resizeTicking = !1;
            forceTabbarRepaint()
        })
    });
    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'visible') forceTabbarRepaint()
    })
}

function copyToClipboard(text, buttonElement) {
    var originalHTML = buttonElement ? buttonElement.innerHTML : null;

    function onSuccess() {
        if (!buttonElement) return;
        buttonElement.innerHTML = '<i class="fa-solid fa-check me-1"></i>¡Copiado!';
        setTimeout(function() {
            buttonElement.innerHTML = originalHTML
        }, 2000)
    }

    function onFailure() {
        console.warn('copyToClipboard: Clipboard API no disponible')
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
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
    var shareTitle = normalizeShareText(title) || document.title || (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.appName) || '';
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
        trackShare('success', fallbackData);
        forceTabbarRepaint()
    }).catch(function(err) {
        var name = err && err.name ? err.name : 'unknown';
        if (name === 'AbortError') {
            trackShare('cancel', fallbackData);
            forceTabbarRepaint();
            return
        }
        trackShare('error_' + name, fallbackData);
        return copyShareFallback(fallbackData, name).then(forceTabbarRepaint)
    })
}

function copyShareFallback(data, reason) {
    var fallbackText = composeShareText(data);

    function onCopied() {
        showShareToast('Enlace copiado', {
            actionLabel: 'WhatsApp',
            onAction: function() {
                openShareFallbackTarget('whatsapp', data)
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
    if (navigator.clipboard && navigator.clipboard.writeText) {
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

function openShareFallbackTarget(target, data) {
    var shareText = composeShareText(data);
    var encodedText = encodeURIComponent(shareText);
    var encodedUrl = encodeURIComponent(data.url || window.location.href);
    var encodedTitle = encodeURIComponent(data.title || document.title || '');
    var fallbackUrls = {
        whatsapp: 'https://wa.me/?text=' + encodedText,
        telegram: 'https://t.me/share/url?url=' + encodedUrl + '&text=' + encodeURIComponent([data.title, data.text].filter(Boolean).join('\n\n')),
        facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + encodedUrl,
        x: 'https://twitter.com/intent/tweet?url=' + encodedUrl + '&text=' + encodeURIComponent([data.title, data.text].filter(Boolean).join(' - ')),
        linkedin: 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodedUrl,
        email: 'mailto:?subject=' + encodedTitle + '&body=' + encodedText
    };
    if (!fallbackUrls[target]) return;
    window.open(fallbackUrls[target], '_blank', 'noopener,noreferrer')
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
    var card = trigger.closest('.card-ministerio[id]');
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
    var url = 'https://wa.me/' + APP_CONFIG.whatsappNumber;
    var fab = document.getElementById('whatsapp-fab');
    if (fab) fab.href = url;
    document.querySelectorAll('[data-action="open-whatsapp"]').forEach(function(el) {
        el.href = url
    })
}

function initWhatsAppFabToggle() {
    var enabled = localStorage.getItem('whatsappFab') !== 'off';
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
        localStorage.setItem('whatsappFab', enabled ? 'on' : 'off');
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
    var forms = document.querySelectorAll('form[data-validate]');
    forms.forEach(function(form) {
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
    if (localStorage.getItem('cookieConsent')) return;
    if (document.getElementById('cookie-banner')) return;
    var banner = document.createElement('div');
    banner.id = 'cookie-banner';
    banner.className = 'cookie-banner';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Aviso de cookies');
    banner.innerHTML = '<p class="cookie-banner-text">Utilizamos cookies de Google Analytics para entender cómo se utiliza nuestro sitio y seguir mejorándolo. Al continuar navegando aceptas su uso. Consulta nuestro <a href="privacidad.html">Aviso de Privacidad</a>.</p>' + '<button type="button" class="btn-primary-pill cookie-banner-accept">Aceptar</button>';
    document.body.appendChild(banner);
    document.body.classList.add('cookie-banner-open');

    function dismiss() {
        localStorage.setItem('cookieConsent', 'accepted');
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
    initTabbarStability();
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
