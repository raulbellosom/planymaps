import React, { useEffect, useMemo, useState, useRef } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import ActionButtons from '../ActionButtons/ActionButtons';
import { GoZoomIn, GoZoomOut } from 'react-icons/go';
import { TbRestore, TbZoomScan } from 'react-icons/tb';
import {
  MdDraw,
  MdGridOff,
  MdGridOn,
  MdOutlineFormatColorFill,
} from 'react-icons/md';
import { FormattedUrlImage } from '../../utils/FormattedUrlImage';
import LoadingModal from '../loadingModal/LoadingModal';
import ModalViewer from '../Modals/ModalViewer';
import { Tooltip } from 'flowbite-react';
import { BsStack } from 'react-icons/bs';
import { generateGridImage } from '../../utils/CanvasUtils';
import { useMapsContext } from '../../context/MapsContext';
// import DrawingComponent from './DrawingComponent';
import * as fabric from 'fabric';

const Canvas = ({ layers, setShowModalLayer }) => {
  const { useUpdateLayer } = useMapsContext();
  const [allLayers, setAllLayers] = useState([]);
  const [layerSelected, setLayerSelected] = useState(null);
  const [showGrid, setShowGrid] = useState(true);
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [modalGridConfig, setModalGridConfig] = useState(false);
  const [cellSize, setCellSize] = useState(50);
  const [cellColor, setCellColor] = useState('#6b7280');
  const [prevCellColor, setPrevCellColor] = useState(cellColor);
  const [prevCellSize, setPrevCellSize] = useState(cellSize);
  const [drawingMode, setDrawingMode] = useState(false);
  const [canvas, setCanvas] = useState(null);

  const canvasRef = useRef(null);
  const fabricCanvas = useRef(null);

  useEffect(() => {
    setAllLayers(layers);
    setLayerSelected(layers[0]);
  }, [layers]);

  useEffect(() => {
    if (layerSelected) {
      setCellSize(layerSelected.cellSize || 50);
      setCellColor(layerSelected.cellColor || '#6b7280');
      setPrevCellSize(layerSelected.cellSize || 50);
      setPrevCellColor(layerSelected.cellColor || '#6b7280');
    }
  }, [layerSelected]);

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

  useEffect(() => {
    if (imageDimensions.width && imageDimensions.height) {
      // Inicializar canvas después de que la imagen haya cargado
      const fabricc = new fabric.Canvas(fabricCanvas.current, {
        height: imageDimensions.height,
        width: imageDimensions.width,
        isDrawingMode: drawingMode,
      });

      fabricc.freeDrawingBrush = new fabric.PencilBrush(fabricc);
      fabricc.freeDrawingBrush.color = '#000000';
      fabricc.freeDrawingBrush.width = 5;
      setCanvas(fabricc);

      return () => {
        fabricc.dispose();
      };
    }
  }, [imageDimensions, drawingMode]);

  const gridBackground = useMemo(() => {
    if (imageDimensions.width && imageDimensions.height) {
      return generateGridImage(
        imageDimensions.width,
        imageDimensions.height,
        cellSize,
        cellColor,
      );
    }
    return null;
  }, [imageDimensions, cellSize, cellColor]);

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

  if (!allLayers) {
    return <LoadingModal loading={true} />;
  }

  const handleUpdateLayer = async (values) => {
    try {
      await useUpdateLayer(values);
    } catch (error) {
      console.error(error);
    }
  };

  const toggleDrawingMode = () => {
    setDrawingMode((prev) => !prev);
  };

  return (
    <>
      <div className="relative w-full h-screen overflow-hidden ">
        <TransformWrapper
          initialScale={1}
          minScale={0.1}
          maxScale={5}
          centerOnInit
          wheel={{ step: 0.1 }}
          limitToBounds={false}
          disabled={drawingMode}
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
                        action: () => setModalGridConfig(true),
                      },
                      {
                        icon: MdDraw,
                        color: 'stone',
                        action: toggleDrawingMode,
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
                    <img
                      src={gridBackground}
                      alt="Grid"
                      className="absolute top-0 left-0"
                    />
                  )}
                  <div className="absolute top-0 left-0">
                    <canvas ref={fabricCanvas} className="" />
                  </div>
                  {/* Etiquetas de las filas (números) */}
                  {showGrid &&
                    Array.from({ length: rows }).map((_, index) => (
                      <div
                        key={`row-label-${index}`}
                        className="absolute text-xxs lg:text-sm text-gray-500"
                        style={{
                          top: `${(index * 100) / rows}%`,
                          left: '-20px',
                          transform: 'translateY(-50%)',
                        }}
                      >
                        {index}
                      </div>
                    ))}

                  {/* Etiquetas de las columnas (letras) */}
                  {showGrid &&
                    Array.from({ length: columns }).map((_, index) => (
                      <div
                        key={`col-label-${index}`}
                        className="absolute text-xxs lg:text-sm text-gray-500"
                        style={{
                          top: '-20px',
                          left: `${(index * 100) / columns}%`,
                          transform: 'translateX(-50%)',
                        }}
                      >
                        {index == 0 ? index : getColumnLabel(index - 1)}
                      </div>
                    ))}
                </TransformComponent>
                <div className="fixed bottom-3 right-3 flex gap-2 z-50 text-nowrap max-w-[100vw] md:max-w-full overflow-auto">
                  {allLayers.map((layer) => (
                    <ActionButtons
                      key={layer.id}
                      extraActions={[
                        {
                          label: layer.name,
                          action: () => {
                            resetTransform();
                            setLayerSelected(layer);
                          },
                          color: 'stone',
                        },
                      ]}
                    />
                  ))}
                  <Tooltip content="Administrar capas" position="left">
                    <ActionButtons
                      extraActions={[
                        {
                          label: 'Capas',
                          action: () => {
                            setShowModalLayer(true);
                          },
                          color: 'stone',
                          icon: BsStack,
                        },
                      ]}
                    />
                  </Tooltip>
                </div>
              </div>
            </>
          )}
        </TransformWrapper>
      </div>
      {modalGridConfig && (
        <ModalViewer
          size="3xl"
          isOpenModal={modalGridConfig}
          setIsOpenModal={setModalGridConfig}
          dismissible={false}
          onCloseModal={() => setModalGridConfig(false)}
          title="Color de la cuadrícula"
        >
          <div className="flex flex-col gap-4 w-full">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col">
                <div>
                  <label htmlFor="cell-color">Color de la cuadrícula</label>
                  <p className="text-sm text-gray-500">
                    Has clic en el color para seleccionar uno nuevo.
                  </p>
                </div>
                <input
                  name="cell-color"
                  id="cell-color"
                  type="color"
                  className="w-full h-24"
                  value={prevCellColor}
                  onChange={(e) => {
                    setPrevCellColor(e.target.value);
                  }}
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="cell-size">Tamaño de la celda (px)</label>
                <input
                  name="cell-size"
                  id="cell-size"
                  type="number"
                  className="w-full"
                  min="1"
                  step="1"
                  value={prevCellSize}
                  onChange={(e) => {
                    setPrevCellSize(e.target.value);
                  }}
                />
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-4 justify-end text-nowrap">
              <ActionButtons
                extraActions={[
                  {
                    icon: TbRestore,
                    label: 'Reestablecer cuadrícula',
                    action: () => {
                      setCellColor('#6b7280');
                      setCellSize(50);
                    },
                    color: 'info',
                  },
                  {
                    icon: MdOutlineFormatColorFill,
                    label: 'Guardar cuadrícula',
                    action: () => {
                      handleUpdateLayer({
                        ...layerSelected,
                        cellColor: prevCellColor,
                        cellSize: prevCellSize,
                      });
                      setModalGridConfig(false);
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
