import axiosInstance from './axiosInstance';
import { sanitisePayload } from './apiUtils';

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
// Outbound mapping: frontend objective → API camelCase
// ──────────────────────────────────────────────────────────────

function buildObjectivePayload(data, clientId) {
  const apiData = {};

  apiData.oWho = Array.isArray(data.o_who) ? JSON.stringify(data.o_who) : (data.o_who || '[]');
  apiData.oType = data.o_type || '';
  apiData.oProperty = data.o_property || '';
  apiData.oDebt = data.o_debt || '';
  apiData.oAsset = data.o_asset || '';
  apiData.oStart = data.o_start || '';
  apiData.oEnd = data.o_end || '';
  apiData.oFreq = data.o_freq || '';
  apiData.oAmount = data.o_amount ? parseFloat(data.o_amount) : null;
  apiData.oImportance = data.o_importance || '';
  apiData.oWhy = data.o_why || '';

  if (clientId) {
    apiData.clientId = clientId;
  }

  return apiData;
}

// ──────────────────────────────────────────────────────────────
// Inbound mapping: API camelCase → frontend objective shape
// ──────────────────────────────────────────────────────────────

function mapObjectiveFromApi(record) {
  if (!record) return null;
  const n = normaliseRecord(record);
  return {
    id: n.id || null,
    o_who: JSON.parse(n.oWho || '[]'),
    o_type: n.oType || '',
    o_property: n.oProperty || '',
    o_debt: n.oDebt || '',
    o_asset: n.oAsset || '',
    o_start: n.oStart || '',
    o_end: n.oEnd || '',
    o_freq: n.oFreq || '',
    o_amount: n.oAmount != null ? String(n.oAmount) : '',
    o_importance: n.oImportance || '',
    o_why: n.oWhy || '',
  };
}

// ──────────────────────────────────────────────────────────────
// Advice Objectives API
// ──────────────────────────────────────────────────────────────

export const adviceObjectivesApi = {
  /**
   * GET all objectives for a client.
   * @param {string} clientId - The client ID (GUID)
   * @returns {Promise<Array>} Objective records in frontend shape
   */
  async getAll(clientId) {
    const response = await axiosInstance.get(`/advice-objectives?clientId=${clientId}`);
    const raw = response.data;
    const arr = Array.isArray(raw) ? raw : (raw.items || raw.data || raw.value || []);
    return arr.map(mapObjectiveFromApi);
  },

  /**
   * POST a new objective.
   * @param {string} clientId - The client ID (GUID)
   * @param {object} data - Objective fields (frontend shape)
   * @returns {Promise<object>} Created objective in frontend shape
   */
  async create(clientId, data) {
    const payload = sanitisePayload(buildObjectivePayload(data, clientId));
    const response = await axiosInstance.post('/advice-objectives', { ...payload, clientId });
    return mapObjectiveFromApi(normaliseRecord(response.data));
  },

  /**
   * PUT an existing objective.
   * @param {string} id - The objective record ID
   * @param {object} data - Objective fields (frontend shape)
   * @returns {Promise<object>} Updated objective in frontend shape
   */
  async update(id, data) {
    const payload = sanitisePayload(buildObjectivePayload(data));
    const response = await axiosInstance.put(`/advice-objectives/${id}`, payload);
    return mapObjectiveFromApi(normaliseRecord(response.data));
  },

  /**
   * DELETE an objective.
   * @param {string} id - The objective record ID
   * @returns {Promise<void>}
   */
  async remove(id) {
    await axiosInstance.delete(`/advice-objectives/${id}`);
  },
};
