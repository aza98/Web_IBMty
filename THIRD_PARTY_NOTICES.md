# Avisos de terceros — Third-Party Notices

Sitio: Iglesia Bautista de Monterrey (IBMty) — la versión de la app se define en
`config/config.js` mediante `APP_CONFIG.appVersion`.

Este documento lista el software y los recursos de terceros distribuidos con
este proyecto o cargados por él en tiempo de ejecución. Cada entrada conserva
su propia licencia; los avisos siguientes no sustituyen el texto completo de
cada licencia.

Las versiones se verificaron leyendo los archivos presentes en este repositorio
(encabezados de los paquetes, cadenas de versión y etiquetas `<script>`/`<link>`
con SRI), no de memoria. Donde el texto de la licencia no se distribuye dentro
del repositorio, se indica el origen upstream.

---

## 1. Iconos

### Font Awesome Free 7.3.1 — iconos (geometría SVG)

- Uso: `assets/icons/icons.svg` contiene 65 símbolos SVG locales derivados de la
  geometría de Font Awesome Free 7.3.1. **No** se distribuye ni se carga el
  runtime de Font Awesome, su CSS ni su webfont de iconos.
- Licencia de los iconos: **CC BY 4.0** (Creative Commons Attribution 4.0
  International) — https://creativecommons.org/licenses/by/4.0/
- Copyright: Fonticons, Inc.
- Sitio: https://fontawesome.com — https://fontawesome.com/license/free

> Atribución requerida por CC BY 4.0: los iconos de este sitio derivan de
> Font Awesome Free 7.3.1 por Fonticons, Inc., usados bajo CC BY 4.0.
> Los símbolos se reempaquetaron en un sprite SVG local y se renombraron con
> el prefijo `i-`; la geometría de los trazados no fue modificada.

Nota: el proyecto Font Awesome licencia su código bajo MIT y sus webfonts bajo
SIL OFL 1.1. Aquí sólo se usa la geometría de los iconos, cubierta por CC BY 4.0.

---

## 2. Tipografías (incluidas en el repositorio)

Ambas familias incluyen su texto de licencia dentro del repositorio.

### Poppins

- Uso: `assets/fonts/Poppins/` (woff2 + ttf).
- Licencia: **SIL Open Font License 1.1** — texto completo en
  `assets/fonts/Poppins/OFL.txt` (verificado en el repositorio).
- Copyright 2020 The Poppins Project Authors
  (https://github.com/itfoundry/Poppins)

### League Spartan

- Uso: `assets/fonts/League_Spartan/` (woff2 + ttf, estáticas y variable).
- Licencia: **SIL Open Font License 1.1** — texto completo en
  `assets/fonts/League_Spartan/OFL.txt` (verificado en el repositorio).
- Copyright 2020 The League Spartan Project Authors
  (https://github.com/theleagueof/league-spartan)

---

## 3. Bibliotecas incluidas en el repositorio

### GSAP 3.15.0 (core, ScrollTrigger, Flip, TextPlugin)

- Uso: `gsap-public/minified/gsap.min.js`, `ScrollTrigger.min.js`,
  `Flip.min.js`, `TextPlugin.min.js`.
- Versión verificada en el encabezado de cada archivo: `GSAP 3.15.0`.
- Licencia: **GreenSock Standard License** (no es MIT). Términos en
  https://gsap.com/standard-license
- Copyright GreenSock. All rights reserved. Autor: Jack Doyle.

### Leaflet 1.9.4

- Uso: `leaflet/dist/leaflet.js`, `leaflet/dist/leaflet.css`.
- Versión verificada en el encabezado: `Leaflet 1.9.4+v1.d15112c`.
- Licencia: **BSD-2-Clause** — https://github.com/Leaflet/Leaflet/blob/main/LICENSE
- (c) 2010-2023 Vladimir Agafonkin, (c) 2010-2011 CloudMade.

### Workbox 7.4.1

- Uso: `js/workbox-sw.js` y `workbox/workbox-core.prod.js`,
  `workbox-precaching.prod.js`, `workbox-routing.prod.js`,
  `workbox-strategies.prod.js`, `workbox-expiration.prod.js`,
  `workbox-cacheable-response.prod.js`.
- Versión verificada en las cadenas internas de cada módulo: `7.4.1`.
- Licencia: **MIT** — https://github.com/GoogleChrome/workbox/blob/main/LICENSE
- Copyright Google LLC.

### OneSignal Web SDK v16 (service worker incluido)

- Uso: `js/OneSignalSDK.sw.js` (copia local del service worker de OneSignal).
- Licencia: **MIT** — https://github.com/OneSignal/OneSignal-Website-SDK/blob/main/LICENSE
- Copyright OneSignal, Inc.

---

## 4. Recursos cargados desde CDN (no incluidos en el repositorio)

Estos no se distribuyen con el proyecto; se cargan en tiempo de ejecución desde
sus CDN. Las versiones se verificaron en las etiquetas `<script>` / `<link>` del
HTML (Bootstrap y Swiper con SRI).

| Recurso | Versión | Licencia | Origen |
|---|---|---|---|
| Bootstrap | 5.3.8 | MIT | jsDelivr (con SRI) |
| Swiper | 14.0.6 | MIT | jsDelivr (con SRI) |
| canvas-confetti | 1.9.4 | ISC | jsDelivr |
| OneSignal Web SDK (página) | v16 | MIT | cdn.onesignal.com |

---

## 5. Contenido propio

Los logotipos, fotografías, textos e iconos de marca de la Iglesia Bautista de
Monterrey no son de terceros y no están cubiertos por las licencias anteriores.
