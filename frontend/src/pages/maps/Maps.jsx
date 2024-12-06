import React, { useEffect, useState } from 'react';
import TableHeader from '../../components/Table/TableHeader';
import { TbMapStar } from 'react-icons/tb';
import { IoMdAdd, IoMdRefresh } from 'react-icons/io';
import ModalFormikForm from '../../components/Modals/ModalFormikForm';
import MapFormFields from '../../components/MapsComponents/MapFormFields';
import { MapFormSchema } from '../../components/MapsComponents/MapFormSchema';
import { useMapsContext } from '../../context/MapsContext';
import { getMaps } from '../../services/maps.api';
import { useQuery } from '@tanstack/react-query';
import ActionButtons from '../../components/ActionButtons/ActionButtons';
import { FaEye, FaPenSquare, FaTrash } from 'react-icons/fa';
import MapsCard from '../../components/Card/MapsCard';
import { useNavigate } from 'react-router-dom';
import ModalRemove from '../../components/Modals/ModalRemove';
import { TextInput } from 'flowbite-react';
import { FiSearch } from 'react-icons/fi';

const Initvalues = {
  name: '',
  description: '',
  visibility: 'public',
  id: '',
};

const Maps = () => {
  const navigate = useNavigate();
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [IntialValues, setIntialValues] = useState(Initvalues);
  const { useCreateMap, useUpdateMap, useDeleteMap } = useMapsContext();
  const [removeModal, setRemoveModal] = useState(false);
  const [selectedMap, setSelectedMap] = useState(null);
  const [maps, setMaps] = useState([]);

  const {
    data: allMaps,
    refetch,
    isPending,
  } = useQuery({
    queryKey: ['maps'],
    queryFn: ({ signal }) => getMaps(signal),
    slateTime: Infinity,
  });

  useEffect(() => {
    refetch();
  }, []);

  useEffect(() => {
    if (allMaps) {
      setMaps(allMaps);
    }
  }, [allMaps]);

  const onSubmit = async (values) => {
    if (isEdit) {
      await useUpdateMap(values);
    } else {
      await useCreateMap(values);
    }
    setIsOpenModal(false);
  };

  return (
    <>
      <div className="w-full flex flex-col relative pt-14 px-4">
        <div className="md:absolute md:top-2 md:left-16 flex-1 w-full md:pr-20">
          <TableHeader
            title={'Mis mapas'}
            icon={TbMapStar}
            actions={[
              {
                label: 'Nuevo',
                action: () => setIsOpenModal(true),
                color: 'primary',
                icon: IoMdAdd,
                filled: true,
              },
            ]}
          />
        </div>
        <div className="pt-4">
          <div className="w-full flex flex-col border-b border-neutral-100 pb-2 gap-4">
            <h2 className="text-2xl font-bold text-nowrap">Todos los mapas</h2>
            <div className="flex gap-4 w-full">
              <ActionButtons
                extraActions={[
                  {
                    label: 'Recargar',
                    action: () => refetch(),
                    color: 'stone',
                    icon: IoMdRefresh,
                    className: 'max-w-fit',
                  },
                ]}
              />
              <TextInput
                theme={{
                  field: {
                    input: {
                      colors: {
                        white: 'bg-white border-neutral-200',
                      },
                    },
                  },
                }}
                placeholder="Buscar"
                className="w-1/3"
                color="white"
                icon={FiSearch}
              />
            </div>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,_minmax(400px,_1fr))] gap-4 pt-4">
            {!isPending && maps && maps.length > 0 ? (
              maps?.map((map) => (
                <MapsCard
                  key={map.id}
                  map={map}
                  actions={[
                    {
                      label: 'Ver',
                      action: () => navigate(`/maps/view/${map.id}`),
                      color: 'primary',
                      icon: FaEye,
                    },
                  ]}
                  collapsedActions={[
                    {
                      label: 'Editar',
                      action: () => {
                        setIsEdit(true);
                        setIsOpenModal(true);
                        setIntialValues({
                          name: map.name,
                          description: map.description,
                          visibility: map.visibility,
                          id: map.id,
                        });
                      },
                      color: 'primary',
                      icon: FaPenSquare,
                      filled: true,
                    },
                    {
                      label: 'Eliminar',
                      action: () => {
                        setSelectedMap(map);
                        setRemoveModal(true);
                      },
                      color: 'danger',
                      icon: FaTrash,
                    },
                  ]}
                />
              ))
            ) : (
              <div className="w-full flex justify-center items-center h-40">
                <p className="text-lg text-neutral-500">No hay mapas</p>
              </div>
            )}
          </div>
        </div>
      </div>
      {isOpenModal && (
        <ModalFormikForm
          title={isEdit ? 'Editar mapa' : 'Nuevo mapa'}
          saveLabel={isEdit ? 'Actualizar' : 'Guardar'}
          onSubmit={onSubmit}
          formFields={<MapFormFields />}
          dismissible={true}
          schema={MapFormSchema}
          initialValues={IntialValues}
          isOpenModal={isOpenModal}
          setIsOpenModal={setIsOpenModal}
          onClose={() => {
            setIsEdit(false);
            setIntialValues(Initvalues);
            setIsOpenModal(false);
          }}
        />
      )}
      {removeModal && (
        <ModalRemove
          isOpenModal={removeModal}
          setIsOpenModal={setRemoveModal}
          onCloseModal={() => {
            setRemoveModal(false);
            setSelectedMap(null);
          }}
          removeFunction={async () => {
            await useDeleteMap(selectedMap.id);
            setRemoveModal(false);
          }}
        />
      )}
    </>
  );
};

export default Maps;
