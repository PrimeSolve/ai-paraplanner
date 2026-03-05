import apiClient from "./apiClient.js";

const base = (clientId) => `/clients/${clientId}/expenses`;

export function getExpenses(clientId) {
  return apiClient.get(base(clientId)).then((r) => r.data);
}

export function getExpense(clientId, id) {
  return apiClient.get(`${base(clientId)}/${id}`).then((r) => r.data);
}

export function createExpense(clientId, data) {
  return apiClient.post(base(clientId), data).then((r) => r.data);
}

export function updateExpense(clientId, id, data) {
  return apiClient.put(`${base(clientId)}/${id}`, data).then((r) => r.data);
}

export function deleteExpense(clientId, id) {
  return apiClient.delete(`${base(clientId)}/${id}`).then((r) => r.data);
}
