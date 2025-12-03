/**
 * @file Utility functions for the website.
 * @author IBMty
 */

const LIGHT_THEME = "light";
const DARK_THEME = "dark";

/**
 * Gets the preferred theme from local storage or system settings.
 * @returns {string} The preferred theme (light or dark).
 */
function getPreferredTheme() {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme) {
        return storedTheme;
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? DARK_THEME : LIGHT_THEME;
}

/**
 * Sets the theme icons based on the current theme.
 * @param {boolean} isDark - Whether the dark theme is active.
 */
function setThemeIcons(isDark) {
    const mobileIcon = document.getElementById("mobile-theme-icon");
    const desktopIcon = document.getElementById("desktop-theme-icon");

    if (isDark) {
        mobileIcon?.classList.replace("fa-sun", "fa-moon");
        desktopIcon?.classList.replace("fa-sun", "fa-moon");
    } else {
        mobileIcon?.classList.replace("fa-moon", "fa-sun");
        desktopIcon?.classList.replace("fa-moon", "fa-sun");
    }
}

/**
 * Sets the theme for the website.
 * @param {string} theme - The theme to set (light or dark).
 */
function setTheme(theme) {
    document.documentElement.setAttribute("data-bs-theme", theme);
    localStorage.setItem("theme", theme);
    setThemeIcons(theme === DARK_THEME);
}

/**
 * Toggles between light and dark theme.
 */
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-bs-theme");
    setTheme(currentTheme === LIGHT_THEME ? DARK_THEME : LIGHT_THEME);
}

/**
 * Initializes the AOS library for animations on scroll.
 */
function initAOS() {
    if (window.AOS) {
        AOS.init();
    }
}

/**
 * Initializes Animate.css for elements that should animate on load.
 */
function initAnimateCSS() {
    document.querySelectorAll(".animate-on-load").forEach(element => {
        element.classList.add("animate__animated", "animate__fadeIn");
    });
}

/**
 * Initializes the heart icon easter egg.
 * Click the heart icon 7 times to show the developers modal.
 */
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
                const developersModal = document.getElementById("developers");
                if (developersModal) {
                    new bootstrap.Modal(developersModal).show();
                }
            }
            clickCount = 0;
        }, 1000);
    });
}

/**
 * Copies text to the clipboard.
 * @param {string} text - The text to copy.
 * @returns {Promise<void>}
 */
function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text);
    }
    // Fallback for insecure contexts or older browsers
    return new Promise((resolve, reject) => {
        try {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";
            textArea.style.left = "-9999px";
            textArea.style.top = "0";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            const success = document.execCommand("copy");
            document.body.removeChild(textArea);
            if (success) {
                resolve();
            } else {
                reject(new Error("execCommand returned false"));
            }
        } catch (err) {
            reject(err);
        }
    });
}

/**
 * Shares content using the Web Share API or a fallback modal.
 * @param {string} title - The title of the content to share.
 * @param {string} text - The text/description to share.
 * @param {string} url - The URL to share.
 */
function shareContent(title, text, url) {
    if (navigator.share) {
        navigator.share({
            title: title,
            text: text,
            url: url,
        })
            .catch(error => console.log("Error sharing:", error));
    } else {
        showShareModal(title, text, url);
    }
}

/**
 * Shows a modal with sharing options as a fallback for the Web Share API.
 * @param {string} title - The title of the content to share.
 * @param {string} text - The text/description to share.
 * @param {string} url - The URL to share.
 */
function showShareModal(title, text, url) {
    const shareText = encodeURIComponent(`${title} - ${text}`);
    const shareUrl = encodeURIComponent(url);

    // Remove existing modal to prevent duplicates
    const existingModal = document.getElementById("shareModal");
    if (existingModal) {
        existingModal.remove();
    }

    const modalHTML = `
        <div class="modal fade" id="shareModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Compartir</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="d-grid gap-2">
                            <a href="https://wa.me/?text=${shareText}%20${shareUrl}" target="_blank" class="btn btn-success text-white">
                                <i class="fab fa-whatsapp me-2"></i>WhatsApp
                            </a>
                            <a href="https://www.facebook.com/sharer/sharer.php?u=${shareUrl}" target="_blank" class="btn btn-primary">
                                <i class="fab fa-facebook me-2"></i>Facebook
                            </a>
                            <a href="https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}" target="_blank" class="btn btn-info text-white">
                                <i class="fab fa-twitter me-2"></i>Twitter
                            </a>
                            <button class="btn btn-secondary" onclick="copyToClipboard('''${url}''').then(() => alert('¡Enlace copiado!'))">
                                <i class="fas fa-copy me-2"></i>Copiar Enlace
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML("beforeend", modalHTML);
    const shareModal = document.getElementById("shareModal");
    if (shareModal) {
        new bootstrap.Modal(shareModal).show();
    }
}



/**
 * Initializes copy-to-clipboard functionality for elements with the .copy-btn class.
 */
function initCopyButtons() {
    const copyToastEl = document.getElementById("copyToast");
    if (!copyToastEl) return;

    const copyToast = new bootstrap.Toast(copyToastEl);
    document.querySelectorAll(".copy-btn").forEach(button => {
        button.addEventListener("click", () => {
            const textToCopy = button.dataset.copy;
            if (textToCopy) {
                copyToClipboard(textToCopy)
                    .then(() => {
                        copyToast.show();
                    })
                    .catch(err => {
                        console.error("Error copying:", err);
                        // Fallback for browsers that don't support copy command
                        prompt("Copy the text manually:", textToCopy);
                    });
            }
        });
    });
}

/**
 * Initializes form validation logic.
 */
function initFormValidation() {
    "use strict";

    // Restrict input for firstName and lastName to letters and spaces
    document.querySelectorAll("#firstName, #lastName").forEach(element => {
        element.addEventListener("input", () => {
            element.value = element.value.replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ\s]/g, "");
        });
    });

    // Restrict input for phone to 10 digits
    const phoneInput = document.getElementById("phone");
    if (phoneInput) {
        phoneInput.addEventListener("input", (event) => {
            event.target.value = event.target.value.replace(/[^0-9]/g, "").slice(0, 10);
        });
    }

    // Bootstrap form validation
    const forms = document.querySelectorAll(".needs-validation");
    Array.from(forms).forEach(form => {
        form.addEventListener("submit", event => {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            form.classList.add("was-validated");
        }, false);
    });
}


/**
 * Main DOMContentLoaded listener.
 */
document.addEventListener("DOMContentLoaded", () => {
    setTheme(getPreferredTheme());
    initAOS();
    initAnimateCSS();
    initHeartIconEasterEgg();
    initCopyButtons();
    initFormValidation(); // Added form validation

    const currentYearEl = document.getElementById("currentYear");
    if (currentYearEl) {
        currentYearEl.textContent = new Date().getFullYear();
    }
});