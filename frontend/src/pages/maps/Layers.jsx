import React, { useEffect, useState } from 'react';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useMapsContext } from '../../context/MapsContext';
import { useQuery } from '@tanstack/react-query';
import ActionButtons from '../../components/ActionButtons/ActionButtons';
import { FaPenSquare, FaTrash } from 'react-icons/fa';
import { BsPlus } from 'react-icons/bs';
import { getLayers } from '../../services/maps.api';
import { FormattedUrlImage } from '../../utils/FormattedUrlImage';
import ModalFormikForm from '../../components/Modals/ModalFormikForm';
import LayerFormFields from '../../components/MapsComponents/LayerFormFields';
import { LayerFormSchema } from '../../components/MapsComponents/LayerFormSchema';
import ModalRemove from '../../components/Modals/ModalRemove';

const initValues = {
  name: '',
  image: '',
  order: 0,
  mapId: '',
};

const LayerItem = ({
  item,
  index,
  moveLayer,
  setLayer,
  setIsOpenModal,
  saveOrder,
  onRemove,
}) => {
  const [, ref] = useDrag({
    type: 'LAYER',
    item: { index },
  });

  const [, drop] = useDrop({
    accept: 'LAYER',
    hover: (draggedItem) => {
      if (draggedItem.index !== index) {
        moveLayer(draggedItem.index, index);
        draggedItem.index = index;
      }
    },
    drop: () => {
      // Save the order without closing the modal
      saveOrder();
    },
  });

  return (
    <div
      ref={(node) => ref(drop(node))}
      className="flex flex-col border border-neutral-200 rounded-lg p-2 bg-white shadow-sm"
    >
      <img
        alt={item.name}
        src={FormattedUrlImage(item.image?.[0]?.url)}
        className="w-full h-24 object-cover rounded-lg"
      />
      <h5 className="text-xl font-medium truncate tracking-tight text-gray-900 mt-2">
        {item.name}
      </h5>
      <div className="flex justify-center gap-4 pt-4">
        <ActionButtons
          extraActions={[
            {
              label: '',
              action: () => onRemove(),
              icon: FaTrash,
            },
            {
              label: '',
              action: () => {
                setLayer({
                  name: item.name,
                  image: item.image,
                  mapId: item.mapId,
                  order: item.order,
                  id: item.id,
                });
                setIsOpenModal(true);
              },
              icon: FaPenSquare,
            },
          ]}
        />
      </div>
    </div>
  );
};

const Layers = ({ mapId, onSaveOrder }) => {
  const {
    useCreateLayer,
    useUpdateLayer,
    useDeleteLayer,
    useUpdateLayersOrder,
  } = useMapsContext();
  const [layers, setLayers] = useState([]);
  const [layer, setLayer] = useState({ ...initValues });
  const [openModal, setIsOpenModal] = useState(false);
  const [removeModal, setRemoveModal] = useState(false);

  const { data, refetch, isPending } = useQuery({
    queryKey: ['layers'],
    queryFn: ({ signal }) => getLayers(mapId, signal),
    staleTime: 1000 * 60 * 5, // 5 minutos (ajusta según lo necesario)
    cacheTime: 1000 * 60 * 10, // 10 minutos (ajusta según lo necesario)
  });

  useEffect(() => {
    refetch();
  }, []);

  useEffect(() => {
    if (data) {
      setLayers(data);
    }
  }, [data]);

  useEffect(() => {
    if (data) {
      setLayers(data.sort((a, b) => a.order - b.order));
    }
  }, [data]);

  const handleSubmit = async (values) => {
    if (layer.mapId) {
      await useUpdateLayer(values);
    } else {
      await useCreateLayer(values);
    }
    setIsOpenModal(false);
  };

  const moveLayer = (fromIndex, toIndex) => {
    const updatedLayers = [...layers];
    const [movedItem] = updatedLayers.splice(fromIndex, 1);
    updatedLayers.splice(toIndex, 0, movedItem);
    setLayers(updatedLayers);
  };

  const saveOrder = async () => {
    try {
      await useUpdateLayersOrder(
        layers.map((layer, index) => ({ id: layer.id, order: index })),
      );
      if (onSaveOrder) {
        onSaveOrder(); // Llama a la función para evitar el refetch
      }
    } catch (error) {
      console.error('Error saving layer order:', error);
    }
  };

  return (
    <>
      <DndProvider backend={HTML5Backend}>
        <div className="flex flex-col items-start w-full">
          <div className="flex flex-col-reverse md:flex-row gap-2 justify-between w-full">
            <h2 className="text-xl font-normal">
              Capas disponibles en este mapa
            </h2>
            <ActionButtons
              extraActions={[
                {
                  label: 'Agregar capa',
                  action: () => setIsOpenModal(true),
                  color: 'primary',
                  icon: BsPlus,
                  filled: true,
                  type: 'button',
                },
              ]}
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {!isPending && layers.length > 0 ? (
              layers.map((item, index) => (
                <LayerItem
                  key={item.id}
                  item={item}
                  index={index}
                  moveLayer={moveLayer}
                  setLayer={setLayer}
                  setIsOpenModal={setIsOpenModal}
                  saveOrder={saveOrder}
                  onRemove={() => {
                    setLayer(item);
                    setRemoveModal(true);
                  }}
                />
              ))
            ) : (
              <div className="flex flex-col col-span-2 items-center justify-center w-full">
                <p className="text-lg text-gray-500 mb-4">
                  No hay capas disponibles en este mapa
                </p>
              </div>
            )}
          </div>
        </div>
      </DndProvider>
      {openModal && (
        <ModalFormikForm
          dismissible={true}
          formFields={<LayerFormFields />}
          initialValues={{
            ...layer,
            mapId,
            order: layer.order || layers.length,
          }}
          onSubmit={handleSubmit}
          schema={LayerFormSchema}
          isOpenModal={openModal}
          onClose={() => {
            setIsOpenModal(false);
            setLayer({ ...initValues });
          }}
          saveLabel={layer.id ? 'Actualizar' : 'Guardar'}
          title={layer.id ? 'Editar capa' : 'Nueva capa'}
        />
      )}
      {removeModal && (
        <ModalRemove
          isOpenModal={removeModal}
          onClose={() => {
            setRemoveModal(false), setLayer({ ...initValues });
          }}
          removeFunction={async () => {
            await useDeleteLayer(layer.id);
            setRemoveModal(false);
            setLayer({ ...initValues });
          }}
          title="Eliminar capa"
        />
      )}
    </>
  );
};

export default Layers;
