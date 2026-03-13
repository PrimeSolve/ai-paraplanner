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
// Build API payload for create/update defined benefit
// snake_case frontend → camelCase API
// ──────────────────────────────────────────────────────────────

function buildDefinedBenefitPayload(data, clientGuidMap) {
  const apiData = {};

  // owner → clientId via clientGuidMap
  apiData.clientId = clientGuidMap?.[data.owner] || clientGuidMap?.client1;

  // String fields (send as-is)
  apiData.owner = data.owner;
  apiData.scheme = data.scheme;
  apiData.status = data.status;
  apiData.benefitPreference = data.benefit_preference;
  apiData.tenYearRuleMet = data.ten_year_rule_met;
  apiData.pre1976Joiner = data.pre_1976_joiner;
  apiData.planning5411 = data.planning_54_11;
  apiData.pensionIndexed = data.pension_indexed;
  apiData.otherSchemeName = data.other_scheme_name;
  apiData.otherPensionFormula = data.other_pension_formula;
  apiData.notes = data.notes;
  apiData.combinationLumpPct = data.combination_lump_pct;

  // Date fields (null if empty)
  apiData.dateJoined = data.date_joined === '' ? null : (data.date_joined || null);

  // Numeric fields (parseFloat or null)
  const numericFields = [
    ['super_salary', 'superSalary'],
    ['salary_growth', 'salaryGrowth'],
    ['contribution_rate', 'contributionRate'],
    ['years_service', 'yearsService'],
    ['expected_exit_age', 'expectedExitAge'],
    ['combination_lump_pct', 'combinationLumpPct'],
    ['member_component', 'memberComponent'],
    ['productivity_component', 'productivityComponent'],
    ['employer_component', 'employerComponent'],
    ['current_abm', 'currentAbm'],
    ['accumulated_basic_contribs', 'accumulatedBasicContribs'],
    ['preserved_benefit', 'preservedBenefit'],
    ['current_pension_annual', 'currentPensionAnnual'],
    ['estimated_annual_pension', 'estimatedAnnualPension'],
  ];

  for (const [snakeKey, camelKey] of numericFields) {
    const val = data[snakeKey];
    apiData[camelKey] = (val !== '' && val !== null && val !== undefined) ? (parseFloat(val) || null) : null;
  }

  return apiData;
}

// ──────────────────────────────────────────────────────────────
// Defined Benefits API
// ──────────────────────────────────────────────────────────────

export const definedBenefitsApi = {
  /**
   * GET all defined benefits for a client.
   * @param {string} clientId - The client ID (GUID)
   * @returns {Promise<Array>} Defined benefit records in snake_case
   */
  async getAll(clientId) {
    const response = await axiosInstance.get(`/defined-benefits?clientId=${clientId}`);
    const raw = response.data;
    const arr = Array.isArray(raw) ? raw : (raw.items || raw.data || raw.value || []);
    return normaliseRecord(camelToSnakeKeys(arr));
  },

  /**
   * POST a new defined benefit record.
   * ClientId required on create — uses clientGuidMap.client1 as default.
   * @param {object} data - Defined benefit fields in snake_case (React state)
   * @param {object} clientGuidMap - Map of owner keys to client GUIDs
   * @returns {Promise<object>} Created record (snake_case)
   */
  async create(data, clientGuidMap) {
    const apiData = buildDefinedBenefitPayload(data, clientGuidMap);
    if (!apiData.clientId) {
      apiData.clientId = clientGuidMap?.client1 || null;
    }
    const response = await axiosInstance.post('/defined-benefits', apiData);
    return normaliseRecord(camelToSnakeKeys(response.data));
  },

  /**
   * PUT an existing defined benefit record.
   * @param {string} id - The record ID
   * @param {object} data - Defined benefit fields in snake_case (React state)
   * @returns {Promise<object>} Updated record (snake_case)
   */
  async update(id, data) {
    const apiData = buildDefinedBenefitPayload(data, {});
    const response = await axiosInstance.put(`/defined-benefits/${id}`, apiData);
    return normaliseRecord(camelToSnakeKeys(response.data));
  },

  /**
   * DELETE a defined benefit record.
   * @param {string} id - The record ID
   * @returns {Promise<void>}
   */
  async remove(id) {
    await axiosInstance.delete(`/defined-benefits/${id}`);
  },
};
