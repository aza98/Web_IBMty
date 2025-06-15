document.addEventListener("DOMContentLoaded", function () {
    // Función para mostrar notificación
    function e(e) {
        let t = document.createElement("div");
        t.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background:#4caf50;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999;
            font-family: inherit;
            font-size: 14px;
            font-weight: 500;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `, t.innerHTML = `
            <i class="fas fa-check-circle" style="margin-right: 8px;"></i>
            ${e}
        `, document.body.appendChild(t), setTimeout(() => {
            t.style.transform = "translateX(0)"
        }, 100), setTimeout(() => {
            t.style.transform = "translateX(100%)", setTimeout(() => {
                document.body.contains(t) && document.body.removeChild(t)
            }, 300)
        }, 3e3)
    }
    // Función para copiar texto
    async function t(e) {
        try {
            if (navigator.clipboard && window.isSecureContext) return await navigator.clipboard.writeText(e), !0;
            {
                let t = document.createElement("textarea");
                t.value = e, t.style.cssText = `
                    position: fixed;
                    top: -9999px;
                    left: -9999px;
                    opacity: 0;
                `, document.body.appendChild(t), t.focus(), t.select();
                let r = document.execCommand("copy");
                return document.body.removeChild(t), r
            }
        } catch (a) {
            return console.error("Error al copiar:", a), !1
        }
    }
    let r = document.querySelectorAll(".copy-btn");
    r.forEach(r => {
        r.addEventListener("click", async function () {
            let r = this.getAttribute("data-copy");
            if (!r) {
                console.error("No se encontr\xf3 texto para copiar");
                return
            }
            let a = await t(r);
            if (a) {
                e("Texto copiado al portapapeles");
                let o = this.querySelector("i");
                o && function e(t) {
                    let r = t.className;
                    t.className = "fas fa-check", setTimeout(() => {
                        t.className = r
                    }, 2e3)
                }(o)
            } else e("Error al copiar el texto")
        })
    }),

    // Mostrar el año actual en el pie de página
    document.getElementById("currentYear").textContent = new Date().getFullYear()
});