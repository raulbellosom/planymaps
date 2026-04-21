"use client";

/**
 * TextEditor
 * DOM-level textarea overlay for inline text editing.
 * Rendered outside the Konva Stage to avoid React Konva reconciler conflicts.
 * State is driven by the UI store; commits via board store.
 */

import { useEffect, useRef, useCallback } from "react";
import { useUIStore } from "@/stores/ui-store";
import { useBoardStore } from "@/stores/board-store";
import { parseContentProps } from "@/types/board";

export function TextEditor() {
  const textEdit = useUIStore((state) => state.textEdit);
  const setTextEdit = useUIStore((state) => state.setTextEdit);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus and move cursor to end when edit opens
  useEffect(() => {
    if (textEdit && textareaRef.current) {
      textareaRef.current.focus();
      const len = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(len, len);
    }
  }, [textEdit?.itemId]); // eslint-disable-line react-hooks/exhaustive-deps

  const commit = useCallback(() => {
    if (!textEdit) return;
    const { itemId, text } = textEdit;

    // Look up current contentJson and merge
    const allItems = useBoardStore.getState().itemsByLayer;
    let found = false;
    for (const layerItems of Object.values(allItems)) {
      const item = layerItems.find((i) => i.$id === itemId);
      if (item) {
        const current = parseContentProps(item);
        useBoardStore.getState().updateItem(itemId, {
          contentJson: JSON.stringify({ ...current, text }),
        });
        found = true;
        break;
      }
    }
    if (!found) {
      // Fallback: update with just text
      useBoardStore.getState().updateItem(itemId, {
        contentJson: JSON.stringify({ text }),
      });
    }

    setTextEdit(null);
  }, [textEdit, setTextEdit]);

  const discard = useCallback(() => {
    setTextEdit(null);
  }, [setTextEdit]);

  if (!textEdit) return null;

  return (
    <textarea
      ref={textareaRef}
      style={textEdit.textareaStyle}
      value={textEdit.text}
      onChange={(e) => setTextEdit({ ...textEdit, text: e.target.value })}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          discard();
        } else if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          commit();
        }
      }}
    />
  );
}
