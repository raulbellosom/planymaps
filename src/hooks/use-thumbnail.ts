"use client";

/**
 * useThumbnail
 * Captures a JPEG snapshot of the Konva stage after each auto-save and uploads
 * it to the board_thumbnails Appwrite bucket, then stores the file ID on the
 * board document.
 *
 * Trigger: isDirty transitions true → false (auto-save completed)
 * Throttle: at most once per 30 s per session
 * Capture: pixelRatio 0.2 → ~384×216 for a 1920×1080 board
 */

import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import type Konva from "konva";
import { ID, Permission, Role } from "appwrite";
import { useBoardStore } from "@/stores/board-store";
import {
  uploadFile,
  deleteFile,
  getBoardThumbnailsBucketId,
} from "@/lib/appwrite/storage";
import { updateBoard as updateBoardApi } from "@/services/board-service";

const THROTTLE_MS = 30_000; // 30 s minimum between captures

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const mimeMatch = header.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

export function useThumbnail(stageRef: RefObject<Konva.Stage | null>) {
  const isDirty = useBoardStore((state) => state.isDirty);
  const prevDirtyRef = useRef(false);
  const lastSnapshotRef = useRef(0);
  const captureScheduledRef = useRef(false);

  useEffect(() => {
    // Detect transition: dirty → clean (auto-save just completed)
    const wasJustSaved = prevDirtyRef.current && !isDirty;
    prevDirtyRef.current = isDirty;

    if (!wasJustSaved) return;

    // Throttle
    const now = Date.now();
    if (now - lastSnapshotRef.current < THROTTLE_MS) return;

    // Avoid double-scheduling
    if (captureScheduledRef.current) return;
    captureScheduledRef.current = true;

    const capture = async () => {
      captureScheduledRef.current = false;

      const stage = stageRef.current;
      const board = useBoardStore.getState().board;
      if (!stage || !board) return;

      try {
        lastSnapshotRef.current = Date.now();

        // Capture at low resolution
        const dataUrl = stage.toDataURL({
          pixelRatio: 0.2,
          mimeType: "image/jpeg",
        });
        const blob = dataUrlToBlob(dataUrl);
        const file = new File([blob], "thumbnail.jpg", { type: "image/jpeg" });

        // Upload new thumbnail (readable by all authenticated users)
        const uploaded = await uploadFile(
          getBoardThumbnailsBucketId(),
          ID.unique(),
          file,
          [Permission.read(Role.users())],
        );

        // Remove previous thumbnail (best-effort)
        if (board.thumbnailFileId) {
          deleteFile(getBoardThumbnailsBucketId(), board.thumbnailFileId).catch(
            () => {
              // ignore — file may already be gone
            },
          );
        }

        // Persist file ID to Appwrite
        await updateBoardApi(board.$id, { thumbnailFileId: uploaded.$id });

        // Update local store without triggering a new dirty cycle
        const current = useBoardStore.getState().board;
        if (current) {
          useBoardStore.getState().setBoard({
            ...current,
            thumbnailFileId: uploaded.$id,
          });
        }
      } catch (err) {
        console.warn("[Thumbnail] Capture failed:", err);
      }
    };

    // Schedule during idle time so it never blocks the UI
    if (typeof requestIdleCallback !== "undefined") {
      requestIdleCallback(() => void capture(), { timeout: 5_000 });
    } else {
      setTimeout(() => void capture(), 0);
    }
  }, [isDirty, stageRef]);
}
