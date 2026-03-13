import axiosInstance from './axiosInstance';

// ──────────────────────────────────────────────────────────────
// Case conversion utilities (same as trustsApi.js)
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
// Fields to strip before sending to API (frontend-only)
// ──────────────────────────────────────────────────────────────

const FRONTEND_ONLY_FIELDS = [
  'co_purpose', 'co_type', 'co_losses',
  'pnl', 'share_capital', 'retained_earnings',
  'uploaded_pnl', 'uploaded_bs',
  'uploaded_pnl_name', 'uploaded_bs_name',
];

function stripFrontendFields(data) {
  const cleaned = { ...data };
  for (const field of FRONTEND_ONLY_FIELDS) {
    delete cleaned[field];
  }
  return cleaned;
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
// Companies API
// ──────────────────────────────────────────────────────────────

export const companiesApi = {
  /**
   * GET all companies for a client.
   * @param {string} clientId - The client ID (GUID)
   * @returns {Promise<Array>} Company records in snake_case
   */
  async getAll(clientId) {
    const response = await axiosInstance.get(`/companies?clientId=${clientId}`);
    const raw = response.data;
    const arr = Array.isArray(raw) ? raw : (raw.items || raw.data || raw.value || []);
    return normaliseRecord(camelToSnakeKeys(arr));
  },

  /**
   * POST a new company record.
   * @param {string} clientId - The client ID (GUID)
   * @param {object} data - Company fields in snake_case (React state)
   * @returns {Promise<object>} Created company (snake_case)
   */
  async create(clientId, data) {
    const stripped = stripFrontendFields(data);
    const apiData = snakeToCamelKeys({ ...stripped, client_id: clientId });
    if (!apiData.companyName || apiData.companyName === '') apiData.companyName = data.default_name || 'Company 1';
    // taxRate fixup: "25" → 0.25
    if (typeof apiData.taxRate === 'string') {
      apiData.taxRate = parseFloat(apiData.taxRate) / 100;
    }
    // frankingBalance fixup: "" → null
    if (apiData.frankingBalance === '') apiData.frankingBalance = null;
    const response = await axiosInstance.post('/companies', apiData);
    return normaliseRecord(camelToSnakeKeys(response.data));
  },

  /**
   * PUT an existing company record.
   * @param {string} id - The company record ID
   * @param {object} data - Company fields in snake_case (React state)
   * @returns {Promise<object>} Updated company (snake_case)
   */
  async update(id, data) {
    const stripped = stripFrontendFields(data);
    const apiData = snakeToCamelKeys(stripped);
    // taxRate fixup: "25" → 0.25
    if (typeof apiData.taxRate === 'string') {
      apiData.taxRate = parseFloat(apiData.taxRate) / 100;
    }
    // frankingBalance fixup: "" → null
    if (apiData.frankingBalance === '') apiData.frankingBalance = null;
    const response = await axiosInstance.put(`/companies/${id}`, apiData);
    return normaliseRecord(camelToSnakeKeys(response.data));
  },

  /**
   * DELETE a company record.
   * @param {string} id - The company record ID
   * @returns {Promise<void>}
   */
  async remove(id) {
    await axiosInstance.delete(`/companies/${id}`);
  },

  // ── Shareholders sub-resource ──────────────────────────────

  async addShareholder(companyId, data) {
    const apiData = snakeToCamelKeys(data);
    const response = await axiosInstance.post(`/companies/${companyId}/shareholders`, apiData);
    return normaliseRecord(camelToSnakeKeys(response.data));
  },

  async removeShareholder(companyId, shareholderId) {
    await axiosInstance.delete(`/companies/${companyId}/shareholders/${shareholderId}`);
  },
};
