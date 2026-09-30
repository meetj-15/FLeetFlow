import api from '../services/api';

export const getDashboardMetrics = async () => {
  const response = await api.get('/dashboard');
  return response.data.data;
};
