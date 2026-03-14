import axiosInstance from './axiosInstance';
import { sanitisePayload } from './apiUtils';

// ──────────────────────────────────────────────────────────────
// Case conversion utilities (same as primeSolveClient.js)
// ──────────────────────────────────────────────────────────────

function camelToSnake(str) {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase();
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
// Principal fields — the set of fields that belong to the
// Principals section of the fact find.
// ──────────────────────────────────────────────────────────────

const PRINCIPAL_FIELDS = [
  'first_name', 'last_name', 'gender', 'date_of_birth',
  'marital_status', 'living_status', 'resident_status',
  'address', 'suburb', 'state', 'country', 'postcode',
  'mobile', 'email',
  'health_status', 'smoker_status', 'health_insurance', 'health_issues',
  'employment_status', 'occupation', 'hours_per_week',
  'occupation_type', 'annual_leave', 'sick_leave', 'long_service_leave',
  'employer_name', 'fbt_exempt', 'fbt_category', 'fbt_other_benefits',
  'employment_length',
  'has_will', 'will_updated', 'testamentary_trust',
  'power_of_attorney',
  'centrelink_benefits', 'benefit_type', 'concession_cards',
];

/**
 * Extract only the principal fields from a client state object.
 * @param {object} clientState - The client1 or client2 state object (snake_case keys)
 * @returns {object} Subset containing only principal fields
 */
function pickPrincipalFields(clientState) {
  if (!clientState) return {};
  const result = {};
  for (const field of PRINCIPAL_FIELDS) {
    if (clientState[field] !== undefined) {
      result[field] = clientState[field];
    }
  }
  return result;
}

// ──────────────────────────────────────────────────────────────
// Principals API
// ──────────────────────────────────────────────────────────────

export const principalsApi = {
  /**
   * GET principal data for a client.
   * Fetches the client record and returns only principal-relevant fields
   * in snake_case (matching React state structure).
   *
   * @param {string} clientId - The client ID (GUID)
   * @returns {Promise<object>} Principal fields in snake_case
   */
  async get(clientId) {
    const response = await axiosInstance.get(`/clients/${clientId}`);
    const snakeData = camelToSnakeKeys(response.data);
    return pickPrincipalFields(snakeData);
  },

  /**
   * PUT principal data for a client.
   * Fetches current client record first (API does full replace),
   * merges principal fields, then PUTs back. This follows the same
   * merge-before-PUT pattern as the entity proxy in primeSolveClient.js.
   *
   * @param {string} clientId - The client ID (GUID)
   * @param {object} principalData - Principal fields in snake_case (React state)
   * @returns {Promise<object>} Updated client data (snake_case)
   */
  async save(clientId, principalData) {
    // Convert React state (snake_case) → API format (camelCase)
    const apiData = snakeToCamelKeys(principalData);

    // Fetch current record to avoid wiping non-principal fields
    const current = await axiosInstance.get(`/clients/${clientId}`);
    const { id: _id, ...currentFields } = current.data;

    // Merge principal fields onto the existing record
    const merged = { ...currentFields, ...apiData };
    const payload = sanitisePayload(merged);

    const response = await axiosInstance.put(`/clients/${clientId}`, payload);
    return camelToSnakeKeys(response.data);
  },
};
