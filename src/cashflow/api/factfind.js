import apiClient from "./apiClient.js";

const base = "/factfind";

export function startSession(clientId, data) {
  return apiClient
    .post(`${base}/sessions`, { clientId, ...data })
    .then((r) => r.data);
}

export function submitData(sessionId, data) {
  return apiClient
    .put(`${base}/sessions/${sessionId}`, data)
    .then((r) => r.data);
}

export function completeSession(sessionId) {
  return apiClient
    .post(`${base}/sessions/${sessionId}/complete`)
    .then((r) => r.data);
}
