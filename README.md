<div align="center">

<img src="assets/icons/app/icon-192.png" alt="Logotipo de IBMty" width="96" height="96">

# IBMty

**Sitio web y app instalable (PWA) de la Iglesia Bautista de Monterrey**

*Una iglesia que piensa en ti*

![HTML](https://img.shields.io/badge/HTML%20%C2%B7%20CSS%20%C2%B7%20JS-00c0f6?style=flat-square&labelColor=1c1917)
![PWA](https://img.shields.io/badge/PWA-instalable-006e92?style=flat-square&labelColor=1c1917)
![Sin build](https://img.shields.io/badge/build-ninguno-00c0f6?style=flat-square&labelColor=1c1917)
![Idiomas](https://img.shields.io/badge/idiomas-es%20%7C%20en-006e92?style=flat-square&labelColor=1c1917)

[Inicio rápido](#inicio-rápido) · [Estructura](#estructura) · [Verificar](#verificar) · [Documentación](#documentación)

</div>

---

## Qué es

Próximos eventos, transmisión en vivo, ministerios y misiones, camino de salvación,
donativos y aviso de privacidad. Textos en español, con traducción al inglés desde Ajustes.

|  |  |
| --- | --- |
| **Stack** | HTML, CSS y JavaScript clásico. Sin npm, sin compilación, sin backend propio |
| **Offline** | Service worker con precaché y página de recuperación |
| **Dependencias** | Locales en `vendor/`, con licencias y hashes |
| **Versión** | [version.js](assets/js/core/version.js) · [CHANGELOG](CHANGELOG.md) |

## Inicio rápido

```sh
git clone <url-del-repositorio>
cd Web_IBMty
python3 -m http.server 8000 --bind 127.0.0.1
```

Abre <http://127.0.0.1:8000>. La PWA necesita HTTPS o un origen local confiable; con `file://`
la vista es parcial y sin service worker.

> [!NOTE]
> Los servicios externos (analítica, notificaciones, formularios, YouTube) arrancan
> desactivados hasta que completes los valores de [config.js](assets/js/core/config.js).
> Nunca pongas secretos en ese archivo: se sirve a los navegadores.

## Estructura

```text
index.html, pages/        Inicio y páginas del sitio
app/                      Splash, recuperación sin conexión y ajustes
assets/css/, assets/js/   Estilos y comportamiento: núcleo, componentes, páginas
assets/data/              Eventos, ministerios y misioneros (JSON)
sw.js, service-worker/    PWA
vendor/                   Dependencias de terceros, versionadas
tools/                    Verificador y empaquetado
docs/                     Documentación técnica
```

## Verificar

Requiere Node.js 18 o posterior, solo para desarrollo.

```sh
node tools/verify.mjs                   # comprobaciones, sin escribir archivos
node tools/verify.mjs --write-precache  # tras cambiar recursos del sitio
```

El verificador no sustituye una prueba en el navegador. Más en [desarrollo](docs/development.md).

## Despliegue

Cada push a `main` ejecuta [deploy.yml](.github/workflows/deploy.yml): verifica, empaqueta y
publica por SFTP. Las credenciales viven solo en los secretos de GitHub, nunca en el repositorio.
Tratar un merge a `main` como un lanzamiento.

## Documentación

| Necesito… | Documento |
| --- | --- |
| Contribuir | [CONTRIBUTING](CONTRIBUTING.md) |
| Ver qué falta | [Estado](docs/status.md) |
| Entender el código y traducir | [Arquitectura](docs/architecture.md) |
| Cambiar, verificar y publicar | [Desarrollo](docs/development.md) |
| Caché, instalación y actualizaciones | [Sin conexión y PWA](docs/offline-pwa.md) |
| Diseño y audiencia | [DESIGN](DESIGN.md) · [PRODUCT](PRODUCT.md) |
| Licencias de terceros | [Avisos](THIRD_PARTY_NOTICES.md) |
| Trabajar con agentes de IA | [AGENTS](AGENTS.md) |
