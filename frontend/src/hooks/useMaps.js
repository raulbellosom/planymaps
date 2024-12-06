// useMaps.js
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createMap, updateMap, deleteMap } from '../services/maps.api.js';
import {
  createLayer,
  updateLayer,
  deleteLayer,
  updateLayersOrder,
} from '../services/maps.api.js';
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

  const useCreateLayer = useMutation({
    mutationFn: createLayer,
    onMutate: () => setLoading(true),
    onSuccess: (data) => {
      queryClient.setQueryData('layer', data);
      Notifies('success', 'Layer creado correctamente');
      dispatch({ type: 'CREATE_LAYER', payload: data });
      queryClient.invalidateQueries(['layers']);
    },
    onError: (error) => {
      Notifies('error', 'Hubo un error al crear el layer');
    },
    onSettled: () => setLoading(false),
  });

  const useUpdateLayer = useMutation({
    mutationFn: updateLayer,
    onMutate: () => setLoading(true),
    onSuccess: (data) => {
      queryClient.setQueryData('layer', data);
      dispatch({ type: 'UPDATE_LAYER', payload: data });
      Notifies('success', 'Layer actualizado correctamente');
      queryClient.invalidateQueries(['layers']);
    },
    onError: (error) => {
      Notifies('error', 'Hubo un error al actualizar el layer');
    },
    onSettled: () => setLoading(false),
  });

  const useDeleteLayer = useMutation({
    mutationFn: deleteLayer,
    onMutate: () => setLoading(true),
    onSuccess: (data) => {
      queryClient.setQueryData('layer', data);
      dispatch({ type: 'DELETE_LAYER', payload: data });
      Notifies('success', 'Layer eliminado correctamente');
      queryClient.invalidateQueries(['layers']);
    },
    onError: (error) => {
      Notifies('error', 'Hubo un error al eliminar el layer');
    },
    onSettled: () => setLoading(false),
  });

  const useUpdateLayersOrder = useMutation({
    mutationFn: updateLayersOrder,
    onMutate: () => setLoading(true),
    onSuccess: (data) => {
      queryClient.setQueryData('layer', data);
      dispatch({ type: 'UPDATE_LAYERS_ORDER', payload: data });
      Notifies('success', 'Orden de layers actualizado correctamente');
      queryClient.invalidateQueries(['layers']);
    },
    onError: (error) => {
      Notifies('error', 'Hubo un error al actualizar el orden de layers');
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
    useCreateLayer: (values) => {
      return useCreateLayer.mutateAsync(values);
    },
    useUpdateLayer: (values) => {
      return useUpdateLayer.mutateAsync(values);
    },
    useDeleteLayer: (id) => {
      return useDeleteLayer.mutateAsync(id);
    },
    useUpdateLayersOrder: (values) => {
      return useUpdateLayersOrder.mutateAsync(values);
    },
  };
};

export default useMaps;
