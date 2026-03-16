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
// Debt type mapping: frontend string → API integer
// ──────────────────────────────────────────────────────────────

function mapDebtType(frontendType) {
  const map = {
    '1': 0,   // Home loan → HomeLoan
    '2': 1,   // Investment loan → InvestmentLoan
    '3': 2,   // Margin loan → PersonalLoan
    '5': 3,   // Credit card → CreditCard
    '7': 5,   // Car loan → CarLoan
    '8': 7,   // Other
    '60': 6,  // Director loan (Div 7A) → Div7A
  };
  return map[String(frontendType)] ?? 0; // default HomeLoan
}

// Inbound: API debtType (integer or string) → frontend select value
function mapDebtTypeFromApi(apiType) {
  const map = {
    0: '1',  'HomeLoan': '1',
    1: '2',  'InvestmentLoan': '2',
    2: '3',  'PersonalLoan': '3',
    3: '5',  'CreditCard': '5',
    4: '4',  'HECS': '4',
    5: '7',  'CarLoan': '7',
    6: '60', 'Div7A': '60',
    7: '8',  'Other': '8',
  };
  return map[apiType] ?? map[String(apiType)] ?? '';
}

// ──────────────────────────────────────────────────────────────
// Repayment frequency mapping: frontend string → API integer
// ──────────────────────────────────────────────────────────────

function mapRepaymentFrequency(frontendFreq) {
  const map = {
    '52': 0,  // Weekly
    '26': 1,  // Fortnightly
    '12': 2,  // Monthly
    '4':  3,  // Quarterly
  };
  return map[frontendFreq] ?? null;
}

// Inbound: API repayment frequency (integer or string) → frontend select value
function mapRepaymentFrequencyFromApi(apiFreq) {
  const map = {
    0: '52', 'Weekly': '52',
    1: '26', 'Fortnightly': '26',
    2: '12', 'Monthly': '12',
    3: '4',  'Quarterly': '4',
    4: '1',  'Annually': '1',
  };
  return map[apiFreq] ?? map[String(apiFreq)] ?? '';
}

// ──────────────────────────────────────────────────────────────
// Inbound conversion: apply reverse mappings to a snake_case record
// ──────────────────────────────────────────────────────────────

function convertDebtFieldsInbound(record) {
  if (!record) return record;
  if (record.debt_type !== undefined && record.debt_type !== null && record.debt_type !== '') {
    record.debt_type = mapDebtTypeFromApi(record.debt_type);
  }
  if (record.repayment_frequency !== undefined && record.repayment_frequency !== null && record.repayment_frequency !== '') {
    record.repayment_frequency = mapRepaymentFrequencyFromApi(record.repayment_frequency);
  }
  return record;
}

// ──────────────────────────────────────────────────────────────
// Check if owner is a trust/company GUID (not a local ref like
// "client1", "trust_0", "company_0")
// ──────────────────────────────────────────────────────────────

function resolveEntityId(owner) {
  if (!owner) return null;
  // GUID pattern (8-4-4-4-12 hex)
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(owner)) {
    return owner;
  }
  return null;
}

// ──────────────────────────────────────────────────────────────
// Build API payload for create/update debt
// Frontend fields (d_*) → API camelCase
// ──────────────────────────────────────────────────────────────

function buildDebtPayload(data, clientGuidMap, defaultName) {
  const apiData = {};

  apiData.lenderName = data.d_name || defaultName || 'Debt 1';
  apiData.debtType = mapDebtType(data.d_type);
  apiData.balance = data.d_balance ? parseFloat(data.d_balance) : 0;
  apiData.interestRate = data.d_rate ? parseFloat(data.d_rate) : 0;
  apiData.repaymentAmount = data.d_repayments ? parseFloat(data.d_repayments) : null;
  apiData.repaymentFrequency = mapRepaymentFrequency(data.d_freq);
  apiData.entityId = resolveEntityId(data.d_owner);

  // ClientId from clientGuidMap
  if (clientGuidMap) {
    apiData.clientId = clientGuidMap.client1 || null;
  }

  return apiData;
}

// ──────────────────────────────────────────────────────────────
// Debts API
// ──────────────────────────────────────────────────────────────

export const debtsApi = {
  /**
   * GET all debts for a client.
   * @param {string} clientId - The client ID (GUID)
   * @returns {Promise<Array>} Debt records in snake_case
   */
  async getAll(clientId) {
    const response = await axiosInstance.get(`/debts?clientId=${clientId}`);
    const raw = response.data;
    const arr = Array.isArray(raw) ? raw : (raw.items || raw.data || raw.value || []);
    const records = normaliseRecord(camelToSnakeKeys(arr));
    return Array.isArray(records) ? records.map(convertDebtFieldsInbound) : records;
  },

  /**
   * POST a new debt record.
   * @param {object} data - Debt fields (React state with d_* keys)
   * @param {object} clientGuidMap - Map of owner keys to client GUIDs
   * @param {string} [defaultName] - Default name if empty
   * @returns {Promise<object>} Created debt (snake_case)
   */
  async create(data, clientGuidMap, defaultName) {
    const payload = sanitisePayload(buildDebtPayload(data, clientGuidMap, defaultName));
    payload.balance = parseFloat(payload.balance) || 0;
    payload.interestRate = parseFloat(payload.interestRate) || 0;
    const response = await axiosInstance.post('/debts', { ...payload, clientId: clientGuidMap?.client1 || null });
    return normaliseRecord(camelToSnakeKeys(response.data));
  },

  /**
   * PUT an existing debt record.
   * @param {string} id - The debt record ID
   * @param {object} data - Debt fields (React state with d_* keys)
   * @returns {Promise<object>} Updated debt (snake_case)
   */
  async update(id, data) {
    const payload = sanitisePayload(buildDebtPayload(data));
    payload.balance = parseFloat(payload.balance) || 0;
    payload.interestRate = parseFloat(payload.interestRate) || 0;
    const response = await axiosInstance.put(`/debts/${id}`, payload);
    return normaliseRecord(camelToSnakeKeys(response.data));
  },

  /**
   * DELETE a debt record.
   * @param {string} id - The debt record ID
   * @returns {Promise<void>}
   */
  async remove(id) {
    await axiosInstance.delete(`/debts/${id}`);
  },
};
