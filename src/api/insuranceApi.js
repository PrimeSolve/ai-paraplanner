import axiosInstance from './axiosInstance';
import { sanitisePayload } from './apiUtils';

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
// Outbound mapping: frontend insurance policy → API payload
// ──────────────────────────────────────────────────────────────

function buildInsurancePayload(data, clientGuidMap) {
  const apiData = {};

  apiData.policyName = data.pol_name || '';
  apiData.policyType = data.pol_type || '';
  apiData.owner = data.pol_owner || '';
  apiData.insured = data.pol_insured || '';
  apiData.taxEnv = data.pol_tax_env || '';
  apiData.insideSuperFundId = data.linked_fund_id ? String(data.linked_fund_id) : null;
  apiData.insurer = data.pol_insurer || '';
  apiData.policyNumber = data.pol_number || '';
  apiData.waitingPeriod = data.pol_waiting || '';
  apiData.benefitPeriod = data.pol_benefit_period || '';

  apiData.sumInsuredLife = data.sum_insured_life ? parseFloat(data.sum_insured_life) : null;
  apiData.sumInsuredTpd = data.sum_insured_tpd ? parseFloat(data.sum_insured_tpd) : null;
  apiData.sumInsuredTrauma = data.sum_insured_trauma ? parseFloat(data.sum_insured_trauma) : null;
  apiData.sumInsuredIp = data.sum_insured_ip ? parseFloat(data.sum_insured_ip) : null;
  apiData.sumInsuredIp2 = data.sum_insured_ip2 ? parseFloat(data.sum_insured_ip2) : null;

  apiData.premiumLife = data.premium_life ? parseFloat(data.premium_life) : null;
  apiData.premiumTpd = data.premium_tpd ? parseFloat(data.premium_tpd) : null;
  apiData.premiumTrauma = data.premium_trauma ? parseFloat(data.premium_trauma) : null;
  apiData.premiumIp = data.premium_ip ? parseFloat(data.premium_ip) : null;
  apiData.premiumIp2 = data.premium_ip2 ? parseFloat(data.premium_ip2) : null;

  apiData.premiumFrequency = data.pol_freq || '';
  apiData.premiumStructure = data.pol_structure || '';

  if (clientGuidMap) {
    apiData.clientId = clientGuidMap.client1 || null;
  }

  return apiData;
}

// ──────────────────────────────────────────────────────────────
// Inbound mapping: API insurance policy → frontend shape
// ──────────────────────────────────────────────────────────────

function mapInsuranceFromApi(record) {
  if (!record) return null;
  const n = normaliseRecord(record);
  return {
    id: n.id || null,
    pol_name: n.policyName || '',
    pol_type: n.policyType || '',
    pol_owner: n.owner || '',
    pol_insured: n.insured || '',
    pol_tax_env: n.taxEnv || '',
    linked_fund_id: n.insideSuperFundId != null ? String(n.insideSuperFundId) : '',
    pol_insurer: n.insurer || '',
    pol_number: n.policyNumber || '',
    pol_waiting: n.waitingPeriod || '',
    pol_benefit_period: n.benefitPeriod || '',
    sum_insured_life: n.sumInsuredLife != null ? String(n.sumInsuredLife) : '',
    sum_insured_tpd: n.sumInsuredTpd != null ? String(n.sumInsuredTpd) : '',
    sum_insured_trauma: n.sumInsuredTrauma != null ? String(n.sumInsuredTrauma) : '',
    sum_insured_ip: n.sumInsuredIp != null ? String(n.sumInsuredIp) : '',
    sum_insured_ip2: n.sumInsuredIp2 != null ? String(n.sumInsuredIp2) : '',
    premium_life: n.premiumLife != null ? String(n.premiumLife) : '',
    premium_tpd: n.premiumTpd != null ? String(n.premiumTpd) : '',
    premium_trauma: n.premiumTrauma != null ? String(n.premiumTrauma) : '',
    premium_ip: n.premiumIp != null ? String(n.premiumIp) : '',
    premium_ip2: n.premiumIp2 != null ? String(n.premiumIp2) : '',
    pol_freq: n.premiumFrequency || '',
    pol_structure: n.premiumStructure || '',
  };
}

// ──────────────────────────────────────────────────────────────
// Insurance API
// ──────────────────────────────────────────────────────────────

export const insuranceApi = {
  /**
   * GET all insurance policies for a client.
   * @param {string} clientId - The client ID (GUID)
   * @returns {Promise<Array>} Insurance records in frontend shape
   */
  async getAll(clientId) {
    const response = await axiosInstance.get(`/insurance?clientId=${clientId}`);
    const raw = response.data;
    const arr = Array.isArray(raw) ? raw : (raw.items || raw.data || raw.value || []);
    return arr.map(mapInsuranceFromApi);
  },

  /**
   * POST a new insurance policy.
   * @param {object} data - Policy fields (frontend shape)
   * @param {object} clientGuidMap - Map of owner keys to client GUIDs
   * @returns {Promise<object>} Created policy in frontend shape
   */
  async create(data, clientGuidMap) {
    const payload = sanitisePayload(buildInsurancePayload(data, clientGuidMap));
    const response = await axiosInstance.post('/insurance', { ...payload, clientId: clientGuidMap?.client1 || null });
    return mapInsuranceFromApi(response.data);
  },

  /**
   * PUT an existing insurance policy.
   * @param {string} id - The policy record ID
   * @param {object} data - Policy fields (frontend shape)
   * @returns {Promise<object>} Updated policy in frontend shape
   */
  async update(id, data) {
    const payload = sanitisePayload(buildInsurancePayload(data));
    const response = await axiosInstance.put(`/insurance/${id}`, payload);
    return mapInsuranceFromApi(response.data);
  },

  /**
   * DELETE an insurance policy.
   * @param {string} id - The policy record ID
   * @returns {Promise<void>}
   */
  async remove(id) {
    await axiosInstance.delete(`/insurance/${id}`);
  },
};
