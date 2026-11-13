# Cómo contribuir

Gracias por ayudar con el sitio de la Iglesia Bautista de Monterrey. Si trabajas con un agente
de IA (Claude Code, Codex/GPT, Gemini), sus reglas están en [AGENTS.md](AGENTS.md).

## Flujo de ramas

- `main` es lo publicado: **cada push a `main` despliega el sitio** por SFTP. No trabajes
  directamente en `main`.
- Crea una rama por cambio (`fix/menu-movil`, `feat/nuevo-evento`, `docs/estado`), abre un pull
  request hacia `main` y fusiónalo solo después de la revisión y con las comprobaciones en verde.
- Para una versión nueva, sube `version` y `date` en `assets/js/core/version.js` y agrega la
  entrada en el [CHANGELOG](CHANGELOG.md).

## Antes de abrir un pull request

```sh
node tools/verify.mjs --write-precache  # si cambiaste HTML, CSS, JS, imágenes o datos
node tools/verify.mjs                   # debe terminar sin errores
```

- Borra antes cualquier copia extraída del paquete dentro del repositorio (por ejemplo
  `build/`): el verificador recorre todo el árbol.
- Prueba en un navegador las páginas afectadas: ambos temas, español e inglés, navegador y app
  instalada, teclado y movimiento reducido. Indica en el pull request qué no probaste.
- No envíes formularios reales ni cambies suscripciones al probar.
- Cada texto nuevo o modificado en español necesita su entrada en inglés
  ([arquitectura](docs/architecture.md), sección «Traducción»).
- Anota los pendientes y la evidencia en [docs/status.md](docs/status.md).

## Lo que no se toca

- La identidad del manifiesto: `id`, `scope`, `start_url` y `display`.
- `tools/verify.mjs`, idéntico al del proyecto hermano RIBBI; los ajustes propios van en
  `tools/verify.project.mjs`.
- Los archivos de `vendor/`: se reemplaza la versión completa, nunca se editan a mano
  ([desarrollo](docs/development.md)).
- Las claves de almacenamiento (`assets/js/core/storage.js`) sin revisar lectores y migración.
- Sin compilación, npm, scripts desde CDN ni scripts en línea; rutas siempre relativas.
- Los contratos de interfaz: navegación sin JS, teclado, `data-bs-theme`, `data-display`,
  movimiento reducido y áreas seguras ([DESIGN.md](DESIGN.md)).
- El despliegue: acciones fijadas por SHA, la revisión de contenido del paquete y
  `dangerous-clean-slate` apagado. Nunca subas credenciales ni datos personales; la
  configuración pública está en `assets/js/core/config.js`.
