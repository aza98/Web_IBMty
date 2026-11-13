# Estado y pendientes

Revisión del código: **2026-11-05**, versión 8.0.0 ([version.js](../assets/js/core/version.js)).
El repositorio Git empieza en esta versión; los cambios están en el [CHANGELOG](../CHANGELOG.md).
Este es el único lugar para pendientes y evidencia: lo resuelto se borra de aquí.

## Implementado

| Área | Alcance |
| --- | --- |
| Páginas principales | Inicio, Nosotros, Salvación, Donativos y Privacidad ([arquitectura](architecture.md)) |
| Interfaz compartida | Temas, español e inglés, navegación de navegador y PWA, preferencias, copiar, compartir, avisos, pestañas y paneles |
| Inicio | Carrusel de eventos (JSON), horario del servicio, cuenta regresiva y selección de la transmisión de YouTube |
| Nosotros | Filosofía, historia, escenario de misioneros (mapa y una tarjeta, JSON), ministerios (JSON), ubicación y formulario |
| Salvación | Camino, modal de oración, celebración y formulario opcional de seguimiento |
| Donativos | Elección de fondo, datos bancarios y copia; sin procesamiento de pagos |
| Privacidad | Aviso bajo la ley federal de 2025: paneles nativos, apertura por fragmento, impresión y correo ARCO desde la configuración; aviso simplificado junto a ambos formularios; enlace en el aviso de cookies |
| PWA | Registro, precaché, recuperación sin conexión, actualizaciones e instalación desde preferencias cuando el navegador ofrece el evento |
| Publicación | `.htaccess` (cabeceras, HTTPS, archivos ocultos) y despliegue por SFTP ([desarrollo](development.md#despliegue-por-sftp)) |

Esto describe la implementación, no una prueba funcional completa. Los servicios remotos
necesitan red y una configuración válida en [config.js](../assets/js/core/config.js).

## Pendientes

| Cuándo | Pendiente | Listo cuando |
| --- | --- | --- |
| Antes de publicar | Probar los formularios de contacto y seguimiento | Ambos endpoints de Formspree están definidos y `features.forms` está activo, así que los formularios envían de verdad. Probar éxito y error con datos autorizados; en Formspree, activar la restricción de dominio y la protección contra spam |
| Antes de publicar | Restringir la clave de la API de YouTube | En Google Cloud: sitios `https://www.ibmty.com/*`, solo YouTube Data API v3 y un tope diario de cuota |
| Antes de publicar | Configurar el despliegue | Secretos `FTP_SERVER`, `FTP_USERNAME` y `FTP_PASSWORD`, variable `FTP_SERVER_DIR`; el hosting acepta SFTP con usuario y contraseña |
| Primer despliegue | Validar `.htaccess` en el hosting | Sin error 500, cabeceras presentes y redirección HTTPS sin bucle; CSP revisada en la consola de cada página y pasada a obligatoria |
| Antes de publicar | Confirmar datos y contenido editorial | Entrega por WhatsApp sin probar; Facebook e Instagram vacíos. Teléfono, correo y WhatsApp están vacíos en `config.js`: mientras tanto Contacto (Nosotros) no muestra botones de contacto y remite a los datos del pie, y Privacidad no muestra el envío ARCO por correo. Pendientes de revisión del propietario: textos de Salvación (incluida la oración redactada) y Donativos, los títulos «Elige el fondo» y «Copia los datos», y «Abrir todo / Cerrar todo» en Privacidad |
| Antes de publicar | Revisión legal del aviso de privacidad: texto, finalidades necesarias y adicionales, cláusula de transferencias, consentimiento de datos sensibles en Salvación y menores | Reescrito a partir del texto de la ley; sin revisión de un abogado. Confirmar que la casilla basta como «consentimiento expreso y por escrito» para datos sensibles (art. 8) |
| Antes de publicar | Revisar la traducción al inglés | Revisión del propietario, incluido el aviso de privacidad informativo (prevalece la versión en español) |
| Antes de publicar | Hosting, migración e indexación | Redirecciones de las [rutas antiguas](development.md#rutas-antiguas) y borrado manual de los archivos del sitio anterior en el servidor; no hay `sitemap.xml`; `robots.txt` bloquea el rastreo y el HTML tiene `noindex, nofollow` |
| Antes de declarar compatibilidad | Validar la PWA en dispositivos | Safari/iOS, Firefox, reinicio de la app instalada, almacenamiento bloqueado y dispositivos reales ([PWA](offline-pwa.md)) |
| Si se activan | GA4 y OneSignal | Sus IDs están definidos y sus funciones apagadas. Para activarlos: `features.analytics` / `features.push` y sus dominios en la CSP de `.htaccess`. |
| Decisión | Precisión del mapa de misioneros | `assets/data/missionaries.json` publica coordenadas con 4 decimales (unos 11 m); confirmar que son puntos de ciudad y que cada misionero aceptó aparecer |

## Límites conocidos

- Con el texto al doble a 320 px, las palabras grandes con mayúscula («Settings», «Support») se
  cortan sin guion: Chrome no separa con guion palabras con mayúscula. El texto normal no se ve
  afectado. A ese tamaño, el botón flotante de WhatsApp puede tapar texto (posición fija).
- Sin validar: instalación y reinicio reales, Safari/iOS, Firefox, Android, VoiceOver,
  TalkBack y NVDA, ampliación de texto del sistema y zoom completo, gestos táctiles físicos,
  teclados virtuales, impresión en papel, rendimiento en equipos modestos, entrega real de los
  proveedores, subtítulos o transcripciones, y pruebas de uso con personas.
- La única comprobación automática es `node tools/verify.mjs`; las pruebas de regresión con
  `node --test` se eliminaron en la limpieza de la versión 8.0.0.
- Un enlace con fragmento desde otra página no llega a su sección cuando contenido cargado
  desde JSON crece por encima de ella: `pages/about.html#contacto` a 390 px queda a unos
  1100 px de la sección (también antes de los cambios de movimiento del 2026-11-12).
  `donate.html#fund-missions` sí queda visible.

## Evidencia vigente

- **2026-11-13, auditoría de JavaScript (sin publicar).** `node tools/verify.mjs` pasa después
  de `--write-precache` y `node --check` acepta cada archivo de `assets/js/`. Chrome sin
  interfaz contra un servidor local, sin worker ni caché, a 390 px: las siete páginas cargan
  sin errores ni avisos en la consola en español, en inglés y en modo instalado. Ajustes ahora
  carga `pwa/install.js`: con una oferta de instalación aparecen «Instalar la app» en la página
  y en el panel, y se ocultan al usarla (antes el botón nunca podía aparecer ahí). En Inicio:
  los avisos muestran icono y texto en sus dos botones y se cierran al pulsarlos; la línea de
  meses lista los cuatro eventos; el panel de ajustes cierra con Escape y con su botón y
  devuelve el foco al engrane; «Compartir» sin Web Share copia el enlace y, si el portapapeles
  falla, deja el enlace seleccionable en un aviso. Sin conexión también carga `pwa/install.js`
  y su panel ofrece instalar. Se quitaron `runReport()`, `rows()` y
  `services.analyticsReportsEndpoint`, que nadie usaba; Privacidad, Inicio y Ajustes siguen
  cargando sin errores. Sin probar: instalación real, OneSignal y
  formularios reales, Safari, Firefox y dispositivos reales.

- **2026-11-12, auditoría de CSS (sin publicar).** `node tools/verify.mjs` pasa después de
  `--write-precache`. Chrome sin interfaz contra un servidor local, sin worker ni caché y con
  movimiento reducido: se compararon los estilos calculados y la caja de cada elemento antes y
  después en Inicio, Nosotros, Salvación, Donativos, Privacidad, Ajustes y Sin conexión, a 320,
  360, 375, 390, 393, 402, 576, 768, 820, 1024, 1200, 1440 y 1920 × 1080 px, en claro y oscuro,
  navegador y app instalada (320, 390, 768 y 1024 px), con el panel de ajustes y el menú
  abiertos, con avisos y botones flotantes de prueba, y sin JavaScript (320, 390, 768, 1024 y
  1920 px). Solo cambia lo buscado: el rombo pequeño de la hoja de YouVersion pasa a la derecha
  (su `right: 6%` no se aplicaba); el panel de ajustes coincide con el borde del pill desde
  1200 px (quedaba 6 a 7.5 px adentro por usar `100vw` con el espacio reservado de la barra de
  desplazamiento); «Te esperamos» y «Hablemos» usan `.title-lg`; los títulos del aviso flotante
  y de Privacidad toman `--leading-heading`; en Ajustes, «Usar esta app» usa las filas de la
  página (antes: dos `summary` de 24 px de alto en una tarjeta del panel). Sin desbordes
  horizontales a 320, 360 y 1920 px. Segunda pasada, misma matriz: todos los `h1`–`h4` toman
  `--leading-heading` desde `base.css` (cambian los títulos del pie, del panel, «Los enviados»
  y el subtítulo de Sin conexión, de 1.2 a 1.05/1.15); el engrane y los cierres del panel y del
  aviso comparten `.icon-btn` sin mover ninguna caja; `main.css` y sus 14 `@import` se
  sustituyen por enlaces directos en cada página (`tools/verify.project.mjs` comprueba que
  ninguna pierda una hoja). Sin probar: inglés, `:hover`, foco con ratón sobre el
  cierre del modal, impresión, texto ampliado, Safari, Firefox y dispositivos reales.

- **2026-11-12, movimiento (sin publicar).** `node tools/verify.mjs` pasa después de
  `--write-precache`. Chrome sin interfaz contra el servidor local, sin worker ni caché, a 390 y
  1280 px: en Inicio, Nosotros, Salvación, Donativos y Privacidad, ningún `[data-reveal]` queda
  oculto tras recorrer la página, sin errores de consola ni estilos en línea sobrantes. Con
  movimiento reducido nada queda oculto, también al activarlo con la página abierta. El botón
  «Abrir YouVersion» sube y aparece a la vez. Las transiciones y animaciones CSS usan la escala
  `--dur-*` de `tokens.css` (0.2, 0.3, 0.4 y 0.6 s; antes once valores entre 0.18 y 0.6 s): en
  las seis páginas todas las duraciones calculadas coinciden con la escala. Sin probar: tema
  oscuro, inglés, modo instalado, dispositivos reales y equipos modestos.

- **2026-11-11, reducción de botones (sin publicar).** `node tools/verify.mjs` pasa después de
  `--write-precache`. Chrome sin interfaz, sin worker ni caché: Inicio a 360 px (claro y oscuro)
  y 1280 px, Nosotros a 320 y 360 px, Donativos a 360 px y Salvación a 360 px (oscuro).
  «Compartir» es un icono redondo en tarjetas, transmisión, ubicación y Salvación; la
  transmisión tiene una sola acción principal; horarios, valores e índice ya no tienen forma de
  botón; los contactos sin configurar se ocultan; la campana usa el tono del navbar; el zoom del
  mapa queda arriba en teléfonos; «Copiar» de la CLABE es la acción principal en Donativos. Sin
  probar: inglés, modo instalado, la campana tras «Ahora no» con OneSignal real, compartir en
  un dispositivo, lectores de pantalla y texto ampliado.
- **2026-11-11, navegación y encabezados en teléfonos (sin publicar).** `node tools/verify.mjs`
  pasa después de `--write-precache`. Chrome sin interfaz, sin worker ni caché, movimiento
  reducido: Inicio a 320 y 360 px (claro y oscuro) y 1280 px (oscuro), Nosotros a 360 px
  (oscuro). El pill de navegación se distingue sobre tarjetas claras y bandas oscuras; los
  encabezados de varias líneas ya no se tocan y el estado del evento va en su propia línea. Sin
  probar: inglés, modo instalado (barra de pestañas), panel de ajustes abierto, dispositivos
  reales y texto ampliado.
- **2026-11-09, rediseño de Historia y misioneros (sin publicar).** `node tools/verify.mjs`
  pasa después de `--write-precache`. Chrome sin interfaz con movimiento reducido: Nosotros a
  390 px (claro, oscuro e inglés), 1024 px (claro y oscuro) y 1440 px (claro); el escenario
  queda listo, «siguiente» avanza el conteo y la ruta (Sydney cruza el Pacífico), el panel de
  escritorio cabe sin desplazarse a 1024 px y, con los mosaicos bloqueados, vuelve la lista
  completa. Sin probar: deslizar y tocar marcadores en un teléfono real, modo instalado,
  teclado y lector de pantalla, ni zoom de texto.
- **2026-11-05, versión 8.0.0.** `node tools/verify.mjs` pasa después de `--write-precache`.
  El paquete pasa la revisión de contenido de `deploy.yml`, incluye `.htaccess` y la revisión
  falla si se le agregan `tools/`, `.claude/`, `docs/` o `.DS_Store`, o si falta `.htaccess`.
  Chrome sin interfaz, con los dominios externos bloqueados: Nosotros muestra los cuatro chips
  del mapa con icono, etiqueta y cuenta, nueve misioneros con coordenadas numéricas y solo
  enlaces sociales `https:`; Inicio y Nosotros no registran errores no capturados. Apache 2.4
  local con `.htaccess`: sintaxis correcta, HTTP → 301 a `https://www.ibmty.com`, 404 para
  archivos ocultos, 200 en `/.well-known/` y cabeceras presentes. Sin probar: el hosting real,
  la subida por SFTP y los informes de la CSP.
- **2026-11-04.** Chrome sin interfaz (macOS), con peticiones externas bloqueadas, caché
  desactivada y sin worker: 7 páginas × español e inglés × (393 px y 320 px con el texto raíz al
  doble) = 28 estados sin desbordamiento horizontal, sin elementos fuera del viewport, sin
  errores en consola, sin invitaciones mientras analítica y push están sin configurar y con la
  lista de misiones abierta cuando las teselas fallan. Una medición de guiones en ambos idiomas a
  393 y 1280 px no encontró encabezados de tamaño normal que cambien.
- **2026-11-03.** Chrome sin interfaz, local: primera instalación, seis páginas y las listas
  JSON en caché sin conexión, recuperación con la URL original de «Reintentar» y
  actualizaciones pospuestas y aceptadas bajo `/review/` (con una revisión sintética del
  worker, sin cambiar la versión).
- En ninguna revisión se enviaron formularios reales, suscripciones ni mensajes.
