import axios from 'axios';

const BASE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/';
const API_URL = `${BASE_API_URL}/api` || 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(
  (config) => {
    config.headers['Access-Control-Allow-Origin'] = '*';
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

const headerFormData = {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
};

export const getMaps = async () => {
  try {
    const { data } = await api.get('/maps');
    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getMapById = async (id) => {
  try {
    const { data } = await api.get(`/maps/${id}`);
    return data;
  } catch (error) {
    console.log(error);

    throw error;
  }
};

export const createMap = async (map) => {
  try {
    const { data } = await api.post('/maps', map);
    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const updateMap = async (map) => {
  try {
    const { data } = await api.put(`/maps/${map.id}`, map);
    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const deleteMap = async (id) => {
  try {
    const { data } = await api.delete(`/maps/${id}`);
    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
