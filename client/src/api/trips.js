import api from '../services/api';

export const getAllTrips = async (filters = {}) => {
  const response = await api.get('/trips', { params: filters });
  return response.data.data.trips;
};

export const getTripById = async (id) => {
  const response = await api.get(`/trips/${id}`);
  return response.data.data.trip;
};

export const createTrip = async (tripData) => {
  const response = await api.post('/trips', tripData);
  return response.data.data.trip;
};

export const dispatchTrip = async (id) => {
  const response = await api.post(`/trips/${id}/dispatch`);
  return response.data.data.trip;
};

export const completeTrip = async (id, data) => {
  const response = await api.post(`/trips/${id}/complete`, data);
  return response.data.data.trip;
};

export const cancelTrip = async (id) => {
  const response = await api.post(`/trips/${id}/cancel`);
  return response.data.data.trip;
};
