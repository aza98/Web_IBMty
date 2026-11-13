# Registro de cambios

Todos los cambios importantes del proyecto se documentan en este archivo.
El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y el proyecto sigue el [Versionado Semántico](https://semver.org/lang/es/).

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
