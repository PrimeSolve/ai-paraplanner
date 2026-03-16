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
// Build API payload for create/update super fund
// ──────────────────────────────────────────────────────────────

function buildSuperFundPayload(data, clientGuidMap, defaultName) {
  const apiData = {};

  // Top-level fields
  apiData.fundName = data.fund_name || defaultName || 'Super Fund 1';
  apiData.product = data.product || null;
  apiData.balance = data.balance !== '' && data.balance !== null && data.balance !== undefined
    ? parseFloat(data.balance) || 0
    : null;

  // owner → clientId via clientGuidMap
  apiData.clientId = clientGuidMap?.[data.owner] || clientGuidMap?.client1;

  // Flatten contributions nested object
  const contrib = data.contributions || {};
  apiData.superGuarantee = contrib.super_guarantee !== '' ? (parseFloat(contrib.super_guarantee) || null) : null;
  apiData.salarySacrifice = contrib.salary_sacrifice !== '' ? (parseFloat(contrib.salary_sacrifice) || null) : null;
  apiData.afterTax = contrib.after_tax !== '' ? (parseFloat(contrib.after_tax) || null) : null;
  apiData.spouseReceived = contrib.spouse_received !== '' ? (parseFloat(contrib.spouse_received) || null) : null;
  apiData.splitReceived = contrib.split_received !== '' ? (parseFloat(contrib.split_received) || null) : null;
  apiData.concessional = contrib.concessional !== '' ? (parseFloat(contrib.concessional) || null) : null;

  // Flatten tax_components nested object
  const taxComp = data.tax_components || {};
  apiData.unpAmount = taxComp.unp_amount !== '' ? (parseFloat(taxComp.unp_amount) || null) : null;
  apiData.taxComponentTaxable = taxComp.taxable_portion !== '' ? (parseFloat(taxComp.taxable_portion) || null) : null;
  apiData.taxComponentTaxFree = taxComp.tax_free_portion !== '' ? (parseFloat(taxComp.tax_free_portion) || null) : null;

  return apiData;
}

// ──────────────────────────────────────────────────────────────
// Super Funds API
// ──────────────────────────────────────────────────────────────

export const superFundsApi = {
  /**
   * GET all super funds for a client.
   * @param {string} clientId - The client ID (GUID)
   * @returns {Promise<Array>} Super fund records in snake_case
   */
  async getAll(clientId) {
    const response = await axiosInstance.get(`/super-funds?clientId=${clientId}`);
    const raw = response.data;
    const arr = Array.isArray(raw) ? raw : (raw.items || raw.data || raw.value || []);
    return normaliseRecord(camelToSnakeKeys(arr));
  },

  /**
   * POST a new super fund record.
   * @param {object} data - Super fund fields in snake_case (React state)
   * @param {object} clientGuidMap - Map of owner keys to client GUIDs
   * @param {string} [defaultName] - Default fund name if empty
   * @returns {Promise<object>} Created super fund (snake_case)
   */
  async create(data, clientGuidMap, defaultName) {
    const payload = sanitisePayload(buildSuperFundPayload(data, clientGuidMap, defaultName));
    payload.balance = parseFloat(payload.balance) || 0;
    payload.phase = payload.phase ?? 0;
    payload.insuranceInSuper = payload.insuranceInSuper ?? false;
    const response = await axiosInstance.post('/super-funds', {
      ...payload,
      clientId: clientGuidMap?.[data.owner] || clientGuidMap?.client1,
    });
    return normaliseRecord(camelToSnakeKeys(response.data));
  },

  /**
   * PUT an existing super fund record.
   * @param {string} id - The super fund record ID
   * @param {object} data - Super fund fields in snake_case (React state)
   * @param {object} clientGuidMap - Map of owner keys to client GUIDs
   * @returns {Promise<object>} Updated super fund (snake_case)
   */
  async update(id, data, clientGuidMap) {
    const payload = sanitisePayload(buildSuperFundPayload(data, clientGuidMap));
    const response = await axiosInstance.put(`/super-funds/${id}`, payload);
    return normaliseRecord(camelToSnakeKeys(response.data));
  },

  /**
   * DELETE a super fund record.
   * @param {string} id - The super fund record ID
   * @returns {Promise<void>}
   */
  async remove(id) {
    await axiosInstance.delete(`/super-funds/${id}`);
  },
};
