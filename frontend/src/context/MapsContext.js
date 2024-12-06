import { createContext, useContext } from 'react';

const MapsContext = createContext({
  maps: [],
  map: null,
  dispatch: () => {},
  useCreateMap: async () => {},
  useUpdateMap: async () => {},
  useDeleteMap: async () => {},
  useCreateLayer: async () => {},
  useUpdateLayer: async () => {},
  useDeleteLayer: async () => {},
  useUpdateLayersOrder: async () => {},
});

export const useMapsContext = () => useContext(MapsContext);

export default MapsContext;
