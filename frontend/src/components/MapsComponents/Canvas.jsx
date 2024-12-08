import React, { useEffect, useState } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import ActionButtons from '../ActionButtons/ActionButtons';
import { GoZoomIn, GoZoomOut } from 'react-icons/go';
import { TbRestore, TbZoomScan } from 'react-icons/tb';
import { MdGridOff, MdGridOn, MdOutlineFormatColorFill } from 'react-icons/md';
import { FormattedUrlImage } from '../../utils/FormattedUrlImage';
import LoadingModal from '../loadingModal/LoadingModal';
import ModalViewer from '../Modals/ModalViewer';

const Canvas = ({ layers }) => {
  const cellSize = 50;
  const [allLayers, setAllLayers] = useState([]);
  const [layerSelected, setLayerSelected] = useState(null);
  const [showGrid, setShowGrid] = useState(true);
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [modalGridColorPicker, setModalGridColorPicker] = useState(false);
  const [gridColor, setGridColor] = useState(
    localStorage.getItem('gridColor') || '#6b7280',
  );

  useEffect(() => {
    setAllLayers(layers);
    setLayerSelected(layers[0]);
  }, [layers]);

  useEffect(() => {
    if (layerSelected) {
      const img = new Image();
      img.onload = () => {
        setImageDimensions({
          width: img.width,
          height: img.height,
        });
      };
      img.src = FormattedUrlImage(layerSelected?.image?.[0]?.url);
    }
  }, [layerSelected]);

  if (!allLayers) {
    return <LoadingModal loading={true} />;
  }

  // Calcular el número de filas y columnas
  const columns = Math.floor(imageDimensions.width / cellSize);
  const rows = Math.floor(imageDimensions.height / cellSize);

  const getColumnLabel = (index) => {
    let label = '';
    while (index >= 0) {
      label = String.fromCharCode((index % 26) + 65) + label;
      index = Math.floor(index / 26) - 1;
    }
    return label;
  };

  return (
    <>
      <div className="relative w-full h-screen overflow-hidden ">
        <TransformWrapper
          initialScale={1}
          minScale={0.1}
          maxScale={5}
          wheel={{ step: 0.1 }}
          limitToBounds={false}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              <div className="relative w-full h-full">
                {/* Botones de acción */}
                <div className="fixed top-3 right-3 flex flex-col gap-2 z-50">
                  <ActionButtons
                    extraActions={[
                      {
                        icon: GoZoomIn,
                        action: () => zoomIn(),
                        color: 'stone',
                      },
                      {
                        icon: GoZoomOut,
                        action: () => zoomOut(),
                        color: 'stone',
                      },
                      {
                        icon: TbZoomScan,
                        action: () => resetTransform(),
                        color: 'stone',
                      },
                      {
                        icon: showGrid ? MdGridOff : MdGridOn,
                        action: () => setShowGrid(!showGrid),
                        color: 'stone',
                      },
                      {
                        icon: MdOutlineFormatColorFill,
                        color: 'stone',
                        action: () => setModalGridColorPicker(true),
                      },
                    ]}
                  />
                </div>

                {/* Cuadrícula */}

                {/* Imagen */}
                <TransformComponent
                  wrapperStyle={{
                    width: '100%',
                    height: '100%',
                  }}
                >
                  {layerSelected && (
                    <img
                      src={FormattedUrlImage(layerSelected?.image?.[0]?.url)}
                      alt="Canvas"
                      className="block mx-auto"
                      style={{
                        position: 'relative',
                        width: 'auto',
                        height: 'auto',
                      }}
                    />
                  )}
                  {showGrid && (
                    <div
                      className="absolute top-0 left-0 pointer-events-none"
                      style={{
                        zIndex: 10,
                        width: '100%',
                        height: '100%',
                        backgroundSize: `${cellSize * 1}px ${cellSize * 1}px`,
                        backgroundImage: `linear-gradient(to right, ${gridColor} 1px, transparent 1px), linear-gradient(to bottom, ${gridColor} 1px, transparent 1px)`,
                      }}
                    />
                  )}

                  {/* Etiquetas de las filas (números) */}
                  {Array.from({ length: rows }).map((_, index) => (
                    <div
                      key={`row-label-${index}`}
                      className="absolute text-sm text-gray-500"
                      style={{
                        top: `${(index * 100) / rows}%`,
                        left: '-20px',
                        transform: 'translateY(-50%)',
                      }}
                    >
                      {index + 1}
                    </div>
                  ))}

                  {/* Etiquetas de las columnas (letras) */}
                  {Array.from({ length: columns }).map((_, index) => (
                    <div
                      key={`col-label-${index}`}
                      className="absolute text-sm text-gray-500"
                      style={{
                        top: '-20px',
                        left: `${(index * 100) / columns}%`,
                        transform: 'translateX(-50%)',
                      }}
                    >
                      {getColumnLabel(index)}
                    </div>
                  ))}
                </TransformComponent>
              </div>
            </>
          )}
        </TransformWrapper>
      </div>
      {modalGridColorPicker && (
        <ModalViewer
          size="3xl"
          isOpenModal={modalGridColorPicker}
          setIsOpenModal={setModalGridColorPicker}
          dismissible={false}
          onCloseModal={() => setModalGridColorPicker(false)}
          title="Color de la cuadrícula"
        >
          <div className="flex flex-col gap-4 w-full">
            <div>
              <div>
                <label htmlFor="grid-color">Color de la cuadrícula</label>
                <p className="text-sm text-gray-500">
                  Has clic en el color para seleccionar uno nuevo.
                </p>
              </div>
              <input
                className="w-full h-24"
                type="color"
                value={gridColor}
                onChange={(e) => {
                  setGridColor(e.target.value);
                }}
              />
            </div>
            <div className="flex gap-4 justify-end text-nowrap">
              <ActionButtons
                extraActions={[
                  {
                    icon: TbRestore,
                    label: 'Reestablecer cuadrícula',
                    action: () => {
                      setGridColor('#6b7280');
                      localStorage.removeItem('gridColor');
                    },
                    color: 'info',
                  },
                  {
                    icon: MdOutlineFormatColorFill,
                    label: 'Recordar cuadrícula',
                    action: () => {
                      localStorage.setItem('gridColor', gridColor);
                      setModalGridColorPicker(false);
                    },
                    color: 'primary',
                    filled: true,
                  },
                ]}
              />
            </div>
          </div>
        </ModalViewer>
      )}
    </>
  );
};

export default Canvas;
