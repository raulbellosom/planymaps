"use client";

/**
 * MapRenderer Component
 * Renders a Leaflet map at the board's dimensions.
 * 
 * Architecture:
 * - The map is sized to boardWidth x boardHeight
 * - Leaflet interaction is DISABLED (no pan/zoom) — Konva controls the viewport
 * - The parent applies a CSS transform matching the Konva viewport so map + shapes
 *   move together as one unit
 * - Map settings (tile provider, opacity, center, zoom) come from board config
 */

import { useMemo } from "react";
import dynamic from "next/dynamic";
import type { Board } from "@/types/board";
import { parseMapSettings } from "@/types/board";

// Leaflet depends on browser APIs — must not be server-rendered
const LeafletMapLayer = dynamic(
  () =>
    import("./leaflet-map-layer").then((m) => m.LeafletMapLayer),
  { ssr: false },
);

export interface MapRendererProps {
  board: Board;
  /** Board width in pixels */
  width: number;
  /** Board height in pixels */
  height: number;
  /** Whether the user is actively editing the map position */
  interactive?: boolean;
  /** Callback fired when the map center or zoom changes */
  onMapChange?: (lat: number, lng: number, zoom: number) => void;
}

/**
 * Check if a board should show its map layer.
 */
export function isMapBoard(board: Board | null): boolean {
  if (!board) return false;
  return board.backgroundType === "map";
}

/**
 * Main MapRenderer component — renders a static Leaflet map at board dimensions.
 * Leaflet interaction is disabled; Konva handles all pan/zoom via CSS transform.
 */
export function MapRenderer({
  board,
  width,
  height,
  interactive = false,
  onMapChange,
}: MapRendererProps) {
  const mapSettings = useMemo(() => parseMapSettings(board), [board]);

  return (
    <LeafletMapLayer
      settings={mapSettings}
      width={width}
      height={height}
      interactive={interactive}
      onMapChange={onMapChange}
    />
  );
}
