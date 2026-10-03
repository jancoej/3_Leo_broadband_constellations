# Commercial LEO Constellations — Cesium + OpenStreetMap

This build uses OpenStreetMap raster tiles directly as the Cesium base layer.

## Files

```text
commercial-leo-constellations-cesium-v6-osm-working/
├── index.html
├── style.css
├── script.js
├── script-code.txt
└── README.md
```

## GitHub Pages

Upload `index.html`, `style.css`, and `script.js` to the repository root.

No Cesium ion token is required.

The page downloads:
- CesiumJS from jsDelivr
- OpenStreetMap tiles from `tile.openstreetmap.org`

The globe itself uses Cesium's ellipsoid terrain.


## Version 7 — Earth occlusion

Satellite markers and their labels now use normal depth testing. Satellites located on the far side of the Earth are therefore hidden by the globe instead of being visible through it.

Cesium globe depth testing is also enabled.
