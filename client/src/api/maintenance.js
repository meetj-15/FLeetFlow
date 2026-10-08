import api from '../services/api';

export const getAllMaintenance = async (filters = {}) => {
  const response = await api.get('/maintenance', { params: filters });
  return response.data.data.maintenance;
};

export const getMaintenanceById = async (id) => {
  const response = await api.get(`/maintenance/${id}`);
  return response.data.data.maintenance;
};

export const openMaintenance = async (data) => {
  const response = await api.post('/maintenance', data);
  return response.data.data.maintenance;
};

export const closeMaintenance = async (id, data = {}) => {
  const response = await api.put(`/maintenance/${id}/close`, data);
  return response.data.data.maintenance;
};
