/**
 * useMobileGestures Hook
 * Handles touch gestures for mobile devices
 */

import { useCallback, useRef, useState } from "react";
import { useUIStore } from "@/stores/ui-store";
import { useBoardStore } from "@/stores/board-store";

interface TouchState {
  isTouching: boolean;
  touchCount: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  startDistance: number;
  lastTap: number;
}

interface GestureState {
  mode: "none" | "pan" | "zoom" | "draw" | "select";
  initialDistance: number;
  initialScale: number;
}

const LONG_PRESS_DURATION = 500;
const TAP_DURATION = 200;

export function useMobileGestures() {
  const [touchState, setTouchState] = useState<TouchState>({
    isTouching: false,
    touchCount: 0,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    startDistance: 0,
    lastTap: 0,
  });

  const [gestureState, setGestureState] = useState<GestureState>({
    mode: "none",
    initialDistance: 0,
    initialScale: 1,
  });

  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // UI Store
  const viewport = useUIStore((state) => state.viewport);
  const setViewport = useUIStore((state) => state.setViewport);
  const activeTool = useUIStore((state) => state.activeTool);
  const selectedItemIds = useUIStore((state) => state.selectedItemIds);
  const selectItem = useUIStore((state) => state.selectItem);
  const clearSelection = useUIStore((state) => state.clearSelection);
  const showContextMenu = useUIStore((state) => state.showContextMenu);
  const hideContextMenu = useUIStore((state) => state.hideContextMenu);

  // Calculate distance between two touch points
  const getDistance = (touches: TouchList): number => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Get center point between two touches
  const getCenter = (touches: TouchList): { x: number; y: number } => {
    if (touches.length < 2) {
      return { x: touches[0].clientX, y: touches[0].clientY };
    }
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    };
  };

  // Handle touch start
  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      const touches = e.touches;
      const touchCount = touches.length;

      if (touchCount === 1) {
        const touch = touches[0];
        const now = Date.now();

        setTouchState({
          isTouching: true,
          touchCount,
          startX: touch.clientX,
          startY: touch.clientY,
          currentX: touch.clientX,
          currentY: touch.clientY,
          startDistance: 0,
          lastTap: now,
        });

        // Start long press timer for context menu
        longPressTimerRef.current = setTimeout(() => {
          if (touchState.isTouching && touchState.touchCount === 1) {
            // Show context menu
            showContextMenu(
              touch.clientX,
              touch.clientY,
              selectedItemIds[0] || "",
            );
          }
        }, LONG_PRESS_DURATION);

        // Determine mode based on active tool
        const isDrawTool = [
          "rectangle",
          "ellipse",
          "line",
          "arrow",
          "text",
        ].includes(activeTool);
        if (isDrawTool) {
          setGestureState({
            mode: "draw",
            initialDistance: 0,
            initialScale: viewport.scale,
          });
        } else {
          setGestureState({
            mode: "select",
            initialDistance: 0,
            initialScale: viewport.scale,
          });
        }
      } else if (touchCount === 2) {
        // Clear long press timer
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
        }

        const distance = getDistance(touches);
        const center = getCenter(touches);

        setTouchState({
          isTouching: true,
          touchCount,
          startX: center.x,
          startY: center.y,
          currentX: center.x,
          currentY: center.y,
          startDistance: distance,
          lastTap: 0,
        });

        setGestureState({
          mode: "zoom",
          initialDistance: distance,
          initialScale: viewport.scale,
        });
      }
    },
    [activeTool, viewport.scale, selectedItemIds, showContextMenu],
  );

  // Handle touch move
  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      const touches = e.touches;
      const touchCount = touches.length;

      // Clear long press timer on move
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }

      if (touchCount === 1 && gestureState.mode === "pan") {
        const touch = touches[0];
        const deltaX = touch.clientX - touchState.startX;
        const deltaY = touch.clientY - touchState.startY;

        setTouchState((prev) => ({
          ...prev,
          currentX: touch.clientX,
          currentY: touch.clientY,
        }));

        setViewport({
          x: viewport.x + deltaX,
          y: viewport.y + deltaY,
        });

        // Reset start point for next delta calculation
        setTouchState((prev) => ({
          ...prev,
          startX: touch.clientX,
          startY: touch.clientY,
        }));
      } else if (touchCount === 2 && gestureState.mode === "zoom") {
        const distance = getDistance(touches);
        const center = getCenter(touches);
        const scaleFactor = distance / gestureState.initialDistance;
        const newScale = Math.max(
          0.1,
          Math.min(5, gestureState.initialScale * scaleFactor),
        );

        // Calculate pan delta
        const deltaX = center.x - touchState.currentX;
        const deltaY = center.y - touchState.currentY;

        setTouchState((prev) => ({
          ...prev,
          currentX: center.x,
          currentY: center.y,
        }));

        // Calculate new viewport position to zoom toward center point
        const mousePointTo = {
          x: (center.x - viewport.x) / viewport.scale,
          y: (center.y - viewport.y) / viewport.scale,
        };

        setViewport({
          x: center.x - mousePointTo.x * newScale,
          y: center.y - mousePointTo.y * newScale,
          scale: newScale,
        });
      }
    },
    [gestureState, touchState, viewport, setViewport],
  );

  // Handle touch end
  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      const touchDuration = Date.now() - touchState.lastTap;
      const deltaX = Math.abs(touchState.currentX - touchState.startX);
      const deltaY = Math.abs(touchState.currentY - touchState.startY);
      const isTap = touchDuration < TAP_DURATION && deltaX < 10 && deltaY < 10;

      // Clear long press timer
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }

      // If it was a tap and we have a context menu open, close it
      if (isTap && touchState.lastTap > 0) {
        hideContextMenu();
      }

      setTouchState({
        isTouching: false,
        touchCount: 0,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        startDistance: 0,
        lastTap: 0,
      });

      setGestureState({
        mode: "none",
        initialDistance: 0,
        initialScale: 1,
      });
    },
    [touchState, hideContextMenu],
  );

  // Set pan mode
  const setPanMode = useCallback(() => {
    setGestureState({
      mode: "pan",
      initialDistance: 0,
      initialScale: viewport.scale,
    });
  }, [viewport.scale]);

  return {
    touchState,
    gestureState,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    setPanMode,
  };
}
