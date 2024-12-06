const MapsReducer = (state, action) => {
  switch (action.type) {
    case 'GET_MAPS':
      return {
        ...state,
        maps: action.payload,
        loading: false,
      };
    case 'GET_MAP':
      return {
        ...state,
        map: action.payload,
        loading: false,
      };
    case 'CREATE_MAP':
      return {
        ...state,
        map: action.payload,
        maps: [...state.maps, action.payload],
        loading: false,
      };
    case 'UPDATE_MAP':
      return {
        ...state,
        map: action.payload,
        maps: state.maps.map((map) =>
          map.id === action.payload.id ? action.payload : map,
        ),
        loading: false,
      };
    case 'DELETE_MAP':
      return {
        ...state,
        maps: action.payload,
        loading: false,
      };
    case 'CREATE_LAYER':
      return {
        ...state,
        layer: action.payload,
        layers: [...state.layers, action.payload],
        loading: false,
      };
    case 'UPDATE_LAYER':
      return {
        ...state,
        layer: action.payload,
        layers: [...state.layers, action.payload],
        loading: false,
      };
    case 'DELETE_LAYER':
      return {
        ...state,
        layers: action.payload,
        loading: false,
      };
    case 'UPDATE_LAYERS_ORDER':
      return {
        ...state,
        layers: action.payload,
        loading: false,
      };
    default:
      return state;
  }
};

export default MapsReducer;
