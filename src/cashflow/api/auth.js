import apiClient from "./apiClient.js";

export function getMe() {
  return apiClient.get("/auth/me").then((r) => r.data);
}
