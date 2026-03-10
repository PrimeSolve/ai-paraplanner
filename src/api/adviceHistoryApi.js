import axiosInstance from './axiosInstance';

/**
 * Client-scoped Advice History API.
 * All endpoints are scoped under /clients/{clientId}/advice-history.
 */
export const adviceHistoryApi = {
  /**
   * Create an immutable advice record snapshot.
   * @param {string} clientId
   * @param {object} data
   * @param {string} data.recordType
   * @param {string} data.title
   * @param {string} [data.factFindSnapshot]
   * @param {string} [data.adviceModelSnapshot]
   * @param {string} [data.projectionSnapshot]
   * @returns {Promise<object>} The created record (without snapshots)
   */
  async create(clientId, { recordType, title, factFindSnapshot, adviceModelSnapshot, projectionSnapshot }) {
    const response = await axiosInstance.post(
      `/clients/${clientId}/advice-history`,
      { recordType, title, factFindSnapshot, adviceModelSnapshot, projectionSnapshot }
    );
    return response.data;
  },

  /**
   * List all advice records for a client (ordered by createdAt DESC).
   * Does NOT include snapshots in the response.
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
   * Get a single advice record including the full snapshots.
   * @param {string} clientId
   * @param {string} recordId
   * @returns {Promise<object>} Full record with snapshot fields
   */
  async getById(clientId, recordId) {
    const response = await axiosInstance.get(
      `/clients/${clientId}/advice-history/${recordId}`
    );
    return response.data;
  },
};
