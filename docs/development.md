# Desarrollo y publicación

## Trabajo local

Sin `package.json`, instalación npm ni compilación. Sirve la raíz del proyecto por HTTP:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Abre <http://127.0.0.1:8000>. La PWA necesita HTTPS o un origen local confiable; `file://`
permite una vista parcial, sin service worker. Edita el HTML, el CSS y los módulos de la página
afectada; consulta [arquitectura](architecture.md), [diseño](../DESIGN.md) y la
[revisión visual](design-review.md).

## Nombres

- Código, carpetas e imágenes usan inglés, minúsculas y guiones. Los archivos con nombre de
  una persona, lugar o ministerio lo conservan (`leaders/adultos.webp`,
  `missionaries/panama.webp`).
- Los nombres estándar se mantienen: `README.md`, `CHANGELOG.md`, `CONTRIBUTING.md`,
  `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `PRODUCT.md`, `DESIGN.md`, `THIRD_PARTY_NOTICES.md`.
- Los nombres de origen se quedan como están en `vendor/` y en los skills instalados.
- Los textos de la interfaz están en español; cada texto nuevo o modificado necesita su entrada
  en inglés (sección «Traducción» de la [arquitectura](architecture.md)).

## Verificación y archivos generados

```sh
node tools/verify.mjs                   # solo comprueba, no escribe nada
node tools/verify.mjs --write-precache  # regenera service-worker/precache-manifest.js
node tools/verify.mjs --write-hashes    # actualiza los hashes de vendor/vendor.json (solo al cambiar vendor a propósito)
```

`tools/verify.mjs` es idéntico byte a byte en IBMty y RIBBI; los ajustes y comprobaciones
propios están en `tools/verify.project.mjs`. Recorre todo el árbol del proyecto, así que borra
cualquier copia extraída del paquete (por ejemplo `build/`) antes de ejecutarlo. Comprueba:

- el inventario de vendor: archivos declarados, licencias, integridad sha384 y que no haya
  archivos sin declarar;
- referencias locales con mayúsculas y minúsculas exactas en HTML, `url()` de CSS, rutas en JS,
  rutas dentro de `assets/data/*.json` y el manifiesto;
- las revisiones del precaché (falla si un archivo cambió desde el último `--write-precache`);
- el chrome repetido entre páginas (enlaces resueltos, comillas y espacios normalizados);
- la cobertura de la traducción: cada texto español del HTML estático necesita una entrada en
  inglés o en `keep`; las entradas que nadie usa se avisan;
- la sintaxis de JS y las comprobaciones del proyecto: orden y destinos de la navegación,
  cálculo de la cuenta regresiva del domingo, selección y actualización del último video,
  fragmentos de contenido mal formados, reversión e impresión de los paneles, que cada clase
  de Bootstrap e icono de Font Awesome en uso exista en las copias recortadas de
  `assets/css/core/`, y que todas las páginas enlacen las mismas hojas de `assets/css/core/` y
  `assets/css/components/`, en el mismo orden y sin que falte ninguna.

No comprueba el renderizado, los textos que los scripts generan en tiempo de ejecución, los
servicios externos ni los enlaces dentro del Markdown. Recorre los flujos afectados en un
navegador (ambos temas, ambos idiomas, navegador y app instalada) y anota navegador, tamaños y
resultados. No envíes formularios reales ni cambies suscripciones durante una revisión.

## Dependencias

### Reglas

1. Todo código, fuente o recurso de terceros que se publica vive en
   `vendor/<paquete>/<versión>/`, junto a su archivo de licencia.
2. Cada archivo de `vendor/` está declarado en `vendor/vendor.json` con su hash SRI
   (`sha384-…`). `tools/verify.mjs` falla ante un archivo sin declarar, un archivo alterado o un
   paquete sin licencia.
3. Los archivos de vendor nunca se editan a mano: para cambiar algo, se reemplaza la versión.
4. Los servicios remotos (no redistribuibles o ligados a un proveedor) se registran en
   `remote` con `"offline": false`.
5. Los recursos derivados (material de terceros copiado en el proyecto) se registran en
   `derived` con su atribución. Hoy la lista está vacía: las ilustraciones son geometría propia.

### Campos de `vendor/vendor.json`

| Campo | Significado |
| --- | --- |
| `name`, `version` | Forman la ruta `vendor/<name>/<version>/` |
| `license` | Identificador SPDX, o `LicenseRef-…` si no es estándar |
| `licenseFile` | Archivo de licencia dentro de la carpeta de la versión |
| `source`, `homepage` | Origen exacto de la descarga y proyecto |
| `notes` | Dependencias incluidas y condiciones especiales |
| `files` | Ruta relativa → hash SRI |

### Agregar o actualizar un paquete

1. Descarga los archivos de una versión fija (por ejemplo desde
   `https://cdn.jsdelivr.net/npm/<paquete>@<versión>/…`) en una carpeta nueva
   `vendor/<paquete>/<versión>/`, con su `LICENSE`. Si el paquete no trae una, crea `LICENSE.md`
   con el aviso y la URL de los términos (como en GSAP).
2. Agrega o actualiza la entrada en `vendor/vendor.json` con los hashes vacíos.
3. Actualiza las referencias en el HTML, `assets/css/core/fonts.css`, el precaché y cualquier
   otro consumidor. Borra la versión anterior cuando nada la use.
4. Actualiza los [avisos de terceros](../THIRD_PARTY_NOTICES.md) y, al preparar una versión,
   `assets/js/core/version.js`.
5. Ejecuta en orden `node tools/verify.mjs --write-hashes`, `node tools/verify.mjs
   --write-precache` y `node tools/verify.mjs`. El primero solo actualiza el inventario; no
   hace la verificación completa.

### Casos que requieren atención

- **GSAP** no es MIT: usa la licencia estándar «No Charge» de GSAP. Revísala antes de agregar
  plugins.
- **Font Awesome Free**: iconos CC BY 4.0, fuentes SIL OFL 1.1, código MIT; los iconos de
  marcas no otorgan derechos de marca.
- **OneSignal** usa una licencia MIT modificada ligada a su servicio; se queda remoto.
- **OpenStreetMap**: datos ODbL con atribución visible; la política de teselas prohíbe las
  descargas masivas (solo se guardan en caché las teselas vistas).
- **Fuentes** (OFL-1.1): conserva el texto de la licencia al redistribuirlas.
- Las fotos, logos y textos del sitio no están cubiertos por estas licencias; confirma los
  permisos antes de agregarlos a `assets/`.
- Los **skills de agentes** son herramientas de desarrollo, no parte del sitio; sus licencias
  se listan en los avisos y se conservan con cada copia.

## Publicar

1. Resuelve los puntos pertinentes del [estado](status.md); confirma contenido y configuración.
2. Sube `version` y `date` en `assets/js/core/version.js` (los nombres de caché y el aviso de
   actualización dependen de ellos), agrega la entrada en el [CHANGELOG](../CHANGELOG.md),
   regenera el precaché y ejecuta el verificador.
3. Empaqueta con una ruta de salida nueva, fuera del repositorio:

   ```sh
   sh tools/package.sh /ruta/absoluta/ibmty.tar.gz
   ```

   Ejecuta el verificador y empaqueta solo `.htaccess`, `index.html`, `pages/`, `app/`,
   `assets/`, `sw.js`, `service-worker/`, `manifest.webmanifest`, `robots.txt`, `vendor/` y
   `THIRD_PARTY_NOTICES.md`. Herramientas, documentación y carpetas de agentes se quedan fuera.
   No despliega.
4. Sirve por HTTPS con rutas relativas y el worker en la raíz del sitio (una subruta funciona).
   Después de publicar, comprueba instalación, actualización y recuperación sin conexión, y
   revisa las redirecciones de las rutas antiguas (abajo).
5. Con el contenido aprobado, revisa `robots.txt`, `noindex`, el sitemap y las URL públicas. No
   habilites la indexación solo porque el verificador pasa.

### Despliegue por SFTP

Cada push a `main` ejecuta [deploy.yml](../.github/workflows/deploy.yml): `node tools/verify.mjs`;
`tools/package.sh` hacia la carpeta temporal del runner; extracción en `build/site/`; una
revisión del contenido, que falla si el paquete trae `docs/`, `tools/`, carpetas de agentes,
`.github/`, Markdown que no sea un aviso de licencia o `.DS_Store`, o si le falta `.htaccess`;
y por último `lftp` (de los repositorios de Ubuntu, sin acciones de terceros) sube `build/site/`
por SFTP. Solo agrega o actualiza archivos: lo que se quite del sitio se borra a mano en el
servidor.

- Secretos del repositorio: `FTP_SERVER`, `FTP_USERNAME` y `FTP_PASSWORD`. Variable del
  repositorio: `FTP_SERVER_DIR` (carpeta remota terminada en `/`). Nunca subas credenciales.
- Usa SFTP (SSH, puerto 22): credenciales y archivos viajan cifrados. El hosting debe aceptar
  SFTP con usuario y contraseña. La clave del servidor se acepta en el primer contacto
  (`sftp:auto-confirm`); para fijarla habría que guardar su huella como secreto.
- `.htaccess` responde 404 a los archivos que empiezan con punto, así que no se sirven.
- `.htaccess` redirige HTTP a `https://www.ibmty.com` (el dominio del aviso de privacidad),
  envía cabeceras de seguridad y una CSP en modo solo informe. Si el hosting responde 500,
  quita su línea `Options`. Pasa la CSP a obligatoria (`Content-Security-Policy`) después de
  revisar la consola en cada página; agrega los dominios de GA4 u OneSignal antes de activar
  esas funciones.

### Rutas antiguas

Mapeo propuesto a partir de la documentación del sitio anterior. No hay redirecciones en el
servidor: confirma las URL públicas y los fragmentos antes de publicar, sin cambiar la identidad
de la [PWA](offline-pwa.md).

| Ruta histórica | Destino actual |
| --- | --- |
| `nosotros.html` | `pages/about.html` |
| `salvacion.html` | `pages/salvation.html` |
| `donativo.html` | `pages/donate.html` |
| `privacidad.html` | `pages/privacy.html` |
| `settings.html` | `app/settings.html` |
| `splash.html` | `app/splash.html` |
| `offline.html` | `app/offline.html` |
| `pages/events.html`, `pages/messages.html` | `index.html#eventos`, `index.html#transmision` |
| `pages/ministries.html`, `pages/missions.html`, `pages/contact.html` | `pages/about.html#ministerios`, `#misiones`, `#contacto` |

## Skills de agentes

IBMty y RIBBI tienen instalado el mismo conjunto de skills (ver `skills-lock.json`):

- `.agents/skills/<nombre>/`: copias reales, que leen Codex y Gemini CLI.
- `.claude/skills/<nombre>`: enlaces a esas copias para Claude Code; Impeccable tiene ahí su
  propio adaptador para Claude, y sus subagentes viven en `.claude/agents/`.
- `AGENTS.md` es el archivo de instrucciones compartido; `CLAUDE.md` y `GEMINI.md` lo importan.

`skills-lock.json` registra el repositorio de origen de cada skill, el commit (`ref`), la ruta y
un hash del contenido (sha256 sobre la lista ordenada de la ruta y el sha256 de cada archivo).
Para actualizar, descarga los repositorios de origen, reinstala cada skill desde el mismo commit
en ambos proyectos y actualiza el lock; conserva los `LICENSE`/`NOTICE` de origen con cada copia.
`laws-of-ux-design` es un skill local sin origen: consérvalo desde un respaldo. Los skills son
herramientas de desarrollo; el sitio no los necesita.

Para buscar un skill que no está instalado, usa el catálogo
[VoltAgent/awesome-agent-skills](https://github.com/VoltAgent/awesome-agent-skills) (solo como
referencia: es una lista de enlaces, no un skill, así que no se instala nada de ahí). Un skill
elegido ahí se instala en ambos proyectos con el mismo método y se registra en
`skills-lock.json`.
