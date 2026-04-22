/**
 * Image Item Renderer
 * Blur-up loading pattern:
 *  1. Immediately fetch a 40px thumbnail (Appwrite preview, quality=20) → shows blurry fast
 *  2. Fetch full-res via requestIdleCallback → swaps in when ready
 *  3. While nothing is loaded: animated shimmer skeleton
 */

import { Image as KonvaImage, Transformer, Group, Rect } from "react-konva";
import type { ItemRendererProps } from "./item-renderer";
import {
  parseStyleProps,
  parseInteractionProps,
  parseContentProps,
} from "@/types/board";
import type { KonvaEventObject } from "konva/lib/Node";
import { useEffect, useRef, useState } from "react";
import {
  getFileView,
  getFilePreview,
  getBoardAssetsBucketId,
} from "@/lib/appwrite/storage";

export const ImageRenderer: React.FC<ItemRendererProps> = ({
  item,
  isSelected,
  isMultiSelected,
  layerHighlightColor,
  onSelect,
  onDragEnd,
  onTransformEnd,
  onContextMenu,
}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shapeRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transformerRef = useRef<any>(null);

  // Three-phase loading: skeleton → blurry thumb → full
  const [thumbImage, setThumbImage] = useState<HTMLImageElement | null>(null);
  const [fullImage, setFullImage] = useState<HTMLImageElement | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  // Shimmer animation
  const [shimmerX, setShimmerX] = useState(0);
  const shimmerRafRef = useRef<number | null>(null);

  const style = parseStyleProps(item);
  const interaction = parseInteractionProps(item);
  const content = parseContentProps(item);

  // Resolve file ID and URLs
  function resolveIds(): {
    fileId: string | null;
    fullSrc: string | undefined;
  } {
    if (content.assetId) {
      return {
        fileId: content.assetId,
        fullSrc: getFileView(getBoardAssetsBucketId(), content.assetId),
      };
    }
    if (content.src) {
      const match = content.src.match(
        /\/files\/([^/]+)\/(?:view|preview|download)/,
      );
      if (match?.[1]) {
        return {
          fileId: match[1],
          fullSrc: getFileView(getBoardAssetsBucketId(), match[1]),
        };
      }
      return { fileId: null, fullSrc: content.src };
    }
    return { fileId: null, fullSrc: undefined };
  }

  const { fileId, fullSrc } = resolveIds();
  const thumbSrc = fileId
    ? getFilePreview(getBoardAssetsBucketId(), fileId, 40, undefined, 20)
    : undefined;

  // Phase 1: load thumbnail immediately (no idle delay — it's tiny, ~1-3 KB)
  useEffect(() => {
    if (!thumbSrc) return;
    setThumbImage(null);
    setLoadFailed(false);

    const img = new window.Image();
    img.onload = () => setThumbImage(img);
    img.onerror = () => setLoadFailed(true);
    img.src = thumbSrc;
  }, [thumbSrc]); // eslint-disable-line react-hooks/exhaustive-deps

  // Phase 2: load full-res via requestIdleCallback
  useEffect(() => {
    if (!fullSrc) return;
    setFullImage(null);

    let cancelHandle: (() => void) | null = null;

    const load = () => {
      const img = new window.Image();
      img.onload = () => setFullImage(img);
      img.onerror = () => {
        // If thumb also didn't load, mark failed
        if (!thumbImage) setLoadFailed(true);
      };
      img.src = fullSrc;
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const handle = (
        window as Window & {
          requestIdleCallback: (
            cb: () => void,
            opts?: { timeout: number },
          ) => number;
        }
      ).requestIdleCallback(load, { timeout: 4000 });
      cancelHandle = () =>
        (
          window as Window & { cancelIdleCallback: (id: number) => void }
        ).cancelIdleCallback(handle);
    } else {
      const t = setTimeout(load, 50);
      cancelHandle = () => clearTimeout(t);
    }

    return () => cancelHandle?.();
  }, [fullSrc]); // eslint-disable-line react-hooks/exhaustive-deps

  // Shimmer: run rAF only while nothing is visible
  useEffect(() => {
    if (thumbImage || fullImage || loadFailed) {
      if (shimmerRafRef.current) cancelAnimationFrame(shimmerRafRef.current);
      return;
    }

    let startTs: number | null = null;
    const duration = 1200; // ms per sweep

    const animate = (ts: number) => {
      if (!startTs) startTs = ts;
      const progress = ((ts - startTs) % duration) / duration;
      // sweep from -30% to +100% of width
      setShimmerX((progress * 1.3 - 0.3) * item.width);
      shimmerRafRef.current = requestAnimationFrame(animate);
    };

    shimmerRafRef.current = requestAnimationFrame(animate);
    return () => {
      if (shimmerRafRef.current) cancelAnimationFrame(shimmerRafRef.current);
    };
  }, [thumbImage, fullImage, loadFailed, item.width]);

  // Attach transformer — re-run when full image loads so shapeRef exists
  useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected, isMultiSelected, fullImage]);

  const handleClick = (e: KonvaEventObject<MouseEvent>) => {
    if (e.evt.button !== 0) return;
    e.cancelBubble = true;
    onSelect?.(item.$id, e.evt.shiftKey);
  };

  const handleTap = (e: KonvaEventObject<TouchEvent>) => {
    e.cancelBubble = true;
    onSelect?.(item.$id, false);
  };

  const handleDragEnd = (e: KonvaEventObject<DragEvent>) => {
    // Use e.target so position is correct regardless of whether it's a Group
    // (skeleton) or KonvaImage (loaded) being dragged.
    onDragEnd?.(item.$id, e.target.x(), e.target.y());
  };

  const handleTransformEnd = () => {
    const node = shapeRef.current;
    if (node && onTransformEnd) onTransformEnd(item.$id, node);
  };

  const handleContextMenu = (e: KonvaEventObject<MouseEvent>) => {
    e.evt.preventDefault();
    e.cancelBubble = true;
    onContextMenu?.(item.$id, e.evt.clientX, e.evt.clientY);
  };

  const opacity = style.opacity !== undefined ? style.opacity : 1;
  const sharedGroupProps = {
    id: item.$id,
    x: item.x,
    y: item.y,
    rotation: item.rotation,
    scaleX: item.scaleX,
    scaleY: item.scaleY,
    visible: item.visible,
    opacity,
    draggable: isSelected && interaction.draggable !== false && !item.locked,
    onClick: handleClick,
    onTap: handleTap,
    onDragEnd: handleDragEnd,
    onContextMenu: handleContextMenu,
  };

  // ── Error state ──────────────────────────────────────────────────────────────
  if (loadFailed) {
    return (
      <Group {...sharedGroupProps}>
        <Rect
          width={item.width}
          height={item.height}
          fill="#3b1010"
          stroke="#ef4444"
          strokeWidth={1}
          cornerRadius={4}
        />
      </Group>
    );
  }

  // ── Shimmer skeleton (nothing loaded yet) ────────────────────────────────────
  if (!thumbImage && !fullImage) {
    const shimmerW = item.width * 0.35;
    return (
      <Group {...sharedGroupProps}>
        {/* Base */}
        <Rect
          width={item.width}
          height={item.height}
          fill="#1e293b"
          stroke="#334155"
          strokeWidth={1}
          cornerRadius={4}
        />
        {/* Sweeping highlight */}
        <Rect
          x={shimmerX}
          y={0}
          width={shimmerW}
          height={item.height}
          cornerRadius={4}
          fillLinearGradientStartPoint={{ x: 0, y: 0 }}
          fillLinearGradientEndPoint={{ x: shimmerW, y: 0 }}
          fillLinearGradientColorStops={[
            0,
            "rgba(255,255,255,0)",
            0.5,
            "rgba(255,255,255,0.06)",
            1,
            "rgba(255,255,255,0)",
          ]}
        />
        {/* Static image-icon hint */}
        <Rect
          x={item.width / 2 - 16}
          y={item.height / 2 - 12}
          width={32}
          height={24}
          fill="#334155"
          cornerRadius={3}
        />
        <Rect
          x={item.width / 2 - 8}
          y={item.height / 2 - 6}
          width={16}
          height={10}
          fill="#475569"
          cornerRadius={2}
        />
      </Group>
    );
  }

  // ── Blurry thumbnail + loading indicator ────────────────────────────────────
  const displayImage = fullImage ?? thumbImage!;
  const isStillLoading = !fullImage && !!thumbImage;

  return (
    <>
      {/* Render KonvaImage directly (no Group wrapper) so drag position is the
          image's own x/y that matches item.x/item.y */}
      <KonvaImage
        ref={shapeRef}
        id={item.$id}
        x={item.x}
        y={item.y}
        width={item.width}
        height={item.height}
        rotation={item.rotation}
        scaleX={item.scaleX}
        scaleY={item.scaleY}
        visible={item.visible}
        opacity={opacity}
        image={displayImage}
        draggable={isSelected && interaction.draggable !== false && !item.locked}
        onClick={handleClick}
        onTap={handleTap}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
        onContextMenu={handleContextMenu}
      />
      {/* Thin progress pulse at bottom while upgrading to full res */}
      {isStillLoading && (
        <Rect
          listening={false}
          x={item.x}
          y={item.y + item.height - 3}
          width={item.width}
          height={3}
          fill="rgba(59,130,246,0.5)"
          cornerRadius={2}
        />
      )}
      {isSelected && !isMultiSelected && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 1 || newBox.height < 1) return oldBox;
            return newBox;
          }}
          rotateEnabled={true}
          enabledAnchors={[
            "top-left",
            "top-right",
            "bottom-left",
            "bottom-right",
          ]}
          anchorFill={layerHighlightColor || "#3b82f6"}
          anchorStroke={layerHighlightColor || "#3b82f6"}
          borderStroke={layerHighlightColor || "#3b82f6"}
          anchorSize={8}
          anchorCornerRadius={2}
        />
      )}
    </>
  );
};
