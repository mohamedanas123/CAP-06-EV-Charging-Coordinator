import api from './axios';

export const getAllChargers = async () => {
  return await api.get('/chargers');
};

export const getChargersBySite = async (siteId) => {
  return await api.get(`/chargers/site/${siteId}`);
};

export const getChargerById = async (chargerId) => {
  return await api.get(`/chargers/${chargerId}`);
};

export const addCharger = async (siteId, data) => {
  return await api.post(`/chargers/site/${siteId}`, data);
};

export const updateCharger = async (chargerId, data) => {
  return await api.put(`/chargers/${chargerId}`, data);
};

export const updateChargerStatus = async (chargerId, status) => {
  return await api.patch(`/chargers/${chargerId}/status`, { status });
};

export const deleteCharger = async (chargerId) => {
  return await api.delete(`/chargers/${chargerId}`);
};
