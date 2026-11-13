# Arquitectura

Sitio estático multipágina con mejora progresiva. Cada HTML es su propia entrada; scripts
clásicos, sin módulos ES ni empaquetador. Las dependencias y fuentes están en `vendor/`; los
servicios externos necesitan red. La estructura, los módulos `core/` y `tools/verify.mjs` se
comparten con RIBBI; el contenido y la configuración no.

## Páginas y contenido

| Archivo | `data-page` | Contenido |
| --- | --- | --- |
| `index.html` | `home` | Eventos, transmisión y recursos bíblicos |
| `pages/about.html` | `about` | Iglesia, ministerios, misiones, ubicación y contacto |
| `pages/salvation.html` | `salvation` | Camino, oración y seguimiento |
| `pages/donate.html` | `donate` | Fondos y transferencia bancaria |
| `pages/privacy.html` | `privacy` | Aviso (resumen y paneles plegables) y solicitudes ARCO; las partes sobre GA4, push y formularios solo se muestran mientras están configuradas (`pages/privacy.js`) |
| `app/settings.html` | `settings` | Apariencia, idioma, notificaciones, uso de la app (instalación y límites sin conexión), enlaces, versión, conexión y actualizaciones |
| `app/splash.html` | `splash` | Entrada de la PWA |
| `app/offline.html` | `offline` | Recuperación y acceso al shell |

Los registros repetidos viven en `assets/data/`: `events.json` (inicio), `ministries.json` y
`missionaries.json` (nosotros). Los módulos de página los renderizan en `prepare()`, antes de
que arranquen carruseles, mapa, compartir y animaciones; la prosa (Salvación, Privacidad,
Donativos) se queda en el HTML. Nosotros espera cada lista por separado: una lista que falla
muestra un mensaje para recargar sin descartar la otra. Mapas y carruseles vacíos no se
inicializan. Horarios, enlaces y servicios están en
[config.js](../assets/js/core/config.js).

## Mapa del repositorio

```text
index.html                 Inicio
pages/                     Páginas principales
app/                       Splash, sin conexión y ajustes
assets/css/                core/, components/ (en cada página); pages/
assets/js/                 boot, core, i18n, components, services, pwa, pages
assets/data/               Eventos, ministerios y misioneros (JSON)
assets/icons/app/          Iconos y logo de la app
assets/images/             events, leaders, logos, missionaries, shared
service-worker/            Configuración, precaché, rutas, mensajes y push
vendor/                    Dependencias versionadas y sus licencias
tools/                     verify.mjs (compartido con RIBBI), verify.project.mjs, package.sh
docs/                      Documentación técnica
.htaccess                  Cabeceras, HTTPS y bloqueo de archivos ocultos en Apache (se publica)
.github/workflows/         Despliegue por FTP
.agents/, .claude/         Skills de agentes
.impeccable/surfaces/      Brief de diseño por pantalla
```

`sw.js`, el manifiesto y `robots.txt` están en la raíz; también `PRODUCT.md` y `DESIGN.md`,
porque Impeccable los busca ahí.

## Fuentes de verdad

| Tema | Archivo |
| --- | --- |
| Versión compartida por páginas y worker | [version.js](../assets/js/core/version.js) → `IBMTY_RELEASE` |
| Configuración pública | [config.js](../assets/js/core/config.js) → `IBMty.config` |
| Registro y eventos | [app.js](../assets/js/core/app.js) (igual al de RIBBI salvo el espacio de nombres) |
| Claves persistidas | [storage.js](../assets/js/core/storage.js); `boot/theme.js` también lee el tema |
| Traducción | [i18n.js](../assets/js/core/i18n.js) y `assets/js/i18n/en/` (ver «Traducción» más abajo) |
| Colores, tipografía y medidas | [tokens.css](../assets/css/core/tokens.css) |
| Dependencias y hashes | [vendor.json](../vendor/vendor.json) |
| Caché e identidad | [Sin conexión y PWA](offline-pwa.md) |

## Carga e inicialización

1. En el `head`, `boot/theme.js` y `boot/pwa-launch.js` aplican tema y modo antes del primer
   pintado, sin depender de nada más.
2. CSS: Bootstrap y Font Awesome recortados (`assets/css/core/bootstrap-subset.css` e
   `icons.css`; los archivos completos se quedan en `vendor/`), el resto del CSS de vendor que
   haga falta, las hojas de `core/` y `components/` y el CSS de la página. El splash carga solo
   `core/` y su propia hoja.
3. Scripts `defer`: dependencias; versión, configuración, registro y almacenamiento;
   `core/i18n.js` y los diccionarios en inglés; módulos compartidos y lógica de la página, en
   el orden del HTML.
4. `app.js` espera `DOMContentLoaded`, espera cada `prepare()`, arranca los módulos y emite
   `app:ready`.

Cada pantalla carga sus bibliotecas: Swiper en inicio y nosotros, Leaflet en nosotros y
canvas-confetti en Salvación. Revisa las etiquetas reales antes de cambiar el orden.

## Contratos de JS y DOM

```js
(function (IBMty) {
  'use strict';
  IBMty.register('page:about', {
    async prepare(app) { /* opcional: renderizar datos de assets/data/ */ },
    init(app) { /* app.config, app.storage, app.i18n, app.content, app.on, app.emit, app.url */ }
  });
})(self.IBMty = self.IBMty || {});
```

- `page:*` solo arranca cuando coincide con `body[data-page]`. El registro aísla los errores
  de cada módulo.
- `IBMty.emit('name', detail)` despacha `ibmty:name` en `document`; `IBMty.on('name', fn)` lo
  recibe, con los datos en `event.detail`. `IBMty.url(path)` resuelve desde la raíz del sitio,
  `IBMty.root` es el prefijo relativo e `IBMty.escapeHtml()` escapa texto para plantillas.
- `services/content.js`: `load(name)` obtiene `assets/data/<name>.json`;
  `fill(selector, records, template)` los renderiza y vuelve a apuntar un `#hash` que señalaba
  dentro de la lista.
- `data-config` y `data-config-as` enlazan la configuración con el DOM; `data-config-pending`
  explica los valores vacíos. Ver `components/config-bindings.js`.
- `form[data-form]` elige el endpoint; `data-form-require-one` exige al menos un contacto.
  `services/forms.js` sustituye un formulario sin endpoint por opciones de contacto antes de
  pedir datos, valida, rechaza la falta de red y solo muestra éxito tras una respuesta HTTP
  correcta. No hay cola sin conexión.
- `data-copy`, `data-share-*`, `data-disclosure` y las pestañas tienen sus módulos en
  `assets/js/components/`; revisa productores y consumidores.
- `components/notices.js`: `IBMty.notices.show({ id, text, action: { label, onClick },
  dismissLabel, onDismiss })` agrega o reemplaza el aviso con ese `id` y lo devuelve;
  `hide(id)` lo quita. Se define al cargar, así que otros módulos lo usan desde su `init`.
- `pwa/install.js`: `IBMty.install { available, prompt() }` y el evento `install-change`. Lo
  cargan todas las páginas con engrane (también Ajustes y Sin conexión); sin él no hay oferta
  de instalación.
- `services/analytics.js`: `IBMty.analytics { enabled, applyConsent() }`; GA4 solo se descarga
  con `features.analytics`, `services.analyticsId` y el consentimiento guardado.
- Los iconos son Font Awesome (`<i class="fa-solid fa-… icon">`).
- Seguridad: los datos de plantilla pasan por `IBMty.escapeHtml`, el texto dinámico por
  `textContent`, y los enlaces que vienen de los JSON solo aceptan `https:`.
- Estilo: IIFE, `'use strict'` y un comentario de cabecera por archivo. Conserva la sangría de
  cada archivo (hay módulos con dos espacios y con cuatro); los nuevos siguen `.editorconfig`.

## CSS, tema y persistencia

```text
assets/css/core/         bootstrap-subset, icons, tokens, fonts, base, layout
assets/css/components/   navigation, settings-panel, footer, sheets, illustrations, buttons,
                         carousel, tabs, forms, floating
assets/css/pages/        una hoja por pantalla
```

Cada página enlaza las hojas de `core/` y `components/` una por una, sin `@import` ni hoja de
entrada (así el navegador las descubre todas a la vez), en ese orden: Bootstrap recortado, el
CSS de vendor, iconos, tokens, fonts, base, layout, los componentes y al final la hoja de la
página. El orden importa: las hojas posteriores ganan con la misma especificidad. Una hoja
compartida nueva se enlaza en las siete páginas; `tools/verify.project.mjs` falla si a una le
falta alguna o cambia el orden. El splash solo carga `core/` y su hoja.

Las piezas compartidas viven en un solo lugar (ver [DESIGN](../DESIGN.md)): los títulos toman
su interlineado de `--leading-*` (`base.css` da `--leading-heading` a todo `h1`–`h4`), los
botones redondos sin relleno usan `.icon-btn` y los botones flotantes miden `--fab-size`.

El tema usa `html[data-bs-theme="light|dark"]`. `IBMty.theme` permite claro, oscuro o
automático y sincroniza `theme-color`.

`html[data-display="standalone|browser"]` distingue la app instalada del ancho de pantalla: la
barra de pestañas depende del modo, no solo del viewport. Los estilos respetan las áreas
seguras. Tamaños y accesibilidad: [revisión visual](design-review.md).

El almacenamiento tolera estar bloqueado o lleno. Claves (valores JSON): `ibmty:theme`,
`ibmty:lang`, `ibmty:consent`, `ibmty:push-offer`, `ibmty:whatsapp-button` e
`ibmty:latest-live`. No cambies claves sin revisar lectores y migración; `boot/theme.js` lee el
tema antes que `storage.js`.

## Traducción

El español es el idioma fuente de todo texto, en HTML y en JavaScript. El inglés es una capa
que aplica en el navegador `assets/js/core/i18n.js`, igual en RIBBI salvo el espacio de nombres.

- Cada texto exacto en español (con espacios colapsados) tiene su texto en inglés. Los patrones
  cubren textos que mezclan palabras con números o fechas («Faltan 3 días», «2 de 9»).
- Se traducen nodos de texto (SVG incluido), `aria-label`, `title`, `alt`, `placeholder`, la
  descripción, las meta de Open Graph y el título. Un MutationObserver traduce lo que los
  módulos renderizan después (tarjetas de JSON, paneles, avisos).
- Volver al español restaura los textos originales y el `lang` de la página.
- La elección se guarda en `ibmty:lang`; por defecto sigue el idioma del navegador. El selector
  está en Ajustes (panel y página).
- `IBMty.i18n`: `{ lang, locale, set(lang), translate(text), add(lang, entry) }`; `locale` es
  `es-MX` o `en` para fechas y números. Evento: `language-change`.
- En un dispositivo lento el español puede verse un instante antes de la capa en inglés.

```text
assets/js/i18n/en/common.js     textos de todas las páginas (navegación, pie, ajustes, avisos…)
assets/js/i18n/en/<page>.js     textos de una sola página; solo se cargan ahí
```

```js
IBMty.i18n.add('en', {
  keep: ['IBMty', 'Instagram'],                // textos que no cambian (se revisan, no se traducen)
  texts: { 'Saltar al contenido': 'Skip to content' },
  patterns: [[/^(\d+) de (\d+)$/, '$1 of $2']] // se prueban en orden si no hay texto exacto
});
```

- Todo texto español nuevo o modificado necesita su entrada en el diccionario correcto; los
  textos generados en JS usan la cadena exacta que renderiza el módulo (o un patrón).
- Los nombres propios (personas, iglesias, lugares, eventos, proveedores) van en `keep`. Las
  páginas cargan `core/i18n.js`, luego `common.js` y luego su propio diccionario.
- `node tools/verify.mjs` falla cuando un texto del HTML estático no tiene entrada ni `keep`, y
  avisa de entradas que ninguna página o script usa. Los textos que solo aparecen en tiempo de
  ejecución no se revisan: cambia a inglés y recorre el flujo.
- Los textos legales son traducciones informativas; el aviso de privacidad indica que prevalece
  la versión en español. La revisión de las traducciones está [pendiente](status.md).

## Decisiones aplicadas

- Las imágenes usan nombres en minúsculas con guiones, en carpetas en inglés; los archivos con
  nombre de una persona, lugar o ministerio lo conservan (`leaders/adultos.webp`). Se conservan
  los distintos formatos.
- Los skills de Claude idénticos enlazan a `.agents/skills/` con enlaces simbólicos relativos;
  consérvalos al copiar el proyecto.
