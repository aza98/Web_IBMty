"use strict";
const LIGHT_THEME = "light";
const DARK_THEME = "dark";

function getPreferredTheme() {
    return localStorage.getItem("theme") || (window.matchMedia("(prefers-color-scheme: dark)").matches ? DARK_THEME : LIGHT_THEME)
}

function setThemeIcons(isDark) {
    const icons = {
        mobile: document.getElementById("mobile-theme-icon"),
        desktop: document.getElementById("desktop-theme-icon")
    };
    const [remove, add] = isDark ? ["fa-sun", "fa-moon"] : ["fa-moon", "fa-sun"];
    Object.values(icons).forEach(icon => {
        if (icon) {
            icon.classList.replace(remove, add);
            if (!icon.classList.contains(add)) icon.classList.add(add);
        }
    })
}

function setTheme(theme) {
    document.documentElement.setAttribute("data-bs-theme", theme);
    localStorage.setItem("theme", theme);
    setThemeIcons(theme === DARK_THEME)
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-bs-theme");
    setTheme(currentTheme === LIGHT_THEME ? DARK_THEME : LIGHT_THEME)
}

function initAOS() {
    if (window.AOS) {
        AOS.init({
            duration: 500,
            easing: 'ease-out-cubic',
            once: !0,
            offset: 60,
            delay: 0,
            mobile: {
                duration: 400,
                easing: 'ease-out-cubic'
            },
            disable: () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
        })
    }
}

function initAnimateCSS() {
    document.querySelectorAll(".animate-on-load").forEach(el => el.classList.add("animate__animated", "animate__fadeIn"))
}

function initHeartIconEasterEgg() {
    const heartIcon = document.getElementById("heartIcon");
    if (!heartIcon) return;
    let clickCount = 0;
    let timer;
    heartIcon.addEventListener("click", () => {
        clickCount++;
        clearTimeout(timer);
        timer = setTimeout(() => {
            if (clickCount >= 7) {
                const modalEl = document.getElementById("developers");
                if (modalEl) new bootstrap.Modal(modalEl).show();
            }
            clickCount = 0
        }, 1000)
    })
}

function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text)
    }
    return new Promise((resolve, reject) => {
        try {
            const textArea = document.createElement("textarea");
            Object.assign(textArea.style, {
                position: "fixed",
                left: "-9999px",
                top: "0"
            });
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            const success = document.execCommand("copy");
            document.body.removeChild(textArea);
            success ? resolve() : reject(new Error("execCommand returned false"))
        } catch (err) {
            reject(err)
        }
    })
}

function initCopyButtons() {
    const copyToastEl = document.getElementById("copyToast");
    if (!copyToastEl) return;
    const copyToast = new bootstrap.Toast(copyToastEl);
    document.querySelectorAll(".copy-btn").forEach(button => {
        button.addEventListener("click", () => {
            const textToCopy = button.dataset.copy;
            if (textToCopy) {
                copyToClipboard(textToCopy).then(() => copyToast.show()).catch(err => {
                    console.error("Error copying:", err);
                    prompt("Copy the text manually:", textToCopy)
                })
            }
        })
    })
}

function initFormValidation() {
    document.querySelectorAll("#firstName, #lastName").forEach(el => {
        el.addEventListener("input", () => el.value = el.value.replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ\s]/g, ""))
    });
    const phoneInput = document.getElementById("phone");
    if (phoneInput) {
        phoneInput.addEventListener("input", e => e.target.value = e.target.value.replace(/[^0-9]/g, "").slice(0, 10))
    }
    const forms = document.querySelectorAll(".needs-validation");
    Array.from(forms).forEach(form => {
        form.addEventListener("submit", event => {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation()
            }
            form.classList.add("was-validated")
        }, !1)
    })
}
class ShareManager {
    static async share(title, text, url, imageSource = null) {
        if (!title || !url) {
            console.error("ShareManager: Title and URL are required.");
            return
        }
        const shareData = {
            title: title,
            text: text,
            url: url
        };
        try {
            if (imageSource && navigator.canShare && navigator.canShare({
                files: [new File([], "test.png")]
            })) {
                const file = await this._urlToFile(imageSource);
                if (file) {
                    shareData.files = [file];
                    shareData.text = `${text}\n\n${url}`;
                    shareData.url = ""
                }
            }
            if (navigator.share) {
                if (!shareData.url) delete shareData.url;
                await navigator.share(shareData)
            } else {
                this._fallbackShare(url)
            }
        } catch (error) {
            console.warn("Share failed or canceled:", error);
            if (error.name !== 'AbortError') {
                this._fallbackShare(url)
            }
        }
    }
    static async _urlToFile(url) {
        try {
            const response = await fetch(url, {
                mode: 'cors'
            });
            if (!response.ok) throw new Error("Image fetch failed");
            const blob = await response.blob();
            const mimeType = blob.type || "image/jpeg";
            const ext = mimeType.split('/')[1] || "jpg";
            return new File([blob], `share_image.${ext}`, {
                type: mimeType
            })
        } catch (error) {
            console.warn("Could not convert URL to File for sharing:", error);
            return null
        }
    }
    static _fallbackShare(url) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(url).then(() => this._showToast("Enlace copiado al portapapeles")).catch(() => prompt("Copia el enlace:", url))
        } else {
            prompt("Copia el enlace:", url)
        }
    }
    static _showToast(message) {
        let toastObj = null;
        if (window.bootstrap && window.bootstrap.Toast) {
            const toastEl = document.getElementById('copyToast');
            if (toastEl) {
                toastObj = new bootstrap.Toast(toastEl);
                const body = toastEl.querySelector('.toast-body');
                if (body) body.textContent = message;
                toastObj.show();
                return
            }
        }
        const t = document.createElement('div');
        t.style.cssText = `position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.8);color:white;padding:12px 24px;border-radius:50px;z-index:10000;font-family:system-ui,-apple-system,sans-serif;font-size:14px;opacity:0;transition:opacity 0.3s ease;`;
        t.textContent = message;
        document.body.appendChild(t);
        t.offsetHeight;
        t.style.opacity = '1';
        setTimeout(() => {
            t.style.opacity = '0';
            setTimeout(() => t.remove(), 300)
        }, 3000)
    }
}
window.shareContent = (title, text, url, image) => ShareManager.share(title, text, url, image);

function initGlobalShareButtons() {
    document.querySelectorAll('[data-title][data-description]').forEach(btn => {
        if (!btn.onclick && !btn.closest('.swiper')) {
            btn.onclick = (e) => {
                e.preventDefault();
                const title = btn.dataset.title;
                const text = btn.dataset.description;
                let url = btn.dataset.url || window.location.href;
                if (btn.closest('#localizacion')) {
                    const siblingLink = btn.closest('.row').querySelector('a[href^="https://www.google.com/maps"]');
                    if (siblingLink) url = siblingLink.href
                }
                const image = btn.dataset.image || null;
                shareContent(title, text, url, image)
            }
        }
    })
}

function initWhatsAppButton() {
    const whatsappBtn = document.querySelector(".whatsapp-floating-btn");
    if (!whatsappBtn) return;

    function isPWAMode() {
        const checks = [() => window.navigator.standalone === !0, () => window.matchMedia('(display-mode: standalone)').matches, () => window.matchMedia('(display-mode: fullscreen)').matches, () => window.matchMedia('(display-mode: minimal-ui)').matches, () => window.matchMedia('(display-mode: window-controls-overlay)').matches, () => document.referrer.includes('android-app://'), () => {
            const params = new URLSearchParams(window.location.search);
            return params.get('source') === 'pwa' || params.get('mode') === 'standalone'
        }];
        return checks.some(check => check())
    }

    function checkAndHideIfPWA() {
        if (isPWAMode()) {
            whatsappBtn.style.display = "none";
            whatsappBtn.setAttribute('data-pwa-hidden', 'true');
            return !0
        }
        return !1
    }
    if (checkAndHideIfPWA()) return;
    setTimeout(checkAndHideIfPWA, 100);
    window.matchMedia('(display-mode: standalone)').addEventListener('change', e => {
        if (e.matches) whatsappBtn.style.display = "none"
    });
    let lastScroll = 0;
    let ticking = !1;
    window.addEventListener("scroll", () => {
        if (whatsappBtn.getAttribute('data-pwa-hidden') === 'true') return;
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const currentScroll = window.scrollY;
                if (currentScroll > 100) {
                    whatsappBtn.classList.toggle("scrolled", currentScroll > lastScroll)
                } else {
                    whatsappBtn.classList.remove("scrolled")
                }
                lastScroll = currentScroll;
                ticking = !1
            });
            ticking = !0
        }
    }, {
        passive: !0
    })
}
document.addEventListener("DOMContentLoaded", () => {
    setTheme(getPreferredTheme());
    initAOS();
    initAnimateCSS();
    initHeartIconEasterEgg();
    initCopyButtons();
    initFormValidation();
    initWhatsAppButton();
    if (typeof initGlobalShareButtons === 'function') initGlobalShareButtons();
    if (window.CSS && CSS.supports("padding-bottom: env(safe-area-inset-bottom)")) {
        document.body.classList.add("supports-safe-area")
    }
    const currentYearEl = document.getElementById("currentYear");
    if (currentYearEl) currentYearEl.textContent = new Date().getFullYear();
})