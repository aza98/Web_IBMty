# Registro de cambios

Todos los cambios importantes del proyecto se documentan en este archivo.
El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y el proyecto sigue el [Versionado Semántico](https://semver.org/lang/es/).

## [8.1.0] - 2026-11-17

Optimización de CSS y JavaScript con las guías de Modern Web Guidance.

### Corregido

- El service worker no se instalaba: `service-worker/config.js` perdió su invocación al unir
  el historial de v7 y v8, así que no había precaché, modo sin conexión ni push.
  `tools/verify.project.mjs` ahora falla si vuelve a pasar.

### Cambiado

- Carruseles nativos con scroll-snap (`components/carousel.js`) en lugar de Swiper (154 KB de JS
  y 15 KB de CSS menos en Inicio y Nosotros). Las flechas pasan del último al primero; deslizar
  se detiene en los extremos, y el primer y el último evento pueden quedar al centro.
- Sin el JavaScript de Bootstrap (80 KB menos en cada página): el modal de oración es un
  `<dialog>` nativo, el menú de teléfonos lo abre `components/navigation.js` y
  `bootstrap-subset.css` pierde los estilos del modal, de `.fade` y de `.collapsing`.
- El panel de ajustes es un popover (capa superior; Escape, gesto atrás y toque fuera lo
  cierran), con el comportamiento anterior en navegadores sin popover.
- Las fuentes de iconos se recortan a los glifos en uso (`vendor/fontawesome/7.3.1-subset/`):
  de 234 KB a 5.6 KB. El verificador falla si un icono no tiene glifo.
- Los paneles de Privacidad se abren de forma nativa y CSS anima su altura
  (`::details-content`); `disclosure.js` ya no usa GSAP.
- El movimiento reducido se resuelve componente por componente en lugar de una regla global en
  `base.css`: se conservan los cambios de color y de estado; Leaflet también lo respeta.
- Los colores de tema de ilustraciones, Ajustes y el splash pasan a `tokens.css`; los
  diamantes de las hojas ya no tienen `will-change`.
- `app.js` cede el hilo cada 50 ms al arrancar los módulos (la tarea larga de inicio baja de
  ~100 ms a 57–71 ms con la CPU 4 veces más lenta).
- Cada página precarga la fuente de títulos, la de texto y sus JSON; `theme.js` fija
  `color-scheme` antes de que llegue el CSS.
- El service worker desactiva la precarga de navegación: todas las páginas salen del precaché y
  esa descarga se tiraba.
- `.htaccess` comprime HTML, CSS, JS, JSON y SVG cuando el hosting tiene `mod_deflate`.
- `copy.js` deja el respaldo con `execCommand`; las peticiones a YouTube se cortan a los 8 s.

### Eliminado

- Swiper 14.3.0 y `bootstrap.bundle.min.js` de `vendor/`.

### Dependencias

- Bootstrap 5.3.8 → 5.3.9 (solo CSS). En la copia recortada solo cambia el selector
  `::-webkit-datetime-edit-minute-field` del reboot; el resto de los cambios de la versión
  (modal `xxl`, `placeholder` con movimiento reducido) no se usan aquí.

## [8.0.0] - 2026-11-05

Primera versión desde un repositorio Git público con despliegue automático.

### Agregado

- `.github/workflows/deploy.yml`: en cada push a `main` ejecuta `node tools/verify.mjs`,
  empaqueta el sitio con `tools/package.sh`, rechaza un paquete que contenga documentación,
  herramientas, carpetas de agentes, Markdown que no sea un aviso de licencia o `.DS_Store`, y
  lo sube por FTPS con FTP-Deploy-Action (fijada por SHA de commit). Las credenciales solo
  vienen de los secretos del repositorio.
- `.htaccess` (se publica): sin listado de directorios, SSI ni CGI; redirección HTTPS al dominio
  de producción; los archivos que empiezan con punto responden 404, salvo `/.well-known/`;
  HSTS, `nosniff`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` y una política
  de seguridad de contenido (CSP) en modo solo informe.
- `CHANGELOG.md` y `CONTRIBUTING.md`.

### Cambiado

- `tools/package.sh` publica `.htaccess` y ya no incluye el aviso de terceros histórico.
- `.gitignore` y `.gitattributes` cubren basura de editores, la salida del paquete, el estado
  del despliegue y los binarios.
- Fecha de la versión en `assets/js/core/version.js`; precaché regenerado.
- Documentación consolidada: una fuente por tema; `AGENTS.md` es la referencia para agentes de
  IA (en inglés) y absorbe el contexto de arranque; `docs/` pasa al español y absorbe las guías
  de traducción y de licencias; `docs/status.md` conserva solo los pendientes y la evidencia
  vigentes.

### Seguridad

- Los chips del mapa de misiones insertan el nombre de la región como texto, no como HTML
  (`components/map.js`).
- Los enlaces sociales de los archivos de datos solo aceptan URL `https:`
  (`components/share.js`).
- Las coordenadas de los misioneros se escapan en el marcado de la lista (`pages/about.js`).

### Eliminado

- Archivos `.DS_Store` de macOS, capturas de las revisiones de Impeccable y registros vacíos de
  su ejecución.
- Documentación histórica del sitio anterior, el índice de `docs/` y los documentos fusionados.
- Maquetas de diseño de Impeccable y su captura del sistema de diseño.
- Pruebas de regresión con `node --test`, que no formaban parte de la verificación ni del
  despliegue.
