class CarouselManager {
    constructor(e, t = {}) {
        this.selector = e, this.container = document.querySelector(e), this.options = t, this.swiper = null, this.init()
    }
    init() {
        if (!this.container) return;

        // Check for hash in URL to set initial slide
        let initialSlide = 0;
        const hash = window.location.hash;
        if (hash) {
            // Find the slide that contains the element with the hash ID
            const targetElement = this.container.querySelector(hash);
            if (targetElement) {
                const slide = targetElement.closest('.swiper-slide');
                if (slide) {
                    // Get the index of the slide among its siblings
                    const slides = Array.from(this.container.querySelectorAll('.swiper-slide'));
                    initialSlide = slides.indexOf(slide);

                    // Prevent default browser scroll behavior which breaks layout
                    // We'll let Swiper handle the positioning
                    if (initialSlide !== -1) {
                        // Scroll to top of page to reset any browser auto-scroll
                        window.scrollTo(0, 0);
                    }
                }
            }
        }

        let e = {
            effect: "coverflow",
            grabCursor: !0,
            centeredSlides: !0,
            slidesPerView: "auto",
            initialSlide: initialSlide,
            loop: !0,
            coverflowEffect: {
                rotate: 50,
                stretch: 0,
                depth: 100,
                modifier: 1,
                slideShadows: !0
            },
            pagination: {
                el: ".swiper-pagination",
                clickable: !0,
                dynamicBullets: !0
            },
            keyboard: {
                enabled: !0,
                onlyInViewport: !0
            },
            on: {
                init: e => {
                    this.updateIndicators(e), this.addSwipeHint()
                },
                slideChange: e => this.updateIndicators(e),
                touchStart: () => this.removeSwipeHint()
            }
        },
            t = {
                ...e,
                ...this.options
            };
        this.options.pagination && (t.pagination = {
            ...e.pagination,
            ...this.options.pagination
        }), this.options.autoplay && (t.autoplay = this.options.autoplay), this.swiper = new Swiper(this.selector, t), this.initShareButtons()
    }
    updateIndicators(e) {
        let t = document.getElementById("currentSlide"),
            n = document.getElementById("totalSlides");
        if (t && (t.textContent = e.realIndex + 1), n) {
            let t = 0;
            t = e.params.loop ? this.container.querySelectorAll(".swiper-slide:not(.swiper-slide-duplicate)")
                .length : e.slides.length, n.textContent = t
        }
    }
    initShareButtons() {
        // Use event delegation for better performance and to avoid cloning issues
        this.container.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-share');
            if (btn) {
                e.preventDefault();
                e.stopPropagation();

                const title = btn.dataset.title || "";
                const description = btn.dataset.description || "";
                const url = btn.dataset.url || window.location.href;

                if (typeof shareContent === "function") {
                    shareContent(title, description, url);
                } else {
                    console.error("Utils.js: shareContent function not found.");
                    // Fallback
                    prompt("Copia el enlace:", url);
                }
            }
        });
    }
    addSwipeHint() {
        if (!(window.innerWidth < 768) || this.container.querySelector(".swipe-hint-overlay")) return;
        this.container.insertAdjacentHTML("beforeend", '\n            <div class="swipe-hint-overlay active">\n                <div class="swipe-hint-content">\n                    <i class="fas fa-hand-pointer swipe-hint-icon"></i>\n                    <span class="swipe-hint-text">Desliza</span>\n                </div>\n            </div>\n        '), setTimeout((() => {
            this.removeSwipeHint()
        }), 3500)
    }
    removeSwipeHint() {
        let e = this.container.querySelector(".swipe-hint-overlay");
        e && (e.classList.remove("active"), setTimeout((() => {
            e && e.parentNode && e.parentNode.removeChild(e)
        }), 500))
    }
}
document.addEventListener("DOMContentLoaded", (function () {
    let e = {
        dynamicMainBullets: 3,
        renderBullet: function (e, t) {
            return '<span class="' + t + '"></span>'
        }
    };
    document.querySelector(".carousel-events") && new CarouselManager(".carousel-events", {
        autoplay: {
            delay: 5e3,
            disableOnInteraction: !1
        },
        navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev"
        },
        pagination: e,
        touchRatio: 1,
        touchAngle: 45,
        simulateTouch: !0
    }), document.querySelector(".carousel-ministerios") && new CarouselManager(".carousel-ministerios", {
        navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev"
        },
        pagination: e,
        touchRatio: 1,
        touchAngle: 45,
        simulateTouch: !0
    })
})), window.CarouselManager = CarouselManager;