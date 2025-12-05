document.addEventListener("DOMContentLoaded", () => {
    const e = document.getElementById("parallax-img-wrapper");
    if (!e) return;
    const t = () => {
        const e = window.innerWidth;
        return e <= 576 ? 0.25 : e <= 992 ? 0.18 : 0.12;
    };
    let n = t(),
        o = 0;
    const s = () => {
        const t = e.getBoundingClientRect();
        o = t.top + window.pageYOffset;
    };
    s();
    let i = !1;
    new IntersectionObserver(
        (e) => {
            i = e[0].isIntersecting;
        }, {
        threshold: 0
    }
    ).observe(e);
    let r = !1;
    const d = () => {
        const t = window.pageYOffset;
        if (i) {
            const s = (t - o) * n;
            e.style.transform = `translate3d(0, ${s}px, 0)`;
        }
        r = !1;
    };
    window.addEventListener(
        "scroll",
        () => {
            r || (requestAnimationFrame(d), (r = !0));
        }, {
        passive: !0
    }
    );
    const a = () => {
        (n = t()), s(), d();
    };
    window.addEventListener("resize", a),
        window.addEventListener("orientationchange", a),
        d();
});