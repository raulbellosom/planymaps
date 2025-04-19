import { useReducer } from 'react';
import MapsReducer from './MapsReducer';
import MapsContext from './MapsContext';
import useMaps from '../hooks/useMaps';

const MapsProvider = ({ children }) => {
  const [state, dispatch] = useReducer(MapsReducer, {
    maps: [],
    map: null,
    layers: [],
    layer: null,
  });

  const {
    useCreateMap,
    useDeleteMap,
    useUpdateMap,
    useCreateLayer,
    useDeleteLayer,
    useUpdateLayer,
    useUpdateLayersOrder,
    useCreateDrawing,
    useUpdateDrawing,
    useDeleteDrawing,
    useDeleteAllDrawingsByLayer,
    useGetDrawingsByLayerId,
  } = useMaps(dispatch);

  return (
    <MapsContext.Provider
      value={{
        ...state,
        dispatch,
        useCreateMap,
        useDeleteMap,
        useUpdateMap,
        useCreateLayer,
        useDeleteLayer,
        useUpdateLayer,
        useUpdateLayersOrder,
        useCreateDrawing,
        useUpdateDrawing,
        useDeleteDrawing,
        useDeleteAllDrawingsByLayer,
        useGetDrawingsByLayerId,
      }}
    >
      {children}
    </MapsContext.Provider>
  );
};

export default MapsProvider;
