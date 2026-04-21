"use client";

/**
 * ImageUploadModal
 * Shown after the user drags the image tool on the canvas.
 * Accepts a file, uploads it, and calls onUploadComplete with the resulting URL.
 */

import { useCallback, useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { BlueprintModal } from "@/components/ui/blueprint-modal";
import { uploadAsset } from "@/services/asset-service";
import { getFileView } from "@/lib/appwrite/storage";
import { getBucketId } from "@/env";

export interface ImageUploadModalProps {
  /** The pre-calculated rect from the drag gesture */
  pendingRect: { x: number; y: number; width: number; height: number };
  workspaceId: string;
  boardId: string;
  userId: string;
  onUploadComplete: (
    x: number,
    y: number,
    width: number,
    height: number,
    src: string,
    assetId: string,
  ) => void;
  onCancel: () => void;
}

export function ImageUploadModal({
  pendingRect,
  workspaceId,
  boardId,
  userId,
  onUploadComplete,
  onCancel,
}: ImageUploadModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setError(null);
      setSelectedFile(file);

      // Show local preview
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    },
    [],
  );

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);

    try {
      const asset = await uploadAsset(
        selectedFile,
        workspaceId,
        userId,
        boardId,
      );

      // Build direct view URL
      const src = getFileView(getBucketId("board_assets"), asset.storageFileId);

      // When the modal was triggered by clicking the tool (no drawn rect),
      // pendingRect is {x, y, width:0, height:0} where x/y is the viewport center.
      // In that case use the image's natural size and center it at that point.
      const natW = asset.width || 300;
      const natH = asset.height || 200;
      const width = pendingRect.width >= 10 ? pendingRect.width : natW;
      const height = pendingRect.height >= 10 ? pendingRect.height : natH;
      const x =
        pendingRect.width >= 10 ? pendingRect.x : pendingRect.x - natW / 2;
      const y =
        pendingRect.height >= 10 ? pendingRect.y : pendingRect.y - natH / 2;

      onUploadComplete(x, y, width, height, src, asset.storageFileId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }, [
    selectedFile,
    workspaceId,
    userId,
    boardId,
    pendingRect,
    onUploadComplete,
  ]);

  const handleDropZoneClick = () => inputRef.current?.click();

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    // Simulate file input change
    const dt = new DataTransfer();
    dt.items.add(file);
    if (inputRef.current) {
      inputRef.current.files = dt.files;
    }

    setError(null);
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  return (
    <BlueprintModal
      isOpen={true}
      onClose={onCancel}
      title="Add Image"
      size="md"
      showCloseButton
    >
      <div className="flex flex-col gap-4">
        {/* Drop zone / preview */}
        <div
          className={`relative border-2 border-dashed rounded-xl cursor-pointer transition-colors
            ${preview ? "border-(--accent-500)/50" : "border-white/20 hover:border-(--accent-500)/60"}
          `}
          style={{ minHeight: 160 }}
          onClick={handleDropZoneClick}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Preview"
              className="w-full rounded-xl object-contain"
              style={{ maxHeight: 220 }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-(--gray-400)">
              <Upload className="w-10 h-10 opacity-50" />
              <div className="text-center">
                <p className="text-sm font-medium">
                  Click or drag an image here
                </p>
                <p className="text-xs mt-1 opacity-60">
                  PNG, JPG, WEBP, GIF accepted
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {error && <p className="text-red-400 text-sm">{error}</p>}

        {/* Actions */}
        <div className="flex gap-3 pt-1 border-t border-white/8">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/8 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="flex-1 py-2 rounded-lg bg-(--accent-500) hover:bg-(--accent-600) disabled:opacity-40 disabled:cursor-not-allowed text-white transition text-sm font-medium flex items-center justify-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading…
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Add to Canvas
              </>
            )}
          </button>
        </div>
      </div>
    </BlueprintModal>
  );
}
