import axiosInstance from './axiosInstance';

// ──────────────────────────────────────────────────────────────
// Case conversion utilities (same as principalsApi.js)
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
// Dependants API
// ──────────────────────────────────────────────────────────────

export const dependantsApi = {
  /**
   * GET all dependants for a client.
   * @param {string} clientId - The client ID (GUID)
   * @returns {Promise<Array>} Dependant records in snake_case
   */
  async getAll(clientId) {
    const response = await axiosInstance.get(`/dependants?clientId=${clientId}`);
    const raw = response.data;
    const arr = Array.isArray(raw) ? raw : (raw.items || raw.data || raw.value || []);
    return camelToSnakeKeys(arr);
  },

  /**
   * POST a new dependant record.
   * @param {object} data - Dependant fields in snake_case (React state)
   * @returns {Promise<object>} Created dependant (snake_case)
   */
  async create(data) {
    const apiData = snakeToCamelKeys(data);
    if (apiData.dateOfBirth === '') apiData.dateOfBirth = null;
    if (apiData.financialDependenceAge === '') apiData.financialDependenceAge = null;
    if (apiData.dependantUntilAge === '') apiData.dependantUntilAge = null;
    if (apiData.age === '') apiData.age = null;
    if (apiData.financialDependenceAge !== null) apiData.financialDependenceAge = String(apiData.financialDependenceAge);
    if (apiData.dependantUntilAge !== null) apiData.dependantUntilAge = String(apiData.dependantUntilAge);
    const response = await axiosInstance.post('/dependants', apiData);
    return camelToSnakeKeys(response.data);
  },

  /**
   * PUT an existing dependant record.
   * @param {string} id - The dependant record ID
   * @param {object} data - Dependant fields in snake_case (React state)
   * @returns {Promise<object>} Updated dependant (snake_case)
   */
  async update(id, data) {
    const apiData = snakeToCamelKeys(data);
    if (apiData.dateOfBirth === '') apiData.dateOfBirth = null;
    if (apiData.financialDependenceAge === '') apiData.financialDependenceAge = null;
    if (apiData.dependantUntilAge === '') apiData.dependantUntilAge = null;
    if (apiData.age === '') apiData.age = null;
    if (apiData.healthIssues === '') apiData.healthIssues = null;
    if (apiData.financialDependenceAge !== null) apiData.financialDependenceAge = String(apiData.financialDependenceAge);
    if (apiData.dependantUntilAge !== null) apiData.dependantUntilAge = String(apiData.dependantUntilAge);

    // Strip read-only fields the API rejects on PUT
    const { id: _id, clientId: _clientId, createdAt: _createdAt, client_id: _client_id, created_at: _created_at, ...payload } = apiData;

    console.log('[dependantsApi.update] PUT /dependants/' + id, JSON.stringify(payload, null, 2));
    const response = await axiosInstance.put(`/dependants/${id}`, payload);
    return camelToSnakeKeys(response.data);
  },

  /**
   * DELETE a dependant record.
   * @param {string} id - The dependant record ID
   * @returns {Promise<void>}
   */
  async remove(id) {
    await axiosInstance.delete(`/dependants/${id}`);
  },
};
