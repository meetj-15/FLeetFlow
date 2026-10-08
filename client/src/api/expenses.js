import api from '../services/api';

export const getAllExpenses = async (filters = {}) => {
  const response = await api.get('/expenses', { params: filters });
  return response.data.data;
};

export const getExpenseById = async (id) => {
  const response = await api.get(`/expenses/${id}`);
  return response.data.data.expense;
};

export const createExpense = async (data) => {
  const response = await api.post('/expenses', data);
  return response.data.data.expense;
};
