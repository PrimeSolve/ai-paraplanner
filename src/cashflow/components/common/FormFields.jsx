import React from "react";

export const ffLabelStyle = { fontSize: 12, fontWeight: 500, color: "var(--ps-text-secondary)", marginBottom: 4, display: "block" };
export const ffInputStyle = {
  width: "100%", padding: "8px 12px", borderRadius: 7,
  border: "1px solid var(--ps-border-input)", fontSize: 13, color: "var(--ps-text-primary)",
  background: "var(--ps-surface)", boxSizing: "border-box", fontFamily: "inherit",
};
export const ffSelectStyle = { ...ffInputStyle, cursor: "pointer" };
export const ffRowStyle = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 };
export const ffFullRowStyle = { marginBottom: 16 };

export function FFField({ label, children }) {
  return (
    <div>
      <label style={ffLabelStyle}>{label}</label>
      {children}
    </div>
  );
}

export function FFInput({ label, value, onChange, type = "text", placeholder, prefix, suffix, step }) {
  return (
    <FFField label={label}>
      <div style={{ position: "relative" }}>
        {prefix && <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "var(--ps-text-subtle)" }}>{prefix}</span>}
        <input
          type={type} value={value ?? ""} onChange={e => onChange(type === "number" ? (e.target.value === "" ? "" : parseFloat(e.target.value)) : e.target.value)}
          placeholder={placeholder} step={step}
          style={{ ...ffInputStyle, paddingLeft: prefix ? 26 : 12, paddingRight: suffix ? 32 : 12 }}
        />
        {suffix && <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "var(--ps-text-subtle)" }}>{suffix}</span>}
      </div>
    </FFField>
  );
}

export function FFSelect({ label, value, onChange, options }) {
  return (
    <FFField label={label}>
      <select value={value ?? ""} onChange={e => onChange(e.target.value)} style={ffSelectStyle}>
        {options.map(o => (
          <option key={typeof o === "string" ? o : o.value} value={typeof o === "string" ? o : o.value}>
            {typeof o === "string" ? o : o.label}
          </option>
        ))}
      </select>
    </FFField>
  );
}

export function FFToggle({ label, value, onChange }) {
  return (
    <FFField label={label}>
      <button onClick={() => onChange(!value)} style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "7px 14px", borderRadius: 7,
        border: "1px solid " + (value ? "#6366F1" : "#D1D5DB"),
        background: value ? "var(--ps-surface-indigo)" : "var(--ps-surface)",
        cursor: "pointer", fontSize: 13,
        color: value ? "#4F46E5" : "var(--ps-text-muted)",
        fontWeight: value ? 600 : 400,
        width: "100%", boxSizing: "border-box",
      }}>
        <div style={{
          width: 18, height: 18, borderRadius: 4,
          border: "2px solid " + (value ? "#6366F1" : "var(--ps-border-mid)"),
          background: value ? "#6366F1" : "var(--ps-surface)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, color: "var(--ps-surface)", fontWeight: 700,
        }}>{value ? "✓" : ""}</div>
        {value ? "Yes" : "No"}
      </button>
    </FFField>
  );
}

export function FFRadioRow({ label, value, onChange, options }) {
  return (
    <FFField label={label}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {options.map(o => {
          const isActive = String(value) === String(o.value);
          return (
            <button key={o.value} onClick={() => onChange(o.value)} style={{
              padding: "6px 12px", borderRadius: 7, fontSize: 12, fontWeight: isActive ? 600 : 400,
              border: "1px solid " + (isActive ? "#4F46E5" : "#D1D5DB"),
              background: isActive ? "#4F46E5" : "var(--ps-surface)",
              color: isActive ? "var(--ps-surface)" : "var(--ps-text-secondary)",
              cursor: "pointer", transition: "all 0.15s ease",
            }}>{o.label}</button>
          );
        })}
      </div>
    </FFField>
  );
}
