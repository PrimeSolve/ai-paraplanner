import { base44 } from '@/api/base44Client';

/**
 * Creates an AdviceRecord with the specified type and snapshots.
 * Silently fails if the API is not available — callers should not block
 * the primary user flow if record creation fails.
 *
 * @param {object} params
 * @param {string} params.recordType - One of: 'fact_find', 'strategy_recommendations', 'cashflow_model', 'soa_document', 'compliance_review'
 * @param {string} params.title - Human-readable title for the record
 * @param {string} params.status - Record status (e.g. 'Completed', 'Pending', 'Approved')
 * @param {string} params.clientId - Client UUID
 * @param {string} params.adviserId - Adviser (user) UUID
 * @param {object} [params.linkedEntities] - Optional linked entity IDs
 * @param {string} [params.linkedEntities.factFindId]
 * @param {string} [params.linkedEntities.adviceRequestId]
 * @param {string} [params.linkedEntities.cashflowModelId]
 * @param {string} [params.linkedEntities.soaDocumentId]
 * @param {object} [params.snapshots] - Optional frozen JSON snapshots
 * @param {object} [params.snapshots.factFind] - Fact find data at this point in time
 * @param {object} [params.snapshots.adviceModel] - Advice model data at this point in time
 * @param {object} [params.snapshots.projection] - Projection/cashflow results at this point in time
 * @param {string} [params.notes] - Adviser or compliance notes
 * @param {string} [params.createdBy] - Email or name of the creating user
 * @returns {Promise<object|null>} The created AdviceRecord or null on failure
 */
export async function createAdviceRecord({
  recordType,
  title,
  status,
  clientId,
  adviserId,
  linkedEntities = {},
  snapshots = {},
  notes = null,
  createdBy = null,
}) {
  try {
    const record = await base44.entities.AdviceRecord.create({
      record_type: recordType,
      title,
      status,
      client_id: clientId,
      adviser_id: adviserId,
      fact_find_id: linkedEntities.factFindId || null,
      advice_request_id: linkedEntities.adviceRequestId || null,
      cashflow_model_id: linkedEntities.cashflowModelId || null,
      soa_document_id: linkedEntities.soaDocumentId || null,
      fact_find_snapshot: snapshots.factFind ? JSON.stringify(snapshots.factFind) : null,
      advice_model_snapshot: snapshots.adviceModel ? JSON.stringify(snapshots.adviceModel) : null,
      projection_snapshot: snapshots.projection ? JSON.stringify(snapshots.projection) : null,
      notes,
      created_by: createdBy,
    });

    return record;
  } catch (error) {
    console.error('[AdviceRecord] Failed to create advice record:', error);
    return null;
  }
}

/**
 * Supersedes an existing AdviceRecord by setting its status to 'Superseded'
 * and linking it to the new record.
 *
 * @param {string} oldRecordId - The ID of the record being superseded
 * @param {string} newRecordId - The ID of the new record that supersedes it
 * @returns {Promise<void>}
 */
export async function supersededAdviceRecord(oldRecordId, newRecordId) {
  try {
    await base44.entities.AdviceRecord.update(oldRecordId, {
      status: 'Superseded',
      superseded_by_id: newRecordId,
    });
  } catch (error) {
    console.error('[AdviceRecord] Failed to supersede record:', error);
  }
}
