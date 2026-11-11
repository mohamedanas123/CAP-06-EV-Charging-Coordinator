import api from './axios';

export const getDashboardSummary = async () => {
  return await api.get('/dashboard/summary');
};

export const getDashboardAlerts = async () => {
  return await api.get('/dashboard/alerts');
};
