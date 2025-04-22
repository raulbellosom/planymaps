import React, { useRef, useEffect } from 'react';
import * as fabric from 'fabric';

const DrawingComponent = ({
  width,
  height,
  scale,
  offsetX,
  offsetY,
  drawingMode,
  setCanvas,
  ereaseDrawsMode,
  rest,
}) => {
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);

  useEffect(() => {
    const fabricCanvas = fabricCanvasRef.current;
    if (fabricCanvas) {
      fabricCanvas.setDimensions({ width, height });
      fabricCanvas.clipPath.set({ width, height });
      fabricCanvas.clipPath.setCoords();
      fabricCanvas.renderAll();
    }
  }, [width, height]);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (!fabricCanvasRef.current) {
      const fabricCanvas = new fabric.Canvas(canvasRef.current, {
        width,
        height,
        isDrawingMode: drawingMode,
        preserveObjectStacking: true,
        fireRightClick: true,
        stopContextMenu: true,
      });

      fabricCanvas.clipPath = new fabric.Rect({
        left: 0,
        top: 0,
        width,
        height,
        absolutePositioned: true,
      });

      fabricCanvas.freeDrawingBrush = new fabric.PencilBrush(fabricCanvas);
      fabricCanvas.freeDrawingBrush.color = '#000000';
      fabricCanvas.freeDrawingBrush.width = 5;

      fabricCanvasRef.current = fabricCanvas;

      if (setCanvas) {
        setCanvas(fabricCanvas);
      }
    }

    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, [setCanvas, width, height, drawingMode]);

  useEffect(() => {
    const fabricCanvas = fabricCanvasRef.current;
    if (fabricCanvas) {
      const limitedOffsetX = Math.max(
        0,
        Math.min(offsetX, width - fabricCanvas.width),
      );
      const limitedOffsetY = Math.max(
        0,
        Math.min(offsetY, height - fabricCanvas.height),
      );
      fabricCanvas.absolutePan({ x: limitedOffsetX, y: limitedOffsetY });
    }
  }, [offsetX, offsetY, width, height]);

  useEffect(() => {
    const fabricCanvas = fabricCanvasRef.current;
    if (fabricCanvas && fabricCanvas.freeDrawingBrush) {
      fabricCanvas.freeDrawingBrush.width = 5 / scale;
    }
  }, [scale]);

  useEffect(() => {
    const fabricCanvas = fabricCanvasRef.current;
    if (fabricCanvas) {
      const handleSelection = () => {
        if (ereaseDrawsMode) {
          const selectedObjects = fabricCanvas.getActiveObjects();
          selectedObjects.forEach((obj) => fabricCanvas.remove(obj));
          fabricCanvas.discardActiveObject();
          fabricCanvas.renderAll();
        }
      };

      fabricCanvas.on('selection:created', handleSelection);
      fabricCanvas.on('selection:updated', handleSelection);

      return () => {
        fabricCanvas.off('selection:created', handleSelection);
        fabricCanvas.off('selection:updated', handleSelection);
      };
    }
  }, [ereaseDrawsMode]);

  return <canvas ref={canvasRef} />;
};

export default DrawingComponent;
