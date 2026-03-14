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
// Portfolio item mapping
// ──────────────────────────────────────────────────────────────

function buildPortfolioItemPayload(item) {
  return {
    assetName: item.asset_name || '',
    assetCode: item.asset_code || '',
    amount: item.amount ? parseFloat(item.amount) : null,
    allocationPct: item.allocation_pct ? parseFloat(item.allocation_pct) : null,
  };
}

function mapPortfolioItemFromApi(item) {
  if (!item) return null;
  const n = normaliseRecord(item);
  return {
    id: n.id || null,
    asset_name: n.assetName || '',
    asset_code: n.assetCode || '',
    amount: n.amount != null ? String(n.amount) : '',
    allocation_pct: n.allocationPct != null ? String(n.allocationPct) : '',
  };
}

// ──────────────────────────────────────────────────────────────
// Outbound mapping: frontend wrap → API payload
// ──────────────────────────────────────────────────────────────

function buildWrapPayload(data, clientGuidMap) {
  const apiData = {};

  apiData.platformName = data.platform_name || '';
  apiData.owner = data.owner || '';
  apiData.accountNumber = data.account_number || '';
  apiData.balance = data.balance ? parseFloat(data.balance) : null;

  const fees = data.fees || {};
  apiData.adminFeeType = fees.admin_fee_type || '';
  apiData.adminFeeValue = fees.admin_fee_value ? parseFloat(fees.admin_fee_value) : null;
  apiData.adviserFeeType = fees.adviser_fee_type || '';
  apiData.adviserFeeValue = fees.adviser_fee_value ? parseFloat(fees.adviser_fee_value) : null;
  apiData.otherFees = fees.other_fees || '';

  if (data.portfolio && Array.isArray(data.portfolio)) {
    apiData.portfolio = data.portfolio.map(buildPortfolioItemPayload);
  }

  if (clientGuidMap) {
    apiData.clientId = clientGuidMap.client1 || null;
  }

  return apiData;
}

// ──────────────────────────────────────────────────────────────
// Inbound mapping: API wrap → frontend shape
// ──────────────────────────────────────────────────────────────

function mapWrapFromApi(record) {
  if (!record) return null;
  const n = normaliseRecord(record);
  return {
    id: n.id || null,
    platform_name: n.platformName || '',
    owner: n.owner || '',
    account_number: n.accountNumber || '',
    balance: n.balance != null ? String(n.balance) : '',
    fees: {
      admin_fee_type: n.adminFeeType || '',
      admin_fee_value: n.adminFeeValue != null ? String(n.adminFeeValue) : '',
      adviser_fee_type: n.adviserFeeType || '',
      adviser_fee_value: n.adviserFeeValue != null ? String(n.adviserFeeValue) : '',
      other_fees: n.otherFees || '',
    },
    portfolio: Array.isArray(n.portfolio) ? n.portfolio.map(mapPortfolioItemFromApi) : [],
  };
}

// ──────────────────────────────────────────────────────────────
// Investment Wraps API
// ──────────────────────────────────────────────────────────────

export const investmentWrapsApi = {
  async getAll(clientId) {
    const response = await axiosInstance.get(`/investment-wraps?clientId=${clientId}`);
    const raw = response.data;
    const arr = Array.isArray(raw) ? raw : (raw.items || raw.data || raw.value || []);
    return arr.map(mapWrapFromApi);
  },

  async create(data, clientGuidMap) {
    const apiData = buildWrapPayload(data, clientGuidMap);
    const response = await axiosInstance.post('/investment-wraps', apiData);
    return mapWrapFromApi(response.data);
  },

  async update(id, data) {
    const apiData = buildWrapPayload(data);
    const response = await axiosInstance.put(`/investment-wraps/${id}`, apiData);
    return mapWrapFromApi(response.data);
  },

  async remove(id) {
    await axiosInstance.delete(`/investment-wraps/${id}`);
  },

  async addPortfolioItem(wrapId, item) {
    const apiData = buildPortfolioItemPayload(item);
    const response = await axiosInstance.post(`/investment-wraps/${wrapId}/portfolio`, apiData);
    return mapPortfolioItemFromApi(response.data);
  },

  async removePortfolioItem(wrapId, itemId) {
    await axiosInstance.delete(`/investment-wraps/${wrapId}/portfolio/${itemId}`);
  },
};
