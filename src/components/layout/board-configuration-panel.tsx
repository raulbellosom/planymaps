"use client";

/**
 * Board Configuration Panel
 *
 * Provides mode-aware configuration for canvas boards (Visual and Geo modes).
 * Designed with:
 * - Mobile-first responsive layout
 * - Collapsible sections for clear visual hierarchy
 * - Mode-specific settings (Visual mode vs Geo mode)
 * - Integration with existing panel context system
 *
 * UI Library Decision: Custom Component
 * Reasoning: Requires specialized mode-aware layout, collapsible sections, and
 * board-mode state management that standard UI libraries don't provide.
 */

import { useState, useCallback, useEffect } from "react";
import {
  X,
  ChevronDown,
  ChevronRight,
  Layers,
  Map,
  Image,
  Palette,
  Grid3x3,
  Move,
  ZoomIn,
  ZoomOut,
  Eye,
  EyeOff,
  Lock,
  LockOpen,
  RefreshCw,
  Camera,
  Globe,
  Mountain,
  Navigation,
} from "lucide-react";
import { usePanels } from "@/contexts/panel-context";
import { useBoardStore } from "@/stores/board-store";
import type {
  BoardMode,
  BackgroundType,
  TileProvider,
  MapSettings,
} from "@/types/board";
import { parseMapSettings, defaultMapSettings } from "@/types/board";
import { updateBoard } from "@/services/board-service";
import { showError, showSuccess } from "@/lib/toast";

// ─── Section Accordion Component ───────────────────────────────────────────

interface SectionProps {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string;
  children: React.ReactNode;
}

function Section({
  title,
  icon,
  defaultOpen = false,
  badge,
  children,
}: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-white/5 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-white/5 transition-colors"
      >
        <span className="text-[var(--gray-500)] transition-transform duration-200">
          {isOpen ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </span>
        {icon && (
          <span className="text-[var(--gray-400)] w-4 h-4 flex items-center justify-center">
            {icon}
          </span>
        )}
        <span className="text-xs font-medium text-white flex-1 uppercase tracking-wider">
          {title}
        </span>
        {badge && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-[var(--gray-400)]">
            {badge}
          </span>
        )}
      </button>
      {isOpen && <div className="px-3 pb-3 pt-1">{children}</div>}
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  disabled?: boolean;
}

function NumberInput({
  label,
  value,
  onChange,
  step = 1,
  min = 0,
  max,
  disabled,
}: NumberInputProps) {
  const [localValue, setLocalValue] = useState(String(value));

  // Sync local value when external value changes
  useEffect(() => {
    setLocalValue(String(value));
  }, [value]);

  const handleBlur = () => {
    const n = parseFloat(localValue);
    if (isNaN(n)) {
      // Reset to original value if empty or invalid
      setLocalValue(String(value));
    } else {
      // Clamp to min/max bounds
      let clamped = n;
      if (min !== undefined && clamped < min) clamped = min;
      if (max !== undefined && clamped > max) clamped = max;
      setLocalValue(String(clamped));
      onChange(clamped);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] uppercase tracking-wider text-[var(--gray-500)]">
        {label}
      </label>
      <input
        type="text"
        inputMode="decimal"
        disabled={disabled}
        className="w-full bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[var(--accent-500)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-mono"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            (e.target as HTMLInputElement).blur();
          }
        }}
      />
    </div>
  );
}

interface SliderInputProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  displayValue?: string;
  disabled?: boolean;
}

function SliderInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 0.01,
  displayValue,
  disabled,
}: SliderInputProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between">
        <label className="text-[10px] uppercase tracking-wider text-[var(--gray-500)]">
          {label}
        </label>
        <span className="text-[10px] text-[var(--gray-500)] font-mono">
          {displayValue ?? value}
        </span>
      </div>
      <input
        type="range"
        disabled={disabled}
        className="w-full accent-[var(--accent-500)] disabled:opacity-50 disabled:cursor-not-allowed"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </div>
  );
}

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}

function ColorInput({ label, value, onChange, disabled }: ColorInputProps) {
  const [localHex, setLocalHex] = useState(value || "");

  // Sync local hex when external value changes
  useEffect(() => {
    setLocalHex(value || "");
  }, [value]);

  // Validate hex color string
  const isValidHex = (hex: string): boolean =>
    /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex);

  const handleColorChange = (color: string) => {
    // For hex text input, validate before passing up
    if (!color.startsWith("#")) {
      color = "#" + color;
    }
    onChange(color);
  };

  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] uppercase tracking-wider text-[var(--gray-500)]">
        {label}
      </label>
      <div className="flex gap-2 items-center">
        <input
          type="color"
          disabled={disabled}
          className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          value={value || "#000000"}
          onInput={(e) => onChange((e.target as HTMLInputElement).value)}
        />
        <input
          type="text"
          disabled={disabled}
          className="flex-1 bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[var(--accent-500)] transition-colors font-mono disabled:opacity-50 disabled:cursor-not-allowed"
          value={localHex}
          onChange={(e) => {
            const newHex = e.target.value;
            setLocalHex(newHex);
            if (isValidHex(newHex) || newHex === "") {
              handleColorChange(newHex);
            }
          }}
          onBlur={() => {
            // Reset to last valid value on blur if invalid
            if (!isValidHex(localHex) && localHex !== "") {
              setLocalHex(value || "");
            }
          }}
          maxLength={9}
          placeholder="#000000"
        />
      </div>
    </div>
  );
}

interface ToggleButtonProps {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  activeColor?: string;
  inactiveColor?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

function ToggleButton({
  label,
  value,
  onChange,
  activeColor,
  icon,
  disabled,
}: ToggleButtonProps) {
  return (
    <button
      disabled={disabled}
      onClick={() => onChange(!value)}
      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs border transition-colors disabled:opacity-50 disabled:cursor-not-allowed
        ${
          value
            ? (activeColor ??
              "bg-[var(--accent-500)]/20 border-[var(--accent-500)]/40 text-[var(--accent-400)]")
            : "bg-white/5 border-white/10 text-[var(--gray-400)] hover:bg-white/10"
        }`}
    >
      {icon}
      {label}
    </button>
  );
}

// ─── Mode Selector ───────────────────────────────────────────────────────────

interface ModeSelectorProps {
  mode: BoardMode;
  onChange: (mode: BoardMode) => void;
  disabled?: boolean;
}

function ModeSelector({ mode, onChange, disabled }: ModeSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] uppercase tracking-wider text-[var(--gray-500)]">
        Board Mode
      </label>
      <div className="flex gap-2">
        <button
          disabled={disabled}
          onClick={() => onChange("visual")}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed
            ${
              mode === "visual"
                ? "bg-[var(--accent-500)] border-[var(--accent-500)] text-white"
                : "bg-white/5 border-white/10 text-[var(--gray-400)] hover:text-white hover:border-white/20"
            }`}
        >
          <Layers className="w-4 h-4" />
          <span>Visual</span>
        </button>
        <button
          disabled={disabled}
          onClick={() => onChange("geo")}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed
            ${
              mode === "geo"
                ? "bg-[var(--accent-500)] border-[var(--accent-500)] text-white"
                : "bg-white/5 border-white/10 text-[var(--gray-400)] hover:text-white hover:border-white/20"
            }`}
        >
          <Map className="w-4 h-4" />
          <span>Geo</span>
        </button>
      </div>
      <p className="text-[10px] text-[var(--gray-500)]">
        {mode === "visual"
          ? "Pure canvas editing with shapes and annotations"
          : "Map-based editing with geographic coordinates"}
      </p>
    </div>
  );
}

// ─── Background Configuration ───────────────────────────────────────────────

interface BackgroundConfigProps {
  backgroundType: BackgroundType;
  backgroundColor: string;
  onBackgroundTypeChange: (type: BackgroundType) => void;
  onBackgroundColorChange: (color: string) => void;
  disabled?: boolean;
}

function BackgroundConfig({
  backgroundType,
  backgroundColor,
  onBackgroundTypeChange,
  onBackgroundColorChange,
  disabled,
}: BackgroundConfigProps) {
  const BACKGROUND_OPTIONS: {
    id: BackgroundType;
    label: string;
    icon: typeof Image;
  }[] = [
    { id: "none", label: "None", icon: Grid3x3 },
    { id: "color", label: "Color", icon: Palette },
    { id: "image", label: "Image", icon: Image },
    { id: "map", label: "Map", icon: Map },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-1">
        <label className="text-[10px] uppercase tracking-wider text-[var(--gray-500)]">
          Background Type
        </label>
        <div className="grid grid-cols-2 gap-2">
          {BACKGROUND_OPTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              disabled={disabled}
              onClick={() => onBackgroundTypeChange(id)}
              className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border text-[11px] font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed
                ${
                  backgroundType === id
                    ? "bg-[var(--accent-500)]/20 border-[var(--accent-500)]/40 text-[var(--accent-400)]"
                    : "bg-white/5 border-white/10 text-[var(--gray-400)] hover:text-white hover:border-white/20"
                }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {backgroundType === "color" && (
        <ColorInput
          label="Background Color"
          value={backgroundColor}
          onChange={onBackgroundColorChange}
          disabled={disabled}
        />
      )}
    </div>
  );
}

// ─── Map Configuration (Geo Mode) ───────────────────────────────────────────

interface MapConfigProps {
  mapSettings: MapSettings;
  onMapSettingsChange: (updates: Partial<MapSettings>) => void;
  disabled?: boolean;
}

function MapConfig({
  mapSettings,
  onMapSettingsChange,
  disabled,
}: MapConfigProps) {
  const TILE_OPTIONS: {
    id: TileProvider;
    label: string;
    icon: typeof Globe;
  }[] = [
    { id: "osm", label: "OpenStreetMap", icon: Globe },
    { id: "satellite", label: "Satellite", icon: Camera },
    { id: "terrain", label: "Terrain", icon: Mountain },
  ];

  return (
    <div className="space-y-4">
      {/* Tile Provider */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] uppercase tracking-wider text-[var(--gray-500)]">
          Tile Provider
        </label>
        <div className="grid grid-cols-3 gap-2">
          {TILE_OPTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              disabled={disabled}
              onClick={() => onMapSettingsChange({ tileProvider: id })}
              className={`flex flex-col items-center justify-center gap-1 px-1 py-2 rounded-lg border text-[9px] font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[50px]
                ${
                  mapSettings.tileProvider === id
                    ? "bg-[var(--accent-500)]/20 border-[var(--accent-500)]/40 text-[var(--accent-400)]"
                    : "bg-white/5 border-white/10 text-[var(--gray-400)] hover:text-white hover:border-white/20"
                }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-center leading-tight">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Center Coordinates */}
      <div className="grid grid-cols-2 gap-3">
        <NumberInput
          label="Center Lat"
          value={mapSettings.centerLat}
          onChange={(v) => onMapSettingsChange({ centerLat: v })}
          step={0.000001}
          disabled={disabled}
        />
        <NumberInput
          label="Center Lng"
          value={mapSettings.centerLng}
          onChange={(v) => onMapSettingsChange({ centerLng: v })}
          step={0.000001}
          disabled={disabled}
        />
      </div>

      {/* Zoom Level */}
      <SliderInput
        label="Default Zoom"
        value={mapSettings.zoom}
        onChange={(v) => onMapSettingsChange({ zoom: v })}
        min={1}
        max={19}
        step={1}
        displayValue={String(mapSettings.zoom)}
        disabled={disabled}
      />

      {/* Map Opacity */}
      <SliderInput
        label="Map Opacity"
        value={mapSettings.mapOpacity}
        onChange={(v) => onMapSettingsChange({ mapOpacity: v })}
        min={0.1}
        max={1}
        step={0.05}
        displayValue={`${Math.round(mapSettings.mapOpacity * 100)}%`}
        disabled={disabled}
      />
    </div>
  );
}

// ─── Canvas Settings (Visual Mode) ─────────────────────────────────────────

interface CanvasConfigProps {
  boardWidth: number;
  boardHeight: number;
  onWidthChange: (v: number) => void;
  onHeightChange: (v: number) => void;
  disabled?: boolean;
}

function CanvasConfig({
  boardWidth,
  boardHeight,
  onWidthChange,
  onHeightChange,
  disabled,
}: CanvasConfigProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <NumberInput
          label="Width (px)"
          value={boardWidth}
          onChange={onWidthChange}
          min={100}
          max={10000}
          disabled={disabled}
        />
        <NumberInput
          label="Height (px)"
          value={boardHeight}
          onChange={onHeightChange}
          min={100}
          max={10000}
          disabled={disabled}
        />
      </div>
      <p className="text-[10px] text-[var(--gray-500)]">
        Min: 100px, Max: 10000px
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function BoardConfigurationPanel() {
  const { panels, togglePanel } = usePanels();

  // Board state
  const board = useBoardStore((state) => state.board);
  const updateBoardLocal = useBoardStore((state) => state.updateBoard);

  // Local state for form values
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState<BoardMode>("visual");
  const [backgroundType, setBackgroundType] = useState<BackgroundType>("none");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [boardWidth, setBoardWidth] = useState(1920);
  const [boardHeight, setBoardHeight] = useState(1080);
  const [mapSettings, setMapSettings] =
    useState<MapSettings>(defaultMapSettings);

  // Saving state
  const [isSaving, setIsSaving] = useState(false);

  // Sync local state with board
  useEffect(() => {
    if (board) {
      setName(board.name ?? "");
      setDescription(board.description ?? "");
      setMode(board.mode ?? "visual");
      setBackgroundType(board.backgroundType ?? "none");
      setBackgroundColor(board.backgroundColor ?? "#ffffff");
      setBoardWidth(board.width ?? 1920);
      setBoardHeight(board.height ?? 1080);

      if (board.mapSettingsJson) {
        setMapSettings(parseMapSettings(board));
      }
    }
  }, [board]);

  const handleMapSettingsChange = useCallback(
    (updates: Partial<MapSettings>) => {
      setMapSettings((prev) => ({ ...prev, ...updates }));
    },
    [],
  );

  const handleSave = useCallback(async () => {
    if (!board) return;

    try {
      setIsSaving(true);

      const updatePayload: Record<string, unknown> = {
        name: name.trim() || board.name,
        description: description.trim(),
        mode,
        backgroundType,
        width: boardWidth,
        height: boardHeight,
      };

      if (backgroundType === "color") {
        updatePayload.backgroundColor = backgroundColor;
      } else {
        // Clear background color if not using color type
        updatePayload.backgroundColor = null;
      }

      if (backgroundType === "map" || mode === "geo") {
        updatePayload.mapSettingsJson = JSON.stringify(mapSettings);
      }

      const updated = await updateBoard(board.$id, updatePayload);
      updateBoardLocal(updated);
      showSuccess("Board configuration updated");
    } catch (error) {
      showError(
        "Failed to update board",
        error instanceof Error ? error.message : "Unknown error",
      );
    } finally {
      setIsSaving(false);
    }
  }, [
    board,
    name,
    description,
    mode,
    backgroundType,
    backgroundColor,
    boardWidth,
    boardHeight,
    mapSettings,
    updateBoardLocal,
  ]);

  // Determine which sections to show based on mode
  const isGeoMode = mode === "geo" || backgroundType === "map";

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`
          hidden md:flex flex-col glass-panel border-l border-white/10
          transition-all duration-200 ease-in-out overflow-hidden
          ${panels.configurationPanel ? "w-72" : "w-0"}
        `}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 shrink-0">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <SettingsIcon />
              Configuration
            </h2>
            <button
              onClick={() => togglePanel("configurationPanel")}
              className="p-2 rounded-lg hover:bg-white/10 text-[var(--gray-400)] hover:text-white transition-colors"
              aria-label="Close configuration panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {board ? (
            <div className="py-2">
              {/* Board Info Section */}
              <Section
                title="Board"
                icon={<Layers className="w-3.5 h-3.5" />}
                defaultOpen={true}
              >
                <div className="space-y-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase tracking-wider text-[var(--gray-500)]">
                      Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[var(--accent-500)] transition-colors"
                      placeholder="Board name"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase tracking-wider text-[var(--gray-500)]">
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                      className="w-full bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[var(--accent-500)] transition-colors resize-none"
                      placeholder="Optional description"
                    />
                  </div>
                </div>
              </Section>

              {/* Mode Selector Section */}
              <Section
                title="Mode"
                icon={<Map className="w-3.5 h-3.5" />}
                defaultOpen={true}
                badge={mode === "geo" ? "Map" : "Visual"}
              >
                <ModeSelector mode={mode} onChange={setMode} />
              </Section>

              {/* Background Section */}
              <Section
                title="Background"
                icon={<Palette className="w-3.5 h-3.5" />}
                defaultOpen={true}
                badge={backgroundType === "none" ? "None" : backgroundType}
              >
                <BackgroundConfig
                  backgroundType={backgroundType}
                  backgroundColor={backgroundColor}
                  onBackgroundTypeChange={setBackgroundType}
                  onBackgroundColorChange={setBackgroundColor}
                />
              </Section>

              {/* Map Settings (Geo Mode or Map Background) */}
              {isGeoMode && (
                <Section
                  title="Map Settings"
                  icon={<Globe className="w-3.5 h-3.5" />}
                  defaultOpen={true}
                >
                  <MapConfig
                    mapSettings={mapSettings}
                    onMapSettingsChange={handleMapSettingsChange}
                  />
                </Section>
              )}

              {/* Canvas Settings (Visual Mode) */}
              {mode === "visual" && (
                <Section
                  title="Canvas"
                  icon={<Move className="w-3.5 h-3.5" />}
                  defaultOpen={false}
                >
                  <CanvasConfig
                    boardWidth={boardWidth}
                    boardHeight={boardHeight}
                    onWidthChange={setBoardWidth}
                    onHeightChange={setBoardHeight}
                  />
                </Section>
              )}

              {/* Quick Info Section */}
              <Section
                title="Info"
                icon={<Layers className="w-3.5 h-3.5" />}
                defaultOpen={false}
              >
                <div className="space-y-2 text-[10px] text-[var(--gray-500)]">
                  <div className="flex justify-between">
                    <span>Created:</span>
                    <span className="text-white/70">
                      {new Date(board.$createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Updated:</span>
                    <span className="text-white/70">
                      {new Date(board.$updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>ID:</span>
                    <span className="text-white/50 font-mono text-[9px] truncate max-w-[120px]">
                      {board.$id}
                    </span>
                  </div>
                </div>
              </Section>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-10 px-4">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                <Layers className="w-5 h-5 text-[var(--gray-500)]" />
              </div>
              <p className="text-sm text-[var(--gray-500)]">No board loaded</p>
              <p className="text-[10px] text-[var(--gray-600)]">
                Open a board to configure its settings
              </p>
            </div>
          )}
        </div>

        {/* Footer with Save button */}
        {board && (
          <div className="p-4 border-t border-white/10 shrink-0">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full py-2.5 rounded-lg bg-[var(--accent-500)] hover:bg-[var(--accent-600)] text-white text-xs font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Configuration"
              )}
            </button>
          </div>
        )}
      </aside>

      {/* Mobile: configuration panel as slide-over */}
      {panels.configurationPanel && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
          onClick={() => togglePanel("configurationPanel")}
        >
          <div
            className="absolute right-0 top-0 bottom-0 w-[85%] max-w-85 glass-heavy shadow-xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex justify-between items-center shrink-0">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <SettingsIcon />
                Configuration
              </h2>
              <button
                onClick={() => togglePanel("configurationPanel")}
                className="p-2 rounded-lg hover:bg-white/10 text-[var(--gray-400)] hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
              {board ? (
                <div className="py-2">
                  {/* Board Info Section */}
                  <Section
                    title="Board"
                    icon={<Layers className="w-3.5 h-3.5" />}
                    defaultOpen={true}
                  >
                    <div className="space-y-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase tracking-wider text-[var(--gray-500)]">
                          Name
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-sm text-white focus:outline-none focus:border-[var(--accent-500)] transition-colors"
                          placeholder="Board name"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase tracking-wider text-[var(--gray-500)]">
                          Description
                        </label>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          rows={2}
                          className="w-full bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-sm text-white focus:outline-none focus:border-[var(--accent-500)] transition-colors resize-none"
                          placeholder="Optional description"
                        />
                      </div>
                    </div>
                  </Section>

                  {/* Mode Selector Section */}
                  <Section
                    title="Mode"
                    icon={<Map className="w-3.5 h-3.5" />}
                    defaultOpen={true}
                    badge={mode === "geo" ? "Map" : "Visual"}
                  >
                    <ModeSelector mode={mode} onChange={setMode} />
                  </Section>

                  {/* Background Section */}
                  <Section
                    title="Background"
                    icon={<Palette className="w-3.5 h-3.5" />}
                    defaultOpen={true}
                    badge={backgroundType === "none" ? "None" : backgroundType}
                  >
                    <BackgroundConfig
                      backgroundType={backgroundType}
                      backgroundColor={backgroundColor}
                      onBackgroundTypeChange={setBackgroundType}
                      onBackgroundColorChange={setBackgroundColor}
                    />
                  </Section>

                  {/* Map Settings (Geo Mode or Map Background) */}
                  {isGeoMode && (
                    <Section
                      title="Map Settings"
                      icon={<Globe className="w-3.5 h-3.5" />}
                      defaultOpen={true}
                    >
                      <MapConfig
                        mapSettings={mapSettings}
                        onMapSettingsChange={handleMapSettingsChange}
                      />
                    </Section>
                  )}

                  {/* Canvas Settings (Visual Mode) */}
                  {mode === "visual" && (
                    <Section
                      title="Canvas"
                      icon={<Move className="w-3.5 h-3.5" />}
                      defaultOpen={false}
                    >
                      <CanvasConfig
                        boardWidth={boardWidth}
                        boardHeight={boardHeight}
                        onWidthChange={setBoardWidth}
                        onHeightChange={setBoardHeight}
                      />
                    </Section>
                  )}

                  {/* Quick Info Section */}
                  <Section
                    title="Info"
                    icon={<Layers className="w-3.5 h-3.5" />}
                    defaultOpen={false}
                  >
                    <div className="space-y-2 text-xs text-[var(--gray-500)]">
                      <div className="flex justify-between">
                        <span>Created:</span>
                        <span className="text-white/70">
                          {new Date(board.$createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Updated:</span>
                        <span className="text-white/70">
                          {new Date(board.$updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </Section>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-10 px-4">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                    <Layers className="w-5 h-5 text-[var(--gray-500)]" />
                  </div>
                  <p className="text-sm text-[var(--gray-500)]">
                    No board loaded
                  </p>
                </div>
              )}
            </div>

            {/* Footer with Save button */}
            {board && (
              <div className="p-4 border-t border-white/10 shrink-0">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full py-3 rounded-lg bg-[var(--accent-500)] hover:bg-[var(--accent-600)] text-white text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Configuration"
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// Small settings icon component
function SettingsIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-[var(--accent-400)]"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
