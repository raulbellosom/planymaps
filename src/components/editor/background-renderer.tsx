"use client";

/**
 * Background Renderer
 * Renders board background (color or image)
 */

import { useEffect, useState } from "react";
import { Layer, Rect, Image as KonvaImage } from "react-konva";
import type { Board } from "@/types/board";
import { getAsset, getAssetPreviewUrl } from "@/services/asset-service";

export interface BackgroundRendererProps {
  board: Board;
  width: number;
  height: number;
}

export function BackgroundRenderer({
  board,
  width,
  height,
}: BackgroundRendererProps) {
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (board.backgroundType !== "image" || !board.backgroundAssetId) {
      setBgImage(null);
      return;
    }

    let cancelled = false;

    getAsset(board.backgroundAssetId)
      .then((asset) => {
        const url = getAssetPreviewUrl(asset);
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          if (!cancelled) setBgImage(img);
        };
        img.src = url;
      })
      .catch(() => {
        if (!cancelled) setBgImage(null);
      });

    return () => {
      cancelled = true;
    };
  }, [board.backgroundType, board.backgroundAssetId]);

  const bgColor =
    board.backgroundType === "color" && board.backgroundColor
      ? board.backgroundColor
      : null;

  return (
    <Layer listening={false}>
      {/* Default white canvas */}
      <Rect x={0} y={0} width={width} height={height} fill="#ffffff" />

      {/* Solid color background */}
      {bgColor && (
        <Rect x={0} y={0} width={width} height={height} fill={bgColor} />
      )}

      {/* Image background */}
      {board.backgroundType === "image" && bgImage && (
        <KonvaImage x={0} y={0} width={width} height={height} image={bgImage} />
      )}
    </Layer>
  );
}
