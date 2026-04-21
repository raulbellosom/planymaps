"use client";

import { useEffect, useState } from "react";
import { BlueprintModal } from "@/components/ui/blueprint-modal";
import { updateBoard } from "@/services/board-service";
import { showError, showSuccess } from "@/lib/toast";
import type { Board, BackgroundType } from "@/types/board";

interface BoardSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  board: Board;
  workspaceId: string;
  userId: string;
  onSaved?: (updated: Board) => void;
}

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
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setName(board.name ?? "");
    setDescription(board.description ?? "");
    setBackgroundType(board.backgroundType ?? "none");
    setBackgroundColor(board.backgroundColor ?? "#ffffff");
  }, [board]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const updated = await updateBoard(board.$id, {
        name: name.trim() || board.name,
        description: description.trim(),
        backgroundType,
        backgroundColor: backgroundType === "color" ? backgroundColor : undefined,
      });
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
            onChange={(e) => setBackgroundType(e.target.value as BackgroundType)}
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
              onChange={(e) => setBackgroundColor(e.target.value)}
              className="h-10 w-full rounded-lg bg-[var(--navy-800)] border border-white/10"
            />
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

