# Comparación ZRC Montaña Caucana

Visor cartográfico en HTML, CSS, JavaScript y Leaflet. Compara cuatro escenarios: zonificación de referencia de la ZRC, polígono ANT 2022, traslapes 2025 y polígono ANT 2025. Incluye una visualización opcional de diferencias geométricas entre ANT 2022 y ANT 2025.

## Funcionalidades

- Cuatro mapas sincronizados; opción de mapa único.
- Selección individual de escenarios por panel.
- Consulta de polígonos por clic y búsqueda de veredas.
- Fondos de imagen satelital Esri World Imagery u OpenStreetMap (requieren conexión y se sujetan a las condiciones de sus proveedores).
- Capas territoriales y de contexto: límites municipales y veredales, reserva forestal, solicitudes indígenas, resguardos formalizados.
- Datos GeoJSON estáticos, sin dependencias de la cuenta ArcGIS Online original para las capas vectoriales.

## Publicación en GitHub Pages

Los archivos de este directorio se deben subir **a la raíz** de un repositorio público, no dentro de una subcarpeta.

1. En el repositorio: **Settings → Pages**.
2. En **Build and deployment**, elegir **Deploy from a branch**.
3. Seleccionar **main** y **/(root)**; guardar.
4. El sitio aparecerá en `https://<usuario>.github.io/<repositorio>/`.

No es necesario ejecutar Python, instalar librerías ni crear claves de ArcGIS. En GitHub Pages el visor lee `data/datos_integrados.js`, que incluye las capas simplificadas. Los archivos `.geojson` se conservan también como fuente cartográfica descargable, con los atributos reducidos para el visor.

## Estructura

```text
index.html
.nojekyll
README.md
css/estilos.css
js/visor.js
data/datos_integrados.js
data/ant_2022.geojson
/data/...  (resto de capas GeoJSON)
data/resumen.json
```

## Precauciones de interpretación

- **ZRC Polígono original** se representa con una capa alternativa de 83 registros del respaldo `ZRC_MC`. No está comprobada su correspondencia exacta con el mapa original, cuyo servicio no se recuperó completamente.
- Los polígonos y las áreas del visor son representaciones de los respaldos y no una acreditación de límites, vigencia normativa ni estado jurídico de territorios.
- Las áreas ANT 2022 y 2025 mostradas arriba provienen de los **atributos** de sus fuentes. Las incorporaciones y exclusiones se calcularon por diferencia geométrica en una proyección métrica, por lo que no deben confundirse con el cambio neto reportado.
- Los territorios indígenas que aparecen cerca del polígono ANT 2025 no necesariamente se intersectan con él; el visor diferencia ambos casos.
- Los datos geográficos del repositorio son públicamente descargables. Verificar derechos de uso, atribuciones y permisos de publicación antes de difundir.

## Licencia

No se asigna licencia de reutilización al código ni a los datos hasta que sus titulares definan sus condiciones. La publicación no implica renuncia de derechos.

## Identidad visual para este visor

Edición **Atlas Índigo**: interfaz con azul noche, blanco cálido, lavanda y coral. Es una identidad diferente de la utilizada en el visor UAF; los colores temáticos de las capas geográficas se conservan para no alterar su interpretación y sus leyendas. No se han cambiado datos, cálculos, eventos de Leaflet ni filtros.
