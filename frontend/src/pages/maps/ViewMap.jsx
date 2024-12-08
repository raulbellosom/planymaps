import React, { useEffect, useState } from 'react';
import ActionButtons from '../../components/ActionButtons/ActionButtons';
import { RiMap2Line } from 'react-icons/ri';
import { getMapById } from '../../services/maps.api';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MdOutlineInvertColors, MdOutlineRestore } from 'react-icons/md';
import ModalViewer from '../../components/Modals/ModalViewer';
import Layers from './Layers';
import Canvas from '../../components/MapsComponents/Canvas';

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
        <div className="md:absolute md:z-10 md:top-2 md:left-16 p-1 px-2 bg-white w-fit flex gap-2 text-2xl items-center">
          <i>
            <RiMap2Line className="text-planymaps-primary" />
          </i>
          <span className="text-planymaps-primary font-semibold">
            {map?.name}
          </span>
        </div>

        <>{layers && <Canvas layers={layers} />}</>
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
