"use client";

/**
 * Keyboard Shortcuts Modal
 * Displays all available keyboard shortcuts in a responsive modal
 */

import { BookOpen } from "lucide-react";
import { BlueprintModal } from "@/components/ui/blueprint-modal";
import { TOOL_SHORTCUTS, SYSTEM_SHORTCUTS } from "@/config/keyboard-shortcuts";

interface ShortcutGroup {
  title: string;
  shortcuts: {
    label: string;
    keys: string[];
  }[];
}

const toolShortcuts: ShortcutGroup = {
  title: "Tools",
  shortcuts: [
    { label: "Select tool", keys: ["V"] },
    { label: "Rectangle tool", keys: ["R"] },
    { label: "Ellipse tool", keys: ["O"] },
    { label: "Line tool", keys: ["L"] },
    { label: "Arrow tool", keys: ["A"] },
    { label: "Text tool", keys: ["T"] },
    { label: "Image tool", keys: ["I"] },
    { label: "Pin tool", keys: ["P"] },
    { label: "Pan tool", keys: ["H"] },
  ],
};

const shortcutGroups: ShortcutGroup[] = [
  {
    title: "Layer Operations",
    shortcuts: [
      { label: "Create new layer", keys: ["Ctrl", "Alt", "N"] },
      { label: "Toggle layer lock", keys: ["Ctrl", "L"] },
      { label: "Toggle layer visibility", keys: ["Ctrl", "Shift", "L"] },
      { label: "Delete selected layer", keys: ["Delete"] },
    ],
  },
  {
    title: "Layer Reordering",
    shortcuts: [
      { label: "Bring layer forward", keys: ["Ctrl", "]"] },
      { label: "Send layer backward", keys: ["Ctrl", "["] },
      { label: "Bring layer to front", keys: ["Ctrl", "Shift", "]"] },
      { label: "Send layer to back", keys: ["Ctrl", "Shift", "["] },
    ],
  },
  {
    title: "Undo/Redo",
    shortcuts: [
      { label: "Undo", keys: ["Ctrl", "Z"] },
      { label: "Redo", keys: ["Ctrl", "Shift", "Z"] },
      { label: "Redo (alternate)", keys: ["Ctrl", "Y"] },
    ],
  },
  {
    title: "Canvas Navigation",
    shortcuts: [
      { label: "Zoom in", keys: ["Ctrl", "+"] },
      { label: "Zoom out", keys: ["Ctrl", "-"] },
      { label: "Reset zoom", keys: ["Ctrl", "0"] },
      { label: "Pan canvas", keys: ["Space", "Drag"] },
    ],
  },
  {
    title: "Selection",
    shortcuts: [
      { label: "Select all", keys: ["Ctrl", "A"] },
      { label: "Clear selection", keys: ["Escape"] },
      { label: "Add to selection", keys: ["Shift", "Click"] },
    ],
  },
];

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsModal({
  isOpen,
  onClose,
}: KeyboardShortcutsModalProps) {
  return (
    <BlueprintModal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      showCloseButton={false}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[var(--accent-500)]/20 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-[var(--accent-400)]" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">
              Keyboard Shortcuts
            </h2>
            <p className="text-xs text-white/40">Press Escape to close</p>
          </div>
        </div>
      </div>

      {/* Shortcuts content */}
      <div className="overflow-y-auto max-h-[55vh] custom-scrollbar">
        <div className="grid gap-6 md:grid-cols-2">
          {[toolShortcuts, ...shortcutGroups].map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-medium text-[var(--accent-400)] mb-3 uppercase tracking-wide">
                {group.title}
              </h3>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.label}
                    className="flex items-center justify-between py-1.5"
                  >
                    <span className="text-sm text-[var(--gray-300)]">
                      {shortcut.label}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, index) => (
                        <span key={index} className="flex items-center gap-1">
                          <kbd className="px-2 py-1 text-xs font-mono bg-[var(--navy-800)] border border-white/20 rounded text-[var(--gray-200)]">
                            {key}
                          </kbd>
                          {index < shortcut.keys.length - 1 && (
                            <span className="text-white/30 text-xs">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-white/10 text-center">
        <p className="text-xs text-white/30">
          Tip: On Mac, use{" "}
          <kbd className="px-1.5 py-0.5 text-xs font-mono bg-[var(--navy-800)] border border-white/20 rounded">
            Cmd
          </kbd>{" "}
          instead of{" "}
          <kbd className="px-1.5 py-0.5 text-xs font-mono bg-[var(--navy-800)] border border-white/20 rounded">
            Ctrl
          </kbd>
        </p>
      </div>
    </BlueprintModal>
  );
}
