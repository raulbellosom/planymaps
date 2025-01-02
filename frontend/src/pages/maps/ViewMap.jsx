import React, { useEffect, useState } from 'react';
import { RiMap2Line } from 'react-icons/ri';
import { getMapById } from '../../services/maps.api';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ModalViewer from '../../components/Modals/ModalViewer';
import Layers from './Layers';
import Canvas from '../../components/MapsComponents/Canvas';
import DrawingComponent from '../../components/MapsComponents/DrawingComponent';

const ViewMap = () => {
  const id = useParams().id;
  const [map, setMap] = useState(null);
  const [showModalLayer, setShowModalLayer] = useState(false);
  const [layers, setLayers] = useState([]);

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
      setMap(data);
      const sortedLayers = data.layers?.sort((a, b) => a.order - b.order);
      setLayers(sortedLayers);
      setShowModalLayer(sortedLayers.length === 0);
    }
  }, [data]);

  return (
    <>
      <div className="relative w-full h-[100vh]">
        {layers && (
          <Canvas layers={layers} setShowModalLayer={setShowModalLayer} />
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
