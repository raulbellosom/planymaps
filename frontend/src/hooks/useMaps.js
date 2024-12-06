// useMaps.js
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createMap, updateMap, deleteMap } from '../services/maps.api.js';
import { useLoading } from '../context/LoadingContext.js';
import Notifies from '../components/Notifies/Notifies';

const useMaps = (dispatch) => {
  const queryClient = useQueryClient();
  const { dispatch: loadingDispatch } = useLoading();

  const setLoading = (loading) => {
    loadingDispatch({ type: 'SET_LOADING', payload: loading });
  };

  // Hook para crear un nuevo mapa
  const useCreateMap = useMutation({
    mutationFn: createMap,
    onMutate: () => setLoading(true),
    onSuccess: (data) => {
      queryClient.setQueryData('map', data);
      Notifies('success', 'Mapa creado correctamente');
      dispatch({ type: 'CREATE_MAP', payload: data });
      queryClient.invalidateQueries(['maps']);
    },
    onError: (error) => {
      Notifies('error', 'Hubo un error al crear el mapa');
    },
    onSettled: () => setLoading(false),
  });

  // Hook para actualizar un mapa existente
  const useUpdateMap = useMutation({
    mutationFn: updateMap,
    onMutate: () => setLoading(true),
    onSuccess: (data) => {
      queryClient.setQueryData('map', data);
      dispatch({ type: 'UPDATE_MAP', payload: data });
      Notifies('success', 'Mapa actualizado correctamente');
      queryClient.invalidateQueries(['maps']);
    },
    onError: (error) => {
      Notifies('error', 'Hubo un error al actualizar el mapa');
    },
    onSettled: () => setLoading(false),
  });

  // Hook para eliminar un mapa
  const useDeleteMap = useMutation({
    mutationFn: deleteMap,
    onMutate: () => setLoading(true),
    onSuccess: (data) => {
      queryClient.setQueryData('map', data);
      dispatch({ type: 'DELETE_MAP', payload: data });
      Notifies('success', 'Mapa eliminado correctamente');
      queryClient.invalidateQueries(['maps']);
    },
    onError: (error) => {
      Notifies('error', 'Hubo un error al eliminar el mapa');
    },
    onSettled: () => setLoading(false),
  });

  return {
    useCreateMap: (values) => {
      return useCreateMap.mutateAsync(values);
    },
    useUpdateMap: (values) => {
      return useUpdateMap.mutateAsync(values);
    },
    useDeleteMap: (id) => {
      return useDeleteMap.mutateAsync(id);
    },
  };
};

export default useMaps;
