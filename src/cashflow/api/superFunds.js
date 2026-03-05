import apiClient from "./apiClient.js";

const base = (clientId) => `/clients/${clientId}/superfunds`;

export function getSuperFunds(clientId) {
  return apiClient.get(base(clientId)).then((r) => r.data);
}

export function getSuperFund(clientId, id) {
  return apiClient.get(`${base(clientId)}/${id}`).then((r) => r.data);
}

export function createSuperFund(clientId, data) {
  return apiClient.post(base(clientId), data).then((r) => r.data);
}

export function updateSuperFund(clientId, id, data) {
  return apiClient.put(`${base(clientId)}/${id}`, data).then((r) => r.data);
}

export function deleteSuperFund(clientId, id) {
  return apiClient.delete(`${base(clientId)}/${id}`).then((r) => r.data);
}
