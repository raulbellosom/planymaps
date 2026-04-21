"use client";

/**
 * Context Menu Component
 * Custom context menu for editor operations
 */

import { useEffect, useLayoutEffect, useRef, useState } from "react"; // useEffect kept for outside-click / escape handlers
import { useUIStore } from "@/stores/ui-store";
import { useBoardStore } from "@/stores/board-store";

interface ContextMenuProps {
  onDuplicate?: () => void;
  onDelete?: () => void;
  onGroup?: () => void;
  onUngroup?: () => void;
  onBringForward?: () => void;
  onSendBackward?: () => void;
  onBringToFront?: () => void;
  onSendToBack?: () => void;
  onToggleVisibility?: () => void;
  onToggleLock?: () => void;
}

export function ContextMenu({
  onDuplicate,
  onDelete,
  onGroup,
  onUngroup,
  onBringForward,
  onSendBackward,
  onBringToFront,
  onSendToBack,
  onToggleVisibility,
  onToggleLock,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const contextMenuPosition = useUIStore((state) => state.contextMenuPosition);
  const contextMenuTargetId = useUIStore((state) => state.contextMenuTargetId);
  const hideContextMenu = useUIStore((state) => state.hideContextMenu);
  const selectedItemIds = useUIStore((state) => state.selectedItemIds);

  // Adjusted position that keeps the menu within viewport bounds
  const [adjustedPosition, setAdjustedPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Find the selected item to check its state
  const selectedItem = useBoardStore((state) => {
    if (!contextMenuTargetId) return null;
    for (const items of Object.values(state.itemsByLayer)) {
      const item = items.find((i) => i.$id === contextMenuTargetId);
      if (item) return item;
    }
    return null;
  });

  // Clamp the menu position to stay within viewport bounds.
  // useLayoutEffect runs synchronously before the browser paints, so the user
  // never sees the menu at the raw (potentially off-screen) coordinates.
  useLayoutEffect(() => {
    if (!contextMenuPosition || !menuRef.current) {
      setAdjustedPosition(null);
      return;
    }

    const { offsetWidth: w, offsetHeight: h } = menuRef.current;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = 8; // px gap from viewport edge

    setAdjustedPosition({
      x: Math.max(margin, Math.min(contextMenuPosition.x, vw - w - margin)),
      y: Math.max(margin, Math.min(contextMenuPosition.y, vh - h - margin)),
    });
  }, [contextMenuPosition]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        hideContextMenu();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        hideContextMenu();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [hideContextMenu]);

  if (!contextMenuPosition || !contextMenuTargetId) {
    return null;
  }

  const hasSelection = selectedItemIds.length > 0;
  const canGroup = selectedItemIds.length >= 2;
  const isGrouped = selectedItem?.parentGroupId !== undefined;
  const isLocked = selectedItem?.locked ?? false;
  const isVisible = selectedItem?.visible ?? true;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-[var(--navy-800)] rounded-lg shadow-xl border border-white/10 py-1 min-w-48"
      style={{
        left: adjustedPosition?.x ?? contextMenuPosition.x,
        top: adjustedPosition?.y ?? contextMenuPosition.y,
        // Keep the menu invisible on the first paint tick while the position
        // is being clamped to avoid a visible jump.
        visibility: adjustedPosition ? "visible" : "hidden",
      }}
    >
      {/* Ordering section */}
      <div className="px-3 py-1.5 text-xs text-[var(--gray-500)] uppercase border-b border-white/10">
        Arrange
      </div>
      <MenuItem
        label="Bring Forward"
        shortcut="Ctrl+]"
        onClick={onBringForward}
        disabled={!hasSelection}
      />
      <MenuItem
        label="Send Backward"
        shortcut="Ctrl+["
        onClick={onSendBackward}
        disabled={!hasSelection}
      />
      <MenuItem
        label="Bring to Front"
        shortcut="Ctrl+Shift+]"
        onClick={onBringToFront}
        disabled={!hasSelection}
      />
      <MenuItem
        label="Send to Back"
        shortcut="Ctrl+Shift+["
        onClick={onSendToBack}
        disabled={!hasSelection}
      />

      <Divider />

      {/* Grouping section */}
      <MenuItem
        label={isGrouped ? "Ungroup" : "Group"}
        shortcut={isGrouped ? "Ctrl+Shift+G" : "Ctrl+G"}
        onClick={isGrouped ? onUngroup : onGroup}
        disabled={isGrouped ? !hasSelection : !canGroup}
      />

      <Divider />

      {/* State toggles */}
      <MenuItem
        label={isVisible ? "Hide" : "Show"}
        onClick={onToggleVisibility}
        disabled={!hasSelection}
      />
      <MenuItem
        label={isLocked ? "Unlock" : "Lock"}
        onClick={onToggleLock}
        disabled={!hasSelection}
      />

      <Divider />

      {/* Actions */}
      <MenuItem
        label="Duplicate"
        shortcut="Ctrl+D"
        onClick={onDuplicate}
        disabled={!hasSelection}
      />
      <MenuItem
        label="Delete"
        shortcut="Del"
        onClick={onDelete}
        disabled={!hasSelection || isLocked}
        danger
      />
    </div>
  );
}

interface MenuItemProps {
  label: string;
  shortcut?: string;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
}

function MenuItem({
  label,
  shortcut,
  onClick,
  disabled,
  danger,
}: MenuItemProps) {
  return (
    <button
      className={`
        w-full px-3 py-1.5 text-sm text-left flex justify-between items-center
        ${disabled ? "text-[var(--gray-600)] cursor-not-allowed" : "text-[var(--gray-300)] hover:bg-white/10"}
        ${danger && !disabled ? "text-red-400 hover:bg-red-400/10" : ""}
      `}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      <span>{label}</span>
      {shortcut && (
        <span className="text-xs text-[var(--gray-600)] ml-4">{shortcut}</span>
      )}
    </button>
  );
}

function Divider() {
  return <div className="my-1 border-t border-white/10" />;
}
