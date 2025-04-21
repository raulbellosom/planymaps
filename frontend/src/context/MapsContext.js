import { createContext, useContext } from 'react';

const MapsContext = createContext({
  maps: [],
  map: null,
  dispatch: () => {},
  useCreateMap: async () => {},
  useUpdateMap: async () => {},
  useDeleteMap: async () => {},
  useGetMapById: async () => {},
  useCreateLayer: async () => {},
  useUpdateLayer: async () => {},
  useDeleteLayer: async () => {},
  useUpdateLayersOrder: async () => {},
  useCreateDrawing: async () => {},
  useUpdateDrawing: async () => {},
  useDeleteDrawing: async () => {},
  useDeleteAllDrawingsByLayer: async () => {},
  useGetDrawingsByLayerId: async () => {},
});

export const useMapsContext = () => useContext(MapsContext);

export default MapsContext;
