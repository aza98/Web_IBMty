# Revisión visual

## Antes de cambiar una pantalla

Lee [producto](../PRODUCT.md), [diseño](../DESIGN.md), el HTML afectado, sus estilos y los
módulos que controlan sus estados. Los valores ejecutables están en
[tokens.css](../assets/css/core/tokens.css); no crees otro sistema de colores ni de medidas.
Conserva el texto en español y los datos confirmados, y agrega la entrada en inglés de todo
texto nuevo.

## Criterios

- Diseña primero el flujo en una columna, sin anchos que desborden. Imágenes fluidas, controles
  que se acomodan y ancho de lectura acotado.
- Reutiliza los tokens de espaciado, tipografía, radios, foco y estados. Las áreas seguras y la
  navegación fija no deben tapar contenido ni acciones.
- Distingue la app instalada del ancho de pantalla. El tema usa `data-bs-theme`, no el antiguo
  `data-theme`.
- Conserva el uso con teclado, el foco visible, las etiquetas, los mensajes de error y los
  estados ARIA. Comprueba objetivos táctiles de al menos 44 px y el área real que se puede
  pulsar.
- Usa iconos funcionales de Font Awesome y conserva los nombres accesibles. Las llamadas a la
  acción de cada sección deben caber en el móvil y ocupar todo el ancho cuando convenga.
- Respeta el movimiento reducido y el contenido disponible sin bibliotecas. Evita que CSS y GSAP
  controlen la misma propiedad a la vez.
- Revisa la navegación y el pie compartidos en cada página afectada (`tools/verify.mjs` compara
  las copias). No deduzcas accesibilidad completa por la presencia de ARIA.
- Revisa la versión en inglés: las etiquetas más largas deben acomodarse sin romper los
  controles.
- Valida pensando en estas situaciones, que no son perfiles investigados: alguien que visita por
  primera vez, un miembro habitual, alguien con poca experiencia digital, quien necesita texto
  grande o tecnología de apoyo, una persona que usa una mano o a la que interrumpen, quien lee
  en inglés y quien no tiene WhatsApp o una conexión estable. No deduzcas necesidades por la
  edad.

## Contraste de botones primarios

Los botones primarios usan `#14110E` sobre `#00C0F6`; al pasar el cursor, blanco sobre
`#006E92` (`--stone-950`, `--cyan-500` y `--cyan-700` en tokens.css). Comprueba los estados normal, foco,
cursor encima y activo en ambos temas. Esto sustituye la antigua excepción de blanco sobre cian
brillante (2.13:1), que ya no es el contrato de los botones ni una declaración de cumplimiento.

## Matriz de revisión

Todas las medidas son píxeles CSS del viewport, no resolución física.

| Caso | Tamaños |
| --- | --- |
| Móvil base | 360 y 375 px |
| Acomodo de texto y navegación | 320, 390, 393 y 402 px cuando el cambio afecta el acomodo |
| Tableta | 768 y 820 px |
| Tableta grande / escritorio compacto | 1024 px |
| Escritorio | 1200 px |
| Escritorio amplio | 1920 × 1080 px |

Usa 768, 1024 y 1200 como niveles para trabajo nuevo cuando el contenido los necesite; 1024 no
es el punto de corte `lg` de Bootstrap. No reemplaces de forma global los umbrales existentes.
Revisa ambos lados de cada punto de corte modificado, la orientación cuando afecte a controles
fijos y las ventanas estrechas en la app instalada.

Revisa ambos temas, ambos idiomas, textos largos, estados vacío, cargando, error y éxito,
navegación con teclado, imágenes faltantes, movimiento reducido y sin JS cuando aplique. En los
cambios de la PWA incluye la barra de pestañas y las áreas seguras.

Anota navegador, modo, tamaños y flujos revisados, junto con los pendientes, en el
[estado](status.md). Leer el CSS no es una prueba visual ni de instalación.
