# Commercial LEO Constellations — Cesium Visual Simulator (Build V5)

This version uses **OpenStreetMap** as the primary Cesium basemap.

## Files

```text
commercial-leo-constellations-cesium-v5-osm/
├── index.html
├── style.css
├── script.js
├── earth_texture.png
└── README.md
```

## Mapping stack

- CesiumJS: 3D globe and orbit visualization
- OpenStreetMap: primary basemap
- `earth_texture.png`: local fallback if OSM tiles are unavailable

No Cesium ion token is required.

## GitHub Pages

Upload all files to the repository root, including `earth_texture.png`.

When the deployment is correct, the page header shows:

`BUILD V5 · OSM`

and the map status shows:

`EARTH READY · OPENSTREETMAP`

A button is also available to hide/show the OpenStreetMap layer.
