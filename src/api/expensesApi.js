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
// Expense frequency mapping: frontend string → API integer
// ──────────────────────────────────────────────────────────────

function mapFreqToApi(frontendFreq) {
  const map = { '1': 0, '2': 1, '3': 2, '4': 3, '5': 4 };
  return map[frontendFreq] ?? null;
}

function mapFreqFromApi(apiFreq) {
  const map = { 0: '1', 1: '2', 2: '3', 3: '4', 4: '5' };
  return map[apiFreq] ?? '';
}

// ──────────────────────────────────────────────────────────────
// Outbound mapping: frontend expense → API payload
// ──────────────────────────────────────────────────────────────

function buildExpensePayload(data, clientId) {
  const apiData = {};

  apiData.eDisc = String(data.e_disc || '0');
  apiData.eSave = data.e_save ? parseFloat(data.e_save) : null;
  apiData.eFreq = mapFreqToApi(data.e_freq);
  apiData.eBudget = data.rental_cost ? String(data.rental_cost) : null;
  // rental_freq is frontend-only — not sent to the API

  if (clientId) {
    apiData.clientId = clientId;
  }

  return apiData;
}

// ──────────────────────────────────────────────────────────────
// Inbound mapping: API expense → frontend shape
// ──────────────────────────────────────────────────────────────

function mapExpenseFromApi(record) {
  if (!record) return null;
  const normalised = normaliseRecord(record);
  return {
    id: normalised.id || null,
    e_disc: normalised.eDisc != null ? String(normalised.eDisc) : '',
    e_save: normalised.eSave != null ? String(normalised.eSave) : '',
    e_freq: mapFreqFromApi(normalised.eFreq),
    rental_cost: normalised.eBudget != null ? String(normalised.eBudget) : '',
    rental_freq: '',  // frontend-only; not persisted via API
  };
}

// ──────────────────────────────────────────────────────────────
// Outbound mapping: frontend adjustment → API payload
// ──────────────────────────────────────────────────────────────

function buildAdjustmentPayload(adj) {
  return {
    adjType: adj.e_adj_type || '',
    adjAmount: adj.e_adj_amount ? parseFloat(adj.e_adj_amount) : null,
    adjStart: adj.e_adj_start ? parseInt(adj.e_adj_start, 10) : null,
    adjEnd: adj.e_adj_end ? parseInt(adj.e_adj_end, 10) : null,
    adjNotes: adj.e_adj_notes || '',
  };
}

// ──────────────────────────────────────────────────────────────
// Inbound mapping: API adjustment → frontend shape
// ──────────────────────────────────────────────────────────────

function mapAdjustmentFromApi(record) {
  if (!record) return null;
  const normalised = normaliseRecord(record);
  return {
    id: normalised.id || null,
    e_adj_type: normalised.adjType || '',
    e_adj_amount: normalised.adjAmount != null ? String(normalised.adjAmount) : '',
    e_adj_start: normalised.adjStart != null ? String(normalised.adjStart) : '',
    e_adj_end: normalised.adjEnd != null ? String(normalised.adjEnd) : '',
    e_adj_notes: normalised.adjNotes || '',
  };
}

// ──────────────────────────────────────────────────────────────
// Expenses API
// ──────────────────────────────────────────────────────────────

export const expensesApi = {
  /**
   * GET expense record for a client (returns first record or null).
   * @param {string} clientId - The client ID (GUID)
   * @returns {Promise<object|null>} Expense record in frontend shape, or null
   */
  async getByClientId(clientId) {
    const response = await axiosInstance.get(`/expenses?clientId=${clientId}`);
    const raw = response.data;
    const arr = Array.isArray(raw) ? raw : (raw.items || raw.data || raw.value || []);
    if (arr.length === 0) return null;
    const record = arr[0];
    const mapped = mapExpenseFromApi(record);
    // Map adjustments if present
    const rawAdjs = record.adjustments || [];
    mapped.adjustments = rawAdjs.map(mapAdjustmentFromApi);
    return mapped;
  },

  /**
   * Create or update an expense record.
   * If data.id exists, PUT /expenses/{id}; otherwise POST /expenses with clientId.
   * @param {string} clientId - The client ID (GUID)
   * @param {object} data - Expense fields (frontend shape)
   * @returns {Promise<object>} Saved expense record in frontend shape
   */
  async upsert(clientId, data) {
    const payload = sanitisePayload(buildExpensePayload(data, clientId));
    payload.eDisc = String(payload.eDisc || '0');
    payload.clientId = clientId;
    let response;
    if (data.id) {
      response = await axiosInstance.put(`/expenses/${data.id}`, payload);
    } else {
      response = await axiosInstance.post('/expenses', payload);
    }
    return mapExpenseFromApi(normaliseRecord(response.data));
  },

  /**
   * POST a new adjustment to an expense record.
   * @param {string} expenseId - The expense record ID
   * @param {object} adj - Adjustment fields (frontend shape)
   * @returns {Promise<object>} Created adjustment in frontend shape
   */
  async addAdjustment(expenseId, adj) {
    const payload = buildAdjustmentPayload(adj);
    const response = await axiosInstance.post(`/expenses/${expenseId}/adjustments`, payload);
    return mapAdjustmentFromApi(normaliseRecord(response.data));
  },

  /**
   * PUT an existing adjustment on an expense record.
   * @param {string} expenseId - The expense record ID
   * @param {string} adjId - The adjustment ID
   * @param {object} adj - Adjustment fields (frontend shape)
   * @returns {Promise<object>} Updated adjustment in frontend shape
   */
  async updateAdjustment(expenseId, adjId, adj) {
    const payload = buildAdjustmentPayload(adj);
    const response = await axiosInstance.put(`/expenses/${expenseId}/adjustments/${adjId}`, payload);
    return mapAdjustmentFromApi(normaliseRecord(response.data));
  },

  /**
   * DELETE an adjustment from an expense record.
   * @param {string} expenseId - The expense record ID
   * @param {string} adjId - The adjustment ID
   * @returns {Promise<void>}
   */
  async removeAdjustment(expenseId, adjId) {
    await axiosInstance.delete(`/expenses/${expenseId}/adjustments/${adjId}`);
  },
};
