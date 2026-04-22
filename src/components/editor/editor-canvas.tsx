"use client";

/**
 * Editor Canvas
 * Main Konva stage component that renders the board, layers, and items
 */

import { useRef, useCallback, useEffect, useState } from "react";
import { Stage, Layer, Rect, Group } from "react-konva";
import type { KonvaEventObject } from "konva/lib/Node";
import type Konva from "konva";
import { useBoardStore } from "@/stores/board-store";
import { useUIStore, type ToolType } from "@/stores/ui-store";
import { useAuthContext } from "@/contexts/auth-context";
import { LayerRenderer } from "./layer-renderer";
import { ShapePreview } from "./shape-preview";
import { ContextMenu } from "./context-menu";
import { MultiSelectTransformer } from "./multi-select-transformer";
import { ImageUploadModal } from "./image-upload-modal";
import { PinPopover } from "./pin-popover";
import { TextEditor } from "./text-editor";
import { useShapeCreator } from "@/hooks/use-shape-creator";
import { useThumbnail } from "@/hooks/use-thumbnail";
import {
  bringForward,
  sendBackward,
  bringToFront,
  sendToBack,
  bringForwardMulti,
  sendBackwardMulti,
  bringToFrontMulti,
  sendToBackMulti,
} from "@/lib/ordering-commands";
import type { BoardItem } from "@/types/board";
import { parseMapSettings } from "@/types/board";
import { LayoutDashboard, Crosshair, Map, Check, X, Move } from "lucide-react";
import { MapRenderer, isMapBoard } from "./map-renderer";
import { formatCoordinate } from "@/lib/geo-utils";
import type { CoordinateFormat } from "@/lib/geo-utils";

import { updateBoard as updateBoardApi } from "@/services/board-service";
import { toast } from "sonner";

export function EditorCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);

  // Capture a thumbnail snapshot after each auto-save
  useThumbnail(stageRef);

  // Board state
  const board = useBoardStore((state) => state.board);
  const layers = useBoardStore((state) => state.layers);
  const itemsByLayer = useBoardStore((state) => state.itemsByLayer);
  const updateItem = useBoardStore((state) => state.updateItem);
  const removeItem = useBoardStore((state) => state.removeItem);
  const duplicateItem = useBoardStore((state) => state.duplicateItem);
  const reorderItems = useBoardStore((state) => state.reorderItems);
  const groupItemsAction = useBoardStore((state) => state.groupItems);
  const ungroupItemsAction = useBoardStore((state) => state.ungroupItems);
  const updateBoard = useBoardStore((state) => state.updateBoard);

  // UI state
  const viewport = useUIStore((state) => state.viewport);
  const setViewport = useUIStore((state) => state.setViewport);
  const selectedItemIds = useUIStore((state) => state.selectedItemIds);
  const selectItem = useUIStore((state) => state.selectItem);
  const selectItems = useUIStore((state) => state.selectItems);
  const clearSelection = useUIStore((state) => state.clearSelection);
  const isPanning = useUIStore((state) => state.isPanning);
  const activeTool = useUIStore((state) => state.activeTool);
  const setActiveTool = useUIStore((state) => state.setActiveTool);
  const selectedLayerId = useUIStore((state) => state.selectedLayerId);
  const showContextMenu = useUIStore((state) => state.showContextMenu);
  const hideContextMenu = useUIStore((state) => state.hideContextMenu);
  const contextMenuTargetId = useUIStore((state) => state.contextMenuTargetId);
  const isEditingMapPosition = useUIStore((state) => state.isEditingMapPosition);
  const setIsEditingMapPosition = useUIStore((state) => state.setIsEditingMapPosition);

  // Auth
  const { user } = useAuthContext();

  // Shape creator
  const {
    drawingState,
    previewShape,
    pendingImageCreation,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    createShape,
    finalizeImageItem,
    clearPendingImageCreation,
    openImageCreation,
  } = useShapeCreator();

  // Container dimensions
  const [containerSize, setContainerSize] = useState({
    width: 800,
    height: 600,
  });

  // Flag to prevent click handler from clearing a just-completed drag-select
  const justDragSelected = useRef(false);

  // Selection box state for multi-select drag
  const [selectionBox, setSelectionBox] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null>(null);

  // Middle mouse button state - temporarily switches to hand tool while pressed
  const previousToolRef = useRef<ToolType | null>(null);
  const isMiddleMouseDown = useRef(false);
  // Last native clientX/Y used for middle-mouse pan delta calculation
  const middleMouseLastPos = useRef<{ x: number; y: number } | null>(null);
  // Accumulated viewport position during a middle-mouse pan session
  const panViewportRef = useRef({ x: 0, y: 0 });

  // Handle middle mouse button - temporarily activate hand tool
  // This uses capture phase to intercept before any child handlers
  const handleMiddleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 1) {
        // Middle mouse button
        e.preventDefault();
        e.stopPropagation();
        isMiddleMouseDown.current = true;
        middleMouseLastPos.current = { x: e.clientX, y: e.clientY };
        // Seed the pan ref from the current viewport so deltas accumulate correctly
        panViewportRef.current = { x: viewport.x, y: viewport.y };
        previousToolRef.current = activeTool;
        setActiveTool("hand");
      }
    },
    [activeTool, setActiveTool, viewport],
  );

  // Handle mouse move for middle-mouse panning (native, bypasses Konva draggable)
  // Moves the Konva stage node directly — no React re-render per frame → fluid panning
  const handleMiddleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isMiddleMouseDown.current || !middleMouseLastPos.current) return;
      const dx = e.clientX - middleMouseLastPos.current.x;
      const dy = e.clientY - middleMouseLastPos.current.y;
      middleMouseLastPos.current = { x: e.clientX, y: e.clientY };
      panViewportRef.current = {
        x: panViewportRef.current.x + dx,
        y: panViewportRef.current.y + dy,
      };
      // Directly mutate Konva stage position — same as how draggable works internally
      const stage = stageRef.current;
      if (stage) {
        stage.position(panViewportRef.current);
        stage.batchDraw();
      }
      // Mutate the map container directly for perfect 60fps sync without React lag
      if (mapContainerRef.current) {
        mapContainerRef.current.style.transform = `translate(${panViewportRef.current.x}px, ${panViewportRef.current.y}px) scale(${viewport.scale})`;
      }
    },
    [viewport.scale],
  );

  // Stop middle-mouse pan: flush accumulated position into React state, restore tool
  const stopMiddleMousePan = useCallback(() => {
    if (!isMiddleMouseDown.current) return;
    isMiddleMouseDown.current = false;
    middleMouseLastPos.current = null;
    // Sync final position back to React/Zustand state so the rest of the app is correct
    setViewport({ x: panViewportRef.current.x, y: panViewportRef.current.y });
    if (previousToolRef.current !== null) {
      setActiveTool(previousToolRef.current);
      previousToolRef.current = null;
    }
  }, [setViewport, setActiveTool]);

  // Handle middle mouse button release - restore previous tool
  const handleMiddleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 1) {
        e.preventDefault();
        e.stopPropagation();
        stopMiddleMousePan();
      }
    },
    [stopMiddleMousePan],
  );

  // Handle mouse leaving the container - restore tool if middle mouse was down
  const handleMouseLeave = useCallback(() => {
    stopMiddleMousePan();
  }, [stopMiddleMousePan]);

  // Global mouseup handler to catch middle mouse release outside the canvas
  useEffect(() => {
    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (e.button === 1) {
        e.preventDefault();
        stopMiddleMousePan();
      }
    };

    // Use capture phase to intercept before other handlers
    document.addEventListener("mouseup", handleGlobalMouseUp, true);
    return () => {
      document.removeEventListener("mouseup", handleGlobalMouseUp, true);
    };
  }, [stopMiddleMousePan]);

  // Update container size on mount and resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Handle item selection (with group awareness)
  const handleSelectItem = useCallback(
    (itemId: string, addToSelection: boolean) => {
      // Check if item is part of a group — select all group members together
      const allItems = Object.values(itemsByLayer).flat();
      const item = allItems.find((i) => i.$id === itemId);
      if (item?.parentGroupId) {
        const memberIds = allItems
          .filter((i) => i.parentGroupId === item.parentGroupId)
          .map((i) => i.$id);
        if (addToSelection) {
          memberIds.forEach((id) => selectItem(id, true));
        } else {
          selectItems(memberIds);
        }
      } else {
        selectItem(itemId, addToSelection);
      }
    },
    [selectItem, selectItems, itemsByLayer],
  );

  // Handle item updates from drag/transform
  const handleUpdateItem = useCallback(
    (itemId: string, updates: Partial<BoardItem>) => {
      updateItem(itemId, updates);
    },
    [updateItem],
  );

  // ─── Context Menu ────────────────────────────────────────────────────────────

  const handleItemContextMenu = useCallback(
    (itemId: string, x: number, y: number) => {
      // Select the right-clicked item if not already selected
      if (!selectedItemIds.includes(itemId)) {
        selectItem(itemId, false);
      }
      showContextMenu(x, y, itemId);
    },
    [selectedItemIds, selectItem, showContextMenu],
  );

  /** Find the layer that contains a given item */
  const findItemLayer = useCallback(
    (itemId: string) => {
      for (const [layerId, items] of Object.entries(itemsByLayer)) {
        if (items.some((i) => i.$id === itemId)) return layerId;
      }
      return null;
    },
    [itemsByLayer],
  );

  /** Group selected item IDs by their layer */
  const groupSelectedByLayer = useCallback(
    (ids: string[]) => {
      const result: Record<string, string[]> = {};
      for (const id of ids) {
        const layerId = findItemLayer(id);
        if (layerId) {
          if (!result[layerId]) result[layerId] = [];
          result[layerId].push(id);
        }
      }
      return result;
    },
    [findItemLayer],
  );

  // ── Context-menu handlers (multi-select aware) ───────────────────────────

  const handleContextMenuBringForward = useCallback(() => {
    if (selectedItemIds.length === 0) return;
    const byLayer = groupSelectedByLayer(selectedItemIds);
    for (const [layerId, ids] of Object.entries(byLayer)) {
      const items = itemsByLayer[layerId] || [];
      const newItems =
        ids.length === 1
          ? bringForward(items, ids[0])
          : bringForwardMulti(items, ids);
      reorderItems(
        layerId,
        newItems.map((i) => i.$id),
      );
    }
    hideContextMenu();
  }, [
    selectedItemIds,
    groupSelectedByLayer,
    itemsByLayer,
    reorderItems,
    hideContextMenu,
  ]);

  const handleContextMenuSendBackward = useCallback(() => {
    if (selectedItemIds.length === 0) return;
    const byLayer = groupSelectedByLayer(selectedItemIds);
    for (const [layerId, ids] of Object.entries(byLayer)) {
      const items = itemsByLayer[layerId] || [];
      const newItems =
        ids.length === 1
          ? sendBackward(items, ids[0])
          : sendBackwardMulti(items, ids);
      reorderItems(
        layerId,
        newItems.map((i) => i.$id),
      );
    }
    hideContextMenu();
  }, [
    selectedItemIds,
    groupSelectedByLayer,
    itemsByLayer,
    reorderItems,
    hideContextMenu,
  ]);

  const handleContextMenuBringToFront = useCallback(() => {
    if (selectedItemIds.length === 0) return;
    const byLayer = groupSelectedByLayer(selectedItemIds);
    for (const [layerId, ids] of Object.entries(byLayer)) {
      const items = itemsByLayer[layerId] || [];
      const newItems =
        ids.length === 1
          ? bringToFront(items, ids[0])
          : bringToFrontMulti(items, ids);
      reorderItems(
        layerId,
        newItems.map((i) => i.$id),
      );
    }
    hideContextMenu();
  }, [
    selectedItemIds,
    groupSelectedByLayer,
    itemsByLayer,
    reorderItems,
    hideContextMenu,
  ]);

  const handleContextMenuSendToBack = useCallback(() => {
    if (selectedItemIds.length === 0) return;
    const byLayer = groupSelectedByLayer(selectedItemIds);
    for (const [layerId, ids] of Object.entries(byLayer)) {
      const items = itemsByLayer[layerId] || [];
      const newItems =
        ids.length === 1
          ? sendToBack(items, ids[0])
          : sendToBackMulti(items, ids);
      reorderItems(
        layerId,
        newItems.map((i) => i.$id),
      );
    }
    hideContextMenu();
  }, [
    selectedItemIds,
    groupSelectedByLayer,
    itemsByLayer,
    reorderItems,
    hideContextMenu,
  ]);

  const handleContextMenuToggleVisibility = useCallback(() => {
    if (selectedItemIds.length === 0) return;
    const allItems = Object.values(itemsByLayer).flat();
    for (const id of selectedItemIds) {
      const item = allItems.find((i) => i.$id === id);
      if (item) updateItem(id, { visible: !item.visible });
    }
    hideContextMenu();
  }, [selectedItemIds, itemsByLayer, updateItem, hideContextMenu]);

  const handleContextMenuToggleLock = useCallback(() => {
    if (selectedItemIds.length === 0) return;
    const allItems = Object.values(itemsByLayer).flat();
    for (const id of selectedItemIds) {
      const item = allItems.find((i) => i.$id === id);
      if (item) updateItem(id, { locked: !item.locked });
    }
    hideContextMenu();
  }, [selectedItemIds, itemsByLayer, updateItem, hideContextMenu]);

  const handleContextMenuDuplicate = useCallback(() => {
    if (selectedItemIds.length === 0) return;
    selectedItemIds.forEach((id) => duplicateItem(id));
    hideContextMenu();
  }, [selectedItemIds, duplicateItem, hideContextMenu]);

  const handleContextMenuDelete = useCallback(() => {
    if (selectedItemIds.length === 0) return;
    selectedItemIds.forEach((id) => removeItem(id));
    clearSelection();
    hideContextMenu();
  }, [selectedItemIds, removeItem, clearSelection, hideContextMenu]);

  const handleContextMenuGroup = useCallback(() => {
    if (selectedItemIds.length < 2) return;
    groupItemsAction(selectedItemIds);
    hideContextMenu();
  }, [selectedItemIds, groupItemsAction, hideContextMenu]);

  const handleContextMenuUngroup = useCallback(() => {
    const allItems = Object.values(itemsByLayer).flat();
    const groupIds = new Set<string>();
    for (const id of selectedItemIds) {
      const item = allItems.find((i) => i.$id === id);
      if (item?.parentGroupId) groupIds.add(item.parentGroupId);
    }
    for (const groupId of groupIds) {
      ungroupItemsAction(groupId);
    }
    clearSelection();
    hideContextMenu();
  }, [
    selectedItemIds,
    itemsByLayer,
    ungroupItemsAction,
    clearSelection,
    hideContextMenu,
  ]);

  // ─── Stage Events ────────────────────────────────────────────────────────────

  // Handle stage click (deselect when clicking empty area, create pin on click)
  const handleStageClick = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      // Ignore middle and right clicks
      if (e.evt.button !== 0) return;
      // Only clear selection if clicking on the stage itself (not an item)
      if (e.target === e.target.getStage()) {
        // Handle pin tool - create pin on single click
        if (activeTool === "pin") {
          const stage = stageRef.current;
          if (!stage) return;

          const pointer = stage.getPointerPosition();
          if (!pointer) return;

          // Convert to canvas coordinates
          const x = (pointer.x - viewport.x) / viewport.scale;
          const y = (pointer.y - viewport.y) / viewport.scale;

          createShape(x, y);
          return;
        }

        // Skip clearing if we just finished a drag-select
        if (justDragSelected.current) {
          justDragSelected.current = false;
          return;
        }

        clearSelection();
      }
    },
    [activeTool, viewport, createShape, clearSelection],
  );

  // Handle mouse down on stage
  const handleStageMouseDown = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      // Only handle if clicking on the stage itself
      if (e.target !== e.target.getStage()) return;

      // Pin tool uses single click, not drag
      if (activeTool === "pin") return;

      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      // Convert to canvas coordinates
      const x = (pointer.x - viewport.x) / viewport.scale;
      const y = (pointer.y - viewport.y) / viewport.scale;

      // Start selection box for select tool
      if (activeTool === "select") {
        setSelectionBox({ startX: x, startY: y, endX: x, endY: y });
        return;
      }

      handleMouseDown(x, y);
    },
    [activeTool, viewport, handleMouseDown],
  );

  // Handle mouse move on stage
  const handleStageMouseMove = useCallback(
    (_e: KonvaEventObject<MouseEvent>) => {
      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      // Convert to canvas coordinates
      const x = (pointer.x - viewport.x) / viewport.scale;
      const y = (pointer.y - viewport.y) / viewport.scale;

      // Update selection box for select tool
      if (selectionBox && activeTool === "select") {
        setSelectionBox((prev) =>
          prev ? { ...prev, endX: x, endY: y } : null,
        );
        return;
      }

      handleMouseMove(x, y);
    },
    [selectionBox, activeTool, viewport, handleMouseMove],
  );

  // Handle mouse up on stage
  const handleStageMouseUp = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      // Convert to canvas coordinates
      const x = (pointer.x - viewport.x) / viewport.scale;
      const y = (pointer.y - viewport.y) / viewport.scale;

      // Finalize selection box for select tool
      if (selectionBox && activeTool === "select") {
        const selRect = {
          x: Math.min(selectionBox.startX, selectionBox.endX),
          y: Math.min(selectionBox.startY, selectionBox.endY),
          width: Math.abs(selectionBox.endX - selectionBox.startX),
          height: Math.abs(selectionBox.endY - selectionBox.startY),
        };

        // Only select if the selection box has some size
        if (selRect.width > 5 && selRect.height > 5) {
          // Inline intersection check to avoid hoisting issues
          const currentSelectedIds: string[] = e.evt.shiftKey
            ? [...selectedItemIds]
            : [];

          for (const items of Object.values(itemsByLayer)) {
            for (const item of items) {
              if (item.locked) continue;

              // Handle line and arrow items - they need special intersection logic
              if (item.type === "line" || item.type === "arrow") {
                // Parse content to get points
                let points: number[] = [
                  0,
                  0,
                  item.width || 100,
                  item.height || 100,
                ];
                try {
                  const content = JSON.parse(item.contentJson || "{}");
                  if (content.points && Array.isArray(content.points)) {
                    points = content.points;
                  }
                } catch {
                  // Use default
                }

                // Calculate actual line endpoints (x, y is the offset)
                const x1 = item.x + (points[0] || 0);
                const y1 = item.y + (points[1] || 0);
                const x2 = item.x + (points[2] || points[0] || 0);
                const y2 = item.y + (points[3] || points[1] || 0);

                // Check if line intersects the selection rectangle
                if (lineIntersectsRect(x1, y1, x2, y2, selRect)) {
                  if (!currentSelectedIds.includes(item.$id)) {
                    currentSelectedIds.push(item.$id);
                  }
                }
                continue;
              }

              // Standard bounding box intersection for other shapes
              const itemRect = {
                x: item.x,
                y: item.y,
                width: item.width || 100,
                height: item.height || 100,
              };

              // Check intersection
              if (
                selRect.x < itemRect.x + itemRect.width &&
                selRect.x + selRect.width > itemRect.x &&
                selRect.y < itemRect.y + itemRect.height &&
                selRect.y + selRect.height > itemRect.y
              ) {
                if (!currentSelectedIds.includes(item.$id)) {
                  currentSelectedIds.push(item.$id);
                }
              }
            }
          }

          // Update selection for each item
          if (currentSelectedIds.length > 0) {
            if (!e.evt.shiftKey) {
              clearSelection();
            }
            currentSelectedIds.forEach((id) => selectItem(id, true));
          }

          justDragSelected.current = true;
        }

        setSelectionBox(null);
        return;
      }

      handleMouseUp(x, y);
    },
    [
      selectionBox,
      activeTool,
      viewport,
      handleMouseUp,
      itemsByLayer,
      selectedItemIds,
      clearSelection,
      selectItem,
    ],
  );

  // Handle wheel for zoom
  const handleWheel = useCallback(
    (e: KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();

      const stage = stageRef.current;
      if (!stage) return;

      const oldScale = viewport.scale;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const mousePointTo = {
        x: (pointer.x - viewport.x) / oldScale,
        y: (pointer.y - viewport.y) / oldScale,
      };

      // Zoom in or out
      const direction = e.evt.deltaY > 0 ? -1 : 1;
      const scaleBy = 1.1;
      const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

      // Clamp scale between 0.1 and 5
      const clampedScale = Math.max(0.1, Math.min(5, newScale));

      setViewport({
        x: pointer.x - mousePointTo.x * clampedScale,
        y: pointer.y - mousePointTo.y * clampedScale,
        scale: clampedScale,
      });
    },
    [viewport, setViewport],
  );

  // Handle drag for panning
  const handleDragEnd = useCallback(
    (e: KonvaEventObject<DragEvent>) => {
      if (e.target === e.target.getStage()) {
        setViewport({
          x: e.target.x(),
          y: e.target.y(),
        });
      }
    },
    [setViewport],
  );

  // Sync viewport during drag so the map behind it moves in real-time
  const handleDragMove = useCallback((e: KonvaEventObject<DragEvent>) => {
    if (e.target === e.target.getStage()) {
      const stage = e.target;
      // Mutate the map container directly for perfect sync with Konva's native drag
      if (mapContainerRef.current) {
        mapContainerRef.current.style.transform = `translate(${stage.x()}px, ${stage.y()}px) scale(${stage.scaleX()})`;
      }
    }
  }, []);

  // Prevent any shape drag initiated by a non-left-click (e.g. middle button)
  // dragstart bubbles to Stage so one handler covers all child shapes
  const handleStageDragStart = useCallback(
    (e: KonvaEventObject<DragEvent>) => {
      // isMiddleMouseDown is set synchronously in our native mousedown handler
      if (isMiddleMouseDown.current && e.target !== e.target.getStage()) {
        e.target.stopDrag();
      }
      // When in hand tool mode (pan), prevent any shape from being dragged
      // This ensures mobile panning gestures don't accidentally move shapes
      if (activeTool === "hand" && e.target !== e.target.getStage()) {
        e.target.stopDrag();
      }
    },
    [activeTool],
  );

  // Board dimensions (default to 1920x1080 if no board loaded)
  const boardWidth = board?.width || 1920;
  const boardHeight = board?.height || 1080;

  // Check if this board has a map background
  const hasMap = isMapBoard(board);
  const mapSettings = board ? parseMapSettings(board) : null;

  // State to hold temporary map settings while editing
  const [draftMapSettings, setDraftMapSettings] = useState<{ lat: number; lng: number; zoom: number } | null>(null);

  // Enter edit mode
  const handleEditMapPosition = useCallback(() => {
    if (!mapSettings) return;
    setDraftMapSettings({ lat: mapSettings.centerLat, lng: mapSettings.centerLng, zoom: mapSettings.zoom });
    setIsEditingMapPosition(true);
    // Switch to select tool so hand tool doesn't conflict
    setActiveTool("select");
  }, [mapSettings, setIsEditingMapPosition, setActiveTool]);

  // Cancel edit mode
  const handleCancelMapEdit = useCallback(() => {
    setIsEditingMapPosition(false);
    setDraftMapSettings(null);
  }, [setIsEditingMapPosition]);

  // Save edit mode
  const handleSaveMapEdit = useCallback(async () => {
    if (!board || !draftMapSettings || !mapSettings) return;
    
    const updatedMapSettingsJson = JSON.stringify({
      ...mapSettings,
      centerLat: draftMapSettings.lat,
      centerLng: draftMapSettings.lng,
      zoom: draftMapSettings.zoom,
    });

    // Optimistic update
    updateBoard({ mapSettingsJson: updatedMapSettingsJson });
    setIsEditingMapPosition(false);
    setDraftMapSettings(null);

    // Save to database
    try {
      await updateBoardApi(board.$id, { mapSettingsJson: updatedMapSettingsJson });
      toast.success("Map region saved");
    } catch (error) {
      console.error("Failed to save map settings:", error);
      toast.error("Failed to save map region");
    }
  }, [board, draftMapSettings, mapSettings, updateBoard, setIsEditingMapPosition]);

  // Map change during edit mode
  const handleMapChange = useCallback((lat: number, lng: number, zoom: number) => {
    setDraftMapSettings({ lat, lng, zoom });
  }, []);

  // When the image tool is selected, immediately open the upload modal
  // centered in the visible viewport — no drawing required.
  useEffect(() => {
    if (activeTool === "image" && !pendingImageCreation && board) {
      const centerX = (containerSize.width / 2 - viewport.x) / viewport.scale;
      const centerY = (containerSize.height / 2 - viewport.y) / viewport.scale;
      openImageCreation(centerX, centerY);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTool, board]);

  // Check if we should enable drawing mode (image is excluded — it opens a modal directly)
  const isDrawingTool = [
    "rectangle",
    "ellipse",
    "line",
    "arrow",
    "text",
  ].includes(activeTool);

  // Get cursor based on active tool
  const getCursor = () => {
    switch (activeTool) {
      case "select":
        return selectionBox ? "crosshair" : "default";
      case "hand":
        return isPanning ? "grabbing" : "grab";
      case "rectangle":
      case "ellipse":
      case "line":
      case "arrow":
      case "text":
      case "image":
        return "crosshair";
      default:
        return "default";
    }
  };

  // Check if two rectangles intersect or if rect1 contains rect2
  const rectanglesIntersect = (
    r1: { x: number; y: number; width: number; height: number },
    r2: { x: number; y: number; width: number; height: number },
  ): boolean => {
    return (
      r1.x < r2.x + r2.width &&
      r1.x + r1.width > r2.x &&
      r1.y < r2.y + r2.height &&
      r1.y + r1.height > r2.y
    );
  };

  // Check if a line segment intersects with a rectangle
  const lineIntersectsRect = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    rect: { x: number; y: number; width: number; height: number },
  ): boolean => {
    // Check if either endpoint is inside the rectangle
    const pointInRect = (px: number, py: number) =>
      px >= rect.x &&
      px <= rect.x + rect.width &&
      py >= rect.y &&
      py <= rect.y + rect.height;

    if (pointInRect(x1, y1) || pointInRect(x2, y2)) return true;

    // Check if the line segment intersects any edge of the rectangle
    const lines: [number, number, number, number][] = [
      // Top edge
      [rect.x, rect.y, rect.x + rect.width, rect.y],
      // Right edge
      [rect.x + rect.width, rect.y, rect.x + rect.width, rect.y + rect.height],
      // Bottom edge
      [rect.x, rect.y + rect.height, rect.x + rect.width, rect.y + rect.height],
      // Left edge
      [rect.x, rect.y, rect.x, rect.y + rect.height],
    ];

    for (const [rx1, ry1, rx2, ry2] of lines) {
      if (lineSegmentsIntersect(x1, y1, x2, y2, rx1, ry1, rx2, ry2)) {
        return true;
      }
    }

    return false;
  };

  // Check if two line segments intersect
  const lineSegmentsIntersect = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number,
    x4: number,
    y4: number,
  ): boolean => {
    const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
    if (Math.abs(denom) < 0.0001) return false;

    const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
    const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

    return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
  };

  // Check if a point is near a line segment (within threshold)
  const pointNearLine = (
    px: number,
    py: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    threshold: number,
  ): boolean => {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;
    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy) <= threshold;
  };

  // Get all selectable items within a selection rectangle
  const getItemsInSelectionRect = useCallback(
    (
      selRect: { x: number; y: number; width: number; height: number },
      addToSelection: boolean,
    ) => {
      const selectedIds: string[] = addToSelection ? [...selectedItemIds] : [];

      for (const items of Object.values(itemsByLayer)) {
        for (const item of items) {
          // Skip locked items
          if (item.locked) continue;

          // Create bounding rect for item (accounting for rotation would be more complex)
          const itemRect = {
            x: item.x,
            y: item.y,
            width: item.width || 100,
            height: item.height || 100,
          };

          if (rectanglesIntersect(selRect, itemRect)) {
            if (!selectedIds.includes(item.$id)) {
              selectedIds.push(item.$id);
            }
          }
        }
      }

      return selectedIds;
    },
    [itemsByLayer, selectedItemIds],
  );

  // Map cursor position for coordinate display
  const mapCursorPosition = useUIStore((s) => s.mapCursorPosition);
  const coordinateFormat = useUIStore((s) => s.coordinateFormat);
  const setCoordinateFormat = useUIStore((s) => s.setCoordinateFormat);

  return (
    <div
      ref={containerRef}
      className={`flex-1 relative overflow-hidden ${hasMap ? "bg-[#191a1a]" : "bg-gray-100"}`}
      style={{ cursor: getCursor() }}
      onMouseDown={handleMiddleMouseDown}
      onMouseMove={handleMiddleMouseMove}
      onMouseUp={handleMiddleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {/* Map layer — sized to board dimensions, transformed with Konva viewport
          so map and shapes move together as one unit.
          When editing map position, pointer events are auto so it's interactive,
          and the transform is reset so it fills the screen perfectly for editing. */}
      {hasMap && board && (
        <div
          ref={mapContainerRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: isEditingMapPosition ? "100%" : boardWidth,
            height: isEditingMapPosition ? "100%" : boardHeight,
            transform: isEditingMapPosition 
              ? "none" 
              : `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
            transformOrigin: "0 0",
            pointerEvents: isEditingMapPosition ? "auto" : "none",
            zIndex: isEditingMapPosition ? 10 : 0,
          }}
        >
          <MapRenderer
            board={board}
            width={isEditingMapPosition ? containerSize.width : boardWidth}
            height={isEditingMapPosition ? containerSize.height : boardHeight}
            interactive={isEditingMapPosition}
            onMapChange={handleMapChange}
          />
        </div>
      )}

      {/* Konva Stage — same viewport transform, shapes stay aligned with map */}
      <div 
        style={{ 
          opacity: isEditingMapPosition ? 0.3 : 1,
          pointerEvents: isEditingMapPosition ? "none" : "auto",
          transition: "opacity 0.2s",
        }}
      >
        <Stage
          ref={stageRef}
          width={containerSize.width}
          height={containerSize.height}
          x={viewport.x}
          y={viewport.y}
          scaleX={viewport.scale}
          scaleY={viewport.scale}
          draggable={activeTool === "hand"}
          onMouseDown={handleStageMouseDown}
          onMouseMove={handleStageMouseMove}
          onMouseUp={handleStageMouseUp}
          onClick={handleStageClick}
          onWheel={handleWheel}
          onDragStart={handleStageDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
        >
        {/* Board background and Grid - only shown for non-map boards */}
        {!hasMap && (
          <Layer listening={false}>
            <Rect
              x={0}
              y={0}
              width={boardWidth}
              height={boardHeight}
              fill={
                board &&
                board.backgroundType === "color" &&
                board.backgroundColor
                  ? board.backgroundColor
                  : "#ffffff"
              }
              shadowColor="rgba(0,0,0,0.15)"
              shadowBlur={10}
              shadowOffset={{ x: 0, y: 4 }}
            />
            {Array.from({ length: Math.ceil(boardHeight / 20) }).map((_, i) => (
              <Rect
                key={`h-${i}`}
                x={0}
                y={i * 20}
                width={boardWidth}
                height={0.5}
                fill="#f0f0f0"
                opacity={0.5}
              />
            ))}
            {Array.from({ length: Math.ceil(boardWidth / 20) }).map((_, i) => (
              <Rect
                key={`v-${i}`}
                x={i * 20}
                y={0}
                width={0.5}
                height={boardHeight}
                fill="#f0f0f0"
                opacity={0.5}
              />
            ))}
          </Layer>
        )}

        {/* All board layers in one Konva Layer — each board layer is a Group.
            Keeps Konva within the recommended 3-layer limit. */}
        <Layer>
          {[...layers]
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map((layer) => (
              <LayerRenderer
                key={layer.$id}
                layer={layer}
                items={itemsByLayer[layer.$id] || []}
                selectedItemIds={selectedItemIds}
                isLayerActive={selectedLayerId === layer.$id}
                onSelectItem={handleSelectItem}
                onUpdateItem={handleUpdateItem}
                onContextMenu={handleItemContextMenu}
              />
            ))}
        </Layer>

        {/* Shared UI overlay layer: transformer handles, shape preview, selection box.
            One layer instead of three keeps Konva within the recommended 3-5 layers.
            Transformer is listening=true (default) so resize/rotate anchors work. */}
        <Layer>
          {/* Multi-select transformer — resize / rotate handles */}
          <MultiSelectTransformer
            stageRef={stageRef}
            selectedItemIds={selectedItemIds}
            onUpdateItem={handleUpdateItem}
          />

          {/* Shape preview while drawing (non-interactive) */}
          {previewShape && (
            <Group listening={false}>
              <ShapePreview shape={previewShape} />
            </Group>
          )}

          {/* Selection box for drag-to-select (non-interactive) */}
          {selectionBox && activeTool === "select" && (
            <Rect
              x={Math.min(selectionBox.startX, selectionBox.endX)}
              y={Math.min(selectionBox.startY, selectionBox.endY)}
              width={Math.abs(selectionBox.endX - selectionBox.startX)}
              height={Math.abs(selectionBox.endY - selectionBox.startY)}
              fill="rgba(59, 130, 246, 0.1)"
              stroke="#3b82f6"
              strokeWidth={1}
              dash={[4, 4]}
              listening={false}
            />
          )}
        </Layer>
        </Stage>
      </div>

      {/* Context Menu (rendered outside the canvas) */}
      <ContextMenu
        onBringForward={handleContextMenuBringForward}
        onSendBackward={handleContextMenuSendBackward}
        onBringToFront={handleContextMenuBringToFront}
        onSendToBack={handleContextMenuSendToBack}
        onToggleVisibility={handleContextMenuToggleVisibility}
        onToggleLock={handleContextMenuToggleLock}
        onDuplicate={handleContextMenuDuplicate}
        onDelete={handleContextMenuDelete}
        onGroup={handleContextMenuGroup}
        onUngroup={handleContextMenuUngroup}
      />

      {/* Image upload modal */}
      {pendingImageCreation && board && (
        <ImageUploadModal
          pendingRect={pendingImageCreation}
          workspaceId={board.workspaceId}
          boardId={board.$id}
          userId={user?.$id || "unknown"}
          onUploadComplete={(x, y, w, h, src, assetId) => {
            finalizeImageItem(x, y, w, h, src, assetId);
            clearPendingImageCreation();
            setActiveTool("select");
          }}
          onCancel={() => {
            clearPendingImageCreation();
            setActiveTool("select");
          }}
        />
      )}

      {/* Empty state when no board */}
      {!board && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-gray-400 text-center">
            <LayoutDashboard className="w-16 h-16 mx-auto mb-4" />
            <p className="text-lg font-medium">No Board Selected</p>
            <p className="text-sm mt-1">
              Select or create a board to start editing
            </p>
          </div>
        </div>
      )}

      {/* Watermark logo - bottom right corner */}
      <div className="absolute bottom-4 right-4 opacity-40 hover:opacity-80 transition-opacity duration-300">
        <img src="/planymaps.svg" alt="Planymaps" className="w-8 h-8" />
      </div>

      {/* Tool indicator */}
      {isDrawingTool && !pendingImageCreation && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded text-sm">
          {activeTool === "image"
            ? "Drag to place image, or click to upload"
            : `Click and drag to draw ${activeTool}`}
        </div>
      )}

      {/* Pin hover popover — rendered outside Konva Stage to avoid reconciler conflicts */}
      <PinPopover />

      {/* Text inline editor — rendered outside Konva Stage to avoid reconciler conflicts */}
      <TextEditor />

      {/* Map coordinate badge — bottom-left, minimal */}
      {hasMap && mapCursorPosition && !isEditingMapPosition && (
        <div className="absolute bottom-12 left-4 z-10 glass-panel rounded-lg px-3 py-1.5 flex items-center gap-2 text-xs pointer-events-auto">
          <Crosshair className="w-3 h-3 text-[var(--accent-400)]" />
          <span className="text-white font-mono text-[11px]">
            {formatCoordinate(
              mapCursorPosition.lat,
              mapCursorPosition.lng,
              coordinateFormat,
            )}
          </span>
          <button
            onClick={() => {
              const formats: CoordinateFormat[] = ["dd", "dms", "ddm"];
              const idx = formats.indexOf(coordinateFormat);
              setCoordinateFormat(formats[(idx + 1) % formats.length]);
            }}
            className="px-1 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[var(--gray-400)] hover:text-white transition-colors text-[9px] uppercase tracking-wider"
          >
            {coordinateFormat.toUpperCase()}
          </button>
        </div>
      )}

      {/* Map Edit Controls */}
      {hasMap && !isEditingMapPosition && (
        <button
          onClick={handleEditMapPosition}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 glass-panel rounded-full px-5 py-2.5 flex items-center gap-2.5 text-sm text-white hover:bg-white/10 transition-all pointer-events-auto shadow-xl border border-white/10 hover:scale-105 active:scale-95"
        >
          <Move className="w-4 h-4 text-[var(--accent-400)]" />
          <span className="font-medium tracking-wide">Reposition Map</span>
        </button>
      )}

      {isEditingMapPosition && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 glass-panel rounded-xl flex items-center justify-between px-5 py-3 shadow-2xl border border-white/10 pointer-events-auto w-[480px]">
          <div className="flex items-center gap-3 text-white">
            <div className="w-8 h-8 rounded-full bg-[var(--accent-500)]/20 flex items-center justify-center">
              <Map className="w-4 h-4 text-[var(--accent-400)]" />
            </div>
            <div>
              <h3 className="font-semibold text-sm tracking-wide">Reposition Mode</h3>
              <p className="text-xs text-[var(--gray-400)]">Drag and zoom to set map bounds</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancelMapEdit}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-[var(--gray-300)] hover:bg-white/5 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              Cancel
            </button>
            <button
              onClick={handleSaveMapEdit}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-[var(--accent-500)] hover:bg-[var(--accent-400)] text-white transition-colors shadow cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
