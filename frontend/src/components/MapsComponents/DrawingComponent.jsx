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
  const canvasRef = useRef(null); // Referencia al elemento <canvas>
  const fabricCanvasRef = useRef(null); // Referencia a la instancia de Fabric.js

  // Inicializar Fabric.js solo una vez
  useEffect(() => {
    if (!canvasRef.current) return;

    // Crear la instancia de Fabric.js si no existe
    if (!fabricCanvasRef.current) {
      const fabricCanvas = new fabric.Canvas(canvasRef.current, {
        width,
        height,
        isDrawingMode: drawingMode,
      });

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

      // Guardar la instancia de Fabric.js
      fabricCanvasRef.current = fabricCanvas;

      // Pasar el lienzo al componente padre
      if (setCanvas) {
        setCanvas(fabricCanvas);
      }

      // Cargar los trazos si se proporciona un método onLoad
      if (onLoad) {
        onLoad(fabricCanvas);
      }
    }

    return () => {
      // Limpiar el canvas al desmontar el componente
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, [onLoad, setCanvas, width, height, drawingMode]);

  // Actualizar el desplazamiento del lienzo
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

  // Ajustar el tamaño del pincel según el nivel de zoom
  useEffect(() => {
    const fabricCanvas = fabricCanvasRef.current;
    if (fabricCanvas && fabricCanvas.freeDrawingBrush) {
      fabricCanvas.freeDrawingBrush.width = 5 / scale; // Cambia 5 por el tamaño base del pincel
    }
  }, [scale]);

  // Manejar el modo de borrado
  useEffect(() => {
    const fabricCanvas = fabricCanvasRef.current;
    if (fabricCanvas) {
      const handleSelection = () => {
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
