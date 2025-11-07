// Tema constantes
const LIGHT_THEME = "light",
    DARK_THEME = "dark";

// Función para obtener el tema preferido del usuario de localStorage o de las preferencias del sistema.
function getPreferredTheme() {
    let e = localStorage.getItem("theme");
    return e || (window.matchMedia("(prefers-color-scheme: dark)").matches ? DARK_THEME : LIGHT_THEME)
}

// Función para establecer los iconos del tema
function setThemeIcons(e) {
    let t = document.getElementById("mobile-theme-icon"),
        n = document.getElementById("desktop-theme-icon");
    e ? (t?.classList.replace("fa-sun", "fa-moon"), n?.classList.replace("fa-sun", "fa-moon")) : (t?.classList.replace("fa-moon", "fa-sun"), n?.classList.replace("fa-moon", "fa-sun"))
}

// Función para establecer el tema
function setTheme(e) {
    document.documentElement.setAttribute("data-bs-theme", e), localStorage.setItem("theme", e), setThemeIcons(e === DARK_THEME)
}

// Función para cambiar de tema
function toggleTheme() {
    let e = document.documentElement.getAttribute("data-bs-theme");
    setTheme(e === LIGHT_THEME ? DARK_THEME : LIGHT_THEME)
}

// Inicializar AOS y Animate.css
function initAOS() {
    window.AOS && AOS.init()
}

// Inicializar Animate.css en los elementos
function initAnimateCSS() {
    let e = document.querySelectorAll(".animate-on-load");
    e.forEach(e => {
        e.classList.add("animate__animated"), e.classList.add("animate__fadeIn")
    })
}

// Función para el Easter Egg del ícono de corazón
function initHeartIconEasterEgg() {
    let clickCount = 0;
    let clickTimer;
    const heartIcon = document.getElementById('heartIcon');

    if (heartIcon) {
        heartIcon.addEventListener('click', function() {
            clickCount++;
            clearTimeout(clickTimer);
            clickTimer = setTimeout(() => {
                if (clickCount >= 7) {
                    const modal = new bootstrap.Modal(document.getElementById('developers'));
                    modal.show()
                }
                clickCount = 0
            }, 1000)
        })
    }
}

// Función de Fallback para copiar texto (para navegadores antiguos o inseguros)
function fallbackCopyText(text, toastInstance) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = 0;
    textArea.style.left = 0;
    textArea.style.opacity = 0;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            toastInstance.show();
        } else {
            console.error('Fallback: No se pudo copiar el texto');
        }
    } catch (err) {
        console.error('Fallback: Error al copiar', err);
    }
    document.body.removeChild(textArea);
}

// Inicializar botones de copiar con Toast de Bootstrap
function initCopyButtons() {
    const toastEl = document.getElementById('copyToast');
    if (toastEl) {
        const copyToast = new bootstrap.Toast(toastEl);
        document.querySelectorAll('.copy-btn').forEach(button => {
            button.addEventListener('click', () => {
                const textToCopy = button.dataset.copy;
                if (navigator.clipboard) {
                    navigator.clipboard.writeText(textToCopy).then(() => {
                        copyToast.show();
                    }).catch(err => {
                        console.error('Error al copiar con la API moderna: ', err);
                        fallbackCopyText(textToCopy, copyToast);
                    });
                } else {
                    fallbackCopyText(textToCopy, copyToast);
                }
            });
        });
    }
}

// Inicializar el tema al cargar la página
document.addEventListener("DOMContentLoaded", () => {
    setTheme(getPreferredTheme()), initAOS(), initAnimateCSS(), initHeartIconEasterEgg(), initCopyButtons(),

        // Mostrar el año actual en el pie de página
        document.getElementById("currentYear").textContent = new Date().getFullYear()
});