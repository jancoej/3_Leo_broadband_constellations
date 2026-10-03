# Commercial LEO Constellations — Cesium Visual Simulator (Build V4)

This build fixes the missing-Earth problem by using a **local Earth texture** (`earth_texture.png`) instead of depending on Cesium ion, Bing Maps, or OpenStreetMap imagery.

## Files

```text
commercial-leo-constellations-cesium-v4-local-earth/
├── index.html
├── style.css
├── script.js
├── earth_texture.png
└── README.md
```

## GitHub Pages

Upload all files to the repository root. In particular, `earth_texture.png` must be next to `index.html` and `script.js`.

After GitHub Pages deploys, the map should show the status:

`EARTH READY · LOCAL TEXTURE`

The page header also shows `BUILD V4` so you can immediately verify that GitHub is serving this version.

## Why this fixes the problem

CesiumJS itself still loads from jsDelivr, but the Earth imagery is now a file inside the repository. Therefore the planet does not depend on an external map provider or Cesium ion token.
