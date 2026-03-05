export function formatNumber(val) {
  if (typeof val !== "number") return val;
  return val.toLocaleString("en-AU");
}
