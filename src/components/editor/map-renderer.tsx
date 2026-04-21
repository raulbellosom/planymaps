/**
 * MapRenderer Component
 * Renders a map background for geo-aware boards
 *
 * This is a foundation component that abstracts the map rendering library.
 * Currently uses a placeholder - a real map library (Leaflet, Mapbox, etc.)
 * should be integrated later.
 *
 * Architecture:
 * - MapRenderer handles only the map background rendering
 * - Pins are rendered as an overlay layer on top of the map
 * - The editor canvas is not used in map mode - pins are positioned by GPS coords
 */

import { useEffect, useRef, useState } from "react";
import type { Board, BoardItem, Layer } from "@/types/board";
import { parseContentProps } from "@/types/board";
import { useBoardStore } from "@/stores/board-store";
import { useUIStore } from "@/stores/ui-store";

export interface MapRendererProps {
  board: Board;
  layers: Layer[];
  width: number;
  height: number;
}

// Default map center (can be overridden by board settings)
const DEFAULT_CENTER: [number, number] = [0, 0];
const DEFAULT_ZOOM = 2;

interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label: string;
  note: string;
}

/**
 * Extract GPS coordinates from items that have them
 */
function extractGpsItems(items: BoardItem[]): MapMarker[] {
  const markers: MapMarker[] = [];

  for (const item of items) {
    if (item.type !== "pin") continue;

    const content = parseContentProps(item);
    if (content.gpsLat !== undefined && content.gpsLng !== undefined) {
      markers.push({
        id: item.$id,
        lat: content.gpsLat,
        lng: content.gpsLng,
        label: content.label || "Pin",
        note: content.note || "",
      });
    }
  }

  return markers;
}

/**
 * Convert GPS coordinates to pixel position on the map
 * This is a simplified conversion - real implementations would use
 * proper map projection libraries
 */
function gpsToPixel(
  lat: number,
  lng: number,
  center: [number, number],
  zoom: number,
  mapWidth: number,
  mapHeight: number,
): { x: number; y: number } {
  // Simplified Mercator projection approximation
  const scale = Math.pow(2, zoom) * 100;

  const x = mapWidth / 2 + (lng - center[1]) * scale;
  const y = mapHeight / 2 - (lat - center[0]) * scale;

  return { x, y };
}

/**
 * Placeholder map background - renders a simple grid
 * Real implementation would use Leaflet, Mapbox, or Google Maps
 */
function PlaceholderMapBackground({
  width,
  height,
}: {
  width: number;
  height: number;
}) {
  return (
    <div
      className="absolute inset-0 bg-gradient-to-br from-blue-100 to-blue-200"
      style={{ width, height }}
    >
      {/* Grid pattern to indicate map-like surface */}
      <svg width={width} height={height} className="absolute inset-0">
        {/* Horizontal lines */}
        {Array.from({ length: Math.ceil(height / 50) + 1 }).map((_, i) => (
          <line
            key={`h-${i}`}
            x1={0}
            y1={i * 50}
            x2={width}
            y2={i * 50}
            stroke="#93c5fd"
            strokeWidth={1}
            opacity={0.5}
          />
        ))}
        {/* Vertical lines */}
        {Array.from({ length: Math.ceil(width / 50) + 1 }).map((_, i) => (
          <line
            key={`v-${i}`}
            x1={i * 50}
            y1={0}
            x2={i * 50}
            y2={height}
            stroke="#93c5fd"
            strokeWidth={1}
            opacity={0.5}
          />
        ))}
      </svg>
      {/* Map label */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-white/80 px-4 py-2 rounded-lg text-gray-600 text-sm">
          Map background (placeholder)
        </div>
      </div>
    </div>
  );
}

/**
 * Map pin marker component
 */
function MapPinMarker({
  marker,
  x,
  y,
  isSelected,
  onSelect,
}: {
  marker: MapMarker;
  x: number;
  y: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <div
      className={`absolute transform -translate-x-1/2 -translate-y-full cursor-pointer ${
        isSelected ? "z-10" : "z-0"
      }`}
      style={{ left: x, top: y }}
      onClick={() => onSelect(marker.id)}
    >
      {/* Pin icon */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${
          isSelected
            ? "bg-blue-600 text-white scale-110"
            : "bg-red-500 text-white hover:bg-red-600"
        }`}
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
        </svg>
      </div>
      {/* Label */}
      <div
        className={`mt-1 px-2 py-1 rounded text-xs whitespace-nowrap ${
          isSelected ? "bg-blue-600 text-white" : "bg-white text-gray-800"
        }`}
      >
        {marker.label}
      </div>
    </div>
  );
}

/**
 * Main MapRenderer component
 */
export function MapRenderer({
  board,
  layers,
  width,
  height,
}: MapRendererProps) {
  const selectedItemIds = useUIStore((state) => state.selectedItemIds);
  const selectItem = useUIStore((state) => state.selectItem);

  // Get all items from all layers
  const itemsByLayer = useBoardStore((state) => state.itemsByLayer);
  const allItems = Object.values(itemsByLayer).flat();

  // Extract GPS markers from items
  const markers = extractGpsItems(allItems);

  // Calculate center based on markers if available
  const center =
    markers.length > 0
      ? ([
          markers.reduce((sum, m) => sum + m.lat, 0) / markers.length,
          markers.reduce((sum, m) => sum + m.lng, 0) / markers.length,
        ] as [number, number])
      : DEFAULT_CENTER;

  const zoom = markers.length > 0 ? 10 : DEFAULT_ZOOM;

  // Handle marker selection
  const handleMarkerSelect = (markerId: string) => {
    selectItem(markerId);
  };

  return (
    <div
      className="relative overflow-hidden bg-gray-100"
      style={{ width, height }}
    >
      {/* Placeholder map background */}
      <PlaceholderMapBackground width={width} height={height} />

      {/* Pin markers overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {markers.map((marker) => {
          const { x, y } = gpsToPixel(
            marker.lat,
            marker.lng,
            center,
            zoom,
            width,
            height,
          );

          return (
            <div key={marker.id} className="pointer-events-auto">
              <MapPinMarker
                marker={marker}
                x={x}
                y={y}
                isSelected={selectedItemIds.includes(marker.id)}
                onSelect={handleMarkerSelect}
              />
            </div>
          );
        })}
      </div>

      {/* No markers message */}
      {markers.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-white/90 px-6 py-4 rounded-lg shadow-lg text-center">
            <h3 className="font-semibold text-gray-800 mb-1">No pins yet</h3>
            <p className="text-sm text-gray-600">
              Add pins with GPS coordinates to see them on the map
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAP MODE ARCHITECTURE NOTES
// ============================================================================
//
// This is a foundation implementation. The placeholder map background should
// be replaced with a real map library integration.
//
// Recommended libraries for future implementation:
// 1. Leaflet (open source, free) - easiest to integrate
// 2. Mapbox (requires API key, better styling)
// 3. Google Maps (requires API key, most features)
//
// Key design decisions:
// 1. MapRenderer is separate from EditorCanvas - they don't share rendering
// 2. Pins in map mode use GPS coordinates, not x/y on canvas
// 3. The board.mode flag determines which renderer to use
// 4. Layer concept still applies in map mode (for organizing pin groups)
//
// Future considerations:
// - Pan/zoom gestures for the map
// - Polygon overlays
// - Route/path rendering
// - Tile loading from map providers
// - GPS coordinate editing UI
// ============================================================================
