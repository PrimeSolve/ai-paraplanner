import axiosInstance from './axiosInstance';

// ──────────────────────────────────────────────────────────────
// Case conversion utilities
// ──────────────────────────────────────────────────────────────

function camelToSnake(str) {
  const s = str.charAt(0).toLowerCase() + str.slice(1);
  return s.replace(/([A-Z])/g, '_$1').toLowerCase();
}

function snakeToCamel(str) {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function camelToSnakeKeys(obj) {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(camelToSnakeKeys);
  if (typeof obj !== 'object') return obj;
  if (obj instanceof Date) return obj;
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    result[camelToSnake(key)] = camelToSnakeKeys(value);
  }
  return result;
}

function snakeToCamelKeys(obj) {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(snakeToCamelKeys);
  if (typeof obj !== 'object') return obj;
  if (obj instanceof Date) return obj;
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    result[snakeToCamel(key)] = snakeToCamelKeys(value);
  }
  return result;
}

// ──────────────────────────────────────────────────────────────
// Client Settings API
// ──────────────────────────────────────────────────────────────

export const clientSettingsApi = {
  /**
   * GET client settings.
   * @param {string} clientId - The client ID (GUID)
   * @returns {Promise<object>} Settings in snake_case
   */
  async getClientSettings(clientId) {
    const response = await axiosInstance.get(`/clients/${clientId}/settings`);
    return camelToSnakeKeys(response.data);
  },

  /**
   * PUT updated client settings.
   * @param {string} clientId - The client ID (GUID)
   * @param {object} data - { full_name, phone_number } in snake_case
   * @returns {Promise<object>} Updated settings (snake_case)
   */
  async updateClientSettings(clientId, data) {
    const apiData = snakeToCamelKeys(data);
    const response = await axiosInstance.put(`/clients/${clientId}/settings`, apiData);
    return camelToSnakeKeys(response.data);
  },

  /**
   * POST profile photo as multipart/form-data.
   * @param {string} clientId - The client ID (GUID)
   * @param {File} file - The image file to upload
   * @returns {Promise<object>} Response with profile_photo_url (snake_case)
   */
  async uploadProfilePhoto(clientId, file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axiosInstance.post(
      `/clients/${clientId}/photo`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return camelToSnakeKeys(response.data);
  },
};
