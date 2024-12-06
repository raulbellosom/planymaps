import { useReducer } from 'react';
import MapsReducer from './MapsReducer';
import MapsContext from './MapsContext';
import useMaps from '../hooks/useMaps';

const MapsProvider = ({ children }) => {
  const [state, dispatch] = useReducer(MapsReducer, {
    maps: [],
    map: null,
  });

  const { useCreateMap, useDeleteMap, useUpdateMap } = useMaps(dispatch);

  return (
    <MapsContext.Provider
      value={{
        ...state,
        dispatch,
        useCreateMap,
        useDeleteMap,
        useUpdateMap,
      }}
    >
      {children}
    </MapsContext.Provider>
  );
};

export default MapsProvider;
