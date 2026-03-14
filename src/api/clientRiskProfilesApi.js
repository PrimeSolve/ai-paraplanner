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
// Outbound mapping: frontend risk_profile[person] → API camelCase
// ──────────────────────────────────────────────────────────────

function buildRiskProfilePayload(data, clientId, owner) {
  const apiData = {};

  apiData.owner = owner || data.owner || '';
  apiData.mode = data.mode || '';
  apiData.answersJson = data.answers ? JSON.stringify(data.answers) : null;
  apiData.score = data.score != null ? parseInt(data.score, 10) : null;
  apiData.profile = data.profile || '';
  apiData.specifiedProfile = data.specifiedProfile || '';
  apiData.adviserComments = data.adviserComments || '';
  apiData.clientComments = data.clientComments || '';
  apiData.adjustRisk = data.adjustRisk || '';
  apiData.adjustedProfile = data.adjustedProfile || '';
  apiData.adjustmentReason = data.adjustmentReason || '';

  if (clientId) {
    apiData.clientId = clientId;
  }

  return apiData;
}

// ──────────────────────────────────────────────────────────────
// Inbound mapping: API camelCase → frontend risk_profile[person] shape
// ──────────────────────────────────────────────────────────────

function mapRiskProfileFromApi(record) {
  if (!record) return null;
  const n = normaliseRecord(record);
  let answers = {};
  if (n.answersJson) {
    try { answers = JSON.parse(n.answersJson); } catch (_) { answers = {}; }
  }
  return {
    id: n.id || null,
    owner: n.owner || '',
    mode: n.mode || '',
    answers,
    score: n.score != null ? n.score : 0,
    profile: n.profile || '',
    specifiedProfile: n.specifiedProfile || '',
    adviserComments: n.adviserComments || '',
    clientComments: n.clientComments || '',
    adjustRisk: n.adjustRisk || '',
    adjustedProfile: n.adjustedProfile || '',
    adjustmentReason: n.adjustmentReason || '',
  };
}

// ──────────────────────────────────────────────────────────────
// Client Risk Profiles API
// ──────────────────────────────────────────────────────────────

export const clientRiskProfilesApi = {
  /**
   * GET all risk-profile records for a client.
   * @param {string} clientId - The client ID (GUID)
   * @returns {Promise<Array>} Risk profile records in frontend shape
   */
  async getAll(clientId) {
    const response = await axiosInstance.get(`/client-risk-profiles?clientId=${clientId}`);
    const raw = response.data;
    const arr = Array.isArray(raw) ? raw : (raw.items || raw.data || raw.value || []);
    return arr.map(mapRiskProfileFromApi);
  },

  /**
   * Create or update a risk-profile record.
   * If existingId is provided, PUT; otherwise POST.
   * @param {string} clientId - The client ID (GUID)
   * @param {string} owner - Owner key (e.g. "client1", "client2")
   * @param {object} data - Risk profile fields (frontend shape)
   * @param {string} [existingId] - Existing record ID for update
   * @returns {Promise<object>} Saved record in frontend shape
   */
  async upsert(clientId, owner, data, existingId) {
    const payload = sanitisePayload(buildRiskProfilePayload(data, clientId, owner));
    let response;
    if (existingId) {
      response = await axiosInstance.put(`/client-risk-profiles/${existingId}`, payload);
    } else {
      response = await axiosInstance.post('/client-risk-profiles', { ...payload, clientId });
    }
    return mapRiskProfileFromApi(normaliseRecord(response.data));
  },

  /**
   * DELETE a risk-profile record.
   * @param {string} id - Record ID
   * @returns {Promise<void>}
   */
  async remove(id) {
    await axiosInstance.delete(`/client-risk-profiles/${id}`);
  },
};
