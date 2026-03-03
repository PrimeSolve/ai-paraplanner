/**
 * Safe date formatting utilities for the AI Paraplanner app.
 * All functions gracefully handle null, undefined, empty, and invalid dates.
 */

/**
 * Formats a date value using Intl.DateTimeFormat.
 * @param {string|Date|number} dateValue - The date to format
 * @param {Intl.DateTimeFormatOptions} [options] - Intl options
 * @param {string} [locale='en-AU'] - Locale string
 * @param {string} [fallback='\u2014'] - Fallback if date is invalid
 * @returns {string}
 */
export function formatDate(dateValue, options, locale = 'en-AU', fallback = '\u2014') {
  if (dateValue == null || dateValue === '') return fallback;
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) return fallback;
  const defaults = { day: '2-digit', month: 'short', year: 'numeric' };
  return date.toLocaleDateString(locale, options || defaults);
}

/**
 * Formats a date as a relative time string (e.g. "5 mins ago", "Yesterday").
 * Falls back to formatDate() for dates older than ~2 weeks.
 * @param {string|Date|number} dateValue
 * @param {string} [fallback='\u2014']
 * @returns {string}
 */
export function formatRelativeDate(dateValue, fallback = '\u2014') {
  if (dateValue == null || dateValue === '') return fallback;
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) return fallback;

  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 14) return `${diffDays} days ago`;
  if (diffDays < 28) return `${Math.floor(diffDays / 7)} weeks ago`;

  return formatDate(dateValue);
}

/**
 * Formats a date as "January 2024" style for "Member since" displays.
 * @param {string|Date|number} dateValue
 * @param {string} [fallback='\u2014']
 * @returns {string}
 */
export function formatMemberSince(dateValue, fallback = '\u2014') {
  if (dateValue == null || dateValue === '') return fallback;
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' });
}
