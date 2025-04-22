import React, { useEffect, useState } from 'react';
import { getMapById } from '../../services/maps.api';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ModalViewer from '../../components/Modals/ModalViewer';
import Layers from './Layers';
import Canvas from '../../components/MapsComponents/Canvas';
import useMaps from '../../hooks/useMaps';

const ViewMap = () => {
  const id = useParams().id;
  const { useGetLayerById } = useMaps();
  const [showModalLayer, setShowModalLayer] = useState(false);
  const [layers, setLayers] = useState([]);
  const [layer, setLayer] = useState(null);
  const [layerSelected, setLayerSelected] = useState(null);

  const { data, refetch } = useQuery({
    queryKey: ['map'],
    queryFn: ({ signal }) => getMapById(id, signal),
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 10,
  });

  useEffect(() => {
    refetch();
  }, []);

  useEffect(() => {
    if (data) {
      setLayers(data?.layers);

      const savedLayerId = localStorage.getItem(`selectedLayer_${id}`);
      const savedLayer = data?.layers?.find(
        (layer) => layer.id === savedLayerId,
      );

      if (savedLayer) {
        setLayerSelected(savedLayer);
      } else if (data?.layers?.length > 0) {
        setLayerSelected(data?.layers[0]);
      } else {
        setLayerSelected(null);
        setShowModalLayer(true);
      }
    }
  }, [data]);

  useEffect(() => {
    if (layerSelected?.id) {
      localStorage.setItem(`selectedLayer_${id}`, layerSelected.id);
      useGetLayerById(layerSelected.id)
        .then((layer) => {
          setLayer(layer);
        })
        .catch((error) => {
          console.error('Error al obtener la capa:', error);
        });
    }
  }, [layerSelected, id]);

  return (
    <>
      <div className="relative w-full h-full bg-stone-100">
        {layers && layer && (
          <Canvas
            key={layer?.id ?? layerSelected?.id}
            layers={layers}
            setShowModalLayer={setShowModalLayer}
            layerSelected={layerSelected}
            setLayerSelected={setLayerSelected}
            layer={layer}
          />
        )}
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
