import apiClient from "./apiClient.js";

const base = (clientId) => `/clients/${clientId}/income`;

export function getIncomeRecords(clientId) {
  return apiClient.get(base(clientId)).then((r) => r.data);
}

export function getIncomeRecord(clientId, id) {
  return apiClient.get(`${base(clientId)}/${id}`).then((r) => r.data);
}

export function createIncomeRecord(clientId, data) {
  return apiClient.post(base(clientId), data).then((r) => r.data);
}

export function updateIncomeRecord(clientId, id, data) {
  return apiClient.put(`${base(clientId)}/${id}`, data).then((r) => r.data);
}

export function deleteIncomeRecord(clientId, id) {
  return apiClient.delete(`${base(clientId)}/${id}`).then((r) => r.data);
}
