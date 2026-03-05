import React from "react";

// ─────────────────────────────────────────────────────────────
// ENTITY REGISTRY — Centralised icons, colours, and labels
// ─────────────────────────────────────────────────────────────
// Every entity in the platform gets a consistent icon + colour.
// Entity types share the same icon shape but each instance has
// a unique colour. Use ENTITY_MAP[name] or resolveEntity(name)
// to look up any entity anywhere in the app.

export const ENTITY_REGISTRY = {
  // ── Principals (👤 person icon, each unique colour) ──
  principals: [
    { id: "catherine",    name: "Catherine",    color: "#4F46E5", icon: "👤" }, // Indigo
    { id: "paul",         name: "Paul Andrew",  color: "#0891B2", icon: "👤" }, // Cyan
  ],
  // ── Joint ──
  joint: [
    { id: "joint",        name: "Joint",        color: "#7C3AED", icon: "👥" }, // Violet
  ],
  // ── Trusts (🏛️ — built dynamically from factFind.trusts) ──
  trusts: [],
  // ── Companies (🏢 — built dynamically from factFind.companies) ──
  companies: [],
  // ── SMSF (🔒 lock icon, each unique colour) ──
  smsf: [
    { id: "smsf-cat-acc",   name: "SMSF - Catherine",         color: "#6D28D9", icon: "🔒" }, // Purple
    { id: "smsf-paul-acc",  name: "SMSF - Paul Andrew",       color: "#4338CA", icon: "🔒" }, // Deep indigo
    { id: "smsf-cat-pen",   name: "SMSF - Catherine Pension",  color: "#7E22CE", icon: "🔒" }, // Violet
    { id: "smsf-paul-pen",  name: "SMSF - Paul Andrew Pension",color: "#5B21B6", icon: "🔒" }, // Deep purple
    { id: "smsf-family",    name: "Smith Family SMSF",          color: "#6366F1", icon: "🔒" }, // Indigo
  ],
  // ── Children / Dependants (🧒 child icon, each unique colour) ──
  dependants: [
    { id: "sarah",        name: "Sarah",        color: "#DB2777", icon: "🧒" }, // Pink
    { id: "matthew",      name: "Matthew",      color: "#E11D48", icon: "🧒" }, // Rose
    { id: "madeline",     name: "Madeline",     color: "#C026D3", icon: "🧒" }, // Fuchsia
    { id: "harrison",     name: "Harrison",     color: "#9333EA", icon: "🧒" }, // Purple
  ],
};

// Flatten into a lookup map (name → entity)
// Supports partial matching: "SMSF - Catherine" matches "SMSF - Catherine"
export const ENTITY_MAP = {};
export const ENTITY_LIST = [];
Object.values(ENTITY_REGISTRY).forEach(group => {
  group.forEach(e => {
    ENTITY_MAP[e.name] = e;
    ENTITY_MAP[e.name.toLowerCase()] = e;
    ENTITY_LIST.push(e);
  });
});

// Alias mappings for common variations
export const ENTITY_ALIASES = {
  "client 1": "Catherine",
  "client 2": "Paul Andrew",
  "client1": "Catherine",
  "client2": "Paul Andrew",
  "smith family smsf - paul andrew super account": "SMSF - Paul Andrew",
  "smith family smsf - catherine super account": "SMSF - Catherine",
  "smith family smsf - paul andrew": "SMSF - Paul Andrew",
  "smith family smsf - catherine": "SMSF - Catherine",
  "smith family smsf": "Smith Family SMSF",
  "smsf - paul andrew super account": "SMSF - Paul Andrew",
  "smsf - catherine pension (default)": "SMSF - Catherine Pension",
  "smsf - catherine super account": "SMSF - Catherine",
  "personal - catherine": "Catherine",
  "personal - paul andrew": "Paul Andrew",
  "kids - sarah": "Sarah",
  "kids - matthew": "Matthew",
  "kids - madeline": "Madeline",
  "kids - harrison": "Harrison",
};

/**
 * Resolve any entity name/label to its registry entry.
 * Falls back to a grey default if not found.
 */
export function resolveEntity(name) {
  if (!name) return { id: "unknown", name: "Unknown", color: "var(--ps-text-subtle)", icon: "❓" };
  const lower = name.toLowerCase().trim();

  // Direct match
  if (ENTITY_MAP[lower]) return ENTITY_MAP[lower];

  // Alias match
  if (ENTITY_ALIASES[lower]) return ENTITY_MAP[ENTITY_ALIASES[lower].toLowerCase()] || ENTITY_MAP[ENTITY_ALIASES[lower]];

  // Partial match — find the best match by checking if the name contains an entity name
  for (const e of ENTITY_LIST) {
    if (lower.includes(e.name.toLowerCase())) return e;
  }
  // Reverse: entity name contains the query
  for (const e of ENTITY_LIST) {
    if (e.name.toLowerCase().includes(lower)) return e;
  }
  // First-word match: compare first word of query against first word of entity
  const queryFirst = lower.split(/\s+/)[0];
  if (queryFirst && queryFirst.length > 2) {
    for (const e of ENTITY_LIST) {
      const entityFirst = e.name.toLowerCase().split(/\s+/)[0];
      if (entityFirst === queryFirst) return { ...e, name };
    }
  }

  // Trust/company name pattern match
  if (lower.includes("trust")) return { id: `trust-${lower}`, name, color: "#D97706", icon: "🏛️" };
  if (lower.includes("pty") || lower.includes("company") || lower.includes("holdings")) return { id: `company-${lower}`, name, color: "#0369A1", icon: "🏢" };
  if (lower.includes("smsf")) return { id: `smsf-${lower}`, name, color: "#6D28D9", icon: "🔒" };
  if (lower === "members" || lower.includes("all members")) return { id: "members", name, color: "#6D28D9", icon: "👥" };

  return { id: "unknown", name, color: "var(--ps-text-subtle)", icon: "❓" };
}

/**
 * Render an inline entity badge: coloured dot + icon + name.
 * Usage: <EntityBadge name="Catherine" /> or <EntityBadge name="RPUT trust" size="sm" />
 */
export function EntityBadge({ name, size = "md", showIcon = true, style: extraStyle = {} }) {
  const e = resolveEntity(name);
  const isSmall = size === "sm";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: isSmall ? 4 : 6,
      padding: isSmall ? "2px 8px" : "3px 10px",
      borderRadius: 6, background: `${e.color}10`, border: `1px solid ${e.color}25`,
      fontSize: isSmall ? 11 : 12, fontWeight: 500, color: e.color,
      whiteSpace: "nowrap", ...extraStyle,
    }}>
      {showIcon && <span style={{ fontSize: isSmall ? 10 : 12 }}>{e.icon}</span>}
      <span style={{ width: isSmall ? 5 : 6, height: isSmall ? 5 : 6, borderRadius: "50%", background: e.color, flexShrink: 0 }} />
      {e.name}
    </span>
  );
}

/**
 * Get the colour for a given entity name (for use in charts).
 */
export function entityColor(name) {
  return resolveEntity(name).color;
}
