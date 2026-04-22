"use client";

import { useEffect, useState } from "react";
import { BlueprintModal } from "@/components/ui/blueprint-modal";
import { updateBoard } from "@/services/board-service";
import { showError, showSuccess } from "@/lib/toast";
import type { Board, BackgroundType, TileProvider } from "@/types/board";
import { parseMapSettings, defaultMapSettings } from "@/types/board";
import { Map, Globe2, Mountain } from "lucide-react";

interface BoardSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  board: Board;
  workspaceId: string;
  userId: string;
  onSaved?: (updated: Board) => void;
}

const TILE_OPTIONS: { id: TileProvider; label: string; icon: typeof Map }[] = [
  { id: "osm", label: "OpenStreetMap", icon: Map },
  { id: "satellite", label: "Satellite (ESRI)", icon: Globe2 },
  { id: "terrain", label: "Terrain (OpenTopoMap)", icon: Mountain },
];

export function BoardSettingsModal({
  isOpen,
  onClose,
  board,
  workspaceId: _workspaceId,
  userId: _userId,
  onSaved,
}: BoardSettingsModalProps) {
  const [name, setName] = useState(board.name ?? "");
  const [description, setDescription] = useState(board.description ?? "");
  const [backgroundType, setBackgroundType] = useState<BackgroundType>(
    board.backgroundType ?? "none",
  );
  const [backgroundColor, setBackgroundColor] = useState(
    board.backgroundColor ?? "#ffffff",
  );

  // Map settings
  const existingMapSettings = parseMapSettings(board);
  const [tileProvider, setTileProvider] = useState<TileProvider>(
    existingMapSettings.tileProvider,
  );
  const [mapOpacity, setMapOpacity] = useState(existingMapSettings.mapOpacity);
  const [centerLat, setCenterLat] = useState(
    existingMapSettings.centerLat.toString(),
  );
  const [centerLng, setCenterLng] = useState(
    existingMapSettings.centerLng.toString(),
  );
  const [defaultZoom, setDefaultZoom] = useState(existingMapSettings.zoom);

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setName(board.name ?? "");
    setDescription(board.description ?? "");
    setBackgroundType(board.backgroundType ?? "none");
    setBackgroundColor(board.backgroundColor ?? "#ffffff");

    const ms = parseMapSettings(board);
    setTileProvider(ms.tileProvider);
    setMapOpacity(ms.mapOpacity);
    setCenterLat(ms.centerLat.toString());
    setCenterLng(ms.centerLng.toString());
    setDefaultZoom(ms.zoom);
  }, [board]);

  const handleSave = async () => {
    try {
      setIsSaving(true);

      const updatePayload: Parameters<typeof updateBoard>[1] = {
        name: name.trim() || board.name,
        description: description.trim(),
        backgroundType,
        // Auto-set mode: "map" background → "geo" mode, otherwise "visual"
        mode: backgroundType === "map" ? "geo" : "visual",
        backgroundColor:
          backgroundType === "color" ? backgroundColor : undefined,
      };

      // If map background, also save map settings
      if (backgroundType === "map") {
        const lat = parseFloat(centerLat);
        const lng = parseFloat(centerLng);
        (updatePayload as Record<string, unknown>).mapSettingsJson =
          JSON.stringify({
            centerLat: isNaN(lat) ? defaultMapSettings.centerLat : lat,
            centerLng: isNaN(lng) ? defaultMapSettings.centerLng : lng,
            zoom: defaultZoom,
            tileProvider,
            mapOpacity,
          });
      }

      const updated = await updateBoard(board.$id, updatePayload);
      onSaved?.(updated);
      showSuccess("Board updated");
      onClose();
    } catch (error) {
      showError(
        "Could not update board",
        error instanceof Error ? error.message : "Unknown error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BlueprintModal
      isOpen={isOpen}
      onClose={onClose}
      title="Board Settings"
      size="md"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-[var(--gray-400)] mb-1.5">
            Board Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[var(--navy-800)] border border-white/10 text-white outline-none focus:border-[var(--accent-500)] transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm text-[var(--gray-400)] mb-1.5">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg bg-[var(--navy-800)] border border-white/10 text-white outline-none focus:border-[var(--accent-500)] transition-colors resize-none"
          />
        </div>

        <div>
          <label className="block text-sm text-[var(--gray-400)] mb-1.5">
            Background Type
          </label>
          <select
            value={backgroundType}
            onChange={(e) =>
              setBackgroundType(e.target.value as BackgroundType)
            }
            className="w-full px-3 py-2 rounded-lg bg-[var(--navy-800)] border border-white/10 text-white outline-none focus:border-[var(--accent-500)] transition-colors"
          >
            <option value="none">None</option>
            <option value="color">Color</option>
            <option value="image">Image</option>
            <option value="map">Map</option>
          </select>
        </div>

        {backgroundType === "color" && (
          <div>
            <label className="block text-sm text-[var(--gray-400)] mb-1.5">
              Background Color
            </label>
            <input
              type="color"
              value={backgroundColor}
              onInput={(e) =>
                setBackgroundColor((e.target as HTMLInputElement).value)
              }
              className="h-10 w-full rounded-lg bg-[var(--navy-800)] border border-white/10"
            />
          </div>
        )}

        {/* ── Map settings ── */}
        {backgroundType === "map" && (
          <div className="space-y-3 pt-1 border-t border-white/10">
            <p className="text-xs text-[var(--accent-400)] font-medium uppercase tracking-wider pt-2">
              Map Configuration
            </p>

            {/* Tile provider */}
            <div>
              <label className="block text-sm text-[var(--gray-400)] mb-1.5">
                Tile Provider
              </label>
              <div className="flex gap-2">
                {TILE_OPTIONS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTileProvider(id)}
                    className={`
                      flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs border transition-all
                      ${
                        tileProvider === id
                          ? "bg-[var(--accent-500)] border-[var(--accent-500)] text-white"
                          : "bg-[var(--navy-800)] border-white/10 text-[var(--gray-400)] hover:text-white hover:border-white/20"
                      }
                    `}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Default center */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-[var(--gray-400)] mb-1.5">
                  Center Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={centerLat}
                  onChange={(e) => setCenterLat(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--navy-800)] border border-white/10 text-white outline-none focus:border-[var(--accent-500)] transition-colors font-mono text-sm"
                  placeholder="20.6534"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--gray-400)] mb-1.5">
                  Center Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={centerLng}
                  onChange={(e) => setCenterLng(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--navy-800)] border border-white/10 text-white outline-none focus:border-[var(--accent-500)] transition-colors font-mono text-sm"
                  placeholder="-105.2253"
                />
              </div>
            </div>

            {/* Default zoom */}
            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-sm text-[var(--gray-400)]">
                  Default Zoom
                </label>
                <span className="text-xs text-[var(--gray-500)]">
                  {defaultZoom}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={19}
                step={1}
                value={defaultZoom}
                onChange={(e) => setDefaultZoom(parseInt(e.target.value))}
                className="w-full accent-[var(--accent-500)]"
              />
            </div>

            {/* Map opacity */}
            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-sm text-[var(--gray-400)]">
                  Map Opacity
                </label>
                <span className="text-xs text-[var(--gray-500)]">
                  {Math.round(mapOpacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0.1}
                max={1}
                step={0.05}
                value={mapOpacity}
                onChange={(e) => setMapOpacity(parseFloat(e.target.value))}
                className="w-full accent-[var(--accent-500)]"
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-[var(--gray-300)] hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 rounded-lg bg-[var(--accent-500)] hover:bg-[var(--accent-600)] text-white font-medium transition-colors disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </BlueprintModal>
  );
}
