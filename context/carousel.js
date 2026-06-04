(function (window, document) {
    "use strict";

    var BASE_CONFIG = {
        effect: "coverflow",
        centeredSlides: true,
        loop: true,
        grabCursor: true,
        speed: 500,
        keyboard: {
            enabled: true
        },
        navigation: {
            nextEl: ".carousel-btn--next",
            prevEl: ".carousel-btn--prev"
        },
        coverflowEffect: {
            rotate: 18,
            stretch: 0,
            depth: 120,
            modifier: 1,
            scale: 0.92,
            slideShadows: false
        },
        breakpoints: {
            0: {
                slidesPerView: 1,
                spaceBetween: 16
            },
            768: {
                slidesPerView: 2,
                spaceBetween: 24
            },
            1024: {
                slidesPerView: 3,
                spaceBetween: 32
            }
        }
    };

    var CAROUSEL_OVERRIDES = {
        home: {
            initialSlide: 3
        },
        ministerios: {
            coverflowEffect: {
                rotate: 16,
                depth: 100,
                scale: 0.94
            }
        }
    };

    var instances = [];

    function isPlainObject(value) {
        return Object.prototype.toString.call(value) === "[object Object]";
    }

    function mergeOptions() {
        var result = {};

        Array.prototype.slice.call(arguments).forEach(function (source) {
            if (!source) {
                return;
            }

            Object.keys(source).forEach(function (key) {
                var value = source[key];

                if (isPlainObject(value) && isPlainObject(result[key])) {
                    result[key] = mergeOptions(result[key], value);
                    return;
                }

                result[key] = value;
            });
        });

        return result;
    }

    function findCarouselElements(root) {
        if (root && root.matches && root.matches(".carousel-swiper")) {
            return [root];
        }

        return Array.prototype.slice.call((root || document).querySelectorAll(".carousel-swiper"));
    }

    function getIndicatorRoot(swiperElement) {
        return swiperElement.closest(".carousel-section") || swiperElement.parentElement;
    }

    function updateIndicators(swiperElement, swiper, totalSlides) {
        var root = getIndicatorRoot(swiperElement);

        if (!root || !totalSlides) {
            return;
        }

        var current = root.querySelector(".current-slide-display");
        var total = root.querySelector(".total-slides-display");

        if (current) {
            current.textContent = String((swiper.realIndex % totalSlides) + 1);
        }

        if (total) {
            total.textContent = String(totalSlides);
        }
    }

    function buildConfig(swiperElement, totalSlides) {
        var carouselName = swiperElement.getAttribute("data-carousel") || "";
        var overrides = CAROUSEL_OVERRIDES[carouselName] || {};
        var navigation = {
            nextEl: swiperElement.querySelector(BASE_CONFIG.navigation.nextEl),
            prevEl: swiperElement.querySelector(BASE_CONFIG.navigation.prevEl)
        };
        var config = mergeOptions(BASE_CONFIG, overrides, {
            navigation: navigation
        });
        var customEvents = config.on || {};

        config.on = mergeOptions(customEvents, {
            init: function (swiper) {
                updateIndicators(swiperElement, swiper, totalSlides);

                if (typeof customEvents.init === "function") {
                    customEvents.init.call(swiper, swiper);
                }
            },
            slideChange: function (swiper) {
                updateIndicators(swiperElement, swiper, totalSlides);

                if (typeof customEvents.slideChange === "function") {
                    customEvents.slideChange.call(swiper, swiper);
                }
            }
        });

        return config;
    }

    function destroyExisting(swiperElement) {
        if (swiperElement.swiper && typeof swiperElement.swiper.destroy === "function") {
            swiperElement.swiper.destroy(true, true);
        }
    }

    function init(root) {
        if (typeof window.Swiper === "undefined") {
            window.console.error("Carousel Manager: Swiper is not loaded.");
            return [];
        }

        instances = findCarouselElements(root).map(function (swiperElement) {
            var totalSlides = swiperElement.querySelectorAll(".swiper-slide").length;

            destroyExisting(swiperElement);

            return new window.Swiper(swiperElement, buildConfig(swiperElement, totalSlides));
        });

        return instances;
    }

    function start() {
        init(document);
    }

    window.CarouselManager = {
        init: init,
        getInstances: function () {
            return instances.slice();
        }
    };
    window.initCarousels = init;

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start, {
            once: true
        });
    } else {
        start();
    }
}(window, document));
