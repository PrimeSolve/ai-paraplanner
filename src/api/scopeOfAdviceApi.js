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
// Outbound mapping: frontend scope → API camelCase
// ──────────────────────────────────────────────────────────────

function buildScopePayload(data, clientId) {
  const apiData = {};

  apiData.soaType = data.soa_type || '';
  apiData.superannuation = !!data.superannuation;
  apiData.investments = !!data.investments;
  apiData.insuranceNeeds = !!data.insurance_needs;
  apiData.insuranceProductAdvice = !!data.insurance_product_advice;
  apiData.retirementPlanning = !!data.retirement_planning;
  apiData.estatePlanning = !!data.estate_planning;
  apiData.debtManagement = !!data.debt_management;
  apiData.portfolioReview = !!data.portfolio_review;
  apiData.additionalNotes = data.additional_notes || '';

  if (clientId) {
    apiData.clientId = clientId;
  }

  return apiData;
}

// ──────────────────────────────────────────────────────────────
// Inbound mapping: API camelCase → frontend scope shape
// ──────────────────────────────────────────────────────────────

function mapScopeFromApi(record) {
  if (!record) return null;
  const n = normaliseRecord(record);
  return {
    id: n.id || null,
    soa_type: n.soaType || '',
    superannuation: !!n.superannuation,
    investments: !!n.investments,
    insurance_needs: !!n.insuranceNeeds,
    insurance_product_advice: !!n.insuranceProductAdvice,
    retirement_planning: !!n.retirementPlanning,
    estate_planning: !!n.estatePlanning,
    debt_management: !!n.debtManagement,
    portfolio_review: !!n.portfolioReview,
    additional_notes: n.additionalNotes || '',
  };
}

// ──────────────────────────────────────────────────────────────
// Scope of Advice API
// ──────────────────────────────────────────────────────────────

export const scopeOfAdviceApi = {
  /**
   * GET scope-of-advice record for a client (returns first or null).
   * @param {string} clientId - The client ID (GUID)
   * @returns {Promise<object|null>} Scope record in frontend shape, or null
   */
  async getByClientId(clientId) {
    const response = await axiosInstance.get(`/scope-of-advice?clientId=${clientId}`);
    const raw = response.data;
    const arr = Array.isArray(raw) ? raw : (raw.items || raw.data || raw.value || []);
    if (arr.length === 0) return null;
    return mapScopeFromApi(arr[0]);
  },

  /**
   * Create or update a scope-of-advice record.
   * If existingId is provided, PUT; otherwise POST.
   * @param {string} clientId - The client ID (GUID)
   * @param {object} data - Scope fields (frontend shape)
   * @param {string} [existingId] - Existing record ID for update
   * @returns {Promise<object>} Saved record in frontend shape
   */
  async upsert(clientId, data, existingId) {
    const payload = sanitisePayload(buildScopePayload(data, clientId));
    let response;
    if (existingId) {
      response = await axiosInstance.put(`/scope-of-advice/${existingId}`, payload);
    } else {
      response = await axiosInstance.post('/scope-of-advice', { ...payload, clientId });
    }
    return mapScopeFromApi(normaliseRecord(response.data));
  },

  /**
   * DELETE a scope-of-advice record.
   * @param {string} id - Record ID
   * @returns {Promise<void>}
   */
  async remove(id) {
    await axiosInstance.delete(`/scope-of-advice/${id}`);
  },
};
