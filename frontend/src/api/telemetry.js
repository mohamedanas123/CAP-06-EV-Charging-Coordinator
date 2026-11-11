import api from './axios';

export const receiveTelemetry = async (data) => {
  return await api.post('/telemetry', data);
};

export const getSessionTelemetry = async (sessionId) => {
  return await api.get(`/telemetry/session/${sessionId}`);
};

export const getLatestTelemetry = async (chargerId) => {
  return await api.get(`/telemetry/charger/${chargerId}/latest`);
};
