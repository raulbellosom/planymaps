import React, { useEffect, useState } from 'react';
import ActionButtons from '../../components/ActionButtons/ActionButtons';
import { GoZoomIn, GoZoomOut } from 'react-icons/go';
import { TbZoomScan } from 'react-icons/tb';
import { RiMap2Line } from 'react-icons/ri';
import { getMapById } from '../../services/maps.api';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MdGridOff, MdGridOn } from 'react-icons/md';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Tooltip } from 'flowbite-react';
import { BsStack } from 'react-icons/bs';
import ModalViewer from '../../components/Modals/ModalViewer';
import Layers from './Layers';
import { FormattedUrlImage } from '../../utils/FormattedUrlImage';

const ViewMap = () => {
  const id = useParams().id;
  const [map, setMap] = useState(null);
  const [showGrid, setShowGrid] = useState(true);
  const [showModalLayer, setShowModalLayer] = useState(false);
  const [layers, setLayers] = useState([]);
  const [layerSelected, setLayerSelected] = useState(null);

  const { data, refetch } = useQuery({
    queryKey: ['map'],
    queryFn: ({ signal }) => getMapById(id, signal),
    staleTime: 1000 * 60 * 5, // 5 minutos (ajusta según lo necesario)
    cacheTime: 1000 * 60 * 10, // 10 minutos (ajusta según lo necesario)
  });

  useEffect(() => {
    refetch();
  }, []);

  useEffect(() => {
    if (data) {
      setMap(data);
      setLayers(data.layers?.sort((a, b) => a.order - b.order));
      setShowModalLayer(data.layers.length === 0);
      setLayerSelected(data.layers[0]);
    }
  }, [data]);

  const renderGrid = () => {
    const rows = 10; // Número de filas
    const columns = 10; // Número de columnas
    const gridItems = [];

    for (let row = 1; row <= rows; row++) {
      for (let col = 1; col <= columns; col++) {
        gridItems.push(
          <div
            key={`${row}-${col}`}
            className="border border-gray-300"
            style={{ gridRow: row, gridColumn: col }}
          />,
        );
      }
    }

    return (
      <div
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        style={{
          display: 'grid',
          gridTemplateRows: `repeat(${rows}, 1fr)`,
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
        }}
      >
        {gridItems}
        {/* Etiquetas de filas */}
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
        {/* Etiquetas de columnas */}
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
            {String.fromCharCode(65 + index)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="relative w-full h-[100vh]">
        {/* Encabezado con el nombre del mapa */}
        <div className="md:absolute md:top-2 md:left-16 p-1 px-2 bg-white w-fit flex gap-2 text-2xl items-center">
          <i>
            <RiMap2Line className="text-planymaps-primary" />
          </i>
          <span className="text-planymaps-primary font-semibold">
            {map?.name}
          </span>
        </div>

        {/* Lienzo interactivo */}
        <TransformWrapper
          initialScale={1}
          minScale={0.5}
          maxScale={5}
          centerContent
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              {/* Botones de control */}
              <div className="fixed bottom-3 right-3 flex gap-2 z-50">
                {layers?.map((layer) => (
                  <ActionButtons
                    key={layer.id}
                    extraActions={[
                      {
                        label: layer.name,
                        action: () => setLayerSelected(layer),
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
                        action: () => setShowModalLayer(true),
                        color: 'stone',
                        icon: BsStack,
                      },
                    ]}
                  />
                </Tooltip>
              </div>

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
                  ]}
                />
              </div>

              {/* Área del lienzo */}
              <TransformComponent>
                <div className="w-full h-[100vh] relative">
                  {/* Aquí renderizamos la imagen del layer seleccionado */}
                  {layerSelected &&
                    layerSelected.image &&
                    layerSelected.image[0] && (
                      <img
                        src={FormattedUrlImage(layerSelected.image[0].url)}
                        alt={layerSelected.name}
                        className="w-full h-full object-contain"
                      />
                    )}
                  {/* Renderizar cuadrícula si está activada */}
                  {showGrid && renderGrid()}
                </div>
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
      </div>

      {showModalLayer && (
        <ModalViewer
          size="4xl"
          isOpenModal={showModalLayer}
          setIsOpenModal={setShowModalLayer}
          dismissible={false}
          onCloseModal={() => setShowModalLayer(false)}
          title="Administrar capas"
        >
          <Layers mapId={id} />
        </ModalViewer>
      )}
    </>
  );
};

export default ViewMap;
