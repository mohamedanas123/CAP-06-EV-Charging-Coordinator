import api from './axios';

export const createRequest = async (data) => {
  return await api.post('/requests', data);
};

export const getAllRequests = async () => {
  return await api.get('/requests');
};

export const getRequestsBySite = async (siteId) => {
  return await api.get(`/requests/site/${siteId}`);
};

export const getRequestsByUser = async (userId) => {
  return await api.get(`/requests/user/${userId}`);
};

export const cancelRequest = async (requestId) => {
  return await api.patch(`/requests/${requestId}/cancel`);
};
