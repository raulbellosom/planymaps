"use client";

/**
 * PinPopover
 * DOM-level hover card shown when the user hovers a pin on the canvas.
 * Rendered outside the Konva Stage to avoid React Konva reconciler conflicts.
 */

import { useState } from "react";
import { useUIStore } from "@/stores/ui-store";
import { getFileView, getBoardAssetsBucketId } from "@/lib/appwrite/storage";

export function PinPopover() {
  const pinPopover = useUIStore((state) => state.pinPopover);
  const setPinPopover = useUIStore((state) => state.setPinPopover);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  if (!pinPopover) return null;

  const { x, y, label, note, images } = pinPopover;
  const imageUrls = images
    .slice(0, 3)
    .map((id) => getFileView(getBoardAssetsBucketId(), id));

  return (
    <>
      {/* Popover card */}
      <div
        style={{ position: "fixed", left: x, top: y, zIndex: 10000 }}
        className="bg-(--navy-800) border border-white/15 rounded-xl shadow-2xl p-3 min-w-40 max-w-55 text-white pointer-events-auto"
        onMouseLeave={() => setPinPopover(null)}
      >
        {label && (
          <p className="text-sm font-semibold truncate mb-1">{label}</p>
        )}
        {note && (
          <p className="text-xs text-(--gray-400) whitespace-pre-wrap line-clamp-3 mb-2">
            {note}
          </p>
        )}
        {imageUrls.length > 0 && (
          <div className="flex gap-1">
            {imageUrls.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={src}
                alt={`pin image ${i + 1}`}
                className="w-14 h-14 object-cover rounded-md cursor-pointer hover:opacity-80 transition-opacity border border-white/10"
                loading="lazy"
                onClick={() => setLightboxSrc(src)}
              />
            ))}
          </div>
        )}
        {!label && !note && imageUrls.length === 0 && (
          <p className="text-xs text-(--gray-500) italic">No details</p>
        )}
      </div>

      {/* Lightbox overlay */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-[11000] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setLightboxSrc(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxSrc}
            alt="Pin image"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
