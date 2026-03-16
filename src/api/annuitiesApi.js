import axiosInstance from './axiosInstance';
import { sanitisePayload } from './apiUtils';

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
// Build API payload for create/update annuity
// ──────────────────────────────────────────────────────────────

function buildAnnuityPayload(data, clientGuidMap, defaultName) {
  const apiData = {};

  // owner → ownerClientId (null if joint_holding)
  if (data.joint_holding) {
    apiData.ownerClientId = null;
  } else {
    apiData.ownerClientId = clientGuidMap?.[data.owner] || clientGuidMap?.client1;
  }

  // Top-level fields
  apiData.jointHolding = !!data.joint_holding;
  apiData.product = data.product;
  apiData.annuityType = data.annuity_type;
  apiData.taxEnvironment = data.tax_environment;
  apiData.purchasePrice = data.purchase_price === '' ? null : (data.purchase_price ? parseFloat(data.purchase_price) : null);
  apiData.commencementDate = data.commencement_date === '' ? null : (data.commencement_date || null);
  apiData.maturityDate = data.maturity_date === '' ? null : (data.maturity_date || null);
  apiData.guaranteedPeriod = data.guaranteed_period === '' ? null : (data.guaranteed_period ? parseFloat(data.guaranteed_period) : null);
  apiData.residualCapitalValue = data.residual_capital_value === '' ? null : (data.residual_capital_value ? parseFloat(data.residual_capital_value) : null);

  // Flatten income nested object
  const income = data.income || {};
  apiData.annualIncome = income.annual_income ? parseFloat(income.annual_income) : null;
  apiData.incomeFrequency = income.frequency || null;
  apiData.taxFreePct = income.tax_free_pct ? parseFloat(income.tax_free_pct) : null;
  apiData.taxablePct = income.taxable_pct ? parseFloat(income.taxable_pct) : null;
  apiData.deductibleAmount = income.deductible_amount ? parseFloat(income.deductible_amount) : null;

  // Flatten tax_components nested object
  const taxComp = data.tax_components || {};
  apiData.taxComponentTaxable = taxComp.taxable_portion ? parseFloat(taxComp.taxable_portion) : null;
  apiData.taxComponentTaxFree = taxComp.tax_free_portion ? parseFloat(taxComp.tax_free_portion) : null;

  return apiData;
}

// ──────────────────────────────────────────────────────────────
// Annuities API
// ──────────────────────────────────────────────────────────────

export const annuitiesApi = {
  /**
   * GET all annuities for a client.
   * @param {string} clientId - The client ID (GUID)
   * @returns {Promise<Array>} Annuity records in snake_case
   */
  async getAll(clientId) {
    const response = await axiosInstance.get(`/annuities?clientId=${clientId}`);
    const raw = response.data;
    const arr = Array.isArray(raw) ? raw : (raw.items || raw.data || raw.value || []);
    return normaliseRecord(camelToSnakeKeys(arr));
  },

  /**
   * POST a new annuity record.
   * @param {object} data - Annuity fields in snake_case (React state)
   * @param {object} clientGuidMap - Map of owner keys to client GUIDs
   * @param {string} [defaultName] - Default name if empty
   * @returns {Promise<object>} Created annuity (snake_case)
   */
  async create(data, clientGuidMap, defaultName) {
    const apiData = buildAnnuityPayload(data, clientGuidMap, defaultName);
    // Annuities require ownerClientId on create — use clientGuidMap.client1 as default
    if (!apiData.ownerClientId) {
      apiData.ownerClientId = clientGuidMap?.client1 || null;
    }
    const payload = sanitisePayload(apiData);
    payload.purchasePrice = parseFloat(payload.purchasePrice) || 0;
    const response = await axiosInstance.post('/annuities', payload);
    return normaliseRecord(camelToSnakeKeys(response.data));
  },

  /**
   * PUT an existing annuity record.
   * @param {string} id - The annuity record ID
   * @param {object} data - Annuity fields in snake_case (React state)
   * @param {object} clientGuidMap - Map of owner keys to client GUIDs
   * @returns {Promise<object>} Updated annuity (snake_case)
   */
  async update(id, data, clientGuidMap) {
    const payload = sanitisePayload(buildAnnuityPayload(data, clientGuidMap));
    payload.purchasePrice = parseFloat(payload.purchasePrice) || 0;
    const response = await axiosInstance.put(`/annuities/${id}`, payload);
    return normaliseRecord(camelToSnakeKeys(response.data));
  },

  /**
   * DELETE an annuity record.
   * @param {string} id - The annuity record ID
   * @returns {Promise<void>}
   */
  async remove(id) {
    await axiosInstance.delete(`/annuities/${id}`);
  },

  // ── Beneficiaries sub-resource ─────────────────────────────

  async addBeneficiary(annuityId, data) {
    const apiData = snakeToCamelKeys(data);
    const response = await axiosInstance.post(`/annuities/${annuityId}/beneficiaries`, apiData);
    return normaliseRecord(camelToSnakeKeys(response.data));
  },

  async removeBeneficiary(annuityId, beneficiaryId) {
    await axiosInstance.delete(`/annuities/${annuityId}/beneficiaries/${beneficiaryId}`);
  },
};
