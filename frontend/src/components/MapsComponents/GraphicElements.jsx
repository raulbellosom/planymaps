import React, { useEffect, useRef } from 'react';
import * as fabric from 'fabric';

const GraphicElements = () => {
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);

  useEffect(() => {
    // Verifica si el lienzo ya está inicializado
    if (!fabricCanvasRef.current && canvasRef.current) {
      // Crear el lienzo de FabricJS solo si no ha sido creado antes
      fabricCanvasRef.current = new fabric.Canvas(canvasRef.current);

      // Configurar el lienzo (puedes modificar las opciones a tu gusto)
      fabricCanvasRef.current.setHeight(500);
      fabricCanvasRef.current.setWidth(500);

      // Habilitar el modo de dibujo para que el usuario pueda dibujar con el mouse
      fabricCanvasRef.current.isDrawingMode = true;

      // Verificar si freeDrawingBrush está disponible antes de configurarlo
      if (fabricCanvasRef.current.freeDrawingBrush) {
        // Configurar el color y el grosor del pincel
        fabricCanvasRef.current.freeDrawingBrush.color = '#000000';
        fabricCanvasRef.current.freeDrawingBrush.width = 5;

        // Puedes agregar más configuraciones para el pincel si lo deseas
        fabricCanvasRef.current.freeDrawingBrush.precision = 10;
      }
    }

    return () => {
      // Limpiar el lienzo cuando el componente se desmonte
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
      }
    };
  }, []); // El useEffect se ejecuta solo una vez, cuando el componente se monta

  // Método para cambiar el color del pincel
  const changeBrushColor = (color) => {
    if (fabricCanvasRef.current && fabricCanvasRef.current.freeDrawingBrush) {
      fabricCanvasRef.current.freeDrawingBrush.color = color;
    }
  };

  // Método para cambiar el tamaño del pincel
  const changeBrushSize = (size) => {
    if (fabricCanvasRef.current && fabricCanvasRef.current.freeDrawingBrush) {
      fabricCanvasRef.current.freeDrawingBrush.width = size;
    }
  };

  return (
    <div>
      <h1>FabricJS Canvas</h1>
      <canvas ref={canvasRef} />

      {/* Controles para cambiar el color y el tamaño del pincel */}
      <div>
        <button onClick={() => changeBrushColor('red')}>Rojo</button>
        <button onClick={() => changeBrushColor('blue')}>Azul</button>
        <button onClick={() => changeBrushColor('green')}>Verde</button>
      </div>
      <div>
        <button onClick={() => changeBrushSize(2)}>Tamaño 2</button>
        <button onClick={() => changeBrushSize(5)}>Tamaño 5</button>
        <button onClick={() => changeBrushSize(10)}>Tamaño 10</button>
      </div>
    </div>
  );
};

export default GraphicElements;
