import apiClient from "./apiClient.js";

const base = (clientId) => `/clients/${clientId}/insurance`;

export function getInsurancePolicies(clientId) {
  return apiClient.get(base(clientId)).then((r) => r.data);
}

export function getInsurancePolicy(clientId, id) {
  return apiClient.get(`${base(clientId)}/${id}`).then((r) => r.data);
}

export function createInsurancePolicy(clientId, data) {
  return apiClient.post(base(clientId), data).then((r) => r.data);
}

export function updateInsurancePolicy(clientId, id, data) {
  return apiClient.put(`${base(clientId)}/${id}`, data).then((r) => r.data);
}

export function deleteInsurancePolicy(clientId, id) {
  return apiClient.delete(`${base(clientId)}/${id}`).then((r) => r.data);
}
