import apiClient from "./apiClient.js";

// Trusts
export function getTrusts(clientId) {
  return apiClient.get(`/clients/${clientId}/trusts`).then((r) => r.data);
}
export function getTrust(clientId, id) {
  return apiClient.get(`/clients/${clientId}/trusts/${id}`).then((r) => r.data);
}
export function createTrust(clientId, data) {
  return apiClient.post(`/clients/${clientId}/trusts`, data).then((r) => r.data);
}
export function updateTrust(clientId, id, data) {
  return apiClient.put(`/clients/${clientId}/trusts/${id}`, data).then((r) => r.data);
}
export function deleteTrust(clientId, id) {
  return apiClient.delete(`/clients/${clientId}/trusts/${id}`).then((r) => r.data);
}

// Companies
export function getCompanies(clientId) {
  return apiClient.get(`/clients/${clientId}/companies`).then((r) => r.data);
}
export function getCompany(clientId, id) {
  return apiClient.get(`/clients/${clientId}/companies/${id}`).then((r) => r.data);
}
export function createCompany(clientId, data) {
  return apiClient.post(`/clients/${clientId}/companies`, data).then((r) => r.data);
}
export function updateCompany(clientId, id, data) {
  return apiClient.put(`/clients/${clientId}/companies/${id}`, data).then((r) => r.data);
}
export function deleteCompany(clientId, id) {
  return apiClient.delete(`/clients/${clientId}/companies/${id}`).then((r) => r.data);
}

// SMSFs
export function getSmsfs(clientId) {
  return apiClient.get(`/clients/${clientId}/smsfs`).then((r) => r.data);
}
export function getSmsf(clientId, id) {
  return apiClient.get(`/clients/${clientId}/smsfs/${id}`).then((r) => r.data);
}
export function createSmsf(clientId, data) {
  return apiClient.post(`/clients/${clientId}/smsfs`, data).then((r) => r.data);
}
export function updateSmsf(clientId, id, data) {
  return apiClient.put(`/clients/${clientId}/smsfs/${id}`, data).then((r) => r.data);
}
export function deleteSmsf(clientId, id) {
  return apiClient.delete(`/clients/${clientId}/smsfs/${id}`).then((r) => r.data);
}
