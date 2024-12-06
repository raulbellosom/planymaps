import axios from 'axios';
import { saveAs } from 'file-saver';

export const BASE_API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:4000/';
export const API_URL = `${BASE_API_URL}/api` || 'http://localhost:4000/api';

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

export const login = async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const register = async (credentials) => {
  try {
    const response = await api.post('/auth/register', credentials);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const loadUser = async () => {
  try {
    const response = await api.get('/auth/me');
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const logout = async () => {
  try {
    const response = await api.get('/auth/logout');
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const updateProfile = async (profile) => {
  try {
    const response = await api.put('/auth/updateProfile', profile);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const updatePassword = async (passwords) => {
  try {
    const response = await api.put('/auth/updatePassword', passwords);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const updateProfileImage = async (profileImage) => {
  try {
    let data = new FormData();
    data.append('profileImage', profileImage);
    const response = await api.put(
      '/auth/updateProfileImage',
      data,
      headerFormData,
    );
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getUsers = async () => {
  try {
    const response = await api.get(`/users`);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const createUser = async (user) => {
  try {
    let data = new FormData();

    const image = user?.photo[0] || null;

    if (image instanceof File) {
      data.append('profileImage', image);
    }

    data.append(
      'userData',
      JSON.stringify({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        userName: user.userName,
        password: user.password,
        repeatPassword: user.repeatPassword,
      }),
    );
    const response = await api.post(`/users`, data, headerFormData);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const updateUser = async (user) => {
  try {
    let data = new FormData();
    const image = user?.photo[0] || null;

    if (image instanceof File) {
      data.append('profileImage', image);
    }
    data.append(
      'userData',
      JSON.stringify({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        userName: user.userName,
        status: user.status,
        password: user.password,
        repeatPassword: user.repeatPassword,
      }),
    );
    const response = await api.put(`/users/${user.id}`, data, headerFormData);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const changePasswordUser = async (user) => {
  try {
    const response = await api.put(`/users/changePassword/${user.id}`, user);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const deleteUser = async (userId) => {
  try {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const searchUsers = async ({
  searchTerm,
  sortBy,
  order,
  page,
  pageSize,
  signal,
}) => {
  try {
    const response = await api.get('/users/search', {
      params: {
        searchTerm,
        sortBy,
        order,
        page,
        pageSize,
      },
      signal: signal,
    });
    if (response.status !== 200) {
      throw new Error(response.message || 'Hubo un error al hacer la busqueda');
    }
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getInventories = async () => {
  try {
    const response = await api.get(`/inventories`);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getInventory = async ({ id: inventoryId, signal }) => {
  try {
    const response = await api.get(`/inventories/${inventoryId}`, { signal });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const createInventory = async (inventory) => {
  try {
    let data = new FormData();

    if (inventory.images && inventory.images.length > 0) {
      inventory.images.forEach((image) => {
        data.append('images', image);
      });
    }

    if (inventory.files && inventory.files.length > 0) {
      inventory.files.forEach((file) => {
        data.append('files', file);
      });
    }

    data.append('inventory', JSON.stringify(inventory));
    const response = await api.post(`/inventories`, data, headerFormData);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const updateInventory = async (inventory) => {
  try {
    const id = inventory.id;
    let data = new FormData();
    let currentImages = inventory.images.filter(
      (image) => image instanceof File,
    );
    inventory.images = inventory.images.filter(
      (image) => !(image instanceof File),
    );
    let currentFiles = inventory.files.filter((file) => file instanceof File);
    inventory.files = inventory.files.filter((file) => !(file instanceof File));

    if (currentImages && currentImages.length > 0) {
      currentImages.forEach((image) => {
        data.append('images', image);
      });
    }

    if (currentFiles && currentFiles.length > 0) {
      currentFiles.forEach((file) => {
        data.append('files', file);
      });
    }

    data.append('inventory', JSON.stringify(inventory));
    const response = await api.put(`/inventories/${id}`, data, headerFormData);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const deleteInventory = async (inventoryId) => {
  try {
    const response = await api.delete(`/inventories/${inventoryId}`);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const searchInventories = async ({
  searchTerm,
  sortBy,
  order,
  page,
  pageSize,
  conditionName,
  deepSearch,
  signal,
}) => {
  try {
    const parsedDeepSearch = JSON.stringify(deepSearch);
    const response = await api.get('/inventories/search', {
      params: {
        searchTerm,
        sortBy,
        order,
        page,
        pageSize,
        conditionName,
        deepSearch: parsedDeepSearch,
      },
      signal: signal,
    });
    if (response.status !== 200) {
      throw new Error(response.message || 'Hubo un error al hacer la busqueda');
    }
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const downloadFile = async (file) => {
  try {
    const response = await api.get(file.url, {
      responseType: 'blob',
    });
    const fileName = `${file?.metadata?.originalname || file?.id}`;

    saveAs(response.data, fileName ?? 'file');
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export default api;
