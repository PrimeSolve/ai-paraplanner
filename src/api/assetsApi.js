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
// OwnershipType enum mapping
// Frontend: "1"=Sole, "2"=Joint, "3"=Trust, "4"=Company
// API:      Individual=0, Joint=1, Company=2, Trust=3, SMSF=4
// ──────────────────────────────────────────────────────────────

const OWNERSHIP_TO_API = {
  '1': 0,  // Sole / Individual
  '2': 1,  // Joint
  '3': 3,  // Trust
  '4': 2,  // Company
};

const OWNERSHIP_FROM_API = {
  0: '1', 'Individual': '1',
  1: '2', 'Joint': '2',
  2: '4', 'Company': '4',
  3: '3', 'Trust': '3',
  4: '5', 'SMSF': '5',
};

// ──────────────────────────────────────────────────────────────
// Rental / Pay frequency mapping (same pattern as debts)
// Frontend: "52"=Weekly, "26"=Fortnightly, "12"=Monthly, "4"=Quarterly, "1"=Annually
// API:      Weekly=0, Fortnightly=1, Monthly=2, Quarterly=3, Annually=4
// ──────────────────────────────────────────────────────────────

const FREQ_TO_API = { '52': 0, '26': 1, '12': 2, '4': 3, '1': 4 };

const FREQ_FROM_API = {
  0: '52', 'Weekly': '52',
  1: '26', 'Fortnightly': '26',
  2: '12', 'Monthly': '12',
  3: '4',  'Quarterly': '4',
  4: '1',  'Annually': '1',
};

// ──────────────────────────────────────────────────────────────
// Inbound conversion: apply reverse mappings to a snake_case record
// ──────────────────────────────────────────────────────────────

function convertAssetFieldsInbound(record) {
  if (!record) return record;
  if (record.own_type !== undefined && record.own_type !== null && record.own_type !== '') {
    const mapped = OWNERSHIP_FROM_API[record.own_type] ?? OWNERSHIP_FROM_API[String(record.own_type)];
    if (mapped !== undefined) record.own_type = mapped;
  }
  if (record.rental_frequency !== undefined && record.rental_frequency !== null && record.rental_frequency !== '') {
    const mapped = FREQ_FROM_API[record.rental_frequency] ?? FREQ_FROM_API[String(record.rental_frequency)];
    if (mapped !== undefined) record.rental_frequency = mapped;
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
  apiData.ownType = (data.a_ownType && OWNERSHIP_TO_API[data.a_ownType] !== undefined) ? OWNERSHIP_TO_API[data.a_ownType] : null;
  apiData.owner = data.a_owner || '';
  apiData.assetType = data.a_type || '';
  apiData.value = data.a_value === '' ? null : (data.a_value ? parseFloat(data.a_value) : null);
  apiData.purchasePrice = data.a_purchase_price === '' ? null : (data.a_purchase_price ? parseFloat(data.a_purchase_price) : null);
  apiData.purchaseDate = data.a_purchase_date === '' ? null : (data.a_purchase_date || null);
  apiData.moveOutDate = data.a_move_out_date === '' ? null : (data.a_move_out_date || null);
  apiData.rentalIncome = data.a_rental_income === '' ? null : (data.a_rental_income ? parseFloat(data.a_rental_income) : null);
  apiData.rentalFrequency = (data.a_rental_freq && FREQ_TO_API[data.a_rental_freq] !== undefined) ? FREQ_TO_API[data.a_rental_freq] : null;
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
    const records = normaliseRecord(camelToSnakeKeys(arr));
    return Array.isArray(records) ? records.map(convertAssetFieldsInbound) : records;
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
