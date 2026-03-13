import axiosInstance from './axiosInstance';

// ──────────────────────────────────────────────────────────────
// Case conversion utilities (same as dependantsApi.js)
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
// TrustType enum mapping: frontend string → API integer
// ──────────────────────────────────────────────────────────────

const TRUST_TYPE_MAP = {
  '1': 0,  // Discretionary Family → 0
  '2': 1,  // Unit → 1
  '3': 2,  // Hybrid → 2
  '4': 0,  // Testamentary → 0 (map to Discretionary)
  '5': 0,  // Other → 0 (map to Discretionary)
};

function convertTrustType(apiData) {
  const raw = apiData.trustType;
  if (raw === '' || raw === null || raw === undefined) {
    apiData.trustType = 0;
  } else {
    apiData.trustType = TRUST_TYPE_MAP[String(raw)] ?? 0;
  }
  return apiData;
}

// ──────────────────────────────────────────────────────────────
// Trusts API
// ──────────────────────────────────────────────────────────────

export const trustsApi = {
  /**
   * GET all trusts for a client.
   * @param {string} clientId - The client ID (GUID)
   * @returns {Promise<Array>} Trust records in snake_case
   */
  async getAll(clientId) {
    const response = await axiosInstance.get(`/trusts?clientId=${clientId}`);
    const raw = response.data;
    const arr = Array.isArray(raw) ? raw : (raw.items || raw.data || raw.value || []);
    return camelToSnakeKeys(arr);
  },

  /**
   * POST a new trust record.
   * @param {string} clientId - The client ID (GUID)
   * @param {object} data - Trust fields in snake_case (React state)
   * @returns {Promise<object>} Created trust (snake_case)
   */
  async create(clientId, data) {
    const { beneficiaries, ...rest } = data;
    const apiData = snakeToCamelKeys({ ...rest, client_id: clientId });
    convertTrustType(apiData);
    const response = await axiosInstance.post('/trusts', apiData);
    return camelToSnakeKeys(response.data);
  },

  /**
   * PUT an existing trust record.
   * @param {string} id - The trust record ID
   * @param {object} data - Trust fields in snake_case (React state)
   * @returns {Promise<object>} Updated trust (snake_case)
   */
  async update(id, data) {
    const { beneficiaries, ...rest } = data;
    const apiData = snakeToCamelKeys(rest);
    convertTrustType(apiData);
    const response = await axiosInstance.put(`/trusts/${id}`, apiData);
    return camelToSnakeKeys(response.data);
  },

  /**
   * DELETE a trust record.
   * @param {string} id - The trust record ID
   * @returns {Promise<void>}
   */
  async remove(id) {
    await axiosInstance.delete(`/trusts/${id}`);
  },
};
