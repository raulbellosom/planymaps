import { createContext, useContext } from 'react';

const MapsContext = createContext({
  maps: [],
  map: null,
  dispatch: () => {},
  useCreateMap: async () => {},
  useUpdateMap: async () => {},
  useDeleteMap: async () => {},
});

export const useMapsContext = () => useContext(MapsContext);

export default MapsContext;
