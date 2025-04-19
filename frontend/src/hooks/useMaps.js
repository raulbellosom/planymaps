// useMaps.js
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createMap, updateMap, deleteMap } from '../services/maps.api.js';
import {
  createLayer,
  updateLayer,
  deleteLayer,
  updateLayersOrder,
  getDrawingsByLayerId,
  deleteAllDrawingsByLayer,
  createDrawing,
  deleteDrawing,
  updateDrawing,
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
      Notifies('success', 'Capa creada correctamente');
      dispatch({ type: 'CREATE_LAYER', payload: data });
      queryClient.invalidateQueries(['layers']);
    },
    onError: (error) => {
      Notifies('error', 'Hubo un error al crear la capa');
    },
    onSettled: () => setLoading(false),
  });

  const useUpdateLayer = useMutation({
    mutationFn: updateLayer,
    onMutate: () => setLoading(true),
    onSuccess: (data) => {
      queryClient.setQueryData('layer', data);
      dispatch({ type: 'UPDATE_LAYER', payload: data });
      Notifies('success', 'Capa actualizada correctamente');
      queryClient.invalidateQueries(['layers']);
    },
    onError: (error) => {
      Notifies('error', 'Hubo un error al actualizar la capa');
    },
    onSettled: () => setLoading(false),
  });

  const useDeleteLayer = useMutation({
    mutationFn: deleteLayer,
    onMutate: () => setLoading(true),
    onSuccess: (data) => {
      queryClient.setQueryData('layer', data);
      dispatch({ type: 'DELETE_LAYER', payload: data });
      Notifies('success', 'Capa eliminada correctamente');
      queryClient.invalidateQueries(['layers']);
    },
    onError: (error) => {
      Notifies('error', 'Hubo un error al eliminar la capa');
    },
    onSettled: () => setLoading(false),
  });

  const useUpdateLayersOrder = useMutation({
    mutationFn: updateLayersOrder,
    onMutate: () => setLoading(true),
    onSuccess: (data) => {
      queryClient.setQueryData('layer', data);
      dispatch({ type: 'UPDATE_LAYERS_ORDER', payload: data });
      Notifies('success', 'Orden de capas actualizado correctamente');
      queryClient.invalidateQueries(['layers']);
    },
    onError: (error) => {
      Notifies('error', 'Hubo un error al actualizar el orden de capas');
    },
    onSettled: () => setLoading(false),
  });

  const useGetDrawingsByLayerId = useMutation({
    mutationFn: getDrawingsByLayerId,
    onMutate: () => setLoading(true),
    onSuccess: (data) => {
      queryClient.setQueryData('drawings', data);
      Notifies('success', 'Trazos obtenidos correctamente');
      dispatch({ type: 'GET_DRAWINGS', payload: data });
    },
    onError: (error) => {
      Notifies('error', 'Hubo un error al obtener los trazos');
    },
    onSettled: () => setLoading(false),
  });

  const useCreateDrawing = useMutation({
    mutationFn: createDrawing,
    onMutate: () => setLoading(true),
    onSuccess: (data) => {
      queryClient.setQueryData('drawing', data);
      Notifies('success', 'Trazos creados correctamente');
      dispatch({ type: 'CREATE_DRAWING', payload: data });
      return data;
    },
    onError: (error) => {
      Notifies('error', 'Hubo un error al crear los trazos');
    },
    onSettled: () => setLoading(false),
  });

  const useUpdateDrawing = useMutation({
    mutationFn: updateDrawing,
    onMutate: () => setLoading(true),
    onSuccess: (data) => {
      queryClient.setQueryData('drawing', data);
      Notifies('success', 'Trazos actualizados correctamente');
      dispatch({ type: 'UPDATE_DRAWING', payload: data });
    },
    onError: (error) => {
      Notifies('error', 'Hubo un error al actualizar los trazos');
    },
    onSettled: () => setLoading(false),
  });

  const useDeleteDrawing = useMutation({
    mutationFn: deleteDrawing,
    onMutate: () => setLoading(true),
    onSuccess: (data) => {
      queryClient.setQueryData('drawing', data);
      Notifies('success', 'Trazos eliminados correctamente');
      dispatch({ type: 'DELETE_DRAWING', payload: data });
    },
    onError: (error) => {
      Notifies('error', 'Hubo un error al eliminar los trazos');
    },
    onSettled: () => setLoading(false),
  });

  const useDeleteAllDrawingsByLayer = useMutation({
    mutationFn: deleteAllDrawingsByLayer,
    onMutate: () => setLoading(true),
    onSuccess: (data) => {
      queryClient.setQueryData('drawings', data);
      Notifies('success', 'Trazos eliminados correctamente');
      dispatch({ type: 'DELETE_DRAWINGS', payload: data });
    },
    onError: (error) => {
      Notifies('error', 'Hubo un error al eliminar los trazos');
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
    useGetDrawingsByLayerId: (layerId) => {
      return useGetDrawingsByLayerId.mutateAsync(layerId);
    },
    useCreateDrawing: (values) => {
      return useCreateDrawing.mutateAsync(values);
    },
    useUpdateDrawing: (values) => {
      return useUpdateDrawing.mutateAsync(values);
    },
    useDeleteDrawing: (id) => {
      return useDeleteDrawing.mutateAsync(id);
    },
    useDeleteAllDrawingsByLayer: (layerId) => {
      return useDeleteAllDrawingsByLayer.mutateAsync(layerId);
    },
  };
};

export default useMaps;
