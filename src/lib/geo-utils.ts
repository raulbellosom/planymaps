/**
 * Geo Utilities
 * Pure functions for coordinate projection, formatting, and tile provider URLs.
 * Uses Web Mercator (EPSG:3857) projection, consistent with Leaflet's default.
 */

import type { TileProvider } from "@/types/board";

// ── Tile Provider URLs ─────────────────────────────────────────────────────────

const TILE_PROVIDERS: Record<TileProvider, { url: string; attribution: string; maxZoom: number }> = {
  osm: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution:
      '&copy; <a href="https://www.esri.com/">Esri</a> — Source: Esri, Maxar, Earthstar Geographics',
    maxZoom: 18,
  },
  terrain: {
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
    maxZoom: 17,
  },
};

export function getTileConfig(provider: TileProvider) {
  return TILE_PROVIDERS[provider] ?? TILE_PROVIDERS.osm;
}

// ── Web Mercator Projection ────────────────────────────────────────────────────

const TILE_SIZE = 256;

/**
 * Convert lat/lng to pixel position at a given zoom level (world pixel coords).
 * Origin (0, 0) is at the top-left of the world map.
 */
export function latLngToPixel(
  lat: number,
  lng: number,
  zoom: number,
): { x: number; y: number } {
  const scale = Math.pow(2, zoom) * TILE_SIZE;
  const x = ((lng + 180) / 360) * scale;
  const latRad = (lat * Math.PI) / 180;
  const y =
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
    scale;
  return { x, y };
}

/**
 * Convert pixel position back to lat/lng at a given zoom level.
 */
export function pixelToLatLng(
  px: number,
  py: number,
  zoom: number,
): { lat: number; lng: number } {
  const scale = Math.pow(2, zoom) * TILE_SIZE;
  const lng = (px / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * py) / scale;
  const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return { lat, lng };
}

/**
 * Convert lat/lng to a pixel offset relative to a given center at a zoom level.
 * Returns canvas-space coordinates where the center maps to (0, 0).
 */
export function latLngToCanvasOffset(
  lat: number,
  lng: number,
  centerLat: number,
  centerLng: number,
  zoom: number,
): { x: number; y: number } {
  const target = latLngToPixel(lat, lng, zoom);
  const center = latLngToPixel(centerLat, centerLng, zoom);
  return {
    x: target.x - center.x,
    y: target.y - center.y,
  };
}

/**
 * Convert a canvas-space offset (relative to center) back to lat/lng.
 */
export function canvasOffsetToLatLng(
  offsetX: number,
  offsetY: number,
  centerLat: number,
  centerLng: number,
  zoom: number,
): { lat: number; lng: number } {
  const center = latLngToPixel(centerLat, centerLng, zoom);
  return pixelToLatLng(center.x + offsetX, center.y + offsetY, zoom);
}

// ── Coordinate Formatting ──────────────────────────────────────────────────────

export type CoordinateFormat = "dd" | "dms" | "ddm";

/**
 * Format a coordinate pair according to the chosen format.
 */
export function formatCoordinate(
  lat: number,
  lng: number,
  format: CoordinateFormat = "dd",
): string {
  switch (format) {
    case "dd":
      return `${lat.toFixed(6)}°, ${lng.toFixed(6)}°`;
    case "dms":
      return `${toDMS(lat, "NS")}, ${toDMS(lng, "EW")}`;
    case "ddm":
      return `${toDDM(lat, "NS")}, ${toDDM(lng, "EW")}`;
    default:
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
}

function toDMS(decimal: number, directions: "NS" | "EW"): string {
  const abs = Math.abs(decimal);
  const d = Math.floor(abs);
  const mFloat = (abs - d) * 60;
  const m = Math.floor(mFloat);
  const s = ((mFloat - m) * 60).toFixed(1);
  const dir = decimal >= 0 ? directions[0] : directions[1];
  return `${d}°${m}'${s}"${dir}`;
}

function toDDM(decimal: number, directions: "NS" | "EW"): string {
  const abs = Math.abs(decimal);
  const d = Math.floor(abs);
  const m = ((abs - d) * 60).toFixed(4);
  const dir = decimal >= 0 ? directions[0] : directions[1];
  return `${d}°${m}'${dir}`;
}

// ── Zoom helpers ───────────────────────────────────────────────────────────────

/** Clamp zoom to Leaflet-safe range */
export function clampZoom(zoom: number, min = 1, max = 19): number {
  return Math.max(min, Math.min(max, zoom));
}

/**
 * Convert Leaflet zoom to a Konva-compatible scale factor.
 * We pick a "reference zoom" and express scale relative to it.
 */
export function leafletZoomToKonvaScale(
  zoom: number,
  referenceZoom: number,
): number {
  return Math.pow(2, zoom - referenceZoom);
}

/**
 * Convert a Konva scale back to the equivalent Leaflet zoom.
 */
export function konvaScaleToLeafletZoom(
  scale: number,
  referenceZoom: number,
): number {
  return referenceZoom + Math.log2(scale);
}
