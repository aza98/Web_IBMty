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
// Inicializar el tema al cargar la página
document.addEventListener("DOMContentLoaded", () => {
    setTheme(getPreferredTheme()), initAOS(), initAnimateCSS()
});