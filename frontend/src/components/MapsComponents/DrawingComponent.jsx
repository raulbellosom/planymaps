import React, { useRef, useEffect } from 'react';
import * as fabric from 'fabric';

const DrawingComponent = ({
  width,
  height,
  scale,
  offsetX,
  offsetY,
  drawingMode,
  onLoad,
  setCanvas,
  ereaseDrawsMode,
}) => {
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null); // Nueva referencia para la instancia de fabric.Canvas

  useEffect(() => {
    // Crear el lienzo de Fabric.js
    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width,
      height,
      isDrawingMode: drawingMode,
    });

    // Guardar la instancia de fabric.Canvas en la referencia
    fabricCanvasRef.current = fabricCanvas;

    // Limitar el área de dibujo al tamaño de la imagen
    fabricCanvas.clipPath = new fabric.Rect({
      left: 0,
      top: 0,
      width,
      height,
      absolutePositioned: true,
    });

    // Configurar el pincel de dibujo
    fabricCanvas.freeDrawingBrush = new fabric.PencilBrush(fabricCanvas);
    fabricCanvas.freeDrawingBrush.color = '#000000';
    fabricCanvas.freeDrawingBrush.width = 5;

    // Pasar el lienzo al componente padre
    setCanvas(fabricCanvas);

    // Cargar los trazos si se proporciona un método onLoad
    if (onLoad) {
      onLoad(fabricCanvas);
    }

    return () => {
      if (fabricCanvas) {
        fabricCanvas.dispose();
      }
    };
  }, [width, height, setCanvas, onLoad, drawingMode]);

  useEffect(() => {
    const fabricCanvas = fabricCanvasRef.current; // Usar la referencia correcta
    if (fabricCanvas) {
      // Ajustar el desplazamiento del lienzo
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
    const fabricCanvas = fabricCanvasRef.current; // Usar la referencia correcta
    if (fabricCanvas && fabricCanvas.freeDrawingBrush) {
      // Ajustar el tamaño del pincel según el nivel de zoom
      fabricCanvas.freeDrawingBrush.width = 5 / scale; // Cambia 5 por el tamaño base del pincel
    }
  }, [scale]);

  useEffect(() => {
    const fabricCanvas = fabricCanvasRef.current; // Usar la referencia correcta
    if (fabricCanvas) {
      const handleSelection = (event) => {
        if (ereaseDrawsMode) {
          const selectedObjects = fabricCanvas.getActiveObjects();
          selectedObjects.forEach((obj) => fabricCanvas.remove(obj));
          fabricCanvas.discardActiveObject(); // Deseleccionar los objetos eliminados
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
