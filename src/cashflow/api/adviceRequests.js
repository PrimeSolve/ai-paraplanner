import apiClient from "./apiClient.js";

const base = "/advice-requests";

export function createAdviceRequest(data) {
  return apiClient.post(base, data).then((r) => r.data);
}

export function getAdviceRequest(id) {
  return apiClient.get(`${base}/${id}`).then((r) => r.data);
}

export function getAdviceRequests(params) {
  return apiClient.get(base, { params }).then((r) => r.data);
}

export function addStrategy(adviceRequestId, data) {
  return apiClient
    .post(`${base}/${adviceRequestId}/strategies`, data)
    .then((r) => r.data);
}

export function updateStrategy(adviceRequestId, strategyId, data) {
  return apiClient
    .put(`${base}/${adviceRequestId}/strategies/${strategyId}`, data)
    .then((r) => r.data);
}

export function deleteStrategy(adviceRequestId, strategyId) {
  return apiClient
    .delete(`${base}/${adviceRequestId}/strategies/${strategyId}`)
    .then((r) => r.data);
}

export function saveProjection(adviceRequestId, data) {
  return apiClient
    .post(`${base}/${adviceRequestId}/projections`, data)
    .then((r) => r.data);
}

export function getProjections(adviceRequestId) {
  return apiClient
    .get(`${base}/${adviceRequestId}/projections`)
    .then((r) => r.data);
}
