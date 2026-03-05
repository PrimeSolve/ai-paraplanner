import apiClient from "./apiClient.js";

export function getClients(params) {
  return apiClient.get("/clients", { params }).then((r) => r.data);
}

export function getClient(id) {
  return apiClient.get(`/clients/${id}`).then((r) => r.data);
}

export function getClientFullProfile(id) {
  return apiClient.get(`/clients/${id}/full-profile`).then((r) => r.data);
}

export function createClient(data) {
  return apiClient.post("/clients", data).then((r) => r.data);
}

export function updateClient(id, data) {
  return apiClient.put(`/clients/${id}`, data).then((r) => r.data);
}

export function getClientByEmail(email) {
  return apiClient.get("/clients", { params: { email } }).then((r) => r.data);
}
