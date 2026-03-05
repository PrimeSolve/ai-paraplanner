import apiClient from "./apiClient.js";

const base = (clientId) => `/clients/${clientId}/investments`;

export function getInvestments(clientId) {
  return apiClient.get(base(clientId)).then((r) => r.data);
}

export function getInvestment(clientId, id) {
  return apiClient.get(`${base(clientId)}/${id}`).then((r) => r.data);
}

export function createInvestment(clientId, data) {
  return apiClient.post(base(clientId), data).then((r) => r.data);
}

export function updateInvestment(clientId, id, data) {
  return apiClient.put(`${base(clientId)}/${id}`, data).then((r) => r.data);
}

export function deleteInvestment(clientId, id) {
  return apiClient.delete(`${base(clientId)}/${id}`).then((r) => r.data);
}
