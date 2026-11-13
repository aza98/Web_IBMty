# Avisos de terceros — IBMty

Sitio: Iglesia Bautista de Monterrey (IBMty). Revisión del inventario: **2026-10-24**.

El inventario de referencia, legible por máquina, es [`vendor/vendor.json`](vendor/vendor.json);
este documento lo resume. Rigen las licencias originales que acompañan a cada paquete.

## Distribuido localmente (`vendor/`)

| Componente | Versión | Licencia | Titular | Texto |
| --- | --- | --- | --- | --- |
| Bootstrap (incluye Popper) | 5.3.8 | MIT | The Bootstrap Authors | [LICENSE](vendor/bootstrap/5.3.8/LICENSE) |
| Font Awesome Free (fuente web: solid y brands) | 7.3.1 | Iconos CC BY 4.0, fuentes SIL OFL 1.1, código MIT | Fonticons, Inc. | [LICENSE.txt](vendor/fontawesome/7.3.1/LICENSE.txt) |
| GSAP Core y ScrollTrigger | 3.15.0 | Standard "No Charge" GSAP License (no es MIT) | GreenSock | [LICENSE.md](vendor/gsap/3.15.0/LICENSE.md) |
| Swiper | 14.3.0 | MIT | Vladimir Kharlampidi | [LICENSE](vendor/swiper/14.3.0/LICENSE) |
| Leaflet | 1.9.4 | BSD-2-Clause | Volodymyr Agafonkin, CloudMade | [LICENSE](vendor/leaflet/1.9.4/LICENSE) |
| Leaflet.markercluster | 1.5.3 | MIT | David Leaver | [LICENSE.txt](vendor/leaflet-markercluster/1.5.3/LICENSE.txt) |
| Workbox (incluye idb, ISC) | 7.4.1 | MIT | Google LLC | [LICENSE](vendor/workbox/7.4.1/LICENSE) |
| canvas-confetti | 1.9.4 | ISC | Kiril Vatev | [LICENSE](vendor/canvas-confetti/1.9.4/LICENSE) |
| Poppins (Fontsource) | 5.3.0 | SIL OFL 1.1 | The Poppins Project Authors | [LICENSE](vendor/poppins/5.3.0/LICENSE) |
| League Spartan (Fontsource) | 5.3.0 | SIL OFL 1.1 | The League Spartan Project Authors | [LICENSE](vendor/league-spartan/5.3.0/LICENSE) |

Notas:

- Las versiones de las fuentes son las del paquete de Fontsource, no las de la tipografía.
- Los módulos de Workbox 7.4.1 de npm llevan marcas internas `7.4.0`.
- El módulo de expiración de Workbox incluye `idb` (ISC, copyright 2016 Jake Archibald).
- Los iconos de marcas de Font Awesome no otorgan derechos de marca ni implican respaldo.
- Las páginas cargan copias recortadas de Bootstrap y Font Awesome que conservan sus avisos
  (`assets/css/core/bootstrap-subset.css`, `icons.css`); los archivos completos están en
  `vendor/`.

## Recursos derivados

Ninguno (`derived` está vacío en `vendor/vendor.json`). Las ilustraciones SVG en línea de
`pages/salvation.html`, `pages/donate.html`, `pages/privacy.html`, `app/settings.html`,
`app/offline.html`, `assets/js/components/consent.js` y `assets/js/components/push-offer.js`
usan geometría vectorial propia del proyecto.

## Servicios remotos (no disponibles sin conexión)

Estado de cada servicio en [config.js](assets/js/core/config.js) y en el
[estado del proyecto](docs/status.md). Los formularios usan Formspree; GA4 requiere
consentimiento y OneSignal requiere activar los avisos en cada navegador o app instalada.
Cada integración depende de su configuración. Esta revisión no vuelve a validar los términos
externos ni confirma la entrega de los proveedores.

| Servicio | Términos |
| --- | --- |
| OneSignal Web SDK v16 | [Modified MIT License](https://github.com/OneSignal/OneSignal-Website-SDK/blob/main/LICENSE): liga el uso a los servicios de OneSignal; no es MIT estándar |
| Teselas de OpenStreetMap | Datos © colaboradores de OpenStreetMap, [ODbL](https://www.openstreetmap.org/copyright); [política de uso de teselas](https://operations.osmfoundation.org/policies/tiles/). Solo se guardan en caché las teselas vistas |
| Google Maps (iframe de ubicación) | Términos del servicio |
| YouTube (Data API y youtube-nocookie.com) | Términos del servicio |
| Google Analytics 4 | Términos del servicio; solo con consentimiento |
| Formspree | Términos del servicio |

## Skills de agentes (herramientas de desarrollo, no parte del sitio)

El mismo conjunto que RIBBI, registrado en `skills-lock.json`: Ponytail (MIT), Impeccable
(Apache-2.0 con NOTICE), GSAP Skills (MIT; no es la licencia de la biblioteca GSAP), Web
Quality Skills (MIT), OneSignal AI Skills (sin archivo de licencia en el repositorio; confirmar
antes de redistribuir), Security Audit de Cloudflare (MIT) y el skill local laws-of-ux-design (sin licencia de
redistribución declarada). Cada copia conserva su `LICENSE`/`NOTICE` de origen cuando existe.

## Contenido editorial

Estas licencias cubren solo los componentes listados, no las fotos, textos, videos ni logos del
sitio, cuyos derechos pertenecen a sus titulares.
