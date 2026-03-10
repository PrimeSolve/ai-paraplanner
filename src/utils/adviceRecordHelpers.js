import axiosInstance from '@/api/axiosInstance';

/**
 * Creates an immutable AdviceRecord (point-in-time snapshot) via the
 * client-scoped advice-history API.
 *
 * POST /api/v1/clients/{clientId}/advice-history
 *
 * The backend stamps createdAt, adviserId, tenantId, and createdBy from JWT.
 * SnapshotJson is frozen and never updated after creation.
 *
 * Silently fails if the API is not available — callers should not block
 * the primary user flow if record creation fails.
 *
 * @param {object} params
 * @param {string} params.clientId     - Client UUID (required)
 * @param {string} params.type         - "SOA Request" | "Fact Find" | "Cashflow Model"
 * @param {string} params.name         - Human-readable name for the record
 * @param {object} params.snapshotData - The object to freeze as JSON
 * @returns {Promise<object|null>} The created record or null on failure
 */
export async function createAdviceRecord({ clientId, type, name, snapshotData }) {
  try {
    if (!clientId) {
      console.warn('[AdviceRecord] No clientId provided, skipping.');
      return null;
    }

    const response = await axiosInstance.post(
      `/clients/${clientId}/advice-history`,
      {
        type,
        name,
        snapshotJson: JSON.stringify(snapshotData || {}),
      }
    );

    return response.data;
  } catch (error) {
    console.error('[AdviceRecord] Failed to create advice record:', error);
    return null;
  }
}

/**
 * Fetches all advice history records for a client (without snapshotJson).
 *
 * @param {string} clientId
 * @returns {Promise<Array>}
 */
export async function listAdviceRecords(clientId) {
  try {
    const response = await axiosInstance.get(`/clients/${clientId}/advice-history`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('[AdviceRecord] Failed to list advice records:', error);
    return [];
  }
}

/**
 * Fetches a single advice record including its snapshotJson.
 *
 * @param {string} clientId
 * @param {string} recordId
 * @returns {Promise<object|null>}
 */
export async function getAdviceRecord(clientId, recordId) {
  try {
    const response = await axiosInstance.get(`/clients/${clientId}/advice-history/${recordId}`);
    return response.data;
  } catch (error) {
    console.error('[AdviceRecord] Failed to get advice record:', error);
    return null;
  }
}
