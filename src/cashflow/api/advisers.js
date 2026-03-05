import apiClient from "./apiClient.js";

export function getAdvisers(params) {
  return apiClient.get("/advisers", { params }).then((r) => r.data);
}

export function getAdviser(id) {
  return apiClient.get(`/advisers/${id}`).then((r) => r.data);
}
