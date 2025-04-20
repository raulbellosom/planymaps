import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import ActionButtons from '../ActionButtons/ActionButtons';
import _, { fill, set } from 'lodash';
import { GoZoomIn, GoZoomOut } from 'react-icons/go';
import { TbRestore, TbZoomScan } from 'react-icons/tb';
import {
  MdDraw,
  MdGridOff,
  MdGridOn,
  MdOutlineFormatColorFill,
  MdOutlineSettingsBackupRestore,
  MdSaveAlt,
} from 'react-icons/md';
import { FormattedUrlImage } from '../../utils/FormattedUrlImage';
import LoadingModal from '../loadingModal/LoadingModal';
import ModalViewer from '../Modals/ModalViewer';
import { BsStack, BsThreeDotsVertical } from 'react-icons/bs';
import { PiCursorFill } from 'react-icons/pi';
import {
  generateGridImage,
  generateGridWithLabels,
} from '../../utils/CanvasUtils';
import { useMapsContext } from '../../context/MapsContext';
import DrawingComponent from './DrawingComponent';
import { AiOutlineClear } from 'react-icons/ai';
import Notifies from '../Notifies/Notifies';
import { Dropdown } from 'flowbite-react';
import { FaEraser } from 'react-icons/fa';

const Canvas = ({ layers, setShowModalLayer }) => {
  const { useUpdateLayer, useCreateDrawing, useDeleteAllDrawingsByLayer } =
    useMapsContext();
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
  const [currentCanvas, setCurrentCanvas] = useState(null);
  const [originalCanvasState, setOriginalCanvasState] = useState(null);
  const [ereaseDrawsMode, setEreaseDrawsMode] = useState(false);
  const [scaledImageUrl, setScaledImageUrl] = useState(null);

  useEffect(() => {
    if (layers && layers.length > 0) {
      const sortedLayers = layers.sort((a, b) => a.order - b.order);
      setAllLayers(sortedLayers);
      setLayerSelected(sortedLayers[0]);
    }
  }, [layers]);

  useEffect(() => {
    if (layerSelected) {
      setCellSize(layerSelected.cellSize || 50);
      setCellColor(layerSelected.cellColor || '#6b7280');
      setPrevCellSize(layerSelected.cellSize || 50);
      setPrevCellColor(layerSelected.cellColor || '#6b7280');

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        // Escalar la imagen
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const maxWidth = 1920; // Ancho máximo deseado
        const maxHeight = 1080; // Alto máximo deseado

        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const scale = Math.min(maxWidth / width, maxHeight / height);
          width = Math.floor(width * scale);
          height = Math.floor(height * scale);
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        setImageDimensions({
          width,
          height,
        });

        // Convertir el lienzo a una URL de imagen
        const scaledImageUrl = canvas.toDataURL();
        setScaledImageUrl(scaledImageUrl);
      };
      img.src = FormattedUrlImage(layerSelected?.image?.[0]?.url);
    }
  }, [layerSelected]);

  useEffect(() => {
    if (layerSelected && currentCanvas) {
      loadDrawingsToCanvas(currentCanvas, layerSelected.drawings);
    }
  }, [layerSelected, currentCanvas]);

  const gridBackground = useMemo(() => {
    if (imageDimensions.width && imageDimensions.height) {
      return generateGridWithLabels(
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

  useEffect(() => {
    return () => {
      if (currentCanvas) {
        currentCanvas.dispose(); // Libera los recursos del lienzo
      }
    };
  }, []);

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

  const handleLayerChange = (newLayer) => {
    setLayerSelected(newLayer);

    if (currentCanvas) {
      currentCanvas.clear();

      const existingDrawing = newLayer.drawings;
      if (existingDrawing) {
        currentCanvas.loadFromJSON(existingDrawing, () => {
          currentCanvas.renderAll();
        });
      }
    }
  };

  const handleSaveDrawing = useCallback(
    async (canvas) => {
      if (canvas && layerSelected) {
        const json = canvas.toJSON();
        try {
          const res = await useCreateDrawing({
            layerId: layerSelected.id,
            type: 'drawing',
            data: json,
          });
          setLayerSelected((prev) => ({
            ...prev,
            drawings: res.drawings,
          }));
          setDrawingMode(false);
          setEreaseDrawsMode(false);
        } catch (error) {
          console.error('Error al guardar el trazo:', error);
          Notifies('error', 'Error al guardar el trazo');
        }
      }
    },
    [layerSelected, useCreateDrawing],
  );

  const handleLoadDrawing = useCallback(
    (canvas) => {
      if (canvas) {
        setCurrentCanvas(canvas);
        if (layerSelected) {
          loadDrawingsToCanvas(canvas, layerSelected.drawings);
        }
      }
    },
    [layerSelected],
  );

  const toggleDrawingMode = () => {
    if (drawingMode) {
      const currentCanvasState = currentCanvas.toJSON();
      const hasUnsavedChanges = !_.isEqual(
        currentCanvasState.objects,
        originalCanvasState.objects,
      );

      if (hasUnsavedChanges) {
        Notifies(
          'warning',
          'Hay trazos sin guardar en la capa actual. Guarda los cambios antes de salir del modo dibujo.',
        );
        return;
      }
    }

    Notifies(
      'info',
      `Modo de dibujo ${drawingMode ? 'desactivado' : 'activado'}`,
    );
    setDrawingMode((prev) => !prev);
  };

  const loadDrawingsToCanvas = (canvas, drawings) => {
    if (!canvas || !drawings) return;

    const combinedDrawing = {
      objects: drawings.reduce(
        (acc, drawing) => acc.concat(drawing.data.objects),
        [],
      ),
    };

    setOriginalCanvasState(combinedDrawing);

    if (combinedDrawing.objects?.length > 0) {
      try {
        canvas.loadFromJSON(combinedDrawing, () => {
          canvas.getObjects().forEach((obj) => {
            obj.visible = true;
            obj.isPersistent = true;
          });
          setTimeout(() => {
            canvas.renderAll();
          }, 100);
        });
      } catch (error) {
        console.error('Error al cargar los dibujos:', error);
      }
    }
  };

  const handleSelectDrawingToDelete = (drawingId) => {
    const drawingToDelete = layerSelected.drawings.find(
      (drawing) => drawing.id === drawingId,
    );
    if (drawingToDelete) {
      const canvas = currentCanvas;
      if (canvas) {
        const objectToDelete = canvas.getObjects().find((obj) => {
          return obj.id === drawingToDelete.id;
        });
        if (objectToDelete) {
          canvas.remove(objectToDelete);
          canvas.renderAll();
        }
      }
    }
  };

  const handleDeleteAllDrawings = async () => {
    try {
      await useDeleteAllDrawingsByLayer(layerSelected.id);
    } catch (error) {
      console.error('Error al eliminar todos los trazos:', error);
    }
  };

  const toggleEreaseDrawsMode = () => {
    if (ereaseDrawsMode) {
      const currentCanvasState = currentCanvas.toJSON();
      const hasUnsavedChanges = !_.isEqual(
        currentCanvasState.objects,
        originalCanvasState.objects,
      );
      if (hasUnsavedChanges) {
        Notifies(
          'warning',
          'Hay cambios sin guardar en la capa actual. Guarda los cambios antes de salir del modo borrado.',
        );
        return;
      }

      setEreaseDrawsMode(false);
      Notifies('info', 'Modo de borrado desactivado');
    } else {
      setEreaseDrawsMode(true);
      Notifies('info', 'Modo de borrado activado');
    }
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
          {({ zoomIn, zoomOut, resetTransform, ...rest }) => (
            <>
              <div className="relative w-full h-full">
                {/* Botones de acción */}
                <div className="fixed top-3 right-3 flex flex-col gap-2 z-50">
                  <ActionButtons
                    extraActions={[
                      {
                        icon: GoZoomIn,
                        action: () => zoomIn(),
                        color: 'primary',
                        blured: true,
                      },
                      {
                        icon: GoZoomOut,
                        action: () => zoomOut(),
                        color: 'primary',
                        blured: true,
                      },
                      {
                        icon: TbZoomScan,
                        action: () => resetTransform(),
                        color: 'primary',
                        blured: true,
                      },
                      {
                        icon: showGrid ? MdGridOff : MdGridOn,
                        action: () => setShowGrid(!showGrid),
                        color: 'primary',
                        blured: true,
                      },
                      {
                        icon: MdOutlineFormatColorFill,
                        color: 'primary',
                        action: () => setModalGridConfig(true),
                        blured: true,
                      },
                      {
                        icon: drawingMode ? PiCursorFill : MdDraw,
                        color: 'primary',
                        action: toggleDrawingMode,
                        blured: true,
                      },
                      {
                        label: '',
                        icon: FaEraser,
                        action: toggleEreaseDrawsMode,
                        color: 'primary',
                        blured: true,
                        filled: ereaseDrawsMode,
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
                  {layerSelected && scaledImageUrl && (
                    <img
                      src={scaledImageUrl}
                      alt="Canvas"
                      className="block mx-auto"
                      style={{
                        position: 'relative',
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                      }}
                    />
                  )}

                  {showGrid && (
                    <img
                      src={gridBackground}
                      alt="Grid"
                      className="absolute -top-6 -left-6"
                    />
                  )}
                  {/* Componente de dibujo */}
                  {layerSelected && (
                    <div
                      style={{
                        backgroundColor: 'transparent',
                      }}
                      className="absolute top-0 left-0 overflow-hidden w-full h-full"
                    >
                      <DrawingComponent
                        width={imageDimensions.width}
                        height={imageDimensions.height}
                        scale={rest?.instance?.transformState?.scale}
                        offsetX={rest?.instance?.transformState?.positionX}
                        offsetY={rest?.instance?.transformState?.positionY}
                        drawingMode={drawingMode}
                        onLoad={handleLoadDrawing}
                        setCanvas={setCurrentCanvas}
                        ereaseDrawsMode={ereaseDrawsMode}
                      />
                    </div>
                  )}
                </TransformComponent>
                <div className="fixed bottom-3 right-3 flex gap-2 z-50 text-nowrap max-w-[100vw] md:max-w-full">
                  {!(drawingMode || ereaseDrawsMode) ? (
                    <>
                      <ActionButtons
                        extraActions={[
                          {
                            label: layerSelected?.name,
                            action: () => resetTransform(),
                            color: 'primary',
                            blured: true,
                          },
                        ]}
                      />
                      <Dropdown
                        renderTrigger={() => (
                          <button className="w-fit backdrop-blur-lg text-planymaps-primary md:w-fit h-9 xl:h-10 text-sm xl:text-base cursor-pointer transition ease-in-out duration-200 p-4 flex items-center justify-center rounded-md border border-neutral-200 ">
                            <BsThreeDotsVertical className="text-lg " />
                          </button>
                        )}
                        dismissOnClick={true}
                        inline
                        arrowIcon={null}
                        placement="right"
                        className="md:w-52"
                      >
                        {allLayers?.map((layer, index) => (
                          <Dropdown.Item
                            key={index}
                            className="min-w-36 min-h-12 text-planymaps-primary backdrop-blur-lg"
                            onClick={() => handleLayerChange(layer)}
                          >
                            <span>{layer?.name}</span>
                          </Dropdown.Item>
                        ))}
                      </Dropdown>

                      <ActionButtons
                        extraActions={[
                          {
                            label: 'Capas',
                            action: () => {
                              setShowModalLayer(true);
                            },
                            color: 'primary',
                            icon: BsStack,
                            blured: true,
                          },
                        ]}
                      />
                    </>
                  ) : (
                    <ActionButtons
                      extraActions={[
                        {
                          label: '',
                          icon: MdOutlineSettingsBackupRestore,
                          action: () =>
                            handleLoadDrawing(
                              currentCanvas,
                              layerSelected.drawings,
                            ),
                          color: 'primary',
                          blured: true,
                        },
                        {
                          label: '',
                          icon: AiOutlineClear,
                          action: () => {
                            if (currentCanvas) {
                              currentCanvas.clear();
                            }
                            handleDeleteAllDrawings();
                          },
                          color: 'primary',
                          blured: true,
                        },
                        {
                          label: '',
                          icon: MdSaveAlt,
                          action: () => {
                            handleSaveDrawing(currentCanvas);
                          },
                          color: 'primary',
                          filled: true,
                          blured: true,
                        },
                      ]}
                    />
                  )}
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
