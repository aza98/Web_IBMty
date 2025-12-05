class CarouselManager {
    constructor(e, t = {}) {
        (this.selector = e),
            (this.container = document.querySelector(e)),
            (this.options = t),
            (this.swiper = null),
            this.init();
    }
    init() {
        if (!this.container) return;
        let initialSlide = 0;
        const hash = window.location.hash;
        if (hash) {
            const targetElement = this.container.querySelector(hash);
            if (targetElement) {
                const slide = targetElement.closest(".swiper-slide");
                if (slide) {
                    const slides = Array.from(
                        this.container.querySelectorAll(".swiper-slide")
                    );
                    initialSlide = slides.indexOf(slide);
                    if (initialSlide !== -1) {
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
            loopAdditionalSlides: 1,
            coverflowEffect: {
                rotate: 50,
                stretch: 0,
                depth: 100,
                modifier: 1,
                slideShadows: !0,
            },
            pagination: {
                el: ".swiper-pagination",
                clickable: !0,
                dynamicBullets: !0,
            },
            keyboard: {
                enabled: !0,
                onlyInViewport: !0
            },
            on: {
                init: (e) => {
                    this.updateIndicators(e), this.addSwipeHint();
                },
                slideChange: (e) => this.updateIndicators(e),
                touchStart: () => this.removeSwipeHint(),
                transitionEnd: (e) => this.updateIndicators(e),
            },
        },
            t = {
                ...e,
                ...this.options
            };
        this.options.pagination &&
            (t.pagination = {
                ...e.pagination,
                ...this.options.pagination
            }),
            this.options.autoplay && (t.autoplay = this.options.autoplay),
            (this.swiper = new Swiper(this.selector, t)),
            this.initShareButtons();
    }
    updateIndicators(e) {
        const currentSlideId = this.options.indicators?.current || "currentSlide";
        const totalSlidesId = this.options.indicators?.total || "totalSlides";
        let t = document.getElementById(currentSlideId),
            n = document.getElementById(totalSlidesId);
        if (t) {
            let currentIndex = e.realIndex + 1;
            t.textContent = currentIndex;
        }
        if (n) {
            let totalSlides = this.container.querySelectorAll(
                ".swiper-slide:not(.swiper-slide-duplicate)"
            ).length;
            n.textContent = totalSlides;
        }
    }
    initShareButtons() {
        this.container.addEventListener("click", (e) => {
            const btn = e.target.closest(".btn-share");
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
                    prompt("Copia el enlace:", url);
                }
            }
        });
    }
    addSwipeHint() {
        if (
            !(window.innerWidth < 768) ||
            this.container.querySelector(".swipe-hint-overlay")
        )
            return;
        this.container.insertAdjacentHTML(
            "beforeend",
            '\n            <div class="swipe-hint-overlay active">\n                <div class="swipe-hint-content">\n                    <i class="fas fa-hand-pointer swipe-hint-icon"></i>\n                    <span class="swipe-hint-text">Desliza</span>\n                </div>\n            </div>\n        '
        ),
            setTimeout(() => {
                this.removeSwipeHint();
            }, 3500);
    }
    removeSwipeHint() {
        let e = this.container.querySelector(".swipe-hint-overlay");
        e &&
            (e.classList.remove("active"),
                setTimeout(() => {
                    e && e.parentNode && e.parentNode.removeChild(e);
                }, 500));
    }
}
document.addEventListener("DOMContentLoaded", function () {
    let e = {
        dynamicMainBullets: 3,
        renderBullet: function (e, t) {
            return '<span class="' + t + '"></span>';
        },
    };
    document.querySelector(".carousel-events") &&
        new CarouselManager(".carousel-events", {
            navigation: {
                nextEl: ".swiper-button-next",
                prevEl: ".swiper-button-prev",
            },
            pagination: e,
            touchRatio: 1,
            touchAngle: 45,
            simulateTouch: !0,
            indicators: {
                current: "currentSlide",
                total: "totalSlides"
            },
        }),
        document.querySelector(".carousel-ministerios") &&
        new CarouselManager(".carousel-ministerios", {
            navigation: {
                nextEl: ".swiper-button-next",
                prevEl: ".swiper-button-prev",
            },
            pagination: e,
            touchRatio: 1,
            touchAngle: 45,
            simulateTouch: !0,
        });
}),
    (window.CarouselManager = CarouselManager);