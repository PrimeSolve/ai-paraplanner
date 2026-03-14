import axiosInstance from './axiosInstance';
import { sanitisePayload } from './apiUtils';

// ──────────────────────────────────────────────────────────────
// Case conversion utilities
// ──────────────────────────────────────────────────────────────

function camelToSnake(str) {
  const s = str.charAt(0).toLowerCase() + str.slice(1);
  return s.replace(/([A-Z])/g, '_$1').toLowerCase();
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
// Build API payload for create/update asset
// Frontend fields (a_*) → API camelCase
// ──────────────────────────────────────────────────────────────

function buildAssetPayload(data, clientGuidMap, defaultName) {
  const apiData = {};

  apiData.name = data.a_name || defaultName || 'Asset 1';
  apiData.ownType = data.a_ownType || '';
  apiData.owner = data.a_owner || '';
  apiData.assetType = data.a_type || '';
  apiData.value = data.a_value === '' ? null : (data.a_value ? parseFloat(data.a_value) : null);
  apiData.purchasePrice = data.a_purchase_price === '' ? null : (data.a_purchase_price ? parseFloat(data.a_purchase_price) : null);
  apiData.purchaseDate = data.a_purchase_date === '' ? null : (data.a_purchase_date || null);
  apiData.moveOutDate = data.a_move_out_date === '' ? null : (data.a_move_out_date || null);
  apiData.rentalIncome = data.a_rental_income === '' ? null : (data.a_rental_income ? parseFloat(data.a_rental_income) : null);
  apiData.rentalFrequency = data.a_rental_freq || '';
  apiData.drp = data.a_drp || '';
  apiData.hhRented = data.a_hh_rented || '';
  apiData.hhDaysAvailable = data.a_hh_days_available === '' ? null : (data.a_hh_days_available ? parseFloat(data.a_hh_days_available) : null);
  apiData.hhPctRented = data.a_hh_pct_rented === '' ? null : (data.a_hh_pct_rented ? parseFloat(data.a_hh_pct_rented) : null);
  apiData.hhHoldingCosts = data.a_hh_holding_costs === '' ? null : (data.a_hh_holding_costs ? parseFloat(data.a_hh_holding_costs) : null);
  apiData.hhMgmtCosts = data.a_hh_mgmt_costs === '' ? null : (data.a_hh_mgmt_costs ? parseFloat(data.a_hh_mgmt_costs) : null);

  // ClientId from clientGuidMap
  if (clientGuidMap) {
    apiData.clientId = clientGuidMap.client1 || null;
  }

  return apiData;
}

// ──────────────────────────────────────────────────────────────
// Assets API
// ──────────────────────────────────────────────────────────────

export const assetsApi = {
  /**
   * GET all assets for a client.
   * @param {string} clientId - The client ID (GUID)
   * @returns {Promise<Array>} Asset records in snake_case
   */
  async getAll(clientId) {
    const response = await axiosInstance.get(`/assets?clientId=${clientId}`);
    const raw = response.data;
    const arr = Array.isArray(raw) ? raw : (raw.items || raw.data || raw.value || []);
    return normaliseRecord(camelToSnakeKeys(arr));
  },

  /**
   * POST a new asset record.
   * @param {object} data - Asset fields (React state with a_* keys)
   * @param {object} clientGuidMap - Map of owner keys to client GUIDs
   * @param {string} [defaultName] - Default name if empty
   * @returns {Promise<object>} Created asset (snake_case)
   */
  async create(data, clientGuidMap, defaultName) {
    const payload = sanitisePayload(buildAssetPayload(data, clientGuidMap, defaultName));
    const response = await axiosInstance.post('/assets', { ...payload, clientId: clientGuidMap?.client1 || null });
    return normaliseRecord(camelToSnakeKeys(response.data));
  },

  /**
   * PUT an existing asset record.
   * @param {string} id - The asset record ID
   * @param {object} data - Asset fields (React state with a_* keys)
   * @returns {Promise<object>} Updated asset (snake_case)
   */
  async update(id, data) {
    const payload = sanitisePayload(buildAssetPayload(data));
    const response = await axiosInstance.put(`/assets/${id}`, payload);
    return normaliseRecord(camelToSnakeKeys(response.data));
  },

  /**
   * DELETE an asset record.
   * @param {string} id - The asset record ID
   * @returns {Promise<void>}
   */
  async remove(id) {
    await axiosInstance.delete(`/assets/${id}`);
  },
};
