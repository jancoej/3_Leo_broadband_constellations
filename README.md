# Commercial LEO Constellations — Cesium Visual Simulator

Interactive GitHub Pages simulator that recreates the uploaded commercial LEO broadband constellation comparison as a Cesium visualization.

## Files

```text
commercial-leo-constellations-cesium/
├── index.html
├── style.css
├── script.js
├── script-code.txt
└── README.md
```

## Features

- Cesium globe
- Interactive visualization of:
  - Starlink
  - Eutelsat OneWeb
  - Amazon Leo
  - Lightspeed
  - Guowang / Qianfan
- Visual modes:
  - In orbit (2026)
  - Target 2027
  - Long-term target
- Clickable constellation markers
- Constellation inspector showing:
  - operator
  - country
  - altitude
  - frequency
  - latency
  - current fleet
  - 2027 target
  - long-term target
  - status
- Representative orbit planes
- Representative satellite markers using compressed scaling
- Nominal coverage footprints
- Comparison chart for fleet size, altitude, and latency
- Recreated source table at the bottom

## Important visualization note

The uploaded table does not provide orbital inclination, plane count, RAAN, or exact shell architecture. Therefore the orbit planes are illustrative and are used only to make the tabular comparison easier to understand visually. Satellite markers are compressed and are not one marker per real spacecraft.

## GitHub Pages

Upload the files to the repository root and configure:

- Source: Deploy from a branch
- Branch: main
- Folder: /(root)
