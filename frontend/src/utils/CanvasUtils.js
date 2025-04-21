export const generateGridImage = (width, height, cellSize, color) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    console.error('No se pudo obtener el contexto 2D del lienzo.');
    return null;
  }

  ctx.strokeStyle = color;
  for (let x = 0; x < width; x += cellSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += cellSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  return canvas.toDataURL('image/png');
};

export const generateGridWithLabels = (width, height, cellSize, cellColor) => {
  const margin = 30; // Margen adicional para las etiquetas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Ajustar el tamaño del lienzo para incluir el margen
  canvas.width = width + margin * 2; // Doble margen para ambos lados
  canvas.height = height + margin * 2;

  // Dibujar la cuadrícula
  ctx.fillStyle = cellColor;
  for (let x = 0; x <= width; x += cellSize) {
    ctx.fillRect(x + margin, margin, 1, height); // Líneas verticales
  }
  for (let y = 0; y <= height; y += cellSize) {
    ctx.fillRect(margin, y + margin, width, 1); // Líneas horizontales
  }

  // Dibujar etiquetas de filas (números)
  ctx.font = '12px Arial';
  ctx.fillStyle = cellColor;
  ctx.textAlign = 'right'; // Alinear a la derecha para filas
  ctx.textBaseline = 'middle'; // Centrar verticalmente
  for (let y = 0; y <= height; y += cellSize) {
    ctx.fillText(y / cellSize, margin - 10, y + margin); // Etiquetas de filas (fuera de la cuadrícula)
  }

  // Dibujar etiquetas de columnas (letras)
  const getColumnLabel = (index) => {
    let label = '';
    while (index >= 0) {
      label = String.fromCharCode((index % 26) + 65) + label;
      index = Math.floor(index / 26) - 1;
    }
    return label;
  };

  ctx.textAlign = 'center'; // Centrar horizontalmente para columnas
  ctx.textBaseline = 'top'; // Alinear en la parte superior
  for (let x = 0; x <= width; x += cellSize) {
    ctx.fillText(getColumnLabel(x / cellSize), x + margin, margin - 15); // Etiquetas de columnas (fuera de la cuadrícula)
  }

  return canvas.toDataURL();
};

export const normalizeSavedCanvasState = (savedCanvasState) => {
  const combinedObjects = savedCanvasState.reduce((acc, drawing) => {
    return acc.concat(drawing.data.objects); // Combinar los objetos de cada trazo
  }, []);
  return combinedObjects;
};
