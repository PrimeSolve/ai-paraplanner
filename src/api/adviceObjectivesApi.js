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

function buildOutbound(data, clientId) {
  const apiData = {};
  if (clientId) apiData.clientId = clientId;

  apiData.who = data.o_who ? JSON.stringify(data.o_who) : null;
  apiData.objType = data.o_type || '';
  apiData.objProperty = data.o_property || '';
  apiData.objDebt = data.o_debt || '';
  apiData.objAsset = data.o_asset || '';
  apiData.objStart = data.o_start || '';
  apiData.objEnd = data.o_end || '';
  apiData.objFreq = data.o_freq || '';
  apiData.objAmount = data.o_amount ? parseFloat(data.o_amount) : null;
  apiData.objImportance = data.o_importance || '';
  apiData.objWhy = data.o_why || '';

  return apiData;
}

function mapInbound(record) {
  if (!record) return null;
  const n = normaliseRecord(record);
  return {
    id: n.id || null,
    o_who: n.who ? JSON.parse(n.who) : [],
    o_type: n.objType || '',
    o_property: n.objProperty || '',
    o_debt: n.objDebt || '',
    o_asset: n.objAsset || '',
    o_start: n.objStart || '',
    o_end: n.objEnd || '',
    o_freq: n.objFreq || '',
    o_amount: n.objAmount != null ? String(n.objAmount) : '',
    o_importance: n.objImportance || '',
    o_why: n.objWhy || '',
  };
}

export const adviceObjectivesApi = {
  async getAll(clientId) {
    const response = await axiosInstance.get(`/advice-objectives?clientId=${clientId}`);
    const raw = response.data;
    const arr = Array.isArray(raw) ? raw : (raw.items || raw.data || raw.value || []);
    return arr.map(r => mapInbound(normaliseRecord(r)));
  },

  async create(clientId, data) {
    const apiData = buildOutbound(data, clientId);
    const response = await axiosInstance.post('/advice-objectives', apiData);
    return mapInbound(normaliseRecord(response.data));
  },

  async update(id, data) {
    const apiData = buildOutbound(data);
    const response = await axiosInstance.put(`/advice-objectives/${id}`, apiData);
    return mapInbound(normaliseRecord(response.data));
  },

  async remove(id) {
    await axiosInstance.delete(`/advice-objectives/${id}`);
  },
};
