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
// Build API payload for create/update pension
// ──────────────────────────────────────────────────────────────

function buildPensionPayload(data, clientGuidMap, defaultName) {
  // Start with explicit field mapping (snake_case frontend → camelCase API)
  const apiData = {};

  // Top-level fields
  apiData.fundName = data.fund_name || defaultName || 'Pension 1';
  apiData.product = data.product;
  apiData.pensionType = data.pension_type;
  apiData.balance = parseFloat(data.balance) || 0;
  apiData.commencementDate = data.commencement_date === '' ? null : (data.commencement_date || null);
  apiData.purchasePrice = data.purchase_price === '' ? null : (data.purchase_price ? parseFloat(data.purchase_price) : null);

  // owner → clientId via clientGuidMap
  apiData.clientId = clientGuidMap?.[data.owner] || clientGuidMap?.client1;

  // reversionary_nominee → reversionaryNomineeClientId via clientGuidMap
  if (data.reversionary_nominee && data.reversionary_nominee !== '') {
    apiData.reversionaryNomineeClientId = clientGuidMap?.[data.reversionary_nominee] || null;
  } else {
    apiData.reversionaryNomineeClientId = null;
  }

  // Flatten income nested object
  const income = data.income || {};
  apiData.annualIncome = income.annual_income ? parseFloat(income.annual_income) : null;
  apiData.incomeFrequency = income.frequency || null;
  apiData.minimumIncome = income.minimum ? parseFloat(income.minimum) : null;
  apiData.maximumIncome = income.maximum ? parseFloat(income.maximum) : null;
  apiData.taxFreePct = income.tax_free_pct ? parseFloat(income.tax_free_pct) : null;
  apiData.taxablePct = income.taxable_pct ? parseFloat(income.taxable_pct) : null;

  // Flatten tax_components nested object
  const taxComp = data.tax_components || {};
  apiData.taxComponentTaxable = taxComp.taxable_portion ? parseFloat(taxComp.taxable_portion) : null;
  apiData.taxComponentTaxFree = taxComp.tax_free_portion ? parseFloat(taxComp.tax_free_portion) : null;

  return apiData;
}

// ──────────────────────────────────────────────────────────────
// Pensions API
// ──────────────────────────────────────────────────────────────

export const pensionsApi = {
  /**
   * GET all pensions for a client.
   * @param {string} clientId - The client ID (GUID)
   * @returns {Promise<Array>} Pension records in snake_case
   */
  async getAll(clientId) {
    const response = await axiosInstance.get(`/pensions?clientId=${clientId}`);
    const raw = response.data;
    const arr = Array.isArray(raw) ? raw : (raw.items || raw.data || raw.value || []);
    return normaliseRecord(camelToSnakeKeys(arr));
  },

  /**
   * POST a new pension record.
   * @param {object} data - Pension fields in snake_case (React state)
   * @param {object} clientGuidMap - Map of owner keys to client GUIDs
   * @param {string} [defaultName] - Default fund name if empty
   * @returns {Promise<object>} Created pension (snake_case)
   */
  async create(data, clientGuidMap, defaultName) {
    const apiData = buildPensionPayload(data, clientGuidMap, defaultName);
    const response = await axiosInstance.post('/pensions', apiData);
    return normaliseRecord(camelToSnakeKeys(response.data));
  },

  /**
   * PUT an existing pension record.
   * @param {string} id - The pension record ID
   * @param {object} data - Pension fields in snake_case (React state)
   * @param {object} clientGuidMap - Map of owner keys to client GUIDs
   * @returns {Promise<object>} Updated pension (snake_case)
   */
  async update(id, data, clientGuidMap) {
    const apiData = buildPensionPayload(data, clientGuidMap);
    const response = await axiosInstance.put(`/pensions/${id}`, apiData);
    return normaliseRecord(camelToSnakeKeys(response.data));
  },

  /**
   * DELETE a pension record.
   * @param {string} id - The pension record ID
   * @returns {Promise<void>}
   */
  async remove(id) {
    await axiosInstance.delete(`/pensions/${id}`);
  },

  // ── Beneficiaries sub-resource ─────────────────────────────

  async addBeneficiary(pensionId, data) {
    const apiData = snakeToCamelKeys(data);
    const response = await axiosInstance.post(`/pensions/${pensionId}/beneficiaries`, apiData);
    return normaliseRecord(camelToSnakeKeys(response.data));
  },

  async removeBeneficiary(pensionId, beneficiaryId) {
    await axiosInstance.delete(`/pensions/${pensionId}/beneficiaries/${beneficiaryId}`);
  },

  // ── Portfolio sub-resource ─────────────────────────────────

  async addPortfolioItem(pensionId, data) {
    const apiData = snakeToCamelKeys(data);
    const response = await axiosInstance.post(`/pensions/${pensionId}/portfolio`, apiData);
    return normaliseRecord(camelToSnakeKeys(response.data));
  },

  async removePortfolioItem(pensionId, itemId) {
    await axiosInstance.delete(`/pensions/${pensionId}/portfolio/${itemId}`);
  },
};
