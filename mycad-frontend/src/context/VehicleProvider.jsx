import { useReducer, useEffect } from 'react';
import { useAuthContext } from './AuthContext';
import VehicleContext from './VehicleContext';
import VehicleReducer from './VehicleReducer';
import useVehicle from '../hooks/useVehicle';
import useVehicleCatalogs from '../hooks/useVehicleCatalogs';

const VehicleProvider = ({ children }) => {
  const [state, dispatch] = useReducer(VehicleReducer, {
    vehicles: [],
    pagination: {},
    vehicle: {},
    loading: true,
    vehicleTypes: [],
    vehicleType: {},
    vehicleBrands: [],
    vehicleBrand: {},
    vehicleModels: [],
    vehicleModel: {},
    vehicleConditions: [],
    vehicleCondition: {},
  });

  const { user, loading } = useAuthContext();

  const {
    fetchVehicles,
    fetchVehicle,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    searchVehicles
  } = useVehicle(dispatch);

  const {
    fetchVehicleType,
    fetchVehicleTypes,
    createVehicleType,
    updateVehicleType,
    deleteVehicleType,
    fetchVehicleBrand,
    fetchVehicleBrands,
    createVehicleBrand,
    updateVehicleBrand,
    deleteVehicleBrand,
    fetchVehicleModel,
    fetchVehicleModels,
    createVehicleModel,
    updateVehicleModel,
    deleteVehicleModel,
    fetchVehicleConditions,
    fetchVehicleCondition,
    createVehicleCondition,
    updateVehicleCondition,
    deleteVehicleCondition,
  } = useVehicleCatalogs(dispatch);

  const loadVehiclesInfo = () => {
    // fetchVehicles();
    fetchVehicleTypes();
    fetchVehicleBrands();
    fetchVehicleModels();
    fetchVehicleConditions();
  };

  useEffect(() => {
    if (!user || loading) {
      return;
    }
    loadVehiclesInfo();
  }, [user]);

  return (
    <VehicleContext.Provider
      value={{
        ...state,
        searchVehicles,
        fetchVehicles,
        fetchVehicle,
        createVehicle,
        updateVehicle,
        deleteVehicle,
        fetchVehicleTypes,
        fetchVehicleType,
        createVehicleType,
        updateVehicleType,
        deleteVehicleType,
        fetchVehicleBrand,
        fetchVehicleBrands,
        createVehicleBrand,
        updateVehicleBrand,
        deleteVehicleBrand,
        fetchVehicleModel,
        fetchVehicleModels,
        createVehicleModel,
        updateVehicleModel,
        deleteVehicleModel,
        fetchVehicleConditions,
        fetchVehicleCondition,
        createVehicleCondition,
        updateVehicleCondition,
        deleteVehicleCondition,
      }}
    >
      {children}
    </VehicleContext.Provider>
  );
};

export default VehicleProvider;
