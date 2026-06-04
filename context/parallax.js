(function (window, document) {
    "use strict";

    var SPEED = 0.2;

    function init() {
        var hero = document.getElementById("hero");
        var wrapper = document.getElementById("parallax-img-wrapper");

        if (!hero || !wrapper) {
            return;
        }

        var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

        if (reduceMotion.matches) {
            return;
        }

        var heroHeight = hero.offsetHeight;
        var isVisible = true;
        var ticking = false;

        function applyTransform() {
            var scrollY = window.scrollY || window.pageYOffset || 0;

            if (scrollY <= heroHeight) {
                var offset = scrollY * SPEED;
                wrapper.style.transform = "translate3d(0, " + offset.toFixed(2) + "px, 0)";
            }

            ticking = false;
        }

        function requestTick() {
            if (!ticking && isVisible) {
                ticking = true;
                window.requestAnimationFrame(applyTransform);
            }
        }

        function measure() {
            heroHeight = hero.offsetHeight;
        }

        window.addEventListener("scroll", requestTick, { passive: true });

        if ("ResizeObserver" in window) {
            var resizeObserver = new ResizeObserver(function () {
                measure();
                requestTick();
            });
            resizeObserver.observe(hero);
        } else {
            window.addEventListener("resize", function () {
                measure();
                requestTick();
            }, { passive: true });
        }

        if ("IntersectionObserver" in window) {
            var visibilityObserver = new IntersectionObserver(function (entries) {
                isVisible = entries[0].isIntersecting;
                wrapper.style.willChange = isVisible ? "transform" : "auto";

                if (isVisible) {
                    requestTick();
                }
            }, { threshold: 0 });
            visibilityObserver.observe(hero);
        } else {
            wrapper.style.willChange = "transform";
        }

        requestTick();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }
}(window, document));