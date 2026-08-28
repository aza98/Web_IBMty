<div align="center">

<img src="assets/icons/IBMTY.svg" width="96" height="96" alt="IBMty Logo">

# IBMty

**Sitio web oficial y Aplicación Web Progresiva (PWA) de la Iglesia Bautista de Monterrey.**

[![Versión](https://img.shields.io/badge/Versi%C3%B3n-config%2Fconfig.js-0F172A?style=flat-square&logo=git&logoColor=F05032)](config/config.js)
[![HTML5](https://img.shields.io/badge/HTML5-0F172A?style=flat-square&logo=html5&logoColor=E34F26)](https://developer.mozilla.org/es/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-0F172A?style=flat-square&logo=css3&logoColor=1572B6)](https://developer.mozilla.org/es/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-0F172A?style=flat-square&logo=javascript&logoColor=F7DF1E)](https://developer.mozilla.org/es/docs/Web/JavaScript)
[![Bootstrap](https://img.shields.io/badge/Bootstrap_5-0F172A?style=flat-square&logo=bootstrap&logoColor=7952B3)](https://getbootstrap.com)
[![PWA](https://img.shields.io/badge/PWA-Ready-0F172A?style=flat-square&logo=pwa&logoColor=5A0FC8)](https://web.dev/explore/progressive-web-apps)

[Sitio Web](https://www.ibmty.com) • [Ubicación](https://maps.google.com/?q=Iglesia+Bautista+de+Monterrey) • [Transmisión en Vivo](https://www.youtube.com/channel/UCfhSTnqLb6vFO28eNm_n0qw)

</div>

<br>

## Características

- **PWA & Offline:** Instalable en dispositivos móviles y de escritorio con soporte sin conexión mediante Workbox.
- **Tema Adaptativo:** Modos Claro, Oscuro y sincronización automática con el sistema.
- **Transmisión en Vivo:** Detección en directo de YouTube Data API y cuenta regresiva de servicios.
- **Mapa Misionero:** Mapa interactivo con Leaflet para visualizar misioneros en el mundo.
- **Notificaciones Push:** Avisos y actualizaciones en tiempo real mediante OneSignal.
- **100% Estático:** Sin backend ni dependencias de compilación en producción; carga instantánea.

---

## Páginas y Vistas

| Página | Archivo | Descripción |
| :--- | :--- | :--- |
| **Inicio** | `index.html` | Portada, horarios, eventos y transmisión en vivo. |
| **Nosotros** | `nosotros.html` | Misión, visión, historia, líderes y mapa misionero. |
| **Salvación** | `salvacion.html` | Mensaje del evangelio y modal interactivo de oración. |
| **Donativos** | `donativo.html` | Información bancaria para diezmos y ofrendas. |
| **Privacidad** | `privacidad.html` | Aviso de privacidad y políticas de protección de datos. |
| **Ajustes** | `settings.html` | Configuración de tema, notificaciones y app instalada. |
| **Inicio App** | `splash.html` | Pantalla de transición de entrada para la PWA instalada. |
| **Sin Conexión** | `offline.html` | Pantalla de respaldo para navegación sin red. |

---

## Inicio Rápido

Para probar el sitio localmente se requiere un servidor HTTP estático (necesario para el registro de Service Workers):

```bash
# Con Python 3
python3 -m http.server 8080

# O con Node.js
npx serve .
```

Abre en tu navegador: `http://localhost:8080`

---

## Estructura del Proyecto

```text
├── assets/                  # Iconos SVG, fuentes locales, imágenes y multimedia
├── config/config.js         # Configuración global APP_CONFIG y única fuente de appVersion
├── css/                     # Estilos compartidos (main.css) y hojas por página
├── js/                      # Lógica principal, componentes y controladores de página
├── sw.js, manifest.json     # Service Worker (precaché) y manifiesto PWA
└── *.html                   # Vistas públicas y superficies PWA
```

---

## Despliegue

El despliegue es **completamente automatizado**: al realizar un `push` a la rama `main`, **GitHub Actions** (`.github/workflows/main.yml`) sincroniza los archivos vía FTP con el servidor de producción.

---

<div align="center">

Consulta [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) para atribuciones y licencias de terceros.

</div>
