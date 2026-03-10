import axiosInstance from './axiosInstance';

/**
 * Client-scoped Advice History API.
 * All endpoints are scoped under /clients/{clientId}/advice-history.
 */
export const adviceHistoryApi = {
  /**
   * Create an immutable advice record snapshot.
   * @param {string} clientId
   * @param {{ type: string, name: string, snapshotJson: string }} data
   * @returns {Promise<object>} The created record (without snapshotJson)
   */
  async create(clientId, { type, name, snapshotJson }) {
    const response = await axiosInstance.post(
      `/clients/${clientId}/advice-history`,
      { type, name, snapshotJson }
    );
    return response.data;
  },

  /**
   * List all advice records for a client (ordered by createdAt DESC).
   * Does NOT include snapshotJson in the response.
   * @param {string} clientId
   * @returns {Promise<Array>} List of records
   */
  async list(clientId) {
    const response = await axiosInstance.get(
      `/clients/${clientId}/advice-history`
    );
    return Array.isArray(response.data) ? response.data : [];
  },

  /**
   * Get a single advice record including the full snapshotJson.
   * @param {string} clientId
   * @param {string} recordId
   * @returns {Promise<object>} Full record with snapshotJson
   */
  async getById(clientId, recordId) {
    const response = await axiosInstance.get(
      `/clients/${clientId}/advice-history/${recordId}`
    );
    return response.data;
  },
};
