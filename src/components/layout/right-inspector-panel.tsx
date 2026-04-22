"use client";

import { useCallback } from "react";
import { usePanels } from "@/contexts/panel-context";
import { useBoardStore } from "@/stores/board-store";
import { useUIStore } from "@/stores/ui-store";
import { parseStyleProps, parseContentProps, parseGeoProps } from "@/types/board";
import type { BoardItem, Layer } from "@/types/board";
import {
  X,
  Eye,
  EyeOff,
  Lock,
  LockOpen,
  AlignLeft,
  AlignCenter,
  AlignRight,
  MapPin,
} from "lucide-react";

// ─── Sub-components ───────────────────────────────────────────────────────────

function NumberInput({
  label,
  value,
  onChange,
  step = 1,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] uppercase tracking-wider text-(--gray-500)">
        {label}
      </label>
      <input
        type="number"
        className="w-full bg-white/5 border border-white/10 rounded-md px-2 py-1 text-xs text-white focus:outline-none focus:border-(--accent-500) transition-colors"
        value={Math.round(value * 100) / 100}
        step={step}
        min={min}
        max={max}
        onChange={(e) => {
          const n = parseFloat(e.target.value);
          if (!isNaN(n)) onChange(n);
        }}
      />
    </div>
  );
}

function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] uppercase tracking-wider text-(--gray-500)">
        {label}
      </label>
      <div className="flex gap-2 items-center">
        <input
          type="color"
          className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
        />
        <input
          type="text"
          className="flex-1 bg-white/5 border border-white/10 rounded-md px-2 py-1 text-xs text-white focus:outline-none focus:border-(--accent-500) transition-colors font-mono"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          maxLength={9}
          placeholder="#000000"
        />
      </div>
    </div>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="text-[10px] uppercase tracking-wider text-(--gray-500) font-medium pt-2 pb-1 border-t border-white/5 mt-1">
      {label}
    </div>
  );
}

// ─── Inspector content as a standalone module-level component ─────────────────
// IMPORTANT: Must NOT be defined inside RightInspectorPanel.
// If it were an inner function, every parent re-render would create a new
// component identity → React unmounts/remounts it → all inputs lose focus.

interface InspectorContentProps {
  selectedItem: BoardItem | null;
  selectedItemIds: string[];
  layers: Layer[];
  updateItem: (id: string, patch: Record<string, unknown>) => void;
  moveItemToLayer: (itemId: string, layerId: string) => void;
  setPinEditModal: (modal: { itemId: string } | null) => void;
}

const FONT_FAMILIES = [
  "Arial",
  "Georgia",
  "Times New Roman",
  "Verdana",
  "Courier New",
  "Trebuchet MS",
  "Impact",
  "Comic Sans MS",
];

function InspectorContent({
  selectedItem,
  selectedItemIds,
  layers,
  updateItem,
  moveItemToLayer,
  setPinEditModal,
}: InspectorContentProps) {
  const updateStyle = useCallback(
    (patch: Record<string, unknown>) => {
      if (!selectedItem) return;
      const current = parseStyleProps(selectedItem);
      updateItem(selectedItem.$id, {
        styleJson: JSON.stringify({ ...current, ...patch }),
      });
    },
    [selectedItem, updateItem],
  );

  const updateContent = useCallback(
    (patch: Record<string, unknown>) => {
      if (!selectedItem) return;
      const current = parseContentProps(selectedItem);
      updateItem(selectedItem.$id, {
        contentJson: JSON.stringify({ ...current, ...patch }),
      });
    },
    [selectedItem, updateItem],
  );

  if (!selectedItem) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-10">
        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
          <X className="w-4 h-4 text-(--gray-500)" />
        </div>
        <p className="text-sm text-(--gray-500)">
          Select an element to inspect
        </p>
      </div>
    );
  }

  const style = parseStyleProps(selectedItem);
  const content = parseContentProps(selectedItem);

  const isText = selectedItem.type === "text";
  const isPin = selectedItem.type === "pin";
  const isImage = selectedItem.type === "image";
  const isShape =
    selectedItem.type === "rectangle" || selectedItem.type === "ellipse";
  const isArrow = selectedItem.type === "arrow";
  const isLine = selectedItem.type === "line";

  const fontStyle = (style as Record<string, unknown>).fontStyle as
    | string
    | undefined;
  const verticalAlign = (style as Record<string, unknown>).verticalAlign as
    | string
    | undefined;

  return (
    <div className="flex flex-col gap-2 pb-4">
      {/* Name */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] uppercase tracking-wider text-(--gray-500)">
          Name
        </label>
        <input
          type="text"
          className="w-full bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-xs text-white focus:outline-none focus:border-(--accent-500) transition-colors"
          value={selectedItem.name}
          onChange={(e) =>
            updateItem(selectedItem.$id, { name: e.target.value })
          }
        />
      </div>

      {/* Visibility & Lock */}
      <div className="flex gap-2">
        <button
          onClick={() =>
            updateItem(selectedItem.$id, { visible: !selectedItem.visible })
          }
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs border transition-colors
            ${selectedItem.visible ? "bg-white/5 border-white/10 text-(--gray-300) hover:bg-white/10" : "bg-amber-500/20 border-amber-500/40 text-amber-400"}`}
        >
          {selectedItem.visible ? (
            <Eye className="w-3.5 h-3.5" />
          ) : (
            <EyeOff className="w-3.5 h-3.5" />
          )}
          {selectedItem.visible ? "Visible" : "Hidden"}
        </button>
        <button
          onClick={() =>
            updateItem(selectedItem.$id, { locked: !selectedItem.locked })
          }
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs border transition-colors
            ${!selectedItem.locked ? "bg-white/5 border-white/10 text-(--gray-300) hover:bg-white/10" : "bg-orange-500/20 border-orange-500/40 text-orange-400"}`}
        >
          {selectedItem.locked ? (
            <Lock className="w-3.5 h-3.5" />
          ) : (
            <LockOpen className="w-3.5 h-3.5" />
          )}
          {selectedItem.locked ? "Locked" : "Unlocked"}
        </button>
      </div>

      {/* Layer assignment */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] uppercase tracking-wider text-(--gray-500)">
          Layer
        </label>
        <select
          className="w-full bg-(--navy-700) border border-white/10 rounded-md px-2 py-1.5 text-xs text-white focus:outline-none focus:border-(--accent-500) transition-colors"
          value={selectedItem.layerId}
          onChange={(e) => moveItemToLayer(selectedItem.$id, e.target.value)}
        >
          {layers.map((l) => (
            <option key={l.$id} value={l.$id}>
              {l.name}
            </option>
          ))}
        </select>
      </div>

      {/* Opacity (item-level) */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between">
          <label className="text-[10px] uppercase tracking-wider text-(--gray-500)">
            Opacity
          </label>
          <span className="text-[10px] text-(--gray-500)">
            {Math.round(selectedItem.opacity * 100)}%
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={selectedItem.opacity}
          onChange={(e) =>
            updateItem(selectedItem.$id, {
              opacity: parseFloat(e.target.value),
            })
          }
          className="w-full accent-(--accent-500)"
        />
      </div>

      {/* ── Transform ── */}
      <SectionHeader label="Transform" />

      <div className="grid grid-cols-2 gap-2">
        <NumberInput
          label="X"
          value={selectedItem.x}
          onChange={(v) => updateItem(selectedItem.$id, { x: v })}
        />
        <NumberInput
          label="Y"
          value={selectedItem.y}
          onChange={(v) => updateItem(selectedItem.$id, { y: v })}
        />
        <NumberInput
          label="W"
          value={selectedItem.width}
          min={1}
          onChange={(v) => updateItem(selectedItem.$id, { width: v })}
        />
        <NumberInput
          label="H"
          value={selectedItem.height}
          min={1}
          onChange={(v) => updateItem(selectedItem.$id, { height: v })}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <NumberInput
          label="Rotation °"
          value={selectedItem.rotation}
          onChange={(v) => updateItem(selectedItem.$id, { rotation: v })}
        />
        <div /> {/* spacer */}
      </div>

      {/* ── Style ── */}
      {(isShape || isText || isPin || isArrow || isLine) && (
        <>
          <SectionHeader label="Style" />

          {isPin && (
            <ColorInput
              label="Pin Color"
              value={style.fill || "#e53e3e"}
              onChange={(v) => updateStyle({ fill: v })}
            />
          )}

          {(isShape || isText) && (
            <ColorInput
              label={isText ? "Text Color" : "Fill"}
              value={style.fill || (isText ? "#000000" : "#ffffff")}
              onChange={(v) => updateStyle({ fill: v })}
            />
          )}

          {(isShape || isArrow || isLine) && (
            <>
              <ColorInput
                label="Stroke"
                value={style.stroke || "#000000"}
                onChange={(v) => updateStyle({ stroke: v })}
              />
              <NumberInput
                label="Stroke Width"
                value={style.strokeWidth ?? 1}
                min={0}
                step={0.5}
                onChange={(v) => updateStyle({ strokeWidth: v })}
              />
            </>
          )}
        </>
      )}

      {/* ── Text typography ── */}
      {isText && (
        <>
          <SectionHeader label="Typography" />

          {/* Font family */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-wider text-(--gray-500)">
              Font
            </label>
            <select
              className="w-full bg-(--navy-700) border border-white/10 rounded-md px-2 py-1.5 text-xs text-white focus:outline-none focus:border-(--accent-500) transition-colors"
              value={style.fontFamily || "Arial"}
              onChange={(e) => updateStyle({ fontFamily: e.target.value })}
            >
              {FONT_FAMILIES.map((f) => (
                <option key={f} value={f} style={{ fontFamily: f }}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          {/* Font size + style */}
          <div className="grid grid-cols-2 gap-2">
            <NumberInput
              label="Size"
              value={style.fontSize ?? 16}
              min={6}
              max={200}
              onChange={(v) => updateStyle({ fontSize: v })}
            />
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-wider text-(--gray-500)">
                Style
              </label>
              <select
                className="w-full bg-(--navy-700) border border-white/10 rounded-md px-2 py-1 text-xs text-white focus:outline-none focus:border-(--accent-500) transition-colors"
                value={fontStyle || "normal"}
                onChange={(e) => updateStyle({ fontStyle: e.target.value })}
              >
                <option value="normal">Regular</option>
                <option value="bold">Bold</option>
                <option value="italic">Italic</option>
                <option value="bold italic">Bold Italic</option>
              </select>
            </div>
          </div>

          {/* Horizontal alignment */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-wider text-(--gray-500)">
              Align
            </label>
            <div className="flex gap-1">
              {(["left", "center", "right"] as const).map((a) => (
                <button
                  key={a}
                  onClick={() => updateStyle({ textAlign: a })}
                  className={`flex-1 flex items-center justify-center py-1.5 rounded-md border transition-colors
                    ${
                      (style.textAlign || "left") === a
                        ? "bg-(--accent-500) border-(--accent-500) text-white"
                        : "bg-white/5 border-white/10 text-(--gray-400) hover:bg-white/10"
                    }`}
                  title={a.charAt(0).toUpperCase() + a.slice(1)}
                >
                  {a === "left" && <AlignLeft className="w-3.5 h-3.5" />}
                  {a === "center" && <AlignCenter className="w-3.5 h-3.5" />}
                  {a === "right" && <AlignRight className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          </div>

          {/* Vertical alignment */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-wider text-(--gray-500)">
              Vertical Align
            </label>
            <div className="flex gap-1">
              {(["top", "middle", "bottom"] as const).map((a) => (
                <button
                  key={a}
                  onClick={() => updateStyle({ verticalAlign: a })}
                  className={`flex-1 py-1 rounded-md border text-[10px] uppercase tracking-wider transition-colors
                    ${
                      (verticalAlign || "top") === a
                        ? "bg-(--accent-500) border-(--accent-500) text-white"
                        : "bg-white/5 border-white/10 text-(--gray-400) hover:bg-white/10"
                    }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Text content ── */}
      {isText && (
        <>
          <SectionHeader label="Content" />
          <div className="flex flex-col gap-1">
            <textarea
              className="w-full bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-xs text-white focus:outline-none focus:border-(--accent-500) resize-none"
              value={content.text || ""}
              onChange={(e) => updateContent({ text: e.target.value })}
              rows={4}
              placeholder="Enter text…"
            />
            <p className="text-[10px] text-(--gray-500)">
              Double-click the shape on canvas to edit inline
            </p>
          </div>
        </>
      )}

      {/* ── Pin fields ── */}
      {isPin && (
        <>
          <SectionHeader label="Pin" />
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-wider text-(--gray-500)">
              Label
            </label>
            <input
              type="text"
              className="w-full bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-xs text-white focus:outline-none focus:border-(--accent-500)"
              value={content.label || ""}
              onChange={(e) => updateContent({ label: e.target.value })}
              placeholder="Pin label"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-wider text-(--gray-500)">
              Note
            </label>
            <textarea
              className="w-full bg-white/5 border border-white/10 rounded-md px-2 py-1.5 text-xs text-white focus:outline-none focus:border-(--accent-500) resize-none"
              value={content.note || ""}
              onChange={(e) => updateContent({ note: e.target.value })}
              rows={3}
              placeholder="Optional note…"
            />
          </div>
          <button
            onClick={() => setPinEditModal({ itemId: selectedItem.$id })}
            className="flex items-center justify-center gap-1.5 w-full py-2 rounded-md text-xs border border-white/10 bg-white/5 text-(--gray-300) hover:bg-white/10 hover:text-white transition-colors"
          >
            <MapPin className="w-3.5 h-3.5 text-red-400" />
            Edit Pin &amp; Photos
          </button>

          {/* Geo coordinates */}
          <SectionHeader label="Coordinates" />
          <div className="grid grid-cols-2 gap-2">
            <NumberInput
              label="Latitude"
              value={content.gpsLat ?? 0}
              step={0.000001}
              onChange={(v) => updateContent({ gpsLat: v })}
            />
            <NumberInput
              label="Longitude"
              value={content.gpsLng ?? 0}
              step={0.000001}
              onChange={(v) => updateContent({ gpsLng: v })}
            />
          </div>
          {(content.gpsLat !== undefined && content.gpsLng !== undefined) && (
            <p className="text-[10px] text-(--gray-500) font-mono">
              {content.gpsLat.toFixed(6)}°, {content.gpsLng.toFixed(6)}°
            </p>
          )}
        </>
      )}

      {/* ── Image info ── */}
      {isImage && (
        <>
          <SectionHeader label="Image" />
          <p className="text-[10px] text-(--gray-500)">
            Click the shape on canvas to replace the image.
          </p>
          {content.src && (
            <div className="rounded-md overflow-hidden border border-white/10 mt-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={content.src}
                alt="Preview"
                className="w-full h-20 object-cover"
                loading="lazy"
              />
            </div>
          )}
        </>
      )}

      {/* ── Arrow style ── */}
      {isArrow && (
        <>
          <SectionHeader label="Arrow Style" />
          <div className="flex gap-2">
            {(["none", "left", "right", "double"] as const).map((s) => (
              <button
                key={s}
                onClick={() => updateContent({ arrowStyle: s })}
                className={`flex-1 py-2 px-1 rounded-md text-[10px] uppercase tracking-wider border transition-colors
                  ${
                    (content?.arrowStyle || "right") === s
                      ? "bg-(--accent-500) border-(--accent-500) text-white"
                      : "bg-white/5 border-white/10 text-(--gray-300) hover:bg-white/10"
                  }`}
              >
                {s === "none"
                  ? "—"
                  : s === "double"
                    ? "↔"
                    : s === "right"
                      ? "→"
                      : "←"}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Multi-selection badge */}
      {selectedItemIds.length > 1 && (
        <p className="text-[10px] text-(--gray-500) text-center mt-2">
          +{selectedItemIds.length - 1} more selected — showing first item
        </p>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function RightInspectorPanel() {
  const { panels, togglePanel } = usePanels();

  const selectedItemIds = useUIStore((state) => state.selectedItemIds);
  const layers = useBoardStore((state) => state.layers);
  const itemsByLayer = useBoardStore((state) => state.itemsByLayer);
  const updateItem = useBoardStore((state) => state.updateItem);
  const moveItemToLayer = useBoardStore((state) => state.moveItemToLayer);
  const setPinEditModal = useUIStore((state) => state.setPinEditModal);

  // Resolve first selected item
  const selectedItem: BoardItem | null = (() => {
    if (selectedItemIds.length === 0) return null;
    const id = selectedItemIds[0];
    for (const items of Object.values(itemsByLayer)) {
      const found = items.find((i) => i.$id === id);
      if (found) return found;
    }
    return null;
  })();

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`
          hidden md:flex flex-col glass-panel border-l border-white/10
          transition-all duration-200 ease-in-out overflow-hidden
          ${panels.rightPanel ? "w-64" : "w-0"}
        `}
      >
        <div className="p-4 border-b border-white/10 shrink-0">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-white">Inspector</h2>
            <button
              onClick={() => togglePanel("rightPanel")}
              className="p-2 rounded-lg hover:bg-white/10 text-(--gray-400) hover:text-white transition-colors"
              aria-label="Close inspector"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <InspectorContent
            selectedItem={selectedItem}
            selectedItemIds={selectedItemIds}
            layers={layers}
            updateItem={updateItem}
            moveItemToLayer={moveItemToLayer}
            setPinEditModal={setPinEditModal}
          />
        </div>
      </aside>

      {/* Mobile: inspector as slide-over */}
      {panels.rightPanel && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
          onClick={() => togglePanel("rightPanel")}
        >
          <div
            className="absolute right-0 top-0 bottom-0 w-[85%] max-w-85 glass-heavy shadow-xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <h2 className="font-semibold text-white">Inspector</h2>
              <button
                onClick={() => togglePanel("rightPanel")}
                className="p-2 rounded-lg hover:bg-white/10 text-(--gray-400) hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <InspectorContent
                selectedItem={selectedItem}
                selectedItemIds={selectedItemIds}
                layers={layers}
                updateItem={updateItem}
                moveItemToLayer={moveItemToLayer}
                setPinEditModal={setPinEditModal}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
