import axiosInstance from './axiosInstance';

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
    '1': 0,  // HomeLoan
    '2': 1,  // InvestmentLoan
    '3': 2,  // PersonalLoan (margin loan maps to personal)
    '4': 3,  // CreditCard
    '5': 4,  // HECS
    '6': 5,  // CarLoan
  };
  return map[frontendType] ?? 0; // default HomeLoan
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
    return normaliseRecord(camelToSnakeKeys(arr));
  },

  /**
   * POST a new debt record.
   * @param {object} data - Debt fields (React state with d_* keys)
   * @param {object} clientGuidMap - Map of owner keys to client GUIDs
   * @param {string} [defaultName] - Default name if empty
   * @returns {Promise<object>} Created debt (snake_case)
   */
  async create(data, clientGuidMap, defaultName) {
    const apiData = buildDebtPayload(data, clientGuidMap, defaultName);
    const response = await axiosInstance.post('/debts', apiData);
    return normaliseRecord(camelToSnakeKeys(response.data));
  },

  /**
   * PUT an existing debt record.
   * @param {string} id - The debt record ID
   * @param {object} data - Debt fields (React state with d_* keys)
   * @returns {Promise<object>} Updated debt (snake_case)
   */
  async update(id, data) {
    const apiData = buildDebtPayload(data);
    const response = await axiosInstance.put(`/debts/${id}`, apiData);
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
