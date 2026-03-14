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

export const adviceReasonsApi = {
  async getByClientId(clientId) {
    const response = await axiosInstance.get(`/advice-reasons?clientId=${clientId}`);
    const raw = response.data;
    const arr = Array.isArray(raw) ? raw : (raw.items || raw.data || raw.value || []);
    const records = arr.map(normaliseRecord);
    if (records.length === 0) return null;
    const rec = records[0];
    return {
      id: rec.id,
      reasons: JSON.parse(rec.reasons || '[]'),
    };
  },

  async upsert(clientId, reasonsArray) {
    const payload = {
      clientId,
      reasons: JSON.stringify(reasonsArray),
    };

    // Try to find existing record
    const existing = await this.getByClientId(clientId);

    if (existing && existing.id) {
      const response = await axiosInstance.put(`/advice-reasons/${existing.id}`, payload);
      return normaliseRecord(response.data);
    } else {
      const response = await axiosInstance.post('/advice-reasons', payload);
      return normaliseRecord(response.data);
    }
  },
};
