import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import ActionButtons from '../ActionButtons/ActionButtons';
import _ from 'lodash';
import { GoZoomIn, GoZoomOut } from 'react-icons/go';
import { TbZoomScan } from 'react-icons/tb';
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
import { BsStack, BsThreeDotsVertical } from 'react-icons/bs';
import { PiCursorFill } from 'react-icons/pi';
import { useMapsContext } from '../../context/MapsContext';
import DrawingComponent from './DrawingComponent';
import { AiOutlineClear } from 'react-icons/ai';
import Notifies from '../Notifies/Notifies';
import { Dropdown } from 'flowbite-react';
import { FaEraser } from 'react-icons/fa';
import GridFromCanvas from './GridFromCanvas';

const Canvas = ({
  layers,
  setShowModalLayer,
  layerSelected,
  setLayerSelected,
  layer,
}) => {
  const { useCreateDrawing, useDeleteAllDrawingsByLayer } = useMapsContext();
  // const [allLayers, setAllLayers] = useState([]);
  const [showGrid, setShowGrid] = useState(true);
  const [modalGridConfig, setModalGridConfig] = useState(false);
  const [drawingMode, setDrawingMode] = useState(false);
  const [currentCanvas, setCurrentCanvas] = useState(null);
  const [originalCanvasState, setOriginalCanvasState] = useState(null);
  const [ereaseDrawsMode, setEreaseDrawsMode] = useState(false);
  const [scaledImageUrl, setScaledImageUrl] = useState(null);
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });

  // useEffect(() => {
  //   if (layers && layers.length > 0) {
  //     const sortedLayers = layers.sort((a, b) => a.order - b.order);
  //     setAllLayers(sortedLayers);
  //     setLayerSelected(sortedLayers[0]);
  //   }
  // }, [layers]);

  useEffect(() => {
    if (layer?.id) {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        const margin = 30;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const maxWidth = 1920;
        const maxHeight = 1080;

        let width = img.width;
        let height = img.height;

        // Escalar la imagen si excede las dimensiones máximas
        if (width > maxWidth || height > maxHeight) {
          const scale = Math.min(maxWidth / width, maxHeight / height);
          width = Math.floor(width * scale);
          height = Math.floor(height * scale);
        }

        // Configurar el tamaño del lienzo
        canvas.width = width + margin * 2;
        canvas.height = height + margin * 2;

        // Dibujar la imagen en el lienzo
        ctx.fillStyle = 'transparent';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, margin, margin, width, height);

        // Actualizar las dimensiones de la imagen
        setImageDimensions({
          width: canvas.width,
          height: canvas.height,
        });

        // Generar la URL de la imagen escalada
        const scaledImageUrl = canvas.toDataURL();
        setScaledImageUrl(scaledImageUrl);
      };

      // Manejar errores al cargar la imagen
      img.onerror = () => {
        console.error('Error al cargar la imagen:', layer?.image?.[0]?.url);
      };

      // Establecer la URL de la imagen
      const imageUrl = FormattedUrlImage(layer?.image?.[0]?.url);
      if (imageUrl) {
        img.src = imageUrl;
      } else {
        console.error('URL de imagen no válida:', layer?.image?.[0]?.url);
      }
    }
  }, [layer]);

  useEffect(() => {
    if (layer && currentCanvas) {
      loadDrawingsToCanvas(currentCanvas, layer.drawings);
    }
  }, [layer, currentCanvas]);

  useEffect(() => {
    return () => {
      if (currentCanvas) {
        currentCanvas.dispose();
      }
    };
  }, []);

  if (!layers) {
    return <LoadingModal loading={true} />;
  }

  const handleLayerChange = (newLayer) => {
    setLayerSelected(newLayer);

    if (currentCanvas) {
      currentCanvas.clear();

      // const existingDrawing = newLayer.drawings;
      // if (existingDrawing) {
      //   currentCanvas.loadFromJSON(existingDrawing, () => {
      //     currentCanvas.renderAll();
      //   });
      // }
    }
  };

  const handleSaveDrawing = useCallback(
    async (canvas) => {
      if (canvas && layer) {
        const json = canvas.toJSON();
        try {
          const res = await useCreateDrawing({
            layerId: layer.id,
            type: 'drawing',
            data: json,
          });
          // setLayerSelected((prev) => ({
          //   ...prev,
          //   drawings: res.drawings,
          // }));
          setDrawingMode(false);
          setEreaseDrawsMode(false);
        } catch (error) {
          console.error('Error al guardar el trazo:', error);
          Notifies('error', 'Error al guardar el trazo');
        }
      }
    },
    [layer, useCreateDrawing],
  );

  const handleLoadDrawing = useCallback(
    (canvas) => {
      if (canvas) {
        setCurrentCanvas(canvas);
        if (layer) {
          loadDrawingsToCanvas(canvas, layer.drawings);
        }
      }
    },
    [layer],
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
    const drawingToDelete = layer.drawings.find(
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
      await useDeleteAllDrawingsByLayer(layer.id);
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
                  {layer && scaledImageUrl && (
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

                  {showGrid && layer && scaledImageUrl && (
                    <GridFromCanvas
                      imageDimensions={imageDimensions}
                      layerProps={layer}
                      showGrid={showGrid}
                      initialCellColor={layer.cellColor}
                      initialCellSize={layer.cellSize}
                      modalGridConfig={modalGridConfig}
                      setModalGridConfig={setModalGridConfig}
                    />
                  )}

                  {/* Componente de dibujo */}
                  {layer &&
                    scaledImageUrl &&
                    imageDimensions.width > 0 &&
                    imageDimensions.height > 0 && (
                      <div
                        style={{
                          backgroundColor: 'transparent',
                        }}
                        className="absolute top-0 left-0 overflow-hidden w-full h-full"
                      >
                        <DrawingComponent
                          width={imageDimensions.width}
                          height={imageDimensions.height}
                          scale={rest?.instance?.transformState?.scale || 1}
                          offsetX={
                            rest?.instance?.transformState?.positionX || 0
                          }
                          offsetY={
                            rest?.instance?.transformState?.positionY || 0
                          }
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
                            label: layer?.name,
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
                        {layers?.map((layer, index) => (
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
                            handleLoadDrawing(currentCanvas, layer.drawings),
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
    </>
  );
};

export default Canvas;
