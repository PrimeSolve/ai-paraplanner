import axiosInstance from './axiosInstance';

// ──────────────────────────────────────────────────────────────
// Normalise _id → id
// ──────────────────────────────────────────────────────────────

function normaliseRecord(record) {
  if (!record) return record;
  if (Array.isArray(record)) return record.map(normaliseRecord);
  if (record._id && !record.id) {
    const { _id, ...rest } = record;
    return { id: _id, ...rest };
  }
  return record;
}

// ──────────────────────────────────────────────────────────────
// Inbound mapping: API → frontend shape
// ──────────────────────────────────────────────────────────────

function mapFromApi(dto) {
  if (!dto) return null;
  const n = normaliseRecord(dto);
  return {
    id: n.id || null,
    reasons: JSON.parse(n.reasons || '[]'),
  };
}

// ──────────────────────────────────────────────────────────────
// Advice Reasons API
// ──────────────────────────────────────────────────────────────

export const adviceReasonsApi = {
  /**
   * GET advice reasons for a client (returns first record or null).
   * @param {string} clientId - The client ID (GUID)
   * @returns {Promise<object|null>} Record with { id, reasons: [] }, or null
   */
  async getByClientId(clientId) {
    const response = await axiosInstance.get(`/advice-reasons?clientId=${clientId}`);
    const raw = response.data;
    const arr = Array.isArray(raw) ? raw : (raw.items || raw.data || raw.value || []);
    if (arr.length === 0) return null;
    return mapFromApi(arr[0]);
  },

  /**
   * Create or update an advice reasons record.
   * If existingId is provided, PUT /advice-reasons/{id}; otherwise POST.
   * @param {string} clientId - The client ID (GUID)
   * @param {Array} reasonsArray - Array of reason strings
   * @param {string} [existingId] - Existing record ID for update
   * @returns {Promise<object>} Saved record in frontend shape
   */
  async upsert(clientId, reasonsArray, existingId) {
    const payload = {
      clientId,
      reasons: JSON.stringify(reasonsArray),
    };
    let response;
    if (existingId) {
      response = await axiosInstance.put(`/advice-reasons/${existingId}`, payload);
    } else {
      response = await axiosInstance.post('/advice-reasons', payload);
    }
    return mapFromApi(normaliseRecord(response.data));
  },
};
