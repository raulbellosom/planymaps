import React, { useState } from 'react';

const GraphicElements = ({ onAddGraphicElement }) => {
  const [elementType, setElementType] = useState('line');

  const handleAddGraphic = () => {
    const options = {
      startX: 100, // Puedes hacer esto dinámico basado en las coordenadas del mouse o el clic
      startY: 100,
      endX: 400,
      endY: 400,
      left: 200,
      top: 200,
      width: 100,
      height: 50,
      text: 'Texto de ejemplo',
    };

    onAddGraphicElement(elementType, options);
  };

  return (
    <div>
      <div>
        <label>
          Selecciona el tipo de gráfico:
          <select
            onChange={(e) => setElementType(e.target.value)}
            value={elementType}
          >
            <option value="line">Línea</option>
            <option value="rectangle">Rectángulo</option>
            <option value="text">Texto</option>
          </select>
        </label>
      </div>
      <button onClick={handleAddGraphic}>Agregar Gráfico</button>
    </div>
  );
};

export default GraphicElements;
