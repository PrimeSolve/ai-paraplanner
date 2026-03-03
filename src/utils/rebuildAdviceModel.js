/**
 * rebuildAdviceModel.js
 *
 * Helper that re-fetches the current SOA Request, rebuilds the adviceModel
 * from the raw form data, and saves it back. Called after every SOA page save.
 */

import { base44 } from '@/api/base44Client';
import { buildAdviceModel } from './adviceModelBuilder';

/**
 * Rebuild and persist the adviceModel for a given SOA Request.
 *
 * @param {string|number} soaRequestId - The SOA Request ID
 * @returns {Promise<object>} The generated adviceModel
 */
export async function rebuildAdviceModel(soaRequestId) {
  if (!soaRequestId) return null;

  try {
    // Re-fetch the latest SOA Request with all sections
    const requests = await base44.entities.SOARequest.filter({ id: soaRequestId });
    const soaRequest = requests[0];
    if (!soaRequest) return null;

    // Build the unified adviceModel from raw form data
    const adviceModel = buildAdviceModel(soaRequest);

    // Persist it back to the record
    await base44.entities.SOARequest.update(soaRequestId, {
      advice_model: adviceModel,
    });

    return adviceModel;
  } catch (error) {
    console.error('Failed to rebuild adviceModel:', error);
    return null;
  }
}
