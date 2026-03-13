import axiosInstance from './axiosInstance';

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
// PayFrequency enum mapping
// ──────────────────────────────────────────────────────────────

const PAY_FREQ_TO_ENUM = { "52": 0, "26": 1, "12": 2 };
const ENUM_TO_PAY_FREQ = { 0: "52", 1: "26", 2: "12" };

// ──────────────────────────────────────────────────────────────
// Build API payload — frontend snake_case → API camelCase
// ──────────────────────────────────────────────────────────────

function buildIncomePayload(data, clientId) {
  const parseBool = (v) => v === "1" ? true : false;
  const parseNum = (v) => (v !== '' && v !== null && v !== undefined) ? (parseFloat(v) || 0) : 0;
  const parseNumOrNull = (v) => (v !== '' && v !== null && v !== undefined) ? (parseFloat(v) || null) : null;

  return {
    clientId,
    incomeType: 0,
    iGross: parseNum(data.i_gross),
    iSuperInc: parseBool(data.i_super_inc),
    iFbt: parseBool(data.i_fbt),
    iFbtValue: parseNumOrNull(data.i_fbt_value),
    iBonus: parseNumOrNull(data.i_bonus),
    iIncrease: parseNumOrNull(data.i_increase),
    iNontax: parseBool(data.i_nontax),
    iPayFreq: PAY_FREQ_TO_ENUM[data.i_pay_freq] ?? 1,
    iCgtLosses: parseNumOrNull(data.i_cgt_losses),
    iRevenueLosses: parseNumOrNull(data.i_revenue_losses),
  };
}

// ──────────────────────────────────────────────────────────────
// Map API response → frontend snake_case
// ──────────────────────────────────────────────────────────────

function mapIncomeToFrontend(rec) {
  if (!rec) return null;
  const r = normaliseRecord(rec);
  const toStr = (v) => (v !== null && v !== undefined) ? String(v) : "";
  const boolToRadio = (v) => v === true ? "1" : "2";

  return {
    id: r.id || null,
    i_gross: toStr(r.iGross),
    i_super_inc: boolToRadio(r.iSuperInc),
    i_fbt: boolToRadio(r.iFbt),
    i_fbt_value: toStr(r.iFbtValue),
    i_bonus: toStr(r.iBonus),
    i_increase: toStr(r.iIncrease),
    i_nontax: boolToRadio(r.iNontax),
    i_pay_freq: ENUM_TO_PAY_FREQ[r.iPayFreq] || "26",
    i_cgt_losses: toStr(r.iCgtLosses),
    i_revenue_losses: toStr(r.iRevenueLosses),
  };
}

// ──────────────────────────────────────────────────────────────
// Adjustment payload — frontend → API
// ──────────────────────────────────────────────────────────────

function buildAdjustmentPayload(adj) {
  return {
    adjType: adj.adj_type,
    adjAmount: (adj.adj_amount !== '' && adj.adj_amount !== null && adj.adj_amount !== undefined) ? (parseFloat(adj.adj_amount) || null) : null,
    adjStart: (adj.adj_start !== '' && adj.adj_start !== null && adj.adj_start !== undefined) ? (parseInt(adj.adj_start, 10) || null) : null,
    adjEnd: (adj.adj_end !== '' && adj.adj_end !== null && adj.adj_end !== undefined) ? (parseInt(adj.adj_end, 10) || null) : null,
    adjNotes: adj.adj_notes,
  };
}

// ──────────────────────────────────────────────────────────────
// Map API adjustment → frontend
// ──────────────────────────────────────────────────────────────

function mapAdjustmentToFrontend(adj) {
  if (!adj) return null;
  const r = normaliseRecord(adj);
  const toStr = (v) => (v !== null && v !== undefined) ? String(v) : "";
  return {
    id: r.id || null,
    adj_type: r.adjType || "",
    adj_amount: toStr(r.adjAmount),
    adj_start: toStr(r.adjStart),
    adj_end: toStr(r.adjEnd),
    adj_notes: r.adjNotes || "",
  };
}

// ──────────────────────────────────────────────────────────────
// Incomes API
// ──────────────────────────────────────────────────────────────

export const incomesApi = {
  /**
   * GET /incomes?clientId={clientId} — return first record or null.
   */
  async getByClientId(clientId) {
    const response = await axiosInstance.get(`/incomes?clientId=${clientId}`);
    const raw = response.data;
    const arr = Array.isArray(raw) ? raw : (raw.items || raw.data || raw.value || []);
    if (arr.length === 0) return null;
    const record = normaliseRecord(arr[0]);
    const mapped = mapIncomeToFrontend(record);
    // Map adjustments if present
    const adjustments = (record.adjustments || []).map(mapAdjustmentToFrontend);
    return { ...mapped, adjustments };
  },

  /**
   * Upsert: if data has id → PUT /incomes/{id}, else POST /incomes with clientId.
   */
  async upsert(clientId, data) {
    const payload = buildIncomePayload(data, clientId);
    let response;
    if (data.id) {
      response = await axiosInstance.put(`/incomes/${data.id}`, payload);
    } else {
      response = await axiosInstance.post('/incomes', payload);
    }
    const record = normaliseRecord(response.data);
    const mapped = mapIncomeToFrontend(record);
    const adjustments = (record.adjustments || []).map(mapAdjustmentToFrontend);
    return { ...mapped, adjustments };
  },

  /**
   * POST /incomes/{incomeId}/adjustments
   */
  async addAdjustment(incomeId, adj) {
    const payload = buildAdjustmentPayload(adj);
    const response = await axiosInstance.post(`/incomes/${incomeId}/adjustments`, payload);
    return mapAdjustmentToFrontend(normaliseRecord(response.data));
  },

  /**
   * DELETE /incomes/{incomeId}/adjustments/{adjId}
   */
  async removeAdjustment(incomeId, adjId) {
    await axiosInstance.delete(`/incomes/${incomeId}/adjustments/${adjId}`);
  },
};
