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
// Outbound mapping: frontend income → API payload
// ──────────────────────────────────────────────────────────────

function buildIncomePayload(data, clientId) {
  const apiData = {};

  apiData.iGross = data.i_gross ? parseFloat(data.i_gross) : null;
  apiData.iSuperInc = data.i_super_inc || null;
  apiData.iFbt = data.i_fbt || null;
  apiData.iFbtValue = data.i_fbt_value ? parseFloat(data.i_fbt_value) : null;
  apiData.iBonus = data.i_bonus ? parseFloat(data.i_bonus) : null;
  apiData.iIncrease = data.i_increase || null;
  apiData.iNontax = data.i_nontax || null;
  apiData.iPayFreq = data.i_pay_freq || null;
  apiData.iCgtLosses = data.i_cgt_losses ? parseFloat(data.i_cgt_losses) : null;
  apiData.iRevenueLosses = data.i_revenue_losses ? parseFloat(data.i_revenue_losses) : null;

  if (clientId) {
    apiData.clientId = clientId;
  }

  return apiData;
}

// ──────────────────────────────────────────────────────────────
// Inbound mapping: API income → frontend shape
// ──────────────────────────────────────────────────────────────

function mapIncomeFromApi(record) {
  if (!record) return null;
  const n = normaliseRecord(record);
  return {
    id: n.id || null,
    i_gross: n.iGross != null ? String(n.iGross) : '',
    i_super_inc: n.iSuperInc || '',
    i_fbt: n.iFbt || '',
    i_fbt_value: n.iFbtValue != null ? String(n.iFbtValue) : '',
    i_bonus: n.iBonus != null ? String(n.iBonus) : '',
    i_increase: n.iIncrease || '',
    i_nontax: n.iNontax || '',
    i_pay_freq: n.iPayFreq || '',
    i_cgt_losses: n.iCgtLosses != null ? String(n.iCgtLosses) : '',
    i_revenue_losses: n.iRevenueLosses != null ? String(n.iRevenueLosses) : '',
  };
}

// ──────────────────────────────────────────────────────────────
// Incomes API
// ──────────────────────────────────────────────────────────────

export const incomesApi = {
  /**
   * GET income record for a client (returns first record or null).
   * @param {string} clientId - The client ID (GUID)
   * @returns {Promise<object|null>} Income record in frontend shape, or null
   */
  async getByClientId(clientId) {
    const response = await axiosInstance.get(`/incomes?clientId=${clientId}`);
    const raw = response.data;
    const arr = Array.isArray(raw) ? raw : (raw.items || raw.data || raw.value || []);
    if (arr.length === 0) return null;
    return mapIncomeFromApi(arr[0]);
  },

  /**
   * Create or update an income record.
   * If data.id exists, PUT /incomes/{id}; otherwise POST /incomes with clientId.
   * @param {string} clientId - The client ID (GUID)
   * @param {object} data - Income fields (frontend shape)
   * @returns {Promise<object>} Saved income record in frontend shape
   */
  async upsert(clientId, data) {
    const payload = sanitisePayload(buildIncomePayload(data, clientId));
    payload.clientId = clientId;
    let response;
    if (data.id) {
      response = await axiosInstance.put(`/incomes/${data.id}`, payload);
    } else {
      response = await axiosInstance.post('/incomes', payload);
    }
    return mapIncomeFromApi(normaliseRecord(response.data));
  },
};
