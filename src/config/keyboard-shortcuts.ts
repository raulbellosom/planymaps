/**
 * Keyboard Shortcuts Configuration
 * All keyboard shortcuts for tools and system actions
 */

import type { ToolType } from "@/stores/ui-store";

export interface ShortcutConfig {
  key: string;
  modifiers?: ("ctrl" | "shift" | "alt" | "meta")[];
  title: string;
  description: string;
  category: "tool" | "layer" | "selection" | "navigation" | "system";
}

/**
 * Tool shortcuts - single keys for quick tool switching
 * Simple mapping of tool to shortcut key for tooltips
 */
export const TOOL_SHORTCUTS: Record<ToolType, string> = {
  select: "V",
  rectangle: "R",
  ellipse: "O",
  line: "L",
  arrow: "A",
  text: "T",
  image: "I",
  pin: "P",
  hand: "H",
};

/**
 * System shortcuts with modifiers
 */
export const SYSTEM_SHORTCUTS: ShortcutConfig[] = [
  {
    key: "z",
    modifiers: ["ctrl"],
    title: "Undo",
    description: "Undo last action",
    category: "system",
  },
  {
    key: "z",
    modifiers: ["ctrl", "shift"],
    title: "Redo",
    description: "Redo previously undone action",
    category: "system",
  },
  {
    key: "y",
    modifiers: ["ctrl"],
    title: "Redo (Alt)",
    description: "Redo previously undone action",
    category: "system",
  },
  {
    key: "n",
    modifiers: ["ctrl", "alt"],
    title: "Create Layer",
    description: "Create a new layer",
    category: "layer",
  },
  {
    key: "l",
    modifiers: ["ctrl"],
    title: "Toggle Layer Lock",
    description: "Lock or unlock the selected layer",
    category: "layer",
  },
  {
    key: "l",
    modifiers: ["ctrl", "shift"],
    title: "Toggle Layer Visibility",
    description: "Show or hide the selected layer",
    category: "layer",
  },
  {
    key: "[",
    modifiers: ["ctrl"],
    title: "Send Layer Backward",
    description: "Move layer one position back",
    category: "layer",
  },
  {
    key: "]",
    modifiers: ["ctrl"],
    title: "Bring Layer Forward",
    description: "Move layer one position forward",
    category: "layer",
  },
  {
    key: "[",
    modifiers: ["ctrl", "shift"],
    title: "Send Layer to Back",
    description: "Move layer to the back of the stack",
    category: "layer",
  },
  {
    key: "]",
    modifiers: ["ctrl", "shift"],
    title: "Bring Layer to Front",
    description: "Move layer to the front of the stack",
    category: "layer",
  },
  {
    key: "Delete",
    modifiers: [],
    title: "Delete Selection",
    description: "Delete selected items",
    category: "selection",
  },
  {
    key: "Backspace",
    modifiers: [],
    title: "Delete Selection",
    description: "Delete selected items",
    category: "selection",
  },
  {
    key: "d",
    modifiers: ["ctrl"],
    title: "Duplicate",
    description: "Duplicate selected items",
    category: "selection",
  },
  {
    key: "a",
    modifiers: ["ctrl"],
    title: "Select All",
    description: "Select all items in active layer",
    category: "selection",
  },
  {
    key: "Escape",
    modifiers: [],
    title: "Clear Selection",
    description: "Deselect all items",
    category: "selection",
  },
  {
    key: "g",
    modifiers: ["ctrl"],
    title: "Group Items",
    description: "Group selected items together",
    category: "selection",
  },
  {
    key: "g",
    modifiers: ["ctrl", "shift"],
    title: "Ungroup Items",
    description: "Ungroup selected group",
    category: "selection",
  },
  {
    key: "=",
    modifiers: ["ctrl"],
    title: "Zoom In",
    description: "Zoom in on the canvas",
    category: "navigation",
  },
  {
    key: "-",
    modifiers: ["ctrl"],
    title: "Zoom Out",
    description: "Zoom out on the canvas",
    category: "navigation",
  },
  {
    key: "0",
    modifiers: ["ctrl"],
    title: "Reset Zoom",
    description: "Reset zoom to 100%",
    category: "navigation",
  },
];

/**
 * Get all system shortcuts
 */
export function getAllShortcuts(): ShortcutConfig[] {
  return [...SYSTEM_SHORTCUTS];
}

/**
 * Detect conflicting shortcuts
 */
export function detectConflicts(): ShortcutConfig[] {
  const conflicts: ShortcutConfig[] = [];
  const shortcutMap = new Map<string, ShortcutConfig[]>();

  for (const shortcut of getAllShortcuts()) {
    const key = formatShortcutKey(shortcut);
    const existing = shortcutMap.get(key);
    if (existing) {
      existing.push(shortcut);
      if (!conflicts.includes(existing[0])) {
        conflicts.push(existing[0]);
      }
      conflicts.push(shortcut);
    } else {
      shortcutMap.set(key, [shortcut]);
    }
  }

  return conflicts;
}

/**
 * Format shortcut for display (e.g., "Ctrl + V")
 */
export function formatShortcutKey(config: ShortcutConfig): string {
  const parts: string[] = [];

  if (config.modifiers) {
    for (const mod of config.modifiers) {
      if (mod === "ctrl") parts.push("Ctrl");
      else if (mod === "shift") parts.push("Shift");
      else if (mod === "alt") parts.push("Alt");
      else if (mod === "meta")
        parts.push(navigator.platform.includes("Mac") ? "Cmd" : "Win");
    }
  }

  parts.push(config.key.toUpperCase());

  return parts.join(" + ");
}

/**
 * Format tool shortcut for display
 */
export function formatToolShortcut(toolId: ToolType): string {
  const shortcut = TOOL_SHORTCUTS[toolId];
  return shortcut || "";
}

/**
 * Match keyboard event against a shortcut config
 */
export function matchShortcut(
  e: KeyboardEvent,
  config: ShortcutConfig,
): boolean {
  const key = config.key.toLowerCase();
  const eventKey = e.key.toLowerCase();

  if (eventKey !== key) return false;

  const hasCtrl = config.modifiers?.includes("ctrl");
  const hasShift = config.modifiers?.includes("shift");
  const hasAlt = config.modifiers?.includes("alt");
  const hasMeta = config.modifiers?.includes("meta");

  const ctrlRequired = hasCtrl || hasMeta;
  const ctrlPressed = navigator.platform.includes("Mac")
    ? e.metaKey
    : e.ctrlKey;

  return (
    !!ctrlRequired === ctrlPressed &&
    !!hasShift === e.shiftKey &&
    !!hasAlt === e.altKey
  );
}
