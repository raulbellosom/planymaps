"use client";

/**
 * ConfirmDialog
 * A reusable confirmation modal replacing browser-native window.confirm().
 * Uses BlueprintModal for consistent crystal glass styling.
 */

import { BlueprintModal } from "@/components/ui/blueprint-modal";

interface ConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" renders the confirm button in red */
  variant?: "default" | "danger";
}

export function ConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  title = "Confirm",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
}: ConfirmDialogProps) {
  return (
    <BlueprintModal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      size="sm"
      showCloseButton={false}
      closable
    >
      <div className="flex flex-col gap-5 pt-1">
        <p className="text-sm text-[var(--gray-300)] leading-relaxed">
          {message}
        </p>
        <div className="flex justify-end gap-2 pt-1 border-t border-white/10">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/8 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              variant === "danger"
                ? "bg-red-600 hover:bg-red-500 text-white"
                : "bg-[var(--accent-600)] hover:bg-[var(--accent-500)] text-white"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </BlueprintModal>
  );
}
