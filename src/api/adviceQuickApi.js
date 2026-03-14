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
// Outbound mapping: frontend quick[person] → API camelCase
// ──────────────────────────────────────────────────────────────

function buildQuickPayload(personData, clientId, person) {
  const apiData = {};

  apiData.retAge = personData.ret_age || '';
  apiData.retImportance = personData.ret_importance || '';
  apiData.desiredIncome = personData.desired_income ? parseFloat(personData.desired_income) : null;
  apiData.incomeRank = personData.income_rank || '';
  apiData.estateAmount = personData.estate_amount ? parseFloat(personData.estate_amount) : null;
  apiData.estateImportance = personData.estate_importance || '';
  apiData.funeralBond = personData.funeral_bond || '';
  apiData.funeralAmount = personData.funeral_amount ? parseFloat(personData.funeral_amount) : null;
  apiData.funeralImportance = personData.funeral_importance || '';
  apiData.insDeath = personData.ins_death || '';
  apiData.insTpd = personData.ins_tpd || '';
  apiData.insIncome = personData.ins_income || '';
  apiData.insTrauma = personData.ins_trauma || '';
  apiData.insCreditors = personData.ins_creditors || '';
  apiData.insGuarantee = personData.ins_guarantee || '';
  apiData.protectionImportance = personData.protection_importance || '';
  apiData.superLowcost = personData.super_lowcost || '';
  apiData.superLowcostInv = personData.super_lowcost_inv || '';
  apiData.superTopMgr = personData.super_top_mgr || '';
  apiData.superTerm = personData.super_term || '';
  apiData.superSharesAu = personData.super_shares_au || '';
  apiData.superSharesInt = personData.super_shares_int || '';
  apiData.superBroad = personData.super_broad || '';
  apiData.superSri = personData.super_sri || '';
  apiData.superModel = personData.super_model || '';
  apiData.superLifecycle = personData.super_lifecycle || '';
  apiData.superRebalance = personData.super_rebalance || '';
  apiData.superTaxeff = personData.super_taxeff || '';
  apiData.superSwitches = personData.super_switches || '';
  apiData.superUptodate = personData.super_uptodate || '';
  apiData.superTaxmgmt = personData.super_taxmgmt || '';
  apiData.superLowins = personData.super_lowins || '';
  apiData.superInsfeatures = personData.super_insfeatures || '';
  apiData.superImportance = personData.super_importance || '';

  apiData.person = person || '';

  if (clientId) {
    apiData.clientId = clientId;
  }

  return apiData;
}

// ──────────────────────────────────────────────────────────────
// Inbound mapping: API camelCase → frontend quick[person] shape
// ──────────────────────────────────────────────────────────────

function mapQuickFromApi(record) {
  if (!record) return null;
  const n = normaliseRecord(record);
  return {
    id: n.id || null,
    person: n.person || '',
    ret_age: n.retAge || '',
    ret_importance: n.retImportance || '',
    desired_income: n.desiredIncome != null ? String(n.desiredIncome) : '',
    income_rank: n.incomeRank || '',
    estate_amount: n.estateAmount != null ? String(n.estateAmount) : '',
    estate_importance: n.estateImportance || '',
    funeral_bond: n.funeralBond || '',
    funeral_amount: n.funeralAmount != null ? String(n.funeralAmount) : '',
    funeral_importance: n.funeralImportance || '',
    ins_death: n.insDeath || '',
    ins_tpd: n.insTpd || '',
    ins_income: n.insIncome || '',
    ins_trauma: n.insTrauma || '',
    ins_creditors: n.insCreditors || '',
    ins_guarantee: n.insGuarantee || '',
    protection_importance: n.protectionImportance || '',
    super_lowcost: n.superLowcost || '',
    super_lowcost_inv: n.superLowcostInv || '',
    super_top_mgr: n.superTopMgr || '',
    super_term: n.superTerm || '',
    super_shares_au: n.superSharesAu || '',
    super_shares_int: n.superSharesInt || '',
    super_broad: n.superBroad || '',
    super_sri: n.superSri || '',
    super_model: n.superModel || '',
    super_lifecycle: n.superLifecycle || '',
    super_rebalance: n.superRebalance || '',
    super_taxeff: n.superTaxeff || '',
    super_switches: n.superSwitches || '',
    super_uptodate: n.superUptodate || '',
    super_taxmgmt: n.superTaxmgmt || '',
    super_lowins: n.superLowins || '',
    super_insfeatures: n.superInsfeatures || '',
    super_importance: n.superImportance || '',
  };
}

// ──────────────────────────────────────────────────────────────
// Advice Quick API
// ──────────────────────────────────────────────────────────────

export const adviceQuickApi = {
  /**
   * GET all advice-quick records for a client.
   * @param {string} clientId - The client ID (GUID)
   * @returns {Promise<Array>} Quick records in frontend shape
   */
  async getAll(clientId) {
    const response = await axiosInstance.get(`/advice-quick?clientId=${clientId}`);
    const raw = response.data;
    const arr = Array.isArray(raw) ? raw : (raw.items || raw.data || raw.value || []);
    return arr.map(mapQuickFromApi);
  },

  /**
   * Create or update a quick record for a person.
   * If existingId is provided, PUT; otherwise POST.
   * @param {string} clientId - The client ID (GUID)
   * @param {string} person - Person key (e.g. "client1", "client2")
   * @param {object} personData - Quick fields (frontend shape)
   * @param {string} [existingId] - Existing record ID for update
   * @returns {Promise<object>} Saved record in frontend shape
   */
  async upsert(clientId, person, personData, existingId) {
    const payload = sanitisePayload(buildQuickPayload(personData, clientId, person));
    let response;
    if (existingId) {
      response = await axiosInstance.put(`/advice-quick/${existingId}`, payload);
    } else {
      response = await axiosInstance.post('/advice-quick', { ...payload, clientId });
    }
    return mapQuickFromApi(normaliseRecord(response.data));
  },
};
