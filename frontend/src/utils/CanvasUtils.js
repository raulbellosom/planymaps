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

export const normalizeSavedCanvasState = (savedCanvasState) => {
  const combinedObjects = savedCanvasState.reduce((acc, drawing) => {
    return acc.concat(drawing.data.objects); // Combinar los objetos de cada trazo
  }, []);
  return combinedObjects;
};
