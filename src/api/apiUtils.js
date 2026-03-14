/**
 * Fields that are read-only or server-managed and should never be
 * included in POST / PUT request bodies.
 */
const READ_ONLY_FIELDS = new Set([
  'id',
  'clientId',
  'tenantId',
  'client_id',
  'tenant_id',
  'createdAt',
  'created_at',
  'modifiedAt',
  'modified_at',
]);

/**
 * Sanitise an outbound API payload:
 *  1. Strip read-only / server-managed fields.
 *  2. Convert empty strings "" → null.
 *  3. Recurse into nested plain objects (but NOT arrays — those
 *     contain sub-resources like portfolio items / adjustments
 *     that need their own handling).
 *
 * @param {object} data - The payload object to sanitise
 * @returns {object} A new object with the above transformations applied
 */
export function sanitisePayload(data) {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object' || Array.isArray(data)) return data;

  const result = {};
  for (const [key, value] of Object.entries(data)) {
    if (READ_ONLY_FIELDS.has(key)) continue;

    if (value === '') {
      result[key] = null;
    } else if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      !(value instanceof Date)
    ) {
      result[key] = sanitisePayload(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}
