class CarouselManager {
    static defaultConfig = {
        effect: "coverflow",
        grabCursor: !0,
        centeredSlides: !0,
        slidesPerView: "auto",
        speed: 400,
        coverflowEffect: {
            rotate: 0,
            stretch: 30,
            depth: 150,
            modifier: 1,
            scale: 0.85,
            slideShadows: !1
        },
        keyboard: {
            enabled: !0,
            onlyInViewport: !0
        }
    };
    static defaultBreakpoints = {
        320: {
            slidesPerView: "auto",
            spaceBetween: 50
        },
        768: {
            slidesPerView: 2,
            spaceBetween: 40
        },
        1024: {
            slidesPerView: 3,
            spaceBetween: 50
        }
    };
    constructor(selector, options = {}) {
        this.container = typeof selector === 'string' ? document.querySelector(selector) : selector;
        if (!this.container) return;
        this.selector = typeof selector === 'string' ? selector : `.${this.container.className.split(' ')[0]}`;
        this.options = options;
        this.init()
    }
    init() {
        if (typeof Swiper === 'undefined') {
            console.error('Swiper not loaded');
            return
        }
        const slides = this.container.querySelectorAll(".swiper-slide");
        const totalSlides = slides.length;
        const useLoop = totalSlides >= 4;
        const config = {
            ...CarouselManager.defaultConfig,
            initialSlide: this.options.initialSlide || 0,
            loop: useLoop,
            rewind: !useLoop,
            loopedSlides: useLoop ? totalSlides : null,
            breakpoints: this.options.breakpoints || CarouselManager.defaultBreakpoints,
            navigation: {
                nextEl: `${this.selector} .swiper-button-next`,
                prevEl: `${this.selector} .swiper-button-prev`
            },
            pagination: {
                el: `${this.selector} .swiper-pagination`,
                clickable: !0,
                dynamicBullets: !0
            },
            on: {
                init: (s) => {
                    this.updateIndicators(s);
                    this.addSwipeHint()
                },
                slideChange: (s) => this.updateIndicators(s),
                touchStart: () => this.removeSwipeHint()
            },
            ...this.options
        };
        if (this.options.coverflowEffect) {
            config.coverflowEffect = {
                ...CarouselManager.defaultConfig.coverflowEffect,
                ...this.options.coverflowEffect
            }
        }
        this.swiper = new Swiper(this.container, config);
    }
    updateIndicators(swiper) {
        const container = this.options.indicatorContainer ? document.querySelector(this.options.indicatorContainer) : this.container.parentElement;
        if (!container) return;
        const current = container.querySelector(".current-slide-display");
        const total = container.querySelector(".total-slides-display");
        if (current) current.textContent = swiper.realIndex + 1;
        if (total) total.textContent = this.container.querySelectorAll(".swiper-slide:not(.swiper-slide-duplicate)").length
    }
    showToast(msg) {
        const t = document.createElement('div');
        t.className = 'carousel-toast';
        t.textContent = msg;
        t.style.cssText = `position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.8);color:#fff;padding:10px 20px;border-radius:20px;z-index:9999;animation:fadeInOut 2s`;
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 2000)
    }
    addSwipeHint() {
        if (window.innerWidth >= 768 || this.container.querySelector(".swipe-hint-overlay")) return;
        this.container.insertAdjacentHTML("beforeend", `
            <div class="swipe-hint-overlay active">
                <div class="swipe-hint-content">
                    <div class="swipe-hint-visual">
                        <div class="swipe-trail"></div>
                        <i class="fas fa-hand-pointer swipe-hint-icon"></i>
                    </div>
                    <span class="swipe-hint-text">Desliza</span>
                </div>
            </div>`);
        setTimeout(() => this.removeSwipeHint(), 4000)
    }
    removeSwipeHint() {
        const h = this.container.querySelector(".swipe-hint-overlay");
        if (h) {
            h.classList.remove("active");
            setTimeout(() => h.remove(), 500)
        }
    }
}
document.addEventListener("DOMContentLoaded", () => {
    if (document.querySelector("#eventos-swiper")) {
        new CarouselManager("#eventos-swiper", {
            initialSlide: 1,
            indicatorContainer: "#eventos"
        })
    }
    if (document.querySelector(".ministerios-swiper")) {
        new CarouselManager(".ministerios-swiper", {
            indicatorContainer: "#ministerios-info",
            breakpoints: {
                320: {
                    slidesPerView: "auto",
                    spaceBetween: 40
                },
                768: {
                    slidesPerView: 2,
                    spaceBetween: 40
                },
                1024: {
                    slidesPerView: 3,
                    spaceBetween: 50
                }
            },
            coverflowEffect: {
                stretch: 20,
                depth: 120,
                scale: 0.9
            }
        })
    }
    document.querySelectorAll(".swiper-carousel").forEach(el => new CarouselManager(el))
});
window.CarouselManager = CarouselManager