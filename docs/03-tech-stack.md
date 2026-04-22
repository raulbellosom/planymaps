# 03 - Tech Stack

## Framework & Runtime

| Layer     | Choice                                                    |
| --------- | --------------------------------------------------------- |
| Framework | Next.js 16.2 (App Router)                                 |
| UI        | React 19 + Tailwind CSS 4                                 |
| Canvas    | react-konva / Konva 10                                    |
| State     | Zustand 5 (`board-store` persisted, `ui-store` transient) |
| Drag-drop | dnd-kit (layer panel only)                                |
| Backend   | Appwrite 24 (Auth, DB, Storage, Realtime, Functions)      |
| Maps      | Leaflet 1.9 + react-leaflet 5 (OpenStreetMap tiles)       |

## Map Layer Dependencies

| Package          | Version | Purpose                                 | License |
| ---------------- | ------- | --------------------------------------- | ------- |
| `leaflet`        | ^1.9.4  | Map rendering, tile management          | BSD-2   |
| `react-leaflet`  | ^5.0.0  | React bindings for Leaflet              | MIT     |
| `@types/leaflet` | ^1.9.0  | TypeScript type definitions (dev only)  | MIT     |

### Tile Providers

All tile providers are free (no API key required):

| Provider      | Source         | Max Zoom | Notes                                |
| ------------- | -------------- | -------- | ------------------------------------ |
| OSM (default) | OpenStreetMap  | 19       | Standard street map                  |
| Satellite     | ESRI ArcGIS    | 18       | Satellite imagery                    |
| Terrain       | OpenTopoMap    | 17       | Topographic / elevation map          |

### Integration Architecture

Leaflet renders as an HTML DOM layer **behind** the Konva `<Stage>`. The Konva canvas has a transparent background when in map mode, so the map tiles show through. All existing Konva tools (select, draw shapes, pins, images) continue working on the transparent overlay.

```
┌─────────────────────────────────────┐
│  Konva Stage (transparent overlay)  │  z-index: 1
│  - Shape drawing & selection        │
│  - Item transformers                │
│  - Multi-select drag rect           │
├─────────────────────────────────────┤
│  Leaflet MapContainer               │  z-index: 0
│  - OSM / Satellite / Terrain tiles  │
│  - Pan, zoom, click events          │
└─────────────────────────────────────┘
```

Viewport synchronization between the two layers is managed via callbacks and the Zustand ui-store.
