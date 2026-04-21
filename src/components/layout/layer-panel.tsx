"use client";

/**
 * Layer Panel
 * Displays layers with full management capabilities including
 * visibility, lock, opacity, reordering, and context menu
 */

import { useState, useCallback, useRef, useEffect } from "react";
import {
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Circle,
  Eye,
  EyeOff,
  GripHorizontal,
  GripVertical,
  Image as ImageIcon,
  Layers,
  Lock,
  LockOpen,
  MapPin,
  Minus,
  Plus,
  Square,
  Type,
  X,
} from "lucide-react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { usePanels } from "@/contexts/panel-context";
import { useBoardStore } from "@/stores/board-store";
import { useUIStore } from "@/stores/ui-store";
import { useHistoryStore } from "@/stores/history-store";
import type { Layer, BoardItem } from "@/types/board";
import { BlueprintModal } from "@/components/ui/blueprint-modal";
import { showSuccess, showError } from "@/lib/toast";
import { getLayerColor } from "@/lib/layer-colors";

// ─── DnD ID helpers ─────────────────────────────────────────────────────────
const makeLayerId = (id: string) => `layer:${id}` as const;
const makeItemId = (id: string) => `item:${id}` as const;

function parseId(uid: UniqueIdentifier): {
  type: "layer" | "item";
  rawId: string;
} {
  const str = String(uid);
  if (str.startsWith("layer:")) return { type: "layer", rawId: str.slice(6) };
  if (str.startsWith("item:")) return { type: "item", rawId: str.slice(5) };
  return { type: "layer", rawId: str };
}

// Icon components
const LayerIcon = () => <Layers className="w-4 h-4" />;

const VisibilityIcon = ({ visible }: { visible: boolean }) => (
  <>{visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}</>
);

const LockIcon = ({ locked }: { locked: boolean }) => (
  <>
    {locked ? <Lock className="w-4 h-4" /> : <LockOpen className="w-4 h-4" />}
  </>
);

const ChevronUpIcon = () => <ChevronUp className="w-3 h-3" />;

const ChevronDownIcon = () => <ChevronDown className="w-3 h-3" />;

const DragHandleIcon = () => <GripHorizontal className="w-4 h-4" />;

const ItemIcon = ({ type }: { type: string }) => {
  switch (type) {
    case "rectangle":
      return <Square className="w-3.5 h-3.5" />;
    case "ellipse":
      return <Circle className="w-3.5 h-3.5" />;
    case "line":
      return <Minus className="w-3.5 h-3.5 rotate-45" />;
    case "arrow":
      return <ArrowUpRight className="w-3.5 h-3.5" />;
    case "text":
      return <Type className="w-3.5 h-3.5" />;
    case "image":
      return <ImageIcon className="w-3.5 h-3.5" />;
    case "pin":
      return <MapPin className="w-3.5 h-3.5" />;
    default:
      return <Square className="w-3.5 h-3.5" />;
  }
};

// Context Menu Component
interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  canBringToFront: boolean;
  canSendToBack: boolean;
}

function LayerContextMenu({
  x,
  y,
  onClose,
  onRename,
  onDuplicate,
  onDelete,
  onBringToFront,
  onSendToBack,
  canBringToFront,
  canSendToBack,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  // Adjust position to keep menu in viewport
  const adjustedX = Math.min(x, window.innerWidth - 200);
  const adjustedY = Math.min(y, window.innerHeight - 300);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 layer-panel-bg rounded-lg shadow-xl py-1 min-w-48"
      style={{ left: adjustedX, top: adjustedY }}
    >
      <div className="px-3 py-1.5 text-xs text-gray-400 uppercase border-b border-white/10">
        Layer Options
      </div>
      <button
        className="w-full px-3 py-1.5 text-sm text-left hover:bg-white/10 text-gray-200 flex items-center gap-2"
        onClick={() => {
          onRename();
          onClose();
        }}
      >
        Rename
      </button>
      <button
        className="w-full px-3 py-1.5 text-sm text-left hover:bg-white/10 text-gray-200 flex items-center gap-2"
        onClick={() => {
          onDuplicate();
          onClose();
        }}
      >
        Duplicate Layer
      </button>
      <div className="my-1 border-t border-white/10" />
      <button
        className="w-full px-3 py-1.5 text-sm text-left hover:bg-white/10 text-gray-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={() => {
          onBringToFront();
          onClose();
        }}
        disabled={!canBringToFront}
      >
        Bring to Front
      </button>
      <button
        className="w-full px-3 py-1.5 text-sm text-left hover:bg-white/10 text-gray-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={() => {
          onSendToBack();
          onClose();
        }}
        disabled={!canSendToBack}
      >
        Send to Back
      </button>
      <div className="my-1 border-t border-white/10" />
      <button
        className="w-full px-3 py-1.5 text-sm text-left hover:bg-white/10 text-red-400 flex items-center gap-2"
        onClick={() => {
          onDelete();
          onClose();
        }}
      >
        Delete Layer
      </button>
    </div>
  );
}

// Layer Item Component
interface LayerItemProps {
  layer: Layer;
  items: BoardItem[];
  isLayerSelected: boolean;
  isLayerExpanded: boolean;
  selectedItemIds: string[];
  onSelectLayer: () => void;
  onToggleExpand: () => void;
  onSelectItem: (itemId: string, addToSelection: boolean) => void;
  onToggleLayerVisibility: () => void;
  onToggleLayerLock: () => void;
  onToggleItemVisibility: (itemId: string) => void;
  onToggleItemLock: (itemId: string) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onOpacityChange: (opacity: number) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRenameInline: (newName: string) => void;
  /** dnd-kit activator props — wired to the grip handle only */
  dragHandleProps?: {
    ref: React.RefCallback<HTMLElement>;
    listeners:
      | Record<string, React.EventHandler<React.SyntheticEvent>>
      | undefined;
    attributes: Record<string, unknown>;
  };
  canMoveUp: boolean;
  canMoveDown: boolean;
  isTopLayer: boolean;
  isBottomLayer: boolean;
}

function LayerItem({
  layer,
  items,
  isLayerSelected,
  isLayerExpanded,
  selectedItemIds,
  onSelectLayer,
  onToggleExpand,
  onSelectItem,
  onToggleLayerVisibility,
  onToggleLayerLock,
  onToggleItemVisibility,
  onToggleItemLock,
  onContextMenu,
  onOpacityChange,
  onMoveUp,
  onMoveDown,
  onRenameInline,
  dragHandleProps,
  canMoveUp,
  canMoveDown,
  isTopLayer,
  isBottomLayer,
}: LayerItemProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(layer.name);
  const [showOpacity, setShowOpacity] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Keep editedName in sync with layer.name when not actively editing
  useEffect(() => {
    if (!isEditingName) {
      setEditedName(layer.name);
    }
  }, [layer.name, isEditingName]);

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  const handleNameSubmit = () => {
    const trimmed = editedName.trim();
    if (trimmed && trimmed !== layer.name) {
      onRenameInline(trimmed);
    } else {
      setEditedName(layer.name);
    }
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleNameSubmit();
    } else if (e.key === "Escape") {
      setEditedName(layer.name);
      setIsEditingName(false);
    }
  };

  const opacityPercent = Math.round((layer.opacity ?? 1) * 100);

  return (
    <div className="select-none">
      {/* Layer header */}
      <div
        className={`
          group flex items-center gap-1 px-2 py-1.5 rounded-lg cursor-pointer
          transition-all duration-150 border
          ${
            isLayerSelected
              ? "bg-[var(--accent-500)]/20 border-[var(--accent-500)]/30 text-[var(--accent-400)]"
              : "hover:bg-white/5 border-transparent text-[var(--gray-300)]"
          }
        `}
        onClick={onSelectLayer}
        onContextMenu={onContextMenu}
      >
        {/* Drag handle — only element that initiates layer reordering drag */}
        <div
          ref={dragHandleProps?.ref}
          {...dragHandleProps?.listeners}
          {...dragHandleProps?.attributes}
          onClick={(e) => e.stopPropagation()}
          className="w-5 h-5 flex items-center justify-center rounded text-[var(--gray-600)] hover:text-[var(--gray-400)] hover:bg-white/10 cursor-grab active:cursor-grabbing opacity-30 group-hover:opacity-100 transition-opacity flex-shrink-0"
          title="Drag to reorder layer"
        >
          <DragHandleIcon />
        </div>
        {/* Expand/collapse button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand();
          }}
          className="w-5 h-5 flex items-center justify-center text-[var(--gray-500)] hover:text-white transition-colors"
        >
          <ChevronRight
            className={`w-3 h-3 transition-transform ${isLayerExpanded ? "rotate-90" : ""}`}
          />
        </button>
        {/* Visibility toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleLayerVisibility();
          }}
          className={`w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors ${
            layer.visible ? "text-[var(--gray-400)]" : "text-[var(--gray-600)]"
          }`}
          title={layer.visible ? "Hide layer" : "Show layer"}
        >
          <VisibilityIcon visible={layer.visible} />
        </button>
        {/* Lock toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleLayerLock();
          }}
          className={`w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors ${
            layer.locked ? "text-orange-400" : "text-[var(--gray-500)]"
          }`}
          title={layer.locked ? "Unlock layer" : "Lock layer"}
        >
          <LockIcon locked={layer.locked} />
        </button>
        {/* Layer color dot + icon */}
        <div className="flex items-center gap-1 text-[var(--gray-500)]">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0 ring-1 ring-white/20"
            style={{ backgroundColor: getLayerColor(layer.$id) }}
          />
          <LayerIcon />
        </div>
        {/* Layer name */}
        {isEditingName ? (
          <input
            ref={nameInputRef}
            type="text"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onBlur={handleNameSubmit}
            onKeyDown={handleNameKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 text-sm bg-transparent border-b border-[var(--accent-500)] outline-none px-1"
          />
        ) : (
          <span
            className="flex-1 text-sm truncate"
            onDoubleClick={(e) => {
              e.stopPropagation();
              setIsEditingName(true);
            }}
          >
            {layer.name}
          </span>
        )}
        {/* Opacity indicator */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowOpacity(!showOpacity);
          }}
          className="text-xs text-[var(--gray-500)] hover:text-white px-1.5 py-0.5 rounded hover:bg-white/10"
          title="Adjust opacity"
        >
          {opacityPercent}%
        </button>
        {/* Item count */}
        <span className="text-xs text-[var(--gray-500)]">{items.length}</span>
        {/* Reorder buttons */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMoveUp();
            }}
            disabled={!canMoveUp}
            className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 text-[var(--gray-500)] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Move up"
          >
            <ChevronUpIcon />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMoveDown();
            }}
            disabled={!canMoveDown}
            className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 text-[var(--gray-500)] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Move down"
          >
            <ChevronDownIcon />
          </button>
        </div>
      </div>

      {/* Opacity slider popup */}
      {showOpacity && isLayerSelected && (
        <div className="ml-8 mr-2 mt-1 p-2 layer-panel-bg rounded-lg border border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--gray-400)] w-8">Opacity</span>
            <input
              type="range"
              min="0"
              max="100"
              value={opacityPercent}
              onChange={(e) =>
                onOpacityChange(parseInt(e.target.value, 10) / 100)
              }
              className="flex-1 h-1 bg-[var(--gray-700)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-500)]"
            />
            <span className="text-xs text-[var(--gray-400)] w-8 text-right">
              {opacityPercent}%
            </span>
          </div>
        </div>
      )}

      {/* Items list is rendered by SortableLayerItem (parent) to support dnd-kit SortableContext */}
    </div>
  );
}

// ─── SortableShapeItem ────────────────────────────────────────────────────────
// Wraps each shape row inside an expanded layer with dnd-kit sortable
interface SortableShapeItemProps {
  item: BoardItem;
  layerId: string;
  isItemSelected: boolean;
  onSelectItem: (itemId: string, addToSelection: boolean) => void;
  onToggleItemVisibility: (itemId: string) => void;
  onToggleItemLock: (itemId: string) => void;
  onMoveUp: (itemId: string) => void;
  onMoveDown: (itemId: string) => void;
  onRenameInline: (itemId: string, newName: string) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  /** Called with the DOM element once mounted; null on unmount */
  setItemRef?: (itemId: string, el: HTMLElement | null) => void;
}

function SortableShapeItem({
  item,
  layerId,
  isItemSelected,
  onSelectItem,
  onToggleItemVisibility,
  onToggleItemLock,
  onMoveUp,
  onMoveDown,
  onRenameInline,
  canMoveUp,
  canMoveDown,
  setItemRef,
}: SortableShapeItemProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(item.name || "");
  const nameInputRef = useRef<HTMLInputElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: makeItemId(item.$id),
    data: { type: "item", layerId },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Keep editedName in sync when not editing
  useEffect(() => {
    if (!isEditingName) {
      setEditedName(item.name || "");
    }
  }, [item.name, isEditingName]);

  // Focus and select input when editing
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  const handleNameSubmit = () => {
    const trimmed = editedName.trim();
    if (trimmed && trimmed !== item.name) {
      onRenameInline(item.$id, trimmed);
    }
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleNameSubmit();
    } else if (e.key === "Escape") {
      setIsEditingName(false);
    }
  };

  return (
    <div
      ref={(el) => {
        setNodeRef(el);
        setItemRef?.(item.$id, el);
      }}
      style={style}
      className={`
        group flex items-center gap-1 px-2 py-1 rounded-lg
        transition-colors duration-150 cursor-pointer
        ${isItemSelected ? "bg-[var(--accent-500)]/10 text-[var(--accent-400)]" : "hover:bg-white/5 text-[var(--gray-400)]"}
        ${!item.visible ? "opacity-40" : ""}
        ${isDragging ? "opacity-40 scale-[0.97] z-10" : ""}
      `}
      onClick={() => !item.locked && onSelectItem(item.$id, false)}
      onDoubleClick={() => setIsEditingName(true)}
    >
      {/* Item drag handle */}
      <div
        ref={setActivatorNodeRef}
        {...listeners}
        {...attributes}
        onClick={(e) => e.stopPropagation()}
        className="w-4 h-4 flex items-center justify-center rounded text-[var(--gray-700)] hover:text-[var(--gray-500)] cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
        title="Drag to reorder shape"
      >
        <GripVertical className="w-3 h-3" />
      </div>

      {/* Visibility toggle */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleItemVisibility(item.$id);
        }}
        className={`w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 transition-colors ${
          item.visible ? "text-[var(--gray-500)]" : "text-[var(--gray-600)]"
        }`}
        title={item.visible ? "Hide item" : "Show item"}
      >
        <VisibilityIcon visible={item.visible} />
      </button>

      {/* Lock toggle */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleItemLock(item.$id);
        }}
        className={`w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 transition-colors ${
          item.locked ? "text-orange-400" : "text-[var(--gray-500)]"
        }`}
        title={item.locked ? "Unlock item" : "Lock item"}
      >
        <LockIcon locked={item.locked} />
      </button>

      {/* Item type icon */}
      <div className="text-[var(--gray-600)]">
        <ItemIcon type={item.type} />
      </div>

      {/* Item name - editable */}
      {isEditingName ? (
        <input
          ref={nameInputRef}
          type="text"
          value={editedName}
          onChange={(e) => setEditedName(e.target.value)}
          onKeyDown={handleNameKeyDown}
          onBlur={handleNameSubmit}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 px-1 py-0.5 text-sm bg-[var(--navy-800)] border border-[var(--accent-500)] rounded text-white focus:outline-none min-w-0"
        />
      ) : (
        <span className="flex-1 truncate text-sm">
          {item.name || "Untitled"}
        </span>
      )}

      {/* Reorder buttons */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMoveUp(item.$id);
          }}
          disabled={!canMoveUp}
          className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 text-[var(--gray-500)] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Move up"
        >
          <ChevronUpIcon />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMoveDown(item.$id);
          }}
          disabled={!canMoveDown}
          className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 text-[var(--gray-500)] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Move down"
        >
          <ChevronDownIcon />
        </button>
      </div>
    </div>
  );
}

// ─── SortableLayerItem ────────────────────────────────────────────────────────
// Wraps LayerItem with dnd-kit sortable; also acts as a drop target for shapes
interface SortableLayerItemProps extends LayerItemProps {
  onSelectItem: (itemId: string, addToSelection: boolean) => void;
  // Item-level handlers for shape items
  onMoveItemUp: (itemId: string, layerId: string) => void;
  onMoveItemDown: (itemId: string, layerId: string) => void;
  onRenameItem: (itemId: string, newName: string) => void;
  /** Callback to register / unregister item row DOM elements */
  setItemRef?: (itemId: string, el: HTMLElement | null) => void;
}

function SortableLayerItem({
  layer,
  items,
  isLayerSelected,
  isLayerExpanded,
  selectedItemIds,
  onSelectLayer,
  onToggleExpand,
  onSelectItem,
  onToggleLayerVisibility,
  onToggleLayerLock,
  onToggleItemVisibility,
  onToggleItemLock,
  onContextMenu,
  onOpacityChange,
  onMoveUp,
  onMoveDown,
  onRenameInline,
  canMoveUp,
  canMoveDown,
  isTopLayer,
  isBottomLayer,
  onMoveItemUp,
  onMoveItemDown,
  onRenameItem,
  setItemRef,
}: SortableLayerItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id: makeLayerId(layer.$id),
    data: { type: "layer" },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Reverse so highest orderIndex (front on canvas) appears at the top of the panel,
  // matching the layer ordering convention (high order = top of list = front of canvas).
  const reversedItems = [...items].reverse();
  const itemIds = reversedItems.map((i) => makeItemId(i.$id));

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        ${isDragging ? "opacity-40 scale-[0.98]" : ""}
        ${isOver ? "ring-1 ring-[var(--accent-500)] ring-offset-1 ring-offset-transparent rounded-lg" : ""}
      `}
    >
      <LayerItem
        layer={layer}
        items={items}
        isLayerSelected={isLayerSelected}
        isLayerExpanded={isLayerExpanded}
        selectedItemIds={selectedItemIds}
        onSelectLayer={onSelectLayer}
        onToggleExpand={onToggleExpand}
        onSelectItem={onSelectItem}
        onToggleLayerVisibility={onToggleLayerVisibility}
        onToggleLayerLock={onToggleLayerLock}
        onToggleItemVisibility={onToggleItemVisibility}
        onToggleItemLock={onToggleItemLock}
        onContextMenu={onContextMenu}
        onOpacityChange={onOpacityChange}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        onRenameInline={onRenameInline}
        dragHandleProps={{
          ref: setActivatorNodeRef,
          listeners: listeners as Record<
            string,
            React.EventHandler<React.SyntheticEvent>
          >,
          attributes: attributes as unknown as Record<string, unknown>,
        }}
        canMoveUp={canMoveUp}
        canMoveDown={canMoveDown}
        isTopLayer={isTopLayer}
        isBottomLayer={isBottomLayer}
      />
      {/* Per-layer sortable context for shape items */}
      {isLayerExpanded && items.length > 0 && (
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          <div className="ml-4 pl-2 border-l border-white/10 space-y-0.5">
            {reversedItems.map((item, reversedIdx) => (
              <SortableShapeItem
                key={item.$id}
                item={item}
                layerId={layer.$id}
                isItemSelected={selectedItemIds.includes(item.$id)}
                onSelectItem={onSelectItem}
                onToggleItemVisibility={onToggleItemVisibility}
                onToggleItemLock={onToggleItemLock}
                onMoveUp={(itemId) => onMoveItemUp(itemId, layer.$id)}
                onMoveDown={(itemId) => onMoveItemDown(itemId, layer.$id)}
                onRenameInline={(itemId, newName) =>
                  onRenameItem(itemId, newName)
                }
                canMoveUp={reversedIdx > 0}
                canMoveDown={reversedIdx < items.length - 1}
                setItemRef={setItemRef}
              />
            ))}
          </div>
        </SortableContext>
      )}
    </div>
  );
}

// Rename Modal Component
interface RenameModalProps {
  isOpen: boolean;
  currentName: string;
  onClose: () => void;
  onRename: (newName: string) => void;
}

function RenameModal({
  isOpen,
  currentName,
  onClose,
  onRename,
}: RenameModalProps) {
  // Initialize name directly from currentName - component remounts when isOpen changes
  const [name, setName] = useState(currentName);

  const handleSubmit = () => {
    if (name.trim()) {
      onRename(name.trim());
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <BlueprintModal
      isOpen={isOpen}
      onClose={onClose}
      title="Rename Layer"
      size="sm"
    >
      <div className="space-y-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Layer name"
          className="w-full px-3 py-2 rounded-lg bg-[var(--navy-800)] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[var(--accent-500)]"
          autoFocus
        />
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-[var(--gray-400)] hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="px-4 py-2 rounded-lg bg-[var(--accent-500)] text-white hover:bg-[var(--accent-600)] transition-colors disabled:opacity-50"
          >
            Rename
          </button>
        </div>
      </div>
    </BlueprintModal>
  );
}

// Delete Confirmation Modal Component
interface DeleteModalProps {
  isOpen: boolean;
  layerName: string;
  itemCount: number;
  onClose: () => void;
  onConfirm: () => void;
}

function DeleteModal({
  isOpen,
  layerName,
  itemCount,
  onClose,
  onConfirm,
}: DeleteModalProps) {
  if (!isOpen) return null;

  return (
    <BlueprintModal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Layer"
      size="sm"
    >
      <div className="space-y-4">
        <p className="text-[var(--gray-300)]">
          Are you sure you want to delete{" "}
          <span className="text-white font-medium">
            &quot;{layerName}&quot;
          </span>
          ?
        </p>
        {itemCount > 0 && (
          <p className="text-[var(--orange-400)] text-sm">
            This layer contains {itemCount} item{itemCount !== 1 ? "s" : ""}{" "}
            that will also be deleted.
          </p>
        )}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-[var(--gray-400)] hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </BlueprintModal>
  );
}

// Main Layer Panel Component
export function LayerPanel() {
  const { panels, togglePanel } = usePanels();

  // Panel position state for floating/dockable behavior
  const [panelPosition, setPanelPosition] = useState<{
    x: number;
    y: number;
    corner: "bottom-left" | "bottom-right" | "top-left" | "top-right";
  }>({ x: 72, y: 16, corner: "bottom-left" });
  const [isDragging, setIsDragging] = useState(false);
  const [isCustomPosition, setIsCustomPosition] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const panelStartPos = useRef({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  // Board state
  const board = useBoardStore((state) => state.board);
  const layers = useBoardStore((state) => state.layers);
  const itemsByLayer = useBoardStore((state) => state.itemsByLayer);
  const updateLayer = useBoardStore((state) => state.updateLayer);
  const updateItem = useBoardStore((state) => state.updateItem);
  const removeLayer = useBoardStore((state) => state.removeLayer);
  const createLayer = useBoardStore((state) => state.createLayer);
  const duplicateLayer = useBoardStore((state) => state.duplicateLayer);
  const reorderLayers = useBoardStore((state) => state.reorderLayers);
  const reorderItems = useBoardStore((state) => state.reorderItems);
  const moveItem = useBoardStore((state) => state.moveItem);

  // UI state
  const selectedLayerId = useUIStore((state) => state.selectedLayerId);
  const selectLayer = useUIStore((state) => state.selectLayer);
  const selectedItemIds = useUIStore((state) => state.selectedItemIds);
  const selectItem = useUIStore((state) => state.selectItem);

  // History state
  const pushEntry = useHistoryStore((state) => state.pushEntry);

  // Expanded layers state
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(new Set());

  // Ref to the scrollable list container — used for scrollIntoView logic
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Per-item row refs — keyed by item.$id, set by SortableShapeItem via callback
  const itemRowRefs = useRef<Map<string, HTMLElement>>(new Map());

  // ─── Auto-sync: when canvas selection changes, expand + scroll in panel ──
  useEffect(() => {
    if (selectedItemIds.length === 0) return;

    // Find which layers contain the selected items
    const affectedLayerIds = new Set<string>();
    for (const [layerId, items] of Object.entries(itemsByLayer)) {
      for (const item of items) {
        if (selectedItemIds.includes(item.$id)) {
          affectedLayerIds.add(layerId);
        }
      }
    }
    if (affectedLayerIds.size === 0) return;

    // Expand all affected layers
    setExpandedLayers((prev) => {
      const next = new Set(prev);
      for (const id of affectedLayerIds) next.add(id);
      return next;
    });

    // Switch the active layer to the first affected layer (in sorted order)
    const firstAffected = [...layers]
      .sort((a, b) => b.order - a.order)
      .find((l) => affectedLayerIds.has(l.$id));
    if (firstAffected && firstAffected.$id !== selectedLayerId) {
      selectLayer(firstAffected.$id);
    }

    // Scroll the first selected item into view after React has expanded the rows
    const firstSelectedId = selectedItemIds[0];
    requestAnimationFrame(() => {
      const el = itemRowRefs.current.get(firstSelectedId);
      if (el && scrollContainerRef.current) {
        el.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItemIds]);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    layer: Layer;
  } | null>(null);

  // Rename modal state
  const [renameModal, setRenameModal] = useState<{
    isOpen: boolean;
    layer: Layer | null;
  }>({ isOpen: false, layer: null });

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    layer: Layer | null;
  }>({ isOpen: false, layer: null });

  // dnd-kit sensors — distance:1 so grip-handle drags start immediately
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 1 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Active drag ID (null when idle)
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

  // Sorted layers (high order = front = top of list; b.order - a.order for descending)
  const sortedLayers = [...layers].sort((a, b) => b.order - a.order);

  // Toggle expanded
  const toggleExpanded = (layerId: string) => {
    setExpandedLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layerId)) {
        next.delete(layerId);
      } else {
        next.add(layerId);
      }
      return next;
    });
  };

  // Toggle layer visibility
  const toggleLayerVisibility = useCallback(
    (layerId: string) => {
      const layer = layers.find((l) => l.$id === layerId);
      if (layer) {
        const newVisible = !layer.visible;
        // Capture history
        pushEntry({
          type: "TOGGLE_LAYER_VISIBILITY",
          description: `${newVisible ? "Show" : "Hide"} layer "${layer.name}"`,
          layerId,
          previousLayerState: { visible: layer.visible },
          newLayerState: { visible: newVisible },
        });
        updateLayer(layerId, { visible: newVisible });
      }
    },
    [layers, pushEntry, updateLayer],
  );

  // Toggle layer lock
  const toggleLayerLock = useCallback(
    (layerId: string) => {
      const layer = layers.find((l) => l.$id === layerId);
      if (layer) {
        const newLocked = !layer.locked;
        pushEntry({
          type: "TOGGLE_LAYER_LOCK",
          description: `${newLocked ? "Lock" : "Unlock"} layer "${layer.name}"`,
          layerId,
          previousLayerState: { locked: layer.locked },
          newLayerState: { locked: newLocked },
        });
        updateLayer(layerId, { locked: newLocked });
      }
    },
    [layers, pushEntry, updateLayer],
  );

  // Toggle item visibility
  const toggleItemVisibility = (itemId: string) => {
    for (const items of Object.values(itemsByLayer)) {
      const item = items.find((i) => i.$id === itemId);
      if (item) {
        updateItem(itemId, { visible: !item.visible });
        break;
      }
    }
  };

  // Toggle item lock
  const toggleItemLock = (itemId: string) => {
    for (const items of Object.values(itemsByLayer)) {
      const item = items.find((i) => i.$id === itemId);
      if (item) {
        updateItem(itemId, { locked: !item.locked });
        break;
      }
    }
  };

  // Set layer opacity
  const setLayerOpacity = useCallback(
    (layerId: string, opacity: number) => {
      const layer = layers.find((l) => l.$id === layerId);
      if (layer) {
        pushEntry({
          type: "CHANGE_LAYER_OPACITY",
          description: `Change opacity of "${layer.name}"`,
          layerId,
          previousLayerState: { opacity: layer.opacity },
          newLayerState: { opacity },
        });
        updateLayer(layerId, { opacity });
      }
    },
    [layers, pushEntry, updateLayer],
  );

  // Rename layer
  const handleRenameLayer = useCallback(
    (layerId: string, newName: string) => {
      const layer = layers.find((l) => l.$id === layerId);
      if (layer) {
        pushEntry({
          type: "UPDATE_LAYER",
          description: `Rename "${layer.name}" to "${newName}"`,
          layerId,
          previousLayerState: { name: layer.name },
          newLayerState: { name: newName },
        });
        updateLayer(layerId, { name: newName });
      }
    },
    [layers, pushEntry, updateLayer],
  );

  // Create layer (with history)
  const handleCreateLayer = useCallback(() => {
    if (!board) return;
    const previousLayers = [...layers];
    const previousItemsByLayer = { ...itemsByLayer };
    const newLayer = createLayer(board.$id);
    const { layers: newLayers, itemsByLayer: newItemsByLayer } =
      useBoardStore.getState();
    pushEntry({
      type: "CREATE_LAYER",
      description: `Create layer "${newLayer.name}"`,
      previousLayers,
      previousItemsByLayer,
      newLayers,
      newItemsByLayer,
    });
    selectLayer(newLayer.$id);
  }, [board, layers, itemsByLayer, createLayer, selectLayer, pushEntry]);

  // Duplicate layer
  const handleDuplicateLayer = useCallback(
    (layerId: string) => {
      const layer = layers.find((l) => l.$id === layerId);
      if (layer) {
        const previousLayers = [...layers];
        const previousItemsByLayer = { ...itemsByLayer };
        const newLayer = duplicateLayer(layerId);
        if (newLayer) {
          const { layers: newLayers, itemsByLayer: newItemsByLayer } =
            useBoardStore.getState();
          pushEntry({
            type: "CREATE_LAYER",
            description: `Duplicate layer "${layer.name}"`,
            previousLayers,
            previousItemsByLayer,
            newLayers,
            newItemsByLayer,
          });
          selectLayer(newLayer.$id);
          showSuccess(
            "Layer duplicated",
            `"${layer.name}" was duplicated as "${newLayer.name}"`,
          );
        }
      }
    },
    [layers, itemsByLayer, duplicateLayer, selectLayer, pushEntry],
  );

  // Delete layer
  const handleDeleteLayer = useCallback(() => {
    if (!deleteModal.layer) return;

    const layer = deleteModal.layer;

    // Check minimum 1 layer protection
    if (layers.length <= 1) {
      showError("Cannot delete", "At least one layer must remain");
      setDeleteModal({ isOpen: false, layer: null });
      return;
    }

    // Capture history before deletion
    pushEntry({
      type: "DELETE_LAYER",
      description: `Delete layer "${layer.name}"`,
      previousLayers: layers,
      previousItemsByLayer: itemsByLayer,
      newLayers: layers.filter((l) => l.$id !== layer.$id),
      newItemsByLayer: Object.fromEntries(
        Object.entries(itemsByLayer).filter(([key]) => key !== layer.$id),
      ),
      layerId: layer.$id,
    });

    // Remove layer
    removeLayer(layer.$id);

    // Select another layer if the deleted one was selected
    if (selectedLayerId === layer.$id) {
      const remainingLayers = layers.filter((l) => l.$id !== layer.$id);
      if (remainingLayers.length > 0) {
        selectLayer(remainingLayers[0].$id);
      }
    }

    showSuccess("Layer deleted", `"${layer.name}" was deleted`);
    setDeleteModal({ isOpen: false, layer: null });
  }, [
    deleteModal,
    layers,
    itemsByLayer,
    selectedLayerId,
    pushEntry,
    removeLayer,
    selectLayer,
  ]);

  // Move layer up
  const handleMoveLayerUp = useCallback(
    (layerId: string) => {
      const sorted = [...layers].sort((a, b) => a.order - b.order);
      const index = sorted.findIndex((l) => l.$id === layerId);

      if (index < sorted.length - 1) {
        const previousLayers = [...layers];
        const newLayers = [...sorted];
        const temp = newLayers[index];
        newLayers[index] = newLayers[index + 1];
        newLayers[index + 1] = temp;

        const orderedNewLayers = newLayers.map((l, i) => ({ ...l, order: i }));
        pushEntry({
          type: "REORDER_LAYERS",
          description: "Move layer up",
          previousLayers,
          newLayers: orderedNewLayers,
        });

        reorderLayers(newLayers.map((l) => l.$id));
      }
    },
    [layers, pushEntry, reorderLayers],
  );

  // Move layer down
  const handleMoveLayerDown = useCallback(
    (layerId: string) => {
      const sorted = [...layers].sort((a, b) => a.order - b.order);
      const index = sorted.findIndex((l) => l.$id === layerId);

      if (index > 0) {
        const previousLayers = [...layers];
        const newLayers = [...sorted];
        const temp = newLayers[index];
        newLayers[index] = newLayers[index - 1];
        newLayers[index - 1] = temp;

        const orderedNewLayers = newLayers.map((l, i) => ({ ...l, order: i }));
        pushEntry({
          type: "REORDER_LAYERS",
          description: "Move layer down",
          previousLayers,
          newLayers: orderedNewLayers,
        });

        reorderLayers(newLayers.map((l) => l.$id));
      }
    },
    [layers, pushEntry, reorderLayers],
  );

  // Bring layer to front
  const handleBringToFront = useCallback(
    (layerId: string) => {
      const sorted = [...layers].sort((a, b) => a.order - b.order);
      const layer = sorted.find((l) => l.$id === layerId);
      if (!layer) return;

      const previousLayers = [...layers];
      const newLayers = [...sorted];
      const index = newLayers.indexOf(layer);
      const [removed] = newLayers.splice(index, 1);
      newLayers.push(removed);

      const orderedNewLayers = newLayers.map((l, i) => ({ ...l, order: i }));
      pushEntry({
        type: "REORDER_LAYERS",
        description: `Bring "${layer.name}" to front`,
        previousLayers,
        newLayers: orderedNewLayers,
      });

      reorderLayers(newLayers.map((l) => l.$id));
    },
    [layers, pushEntry, reorderLayers],
  );

  // Move item up
  const handleMoveItemUp = useCallback(
    (itemId: string, layerId: string) => {
      const items = itemsByLayer[layerId] || [];
      const sorted = [...items].sort((a, b) => a.orderIndex - b.orderIndex);
      const index = sorted.findIndex((i) => i.$id === itemId);

      if (index < sorted.length - 1) {
        const previousItemsByLayer = { ...itemsByLayer };
        const newItems = [...sorted];
        const temp = newItems[index];
        newItems[index] = newItems[index + 1];
        newItems[index + 1] = temp;

        // Update orderIndex for all items
        const itemIds = newItems.map((item) => item.$id);
        const orderedNewItems = newItems.map((item, i) => ({
          ...item,
          orderIndex: i,
        }));
        pushEntry({
          type: "REORDER_ITEMS",
          description: "Move item up",
          previousItemsByLayer,
          newItemsByLayer: { ...itemsByLayer, [layerId]: orderedNewItems },
        });
        reorderItems(layerId, itemIds);
      }
    },
    [itemsByLayer, pushEntry, reorderItems],
  );

  // Move item down
  const handleMoveItemDown = useCallback(
    (itemId: string, layerId: string) => {
      const items = itemsByLayer[layerId] || [];
      const sorted = [...items].sort((a, b) => a.orderIndex - b.orderIndex);
      const index = sorted.findIndex((i) => i.$id === itemId);

      if (index > 0) {
        const previousItemsByLayer = { ...itemsByLayer };
        const newItems = [...sorted];
        const temp = newItems[index];
        newItems[index] = newItems[index - 1];
        newItems[index - 1] = temp;

        const itemIds = newItems.map((item) => item.$id);
        const orderedNewItems = newItems.map((item, i) => ({
          ...item,
          orderIndex: i,
        }));
        pushEntry({
          type: "REORDER_ITEMS",
          description: "Move item down",
          previousItemsByLayer,
          newItemsByLayer: { ...itemsByLayer, [layerId]: orderedNewItems },
        });
        reorderItems(layerId, itemIds);
      }
    },
    [itemsByLayer, pushEntry, reorderItems],
  );

  // Rename item
  const handleRenameItem = useCallback(
    (itemId: string, newName: string) => {
      updateItem(itemId, { name: newName });
    },
    [updateItem],
  );

  // Register/unregister item row DOM elements for scroll-into-view
  const handleSetItemRef = useCallback(
    (itemId: string, el: HTMLElement | null) => {
      if (el) {
        itemRowRefs.current.set(itemId, el);
      } else {
        itemRowRefs.current.delete(itemId);
      }
    },
    [],
  );

  // Send layer to back
  const handleSendToBack = useCallback(
    (layerId: string) => {
      const sorted = [...layers].sort((a, b) => a.order - b.order);
      const layer = sorted.find((l) => l.$id === layerId);
      if (!layer) return;

      const previousLayers = [...layers];
      const newLayers = [...sorted];
      const index = newLayers.indexOf(layer);
      const [removed] = newLayers.splice(index, 1);
      newLayers.unshift(removed);

      const orderedNewLayers = newLayers.map((l, i) => ({ ...l, order: i }));
      pushEntry({
        type: "REORDER_LAYERS",
        description: `Send "${layer.name}" to back`,
        previousLayers,
        newLayers: orderedNewLayers,
      });

      reorderLayers(newLayers.map((l) => l.$id));
    },
    [layers, pushEntry, reorderLayers],
  );

  // Context menu handler
  const handleContextMenu = (e: React.MouseEvent, layer: Layer) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, layer });
  };

  // ─── dnd-kit event handlers ───────────────────────────────────────────────

  const handleDndDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id);
  }, []);

  const handleDndDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over || active.id === over.id) return;

      const activeParsed = parseId(active.id);
      const overParsed = parseId(over.id);

      if (activeParsed.type === "layer" && overParsed.type === "layer") {
        // ── Layer reorder ──────────────────────────────────────────────────
        // sortedLayers is ordered high→low (front→back); use ascending for store
        const ascending = [...layers].sort((a, b) => a.order - b.order);
        const oldIndex = ascending.findIndex(
          (l) => l.$id === activeParsed.rawId,
        );
        const newIndex = ascending.findIndex((l) => l.$id === overParsed.rawId);
        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

        const previousLayers = [...layers];
        const newLayers = arrayMove(ascending, oldIndex, newIndex);

        const orderedNewLayers = newLayers.map((l, i) => ({ ...l, order: i }));
        pushEntry({
          type: "REORDER_LAYERS",
          description: "Reorder layers",
          previousLayers,
          newLayers: orderedNewLayers,
        });
        reorderLayers(newLayers.map((l) => l.$id));
        return;
      }

      if (activeParsed.type === "item") {
        // Find source layer (item has NOT been optimistically moved — still in original layer)
        let sourceLayerId: string | undefined;
        let sourceLayerItems: BoardItem[] = [];
        for (const [lid, items] of Object.entries(itemsByLayer)) {
          if (items.some((i) => i.$id === activeParsed.rawId)) {
            sourceLayerId = lid;
            sourceLayerItems = items;
            break;
          }
        }
        if (!sourceLayerId) return;

        // Find target layer: dnd-kit passes data set on useSortable through over.data.current
        let targetLayerId: string | undefined;
        if (overParsed.type === "layer") {
          targetLayerId = overParsed.rawId;
        } else {
          targetLayerId = over.data.current?.layerId as string | undefined;
        }
        if (!targetLayerId) return;

        if (sourceLayerId !== targetLayerId) {
          // ── Cross-layer move ─────────────────────────────────────────────
          const prevSnapshot = Object.fromEntries(
            Object.entries(itemsByLayer).map(([k, v]) => [k, [...v]]),
          );
          const targetItems = itemsByLayer[targetLayerId] ?? [];
          moveItem(
            activeParsed.rawId,
            sourceLayerId,
            targetLayerId,
            targetItems.length,
          );
          const movedItem = (prevSnapshot[sourceLayerId] ?? []).find(
            (i) => i.$id === activeParsed.rawId,
          );
          const newSnapshot = {
            ...prevSnapshot,
            [sourceLayerId]: (prevSnapshot[sourceLayerId] ?? []).filter(
              (i) => i.$id !== activeParsed.rawId,
            ),
            [targetLayerId]: movedItem
              ? [...(prevSnapshot[targetLayerId] ?? []), movedItem]
              : (prevSnapshot[targetLayerId] ?? []),
          };
          pushEntry({
            type: "MOVE_ITEM_TO_LAYER",
            description: "Move shape to different layer",
            itemId: activeParsed.rawId,
            previousLayerId: sourceLayerId,
            newLayerId: targetLayerId,
            previousItemsByLayer: prevSnapshot,
            newItemsByLayer: newSnapshot,
          });
          return;
        }

        // ── Same-layer item reorder ────────────────────────────────────────
        if (overParsed.type !== "item") return;
        const oldIdx = sourceLayerItems.findIndex(
          (i) => i.$id === activeParsed.rawId,
        );
        const newIdx = sourceLayerItems.findIndex(
          (i) => i.$id === overParsed.rawId,
        );
        if (oldIdx === -1 || newIdx === -1 || oldIdx === newIdx) return;

        const previousItemsByLayer = Object.fromEntries(
          Object.entries(itemsByLayer).map(([k, v]) => [k, [...v]]),
        );
        const reordered = arrayMove(sourceLayerItems, oldIdx, newIdx);
        const orderedReordered = reordered.map((item, i) => ({
          ...item,
          orderIndex: i,
        }));
        pushEntry({
          type: "REORDER_ITEMS",
          description: "Reorder shapes",
          previousItemsByLayer,
          newItemsByLayer: {
            ...previousItemsByLayer,
            [sourceLayerId]: orderedReordered,
          },
        });
        reorderItems(
          sourceLayerId,
          reordered.map((i) => i.$id),
        );
      }
    },
    [layers, itemsByLayer, pushEntry, reorderLayers, reorderItems, moveItem],
  );

  const handleDndDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  // Panel drag handlers for repositioning
  const handlePanelDragStart = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    e.preventDefault();
    e.stopPropagation();
    if (panelRef.current) {
      const rect = panelRef.current.getBoundingClientRect();
      dragStartPos.current = { x: e.clientX, y: e.clientY };
      panelStartPos.current = { x: rect.left, y: rect.top };
      // Convert corner-based position to absolute top/left coords NOW, before
      // isDragging becomes true and getPanelStyle() switches to the left/top path.
      // All three setters are batched into one render, so no visual jump occurs.
      setIsCustomPosition(true);
      setPanelPosition((prev) => ({ ...prev, x: rect.left, y: rect.top }));
    } else {
      dragStartPos.current = { x: e.clientX, y: e.clientY };
      panelStartPos.current = { x: panelPosition.x, y: panelPosition.y };
    }
    setIsDragging(true);
  };

  const handlePanelDrag = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - dragStartPos.current.x;
      const deltaY = e.clientY - dragStartPos.current.y;
      const newX = panelStartPos.current.x + deltaX;
      const newY = panelStartPos.current.y + deltaY;

      // Clamp position to keep panel within viewport bounds
      const panelWidth = 320; // Approximate panel width
      const panelHeight = 560; // Approximate panel height
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const minVisible = 50; // Minimum pixels of panel that must remain visible

      const clampedX = Math.max(
        -panelWidth + minVisible,
        Math.min(newX, viewportWidth - minVisible),
      );
      const clampedY = Math.max(
        -panelHeight + minVisible,
        Math.min(newY, viewportHeight - minVisible),
      );

      // Mark as custom position since we're freely dragging
      setIsCustomPosition(true);
      // Update position without corner snapping during drag
      setPanelPosition((prev) => ({
        ...prev,
        x: clampedX,
        y: clampedY,
        corner: prev.corner,
      }));
    },
    [isDragging],
  );

  const handlePanelDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Reset panel to a corner position
  const resetPanelPosition = useCallback(
    (corner: typeof panelPosition.corner = "bottom-left") => {
      setIsCustomPosition(false);
      setPanelPosition((prev) => ({
        ...prev,
        x: 16,
        y: 16,
        corner,
      }));
    },
    [],
  );

  // Add document-level event listeners when dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handlePanelDrag);
      document.addEventListener("mouseup", handlePanelDragEnd);
      return () => {
        document.removeEventListener("mousemove", handlePanelDrag);
        document.removeEventListener("mouseup", handlePanelDragEnd);
      };
    }
  }, [isDragging, handlePanelDrag, handlePanelDragEnd]);

  // Validate panel position is within viewport bounds when not dragging
  useEffect(() => {
    if (isDragging || !panels.layerPanel) return;

    const panelWidth = 320;
    const panelHeight = 560;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const margin = 16;
    const minVisible = 50;

    // Check if panel is outside viewport bounds
    const needsReset =
      panelPosition.x < -panelWidth + minVisible ||
      panelPosition.y < -panelHeight + minVisible ||
      panelPosition.x > viewportWidth - minVisible ||
      panelPosition.y > viewportHeight - minVisible;

    if (needsReset && isCustomPosition) {
      // Reset to a valid corner position
      setIsCustomPosition(false);
      setPanelPosition((prev) => ({
        ...prev,
        x: margin,
        y: margin,
        corner: "bottom-left",
      }));
    }
  }, [isDragging, panels.layerPanel, panelPosition, isCustomPosition]);

  // Calculate position style based on corner and drag state
  const getPanelStyle = () => {
    // If we're custom positioned (freely dragged), always use absolute coords
    if (isCustomPosition || isDragging) {
      return {
        left: panelPosition.x,
        top: panelPosition.y,
      };
    }
    // When not dragging and not custom positioned, snap to corner with margin
    const margin = 16;
    const { corner } = panelPosition;
    switch (corner) {
      case "bottom-left":
        return { bottom: margin, left: margin };
      case "bottom-right":
        return { bottom: margin, right: margin };
      case "top-left":
        return { top: margin, left: margin };
      case "top-right":
        return { top: margin, right: margin };
    }
  };

  // ─── DragOverlay content ─────────────────────────────────────────────────
  const renderDragOverlay = () => {
    if (!activeId) return null;
    const { type, rawId } = parseId(activeId);

    if (type === "layer") {
      const layer = layers.find((l) => l.$id === rawId);
      if (!layer) return null;
      return (
        <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-[var(--navy-900)] border border-[var(--accent-500)]/60 shadow-xl scale-105 cursor-grabbing opacity-95 w-72">
          <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
            <GripHorizontal className="w-4 h-4 text-[var(--accent-400)]" />
          </div>
          <span
            className="w-2 h-2 rounded-full flex-shrink-0 ring-1 ring-white/20"
            style={{ backgroundColor: getLayerColor(layer.$id) }}
          />
          <LayerIcon />
          <span className="flex-1 text-sm text-white truncate ml-1">
            {layer.name}
          </span>
          <span className="text-xs text-[var(--gray-500)]">
            {(itemsByLayer[layer.$id] ?? []).length}
          </span>
        </div>
      );
    }

    // type === "item"
    let foundItem: BoardItem | undefined;
    for (const items of Object.values(itemsByLayer)) {
      foundItem = items.find((i) => i.$id === rawId);
      if (foundItem) break;
    }
    if (!foundItem) return null;
    return (
      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--navy-900)] border border-[var(--accent-500)]/60 shadow-xl scale-105 cursor-grabbing opacity-95 w-64">
        <GripVertical className="w-3 h-3 text-[var(--accent-400)] flex-shrink-0" />
        <ItemIcon type={foundItem.type} />
        <span className="flex-1 text-xs text-white truncate ml-1">
          {foundItem.name}
        </span>
      </div>
    );
  };

  return (
    <>
      {/* Desktop sidebar - layer panel floating/dockable */}
      <aside
        ref={panelRef}
        className={`
          hidden md:flex flex-col layer-panel-bg border border-white/10 rounded-lg shadow-2xl
          transition-all duration-200 ease-in-out
          ${panels.layerPanel ? "w-80 h-[560px]" : "w-0 h-0 overflow-hidden"}
          ${isDragging ? "cursor-grabbing opacity-90" : ""}
        `}
        style={{
          position: "absolute",
          ...getPanelStyle(),
        }}
      >
        {/* Drag handle area */}
        <div
          className="p-3 border-b border-white/10 flex justify-between items-center cursor-move"
          onMouseDown={handlePanelDragStart}
        >
          <h2 className="font-semibold text-sm text-white">Layers</h2>
          <div className="flex items-center gap-2">
            {/* Quick create layer button */}
            {board && (
              <button
                onClick={handleCreateLayer}
                className="p-1 rounded-lg hover:bg-white/10 text-[var(--gray-400)] hover:text-white transition-colors"
                title="Create layer"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => togglePanel("layerPanel")}
              className="p-1.5 rounded-lg hover:bg-white/10 text-[var(--gray-400)] hover:text-white transition-colors"
              aria-label="Close layer panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div ref={scrollContainerRef} className="flex-1 p-2 overflow-auto">
          {sortedLayers.length === 0 ? (
            <div className="text-sm text-[var(--gray-500)] text-center py-8">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white/5 flex items-center justify-center">
                <LayerIcon />
              </div>
              <p className="mb-2">No layers yet</p>
              {board && (
                <button
                  onClick={handleCreateLayer}
                  className="text-[var(--accent-400)] hover:text-[var(--accent-300)] text-sm"
                >
                  Create your first layer
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDndDragStart}
                onDragEnd={handleDndDragEnd}
                onDragCancel={handleDndDragCancel}
              >
                <SortableContext
                  items={sortedLayers.map((l) => makeLayerId(l.$id))}
                  strategy={verticalListSortingStrategy}
                >
                  {sortedLayers.map((layer, index) => (
                    <SortableLayerItem
                      key={layer.$id}
                      layer={layer}
                      items={itemsByLayer[layer.$id] || []}
                      isLayerSelected={selectedLayerId === layer.$id}
                      isLayerExpanded={expandedLayers.has(layer.$id)}
                      selectedItemIds={selectedItemIds}
                      onSelectLayer={() => selectLayer(layer.$id)}
                      onToggleExpand={() => toggleExpanded(layer.$id)}
                      onSelectItem={selectItem}
                      onToggleLayerVisibility={() =>
                        toggleLayerVisibility(layer.$id)
                      }
                      onToggleLayerLock={() => toggleLayerLock(layer.$id)}
                      onToggleItemVisibility={toggleItemVisibility}
                      onToggleItemLock={toggleItemLock}
                      onContextMenu={(e) => handleContextMenu(e, layer)}
                      onOpacityChange={(opacity) =>
                        setLayerOpacity(layer.$id, opacity)
                      }
                      onMoveUp={() => handleMoveLayerUp(layer.$id)}
                      onMoveDown={() => handleMoveLayerDown(layer.$id)}
                      onRenameInline={(newName) =>
                        handleRenameLayer(layer.$id, newName)
                      }
                      onMoveItemUp={handleMoveItemUp}
                      onMoveItemDown={handleMoveItemDown}
                      onRenameItem={handleRenameItem}
                      setItemRef={handleSetItemRef}
                      canMoveUp={index > 0}
                      canMoveDown={index < sortedLayers.length - 1}
                      isTopLayer={index === 0}
                      isBottomLayer={index === sortedLayers.length - 1}
                    />
                  ))}
                </SortableContext>
                <DragOverlay
                  dropAnimation={{
                    duration: 250,
                    easing: "cubic-bezier(0.25, 1, 0.5, 1)",
                  }}
                >
                  {renderDragOverlay()}
                </DragOverlay>
              </DndContext>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile: layer panel as bottom sheet */}
      {panels.layerPanel && (
        <div
          className="md:hidden fixed inset-x-0 bottom-0 z-30 bg-black/60 backdrop-blur-sm"
          onClick={() => togglePanel("layerPanel")}
        >
          <div
            className="layer-panel-bg rounded-t-2xl shadow-xl max-h-[70vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <h2 className="font-semibold text-white">Layers</h2>
              <div className="flex items-center gap-2">
                {board && (
                  <button
                    onClick={handleCreateLayer}
                    className="p-1 rounded-lg hover:bg-white/10 text-[var(--gray-400)] hover:text-white transition-colors"
                    title="Create layer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => togglePanel("layerPanel")}
                  className="p-2 rounded-lg hover:bg-white/10 text-[var(--gray-400)] hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-4 max-h-64 overflow-auto">
              {sortedLayers.length === 0 ? (
                <div className="text-sm text-[var(--gray-500)] text-center py-4">
                  No layers yet
                </div>
              ) : (
                <div className="space-y-1">
                  {sortedLayers.map((layer, index) => (
                    <SortableLayerItem
                      key={layer.$id}
                      layer={layer}
                      items={itemsByLayer[layer.$id] || []}
                      isLayerSelected={selectedLayerId === layer.$id}
                      isLayerExpanded={expandedLayers.has(layer.$id)}
                      selectedItemIds={selectedItemIds}
                      onSelectLayer={() => selectLayer(layer.$id)}
                      onToggleExpand={() => toggleExpanded(layer.$id)}
                      onSelectItem={selectItem}
                      onToggleLayerVisibility={() =>
                        toggleLayerVisibility(layer.$id)
                      }
                      onToggleLayerLock={() => toggleLayerLock(layer.$id)}
                      onToggleItemVisibility={toggleItemVisibility}
                      onToggleItemLock={toggleItemLock}
                      onContextMenu={(e) => handleContextMenu(e, layer)}
                      onOpacityChange={(opacity) =>
                        setLayerOpacity(layer.$id, opacity)
                      }
                      onMoveUp={() => handleMoveLayerUp(layer.$id)}
                      onMoveDown={() => handleMoveLayerDown(layer.$id)}
                      onRenameInline={(newName) =>
                        handleRenameLayer(layer.$id, newName)
                      }
                      onMoveItemUp={handleMoveItemUp}
                      onMoveItemDown={handleMoveItemDown}
                      onRenameItem={handleRenameItem}
                      setItemRef={handleSetItemRef}
                      canMoveUp={index > 0}
                      canMoveDown={index < sortedLayers.length - 1}
                      isTopLayer={index === 0}
                      isBottomLayer={index === sortedLayers.length - 1}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <LayerContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onRename={() =>
            setRenameModal({ isOpen: true, layer: contextMenu.layer })
          }
          onDuplicate={() => handleDuplicateLayer(contextMenu.layer.$id)}
          onDelete={() =>
            setDeleteModal({ isOpen: true, layer: contextMenu.layer })
          }
          onBringToFront={() => handleBringToFront(contextMenu.layer.$id)}
          onSendToBack={() => handleSendToBack(contextMenu.layer.$id)}
          canBringToFront={!contextMenu.layer.locked}
          canSendToBack={!contextMenu.layer.locked}
        />
      )}

      {/* Rename Modal — key forces remount per layer so useState initializes fresh */}
      <RenameModal
        key={renameModal.layer?.$id ?? "none"}
        isOpen={renameModal.isOpen}
        currentName={renameModal.layer?.name || ""}
        onClose={() => setRenameModal({ isOpen: false, layer: null })}
        onRename={(newName) => {
          if (renameModal.layer) {
            handleRenameLayer(renameModal.layer.$id, newName);
          }
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={deleteModal.isOpen}
        layerName={deleteModal.layer?.name || ""}
        itemCount={
          deleteModal.layer
            ? itemsByLayer[deleteModal.layer.$id]?.length || 0
            : 0
        }
        onClose={() => setDeleteModal({ isOpen: false, layer: null })}
        onConfirm={handleDeleteLayer}
      />
    </>
  );
}
