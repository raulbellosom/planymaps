/**
 * useShapeCreator Hook
 * Handles shape creation flow for the visual editor
 */

import { useCallback, useState } from "react";
import { useBoardStore } from "@/stores/board-store";
import { useUIStore, type ToolType } from "@/stores/ui-store";
import { useAuthContext } from "@/contexts/auth-context";
import type {
  BoardItem,
  ItemType,
  StyleProps,
  ContentProps,
} from "@/types/board";
import { ID } from "appwrite";

// Default style values
const defaultStyle: StyleProps = {
  fill: "#ffffff",
  stroke: "#000000",
  strokeWidth: 2,
  opacity: 1,
};

// Default content based on item type
function getDefaultContent(type: ItemType): ContentProps {
  switch (type) {
    case "text":
      return { text: "Text" };
    case "image":
      return {};
    case "pin":
      return { label: "Pin", note: "" };
    default:
      return {};
  }
}

// Convert tool type to item type
function toolToItemType(tool: ToolType): ItemType | null {
  switch (tool) {
    case "rectangle":
      return "rectangle";
    case "ellipse":
      return "ellipse";
    case "line":
      return "line";
    case "arrow":
      return "arrow";
    case "text":
      return "text";
    case "image":
      return "image";
    case "pin":
      return "pin";
    default:
      return null;
  }
}

export interface DrawingState {
  isDrawing: boolean;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export interface PendingImageCreation {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface UseShapeCreatorReturn {
  drawingState: DrawingState;
  previewShape: Partial<BoardItem> | null;
  pendingImageCreation: PendingImageCreation | null;
  handleMouseDown: (x: number, y: number) => void;
  handleMouseMove: (x: number, y: number) => void;
  handleMouseUp: (x: number, y: number) => void;
  createShape: (x: number, y: number) => BoardItem | null;
  finalizeImageItem: (
    x: number,
    y: number,
    width: number,
    height: number,
    src: string,
    assetId: string,
  ) => void;
  clearPendingImageCreation: () => void;
  /** Immediately open the image upload modal centered at the given canvas point */
  openImageCreation: (centerX: number, centerY: number) => void;
}

export function useShapeCreator(): UseShapeCreatorReturn {
  const [drawingState, setDrawingState] = useState<DrawingState>({
    isDrawing: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
  });

  const [previewShape, setPreviewShape] = useState<Partial<BoardItem> | null>(
    null,
  );

  const [pendingImageCreation, setPendingImageCreation] =
    useState<PendingImageCreation | null>(null);

  const { user } = useAuthContext();
  const activeTool = useUIStore((state) => state.activeTool);
  const selectedLayerId = useUIStore((state) => state.selectedLayerId);
  const layers = useBoardStore((state) => state.layers);
  const board = useBoardStore((state) => state.board);
  const addItem = useBoardStore((state) => state.addItem);

  // Get the active layer ID (use selected or first available)
  const getActiveLayerId = useCallback((): string | null => {
    if (selectedLayerId) return selectedLayerId;
    if (layers.length > 0) return layers[0].$id;
    return null;
  }, [selectedLayerId, layers]);

  // Create a new item
  const createNewItem = useCallback(
    (
      type: ItemType,
      x: number,
      y: number,
      width: number,
      height: number,
    ): BoardItem | null => {
      const layerId = getActiveLayerId();
      if (!layerId || !board) return null;

      const itemType = toolToItemType(activeTool);
      if (!itemType) return null;

      const style = { ...defaultStyle };
      // Text items default to a dark, legible colour rather than white
      if (type === "text") {
        style.fill = "#1e293b"; // slate-800
      }
      const content = getDefaultContent(type);

      // For lines and arrows, store points in content
      if (type === "line" || type === "arrow") {
        content.points = [0, 0, width, height];
        content.closed = false;
        // Default arrow style is "right" (arrow at end)
        if (type === "arrow") {
          content.arrowStyle = "right";
        }
      }

      const orderIndex =
        (useBoardStore.getState().itemsByLayer[layerId]?.length || 0) + 1;

      const now = new Date().toISOString();

      const item: BoardItem = {
        $id: ID.unique(),
        boardId: board.$id,
        layerId,
        type,
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${orderIndex}`,
        orderIndex,
        visible: true,
        locked: false,
        opacity: 1,
        x,
        y,
        width: Math.abs(width),
        height: Math.abs(height),
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        styleJson: JSON.stringify(style),
        contentJson: JSON.stringify(content),
        interactionJson: JSON.stringify({
          selectable: true,
          draggable: true,
        }),
        createdBy: user?.$id || "unknown", // populated from auth
        createdAt: now,
        updatedAt: now,
      };

      return item;
    },
    [activeTool, board, getActiveLayerId],
  );

  // Handle mouse down - start drawing
  const handleMouseDown = useCallback(
    (x: number, y: number) => {
      const itemType = toolToItemType(activeTool);
      if (!itemType) return;

      setDrawingState({
        isDrawing: true,
        startX: x,
        startY: y,
        currentX: x,
        currentY: y,
      });

      // Initialize preview
      setPreviewShape({
        type: itemType,
        x,
        y,
        width: 0,
        height: 0,
      });
    },
    [activeTool],
  );

  // Handle mouse move - update preview
  const handleMouseMove = useCallback(
    (x: number, y: number) => {
      if (!drawingState.isDrawing) return;

      setDrawingState((prev) => ({
        ...prev,
        currentX: x,
        currentY: y,
      }));

      // Update preview shape
      const width = x - drawingState.startX;
      const height = y - drawingState.startY;

      setPreviewShape((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          x: width < 0 ? x : drawingState.startX,
          y: height < 0 ? y : drawingState.startY,
          width: Math.abs(width),
          height: Math.abs(height),
        };
      });
    },
    [drawingState],
  );

  // Handle mouse up - create shape
  const handleMouseUp = useCallback(
    (x: number, y: number) => {
      if (!drawingState.isDrawing) return;

      const width = x - drawingState.startX;
      const height = y - drawingState.startY;

      // Minimum size check
      if (Math.abs(width) < 5 && Math.abs(height) < 5) {
        setDrawingState({
          isDrawing: false,
          startX: 0,
          startY: 0,
          currentX: 0,
          currentY: 0,
        });
        setPreviewShape(null);
        return;
      }

      // Create the item
      const itemType = toolToItemType(activeTool);
      if (!itemType) {
        setDrawingState({
          isDrawing: false,
          startX: 0,
          startY: 0,
          currentX: 0,
          currentY: 0,
        });
        setPreviewShape(null);
        return;
      }

      const newItem = createNewItem(
        itemType,
        width < 0 ? x : drawingState.startX,
        height < 0 ? y : drawingState.startY,
        Math.abs(width),
        Math.abs(height),
      );

      // For image type: don't create item yet — defer to upload modal
      if (itemType === "image") {
        setPendingImageCreation({
          x: width < 0 ? x : drawingState.startX,
          y: height < 0 ? y : drawingState.startY,
          width: Math.abs(width),
          height: Math.abs(height),
        });
        setDrawingState({
          isDrawing: false,
          startX: 0,
          startY: 0,
          currentX: 0,
          currentY: 0,
        });
        setPreviewShape(null);
        return;
      }

      if (newItem) {
        addItem(newItem.layerId, newItem);
      }

      setDrawingState({
        isDrawing: false,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
      });
      setPreviewShape(null);
    },
    [drawingState, activeTool, createNewItem, addItem],
  );

  // Finalize an image item after file has been uploaded
  const finalizeImageItem = useCallback(
    (
      x: number,
      y: number,
      width: number,
      height: number,
      src: string,
      assetId: string,
    ) => {
      const layerId = getActiveLayerId();
      if (!layerId || !board) return;

      const orderIndex =
        (useBoardStore.getState().itemsByLayer[layerId]?.length || 0) + 1;
      const now = new Date().toISOString();

      const item: BoardItem = {
        $id: ID.unique(),
        boardId: board.$id,
        layerId,
        type: "image",
        name: `Image ${orderIndex}`,
        orderIndex,
        visible: true,
        locked: false,
        opacity: 1,
        x,
        y,
        width,
        height,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        styleJson: JSON.stringify({ opacity: 1 }),
        contentJson: JSON.stringify({ src, assetId }),
        interactionJson: JSON.stringify({ selectable: true, draggable: true }),
        createdBy: user?.$id || "unknown",
        createdAt: now,
        updatedAt: now,
      };

      addItem(layerId, item);
      setPendingImageCreation(null);
    },
    [board, getActiveLayerId, addItem, user],
  );

  const clearPendingImageCreation = useCallback(() => {
    setPendingImageCreation(null);
  }, []);

  const openImageCreation = useCallback((centerX: number, centerY: number) => {
    // Width/height of 0 signals the modal to use the image's natural dimensions
    // and center the placement around the given point.
    setPendingImageCreation({ x: centerX, y: centerY, width: 0, height: 0 });
  }, []);

  // Create shape without mouse events (for one-click shapes like pins)
  const createShape = useCallback(
    (x: number, y: number): BoardItem | null => {
      const itemType = toolToItemType(activeTool);
      if (!itemType) return null;

      const layerId = getActiveLayerId();
      if (!layerId || !board) return null;

      // Default size for pins is 32x32
      const width = itemType === "pin" ? 32 : 100;
      const height = itemType === "pin" ? 32 : 100;

      const newItem = createNewItem(itemType, x, y, width, height);
      if (newItem) {
        addItem(newItem.layerId, newItem);
      }
      return newItem;
    },
    [activeTool, board, getActiveLayerId, createNewItem, addItem],
  );

  return {
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
  };
}
