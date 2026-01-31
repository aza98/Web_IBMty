"use strict";
const Theme = {
    LIGHT: "light",
    DARK: "dark",
    KEY: "theme",
    get() {
        return localStorage.getItem(this.KEY) || (matchMedia("(prefers-color-scheme: dark)").matches ? this.DARK : this.LIGHT)
    },
    set(theme) {
        document.documentElement.setAttribute("data-bs-theme", theme);
        localStorage.setItem(this.KEY, theme);
        this._updateIcons(theme === this.DARK)
    },
    toggle() {
        const current = document.documentElement.getAttribute("data-bs-theme");
        this.set(current === this.LIGHT ? this.DARK : this.LIGHT)
    },
    _updateIcons(isDark) {
        const [remove, add] = isDark ? ["fa-sun", "fa-moon"] : ["fa-moon", "fa-sun"];
        ["mobile-theme-icon", "desktop-theme-icon"].forEach(id => {
            const icon = document.getElementById(id);
            if (icon) {
                icon.classList.remove(remove);
                icon.classList.add(add)
            }
        })
    }
};
window.toggleTheme = () => Theme.toggle();

function initAOS() {
    if (typeof window.AOS === "undefined") return;
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.AOS.init({
        duration: reducedMotion ? 0 : 500,
        easing: "ease-out-cubic",
        once: !0,
        offset: 60,
        disable: reducedMotion
    })
}

function initAnimateCSS() {
    document.querySelectorAll(".animate-on-load").forEach(el => {
        el.classList.add("animate__animated", "animate__fadeIn")
    })
}

function initHeartIconEasterEgg() {
    const heart = document.getElementById("heartIcon");
    if (!heart) return;
    let clicks = 0,
        timer = null;
    heart.addEventListener("click", () => {
        clicks++;
        clearTimeout(timer);
        timer = setTimeout(() => {
            if (clicks >= 7) {
                const modal = document.getElementById("developers");
                if (modal) new window.bootstrap.Modal(modal).show();
            }
            clicks = 0
        }, 1000)
    })
}
async function copyToClipboard(text) {
    if (navigator.clipboard?.writeText) {
        return navigator.clipboard.writeText(text)
    }
    const ta = Object.assign(document.createElement("textarea"), {
        value: text,
        readOnly: !0,
        style: "position:fixed;left:-9999px"
    });
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove()
}

function showCopyToast() {
    const el = document.getElementById("copyToast");
    if (el) new window.bootstrap.Toast(el).show();
}

function initCopyButtons() {
    document.querySelectorAll(".copy-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
            const text = btn.dataset.copy;
            if (!text) return;
            try {
                await copyToClipboard(text);
                showCopyToast()
            } catch {
                prompt("Copia manualmente:", text)
            }
        })
    })
}

function initFormValidation() {
    document.querySelectorAll("#firstName, #lastName").forEach(el => {
        el.addEventListener("input", () => {
            el.value = el.value.replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ\s]/g, "")
        })
    });
    document.getElementById("phone")?.addEventListener("input", e => {
        e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10)
    });
    document.querySelectorAll(".needs-validation").forEach(form => {
        form.addEventListener("submit", e => {
            if (!form.checkValidity()) {
                e.preventDefault();
                e.stopPropagation()
            }
            form.classList.add("was-validated")
        })
    })
}
const isMobile = () => /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const ShareManager = {
    async _urlToFile(url) {
        try {
            const res = await fetch(url, {
                mode: "cors"
            });
            if (!res.ok) throw new Error();
            const blob = await res.blob();
            const ext = {
                "image/png": "png",
                "image/webp": "webp",
                "image/gif": "gif"
            } [blob.type] || "jpg";
            return new File([blob], `share.${ext}`, {
                type: blob.type || "image/jpeg"
            })
        } catch {
            return null
        }
    },
    _buildText({
        title,
        text,
        url
    }) {
        const parts = [];
        if (title) parts.push(title);
        if (text) parts.push(text);
        if (url) parts.push(url);
        return parts.join("\n\n")
    },
    async share({
        title,
        text,
        url,
        imageUrl,
        type = "auto"
    }) {
        const defaultTitle = document.title || "Iglesia Bautista de Monterrey";
        const safeTitle = title || defaultTitle;
        const safeText = text || "";
        const safeUrl = url || location.href;
        let file = null;
        if (imageUrl && (type === "image" || type === "auto") && isMobile()) {
            file = await this._urlToFile(imageUrl)
        }
        let shareData = {};
        if (file && navigator.canShare && navigator.canShare({
                files: [file]
            })) {
            shareData = {
                files: [file],
                title: safeTitle,
                text: this._buildText({
                    title: safeTitle,
                    text: safeText,
                    url: safeUrl
                })
            }
        } else {
            shareData = {
                title: safeTitle,
                text: this._buildText({
                    title: safeTitle,
                    text: safeText
                }),
                url: safeUrl
            }
        }
        if (navigator.share && navigator.canShare(shareData)) {
            try {
                await navigator.share(shareData);
                return
            } catch (err) {
                if (err.name === "AbortError") return
            }
        }
        const fallbackText = this._buildText({
            title: safeTitle,
            text: safeText,
            url: safeUrl
        });
        try {
            await copyToClipboard(fallbackText);
            showCopyToast()
        } catch {
            prompt("Copia manualmente:", fallbackText)
        }
    }
};
window.shareContent = (title, text, url, imageUrl) => ShareManager.share({
    title,
    text,
    url,
    imageUrl
});

function extractImageFromCard(card) {
    if (!card) return null;
    const img = card.querySelector(".carousel-card-header img, .carousel-banner");
    if (!img) return null;
    if (img.tagName === "IMG") return img.src;
    const bg = getComputedStyle(img).backgroundImage;
    return bg !== "none" ? bg.slice(4, -1).replace(/["']/g, "") : null
}

function initShareButtons() {
    if (window._shareButtonsInitialized) return;
    window._shareButtonsInitialized = !0;
    document.addEventListener("click", e => {
        const btn = e.target.closest("[data-share], .btn-share");
        if (!btn) return;
        e.preventDefault();
        const {
            url,
            title,
            description,
            shareType,
            image
        } = btn.dataset;
        ShareManager.share({
            title: title || document.title,
            text: description || "",
            url: url || location.href,
            imageUrl: image || extractImageFromCard(btn.closest(".carousel-card")),
            type: shareType || "auto"
        })
    })
}

function isPWA() {
    if (navigator.standalone) return !0;
    if (["standalone", "fullscreen", "minimal-ui"].some(m => matchMedia(`(display-mode: ${m})`).matches)) return !0;
    if (document.referrer.includes("android-app://")) return !0;
    const p = new URLSearchParams(location.search);
    return p.get("source") === "pwa" || p.get("mode") === "standalone"
}

function initWhatsAppButton() {
    const btn = document.querySelector(".whatsapp-floating-btn");
    if (!btn) return;
    if (isPWA()) {
        btn.style.display = "none";
        return
    }
    let lastY = 0,
        ticking = !1;
    addEventListener("scroll", () => {
        if (ticking) return;
        ticking = !0;
        requestAnimationFrame(() => {
            const y = scrollY;
            btn.classList.toggle("scrolled", y > 100 && y > lastY);
            lastY = y;
            ticking = !1
        })
    }, {
        passive: !0
    });
    matchMedia("(display-mode: standalone)").addEventListener("change", e => {
        if (e.matches) btn.style.display = "none"
    })
}
document.addEventListener("DOMContentLoaded", () => {
    Theme.set(Theme.get());
    initAOS();
    initAnimateCSS();
    initHeartIconEasterEgg();
    initCopyButtons();
    initFormValidation();
    initShareButtons();
    initWhatsAppButton();
    if (CSS.supports?.("padding-bottom", "env(safe-area-inset-bottom)")) {
        document.body.classList.add("supports-safe-area")
    }
    const year = document.getElementById("currentYear");
    if (year) year.textContent = new Date().getFullYear();
})