import api from '../services/api';

export const getAllFuelLogs = async (filters = {}) => {
  const response = await api.get('/fuel', { params: filters });
  return response.data.data.fuelLogs;
};

export const getFuelLogById = async (id) => {
  const response = await api.get(`/fuel/${id}`);
  return response.data.data.fuelLog;
};

export const createFuelLog = async (data) => {
  const response = await api.post('/fuel', data);
  return response.data.data.fuelLog;
};
