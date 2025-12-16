(function () {
    "use strict";
    // ==================== CONFETTI MODULE ====================
    const Confetti = {
        canvas: null,
        ctx: null,
        particles: [],
        animationId: null,
        colors: [
            "#00c0f7",
            "#009ac6",
            "#FFD700",
            "#FF6B6B",
            "#4ECDC4",
            "#9B59B6",
            "#FF9500",
        ],
        init() {
            this.createCanvas();
            this.bindEvents();
        },
        createCanvas() {
            if (document.getElementById("confetti-canvas")) return;
            this.canvas = document.createElement("canvas");
            this.canvas.id = "confetti-canvas";
            this.canvas.style.cssText =
                "position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999";
            document.body.appendChild(this.canvas);
            this.ctx = this.canvas.getContext("2d");
            this.resizeCanvas();
            window.addEventListener("resize", () => this.resizeCanvas());
        },
        resizeCanvas() {
            if (this.canvas) {
                this.canvas.width = window.innerWidth;
                this.canvas.height = window.innerHeight;
            }
        },
        bindEvents() {
            document.addEventListener("click", (e) => {
                const amenBtn = e.target.closest("#btn-amen");
                if (amenBtn) {
                    this.fire();
                }
            });
        },
        createParticle(x, y) {
            return {
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 15,
                vy: Math.random() * -18 - 8,
                color: this.colors[Math.floor(Math.random() * this.colors.length)],
                size: Math.random() * 10 + 5,
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 10,
                gravity: 0.4,
                friction: 0.99,
                opacity: 1,
                shape: Math.random() > 0.5 ? "rect" : "circle",
                life: 1,
            };
        },
        fire(count = 150) {
            const startX = window.innerWidth / 2;
            const startY = window.innerHeight / 2;
            for (let i = 0; i < count; i++) {
                const angle = (i / count) * Math.PI * 2;
                const spread = 100;
                const x = startX + Math.cos(angle) * (Math.random() * spread);
                const y = startY + Math.sin(angle) * (Math.random() * spread * 0.5);
                this.particles.push(this.createParticle(x, y));
            }
            for (let i = 0; i < 30; i++) {
                this.particles.push(
                    this.createParticle(0, window.innerHeight * Math.random())
                );
                this.particles.push(
                    this.createParticle(
                        window.innerWidth,
                        window.innerHeight * Math.random()
                    )
                );
            }
            if (!this.animationId) {
                this.animate();
            }
        },
        animate() {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.particles.forEach((p, index) => {
                p.vy += p.gravity;
                p.vx *= p.friction;
                p.x += p.vx;
                p.y += p.vy;
                p.rotation += p.rotationSpeed;
                p.life -= 0.008;
                p.opacity = p.life;
                if (p.life > 0) {
                    this.ctx.save();
                    this.ctx.translate(p.x, p.y);
                    this.ctx.rotate((p.rotation * Math.PI) / 180);
                    this.ctx.globalAlpha = p.opacity;
                    this.ctx.fillStyle = p.color;
                    if (p.shape === "rect") {
                        this.ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
                    } else {
                        this.ctx.beginPath();
                        this.ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
                        this.ctx.fill();
                    }
                    this.ctx.restore();
                }
            });
            this.particles = this.particles.filter((p) => p.life > 0);
            if (this.particles.length > 0) {
                this.animationId = requestAnimationFrame(() => this.animate());
            } else {
                this.animationId = null;
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            }
        },
    };
    // ==================== TIMELINE MODULE ====================
    const TimelineInteractive = {
        section: null,
        rows: [],
        progressLine: null,
        observer: null,
        resizeObserver: null,
        init() {
            this.section = document.querySelector(".timeline-section");
            if (!this.section) return;
            this.rows = Array.from(this.section.querySelectorAll(".timeline-row"));
            if (this.rows.length === 0) return;
            this.setupObservers();
            this.setupScrollListener();
            this.updateProgress();
        },
        setupObservers() {
            const options = {
                root: null,
                rootMargin: "-30% 0px -50% 0px",
                threshold: 0,
            };
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        this.rows.forEach((row) => row.classList.remove("active"));
                        entry.target.classList.add("active");
                    }
                });
            }, options);
            this.rows.forEach((row) => this.observer.observe(row));
        },
        setupScrollListener() {
            let ticking = !1;
            const onScroll = () => {
                if (!ticking) {
                    requestAnimationFrame(() => {
                        this.updateProgress();
                        ticking = !1;
                    });
                    ticking = !0;
                }
            };
            window.addEventListener("scroll", onScroll, {
                passive: !0
            });
        },
        updateProgress() {
            if (!this.section) return;
            const sectionRect = this.section.getBoundingClientRect();
            const sectionTop = sectionRect.top;
            const sectionHeight = sectionRect.height;
            const viewportHeight = window.innerHeight;
            let progress = 0;
            const startOffset = viewportHeight * 0.45;
            if (sectionTop <= startOffset) {
                const scrolledInSection = startOffset - sectionTop;
                const totalScrollable = sectionHeight - viewportHeight * 0.2;
                progress = Math.min(
                    100,
                    Math.max(0, (scrolledInSection / totalScrollable) * 100)
                );
            }
            this.section.style.setProperty("--timeline-progress", progress);
        },
        destroy() {
            if (this.observer) {
                this.observer.disconnect();
            }
            if (this.resizeObserver) {
                this.resizeObserver.disconnect();
            }
        },
    };
    // ==================== INITIALIZATION ====================
    const initAll = () => {
        Confetti.init();
        TimelineInteractive.init();
    };
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initAll);
    } else {
        initAll();
    }
    window.addEventListener("unload", () => TimelineInteractive.destroy());
    window.Confetti = Confetti;
    window.TimelineInteractive = TimelineInteractive;
})();