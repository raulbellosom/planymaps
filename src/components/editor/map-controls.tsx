"use client";

/**
 * MapControls
 * Floating UI controls rendered on top of the map layer.
 * Shows coordinate display, format toggle, zoom buttons,
 * opacity slider, and tile provider switcher.
 */

import { useState } from "react";
import { useUIStore } from "@/stores/ui-store";
import { useBoardStore } from "@/stores/board-store";
import { parseMapSettings } from "@/types/board";
import type { TileProvider, MapSettings } from "@/types/board";
import {
  formatCoordinate,
  type CoordinateFormat,
} from "@/lib/geo-utils";
import {
  Plus,
  Minus,
  Crosshair,
  Map,
  Layers,
  Mountain,
  Globe2,
} from "lucide-react";

const FORMAT_LABELS: Record<CoordinateFormat, string> = {
  dd: "DD",
  dms: "DMS",
  ddm: "DDM",
};

const TILE_PROVIDERS: { id: TileProvider; label: string; icon: typeof Map }[] = [
  { id: "osm", label: "Street", icon: Map },
  { id: "satellite", label: "Satellite", icon: Globe2 },
  { id: "terrain", label: "Terrain", icon: Mountain },
];

interface MapControlsProps {
  /** Called when map settings change (tile provider, opacity, etc.) */
  onUpdateMapSettings: (updates: Partial<MapSettings>) => void;
  /** Called to zoom in/out */
  onZoomIn: () => void;
  onZoomOut: () => void;
  /** Called to center on coordinates */
  onGoToCoordinates?: (lat: number, lng: number) => void;
}

export function MapControls({
  onUpdateMapSettings,
  onZoomIn,
  onZoomOut,
  onGoToCoordinates,
}: MapControlsProps) {
  const board = useBoardStore((s) => s.board);
  const mapCursorPosition = useUIStore((s) => s.mapCursorPosition);
  const coordinateFormat = useUIStore((s) => s.coordinateFormat);
  const setCoordinateFormat = useUIStore((s) => s.setCoordinateFormat);

  const [showGoTo, setShowGoTo] = useState(false);
  const [goToLat, setGoToLat] = useState("");
  const [goToLng, setGoToLng] = useState("");

  if (!board) return null;

  const mapSettings = parseMapSettings(board);

  const handleGoTo = () => {
    const lat = parseFloat(goToLat);
    const lng = parseFloat(goToLng);
    if (!isNaN(lat) && !isNaN(lng)) {
      onGoToCoordinates?.(lat, lng);
      setShowGoTo(false);
      setGoToLat("");
      setGoToLng("");
    }
  };

  return (
    <>
      {/* ── Cursor coordinate display (bottom-left) ── */}
      {mapCursorPosition && (
        <div className="absolute bottom-12 left-4 z-10 glass-panel rounded-lg px-3 py-2 flex items-center gap-2 text-xs">
          <Crosshair className="w-3.5 h-3.5 text-[var(--accent-400)]" />
          <span className="text-white font-mono">
            {formatCoordinate(
              mapCursorPosition.lat,
              mapCursorPosition.lng,
              coordinateFormat,
            )}
          </span>
          <button
            onClick={() => {
              const formats: CoordinateFormat[] = ["dd", "dms", "ddm"];
              const idx = formats.indexOf(coordinateFormat);
              setCoordinateFormat(formats[(idx + 1) % formats.length]);
            }}
            className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[var(--gray-400)] hover:text-white transition-colors text-[10px] uppercase tracking-wider"
            title="Toggle coordinate format"
          >
            {FORMAT_LABELS[coordinateFormat]}
          </button>
        </div>
      )}

      {/* ── Zoom controls (bottom-right) ── */}
      <div className="absolute bottom-12 right-4 z-10 flex flex-col gap-1">
        <button
          onClick={onZoomIn}
          className="glass-panel w-9 h-9 rounded-lg flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          title="Zoom in"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={onZoomOut}
          className="glass-panel w-9 h-9 rounded-lg flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          title="Zoom out"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      {/* ── Tile provider + opacity (top-right cluster) ── */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 items-end">
        {/* Tile provider buttons */}
        <div className="glass-panel rounded-lg p-1 flex gap-1">
          {TILE_PROVIDERS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onUpdateMapSettings({ tileProvider: id })}
              className={`
                px-2.5 py-1.5 rounded-md text-xs flex items-center gap-1.5 transition-all
                ${
                  mapSettings.tileProvider === id
                    ? "bg-[var(--accent-500)] text-white shadow-sm"
                    : "text-[var(--gray-400)] hover:text-white hover:bg-white/10"
                }
              `}
              title={label}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Map opacity slider */}
        <div className="glass-panel rounded-lg px-3 py-2 flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-[var(--gray-400)]" />
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.05}
            value={mapSettings.mapOpacity}
            onChange={(e) =>
              onUpdateMapSettings({
                mapOpacity: parseFloat(e.target.value),
              })
            }
            className="w-20 accent-[var(--accent-500)]"
            title={`Map opacity: ${Math.round(mapSettings.mapOpacity * 100)}%`}
          />
          <span className="text-[10px] text-[var(--gray-400)] w-8 text-right">
            {Math.round(mapSettings.mapOpacity * 100)}%
          </span>
        </div>

        {/* Go to coordinates */}
        {showGoTo ? (
          <div className="glass-panel rounded-lg p-3 flex flex-col gap-2 w-56">
            <div className="flex gap-2">
              <input
                type="number"
                step="any"
                placeholder="Lat"
                value={goToLat}
                onChange={(e) => setGoToLat(e.target.value)}
                className="flex-1 px-2 py-1 rounded bg-white/10 border border-white/10 text-xs text-white placeholder-[var(--gray-500)] focus:outline-none focus:border-[var(--accent-500)]"
              />
              <input
                type="number"
                step="any"
                placeholder="Lng"
                value={goToLng}
                onChange={(e) => setGoToLng(e.target.value)}
                className="flex-1 px-2 py-1 rounded bg-white/10 border border-white/10 text-xs text-white placeholder-[var(--gray-500)] focus:outline-none focus:border-[var(--accent-500)]"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowGoTo(false)}
                className="px-2 py-1 rounded text-xs text-[var(--gray-400)] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleGoTo}
                className="px-3 py-1 rounded bg-[var(--accent-500)] text-white text-xs hover:bg-[var(--accent-600)] transition-colors"
              >
                Go
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowGoTo(true)}
            className="glass-panel rounded-lg px-3 py-1.5 text-xs text-[var(--gray-400)] hover:text-white transition-colors flex items-center gap-1.5"
          >
            <Crosshair className="w-3.5 h-3.5" />
            Go to coordinates
          </button>
        )}
      </div>
    </>
  );
}
