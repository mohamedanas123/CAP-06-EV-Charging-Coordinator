import api from './axios';

export const getUserVehicles = async (userId) => {
  return await api.get(`/vehicles/user/${userId}`);
};

export const getVehicleById = async (vehicleId) => {
  return await api.get(`/vehicles/${vehicleId}`);
};

export const addVehicle = async (userId, data) => {
  return await api.post(`/vehicles/user/${userId}`, data);
};

export const updateVehicle = async (vehicleId, data) => {
  return await api.put(`/vehicles/${vehicleId}`, data);
};

export const deleteVehicle = async (vehicleId) => {
  return await api.delete(`/vehicles/${vehicleId}`);
};
