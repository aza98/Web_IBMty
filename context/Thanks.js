let clickCount = 0;
let clickTimer;

document.getElementById('heartIcon').addEventListener('click', function () {
    clickCount++;

    clearTimeout(clickTimer);

    clickTimer = setTimeout(() => {
        if (clickCount >= 7) {
            const modal = new bootstrap.Modal(document.getElementById('developers'));
            modal.show();
        }
        clickCount = 0; // Reiniciar contador después del tiempo
    }, 1000); // Máximo intervalo entre clics (600ms recomendado)
});