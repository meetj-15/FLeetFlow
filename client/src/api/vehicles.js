import api from '../services/api';

export const getAllVehicles = async (filters = {}) => {
  const response = await api.get('/vehicles', { params: filters });
  return response.data.data.vehicles;
};

export const getVehicleById = async (id) => {
  const response = await api.get(`/vehicles/${id}`);
  return response.data.data.vehicle;
};

export const createVehicle = async (vehicleData) => {
  const response = await api.post('/vehicles', vehicleData);
  return response.data.data.vehicle;
};

export const updateVehicle = async (id, vehicleData) => {
  const response = await api.put(`/vehicles/${id}`, vehicleData);
  return response.data.data.vehicle;
};

export const deleteVehicle = async (id) => {
  const response = await api.delete(`/vehicles/${id}`);
  return response.data;
};
