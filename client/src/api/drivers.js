import api from '../services/api';

export const getAllDrivers = async (filters = {}) => {
  const response = await api.get('/drivers', { params: filters });
  return response.data.data.drivers;
};

export const getAvailableDrivers = async () => {
  const response = await api.get('/drivers/available');
  return response.data.data.drivers;
};

export const getDriverById = async (id) => {
  const response = await api.get(`/drivers/${id}`);
  return response.data.data.driver;
};

export const createDriver = async (driverData) => {
  const response = await api.post('/drivers', driverData);
  return response.data.data.driver;
};

export const updateDriver = async (id, driverData) => {
  const response = await api.put(`/drivers/${id}`, driverData);
  return response.data.data.driver;
};
