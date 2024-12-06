import React, { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';

const FabricCanvas = () => {
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const [showGrid, setShowGrid] = useState(true);
  const gridSize = 50; // Tamaño de cada celda de la cuadrícula

  useEffect(() => {
    // Crear el lienzo de Fabric.js
    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: '#f3f3f3',
    });
    fabricCanvasRef.current = fabricCanvas;

    // Dibujar la cuadrícula
    const drawGrid = () => {
      const width = fabricCanvas.width;
      const height = fabricCanvas.height;

      for (let i = 0; i < width / gridSize; i++) {
        const verticalLine = new fabric.Line(
          [i * gridSize, 0, i * gridSize, height],
          { stroke: '#ccc', selectable: false, evented: false },
        );
        fabricCanvas.add(verticalLine);
      }

      for (let i = 0; i < height / gridSize; i++) {
        const horizontalLine = new fabric.Line(
          [0, i * gridSize, width, i * gridSize],
          { stroke: '#ccc', selectable: false, evented: false },
        );
        fabricCanvas.add(horizontalLine);
      }
    };

    if (showGrid) {
      drawGrid();
    }

    return () => {
      fabricCanvas.dispose(); // Limpiar el lienzo al desmontar el componente
    };
  }, [showGrid]);

  // Manejar el zoom
  const handleZoom = (zoomIn) => {
    const fabricCanvas = fabricCanvasRef.current;
    let zoom = fabricCanvas.getZoom();
    zoom = zoomIn ? zoom + 0.1 : zoom - 0.1;
    if (zoom < 0.1) zoom = 0.1;
    fabricCanvas.setZoom(zoom);
  };

  return (
    <div>
      <div className="controls">
        <button onClick={() => setShowGrid(!showGrid)}>
          {showGrid ? 'Ocultar Cuadrícula' : 'Mostrar Cuadrícula'}
        </button>
        <button onClick={() => handleZoom(true)}>Zoom In</button>
        <button onClick={() => handleZoom(false)}>Zoom Out</button>
      </div>
      <canvas ref={canvasRef} />
    </div>
  );
};

export default FabricCanvas;
