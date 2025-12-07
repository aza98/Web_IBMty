document.addEventListener("DOMContentLoaded", () => {
    const wrapper = document.getElementById("parallax-img-wrapper");
    if (!wrapper) return;
    const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) {
        return;
    }
    const calculateSpeed = () => {
        const width = window.innerWidth;
        return width <= 576 ? 0.15 : width <= 992 ? 0.12 : 0.1;
    };
    let speed = calculateSpeed();
    let initialTop = 0;
    let isIntersecting = !1;
    let isTicking = !1;
    let lastWidth = window.innerWidth;
    const updateMetrics = () => {
        const rect = wrapper.getBoundingClientRect();
        initialTop = rect.top + window.scrollY;
    };
    const onScroll = () => {
        if (!isIntersecting) return;
        if (!isTicking) {
            window.requestAnimationFrame(() => {
                const scrollTop = window.scrollY;
                const yPos = (scrollTop - initialTop) * speed;
                wrapper.style.transform = `translate3d(0, ${yPos}px, 0)`;
                isTicking = !1;
            });
            isTicking = !0;
        }
    };
    const observer = new IntersectionObserver(
        (entries) => {
            isIntersecting = entries[0].isIntersecting;
        }, {
            threshold: 0
        }
    );
    observer.observe(wrapper);
    const onResize = () => {
        const currentWidth = window.innerWidth;
        if (currentWidth !== lastWidth) {
            speed = calculateSpeed();
            updateMetrics();
            lastWidth = currentWidth;
            onScroll();
        }
    };
    updateMetrics();
    window.addEventListener("scroll", onScroll, {
        passive: !0
    });
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", () => {
        setTimeout(() => {
            updateMetrics();
            onScroll();
        }, 100);
    });
});