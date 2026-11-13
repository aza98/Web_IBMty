# Sin conexión y PWA

## Piezas y fuentes

| Pieza | Ruta |
| --- | --- |
| Identidad | [manifest.webmanifest](../manifest.webmanifest) |
| Entrada y Workbox local | [sw.js](../sw.js), `vendor/workbox/` |
| Cachés y límites | [config.js](../service-worker/config.js) |
| Inventario y registro del precaché | [precache-manifest.js](../service-worker/precache-manifest.js), [precache.js](../service-worker/precache.js) |
| Rutas y recuperación | [routes.js](../service-worker/routes.js) |
| Protocolo de actualización | [messages.js](../service-worker/messages.js), [updates.js](../assets/js/pwa/updates.js) |
| Registro | [register.js](../assets/js/pwa/register.js) |
| Red, instalación y preferencias | `assets/js/pwa/connectivity.js`, `install.js`, `assets/js/components/settings-panel.js` |
| Push (OneSignal) | [service-worker/push.js](../service-worker/push.js), [services/push.js](../assets/js/services/push.js) |
| Pantallas | `app/splash.html`, `app/offline.html`, `app/settings.html` |

RIBBI tiene la misma estructura (`service-worker/*.js`, precaché generado, redirección sin
conexión, protocolo de actualización, push con OneSignal). `sw.js` importa
`assets/js/core/version.js` y `config.js`; el SDK de OneSignal para el worker solo se importa
mientras `features.push` y `services.oneSignalAppId` están definidos.

Activar push exige la configuración y el servicio de push. Sin ellos no aparece la campana y
Ajustes explica que los avisos no están disponibles; nunca se pide el permiso nativo como
alternativa. La integración del panel de OneSignal debe ser **Custom Code**, con el origen
HTTPS exacto del sitio: así se usan la ruta y el alcance de `sw.js` definidos en el código.
La configuración pública vive solo en [config.js](../assets/js/core/config.js).

La campana solo se ofrece en `off`. En iPhone/iPad desde el navegador, `install-required`
explica que hay que agregar la app a la pantalla de inicio y abrir su icono (iOS 16.4+).
`unsupported`, `unavailable` y `denied` explican compatibilidad, configuración y bloqueo.
`on` exige permiso, suscripción activa en OneSignal, ID y token. Si el SDK falla o todavía
no confirma esos datos, `error` ofrece «Volver a comprobar»; una suscripción nativa por sí
sola nunca se interpreta como activación. Los permisos pertenecen al contexto del navegador
o app instalada; no se copia su estado a preferencias locales.

`state()`, `enable()` y `disable()` publican `push-change`; Ajustes, el engrane y la campana
usan el mismo resultado. `enabling`/`disabling` bloquean los controles compartidos. Se consulta
al abrir Ajustes y al recuperar foco, visibilidad, conexión o una página restaurada; también
se escuchan los cambios de permiso y suscripción de OneSignal. La solicitud nativa ocurre
dentro del toque, antes de esperar al SDK. Sin permiso previo, consultar no descarga el SDK.
Con permiso previo, la campana puede iniciar la comprobación al cargar cada página.

La descarga, inicialización y operaciones del SDK tienen esperas acotadas; los reintentos de
descarga no duplican `init`. Una inicialización que ya falló requiere recargar la página,
como indica el error. Una operación tardía conserva su bloqueo hasta finalizar y publica
entonces el estado actual. Si el worker no puede importar el SDK, la instalación falla y
conserva el worker anterior en vez de sustituirlo por uno incapaz de recibir push.

Las regresiones locales se ejecutan con `node --test tools/test-push*.mjs`. No envían avisos
ni crean suscripciones. Para la prueba real, usar un dispositivo autorizado como Test User
en OneSignal, confirmar alta/baja y recepción en segundo plano. Los pendientes y la evidencia
vigente están en [estado](status.md).

## Precaché

```sh
node tools/verify.mjs --write-precache
node tools/verify.mjs
```

En `precache-manifest.js`, `pages` y `extra` se editan a mano; `files` se genera con revisiones
basadas en el contenido. El shell incluye inicio, nosotros, Salvación, donativos, privacidad,
las tres pantallas de la PWA y los datos JSON (`extra`). El verificador muestra los totales.

El generador sigue las etiquetas `link` y `script` de esas páginas, los recursos `url()` del CSS
(importaciones y fuentes incluidas), el manifiesto y sus iconos, más `extra`. `extra` también
acepta carpetas completas: `assets/images` se precachea porque la primera visita ocurre antes de
que el worker controle la página y sus fotos nunca se guardarían. Las imágenes que el sitio no
usa van en `ignore`.

Regenera el precaché después de cambiar recursos del sitio. Cuando cambia una revisión, el
worker vuelve a descargar ese recurso durante su instalación. El Markdown no está en el precaché
y no requiere regenerarlo. Sube la versión visible en `assets/js/core/version.js` al publicar
una versión nueva de la app.

## Estrategias

La ruta del precaché se registra primero y gana sobre las rutas en tiempo de ejecución.

| Petición que no responde el precaché | Estrategia |
| --- | --- |
| Navegación | Red primero, 4 s de espera; sin red ni copia, redirige a `app/offline.html?from=<url>` |
| Vendor local versionado | Caché primero |
| CSS y JS propios | Stale-while-revalidate |
| Imágenes propias | Caché primero; límites en `service-worker/config.js` |
| Teselas de OSM vistas | Caché primero, 200 teselas, 7 días; sin descarga masiva. Igual que RIBBI |
| YouTube, formularios y otros servicios remotos | Red; sin ruta de caché en el worker |

Al activarse, se borran las cachés `ibmty-*` que no están entre los nombres actuales; vendor,
imágenes y teselas conservan nombres estables. Workbox limpia su precaché. Los parámetros
`source`, `from`, `utm_*` y `fbclid` se ignoran al buscar recursos precacheados. «Reintentar» en
la página sin conexión vuelve a la página de `from` (o recarga si se abrió directamente), igual
que cuando vuelve la conexión.

Workbox usa módulos `.prod.js` locales, `modulePathPrefix` y `debug: false`. Las cargas de
módulos con `importScripts` deben ocurrir durante la evaluación del worker, no dentro de eventos
posteriores.

## Actualizaciones e instalación

1. Registro con `updateViaCache: 'none'`; el cliente busca actualizaciones y Ajustes
   (`app/settings.html`) ofrece una búsqueda manual.
2. Un worker nuevo instala su precaché y espera. Se ofrece «Actualizar / Más tarde».
3. Aceptar envía `SKIP_WAITING`; el cliente recarga cuando cambia el controlador. Si hay un
   formulario editado o pendiente, la actualización se pospone.
4. En la primera instalación no hay worker previo: se activa y toma el control de los clientes.

El protocolo implementa `GET_VERSION` → `{ type: 'VERSION', version }` y `SKIP_WAITING`.
El cambio a la URL con query que registra OneSignal solo se activa sin aviso si se confirma
que el worker activo y el nuevo pertenecen a la misma versión. Una versión distinta o una
consulta sin respuesta conserva la espera y la oferta de actualización. Se mantiene la
migración automática del protocolo antiguo que respondía con una cadena.

`pwa/install.js` captura `beforeinstallprompt` en todas las páginas con engrane. Mientras hay
una oferta y la app no está instalada, el panel muestra «Instalar IBMty» y Ajustes muestra
«Instalar la app» dentro de «Usar esta app». No todos los navegadores lanzan ese evento; valida
aparte la instalación manual en Safari/iOS.

## Identidad, migración y límites

Conserva `id: "./"`, `scope: "./"`, `display: "standalone"` y
`start_url: "./app/splash.html?source=pwa"` salvo una migración explícita. El splash combina un
`meta refresh` de 1 s y un temporizador de 1000 ms en JS (300 ms con movimiento reducido).

Las [rutas antiguas](development.md#rutas-antiguas) necesitan redirecciones en el hosting. No
hay cola de formularios. El video y los mapas externos no quedan disponibles sin conexión por
instalar la app. La evidencia de pruebas está en el [estado](status.md).
