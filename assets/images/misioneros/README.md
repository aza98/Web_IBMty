# Imágenes de misioneros

Fotografías de las familias misioneras que se muestran en la tarjeta del popup
del mapa de `nosotros.html` (sección **Misioneros**). Se referencian desde el
array `MISSIONARIES` en `js/components/missionaries-map.js`.

- **Relación de aspecto de origen: 965 × 1080** (vertical). La tarjeta usa
  `aspect-ratio: 965/1080` + `object-fit: cover`, así que con ese tamaño la foto
  llena la caja sin recorte ni deformación.
- Formato actual: **JPG**. Mantén la proporción vertical.
- Las imágenes **no** se precachean en `sw.js` (van por la estrategia runtime
  `images-cache`, como el resto de fotografías del sitio).

## Mapeo archivo → familia

| Archivo | Familia / persona | Ubicación |
|---|---|---|
| `Misioneros_Mexico_1.jpg` | Felipe Castaño | México |
| `Misioneros_Mexico_2.jpg` | Dávila Munguía | Monterrey, México |
| `Misioneros_EU.jpg` | Gómez | TX, Estados Unidos |
| `Misioneros_Panama.jpg` | Arreola Valente | Panamá |
| `Misioneros_RepDom.jpg` | Barbosa Ramírez | República Dominicana |
| `Misioneros_España_1.jpg` | Zamarrón Carmona | Sevilla, España |
| `Misioneros_España_2.jpg` | Zamarrón López | Sevilla, España |
| `Misioneros_España_3.jpg` | Belenguer Puente | Sevilla, España |
| `Misioneros_España_4.jpg` | Yeni Chaires Rodríguez | Sevilla, España |
| `Misioneros_Eslovakia.jpg` | Loredana Rodríguez Sarmiento | Eslovaquia |
| `Misioneros_Australia.jpg` | Brown Karam | Sydney, Australia |

> El orden dentro de México (×2) y Sevilla (×4) se asignó por nombre de archivo;
> si alguna foto no corresponde a la familia, intercambia las rutas `image` en
> `MISSIONARIES`. Si el servidor de producción tuviera problemas con el carácter
> `ñ` de los archivos `España`, renómbralos (p. ej. `Misioneros_Espana_1.jpg`) y
> actualiza las rutas en el array.
