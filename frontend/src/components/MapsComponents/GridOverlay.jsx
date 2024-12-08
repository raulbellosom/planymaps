import React from 'react';

const GridOverlay = ({ cellSize, zoom, offsetX = 0, offsetY = 0 }) => {
  console.log(zoom);
  return (
    <div
      className="absolute top-0 left-0 w-full h-full pointer-events-none"
      style={{
        transform: `scale(${zoom})`,
        transformOrigin: 'top left',
      }}
    >
      <div
        className="absolute"
        style={{
          left: offsetX,
          top: offsetY,
          width: '200vw',
          height: '200vh',
          backgroundSize: `${cellSize}px ${cellSize}px`,
          backgroundImage:
            'linear-gradient(to right, gray 1px, transparent 1px), linear-gradient(to bottom, gray 1px, transparent 1px)',
        }}
      />
    </div>
  );
};

export default GridOverlay;
