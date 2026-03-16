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
// Outbound mapping: frontend bond → API payload
// ──────────────────────────────────────────────────────────────

function buildBondPayload(data, clientGuidMap) {
  const apiData = {};

  apiData.productName = data.product_name || '';
  apiData.owner = data.owner || '';
  apiData.policyNumber = data.policy_number || '';
  apiData.balance = data.balance ? parseFloat(data.balance) : null;
  apiData.commencementDate = data.commencement_date || null;
  apiData.taxTreatment = data.tax_treatment || '';

  if (data.portfolio && Array.isArray(data.portfolio)) {
    apiData.portfolio = data.portfolio.map(buildPortfolioItemPayload);
  }

  if (clientGuidMap) {
    apiData.clientId = clientGuidMap.client1 || null;
  }

  return apiData;
}

// ──────────────────────────────────────────────────────────────
// Inbound mapping: API bond → frontend shape
// ──────────────────────────────────────────────────────────────

function mapBondFromApi(record) {
  if (!record) return null;
  const n = normaliseRecord(record);
  return {
    id: n.id || null,
    product_name: n.productName || '',
    owner: n.owner || '',
    policy_number: n.policyNumber || '',
    balance: n.balance != null ? String(n.balance) : '',
    commencement_date: n.commencementDate != null ? String(n.commencementDate) : '',
    tax_treatment: n.taxTreatment || '',
    portfolio: Array.isArray(n.portfolio) ? n.portfolio.map(mapPortfolioItemFromApi) : [],
  };
}

// ──────────────────────────────────────────────────────────────
// Investment Bonds API
// ──────────────────────────────────────────────────────────────

export const investmentBondsApi = {
  async getAll(clientId) {
    const response = await axiosInstance.get(`/investment-bonds?clientId=${clientId}`);
    const raw = response.data;
    const arr = Array.isArray(raw) ? raw : (raw.items || raw.data || raw.value || []);
    return arr.map(mapBondFromApi);
  },

  async create(data, clientGuidMap) {
    const payload = sanitisePayload(buildBondPayload(data, clientGuidMap));
    payload.balance = parseFloat(payload.balance) || null;
    const response = await axiosInstance.post('/investment-bonds', { ...payload, clientId: clientGuidMap?.client1 || null });
    return mapBondFromApi(response.data);
  },

  async update(id, data) {
    const payload = sanitisePayload(buildBondPayload(data));
    payload.balance = parseFloat(payload.balance) || null;
    const response = await axiosInstance.put(`/investment-bonds/${id}`, payload);
    return mapBondFromApi(response.data);
  },

  async remove(id) {
    await axiosInstance.delete(`/investment-bonds/${id}`);
  },

  async addPortfolioItem(bondId, item) {
    const apiData = buildPortfolioItemPayload(item);
    const response = await axiosInstance.post(`/investment-bonds/${bondId}/portfolio`, apiData);
    return mapPortfolioItemFromApi(response.data);
  },

  async removePortfolioItem(bondId, itemId) {
    await axiosInstance.delete(`/investment-bonds/${bondId}/portfolio/${itemId}`);
  },
};
