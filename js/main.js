var deferredPrompt = null;

function detectEnvironment() {
    var isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === !0;
    var body = document.body;
    var pathname = window.location.pathname;
    if (isStandalone) {
        body.classList.add('is-pwa');
        body.classList.remove('is-web');
        var isIndex = pathname === '/' || pathname === '/index.html' || pathname.endsWith('/index.html');
        if (isIndex && !sessionStorage.getItem('splashShown')) {
            sessionStorage.setItem('splashShown', 'true');
            window.location.href = 'splash.html';
            return
        }
    } else {
        body.classList.add('is-web');
        body.classList.remove('is-pwa');
        if (pathname.includes('settings.html')) {
            window.location.replace('index.html');
            return
        }
    }
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
    window.addEventListener('resize', forceTabbarRepaint);
    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'visible') forceTabbarRepaint()
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
    })
}

function toggleTheme() {
    var current = document.documentElement.getAttribute('data-theme');
    var next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', next);
    document.documentElement.setAttribute('data-theme', next);
    _updateThemeIcon(next)
}

function initServiceWorker() {
    if ('serviceWorker' in navigator) {
        var isReloadingForServiceWorker = false;
        function reloadForServiceWorkerUpdate() {
            if (isReloadingForServiceWorker) return;
            isReloadingForServiceWorker = true;
            var updateToast = document.getElementById('sw-update-toast');
            if (updateToast && updateToast.parentNode) updateToast.parentNode.removeChild(updateToast);
            window.location.reload();
        }
        navigator.serviceWorker.addEventListener('controllerchange', function() {
            reloadForServiceWorkerUpdate();
        });
        var register = function() {
            var swScript = 'sw.js';
            navigator.serviceWorker.register(swScript, { updateViaCache: 'none' }).then(function(registration) {
                if (registration.waiting && navigator.serviceWorker.controller) {
                    _maybeShowUpdateToast(registration, registration.waiting, reloadForServiceWorkerUpdate)
                }
                registration.addEventListener('updatefound', function() {
                    var newWorker = registration.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', function() {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                _maybeShowUpdateToast(registration, newWorker, reloadForServiceWorkerUpdate)
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

function makeToast(message, opts) {
    opts = opts || {};
    var hasAction = !!opts.actionLabel;
    var toast = document.createElement('div');
    if (opts.id) toast.id = opts.id;
    toast.setAttribute('role', 'status');
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
            worker.postMessage({ type: 'GET_VERSION' }, [channel.port2])
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
        var x = a[i] || 0, y = b[i] || 0;
        if (x > y) return !0;
        if (x < y) return !1
    }
    return !1
}

function _maybeShowUpdateToast(registration, worker, reloadForServiceWorkerUpdate) {
    if (document.getElementById('sw-update-toast')) return;
    _getWorkerVersion(worker).then(function(newVersion) {
        var currentVersion = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG && APP_CONFIG.appVersion) ? APP_CONFIG.appVersion : null;
        if (!_isNewerVersion(newVersion, currentVersion)) return;
        _showUpdateToast(registration, worker, reloadForServiceWorkerUpdate)
    })
}

function _showUpdateToast(registration, worker, reloadForServiceWorkerUpdate) {
    if (document.getElementById('sw-update-toast')) return;
    makeToast('Nueva versión', {
        id: 'sw-update-toast',
        actionLabel: 'Actualizar',
        onAction: function(btn) {
            btn.disabled = !0;
            btn.textContent = 'Actualizando…';
            worker.postMessage({ type: 'SKIP_WAITING' });
        }
    })
}

function installPlatform() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent) ? 'ios' : 'android_desktop'
}

function isIOSStandaloneEligible() {
    return installPlatform() === 'ios' && !window.navigator.standalone
}

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
    panel.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.25rem;">' + '<strong id="ios-install-title" style="font-size:1.05rem;">Instalar ' + APP_CONFIG.appName + '</strong>' + '<button onclick="closeIOSInstallModal()" aria-label="Cerrar" style="background:none;border:none;' + 'color:var(--color-text-muted);font-size:1.5rem;cursor:pointer;padding:0;line-height:1;">' + '&times;' + '</button>' + '</div>' + '<ol style="padding:0;list-style:none;margin:0;display:flex;flex-direction:column;gap:1.1rem;">' + '<li style="display:flex;align-items:center;gap:0.9rem;">' + '<i class="fa-solid fa-arrow-up-from-bracket" style="color:var(--color-brand);font-size:1.2rem;width:24px;text-align:center;flex-shrink:0;"></i>' + '<span>Toca el botón <strong>Compartir</strong> en Safari</span>' + '</li>' + '<li style="display:flex;align-items:center;gap:0.9rem;">' + '<i class="fa-solid fa-plus-square" style="color:var(--color-brand);font-size:1.2rem;width:24px;text-align:center;flex-shrink:0;"></i>' + '<span>Selecciona <strong>Agregar a pantalla de inicio</strong></span>' + '</li>' + '<li style="display:flex;align-items:center;gap:0.9rem;">' + '<i class="fa-solid fa-check" style="color:var(--color-brand);font-size:1.2rem;width:24px;text-align:center;flex-shrink:0;"></i>' + '<span>Toca <strong>Agregar</strong> para confirmar</span>' + '</li>' + '</ol>';
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) closeIOSInstallModal();
    });
    overlay.appendChild(panel);
    overlay._restoreFocus = document.activeElement;
    overlay._onKeydown = function(e) {
        if (e.key === 'Escape' || e.keyCode === 27) closeIOSInstallModal();
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

function setCurrentYear() {
    var el = document.getElementById('current-year');
    if (el) el.textContent = new Date().getFullYear();
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
    var IMAGE_EXT = /\.(webp|jpe?g|png|gif|avif)(\?.*)?$/i;
    var FETCH_TIMEOUT_MS = 1500;
    var shareUrl = (typeof url === 'string' && url.trim()) ? url.trim() : window.location.href;
    var shareText = (typeof text === 'string') ? text : '';
    var shareTitle = title || document.title;
    var baseData = {
        title: shareTitle,
        text: shareText,
        url: shareUrl
    };

    function track(action) {
        if (typeof trackEvent === 'function') trackEvent('share', action, title || shareUrl)
    }

    function copyLinkFallback() {
        function onCopied() {
            showShareToast('Enlace copiado');
            track('share_copy_fallback')
        }

        function onFailed() {
            track('share_clipboard_error');
            if (typeof window.prompt === 'function') {
                var manualText = [shareTitle, shareText, shareUrl].filter(function(part) {
                    return part && String(part).trim()
                }).join('\n\n');
                window.prompt('Copia manualmente:', manualText)
            } else {
                showShareToast('No se pudo compartir el enlace')
            }
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(shareUrl).then(onCopied).catch(onFailed)
        } else {
            onFailed()
        }
    }

    function attemptShare(shareData) {
        navigator.share(shareData).then(function() {
            track('share_success')
        }).catch(function(err) {
            var name = err && err.name ? err.name : 'unknown';
            if (name === 'AbortError') {
                track('share_cancel');
                return
            }
            if (typeof trackEvent === 'function') trackEvent('share', 'error', name);
            copyLinkFallback()
        }).finally(forceTabbarRepaint)
    }
    track('share_attempt');
    if (typeof navigator.share !== 'function') {
        copyLinkFallback();
        return
    }
    if (!imageUrl || !IMAGE_EXT.test(imageUrl) || typeof window.fetch !== 'function') {
        attemptShare(baseData);
        return
    }
    var controller = (typeof AbortController === 'function') ? new AbortController() : null;
    var fetchTimer = controller ? setTimeout(function() {
        controller.abort()
    }, FETCH_TIMEOUT_MS) : null;
    fetch(imageUrl, controller ? {
        mode: 'same-origin',
        signal: controller.signal
    } : {
        mode: 'same-origin'
    }).then(function(res) {
        if (fetchTimer) clearTimeout(fetchTimer);
        if (!res.ok) throw new Error('imagen no disponible');
        return res.blob()
    }).then(function(blob) {
        var segment = String(imageUrl).split('?')[0].split('#')[0].split('/').pop();
        var filename = segment && segment.indexOf('.') > 0 ? segment : 'image.jpg';
        var file = new File([blob], filename, {
            type: blob.type
        });
        var fileData = {
            title: shareTitle,
            text: shareText,
            url: shareUrl,
            files: [file]
        };
        if (typeof navigator.canShare !== 'function' || !navigator.canShare(fileData)) {
            attemptShare(baseData);
            return
        }
        attemptShare(fileData)
    }).catch(function() {
        if (fetchTimer) clearTimeout(fetchTimer);
        attemptShare(baseData)
    })
}

function showShareToast(message) {
    makeToast(message, {
        id: 'share-toast',
        autoDismissMs: 2600
    })
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

function initShareDelegation() {
    document.addEventListener('click', function(e) {
        var trigger = e.target.closest('[data-share-title]');
        if (!trigger) return;
        e.preventDefault();
        e.stopPropagation();
        var title = (trigger.getAttribute('data-share-title') || '').trim();
        var text = (trigger.getAttribute('data-share-text') || '').trim();
        var url = (trigger.getAttribute('data-share-url') || '').trim();
        if (!url) url = window.location.href;
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
