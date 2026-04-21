"use client";

/**
 * PinEditModal
 * Full-screen modal opened by double-clicking a pin with the select tool.
 * Lets the user edit the pin's label, description and up to 3 photos.
 * Photos are stored as Appwrite storage file IDs in the pin's `images` content field.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FlipHorizontal2,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  RotateCcw,
  RotateCw,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { BlueprintModal } from "@/components/ui/blueprint-modal";
import { useBoardStore } from "@/stores/board-store";
import { uploadAsset } from "@/services/asset-service";
import { getBoardAssetsBucketId, getFileView } from "@/lib/appwrite/storage";
import { parseContentProps } from "@/types/board";

const MAX_IMAGES = 3;

/**
 * Downloads a file via blob fetch to force a Save-As dialog even for
 * cross-origin URLs (where the `download` attribute on <a> is ignored).
 */
async function downloadImage(url: string, filename: string) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    a.click();
    // Small delay before revoking so the browser has time to start the download
    setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
  } catch {
    // Fallback: open in new tab
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

export interface PinEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string | null;
  workspaceId: string;
  boardId: string;
  userId: string;
  /** When true, the modal is view-only: fields are read-only, no upload/save actions. */
  readOnly?: boolean;
}

export function PinEditModal({
  isOpen,
  onClose,
  itemId,
  workspaceId,
  boardId,
  userId,
  readOnly = false,
}: PinEditModalProps) {
  const itemsByLayer = useBoardStore((state) => state.itemsByLayer);
  const updateItem = useBoardStore((state) => state.updateItem);

  // Local form state
  const [label, setLabel] = useState("");
  const [note, setNote] = useState("");
  const [images, setImages] = useState<(string | null)[]>([null, null, null]);
  const [uploading, setUploading] = useState<boolean[]>([false, false, false]);
  const [uploadErrors, setUploadErrors] = useState<(string | null)[]>([
    null,
    null,
    null,
  ]);
  const [isSaving, setIsSaving] = useState(false);

  // Lightbox state: index of the currently viewed image, or null if closed
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [lightboxRotation, setLightboxRotation] = useState(0);
  const [lightboxMirrored, setLightboxMirrored] = useState(false);

  // File input refs — one per slot; accept="image/*" lets the OS show
  // a native picker (camera OR library) without forcing a specific source.
  const fileInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Initialise local state whenever the modal opens or the target item changes
  useEffect(() => {
    if (!isOpen || !itemId) return;

    const allItems = Object.values(itemsByLayer).flat();
    const item = allItems.find((i) => i.$id === itemId);
    if (!item) return;

    const content = parseContentProps(item);
    setLabel(content.label ?? "");
    setNote(content.note ?? "");

    const existing = (content.images ?? []).slice(0, MAX_IMAGES);
    const padded: (string | null)[] = [null, null, null];
    existing.forEach((id, i) => (padded[i] = id));
    setImages(padded);

    setUploading([false, false, false]);
    setUploadErrors([null, null, null]);
    setLightboxIndex(null);
  }, [isOpen, itemId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Upload helpers ────────────────────────────────────────────────────────

  const handleFileSelected = useCallback(
    async (slot: number, file: File) => {
      setUploadErrors((prev) => {
        const next = [...prev];
        next[slot] = null;
        return next;
      });
      setUploading((prev) => {
        const next = [...prev];
        next[slot] = true;
        return next;
      });

      try {
        const asset = await uploadAsset(file, workspaceId, userId, boardId);
        setImages((prev) => {
          const next = [...prev];
          next[slot] = asset.storageFileId;
          return next;
        });
      } catch (err) {
        setUploadErrors((prev) => {
          const next = [...prev];
          next[slot] =
            err instanceof Error ? err.message : "Upload failed. Try again.";
          return next;
        });
      } finally {
        setUploading((prev) => {
          const next = [...prev];
          next[slot] = false;
          return next;
        });
      }
    },
    [workspaceId, userId, boardId],
  );

  const makeFileChangeHandler =
    (slot: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      // Reset the input so the same file can be re-selected after removal
      e.target.value = "";
      void handleFileSelected(slot, file);
    };

  const removeImage = (slot: number) => {
    setImages((prev) => {
      const next = [...prev];
      next[slot] = null;
      return next;
    });
    setUploadErrors((prev) => {
      const next = [...prev];
      next[slot] = null;
      return next;
    });
  };

  // ─── Lightbox helpers ──────────────────────────────────────────────────────

  const filledImages = images.filter(Boolean) as string[];

  const openLightbox = (slot: number) => {
    // Map from slot index → filled-images index
    const fileId = images[slot];
    if (!fileId) return;
    const idx = filledImages.indexOf(fileId);
    setLightboxIndex(idx >= 0 ? idx : 0);
    setLightboxRotation(0);
    setLightboxMirrored(false);
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
    setLightboxRotation(0);
    setLightboxMirrored(false);
  };

  const lightboxPrev = () => {
    setLightboxIndex((i) =>
      i !== null ? (i - 1 + filledImages.length) % filledImages.length : null,
    );
    setLightboxRotation(0);
    setLightboxMirrored(false);
  };

  const lightboxNext = () => {
    setLightboxIndex((i) =>
      i !== null ? (i + 1) % filledImages.length : null,
    );
    setLightboxRotation(0);
    setLightboxMirrored(false);
  };

  // Keyboard navigation inside lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") lightboxPrev();
      else if (e.key === "ArrowRight") lightboxNext();
      else if (e.key === "Escape") closeLightbox();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Save ──────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!itemId) return;

    setIsSaving(true);
    try {
      const allItems = Object.values(itemsByLayer).flat();
      const item = allItems.find((i) => i.$id === itemId);
      if (!item) return;

      // Preserve existing content fields (gps, etc.) and overwrite pin fields
      let existingContent: Record<string, unknown> = {};
      try {
        existingContent = JSON.parse(item.contentJson || "{}");
      } catch {
        // use empty object
      }

      const newContent = {
        ...existingContent,
        label: label.trim(),
        note: note.trim(),
        images: images.filter(Boolean) as string[],
      };

      updateItem(itemId, { contentJson: JSON.stringify(newContent) });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <BlueprintModal
        isOpen={isOpen}
        onClose={onClose}
        title={readOnly ? "Pin Info" : "Edit Pin"}
        size="lg"
        showCloseButton
      >
        <div className="flex flex-col gap-5 pt-1">
          {/* Pin icon header row */}
          <div className="flex items-center gap-2 text-(--gray-400)">
            <MapPin className="w-4 h-4 shrink-0 text-red-400" />
            <span className="text-xs uppercase tracking-wider font-medium">
              Pin details
            </span>
          </div>

          {/* Label */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-(--gray-300)">Label</span>
            {readOnly ? (
              <p className="px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white min-h-[36px]">
                {label || <span className="text-white/30">No label</span>}
              </p>
            ) : (
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Pin label…"
                maxLength={80}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/60 transition"
              />
            )}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-(--gray-300)">Description</span>
            {readOnly ? (
              <p className="px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white whitespace-pre-wrap min-h-[72px]">
                {note || <span className="text-white/30">No description</span>}
              </p>
            ) : (
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a description or notes…"
                rows={3}
                maxLength={500}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/60 transition resize-none"
              />
            )}
          </div>

          {/* Photos */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-(--gray-300)">
              Photos
              {!readOnly && (
                <span className="text-white/30 font-normal"> (up to {MAX_IMAGES})</span>
              )}
            </span>

            <div className="grid grid-cols-3 gap-3">
              {images.map((fileId, slot) => (
                <PhotoSlot
                  key={slot}
                  slot={slot}
                  fileId={fileId}
                  isUploading={uploading[slot]}
                  error={uploadErrors[slot]}
                  inputRef={fileInputRefs[slot]}
                  onAddClick={() => fileInputRefs[slot].current?.click()}
                  onChange={makeFileChangeHandler(slot)}
                  onRemove={() => removeImage(slot)}
                  onView={() => openLightbox(slot)}
                  onDownload={() => {
                    const fileId = images[slot];
                    if (!fileId) return;
                    const url = getFileView(getBoardAssetsBucketId(), fileId);
                    void downloadImage(url, `pin-photo-${slot + 1}`);
                  }}
                  readOnly={readOnly}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1 border-t border-white/8">
            {readOnly ? (
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-white/10 hover:bg-white/15 text-white transition"
              >
                Close
              </button>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/8 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || uploading.some(Boolean)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {isSaving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Pencil className="w-3.5 h-3.5" />
                  )}
                  Save
                </button>
              </>
            )}
          </div>
        </div>
      </BlueprintModal>

      {/* Image lightbox viewer */}
      {lightboxIndex !== null && filledImages.length > 0 && (
        <div
          className="fixed inset-0 z-[12000] flex items-center justify-center bg-black/70 backdrop-blur-md backdrop-saturate-150"
          onClick={closeLightbox}
        >
          {/* Top bar: counter + action toolbar + close */}
          <div
            className="absolute top-4 inset-x-4 z-10 flex items-center justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Counter */}
            <div className="px-3 py-1 rounded-full bg-[#12141a]/80 border border-white/10 text-white/60 text-xs">
              {filledImages.length > 1
                ? `${lightboxIndex + 1} / ${filledImages.length}`
                : "Photo"}
            </div>

            {/* Action toolbar */}
            <div className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-[#12141a]/80 border border-white/10">
              <button
                className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition"
                title="Rotate left"
                onClick={() => setLightboxRotation((r) => r - 90)}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition"
                title="Rotate right"
                onClick={() => setLightboxRotation((r) => r + 90)}
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-white/10 mx-0.5" />
              <button
                className={`p-1.5 rounded-lg transition ${
                  lightboxMirrored
                    ? "text-blue-400 bg-blue-500/15 hover:bg-blue-500/25"
                    : "text-white/60 hover:text-white hover:bg-white/10"
                }`}
                title="Mirror horizontal"
                onClick={() => setLightboxMirrored((m) => !m)}
              >
                <FlipHorizontal2 className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-white/10 mx-0.5" />
              <button
                className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition"
                title="Download"
                onClick={() => {
                  const url = getFileView(
                    getBoardAssetsBucketId(),
                    filledImages[lightboxIndex],
                  );
                  void downloadImage(url, `pin-photo-${lightboxIndex + 1}`);
                }}
              >
                <Download className="w-4 h-4" />
              </button>
            </div>

            {/* Close */}
            <button
              className="p-2 rounded-full bg-[#12141a]/80 border border-white/10 text-white/60 hover:text-white transition"
              onClick={closeLightbox}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Prev arrow */}
          {filledImages.length > 1 && (
            <button
              className="absolute left-4 p-2 rounded-full bg-[#12141a]/80 border border-white/10 text-white/60 hover:text-white transition"
              onClick={(e) => {
                e.stopPropagation();
                lightboxPrev();
              }}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getFileView(
              getBoardAssetsBucketId(),
              filledImages[lightboxIndex],
            )}
            alt={`Pin photo ${lightboxIndex + 1}`}
            className="max-w-[90vw] max-h-[78vh] object-contain rounded-xl shadow-2xl transition-transform duration-200"
            style={{
              transform: `rotate(${lightboxRotation}deg) scaleX(${
                lightboxMirrored ? -1 : 1
              })`,
            }}
            onClick={(e) => e.stopPropagation()}
          />

          {/* Next arrow */}
          {filledImages.length > 1 && (
            <button
              className="absolute right-4 p-2 rounded-full bg-[#12141a]/80 border border-white/10 text-white/60 hover:text-white transition"
              onClick={(e) => {
                e.stopPropagation();
                lightboxNext();
              }}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Thumbnail strip */}
          {filledImages.length > 1 && (
            <div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              {filledImages.map((id, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={id}
                  src={getFileView(getBoardAssetsBucketId(), id)}
                  alt={`Thumbnail ${i + 1}`}
                  className={`w-12 h-12 object-cover rounded-md cursor-pointer transition border-2 ${
                    i === lightboxIndex
                      ? "border-blue-400 opacity-100"
                      : "border-transparent opacity-50 hover:opacity-80"
                  }`}
                  onClick={() => {
                    setLightboxIndex(i);
                    setLightboxRotation(0);
                    setLightboxMirrored(false);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

// ─── PhotoSlot sub-component ──────────────────────────────────────────────────

interface PhotoSlotProps {
  slot: number;
  fileId: string | null;
  isUploading: boolean;
  error: string | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onAddClick: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  onView: () => void;
  onDownload: () => void;
  readOnly?: boolean;
}

function PhotoSlot({
  slot,
  fileId,
  isUploading,
  error,
  inputRef,
  onAddClick,
  onChange,
  onRemove,
  onView,
  onDownload,
  readOnly = false,
}: PhotoSlotProps) {
  const hasImage = Boolean(fileId);

  // In readOnly mode, skip empty slots entirely
  if (readOnly && !hasImage) return null;

  return (
    <div className="flex flex-col gap-1">
      {/* Hidden file input — only rendered in edit mode */}
      {!readOnly && (
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onChange}
        />
      )}

      {/* Slot box */}
      <div
        className={`relative aspect-square rounded-xl overflow-hidden border transition ${
          error
            ? "border-red-500/60 bg-red-500/5"
            : hasImage
              ? "border-white/15 bg-black/20"
              : "border-dashed border-white/20 bg-white/3 hover:bg-white/6 hover:border-white/30"
        }`}
      >
        {isUploading ? (
          // Upload in progress
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            <span className="text-xs text-white/40">Uploading…</span>
          </div>
        ) : hasImage && fileId ? (
          // Filled slot
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getFileView(getBoardAssetsBucketId(), fileId)}
              alt={`Pin photo ${slot + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {/* Overlay: view + download always visible; remove only in edit mode */}
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 hover:bg-black/50 opacity-0 hover:opacity-100 transition group">
              <button
                className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white transition"
                title="View"
                onClick={onView}
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
              <button
                className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white transition"
                title="Download"
                onClick={onDownload}
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              {!readOnly && (
                <button
                  className="p-1.5 rounded-lg bg-red-600/80 hover:bg-red-500 text-white transition"
                  title="Remove"
                  onClick={onRemove}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </>
        ) : (
          // Empty slot — upload zone (edit mode only)
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-2">
            <div className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center">
              <Plus className="w-4 h-4 text-white/40" />
            </div>
            <button
              className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-white/8 hover:bg-white/15 text-white/50 hover:text-white text-[10px] transition"
              onClick={onAddClick}
              title="Add photo (camera or library)"
            >
              <Upload className="w-2.5 h-2.5" />
              Add photo
            </button>
          </div>
        )}
      </div>

      {/* Per-slot error */}
      {error && (
        <p
          className="text-[10px] text-red-400 leading-tight truncate"
          title={error}
        >
          {error}
        </p>
      )}
    </div>
  );
}
