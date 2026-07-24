<div align="center">

# IBMty

**Sitio web oficial y aplicación web instalable (PWA) de la Iglesia Bautista de Monterrey.**

![Versión](https://img.shields.io/badge/Versi%C3%B3n-7.0.0-0F172A?style=flat-square&logo=git&logoColor=10B981)
![HTML5](https://img.shields.io/badge/HTML5-0F172A?style=flat-square&logo=html5&logoColor=10B981)
![CSS3](https://img.shields.io/badge/CSS3-0F172A?style=flat-square&logo=css3&logoColor=10B981)
![JavaScript](https://img.shields.io/badge/JavaScript-0F172A?style=flat-square&logo=javascript&logoColor=10B981)
![Bootstrap](https://img.shields.io/badge/Bootstrap_5-0F172A?style=flat-square&logo=bootstrap&logoColor=10B981)
![PWA](https://img.shields.io/badge/PWA-Ready-0F172A?style=flat-square&logo=pwa&logoColor=10B981)

</div>

<br>

## Descripción General

**IBMty** es el sitio web oficial de la **Iglesia Bautista de Monterrey**, ubicada en Monterrey, Nuevo León, México. Además de funcionar como una página web accesible desde cualquier navegador, está desarrollada como una **Aplicación Web Progresiva (PWA)** instalable.

Esto permite una doble experiencia de usuario:
- **Para miembros y asistentes:** Posibilidad de instalar la web en su dispositivo móvil o computadora para usarla como una aplicación nativa, con soporte sin conexión a internet (*offline*), notificaciones push y ajustes personalizados.
- **Para visitantes habituales:** Acceso rápido a horarios, ubicación, doctrina, historia, ministerios, plan de salvación, donativos y aviso de privacidad.

El proyecto está construido de forma estática (sin necesidad de Node.js, gestores de paquetes o procesos de compilación), facilitando su mantenimiento y rápida carga. La versión actual de la aplicación es **7.0.0** (mantenida en sincronía entre `config/config.js` y `sw.js`).

---

## Páginas y Funcionalidades

### Estructura de Páginas

| Página | Archivo | Descripción |
| :--- | :--- | :--- |
| **Inicio** | `index.html` | Portada principal con carrusel de eventos y transmisión en vivo. |
| **Nosotros** | `nosotros.html` | Misión, visión, valores, historia, líderes y mapa misionero. |
| **Salvación** | `salvacion.html` | Presentación del evangelio paso a paso con modal de oración. |
| **Donativos** | `donativo.html` | Información bancaria para diezmos y ofrendas con botón de copiado. |
| **Privacidad** | `privacidad.html` | Aviso de privacidad y políticas de protección de datos. |
| **Configuración** | `settings.html` | Opciones de notificaciones, tema visual y preferencia de la app. |
| **Bienvenida** | `splash.html` | Pantalla de transición al abrir la aplicación instalada. |
| **Sin Conexión** | `offline.html` | Pantalla que se muestra automáticamente al navegar sin internet. |

### Funcionalidades Destacadas

- **PWA e Integración Offline:** Precaché con Workbox, navegación orientada a red con respaldo *offline*, aviso de actualización de la app y soporte de tema claro/oscuro.
- **Transmisión de YouTube en Vivo:** Widget dinámico que detecta transmisiones en vivo del canal de la iglesia y muestra una cuenta regresiva para el próximo servicio cuando no hay emisión activa.
- **Mapa Interactivo Misionero:** Mapa mundial interactivo desarrollado con la librería Leaflet para visualizar las familias misioneras apoyadas.
- **Notificaciones Push:** Integración con OneSignal para el envío de avisos y notificaciones en dispositivos con la app instalada.
- **Carruseles e Integración Nativa:** Carruseles de eventos y liderazgo, integración con la API nativa de compartir (*Web Share*) y Google Analytics condicionado al consentimiento de cookies.
- **Diseño Adaptativo:** Metadatos de instalación optimizados para PWA y Safari/WebKit con diseño adaptado a áreas seguras (*safe-area*) en dispositivos móviles (verificaciones adicionales registradas en `CONTEXT.md`).

---

## Requisitos del Sistema

Para trabajar en el sitio o ejecutarlo localmente **no se requieren herramientas técnicas complejas**:

- **Navegador web moderno** (Chrome, Firefox, Safari, Edge).
- **Servidor local para archivos estáticos** (necesario únicamente porque los Service Workers de PWA requieren un origen HTTP/HTTPS y no funcionan abriendo archivos directamente mediante `file://`).

---

## Ejecución Local

Para probar el sitio en tu computadora:

1. Abre una terminal en la carpeta del proyecto.
2. Inicia un servidor estático local con cualquiera de estas opciones:

```bash
# Opción 1: Con Python 3 (disponible en la mayoría de los sistemas)
python3 -m http.server 8080
```

```bash
# Opción 2: Con Node.js (si está instalado en tu equipo)
npx serve .
```

3. Ingresa desde tu navegador a la dirección: `http://localhost:8080`

---

## Estructura del Proyecto

```
*.html                       # Páginas principales, pantalla de bienvenida y aviso sin conexión
config/config.js             # Configuración global APP_CONFIG y versión de la aplicación
css/main.css                 # Estilos globales y biblioteca de componentes compartidos
css/components/carousel.css  # Estilos para carruseles de eventos y liderazgo
css/pages/*.css              # Estilos específicos de cada página
js/main.js                   # Lógica global, formularios, compartir e instalación/actualización PWA
js/components/               # Componentes: animaciones, carruseles, mapa, push y widget de YouTube
js/pages/, js/utils/         # Comportamiento por página y analítica sujeta a consentimiento
js/pwa-launch.js             # Verificación de pantalla de inicio al abrir la app instalada
assets/                      # Fuentes, iconos, imágenes y capturas PWA
gsap-public/, leaflet/, workbox/ # Librerías externas alojadas localmente
sw.js, manifest.json         # Service Worker, precaché y manifiesto de la PWA
.github/workflows/           # Flujo de trabajo para despliegue automático a producción
```

*Nota de arquitectura:* El código JavaScript utiliza scripts globales tradicionales (no módulos ES). El orden de carga `<script defer>` en los archivos HTML determina el árbol de dependencias.

---

## Verificación antes del Despliegue

Antes de subir cambios al servidor, realiza las siguientes comprobaciones:

1. **Validación de sintaxis:** Ejecutar `node --check` en los archivos dentro de `js/` y en `sw.js`.
2. **Prueba visual:** Iniciar el servidor local y revisar todas las páginas tanto en pantallas de escritorio como en móviles.
3. **Caché del Service Worker:** Confirmar que el Service Worker se instala correctamente sin errores de descarga y que todos los archivos definidos en `PRECACHE_URLS` existen.
4. **Notificaciones y Actualizaciones en Producción:** Probar el flujo de notificaciones OneSignal y actualización del Service Worker directamente en `https://www.ibmty.com` (la aplicación de OneSignal rechaza intencionalmente `localhost`).

---

## Despliegue

El proceso de despliegue es **completamente automático**:

Al realizar un `push` a la rama `main`, **GitHub Actions** ejecuta el flujo de trabajo (`.github/workflows/main.yml`) y sincroniza los archivos con el servidor de producción vía FTP. No requiere intervención manual.
