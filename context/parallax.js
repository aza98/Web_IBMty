document.addEventListener('DOMContentLoaded', () => {
    const heroSection = document.getElementById('hero');
    const parallaxWrapper = document.getElementById('parallax-img-wrapper');
    const speed = 0.2;
    let heroHeight = 0;
    let isTicking = !1;
    const updateDimensions = () => {
        heroHeight = heroSection.offsetHeight
    };
    const updateParallax = () => {
        const scrollY = window.scrollY;
        if (scrollY <= heroHeight) {
            const yPos = Math.floor(scrollY * speed);
            parallaxWrapper.style.transform = `translateY(${yPos}px)`
        }
        isTicking = !1
    };
    const onScroll = () => {
        if (!isTicking) {
            window.requestAnimationFrame(updateParallax);
            isTicking = !0
        }
    };
    updateDimensions();
    window.addEventListener('scroll', onScroll, {
        passive: !0
    });
    const resizeObserver = new ResizeObserver(() => {
        updateDimensions();
        updateParallax()
    });
    resizeObserver.observe(heroSection)
})