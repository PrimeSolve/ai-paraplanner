// Blends a hex colour with white at the given alpha percentage.
// alphaPct: 0 = white, 100 = full colour.
// Returns a hex string e.g. "#D0D9E8"
export function tintColour(hexPrimary, alphaPct) {
  if (!hexPrimary || !/^#[0-9A-Fa-f]{6}$/.test(hexPrimary)) return '#EEEEEE';
  const alpha = alphaPct / 100;
  const r = parseInt(hexPrimary.slice(1, 3), 16);
  const g = parseInt(hexPrimary.slice(3, 5), 16);
  const b = parseInt(hexPrimary.slice(5, 7), 16);
  const tr = Math.round(r * alpha + 255 * (1 - alpha));
  const tg = Math.round(g * alpha + 255 * (1 - alpha));
  const tb = Math.round(b * alpha + 255 * (1 - alpha));
  return `#${tr.toString(16).padStart(2, '0')}${tg.toString(16).padStart(2, '0')}${tb.toString(16).padStart(2, '0')}`;
}
