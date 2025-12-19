(function () {
    const GA_MEASUREMENT_ID = 'G-5QCR4WRFPD';
    if (!GA_MEASUREMENT_ID || GA_MEASUREMENT_ID === 'G-XXXXXXXXXX') {
        console.warn('Google Analytics: El ID de medición no está configurado. Actualice analytics.js.');
        return
    }
    const script = document.createElement('script');
    script.async = !0;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);
    window.dataLayer = window.dataLayer || [];

    function gtag() {
        dataLayer.push(arguments)
    }
    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID);
    console.log(`Inicializado Google Analytics`)
})()