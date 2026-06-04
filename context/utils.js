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
async function shareContent({ title, description, url, imageUrl }) {
    const safeTitle = title || document.title || "Iglesia Bautista de Monterrey";
    const safeDesc = description || "";
    const safeUrl = url || location.href;
    const fullText = `${safeTitle}\n\n${safeDesc}\n\n${safeUrl}`;

    if (imageUrl && isMobile()) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            const res = await fetch(imageUrl, { mode: "cors", signal: controller.signal });
            clearTimeout(timeoutId);
            if (res.ok) {
                const blob = await res.blob();
                const ext = { "image/png": "png", "image/webp": "webp", "image/gif": "gif" }[blob.type] || "jpg";
                const file = new File([blob], `compartir.${ext}`, { type: blob.type || "image/jpeg" });
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({ files: [file], title: safeTitle, text: fullText });
                        return;
                    } catch (err) {
                        if (err.name === "AbortError") return;
                    }
                }
            }
        } catch {

        }
    }

    if (navigator.share) {
        const shareData = { title: safeTitle, text: `${safeTitle}\n\n${safeDesc}`, url: safeUrl };
        if (!navigator.canShare || navigator.canShare(shareData)) {
            try {
                await navigator.share(shareData);
                return;
            } catch (err) {
                if (err.name === "AbortError") return;
            }
        }
    }

    try {
        await copyToClipboard(fullText);
        showCopyToast();
    } catch {
        prompt("Copia manualmente:", fullText);
    }
}
window.shareContent = shareContent;

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
        const { url, title, description, image } = btn.dataset;
        shareContent({
            title: title || document.title,
            description: description || "",
            url: url || location.href,
            imageUrl: image || extractImageFromCard(btn.closest(".carousel-card"))
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