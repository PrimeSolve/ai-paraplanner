import axiosInstance from './axiosInstance';
import { sanitisePayload } from './apiUtils';

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
// Enum mappings: frontend string → API integer
// ──────────────────────────────────────────────────────────────

// TrusteeType: Individual=0, Corporate=1
const TRUSTEE_TYPE_MAP = {
  '1': 1,  // Corporate
  '2': 0,  // Individual
};

// SuperPhase: Accumulation=0, Pension=1, TTR=2
const SUPER_PHASE_MAP = {
  '1': 0,  // Accumulation
  '2': 1,  // Pension
};

// Inbound: API superPhase → frontend tax_environment value
const SUPER_PHASE_FROM_API = {
  0: '1', 'Accumulation': '1',
  1: '2', 'Pension': '2',
  2: '3', 'TTR': '3',
};

// SMSFMemberRole: Trustee=0, Director=1, Member=2
const DEFAULT_MEMBER_ROLE = 2;

// ──────────────────────────────────────────────────────────────
// Build API payload for create/update SMSF
// ──────────────────────────────────────────────────────────────

function buildSmsfPayload(data) {
  const payload = {};

  // smsf_name → fundName (required)
  if (data.smsf_name !== undefined) payload.fundName = data.smsf_name;

  // smsf_abn → abn
  if (data.smsf_abn !== undefined) payload.abn = data.smsf_abn;

  // trustee_type: "1" → 1 (Corporate), "2" → 0 (Individual)
  if (data.trustee_type !== undefined && data.trustee_type !== '') {
    payload.trusteeType = TRUSTEE_TYPE_MAP[String(data.trustee_type)] ?? 0;
  }

  // Preserve clientId if present
  if (data.client_id !== undefined) payload.clientId = data.client_id;

  return payload;
}

// ──────────────────────────────────────────────────────────────
// Build API payload for SMSF member (account)
// ──────────────────────────────────────────────────────────────

function buildMemberPayload(memberData) {
  const payload = {};

  // owner → clientId (must be a valid GUID)
  if (memberData.owner !== undefined) payload.clientId = memberData.owner;

  // tax_environment: "1" → 0 (Accumulation), "2" → 1 (Pension)
  if (memberData.tax_environment !== undefined && memberData.tax_environment !== '') {
    payload.superPhase = SUPER_PHASE_MAP[String(memberData.tax_environment)] ?? 0;
  }

  // balance → balance (decimal)
  if (memberData.balance !== undefined) {
    payload.balance = memberData.balance === '' ? 0 : parseFloat(memberData.balance) || 0;
  }

  // Default role to Member=2
  payload.role = DEFAULT_MEMBER_ROLE;

  return payload;
}

// ──────────────────────────────────────────────────────────────
// SMSFs API
// ──────────────────────────────────────────────────────────────

export const smsfApi = {
  /**
   * GET all SMSFs, filtered client-side by clientId.
   * The API does not support ?clientId= directly.
   * @param {string} [clientId] - Optional client ID to filter by
   * @returns {Promise<Array>} SMSF records in snake_case
   */
  async getAll(clientId) {
    const response = await axiosInstance.get('/smsfs');
    const raw = response.data;
    const arr = Array.isArray(raw) ? raw : (raw.items || raw.data || raw.value || []);
    const normalised = normaliseRecord(camelToSnakeKeys(arr));
    // Convert superPhase integers to frontend values in nested members
    for (const smsf of normalised) {
      if (Array.isArray(smsf.members)) {
        for (const member of smsf.members) {
          if (member.super_phase !== undefined && member.super_phase !== null && member.super_phase !== '') {
            member.super_phase = SUPER_PHASE_FROM_API[member.super_phase]
              ?? SUPER_PHASE_FROM_API[String(member.super_phase)]
              ?? '';
          }
        }
      }
      // Also handle trustee_type inbound: API Corporate=1, Individual=0 → frontend "1"=Corporate, "2"=Individual
      if (smsf.trustee_type !== undefined && smsf.trustee_type !== null && smsf.trustee_type !== '') {
        const ttMap = { 1: '1', 'Corporate': '1', 0: '2', 'Individual': '2' };
        smsf.trustee_type = ttMap[smsf.trustee_type] ?? ttMap[String(smsf.trustee_type)] ?? '';
      }
    }
    if (clientId) {
      return normalised.filter(r => r.client_id === clientId);
    }
    return normalised;
  },

  /**
   * POST a new SMSF record.
   * @param {object} data - SMSF fields in snake_case (React state)
   * @returns {Promise<object>} Created SMSF (snake_case)
   */
  async create(data) {
    const payload = sanitisePayload(buildSmsfPayload(data));
    const response = await axiosInstance.post('/smsfs', { ...payload, clientId: data.client_id || null });
    return normaliseRecord(camelToSnakeKeys(response.data));
  },

  /**
   * PUT an existing SMSF record.
   * @param {string} id - The SMSF record ID
   * @param {object} data - SMSF fields in snake_case (React state)
   * @returns {Promise<object>} Updated SMSF (snake_case)
   */
  async update(id, data) {
    const payload = sanitisePayload(buildSmsfPayload(data));
    const response = await axiosInstance.put(`/smsfs/${id}`, payload);
    return normaliseRecord(camelToSnakeKeys(response.data));
  },

  /**
   * DELETE an SMSF record.
   * @param {string} id - The SMSF record ID
   * @returns {Promise<void>}
   */
  async remove(id) {
    await axiosInstance.delete(`/smsfs/${id}`);
  },

  /**
   * POST a new member to an SMSF.
   * @param {string} smsfId - The SMSF ID
   * @param {object} memberData - Member fields in snake_case
   * @returns {Promise<object>} Created member (snake_case)
   */
  async addMember(smsfId, memberData) {
    const apiData = buildMemberPayload(memberData);
    const response = await axiosInstance.post(`/smsfs/${smsfId}/members`, apiData);
    return normaliseRecord(camelToSnakeKeys(response.data));
  },

  /**
   * DELETE a member from an SMSF.
   * @param {string} smsfId - The SMSF ID
   * @param {string} memberId - The member ID
   * @returns {Promise<void>}
   */
  async removeMember(smsfId, memberId) {
    await axiosInstance.delete(`/smsfs/${smsfId}/members/${memberId}`);
  },

  /**
   * POST a new beneficiary to an SMSF member.
   * @param {string} smsfId - The SMSF ID
   * @param {string} memberId - The member ID
   * @param {object} benefData - { benef_who, benef_type, benef_entitlement }
   * @param {object} [clientGuidMap] - Map of display values → real GUIDs
   * @returns {Promise<object>} Created beneficiary (snake_case)
   */
  async addBeneficiary(smsfId, memberId, benefData, clientGuidMap = {}) {
    const whoValue = benefData.benef_who || '';
    const resolvedGuid = clientGuidMap[whoValue] || whoValue;

    const apiData = {
      BeneficiaryClientId: resolvedGuid || null,
      BeneficiaryEntityId: null,
      BeneficiaryType: 0,
      DefaultPercentage: benefData.benef_entitlement
        ? parseFloat(benefData.benef_entitlement)
        : null,
    };

    const response = await axiosInstance.post(
      `/smsfs/${smsfId}/members/${memberId}/beneficiaries`,
      apiData,
    );
    return normaliseRecord(camelToSnakeKeys(response.data));
  },

  /**
   * DELETE a beneficiary from an SMSF member.
   * @param {string} smsfId - The SMSF ID
   * @param {string} memberId - The member ID
   * @param {string} beneficiaryId - The beneficiary ID
   * @returns {Promise<void>}
   */
  async removeBeneficiary(smsfId, memberId, beneficiaryId) {
    await axiosInstance.delete(
      `/smsfs/${smsfId}/members/${memberId}/beneficiaries/${beneficiaryId}`,
    );
  },
};
