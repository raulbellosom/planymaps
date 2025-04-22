import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import ActionButtons from '../ActionButtons/ActionButtons';
import _, { set } from 'lodash';
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
import { ThreeCircles } from 'react-loader-spinner';
import { LuMove } from 'react-icons/lu';
import { MODES } from '../../utils/CanvasUtils';

const Canvas = ({
  layers,
  setShowModalLayer,
  layerSelected,
  setLayerSelected,
  layer,
}) => {
  const { useCreateDrawing, useDeleteAllDrawingsByLayer } = useMapsContext();
  const [showGrid, setShowGrid] = useState(true);
  const [modalGridConfig, setModalGridConfig] = useState(false);
  const [currentCanvas, setCurrentCanvas] = useState(null);
  const [originalCanvasState, setOriginalCanvasState] = useState(null);
  const [scaledImageUrl, setScaledImageUrl] = useState(null);
  const [activeMode, setActiveMode] = useState(MODES.DEFAULT);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    return () => {
      if (currentCanvas) {
        currentCanvas.dispose();
        setCurrentCanvas(null);
      }
      setScaledImageUrl(null);
      setImageDimensions({ width: 0, height: 0 });
    };
  }, []);

  useEffect(() => {
    if (layer?.id) {
      setScaledImageUrl(null);
      setImageDimensions({ width: 0, height: 0 });

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

        if (width > maxWidth || height > maxHeight) {
          const scale = Math.min(maxWidth / width, maxHeight / height);
          width = Math.floor(width * scale);
          height = Math.floor(height * scale);
        }

        canvas.width = width + margin * 2;
        canvas.height = height + margin * 2;

        ctx.fillStyle = 'transparent';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, margin, margin, width, height);

        setImageDimensions({
          width: canvas.width,
          height: canvas.height,
        });

        const scaledImageUrl = canvas.toDataURL();
        setScaledImageUrl(scaledImageUrl);
      };

      img.onerror = () => {
        console.error('Error al cargar la imagen:', layer?.image?.[0]?.url);
      };

      const imageUrl = FormattedUrlImage(layer?.image?.[0]?.url);
      if (imageUrl) {
        img.src = imageUrl;
      } else {
        console.error('URL de imagen no válida:', layer?.image?.[0]?.url);
      }
    }
  }, [layer]);

  useEffect(() => {
    if (currentCanvas) {
      const isSelectable = activeMode !== MODES.DEFAULT;

      // Actualizar la propiedad `selectable` de todos los objetos
      currentCanvas.getObjects().forEach((obj) => {
        obj.selectable = isSelectable;
      });

      // Deshabilitar la selección en el lienzo si no es seleccionable
      currentCanvas.selection = isSelectable;

      currentCanvas.renderAll();
    }
  }, [activeMode, currentCanvas]);

  useEffect(() => {
    return () => {
      if (currentCanvas) {
        currentCanvas.dispose();
      }
    };
  }, []);

  useEffect(() => {
    if (layer && currentCanvas) {
      if (!layer.drawings || layer.drawings.length === 0) {
        setOriginalCanvasState({ objects: [] });
        setHasUnsavedChanges(false);
      } else {
        loadDrawingsToCanvas(currentCanvas, layer.drawings);
        setHasUnsavedChanges(false);
      }
    }
  }, [layer, currentCanvas]);

  useEffect(() => {
    if (currentCanvas) {
      const handleCanvasChange = () => {
        if (activeMode === MODES.DEFAULT) {
          // No debería haber cambios en el defaultMode
          return;
        }

        const currentCanvasState = currentCanvas.toJSON();

        if (!originalCanvasState || !originalCanvasState.objects) {
          return;
        }

        if (
          (!currentCanvasState.objects ||
            currentCanvasState.objects.length === 0) &&
          (!originalCanvasState.objects ||
            originalCanvasState.objects.length === 0)
        ) {
          setHasUnsavedChanges(false);
          return;
        }

        const isModified = !_.isEqual(
          currentCanvasState.objects,
          originalCanvasState.objects,
        );
        setHasUnsavedChanges(isModified);
      };

      currentCanvas.on('object:added', handleCanvasChange);
      currentCanvas.on('object:modified', handleCanvasChange);
      currentCanvas.on('object:removed', handleCanvasChange);

      return () => {
        currentCanvas.off('object:added', handleCanvasChange);
        currentCanvas.off('object:modified', handleCanvasChange);
        currentCanvas.off('object:removed', handleCanvasChange);
      };
    }
  }, [currentCanvas, originalCanvasState, activeMode]);

  useEffect(() => {
    if (currentCanvas) {
      currentCanvas.isDrawingMode = activeMode === MODES.DRAW;

      if (activeMode === MODES.ERASE) {
        currentCanvas.selection = true;
      } else {
        currentCanvas.selection = false;
      }

      if (activeMode === MODES.SELECT) {
        currentCanvas.isDrawingMode = false;
      }
    }
  }, [activeMode, currentCanvas]);

  if (!layers) {
    return <LoadingModal loading={true} />;
  }

  const handleLayerChange = (newLayer) => {
    setLayerSelected(newLayer);
    if (currentCanvas) {
      currentCanvas.clear();
    }
  };

  const loadDrawingsToCanvas = (canvas, drawings) => {
    if (!canvas) return;

    const combinedDrawing = {
      objects: Array.isArray(drawings)
        ? drawings.reduce(
            (acc, drawing) => acc.concat(drawing.data.objects),
            [],
          )
        : [],
    };

    const scaledObjects = combinedDrawing.objects.map((obj) => ({
      ...obj,
      left: obj.left * canvas.getWidth(),
      top: obj.top * canvas.getHeight(),
      scaleX: obj.scaleX * canvas.getWidth(),
      scaleY: obj.scaleY * canvas.getHeight(),
    }));

    const scaledDrawing = {
      ...combinedDrawing,
      objects: scaledObjects,
    };

    setOriginalCanvasState(scaledDrawing);

    if (scaledDrawing.objects?.length > 0) {
      try {
        canvas.loadFromJSON(scaledDrawing, () => {
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

  const handleSaveDrawing = useCallback(
    async (canvas) => {
      if (canvas && layer) {
        const json = canvas.toJSON();
        const normalizedObjects = json.objects.map((obj) => ({
          ...obj,
          left: obj.left / canvas.width,
          top: obj.top / canvas.height,
          scaleX: obj.scaleX / canvas.width,
          scaleY: obj.scaleY / canvas.height,
        }));

        const normalizedJson = {
          ...json,
          objects: normalizedObjects,
        };
        try {
          const res = await useCreateDrawing({
            layerId: layer.id,
            type: 'drawing',
            data: normalizedJson,
          });
          setOriginalCanvasState(normalizedJson);

          setHasUnsavedChanges(false);
        } catch (error) {
          console.error('Error al guardar el trazo:', error);
          Notifies('error', 'Error al guardar el trazo');
        }
      }
    },
    [layer, useCreateDrawing],
  );

  const handleDeleteAllDrawings = async () => {
    try {
      await useDeleteAllDrawingsByLayer(layer.id);
    } catch (error) {
      console.error('Error al eliminar todos los trazos:', error);
    }
  };

  const saveChanges = () => {
    if (currentCanvas) {
      handleSaveDrawing(currentCanvas);
      setHasUnsavedChanges(false);
    }
  };

  const discardChanges = () => {
    if (currentCanvas) {
      currentCanvas.clear();
      loadDrawingsToCanvas(currentCanvas, layer.drawings);
      setOriginalCanvasState(null);
      setHasUnsavedChanges(false);
    }
  };

  const handleModeChange = (newMode) => {
    if (hasUnsavedChanges) {
      Notifies(
        'warning',
        'Hay cambios sin guardar. Guarda o descarta los cambios antes de cambiar de herramienta.',
      );
      return;
    }

    setActiveMode(newMode);
  };

  return (
    <>
      <div className="relative w-full h-screen overflow-hidden ">
        {scaledImageUrl ? (
          <TransformWrapper
            initialScale={1}
            minScale={0.1}
            maxScale={5}
            centerOnInit
            wheel={{ step: 0.1 }}
            limitToBounds={false}
            disabled={activeMode !== MODES.DEFAULT}
            onPanning={() => {
              if (activeMode === MODES.SELECT) {
                return false;
              }
            }}
            onPinching={() => {
              if (activeMode === MODES.SELECT) {
                return false;
              }
            }}
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
                          id: 'defaultMode',
                          icon: LuMove,
                          color: 'primary',
                          action: () => handleModeChange(MODES.DEFAULT),
                          blured: true,
                          filled: activeMode === MODES.DEFAULT,
                        },
                        {
                          id: 'selectMode',
                          icon: PiCursorFill,
                          color: 'primary',
                          action: () => handleModeChange(MODES.SELECT),
                          blured: true,
                          filled: activeMode === MODES.SELECT,
                        },
                        {
                          id: 'drawMode',
                          icon: MdDraw,
                          color: 'primary',
                          action: () => handleModeChange(MODES.DRAW),
                          blured: true,
                          filled: activeMode === MODES.DRAW,
                        },
                        {
                          id: 'eraseMode',
                          icon: FaEraser,
                          action: () => handleModeChange(MODES.ERASE),
                          color: 'primary',
                          blured: true,
                          filled: activeMode === MODES.ERASE,
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
                          className="absolute top-0 left-0"
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
                            rest={rest}
                            drawingMode={activeMode === MODES.DRAW}
                            setCanvas={setCurrentCanvas}
                            ereaseDrawsMode={activeMode === MODES.ERASE}
                          />
                        </div>
                      )}
                  </TransformComponent>
                  <div className="fixed bottom-3 right-3 flex gap-2 z-50 text-nowrap max-w-[100vw] md:max-w-full">
                    {!(activeMode !== MODES.DEFAULT) ? (
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
                              disabled={layer?.id === layerSelected?.id}
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
                            label: 'Descartar',
                            icon: MdOutlineSettingsBackupRestore,
                            action: discardChanges,
                            color: 'primary',
                            blured: true,
                            disabled: !hasUnsavedChanges,
                          },
                          {
                            label: 'Limpiar',
                            icon: AiOutlineClear,
                            action: () => {
                              if (currentCanvas) {
                                currentCanvas.clear();
                              }
                              handleDeleteAllDrawings();
                              setHasUnsavedChanges(false);
                              setActiveMode(MODES.DEFAULT);
                            },
                            color: 'primary',
                            blured: true,
                          },
                          {
                            label: 'Guardar',
                            icon: MdSaveAlt,
                            action: saveChanges,
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
        ) : (
          <div className="flex items-center justify-center w-full h-full">
            <ThreeCircles
              visible={true}
              height="100"
              width="100"
              color="#36e961"
              ariaLabel="three-circles-loading"
              wrapperStyle={{}}
              wrapperclassName=""
            />
          </div>
        )}
      </div>
    </>
  );
};

export default React.memo(Canvas);
