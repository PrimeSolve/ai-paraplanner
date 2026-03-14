import axiosInstance from './axiosInstance';

function normaliseRecord(record) {
  if (!record) return record;
  if (Array.isArray(record)) return record.map(normaliseRecord);
  if (record._id && !record.id) {
    const { _id, ...rest } = record;
    return { id: _id, ...rest };
  }
  return record;
}

const FIELD_MAP = {
  ret_age: 'retAge',
  ret_importance: 'retImportance',
  desired_income: 'desiredIncome',
  income_rank: 'incomeRank',
  estate_amount: 'estateAmount',
  estate_importance: 'estateImportance',
  funeral_bond: 'funeralBond',
  funeral_amount: 'funeralAmount',
  funeral_importance: 'funeralImportance',
  ins_death: 'insDeath',
  ins_tpd: 'insTpd',
  ins_income: 'insIncome',
  ins_trauma: 'insTrauma',
  ins_creditors: 'insCreditors',
  ins_guarantee: 'insGuarantee',
  protection_importance: 'protectionImportance',
  super_lowcost: 'superLowcost',
  super_lowcost_inv: 'superLowcostInv',
  super_top_mgr: 'superTopMgr',
  super_term: 'superTerm',
  super_shares_au: 'superSharesAu',
  super_shares_int: 'superSharesInt',
  super_broad: 'superBroad',
  super_sri: 'superSri',
  super_model: 'superModel',
  super_lifecycle: 'superLifecycle',
  super_rebalance: 'superRebalance',
  super_taxeff: 'superTaxeff',
  super_switches: 'superSwitches',
  super_uptodate: 'superUptodate',
  super_taxmgmt: 'superTaxmgmt',
  super_lowins: 'superLowins',
  super_insfeatures: 'superInsfeatures',
  super_importance: 'superImportance',
};

const DECIMAL_FIELDS = new Set(['desired_income', 'estate_amount', 'funeral_amount']);

// Reverse map: camelCase → snake_case
const REVERSE_MAP = {};
for (const [snake, camel] of Object.entries(FIELD_MAP)) {
  REVERSE_MAP[camel] = snake;
}

function buildOutbound(data, clientId, owner) {
  const apiData = { clientId, owner };
  for (const [snake, camel] of Object.entries(FIELD_MAP)) {
    const val = data[snake];
    if (DECIMAL_FIELDS.has(snake)) {
      apiData[camel] = val ? parseFloat(val) : null;
    } else {
      apiData[camel] = val !== undefined ? val : '';
    }
  }
  return apiData;
}

function mapInbound(record) {
  if (!record) return null;
  const n = normaliseRecord(record);
  const result = { id: n.id, owner: n.owner || '' };
  for (const [camel, snake] of Object.entries(REVERSE_MAP)) {
    const val = n[camel];
    if (DECIMAL_FIELDS.has(snake)) {
      result[snake] = val != null ? String(val) : '';
    } else {
      result[snake] = val !== undefined ? val : '';
    }
  }
  return result;
}

export const adviceQuickApi = {
  async getAll(clientId) {
    const response = await axiosInstance.get(`/advice-quick?clientId=${clientId}`);
    const raw = response.data;
    const arr = Array.isArray(raw) ? raw : (raw.items || raw.data || raw.value || []);
    return arr.map(r => mapInbound(normaliseRecord(r)));
  },

  async upsert(clientId, owner, data) {
    const apiData = buildOutbound(data, clientId, owner);

    // Look for existing record for this owner
    const all = await this.getAll(clientId);
    const existing = all.find(r => r.owner === owner);

    if (existing && existing.id) {
      const response = await axiosInstance.put(`/advice-quick/${existing.id}`, apiData);
      return mapInbound(normaliseRecord(response.data));
    } else {
      const response = await axiosInstance.post('/advice-quick', apiData);
      return mapInbound(normaliseRecord(response.data));
    }
  },

  async remove(id) {
    await axiosInstance.delete(`/advice-quick/${id}`);
  },
};
