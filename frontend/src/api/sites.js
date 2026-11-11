import api from './axios';

export const getAllSites = async () => {
  return await api.get('/sites');
};

export const getSiteById = async (siteId) => {
  return await api.get(`/sites/${siteId}`);
};

export const createSite = async (data) => {
  return await api.post('/sites', data);
};

export const updateSite = async (siteId, data) => {
  return await api.put(`/sites/${siteId}`, data);
};

export const deleteSite = async (siteId) => {
  return await api.delete(`/sites/${siteId}`);
};

export const triggerScheduler = async (siteId) => {
  return await api.post(`/sites/${siteId}/schedule`);
};
