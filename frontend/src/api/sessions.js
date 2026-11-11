import api from './axios';

export const getActiveSessions = async () => {
  return await api.get('/sessions/active');
};

export const getSessionById = async (sessionId) => {
  return await api.get(`/sessions/${sessionId}`);
};

export const startSession = async (sessionId) => {
  return await api.post(`/sessions/${sessionId}/start`);
};

export const completeSession = async (sessionId) => {
  return await api.post(`/sessions/${sessionId}/complete`);
};

export const interruptSession = async (sessionId, reason) => {
  return await api.post(`/sessions/${sessionId}/interrupt`, { reason });
};
