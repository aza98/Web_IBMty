class PwaInstaller {
    constructor() {
        this.installBtn = document.getElementById("install-btn"), this.iosPopup = document.getElementById("ios-popup"), this.closePopup = document.getElementById("close-popup"), this.deferredPrompt = null, this.isIOS = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase()), this.isStandalone = "standalone" in navigator && navigator.standalone, this.init()
    }
    init() {
        this.installBtn && this.iosPopup && this.closePopup ? this.isDismissed() ? console.log("PwaInstaller: Prompt dismissed by user recently.") : (this.registerServiceWorker(), this.addEventListeners(), this.checkInitialDisplay()) : console.error("PwaInstaller: Error al inicializar. Faltan elementos DOM.")
    }
    isDismissed() {
        const t = localStorage.getItem("pwa_install_dismissed");
        if (!t) return !1;
        return (Date.now() - parseInt(t)) / 864e5 < 7
    }
    dismiss() {
        localStorage.setItem("pwa_install_dismissed", Date.now()
            .toString()), this.hideInstallButton(), this.iosPopup.classList.remove("active")
    }
    registerServiceWorker() {
        "serviceWorker" in navigator && window.addEventListener("load", (() => {
            navigator.serviceWorker.register("/service-worker.js")
                .then((t => console.log("SW registrado:", t.scope)))
                .catch((t => console.error("Error SW:", t)))
        }))
    }
    showInstallButton() {
        this.installBtn.classList.add("show")
    }
    hideInstallButton() {
        this.installBtn.classList.remove("show")
    }
    checkInitialDisplay() {
        this.isIOS && !this.isStandalone && this.showInstallButton()
    }
    addEventListeners() {
        window.addEventListener("beforeinstallprompt", (t => this.handleBeforeInstallPrompt(t))), window.addEventListener("appinstalled", (() => this.handleAppInstalled())), this.installBtn.addEventListener("click", (() => this.handleInstallButtonClick())), this.isIOS && this.setupIosPopupHandlers(), window.addEventListener("scroll", (() => this.handleScroll()))
    }
    handleScroll() {
        window.scrollY > 50 ? this.installBtn.classList.add("scrolled") : this.installBtn.classList.remove("scrolled")
    }
    handleBeforeInstallPrompt(t) {
        t.preventDefault(), this.deferredPrompt = t, this.showInstallButton()
    }
    handleAppInstalled() {
        this.hideInstallButton(), this.deferredPrompt = null, console.log("PWA installed successfully")
    }
    handleInstallButtonClick() {
        this.isIOS ? this.iosPopup.classList.add("active") : this.deferredPrompt && this.promptNativeInstall()
    }
    async promptNativeInstall() {
        if (!this.deferredPrompt) return;
        this.deferredPrompt.prompt();
        const {
            outcome: t
        } = await this.deferredPrompt.userChoice;
        console.log(`Instalación PWA: ${t}`), "accepted" === t && (this.deferredPrompt = null, this.hideInstallButton())
    }
    setupIosPopupHandlers() {
        this.closePopup.addEventListener("click", (() => {
            this.iosPopup.classList.remove("active")
        })), this.iosPopup.addEventListener("click", (t => {
            t.target === this.iosPopup && this.iosPopup.classList.remove("active")
        }))
    }
}
document.addEventListener("DOMContentLoaded", (() => {
    window.matchMedia("(display-mode: standalone)")
        .matches || "standalone" in navigator && navigator.standalone || new PwaInstaller
}));