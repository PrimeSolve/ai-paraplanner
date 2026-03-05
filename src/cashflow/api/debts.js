import apiClient from "./apiClient.js";

const base = (clientId) => `/clients/${clientId}/debts`;

export function getDebts(clientId) {
  return apiClient.get(base(clientId)).then((r) => r.data);
}

export function getDebt(clientId, id) {
  return apiClient.get(`${base(clientId)}/${id}`).then((r) => r.data);
}

export function createDebt(clientId, data) {
  return apiClient.post(base(clientId), data).then((r) => r.data);
}

export function updateDebt(clientId, id, data) {
  return apiClient.put(`${base(clientId)}/${id}`, data).then((r) => r.data);
}

export function deleteDebt(clientId, id) {
  return apiClient.delete(`${base(clientId)}/${id}`).then((r) => r.data);
}
