import React, { useState, useEffect, useCallback, useRef } from "react";
import { ffRowStyle, FFInput, FFSelect, FFToggle, FFRadioRow } from "../common/FormFields.jsx";
import { dependantsApi } from "@/api/dependantsApi";
import { trustsApi } from "@/api/trustsApi";
import { companiesApi } from "@/api/companiesApi";
import { smsfApi } from "@/api/smsfApi";
import { pensionsApi } from "@/api/pensionsApi";
import { definedBenefitsApi } from "@/api/definedBenefitsApi";
import { assetsApi } from "@/api/assetsApi";
import { debtsApi } from "@/api/debtsApi";
import { expensesApi } from "@/api/expensesApi";
import { insuranceApi } from "@/api/insuranceApi";
import { investmentWrapsApi } from "@/api/investmentWrapsApi";
import { investmentBondsApi } from "@/api/investmentBondsApi";
import { clientRiskProfilesApi } from "@/api/clientRiskProfilesApi";
import { scopeOfAdviceApi } from "@/api/scopeOfAdviceApi";

// ===========================================================================
// FACT FIND — Principals Form (aligned to Base44 FactFindPersonal)
// ===========================================================================

export const PRINCIPAL_SUB_SECTIONS = [
  { id: "basic", label: "Basic Details", icon: "🏠" },
  { id: "contact", label: "Contact", icon: "📞" },
  { id: "health", label: "Health", icon: "❤️" },
  { id: "employment", label: "Employment", icon: "💼" },
  { id: "estate", label: "Estate Planning", icon: "📋" },
  { id: "centrelink", label: "Centrelink", icon: "🏛️" },
];
export function PrincipalSubSectionContent({ prefix, data, updateFF }) {
  return null; // placeholder — actual rendering handled inline below
}

export function PrincipalCardBody({ prefix, data, updateFF, subSection }) {
  const p = prefix; // e.g. "client1" or "client2"

  if (subSection === "basic") return (
    <div>
      <div style={ffRowStyle}>
        <FFInput label="First Name" value={data.first_name} onChange={v => updateFF(`${p}.first_name`, v)} placeholder="e.g. Catherine" />
        <FFInput label="Last Name" value={data.last_name} onChange={v => updateFF(`${p}.last_name`, v)} placeholder="e.g. Bird" />
      </div>
      <div style={ffRowStyle}>
        <FFRadioRow label="Gender" value={data.gender} onChange={v => updateFF(`${p}.gender`, v)}
          options={[{ value: "1", label: "Female" }, { value: "2", label: "Male" }, { value: "3", label: "Other" }]} />
        <FFInput label="Date of Birth" value={data.date_of_birth} onChange={v => updateFF(`${p}.date_of_birth`, v)} type="date" />
      </div>
      <div style={ffRowStyle}>
        <FFSelect label="Relationship Status" value={data.marital_status} onChange={v => updateFF(`${p}.marital_status`, v)}
          options={[{ value: "", label: "Select..." }, { value: "6", label: "Single" }, { value: "1", label: "Married" }, { value: "2", label: "De facto" }, { value: "3", label: "Divorced" }, { value: "4", label: "Widowed" }]} />
        <FFSelect label="Living Status" value={data.living_status} onChange={v => updateFF(`${p}.living_status`, v)}
          options={[{ value: "", label: "Select..." }, { value: "1", label: "Own home" }, { value: "2", label: "Renting" }, { value: "3", label: "Live in aged care" }, { value: "4", label: "Other" }]} />
      </div>
      <div style={ffRowStyle}>
        <FFRadioRow label="Resident Status" value={data.resident_status} onChange={v => updateFF(`${p}.resident_status`, v)}
          options={[{ value: "1", label: "Permanent resident" }, { value: "2", label: "Temporary resident" }, { value: "3", label: "Other" }]} />
        <div />
      </div>
    </div>
  );

  if (subSection === "contact") return (
    <div>
      <div style={ffRowStyle}>
        <FFInput label="Street Address" value={data.address} onChange={v => updateFF(`${p}.address`, v)} placeholder="123 Main St" />
      </div>
      <div style={ffRowStyle}>
        <FFInput label="Suburb" value={data.suburb} onChange={v => updateFF(`${p}.suburb`, v)} placeholder="e.g. Richmond" />
        <FFSelect label="State" value={data.state} onChange={v => updateFF(`${p}.state`, v)}
          options={[{ value: "", label: "Select..." }, { value: "1", label: "ACT" }, { value: "2", label: "NSW" }, { value: "3", label: "NT" }, { value: "4", label: "QLD" }, { value: "5", label: "SA" }, { value: "6", label: "TAS" }, { value: "7", label: "VIC" }, { value: "8", label: "WA" }]} />
      </div>
      <div style={ffRowStyle}>
        <FFSelect label="Country" value={data.country} onChange={v => updateFF(`${p}.country`, v)}
          options={[{ value: "Australia", label: "Australia" }, { value: "New Zealand", label: "New Zealand" }]} />
        <FFInput label="Postcode" value={data.postcode} onChange={v => updateFF(`${p}.postcode`, v)} placeholder="e.g. 3121" />
      </div>
      <div style={{ height: 1, background: "var(--ps-border-light)", margin: "8px 0 16px" }} />
      <div style={ffRowStyle}>
        <FFInput label="Mobile" value={data.mobile} onChange={v => updateFF(`${p}.mobile`, v)} placeholder="0400 000 000" />
        <FFInput label="Email" value={data.email} onChange={v => updateFF(`${p}.email`, v)} placeholder="you@example.com" />
      </div>
    </div>
  );

  if (subSection === "health") return (
    <div>
      <div style={ffRowStyle}>
        <FFRadioRow label="Health Status" value={data.health_status} onChange={v => updateFF(`${p}.health_status`, v)}
          options={[{ value: "4", label: "Excellent" }, { value: "3", label: "Good" }, { value: "2", label: "Fair" }, { value: "1", label: "Poor" }]} />
        <FFRadioRow label="Smoker Status" value={data.smoker_status} onChange={v => updateFF(`${p}.smoker_status`, v)}
          options={[{ value: "1", label: "Smoker" }, { value: "2", label: "Non-smoker" }]} />
      </div>
      <div style={ffRowStyle}>
        <FFRadioRow label="Health Insurance?" value={data.health_insurance} onChange={v => updateFF(`${p}.health_insurance`, v)}
          options={[{ value: "1", label: "Yes" }, { value: "2", label: "No" }]} />
        <div />
      </div>
      <div style={ffRowStyle}>
        <FFInput label="Specify Health Issues" value={data.health_issues} onChange={v => updateFF(`${p}.health_issues`, v)} placeholder="Enter any health issues or concerns" />
      </div>
    </div>
  );

  if (subSection === "employment") return (
    <div>
      <div style={ffRowStyle}>
        <FFSelect label="Employment Status" value={data.employment_status} onChange={v => updateFF(`${p}.employment_status`, v)}
          options={[{ value: "", label: "Select..." }, { value: "1", label: "Full-time" }, { value: "2", label: "Part-time" }, { value: "3", label: "Casual" }, { value: "4", label: "Home duties" }, { value: "5", label: "Paternity leave" }, { value: "6", label: "Unemployed" }, { value: "7", label: "Retired" }]} />
        <FFInput label="Occupation" value={data.occupation} onChange={v => updateFF(`${p}.occupation`, v)} placeholder="e.g. Financial Planner" />
      </div>
      <div style={ffRowStyle}>
        <FFInput label="Hours Per Week" value={data.hours_per_week} onChange={v => updateFF(`${p}.hours_per_week`, v)} type="number" step="1" />
        <FFSelect label="Occupation Type" value={data.occupation_type} onChange={v => updateFF(`${p}.occupation_type`, v)}
          options={[{ value: "", label: "Select..." }, { value: "1", label: "Employee" }, { value: "2", label: "Sole trader" }, { value: "3", label: "Self-employed" }, { value: "4", label: "Other" }]} />
      </div>
      <div style={{ height: 1, background: "var(--ps-border-light)", margin: "8px 0 16px" }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
        <FFInput label="Annual Leave (weeks)" value={data.annual_leave} onChange={v => updateFF(`${p}.annual_leave`, v)} type="number" step="1" />
        <FFInput label="Sick Leave (weeks)" value={data.sick_leave} onChange={v => updateFF(`${p}.sick_leave`, v)} type="number" step="1" />
        <FFInput label="Long Service Leave (weeks)" value={data.long_service_leave} onChange={v => updateFF(`${p}.long_service_leave`, v)} type="number" step="1" />
      </div>
      <div style={ffRowStyle}>
        <FFInput label="Employer Name" value={data.employer_name} onChange={v => updateFF(`${p}.employer_name`, v)} placeholder="e.g. Acme Corp" />
        <FFInput label="Length of Employment" value={data.employment_length} onChange={v => updateFF(`${p}.employment_length`, v)} placeholder="e.g. 5 years" />
      </div>
      <div style={{ height: 1, background: "var(--ps-border-light)", margin: "8px 0 16px" }} />
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-subtle)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>FBT Exemption & Salary Packaging</div>
      <div style={ffRowStyle}>
        <FFRadioRow label="FBT Exempt Employer?" value={data.fbt_exempt} onChange={v => updateFF(`${p}.fbt_exempt`, v)}
          options={[{ value: "1", label: "Yes" }, { value: "2", label: "No" }]} />
        <div />
      </div>
      {data.fbt_exempt === "1" && (<>
        <div style={ffRowStyle}>
          <FFSelect label="Employer Category" value={data.fbt_category} onChange={v => updateFF(`${p}.fbt_category`, v)}
            options={[
              { value: "", label: "Select..." },
              { value: "hospital", label: "Public Hospital / Ambulance Service — $17,000 cap" },
              { value: "pbi", label: "PBI / Health Promotion Charity — $30,000 cap" },
              { value: "religious", label: "Religious Institution — No cap" },
            ]} />
          <div />
        </div>
        <div style={ffRowStyle}>
          <FFInput label="Other Packaged Benefits (p.a.)" value={data.fbt_other_benefits} onChange={v => updateFF(`${p}.fbt_other_benefits`, v)}
            type="number" prefix="$" placeholder="e.g. 2,500 (laptops, meals etc.)" />
          <div style={{ padding: "10px 12px", background: "var(--ps-surface-green)", borderRadius: 8, border: "1px solid var(--ps-ring-green)", fontSize: 11, color: "var(--ps-badge-green)", flex: 1 }}>
            {(() => {
              const cap = data.fbt_category === "hospital" ? 9010 : data.fbt_category === "pbi" ? 15900 : data.fbt_category === "religious" ? null : 0;
              const used = parseFloat(data.fbt_other_benefits) || 0;
              if (cap === null) return "✓ Religious institution — unlimited salary packaging available";
              const remaining = Math.max(0, cap - used);
              return cap > 0
                ? `Cap: $${cap.toLocaleString()} actual benefit — $${used.toLocaleString()} already used = $${remaining.toLocaleString()} available for mortgage packaging`
                : "Select employer category to see cap";
            })()}
          </div>
        </div>
      </>)}
    </div>
  );

  if (subSection === "estate") return (
    <div>
      <div style={ffRowStyle}>
        <FFRadioRow label="Do You Have a Will?" value={data.has_will} onChange={v => updateFF(`${p}.has_will`, v)}
          options={[{ value: "1", label: "Yes" }, { value: "2", label: "No" }]} />
        <FFInput label="Will Last Updated" value={data.will_updated} onChange={v => updateFF(`${p}.will_updated`, v)} type="date" />
      </div>
      <div style={ffRowStyle}>
        <FFRadioRow label="Testamentary Trust?" value={data.testamentary_trust} onChange={v => updateFF(`${p}.testamentary_trust`, v)}
          options={[{ value: "1", label: "Yes" }, { value: "2", label: "No" }]} />
        <FFSelect label="Power of Attorney" value={data.power_of_attorney} onChange={v => updateFF(`${p}.power_of_attorney`, v)}
          options={[{ value: "", label: "Select..." }, { value: "1", label: "Financial" }, { value: "2", label: "Financial & Medical" }, { value: "3", label: "General" }, { value: "4", label: "Guardianship" }, { value: "5", label: "Medical" }]} />
      </div>
    </div>
  );

  if (subSection === "centrelink") return (
    <div>
      <div style={ffRowStyle}>
        <FFRadioRow label="Receiving Centrelink Benefits?" value={data.centrelink_benefits} onChange={v => updateFF(`${p}.centrelink_benefits`, v)}
          options={[{ value: "1", label: "Yes" }, { value: "2", label: "No" }]} />
        <div />
      </div>
      {data.centrelink_benefits === "1" && (
        <>
          <div style={ffRowStyle}>
            <FFSelect label="Type of Benefit" value={data.benefit_type} onChange={v => updateFF(`${p}.benefit_type`, v)}
              options={[{ value: "", label: "Select..." }, { value: "1", label: "Age Pension" }, { value: "2", label: "DVA Pension" }, { value: "3", label: "Disability support pension" }, { value: "4", label: "Allowance" }, { value: "5", label: "Other" }]} />
            <FFRadioRow label="Concession Cards?" value={data.concession_cards} onChange={v => updateFF(`${p}.concession_cards`, v)}
              options={[{ value: "1", label: "Yes" }, { value: "2", label: "No" }]} />
          </div>
        </>
      )}
    </div>
  );

  return null;
}

export function PrincipalsForm({ factFind, updateFF, addPrincipal, removePrincipal, onSavePrincipals }) {
  const [subSection, setSubSection] = useState("basic");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // "saved" | "error" | null
  const hasClient1 = factFind.client1 !== null;
  const hasClient2 = factFind.client2 !== null;
  const count = (hasClient1 ? 1 : 0) + (hasClient2 ? 1 : 0);

  const clientDisplayName = (client, fallback) => {
    if (!client) return fallback;
    const fn = client.first_name || "";
    const ln = client.last_name || "";
    return (fn + " " + ln).trim() || fallback;
  };

  // Sub-section tab bar
  const subTabBar = (
    <div style={{
      display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 16,
      padding: "2px", background: "var(--ps-border-light)", borderRadius: 10,
    }}>
      {PRINCIPAL_SUB_SECTIONS.map(s => {
        const isActive = subSection === s.id;
        return (
          <button key={s.id} onClick={() => setSubSection(s.id)} style={{
            padding: "6px 12px", borderRadius: 8, border: "none", cursor: "pointer",
            background: isActive ? "var(--ps-surface)" : "transparent",
            boxShadow: isActive ? "0 1px 3px var(--ps-shadow-sm)" : "none",
            fontSize: 11, fontWeight: isActive ? 600 : 400,
            color: isActive ? "#4F46E5" : "var(--ps-text-muted)",
            display: "flex", alignItems: "center", gap: 5,
            transition: "all 0.15s ease",
          }}>
            <span style={{ fontSize: 12 }}>{s.icon}</span>
            {s.label}
          </button>
        );
      })}
    </div>
  );

  // Render a single client card
  const renderClientCard = (num, color, bgTint) => {
    const key = `client${num}`;
    const client = factFind[key];
    if (!client) return null;

    return (
      <div style={{ border: "1px solid var(--ps-border)", borderRadius: 12, background: "var(--ps-surface)", overflow: "hidden", marginBottom: 16 }}>
        <div style={{ padding: "12px 18px", background: bgTint, borderBottom: "1px solid var(--ps-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: color, color: "var(--ps-surface)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>
              {client.first_name ? client.first_name.charAt(0).toUpperCase() : String(num)}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ps-text-primary)" }}>{clientDisplayName(client, `Client ${num}`)}</div>
              <div style={{ fontSize: 11, color: "var(--ps-text-subtle)" }}>{num === 1 ? "Primary client (required)" : "Partner / spouse (optional)"}</div>
            </div>
          </div>
          {num === 2 && (
            <button onClick={() => removePrincipal(2)} style={{ padding: "4px 10px", borderRadius: 5, border: "1px solid var(--ps-ring-red)", background: "var(--ps-surface-red)", cursor: "pointer", fontSize: 11, color: "var(--ps-red)", fontWeight: 500 }}>Remove</button>
          )}
        </div>
        <div style={{ padding: 18 }}>
          <PrincipalCardBody prefix={key} data={client} updateFF={updateFF} subSection={subSection} />
        </div>
      </div>
    );
  };

  const handleSave = async () => {
    if (!onSavePrincipals || saving) return;
    setSaving(true);
    setSaveStatus(null);
    try {
      await onSavePrincipals();
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      console.error('[PrincipalsForm] Save failed:', err);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Status bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 16,
      }}>
        <div style={{ fontSize: 12, color: "var(--ps-text-muted)" }}>
          <span style={{ fontWeight: 600, color: "var(--ps-text-primary)" }}>{count}</span> of 2 principals added
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {onSavePrincipals && (
            <>
              {saveStatus === "saved" && (
                <span style={{ fontSize: 11, color: "#059669", fontWeight: 500 }}>Saved</span>
              )}
              {saveStatus === "error" && (
                <span style={{ fontSize: 11, color: "#DC2626", fontWeight: 500 }}>Save failed</span>
              )}
              <button onClick={handleSave} disabled={saving} style={{
                padding: "4px 12px", borderRadius: 6, border: "1px solid #4F46E5",
                background: saving ? "#E0E7FF" : "#4F46E5", color: saving ? "#4F46E5" : "#fff",
                fontSize: 11, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer",
                transition: "all 0.15s ease",
              }}>
                {saving ? "Saving..." : "Save"}
              </button>
            </>
          )}
          <div style={{ display: "flex", gap: 4 }}>
            <div style={{ width: 32, height: 4, borderRadius: 2, background: hasClient1 ? "#4F46E5" : "var(--ps-border)" }} />
            <div style={{ width: 32, height: 4, borderRadius: 2, background: hasClient2 ? "#0891B2" : "var(--ps-border)" }} />
          </div>
        </div>
      </div>

      {/* Sub-section tabs */}
      {(hasClient1 || hasClient2) && subTabBar}

      {/* Client 1 */}
      {hasClient1 ? renderClientCard(1, "#4F46E5", "#4F46E508") : (
        <button onClick={() => addPrincipal(1)} style={{
          width: "100%", padding: "20px", borderRadius: 12,
          border: "2px dashed #C7D2FE", background: "var(--ps-surface-indigo)",
          cursor: "pointer", marginBottom: 16,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          fontSize: 13, fontWeight: 600, color: "#4F46E5",
        }}>
          <span style={{ fontSize: 18 }}>+</span> Add Client 1 (Primary)
        </button>
      )}

      {/* Client 2 */}
      {hasClient2 ? renderClientCard(2, "#0891B2", "#0891B208") : (
        <button onClick={() => addPrincipal(2)} disabled={!hasClient1} style={{
          width: "100%", padding: "20px", borderRadius: 12,
          border: "2px dashed " + (hasClient1 ? "var(--ps-ring-cyan)" : "var(--ps-border)"),
          background: hasClient1 ? "var(--ps-surface-teal)" : "var(--ps-surface-alt)",
          cursor: hasClient1 ? "pointer" : "not-allowed",
          marginBottom: 16,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          fontSize: 13, fontWeight: 600,
          color: hasClient1 ? "#0891B2" : "var(--ps-border-mid)",
          opacity: hasClient1 ? 1 : 0.6,
        }}>
          <span style={{ fontSize: 18 }}>+</span> Add Client 2 (Partner / Spouse)
        </button>
      )}
    </div>
  );
}


// ===========================================================================
// FACT FIND — Dependants Form (Children + Dependants, aligned to Base44)
// ===========================================================================

export const CHILD_DEFAULTS = {
  name: "",
  date_of_birth: "",
  financially_dependent: "",            // "1"=Yes, "2"=No
  education_status: "",                // "1"=Primary, "2"=Secondary, "3"=Tertiary, "4"=TAFE/Trade, "5"=Not in education
  financial_dependence_age: "",
  health_issues: "",
};

export const DEPENDANT_DEFAULTS = {
  name: "",
  date_of_birth: "",
  dependant_until_age: "",
  relationship: "",         // "1"=Child, "2"=Parent, "3"=Relative, "4"=Other
  interdependency: "",             // "1"=Yes, "2"=No
};

export function DependantsForm({ factFind, updateFF, clientId }) {
  const [subTab, setSubTab] = useState("children");
  const [children, setChildren] = useState([]);
  const [depList, setDepList] = useState([]);
  const debounceTimers = useRef({});

  // Load dependants from API on mount
  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    async function load() {
      try {
        const all = await dependantsApi.getAll(clientId);
        if (cancelled) return;
        setChildren(all.filter(d => d.dep_type === "child"));
        setDepList(all.filter(d => d.dep_type === "dependant"));
      } catch (error) {
        console.error("Failed to load dependants:", error);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [clientId]);

  // Cleanup debounce timers on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(clearTimeout);
    };
  }, []);

  // Debounced update to API
  const debouncedUpdate = useCallback((id, data) => {
    if (debounceTimers.current[id]) {
      clearTimeout(debounceTimers.current[id]);
    }
    debounceTimers.current[id] = setTimeout(async () => {
      try {
        await dependantsApi.update(id, data);
      } catch (error) {
        console.error("Failed to update dependant:", error);
      }
    }, 500);
  }, []);

  // Children handlers
  const addChild = useCallback(async () => {
    if (!clientId) return;
    try {
      const created = await dependantsApi.create({ dep_type: "child", client_id: clientId, ...CHILD_DEFAULTS });
      setChildren(prev => [...prev, created]);
    } catch (error) {
      console.error("Failed to create child:", error);
    }
  }, [clientId]);

  const removeChild = useCallback(async (idx) => {
    const child = children[idx];
    if (child?.id) {
      try {
        await dependantsApi.remove(child.id);
      } catch (error) {
        console.error("Failed to remove child:", error);
        return;
      }
    }
    setChildren(prev => prev.filter((_, i) => i !== idx));
  }, [children]);

  const updateChild = useCallback((idx, field, value) => {
    setChildren(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      const record = updated[idx];
      if (record.id) {
        const { id, client_id, ...fields } = record;
        debouncedUpdate(id, { ...fields, dep_type: "child" });
      }
      return updated;
    });
  }, [debouncedUpdate]);

  // Dependants handlers
  const addDep = useCallback(async () => {
    if (!clientId) return;
    try {
      const created = await dependantsApi.create({ dep_type: "dependant", client_id: clientId, ...DEPENDANT_DEFAULTS });
      setDepList(prev => [...prev, created]);
    } catch (error) {
      console.error("Failed to create dependant:", error);
    }
  }, [clientId]);

  const removeDep = useCallback(async (idx) => {
    const dep = depList[idx];
    if (dep?.id) {
      try {
        await dependantsApi.remove(dep.id);
      } catch (error) {
        console.error("Failed to remove dependant:", error);
        return;
      }
    }
    setDepList(prev => prev.filter((_, i) => i !== idx));
  }, [depList]);

  const updateDep = useCallback((idx, field, value) => {
    setDepList(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      const record = updated[idx];
      if (record.id) {
        const { id, client_id, ...fields } = record;
        debouncedUpdate(id, { ...fields, dep_type: "dependant" });
      }
      return updated;
    });
  }, [debouncedUpdate]);

  // Sub-tab bar
  const subTabBar = (
    <div style={{
      display: "flex", gap: 4, marginBottom: 16,
      padding: "2px", background: "var(--ps-border-light)", borderRadius: 10,
    }}>
      {[
        { id: "children", label: "Children", icon: "👶", count: children.length },
        { id: "dependants", label: "Dependants", icon: "👥", count: depList.length },
      ].map(s => {
        const isActive = subTab === s.id;
        return (
          <button key={s.id} onClick={() => setSubTab(s.id)} style={{
            padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer",
            background: isActive ? "var(--ps-surface)" : "transparent",
            boxShadow: isActive ? "0 1px 3px var(--ps-shadow-sm)" : "none",
            fontSize: 12, fontWeight: isActive ? 600 : 400,
            color: isActive ? "#EC4899" : "var(--ps-text-muted)",
            display: "flex", alignItems: "center", gap: 6,
            transition: "all 0.15s ease",
          }}>
            <span style={{ fontSize: 13 }}>{s.icon}</span>
            {s.label}
            {s.count > 0 && (
              <span style={{
                background: isActive ? "#EC489920" : "var(--ps-border)",
                color: isActive ? "#EC4899" : "var(--ps-text-muted)",
                fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 10,
              }}>{s.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <div>
      {subTabBar}

      {subTab === "children" && (
        <div>
          {children.map((data, idx) => (
            <div key={idx} style={{ border: "1px solid var(--ps-border)", borderRadius: 12, background: "var(--ps-surface)", overflow: "hidden", marginBottom: 12 }}>
              <div style={{ padding: "10px 16px", background: "#EC489908", borderBottom: "1px solid var(--ps-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#EC4899", color: "var(--ps-surface)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>👶</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ps-text-primary)" }}>{data.name || `Child ${idx + 1}`}</div>
                </div>
                <button onClick={() => removeChild(idx)} style={{ padding: "2px 8px", borderRadius: 4, border: "1px solid var(--ps-ring-red)", background: "var(--ps-surface-red)", cursor: "pointer", fontSize: 10, color: "var(--ps-red)", fontWeight: 500 }}>Remove</button>
              </div>
              <div style={{ padding: 14 }}>
                <div style={ffRowStyle}>
                  <FFInput label="Child Name" value={data.name} onChange={v => updateChild(idx, "name", v)} placeholder="e.g. Emma" />
                  <FFInput label="Date of Birth" value={data.date_of_birth} onChange={v => updateChild(idx, "date_of_birth", v)} type="date" />
                </div>
                <div style={ffRowStyle}>
                  <FFRadioRow label="Financially Dependent?" value={data.financially_dependent} onChange={v => updateChild(idx, "financially_dependent", v)}
                    options={[{ value: "1", label: "Yes" }, { value: "2", label: "No" }]} />
                  <FFSelect label="Education Status" value={data.education_status} onChange={v => updateChild(idx, "education_status", v)}
                    options={[{ value: "", label: "Select..." }, { value: "1", label: "Primary" }, { value: "2", label: "Secondary" }, { value: "3", label: "Tertiary" }, { value: "4", label: "TAFE/Trade" }, { value: "5", label: "Not in education" }]} />
                </div>
                <div style={ffRowStyle}>
                  <FFInput label="Expected Age of Financial Dependence" value={data.financial_dependence_age} onChange={v => updateChild(idx, "financial_dependence_age", v)} type="number" step="1" placeholder="e.g. 25" />
                  <FFInput label="Health Issues or Concerns" value={data.health_issues} onChange={v => updateChild(idx, "health_issues", v)} placeholder="e.g. Asthma, food allergy" />
                </div>
              </div>
            </div>
          ))}
          <button onClick={addChild} style={{ width: "100%", padding: "20px", borderRadius: 12, border: "2px dashed #F9A8D4", background: "#FDF2F8", cursor: "pointer", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "#EC4899" }}>
            <span style={{ fontSize: 18 }}>+</span> Add Child
          </button>
        </div>
      )}

      {subTab === "dependants" && (
        <div>
          {depList.map((data, idx) => (
            <div key={idx} style={{ border: "1px solid var(--ps-border)", borderRadius: 12, background: "var(--ps-surface)", overflow: "hidden", marginBottom: 12 }}>
              <div style={{ padding: "10px 16px", background: "#7C3AED08", borderBottom: "1px solid var(--ps-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#7C3AED", color: "var(--ps-surface)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>👥</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ps-text-primary)" }}>{data.name || `Dependant ${idx + 1}`}</div>
                </div>
                <button onClick={() => removeDep(idx)} style={{ padding: "2px 8px", borderRadius: 4, border: "1px solid var(--ps-ring-red)", background: "var(--ps-surface-red)", cursor: "pointer", fontSize: 10, color: "var(--ps-red)", fontWeight: 500 }}>Remove</button>
              </div>
              <div style={{ padding: 14 }}>
                <div style={ffRowStyle}>
                  <FFInput label="Name" value={data.name} onChange={v => updateDep(idx, "name", v)} placeholder="e.g. Parent name" />
                  <FFInput label="Date of Birth" value={data.date_of_birth} onChange={v => updateDep(idx, "date_of_birth", v)} type="date" />
                </div>
                <div style={ffRowStyle}>
                  <FFInput label="Expected Age of Dependence Until" value={data.dependant_until_age} onChange={v => updateDep(idx, "dependant_until_age", v)} type="number" step="1" placeholder="e.g. 85" />
                  <FFSelect label="Relationship" value={data.relationship} onChange={v => updateDep(idx, "relationship", v)}
                    options={[{ value: "", label: "Select..." }, { value: "1", label: "Child" }, { value: "2", label: "Parent" }, { value: "3", label: "Relative" }, { value: "4", label: "Other" }]} />
                </div>
                <div style={ffRowStyle}>
                  <FFRadioRow label="Is There Interdependency?" value={data.interdependency} onChange={v => updateDep(idx, "interdependency", v)}
                    options={[{ value: "1", label: "Yes" }, { value: "2", label: "No" }]} />
                  <div />
                </div>
              </div>
            </div>
          ))}
          <button onClick={addDep} style={{ width: "100%", padding: "20px", borderRadius: 12, border: "2px dashed #C4B5FD", background: "var(--ps-surface-purple)", cursor: "pointer", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "#7C3AED" }}>
            <span style={{ fontSize: 18 }}>+</span> Add Dependant
          </button>
        </div>
      )}
    </div>
  );
}

// ===========================================================================
// FACT FIND — Superannuation Form (combined Super/Pension/Annuity, aligned to Base44)
// ===========================================================================

export const SUPER_DEFAULTS = {
  owner: "client1",
  fund_name: "",
  product: "",
  balance: "",
  contributions: {
    super_guarantee: "",
    salary_sacrifice: "",
    after_tax: "",
    spouse_received: "",
    split_received: "",
    concessional: "",
  },
  tax_components: {
    unp_amount: "",
    taxable_portion: "",
    tax_free_portion: "",
  },
  beneficiaries: [],   // [{ benef_entity, benef_type, benef_entitlement }]
  portfolio: [],        // [{ asset_name, allocation_pct, amount }]
};


export const PENSION_DEFAULTS = {
  owner: "client1",
  fund_name: "",
  product: "",
  balance: "",
  pension_type: "",              // "account-based", "ttr", "term-allocated", "lifetime"
  commencement_date: "",
  purchase_price: "",
  reversionary_nominee: "",
  income: {
    annual_income: "",
    frequency: "",               // "annual", "quarterly", "monthly", "fortnightly"
    minimum: "",
    maximum: "",
    tax_free_pct: "",
    taxable_pct: "",
  },
  tax_components: {
    unp_amount: "",
    taxable_portion: "",
    tax_free_portion: "",
  },
  beneficiaries: [],
  portfolio: [],
};

export const ANNUITY_DEFAULTS = {
  owner: "client1",
  joint_holding: false,
  product: "",
  annuity_type: "",              // "fixed-term", "lifetime", "market-linked"
  tax_environment: "",           // "super", "non-super"
  purchase_price: "",
  commencement_date: "",
  maturity_date: "",
  guaranteed_period: "",
  residual_capital_value: "",
  income: {
    annual_income: "",
    frequency: "",
    tax_free_pct: "",
    taxable_pct: "",
    deductible_amount: "",
  },
  tax_components: {
    unp_amount: "",
    taxable_portion: "",
    tax_free_portion: "",
  },
  beneficiaries: [],
};

export const DB_DEFAULTS = {
  owner: "client1",
  scheme: "",                    // "pss", "css", "other"
  status: "",                    // "contributing", "preserved", "pension"
  date_joined: "",
  super_salary: "",              // Current super salary
  salary_growth: "",             // % p.a.
  contribution_rate: "",         // PSS: 2-10%, CSS: 0 or 5%
  years_service: "",             // Years of contributory membership / CDDs
  expected_exit_age: "",
  benefit_preference: "",        // "pension", "lump_sum", "combination"
  combination_lump_pct: "",      // If combination, % taken as lump sum
  member_component: "",          // From latest benefit statement
  productivity_component: "",
  employer_component: "",        // PSS only
  // PSS-specific
  current_abm: "",               // Accrued Benefit Multiple from statement
  ten_year_rule_met: "",         // "yes", "no"
  // CSS-specific
  accumulated_basic_contribs: "",// For 54/11 calculation
  pre_1976_joiner: "",           // "yes", "no"
  planning_54_11: "",            // "yes", "no"
  // Preserved / already receiving
  preserved_benefit: "",         // Total preserved benefit amount
  current_pension_annual: "",    // If already receiving pension
  pension_indexed: "",           // "yes", "no"
  // Other DB scheme
  other_scheme_name: "",
  other_pension_formula: "",     // Description of how benefit is calculated
  estimated_annual_pension: "",
  notes: "",
};

export function SuperannuationForm({ factFind, updateFF, clientId, client1Guid, client2Guid }) {
  const [subTab, setSubTab] = useState("super");
  const [detailIdx, setDetailIdx] = useState(null);
  const [activeDetailTab, setActiveDetailTab] = useState("fund_details");

  const superFunds = factFind.superProducts || [];
  const pensions = factFind.pensions || [];
  const annuities = factFind.annuities || [];
  const definedBenefits = factFind.definedBenefits || [];

  // Client GUID map for pension API calls
  const clientGuidMap = { client1: client1Guid, client2: client2Guid };

  // Load pensions from API on mount
  const pensionsLoadedRef = useRef(false);
  useEffect(() => {
    if (clientId && !pensionsLoadedRef.current) {
      pensionsLoadedRef.current = true;
      pensionsApi.getAll(clientId).then(records => {
        const arr = Array.isArray(records) ? records : [];
        updateFF("pensions", arr);
      }).catch(err => {
        console.error('[SuperannuationForm] Failed to load pensions:', err);
      });
    }
  }, [clientId, updateFF]);

  // Load defined benefits from API on mount
  const dbLoadedRef = useRef(false);
  useEffect(() => {
    if (clientId && !dbLoadedRef.current) {
      dbLoadedRef.current = true;
      definedBenefitsApi.getAll(clientId).then(records => {
        const arr = Array.isArray(records) ? records : [];
        updateFF("definedBenefits", arr);
      }).catch(err => {
        console.error('[SuperannuationForm] Failed to load defined benefits:', err);
      });
    }
  }, [clientId, updateFF]);

  // Debounced update for defined benefits
  const dbUpdateTimerRef = useRef(null);
  const debouncedUpdateDB = useCallback((id, data) => {
    if (dbUpdateTimerRef.current) clearTimeout(dbUpdateTimerRef.current);
    dbUpdateTimerRef.current = setTimeout(() => {
      definedBenefitsApi.update(id, data).catch(err => {
        console.error('[SuperannuationForm] Failed to update defined benefit:', err);
      });
    }, 500);
  }, []);

  const hasClients = factFind.client1 !== null || factFind.client2 !== null;
  const clientOptions = [];
  if (factFind.client1) clientOptions.push({ value: "client1", label: ((factFind.client1?.first_name || "") + " " + (factFind.client1?.last_name || "")).trim() || "Client 1" });
  if (factFind.client2) clientOptions.push({ value: "client2", label: ((factFind.client2?.first_name || "") + " " + (factFind.client2?.last_name || "")).trim() || "Client 2" });

  const clientName = (id) => {
    if (id === "client1") return clientOptions.find(c => c.value === "client1")?.label || "Client 1";
    if (id === "client2") return clientOptions.find(c => c.value === "client2")?.label || "Client 2";
    if (id === "joint" && clientOptions.length >= 2) return `${clientOptions[0].label} & ${clientOptions[1].label}`;
    // Entity resolution
    const trustMatch = id?.match(/^trust_(\d+)$/);
    if (trustMatch) { const t = (factFind.trusts || [])[parseInt(trustMatch[1])]; return t?.trust_name || id; }
    const compMatch = id?.match(/^company_(\d+)$/);
    if (compMatch) { const c = (factFind.companies || [])[parseInt(compMatch[1])]; return c?.company_name || id; }
    const smsfMatch = id?.match(/^smsf_(\d+)$/);
    if (smsfMatch) { const s = (factFind.smsfs || [])[parseInt(smsfMatch[1])]; return s?.smsf_name || id; }
    const segMatch = id?.match(/^smsf_(\d+)_acc_(\d+)$/);
    if (segMatch) {
      const sf = (factFind.smsfs || [])[parseInt(segMatch[1])];
      const acc = sf?.accounts?.[parseInt(segMatch[2])];
      if (acc) {
        const cl = acc.owner === "client1" ? factFind.client1 : factFind.client2;
        const name = ((cl?.first_name || "") + " " + (cl?.last_name || "")).trim();
        const env = acc.tax_environment === "pension" ? "Pension" : "Accumulation";
        return `${name} (${env})`;
      }
    }
    return id || "—";
  };

  // Super CRUD
  const addSuper = () => updateFF("superProducts", [...superFunds, { ...SUPER_DEFAULTS, contributions: { ...SUPER_DEFAULTS.contributions }, tax_components: { ...SUPER_DEFAULTS.tax_components }, beneficiaries: [], portfolio: [] }]);
  const removeSuper = (idx) => { updateFF("superProducts", superFunds.filter((_, i) => i !== idx)); setDetailIdx(null); };
  const updateSuper = (idx, field, value) => updateFF("superProducts", superFunds.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  const updateSuperNested = (idx, parent, field, value) => updateFF("superProducts", superFunds.map((item, i) => i === idx ? { ...item, [parent]: { ...item[parent], [field]: value } } : item));
  const updateSuperArray = (idx, arrName, arrIdx, field, value) => {
    updateFF("superProducts", superFunds.map((item, i) => i === idx ? { ...item, [arrName]: item[arrName].map((a, ai) => ai === arrIdx ? { ...a, [field]: value } : a) } : item));
  };
  const addSuperArrayItem = (idx, arrName, template) => {
    updateFF("superProducts", superFunds.map((item, i) => i === idx ? { ...item, [arrName]: [...(item[arrName] || []), template] } : item));
  };
  const removeSuperArrayItem = (idx, arrName, arrIdx) => {
    updateFF("superProducts", superFunds.map((item, i) => i === idx ? { ...item, [arrName]: item[arrName].filter((_, ai) => ai !== arrIdx) } : item));
  };

  // Pension CRUD (API-backed)
  const addPension = async () => {
    const newPension = { ...PENSION_DEFAULTS, income: { ...PENSION_DEFAULTS.income }, tax_components: { ...PENSION_DEFAULTS.tax_components }, beneficiaries: [], portfolio: [] };
    if (clientId) {
      try {
        const defaultName = `Pension ${pensions.length + 1}`;
        const created = await pensionsApi.create(newPension, clientGuidMap, defaultName);
        updateFF("pensions", [...pensions, created]);
      } catch (err) {
        console.error('[SuperannuationForm] Failed to create pension:', err);
        updateFF("pensions", [...pensions, newPension]);
      }
    } else {
      updateFF("pensions", [...pensions, newPension]);
    }
  };
  const removePension = async (idx) => {
    const pension = pensions[idx];
    if (clientId && pension?.id) {
      try {
        await pensionsApi.remove(pension.id);
      } catch (err) {
        console.error('[SuperannuationForm] Failed to remove pension:', err);
      }
    }
    updateFF("pensions", pensions.filter((_, i) => i !== idx));
    setDetailIdx(null);
  };
  const updatePension = (idx, field, value) => updateFF("pensions", pensions.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  const updatePensionNested = (idx, parent, field, value) => updateFF("pensions", pensions.map((item, i) => i === idx ? { ...item, [parent]: { ...item[parent], [field]: value } } : item));
  const updatePensionArray = (idx, arrName, arrIdx, field, value) => {
    updateFF("pensions", pensions.map((item, i) => i === idx ? { ...item, [arrName]: item[arrName].map((a, ai) => ai === arrIdx ? { ...a, [field]: value } : a) } : item));
  };
  const addPensionArrayItem = async (idx, arrName, template) => {
    const pension = pensions[idx];
    let created = template;
    try {
      if (pension?.id && arrName === "beneficiaries") {
        created = await pensionsApi.addBeneficiary(pension.id, {
          beneficiaryClientId: null,
          beneficiaryType: template.benef_type,
          entitlement: parseFloat(template.benef_entitlement) || null,
        });
      } else if (pension?.id && arrName === "portfolio") {
        created = await pensionsApi.addPortfolioItem(pension.id, {
          assetName: template.asset_name,
          allocationPct: parseFloat(template.allocation_pct) || null,
          amount: parseFloat(template.amount) || null,
        });
      }
    } catch (err) {
      console.error(`Failed to add ${arrName} item via API`, err);
    }
    updateFF("pensions", pensions.map((item, i) => i === idx ? { ...item, [arrName]: [...(item[arrName] || []), created] } : item));
  };
  const removePensionArrayItem = async (idx, arrName, arrIdx) => {
    const pension = pensions[idx];
    const item = pension?.[arrName]?.[arrIdx];
    try {
      if (pension?.id && item?.id && arrName === "beneficiaries") {
        await pensionsApi.removeBeneficiary(pension.id, item.id);
      } else if (pension?.id && item?.id && arrName === "portfolio") {
        await pensionsApi.removePortfolioItem(pension.id, item.id);
      }
    } catch (err) {
      console.error(`Failed to remove ${arrName} item via API`, err);
    }
    updateFF("pensions", pensions.map((item, i) => i === idx ? { ...item, [arrName]: item[arrName].filter((_, ai) => ai !== arrIdx) } : item));
  };

  // Annuity CRUD
  const addAnnuity = () => updateFF("annuities", [...annuities, { ...ANNUITY_DEFAULTS, income: { ...ANNUITY_DEFAULTS.income }, tax_components: { ...ANNUITY_DEFAULTS.tax_components }, beneficiaries: [] }]);
  const removeAnnuity = (idx) => { updateFF("annuities", annuities.filter((_, i) => i !== idx)); setDetailIdx(null); };
  const updateAnnuity = (idx, field, value) => updateFF("annuities", annuities.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  const updateAnnuityNested = (idx, parent, field, value) => updateFF("annuities", annuities.map((item, i) => i === idx ? { ...item, [parent]: { ...item[parent], [field]: value } } : item));
  const updateAnnuityArray = (idx, arrName, arrIdx, field, value) => {
    updateFF("annuities", annuities.map((item, i) => i === idx ? { ...item, [arrName]: item[arrName].map((a, ai) => ai === arrIdx ? { ...a, [field]: value } : a) } : item));
  };
  const addAnnuityArrayItem = (idx, arrName, template) => {
    updateFF("annuities", annuities.map((item, i) => i === idx ? { ...item, [arrName]: [...(item[arrName] || []), template] } : item));
  };
  const removeAnnuityArrayItem = (idx, arrName, arrIdx) => {
    updateFF("annuities", annuities.map((item, i) => i === idx ? { ...item, [arrName]: item[arrName].filter((_, ai) => ai !== arrIdx) } : item));
  };

  if (!hasClients) {
    return (
      <div style={{ padding: "40px 24px", borderRadius: 12, border: "2px dashed var(--ps-border)", textAlign: "center" }}>
        <div style={{ fontSize: 28, marginBottom: 10 }}>👤</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 4 }}>No principals added yet</div>
        <div style={{ fontSize: 12, color: "var(--ps-text-subtle)" }}>Add at least one client under Principals first</div>
      </div>
    );
  }

  // Sub-tab bar
  const subTabBar = (
    <div style={{ display: "flex", gap: 4, marginBottom: 16, padding: "2px", background: "var(--ps-border-light)", borderRadius: 10 }}>
      {[
        { id: "super", label: "Super", icon: "💰", count: superFunds.length, color: "#0891B2" },
        { id: "pension", label: "Pension", icon: "🏦", count: pensions.length, color: "#7C3AED" },
        { id: "annuity", label: "Annuity", icon: "📄", count: annuities.length, color: "#D97706" },
        { id: "defined_benefit", label: "Defined Benefit", icon: "🏛️", count: definedBenefits.length, color: "#059669" },
        { id: "super_planning", label: "Super Planning", icon: "📊", color: "#4F46E5" },
      ].map(s => {
        const isActive = subTab === s.id;
        return (
          <button key={s.id} onClick={() => { setSubTab(s.id); setDetailIdx(null); }} style={{
            padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer",
            background: isActive ? "var(--ps-surface)" : "transparent",
            boxShadow: isActive ? "0 1px 3px var(--ps-shadow-sm)" : "none",
            fontSize: 12, fontWeight: isActive ? 600 : 400,
            color: isActive ? s.color : "var(--ps-text-muted)",
            display: "flex", alignItems: "center", gap: 6,
            transition: "all 0.15s ease",
          }}>
            <span style={{ fontSize: 13 }}>{s.icon}</span> {s.label}
            {s.count > 0 && (
              <span style={{ background: isActive ? s.color + "20" : "var(--ps-border)", color: isActive ? s.color : "var(--ps-text-muted)", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 10 }}>{s.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );

  // Shared: beneficiary table renderer
  const beneficiaryTable = (items, onUpdate, onAdd, onRemove, ownerKey) => {
    const filteredClientOptions = clientOptions.filter(c => c.value !== ownerKey);
    const depOptions = (factFind.dependants || []).filter(d => d.name).map((d, i) => ({ value: `dep_${i}`, label: d.name }));
    const benefOptions = [{ value: "", label: "Select..." }, ...filteredClientOptions, ...depOptions, { value: "estate", label: "Estate" }];
    return (
    <div>
      {items.length > 0 && (
        <div style={{ marginBottom: 10, border: "1px solid var(--ps-border-light)", borderRadius: 8, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead><tr style={{ background: "var(--ps-surface-alt)" }}>
              <th style={{ padding: "6px 8px", textAlign: "left", fontWeight: 600, color: "var(--ps-text-muted)", fontSize: 11, borderBottom: "1px solid var(--ps-border)" }}>Beneficiary</th>
              <th style={{ padding: "6px 8px", textAlign: "left", fontWeight: 600, color: "var(--ps-text-muted)", fontSize: 11, borderBottom: "1px solid var(--ps-border)" }}>Type</th>
              <th style={{ padding: "6px 8px", textAlign: "left", fontWeight: 600, color: "var(--ps-text-muted)", fontSize: 11, borderBottom: "1px solid var(--ps-border)" }}>Entitlement</th>
              <th style={{ padding: "6px 8px", width: 60, borderBottom: "1px solid var(--ps-border)" }}></th>
            </tr></thead>
            <tbody>
              {items.map((b, bi) => (
                <tr key={bi}>
                  <td style={{ padding: "4px 8px", borderBottom: "1px solid var(--ps-border-light)" }}>
                    <FFSelect value={b.benef_entity} onChange={v => onUpdate(bi, "benef_entity", v)}
                      options={benefOptions} />
                  </td>
                  <td style={{ padding: "4px 8px", borderBottom: "1px solid var(--ps-border-light)" }}>
                    <FFSelect value={b.benef_type} onChange={v => onUpdate(bi, "benef_type", v)}
                      options={[{ value: "", label: "Select..." }, { value: "binding", label: "Binding" }, { value: "non-binding", label: "Non-binding" }, { value: "lapsing", label: "Lapsing binding" }, { value: "non-lapsing", label: "Non-lapsing binding" }]} />
                  </td>
                  <td style={{ padding: "4px 8px", borderBottom: "1px solid var(--ps-border-light)" }}><FFInput value={b.benef_entitlement} onChange={v => onUpdate(bi, "benef_entitlement", v)} placeholder="e.g. 50%" /></td>
                  <td style={{ padding: "4px 8px", borderBottom: "1px solid var(--ps-border-light)" }}><button onClick={() => onRemove(bi)} style={{ fontSize: 10, color: "var(--ps-red)", cursor: "pointer", background: "none", border: "none", fontWeight: 500 }}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <button onClick={onAdd} style={{ padding: "5px 12px", borderRadius: 6, border: "1px dashed #0891B2", background: "var(--ps-surface-teal)", cursor: "pointer", fontSize: 11, fontWeight: 600, color: "#0891B2", display: "inline-flex", alignItems: "center", gap: 4 }}>
        <span>+</span> Add Beneficiary
      </button>
    </div>
  ); };

  // Shared: portfolio table renderer
  const portfolioTable = (items, onUpdate, onAdd, onRemove) => (
    <div>
      {items.length > 0 && (
        <div style={{ marginBottom: 10, border: "1px solid var(--ps-border-light)", borderRadius: 8, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead><tr style={{ background: "var(--ps-surface-alt)" }}>
              <th style={{ padding: "6px 8px", textAlign: "left", fontWeight: 600, color: "var(--ps-text-muted)", fontSize: 11, borderBottom: "1px solid var(--ps-border)" }}>Asset Name</th>
              <th style={{ padding: "6px 8px", textAlign: "left", fontWeight: 600, color: "var(--ps-text-muted)", fontSize: 11, borderBottom: "1px solid var(--ps-border)" }}>Allocation %</th>
              <th style={{ padding: "6px 8px", textAlign: "left", fontWeight: 600, color: "var(--ps-text-muted)", fontSize: 11, borderBottom: "1px solid var(--ps-border)" }}>Amount</th>
              <th style={{ padding: "6px 8px", width: 60, borderBottom: "1px solid var(--ps-border)" }}></th>
            </tr></thead>
            <tbody>
              {items.map((p, pi) => (
                <tr key={pi}>
                  <td style={{ padding: "4px 8px", borderBottom: "1px solid var(--ps-border-light)" }}><FFInput value={p.asset_name} onChange={v => onUpdate(pi, "asset_name", v)} placeholder="e.g. Balanced" /></td>
                  <td style={{ padding: "4px 8px", borderBottom: "1px solid var(--ps-border-light)" }}><FFInput value={p.allocation_pct} onChange={v => onUpdate(pi, "allocation_pct", v)} type="number" placeholder="%" /></td>
                  <td style={{ padding: "4px 8px", borderBottom: "1px solid var(--ps-border-light)" }}><FFInput value={p.amount} onChange={v => onUpdate(pi, "amount", v)} type="number" prefix="$" /></td>
                  <td style={{ padding: "4px 8px", borderBottom: "1px solid var(--ps-border-light)" }}><button onClick={() => onRemove(pi)} style={{ fontSize: 10, color: "var(--ps-red)", cursor: "pointer", background: "none", border: "none", fontWeight: 500 }}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <button onClick={onAdd} style={{ padding: "5px 12px", borderRadius: 6, border: "1px dashed #0891B2", background: "var(--ps-surface-teal)", cursor: "pointer", fontSize: 11, fontWeight: 600, color: "#0891B2", display: "inline-flex", alignItems: "center", gap: 4 }}>
        <span>+</span> Add Asset
      </button>
    </div>
  );

  // Shared: tax components section
  const taxComponentsSection = (data, onUpdate) => (
    <div>
      <div style={ffRowStyle}>
        <FFInput label="UNP Amount" value={data?.unp_amount} onChange={v => onUpdate("unp_amount", v)} type="number" prefix="$" />
        <FFInput label="Taxable Portion" value={data?.taxable_portion} onChange={v => onUpdate("taxable_portion", v)} type="number" prefix="$" />
      </div>
      <div style={ffRowStyle}>
        <FFInput label="Tax Free Portion" value={data?.tax_free_portion} onChange={v => onUpdate("tax_free_portion", v)} type="number" prefix="$" />
        <div />
      </div>
    </div>
  );

  // Detail tab bars per type
  const superDetailTabs = [
    { id: "fund_details", label: "Fund Details" },
    { id: "contributions", label: "Contributions" },
    { id: "tax_components", label: "Tax Components" },
    { id: "beneficiaries", label: "Beneficiaries" },
    { id: "portfolio", label: "Portfolio" },
  ];
  const pensionDetailTabs = [
    { id: "fund_details", label: "Fund Details" },
    { id: "income", label: "Income" },
    { id: "tax_components", label: "Tax Components" },
    { id: "beneficiaries", label: "Beneficiaries" },
    { id: "portfolio", label: "Portfolio" },
  ];
  const annuityDetailTabs = [
    { id: "annuity_details", label: "Annuity Details" },
    { id: "income", label: "Income" },
    { id: "tax_components", label: "Tax Components" },
    { id: "beneficiaries", label: "Beneficiaries" },
  ];

  const detailTabs = subTab === "super" ? superDetailTabs : subTab === "pension" ? pensionDetailTabs : annuityDetailTabs;
  const detailTabBar = (
    <div style={{ display: "flex", gap: 4, marginBottom: 14, padding: "2px", background: "var(--ps-border-light)", borderRadius: 8 }}>
      {detailTabs.map(t => {
        const isActive = activeDetailTab === t.id;
        return (
          <button key={t.id} onClick={() => setActiveDetailTab(t.id)} style={{
            padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer",
            background: isActive ? "var(--ps-surface)" : "transparent",
            boxShadow: isActive ? "0 1px 2px var(--ps-shadow-xs)" : "none",
            fontSize: 11, fontWeight: isActive ? 600 : 400,
            color: isActive ? "var(--ps-text-primary)" : "var(--ps-text-muted)",
            transition: "all 0.15s ease",
          }}>{t.label}</button>
        );
      })}
    </div>
  );

  // Summary card for a product
  const summaryCard = (list, type, label, icon, color, onAdd) => (
    <div>
      {list.map((data, idx) => {
        const name = type === "annuity" ? (data.product || `Annuity ${idx + 1}`) : (data.fund_name || data.product || `${label} ${idx + 1}`);
        return (
          <div key={idx} style={{ border: "1px solid var(--ps-border)", borderRadius: 12, background: "var(--ps-surface)", overflow: "hidden", marginBottom: 12, cursor: "pointer" }}
            onClick={() => { setDetailIdx(idx); setActiveDetailTab(type === "annuity" ? "annuity_details" : "fund_details"); }}>
            <div style={{ padding: "12px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: color, color: "var(--ps-surface)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{icon}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ps-text-primary)" }}>{name}</div>
                  <div style={{ fontSize: 11, color: "var(--ps-text-subtle)" }}>{clientName(data.owner)}{data.balance ? ` — $${parseFloat(data.balance).toLocaleString()}` : ""}{data.purchase_price ? ` — $${parseFloat(data.purchase_price).toLocaleString()}` : ""}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "#3B82F6", fontWeight: 500 }}>Details →</span>
                <button onClick={(e) => { e.stopPropagation(); if (type === "super") removeSuper(idx); else if (type === "pension") removePension(idx); else removeAnnuity(idx); }}
                  style={{ padding: "4px 10px", borderRadius: 5, border: "1px solid var(--ps-ring-red)", background: "var(--ps-surface-red)", cursor: "pointer", fontSize: 11, color: "var(--ps-red)", fontWeight: 500 }}>Remove</button>
              </div>
            </div>
          </div>
        );
      })}
      <button onClick={onAdd} style={{ width: "100%", padding: "20px", borderRadius: 12, border: "2px dashed #C7D2FE", background: "var(--ps-surface-indigo)", cursor: "pointer", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 13, fontWeight: 600, color: color }}>
        <span style={{ fontSize: 18 }}>+</span> Add {label}
      </button>
    </div>
  );

  return (
    <div>
      {subTabBar}

      {/* ── SUPER ── */}
      {subTab === "super" && detailIdx === null && summaryCard(superFunds, "super", "Super Fund", "💰", "#0891B2", addSuper)}

      {subTab === "super" && detailIdx !== null && superFunds[detailIdx] && (() => {
        const data = superFunds[detailIdx]; const idx = detailIdx;
        return (
          <div style={{ border: "1px solid var(--ps-border)", borderRadius: 12, background: "var(--ps-surface)", overflow: "hidden", marginBottom: 16 }}>
            <div style={{ padding: "12px 18px", background: "#0891B208", borderBottom: "1px solid var(--ps-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button onClick={() => setDetailIdx(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "var(--ps-text-muted)" }}>←</button>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ps-text-primary)" }}>{data.fund_name || `Super Fund ${idx + 1}`}</div>
              </div>
            </div>
            <div style={{ padding: 18 }}>
              {detailTabBar}
              {activeDetailTab === "fund_details" && (<div>
                <div style={ffRowStyle}>
                  <FFInput label="Fund Name" value={data.fund_name} onChange={v => updateSuper(idx, "fund_name", v)} placeholder="e.g. AustralianSuper" />
                  <FFInput label="Product" value={data.product} onChange={v => updateSuper(idx, "product", v)} placeholder="e.g. MySuper" />
                </div>
                <div style={ffRowStyle}>
                  <FFSelect label="Owner" value={data.owner} onChange={v => updateSuper(idx, "owner", v)} options={clientOptions} />
                  <FFInput label="Balance" value={data.balance} onChange={v => updateSuper(idx, "balance", v)} type="number" prefix="$" />
                </div>
              </div>)}
              {activeDetailTab === "contributions" && (<div>
                <div style={ffRowStyle}>
                  <FFRadioRow label="Super Guarantee?" value={data.contributions?.super_guarantee} onChange={v => updateSuperNested(idx, "contributions", "super_guarantee", v)}
                    options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]} />
                  <FFInput label="Salary Sacrifice" value={data.contributions?.salary_sacrifice} onChange={v => updateSuperNested(idx, "contributions", "salary_sacrifice", v)} type="number" prefix="$" />
                </div>
                <div style={ffRowStyle}>
                  <FFInput label="After Tax" value={data.contributions?.after_tax} onChange={v => updateSuperNested(idx, "contributions", "after_tax", v)} type="number" prefix="$" />
                  <FFInput label="Spouse Received" value={data.contributions?.spouse_received} onChange={v => updateSuperNested(idx, "contributions", "spouse_received", v)} type="number" prefix="$" />
                </div>
                <div style={ffRowStyle}>
                  <FFInput label="Split Received" value={data.contributions?.split_received} onChange={v => updateSuperNested(idx, "contributions", "split_received", v)} type="number" prefix="$" />
                  <FFInput label="Concessional" value={data.contributions?.concessional} onChange={v => updateSuperNested(idx, "contributions", "concessional", v)} type="number" prefix="$" />
                </div>
              </div>)}
              {activeDetailTab === "tax_components" && taxComponentsSection(data.tax_components, (f, v) => updateSuperNested(idx, "tax_components", f, v))}
              {activeDetailTab === "beneficiaries" && beneficiaryTable(
                data.beneficiaries || [],
                (bi, f, v) => updateSuperArray(idx, "beneficiaries", bi, f, v),
                () => addSuperArrayItem(idx, "beneficiaries", { benef_entity: "", benef_type: "", benef_entitlement: "" }),
                (bi) => removeSuperArrayItem(idx, "beneficiaries", bi),
                data.owner
              )}
              {activeDetailTab === "portfolio" && portfolioTable(
                data.portfolio || [],
                (pi, f, v) => updateSuperArray(idx, "portfolio", pi, f, v),
                () => addSuperArrayItem(idx, "portfolio", { asset_name: "", allocation_pct: "", amount: "" }),
                (pi) => removeSuperArrayItem(idx, "portfolio", pi)
              )}
            </div>
          </div>
        );
      })()}

      {/* ── PENSION ── */}
      {subTab === "pension" && detailIdx === null && summaryCard(pensions, "pension", "Pension", "🏦", "#7C3AED", addPension)}

      {subTab === "pension" && detailIdx !== null && pensions[detailIdx] && (() => {
        const data = pensions[detailIdx]; const idx = detailIdx;
        return (
          <div style={{ border: "1px solid var(--ps-border)", borderRadius: 12, background: "var(--ps-surface)", overflow: "hidden", marginBottom: 16 }}>
            <div style={{ padding: "12px 18px", background: "#7C3AED08", borderBottom: "1px solid var(--ps-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button onClick={() => setDetailIdx(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "var(--ps-text-muted)" }}>←</button>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ps-text-primary)" }}>{data.fund_name || `Pension ${idx + 1}`}</div>
              </div>
            </div>
            <div style={{ padding: 18 }}>
              {detailTabBar}
              {activeDetailTab === "fund_details" && (<div>
                <div style={ffRowStyle}>
                  <FFInput label="Fund Name" value={data.fund_name} onChange={v => updatePension(idx, "fund_name", v)} placeholder="e.g. AustralianSuper" />
                  <FFInput label="Product" value={data.product} onChange={v => updatePension(idx, "product", v)} placeholder="e.g. MySuper Pension" />
                </div>
                <div style={ffRowStyle}>
                  <FFSelect label="Owner" value={data.owner} onChange={v => updatePension(idx, "owner", v)} options={clientOptions} />
                  <FFInput label="Balance" value={data.balance} onChange={v => updatePension(idx, "balance", v)} type="number" prefix="$" />
                </div>
                <div style={ffRowStyle}>
                  <FFSelect label="Pension Type" value={data.pension_type} onChange={v => updatePension(idx, "pension_type", v)}
                    options={[{ value: "", label: "Select..." }, { value: "account-based", label: "Account-based pension" }, { value: "ttr", label: "Transition to retirement" }, { value: "term-allocated", label: "Term allocated pension" }, { value: "lifetime", label: "Lifetime pension" }]} />
                  <FFInput label="Commencement Date" value={data.commencement_date} onChange={v => updatePension(idx, "commencement_date", v)} type="date" />
                </div>
                <div style={ffRowStyle}>
                  <FFInput label="Purchase Price" value={data.purchase_price} onChange={v => updatePension(idx, "purchase_price", v)} type="number" prefix="$" />
                  <FFSelect label="Reversionary Nominee" value={data.reversionary_nominee} onChange={v => updatePension(idx, "reversionary_nominee", v)}
                    options={[{ value: "", label: "Select..." }, ...clientOptions.filter(c => c.value !== data.owner)]} />
                </div>
              </div>)}
              {activeDetailTab === "income" && (<div>
                <div style={ffRowStyle}>
                  <FFInput label="Annual Pension Income" value={data.income?.annual_income} onChange={v => updatePensionNested(idx, "income", "annual_income", v)} type="number" prefix="$" />
                  <FFSelect label="Frequency" value={data.income?.frequency} onChange={v => updatePensionNested(idx, "income", "frequency", v)}
                    options={[{ value: "", label: "Select..." }, { value: "annual", label: "Annual" }, { value: "quarterly", label: "Quarterly" }, { value: "monthly", label: "Monthly" }, { value: "fortnightly", label: "Fortnightly" }]} />
                </div>
                <div style={ffRowStyle}>
                  <FFInput label="Minimum Amount" value={data.income?.minimum} onChange={v => updatePensionNested(idx, "income", "minimum", v)} type="number" prefix="$" />
                  <FFInput label="Maximum Amount" value={data.income?.maximum} onChange={v => updatePensionNested(idx, "income", "maximum", v)} type="number" prefix="$" />
                </div>
                <div style={ffRowStyle}>
                  <FFInput label="Tax-Free %" value={data.income?.tax_free_pct} onChange={v => updatePensionNested(idx, "income", "tax_free_pct", v)} type="number" placeholder="%" />
                  <FFInput label="Taxable %" value={data.income?.taxable_pct} onChange={v => updatePensionNested(idx, "income", "taxable_pct", v)} type="number" placeholder="%" />
                </div>
              </div>)}
              {activeDetailTab === "tax_components" && (
                <div>
                  {taxComponentsSection(data.tax_components, (f, v) => updatePensionNested(idx, "tax_components", f, v))}
                  <div style={{ ...ffRowStyle, marginTop: 8 }}>
                    <FFInput label="Tax-Free % (at commencement)" value={data.tax_components?.tax_free_pct} onChange={v => updatePensionNested(idx, "tax_components", "tax_free_pct", v)} type="number" placeholder="%" />
                    <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 6, fontSize: 12, color: "var(--ps-text-muted)" }}>
                      {(() => {
                        const tfp = parseFloat(data.tax_components?.tax_free_portion) || 0;
                        const txp = parseFloat(data.tax_components?.taxable_portion) || 0;
                        const total = tfp + txp;
                        return total > 0 && !data.tax_components?.tax_free_pct
                          ? `Calculated: ${((tfp / total) * 100).toFixed(1)}% — click to auto-fill`
                          : "";
                      })()}
                    </div>
                  </div>
                </div>
              )}
              {activeDetailTab === "beneficiaries" && beneficiaryTable(
                data.beneficiaries || [],
                (bi, f, v) => updatePensionArray(idx, "beneficiaries", bi, f, v),
                () => addPensionArrayItem(idx, "beneficiaries", { benef_entity: "", benef_type: "", benef_entitlement: "" }),
                (bi) => removePensionArrayItem(idx, "beneficiaries", bi),
                data.owner
              )}
              {activeDetailTab === "portfolio" && portfolioTable(
                data.portfolio || [],
                (pi, f, v) => updatePensionArray(idx, "portfolio", pi, f, v),
                () => addPensionArrayItem(idx, "portfolio", { asset_name: "", allocation_pct: "", amount: "" }),
                (pi) => removePensionArrayItem(idx, "portfolio", pi)
              )}
            </div>
          </div>
        );
      })()}

      {/* ── ANNUITY ── */}
      {subTab === "annuity" && detailIdx === null && summaryCard(annuities, "annuity", "Annuity", "📄", "#D97706", addAnnuity)}

      {subTab === "annuity" && detailIdx !== null && annuities[detailIdx] && (() => {
        const data = annuities[detailIdx]; const idx = detailIdx;
        return (
          <div style={{ border: "1px solid var(--ps-border)", borderRadius: 12, background: "var(--ps-surface)", overflow: "hidden", marginBottom: 16 }}>
            <div style={{ padding: "12px 18px", background: "#D9770608", borderBottom: "1px solid var(--ps-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button onClick={() => setDetailIdx(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "var(--ps-text-muted)" }}>←</button>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ps-text-primary)" }}>{data.product || `Annuity ${idx + 1}`}</div>
              </div>
            </div>
            <div style={{ padding: 18 }}>
              {detailTabBar}
              {activeDetailTab === "annuity_details" && (<div>
                <div style={ffRowStyle}>
                  <FFRadioRow label="Joint Holding?" value={data.joint_holding ? "yes" : "no"} onChange={v => { updateAnnuity(idx, "joint_holding", v === "yes"); if (v === "yes") updateAnnuity(idx, "owner", "joint"); }}
                    options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]} />
                  <FFInput label="Product / Provider" value={data.product} onChange={v => updateAnnuity(idx, "product", v)} placeholder="e.g. Challenger Guaranteed" />
                </div>
                <div style={ffRowStyle}>
                  {data.joint_holding
                    ? <FFInput label="Owner" value={clientOptions.length >= 2 ? `${clientOptions[0].label} & ${clientOptions[1].label}` : "Both"} onChange={() => {}} disabled />
                    : <FFSelect label="Owner" value={data.owner} onChange={v => updateAnnuity(idx, "owner", v)} options={clientOptions} />
                  }
                  <FFSelect label="Annuity Type" value={data.annuity_type} onChange={v => updateAnnuity(idx, "annuity_type", v)}
                    options={[{ value: "", label: "Select..." }, { value: "fixed-term", label: "Fixed term annuity" }, { value: "lifetime", label: "Lifetime annuity" }, { value: "market-linked", label: "Market-linked annuity" }]} />
                </div>
                <div style={ffRowStyle}>
                  <FFSelect label="Tax Environment" value={data.tax_environment} onChange={v => updateAnnuity(idx, "tax_environment", v)}
                    options={[{ value: "", label: "Select..." }, { value: "super", label: "Superannuation" }, { value: "non-super", label: "Non-Superannuation" }]} />
                  <FFInput label="Purchase Price" value={data.purchase_price} onChange={v => updateAnnuity(idx, "purchase_price", v)} type="number" prefix="$" />
                  <FFInput label="Commencement Date" value={data.commencement_date} onChange={v => updateAnnuity(idx, "commencement_date", v)} type="date" />
                </div>
                <div style={ffRowStyle}>
                  <FFInput label="Maturity Date" value={data.maturity_date} onChange={v => updateAnnuity(idx, "maturity_date", v)} type="date" />
                  <FFInput label="Guaranteed Period (years)" value={data.guaranteed_period} onChange={v => updateAnnuity(idx, "guaranteed_period", v)} type="number" />
                </div>
                <div style={ffRowStyle}>
                  <FFInput label="Residual Capital Value" value={data.residual_capital_value} onChange={v => updateAnnuity(idx, "residual_capital_value", v)} type="number" prefix="$" />
                  <div />
                </div>
              </div>)}
              {activeDetailTab === "income" && (<div>
                <div style={ffRowStyle}>
                  <FFInput label="Annual Income" value={data.income?.annual_income} onChange={v => updateAnnuityNested(idx, "income", "annual_income", v)} type="number" prefix="$" />
                  <FFSelect label="Frequency" value={data.income?.frequency} onChange={v => updateAnnuityNested(idx, "income", "frequency", v)}
                    options={[{ value: "", label: "Select..." }, { value: "annual", label: "Annual" }, { value: "quarterly", label: "Quarterly" }, { value: "monthly", label: "Monthly" }, { value: "fortnightly", label: "Fortnightly" }]} />
                </div>
                <div style={ffRowStyle}>
                  <FFInput label="Tax-Free %" value={data.income?.tax_free_pct} onChange={v => updateAnnuityNested(idx, "income", "tax_free_pct", v)} type="number" placeholder="%" />
                  <FFInput label="Taxable %" value={data.income?.taxable_pct} onChange={v => updateAnnuityNested(idx, "income", "taxable_pct", v)} type="number" placeholder="%" />
                </div>
                <div style={ffRowStyle}>
                  <FFInput label="Deductible Amount" value={data.income?.deductible_amount} onChange={v => updateAnnuityNested(idx, "income", "deductible_amount", v)} type="number" prefix="$" />
                  <div />
                </div>
              </div>)}
              {activeDetailTab === "tax_components" && taxComponentsSection(data.tax_components, (f, v) => updateAnnuityNested(idx, "tax_components", f, v))}
              {activeDetailTab === "beneficiaries" && beneficiaryTable(
                data.beneficiaries || [],
                (bi, f, v) => updateAnnuityArray(idx, "beneficiaries", bi, f, v),
                () => addAnnuityArrayItem(idx, "beneficiaries", { benef_entity: "", benef_type: "", benef_entitlement: "" }),
                (bi) => removeAnnuityArrayItem(idx, "beneficiaries", bi),
                data.owner
              )}
            </div>
          </div>
        );
      })()}

      {/* ── Defined Benefit Panel — List ── */}
      {subTab === "defined_benefit" && detailIdx === null && (() => {
        const addDB = () => {
          const newRecord = { ...DB_DEFAULTS };
          definedBenefitsApi.create(newRecord, clientGuidMap).then(created => {
            updateFF("definedBenefits", [...definedBenefits, created]);
            setDetailIdx(definedBenefits.length);
          }).catch(err => console.error('[SuperannuationForm] Failed to create defined benefit:', err));
        };
        const removeDB = (idx) => {
          const db = definedBenefits[idx];
          if (db?.id) {
            definedBenefitsApi.remove(db.id).catch(err => console.error('[SuperannuationForm] Failed to remove defined benefit:', err));
          }
          updateFF("definedBenefits", definedBenefits.filter((_, i) => i !== idx));
          setDetailIdx(null);
        };
        const schemeLabel = (s) => s === "pss" ? "PSS" : s === "css" ? "CSS" : s === "other" ? "Other DB" : "Defined Benefit";
        const statusLabel = (s) => s === "contributing" ? "Contributing" : s === "preserved" ? "Preserved" : s === "pension" ? "Receiving pension" : "";
        return (
          <div>
            {definedBenefits.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🏛️</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ps-text-primary)", marginBottom: 4 }}>No Defined Benefit Schemes</div>
                <div style={{ fontSize: 12, color: "var(--ps-text-muted)", marginBottom: 16 }}>Add a PSS, CSS or other defined benefit scheme</div>
                <button onClick={addDB} style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid #059669", background: "#05966910", color: "#059669", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>+ Add Defined Benefit</button>
              </div>
            ) : (
              <>
                {definedBenefits.map((d, i) => {
                  const cl = d.owner === "client2" ? factFind.client2 : factFind.client1;
                  const name = ((cl?.first_name || "") + " " + (cl?.last_name || "")).trim() || "Client";
                  return (
                    <div key={i} onClick={() => { setDetailIdx(i); setActiveDetailTab("fund_details"); }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: 10, border: "1px solid var(--ps-border)", background: "var(--ps-surface)", marginBottom: 8, cursor: "pointer", transition: "all 0.15s ease" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: "#05966915", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🏛️</div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ps-text-primary)" }}>{schemeLabel(d.scheme)} — {name}</div>
                          <div style={{ fontSize: 11, color: "var(--ps-text-muted)" }}>{statusLabel(d.status)}{d.super_salary ? ` · Salary: $${parseFloat(d.super_salary).toLocaleString()}` : ""}{d.years_service ? ` · ${d.years_service} yrs service` : ""}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button onClick={e => { e.stopPropagation(); removeDB(i); }} style={{ background: "none", border: "none", color: "#DC2626", fontSize: 14, cursor: "pointer", padding: 4 }}>✕</button>
                        <span style={{ color: "var(--ps-text-muted)", fontSize: 14 }}>›</span>
                      </div>
                    </div>
                  );
                })}
                <button onClick={addDB} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px dashed var(--ps-border-mid)", background: "transparent", color: "#059669", fontSize: 12, fontWeight: 600, cursor: "pointer", marginTop: 4 }}>+ Add Another Scheme</button>
              </>
            )}
          </div>
        );
      })()}

      {/* ── Defined Benefit Panel — Detail ── */}
      {/* ── SUPER PLANNING ── */}
      {subTab === "super_planning" && (() => {
        const TBC_CAP = 1900000;
        const LRT_CAP = 235000;
        const planningData = factFind.tax_super_planning || {};
        const updatePlanningClient = (clientKey, field, value) => {
          const d = factFind.tax_super_planning || {};
          updateFF("tax_super_planning", { ...d, [clientKey]: { ...(d[clientKey] || {}), [field]: value } });
        };
        const fmtCurrency = (v) => { const n = parseFloat(v); return isNaN(n) ? "$0" : "$" + Math.round(n).toLocaleString("en-AU"); };
        const remaining = (cap, used) => Math.max(0, cap - (parseFloat(used) || 0));

        return (
          <div>
            {clientOptions.map(c => {
              const cd = planningData[c.value] || {};
              const corMet = cd.condition_of_release === true;
              const bfTriggered = cd.bring_forward_triggered === true;
              const bfUsed = parseFloat(cd.bring_forward_used) || 0;
              const tbcUsed = parseFloat(cd.tbc_used) || 0;
              const lrtUsed = parseFloat(cd.low_rate_used) || 0;

              return (
                <div key={c.value} style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#4F46E5", marginBottom: 12, paddingBottom: 8, borderBottom: "2px solid var(--ps-surface-indigo)" }}>
                    {c.label}
                  </div>

                  {/* Condition of Release */}
                  <div style={{ border: "1px solid var(--ps-border)", borderRadius: 12, background: "var(--ps-surface)", overflow: "hidden", marginBottom: 12 }}>
                    <div style={{ padding: "10px 16px", background: "#4F46E508", borderBottom: "1px solid var(--ps-border)", display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 13 }}>🔓</span>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ps-text-primary)" }}>Condition of Release</div>
                    </div>
                    <div style={{ padding: 16 }}>
                      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                        {[{ value: "yes", label: "✓ Met" }, { value: "no", label: "✗ Not yet met" }].map(o => (
                          <button key={o.value} onClick={() => updatePlanningClient(c.value, "condition_of_release", o.value === "yes")}
                            style={{ padding: "4px 12px", borderRadius: 6, border: (cd.condition_of_release === true ? "yes" : cd.condition_of_release === false ? "no" : "") === o.value ? "2px solid #4F46E5" : "1px solid var(--ps-border)", background: (cd.condition_of_release === true ? "yes" : cd.condition_of_release === false ? "no" : "") === o.value ? "var(--ps-surface-indigo)" : "var(--ps-surface)", color: (cd.condition_of_release === true ? "yes" : cd.condition_of_release === false ? "no" : "") === o.value ? "#4F46E5" : "var(--ps-text-muted)", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                            {o.label}
                          </button>
                        ))}
                      </div>
                      {corMet && (
                        <FFInput label="Date met" value={cd.condition_of_release_date || ""} onChange={v => updatePlanningClient(c.value, "condition_of_release_date", v)} placeholder="e.g. 01/07/2024" />
                      )}
                      {!corMet && cd.condition_of_release === false && (
                        <div style={{ fontSize: 11, color: "var(--ps-red)", marginTop: 6 }}>Preservation age restrictions apply. Lump sum tax rates will be applied to withdrawals.</div>
                      )}
                    </div>
                  </div>

                  {/* Bring-Forward NCC Rule */}
                  <div style={{ border: "1px solid var(--ps-border)", borderRadius: 12, background: "var(--ps-surface)", overflow: "hidden", marginBottom: 12 }}>
                    <div style={{ padding: "10px 16px", background: "#4F46E508", borderBottom: "1px solid var(--ps-border)", display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 13 }}>📥</span>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ps-text-primary)" }}>Bring-Forward NCC Rule</div>
                    </div>
                    <div style={{ padding: 16 }}>
                      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                        {[{ value: "yes", label: "✓ Triggered" }, { value: "no", label: "Not triggered" }].map(o => (
                          <button key={o.value} onClick={() => updatePlanningClient(c.value, "bring_forward_triggered", o.value === "yes")}
                            style={{ padding: "4px 12px", borderRadius: 6, border: (bfTriggered ? "yes" : "no") === o.value ? "2px solid #4F46E5" : "1px solid var(--ps-border)", background: (bfTriggered ? "yes" : "no") === o.value ? "var(--ps-surface-indigo)" : "var(--ps-surface)", color: (bfTriggered ? "yes" : "no") === o.value ? "#4F46E5" : "var(--ps-text-muted)", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                            {o.label}
                          </button>
                        ))}
                      </div>
                      {bfTriggered && (
                        <div>
                          <div style={ffRowStyle}>
                            <FFInput label="Year triggered" value={cd.bring_forward_year || ""} onChange={v => updatePlanningClient(c.value, "bring_forward_year", v)} placeholder="e.g. 2023" />
                            <FFInput label="Amount used" value={cd.bring_forward_used || ""} onChange={v => updatePlanningClient(c.value, "bring_forward_used", v)} type="number" prefix="$" placeholder="0" />
                          </div>
                          <div style={{ padding: "10px 14px", background: "var(--ps-surface-green)", borderRadius: 8, border: "1px solid var(--ps-ring-emerald)", marginTop: 8 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid var(--ps-border-light)" }}>
                              <span style={{ fontSize: 12, color: "var(--ps-text-muted)" }}>Total 3-year cap</span>
                              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ps-text-primary)" }}>{fmtCurrency(360000)}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid var(--ps-border-light)" }}>
                              <span style={{ fontSize: 12, color: "var(--ps-text-muted)" }}>Used</span>
                              <span style={{ fontSize: 13, fontWeight: 700, color: bfUsed > 0 ? "#DC2626" : "var(--ps-text-muted)" }}>{fmtCurrency(bfUsed)}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                              <span style={{ fontSize: 12, color: "var(--ps-text-muted)" }}>Remaining</span>
                              <span style={{ fontSize: 13, fontWeight: 700, color: remaining(360000, bfUsed) > 0 ? "var(--ps-green)" : "var(--ps-red)" }}>{fmtCurrency(remaining(360000, bfUsed))}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Transfer Balance Cap */}
                  <div style={{ border: "1px solid var(--ps-border)", borderRadius: 12, background: "var(--ps-surface)", overflow: "hidden", marginBottom: 12 }}>
                    <div style={{ padding: "10px 16px", background: "#4F46E508", borderBottom: "1px solid var(--ps-border)", display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 13 }}>🏦</span>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ps-text-primary)" }}>Transfer Balance Cap</div>
                    </div>
                    <div style={{ padding: 16 }}>
                      <FFInput label="TBC used" value={cd.tbc_used || ""} onChange={v => updatePlanningClient(c.value, "tbc_used", v)} type="number" prefix="$" placeholder="0" />
                      <div style={{ padding: "10px 14px", background: "var(--ps-surface-green)", borderRadius: 8, border: "1px solid var(--ps-ring-emerald)", marginTop: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid var(--ps-border-light)" }}>
                          <span style={{ fontSize: 12, color: "var(--ps-text-muted)" }}>Cap</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ps-text-primary)" }}>{fmtCurrency(TBC_CAP)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid var(--ps-border-light)" }}>
                          <span style={{ fontSize: 12, color: "var(--ps-text-muted)" }}>Used</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: tbcUsed > 0 ? "#DC2626" : "var(--ps-text-muted)" }}>{fmtCurrency(tbcUsed)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                          <span style={{ fontSize: 12, color: "var(--ps-text-muted)" }}>Remaining</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: remaining(TBC_CAP, tbcUsed) > 0 ? "var(--ps-green)" : "var(--ps-red)" }}>{fmtCurrency(remaining(TBC_CAP, tbcUsed))}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Low Rate Threshold */}
                  <div style={{ border: "1px solid var(--ps-border)", borderRadius: 12, background: "var(--ps-surface)", overflow: "hidden", marginBottom: 12 }}>
                    <div style={{ padding: "10px 16px", background: "#4F46E508", borderBottom: "1px solid var(--ps-border)", display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 13 }}>📉</span>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ps-text-primary)" }}>Low Rate Threshold</div>
                    </div>
                    <div style={{ padding: 16 }}>
                      <FFInput label="Amount used to date" value={cd.low_rate_used || ""} onChange={v => updatePlanningClient(c.value, "low_rate_used", v)} type="number" prefix="$" placeholder="0" />
                      <div style={{ padding: "10px 14px", background: "var(--ps-surface-green)", borderRadius: 8, border: "1px solid var(--ps-ring-emerald)", marginTop: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid var(--ps-border-light)" }}>
                          <span style={{ fontSize: 12, color: "var(--ps-text-muted)" }}>Cap</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ps-text-primary)" }}>{fmtCurrency(LRT_CAP)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid var(--ps-border-light)" }}>
                          <span style={{ fontSize: 12, color: "var(--ps-text-muted)" }}>Used</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: lrtUsed > 0 ? "#DC2626" : "var(--ps-text-muted)" }}>{fmtCurrency(lrtUsed)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                          <span style={{ fontSize: 12, color: "var(--ps-text-muted)" }}>Remaining</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: remaining(LRT_CAP, lrtUsed) > 0 ? "var(--ps-green)" : "var(--ps-red)" }}>{fmtCurrency(remaining(LRT_CAP, lrtUsed))}</span>
                        </div>
                      </div>
                      {lrtUsed >= LRT_CAP && (
                        <div style={{ fontSize: 11, color: "var(--ps-red)", fontWeight: 600, marginTop: 8 }}>Low rate cap fully exhausted — 15% + Medicare applies to taxable component withdrawals</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {subTab === "defined_benefit" && detailIdx !== null && definedBenefits[detailIdx] && (() => {
        const db = definedBenefits[detailIdx];
        const idx = detailIdx;
        const updateDB = (field, value) => {
          const updatedRecord = { ...db, [field]: value };
          const updated = definedBenefits.map((d, i) => i === idx ? updatedRecord : d);
          updateFF("definedBenefits", updated);
          if (updatedRecord.id) {
            debouncedUpdateDB(updatedRecord.id, updatedRecord);
          }
        };
        const removeDB = () => {
          if (db?.id) {
            definedBenefitsApi.remove(db.id).catch(err => console.error('[SuperannuationForm] Failed to remove defined benefit:', err));
          }
          updateFF("definedBenefits", definedBenefits.filter((_, i) => i !== idx));
          setDetailIdx(null);
        };

        const scheme = db.scheme || "";
        const isPSS = scheme === "pss";
        const isCSS = scheme === "css";
        const isOther = scheme === "other";

        // Projection calculations
        const currentSalary = parseFloat(db.super_salary) || 0;
        const salaryGrowth = (parseFloat(db.salary_growth) || 3) / 100;
        const exitAge = parseFloat(db.expected_exit_age) || 65;
        const clientAge = db.owner === "client2" ? (parseFloat(factFind.client2?.age) || 55) : (parseFloat(factFind.client1?.age) || 55);
        const yearsToExit = Math.max(0, exitAge - clientAge);

        // PSS projections
        const currentABM = parseFloat(db.current_abm) || 0;
        const contribRate = (parseFloat(db.contribution_rate) || 5) / 100;
        const tenYearMet = db.ten_year_rule_met === "yes";
        const abmAccrual = isPSS ? (tenYearMet ? 0.11 + (2 * contribRate) : 0.11 + (2 * Math.min(contribRate, 0.05))) : 0;
        const projectedABM = currentABM + (abmAccrual * yearsToExit);
        const projectedFAS = currentSalary * Math.pow(1 + salaryGrowth, yearsToExit);
        const projectedBenefit = isPSS ? Math.round(projectedFAS * projectedABM) : 0;
        const pssMBL = projectedFAS >= 50000 ? projectedFAS * 10 : 500000;
        const cappedBenefit = isPSS ? Math.min(projectedBenefit, pssMBL) : projectedBenefit;

        // PSS pension conversion factor (approximate)
        const pcf = exitAge <= 55 ? 12 : exitAge <= 60 ? 12 - ((exitAge - 55) * 0.2) : exitAge <= 65 ? 11 - ((exitAge - 60) * 0.2) : 10;
        const projectedPension = isPSS && pcf > 0 ? Math.round(cappedBenefit / pcf) : 0;

        // CSS projections
        const cssYearsService = parseFloat(db.years_service) || 0;
        const cssProjectedYears = cssYearsService + yearsToExit;
        const cssProjectedSalary = currentSalary * Math.pow(1 + salaryGrowth, yearsToExit);
        const cssPensionPct = isCSS ? Math.min(0.525, (cssProjectedYears / 40) * 0.525) * (exitAge >= 65 ? 1 : exitAge >= 60 ? 0.95 : exitAge >= 55 ? 0.85 : 0.75) : 0;
        const cssProjectedPension = isCSS ? Math.round(cssProjectedSalary * cssPensionPct) : 0;

        const kpiStyle = { flex: 1, padding: "10px 14px", borderRadius: 8, background: "var(--ps-surface-alt)", border: "1px solid var(--ps-border)" };
        const kpiLabel = { fontSize: 10, fontWeight: 600, color: "var(--ps-text-muted)" };
        const kpiVal = { fontSize: 16, fontWeight: 800, color: "var(--ps-text-primary)", fontFamily: "'JetBrains Mono', monospace" };

        return (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => setDetailIdx(null)}>
                <span style={{ fontSize: 16 }}>←</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ps-text-primary)" }}>
                  {isPSS ? "PSS" : isCSS ? "CSS" : isOther ? (db.other_scheme_name || "Other DB") : "Defined Benefit"} — {db.owner === "client2" ? (factFind.client2?.first_name || "Client 2") : (factFind.client1?.first_name || "Client 1")}
                </span>
              </div>
              <button onClick={removeDB} style={{ background: "#FEE2E2", border: "1px solid #FECACA", borderRadius: 6, padding: "4px 10px", fontSize: 11, color: "#991B1B", cursor: "pointer" }}>Remove</button>
            </div>

            <div style={{ border: "1px solid var(--ps-border)", borderRadius: 12, background: "var(--ps-surface)", padding: 18 }}>
              {/* Scheme Selection */}
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-subtle)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Scheme Details</div>
              <div style={ffRowStyle}>
                <FFSelect label="Owner" value={db.owner} onChange={v => updateDB("owner", v)}
                  options={[{ value: "client1", label: factFind.client1?.first_name || "Client 1" }, ...(factFind.client2?.first_name ? [{ value: "client2", label: factFind.client2.first_name }] : [])]} />
                <FFSelect label="Scheme" value={db.scheme} onChange={v => updateDB("scheme", v)}
                  options={[{ value: "", label: "Select..." }, { value: "pss", label: "PSS — Public Sector Superannuation" }, { value: "css", label: "CSS — Commonwealth Superannuation" }, { value: "other", label: "Other Defined Benefit" }]} />
              </div>
              <div style={ffRowStyle}>
                <FFSelect label="Status" value={db.status} onChange={v => updateDB("status", v)}
                  options={[{ value: "", label: "Select..." }, { value: "contributing", label: "Contributing member" }, { value: "preserved", label: "Preserved / Deferred" }, { value: "pension", label: "Already receiving pension" }]} />
                <FFInput label="Date Joined" value={db.date_joined} onChange={v => updateDB("date_joined", v)} type="date" />
              </div>

              {isOther && (
                <div style={ffRowStyle}>
                  <FFInput label="Scheme Name" value={db.other_scheme_name} onChange={v => updateDB("other_scheme_name", v)} placeholder="e.g. State Super, DFRDB" />
                  <div />
                </div>
              )}

              {/* Salary & Service */}
              <div style={{ height: 1, background: "var(--ps-border-light)", margin: "12px 0 16px" }} />
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-subtle)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Salary & Service</div>
              <div style={ffRowStyle}>
                <FFInput label="Current Super Salary" value={db.super_salary} onChange={v => updateDB("super_salary", v)} type="number" prefix="$" />
                <FFInput label="Salary Growth (% p.a.)" value={db.salary_growth} onChange={v => updateDB("salary_growth", v)} type="number" placeholder="3" />
              </div>
              <div style={ffRowStyle}>
                <FFInput label="Years of Contributory Service" value={db.years_service} onChange={v => updateDB("years_service", v)} type="number" placeholder="e.g. 25" />
                <FFInput label="Expected Exit Age" value={db.expected_exit_age} onChange={v => updateDB("expected_exit_age", v)} type="number" placeholder="e.g. 60" />
              </div>
              <div style={ffRowStyle}>
                <FFSelect label="Contribution Rate" value={db.contribution_rate} onChange={v => updateDB("contribution_rate", v)}
                  options={isPSS ? [
                    { value: "", label: "Select..." }, { value: "2", label: "2%" }, { value: "3", label: "3%" }, { value: "4", label: "4%" }, { value: "5", label: "5% (default)" },
                    { value: "6", label: "6%" }, { value: "7", label: "7%" }, { value: "8", label: "8%" }, { value: "9", label: "9%" }, { value: "10", label: "10%" }
                  ] : isCSS ? [
                    { value: "", label: "Select..." }, { value: "0", label: "0% (non-contributing)" }, { value: "5", label: "5%" }
                  ] : [
                    { value: "", label: "Select..." }, { value: "0", label: "0%" }, { value: "5", label: "5%" }, { value: "10", label: "10%" }
                  ]} />
                <div />
              </div>

              {/* PSS-specific fields */}
              {isPSS && (<>
                <div style={{ height: 1, background: "var(--ps-border-light)", margin: "12px 0 16px" }} />
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-subtle)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>PSS — Benefit Multiple</div>
                <div style={ffRowStyle}>
                  <FFInput label="Current ABM (from statement)" value={db.current_abm} onChange={v => updateDB("current_abm", v)} type="number" placeholder="e.g. 4.20" />
                  <FFSelect label="10-Year Rule Met?" value={db.ten_year_rule_met} onChange={v => updateDB("ten_year_rule_met", v)}
                    options={[{ value: "", label: "Select..." }, { value: "yes", label: "Yes — 260+ CDDs" }, { value: "no", label: "No — under 260 CDDs" }]} />
                </div>
              </>)}

              {/* CSS-specific fields */}
              {isCSS && (<>
                <div style={{ height: 1, background: "var(--ps-border-light)", margin: "12px 0 16px" }} />
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-subtle)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>CSS — Scheme Details</div>
                <div style={ffRowStyle}>
                  <FFInput label="Accumulated Basic Contributions" value={db.accumulated_basic_contribs} onChange={v => updateDB("accumulated_basic_contribs", v)} type="number" prefix="$" placeholder="From benefit statement" />
                  <FFSelect label="Joined before 1 July 1976?" value={db.pre_1976_joiner} onChange={v => updateDB("pre_1976_joiner", v)}
                    options={[{ value: "", label: "Select..." }, { value: "yes", label: "Yes" }, { value: "no", label: "No" }]} />
                </div>
                {(() => {
                  // 54/11 eligibility: must have joined before 1 July 1990 AND currently under 55
                  const joinDate = db.date_joined ? new Date(db.date_joined.split("/").reverse().join("-")) : null;
                  const eligibleByJoin = joinDate && joinDate < new Date("1990-07-01");
                  const ownerDob = db.owner === "client1" ? factFind.client1?.date_of_birth : factFind.client2?.date_of_birth;
                  const ownerAge = ownerDob ? (() => { const d = new Date(ownerDob); const n = new Date(); let a = n.getFullYear() - d.getFullYear(); if (n.getMonth() < d.getMonth() || (n.getMonth() === d.getMonth() && n.getDate() < d.getDate())) a--; return a; })() : null;
                  const eligibleByAge = ownerAge !== null && ownerAge < 55;
                  if (eligibleByJoin && eligibleByAge) return (
                    <div style={ffRowStyle}>
                      <FFSelect label="Planning 54/11 Strategy?" value={db.planning_54_11} onChange={v => updateDB("planning_54_11", v)}
                        options={[{ value: "", label: "Select..." }, { value: "yes", label: "Yes — resign before 55th birthday" }, { value: "no", label: "No" }, { value: "already_done", label: "Already completed 54/11" }]} />
                      <div />
                    </div>
                  );
                  if (eligibleByJoin && ownerAge !== null && ownerAge >= 55) return (
                    <div style={{ fontSize: 12, color: "var(--ps-text-muted)", fontStyle: "italic", marginTop: 4, marginBottom: 8 }}>54/11 strategy not available — member is already 55+</div>
                  );
                  return null;
                })()}
              </>)}

              {/* Component Balances */}
              <div style={{ height: 1, background: "var(--ps-border-light)", margin: "12px 0 16px" }} />
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-subtle)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Component Balances (from latest statement)</div>
              <div style={ffRowStyle}>
                <FFInput label="Member Component" value={db.member_component} onChange={v => updateDB("member_component", v)} type="number" prefix="$" />
                <FFInput label="Productivity Component" value={db.productivity_component} onChange={v => updateDB("productivity_component", v)} type="number" prefix="$" />
              </div>
              {isPSS && (
                <div style={ffRowStyle}>
                  <FFInput label="Employer Component" value={db.employer_component} onChange={v => updateDB("employer_component", v)} type="number" prefix="$" />
                  <div />
                </div>
              )}

              {/* Benefit Preference */}
              <div style={{ height: 1, background: "var(--ps-border-light)", margin: "12px 0 16px" }} />
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-subtle)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Benefit Preference</div>
              <div style={ffRowStyle}>
                <FFSelect label="How do you want to take your benefit?" value={db.benefit_preference} onChange={v => updateDB("benefit_preference", v)}
                  options={isPSS ? [
                    { value: "", label: "Select..." }, { value: "pension", label: "Full lifetime indexed pension" }, { value: "lump_sum", label: "Full lump sum" }, { value: "combination", label: "Combination (pension + lump sum)" }
                  ] : isCSS ? [
                    { value: "", label: "Select..." }, { value: "indexed_pension", label: "CPI-indexed pension only" }, { value: "indexed_plus_nonindexed", label: "Indexed + non-indexed pension" },
                    { value: "indexed_plus_lump", label: "Indexed pension + lump sum" }, { value: "lump_sum", label: "Full lump sum" }
                  ] : [
                    { value: "", label: "Select..." }, { value: "pension", label: "Pension" }, { value: "lump_sum", label: "Lump sum" }, { value: "combination", label: "Combination" }
                  ]} />
                {(db.benefit_preference === "combination") && (
                  <FFInput label="Lump Sum %" value={db.combination_lump_pct} onChange={v => updateDB("combination_lump_pct", v)} type="number" placeholder="e.g. 30" />
                )}
                {db.benefit_preference !== "combination" && <div />}
              </div>

              {/* Already receiving pension */}
              {db.status === "pension" && (<>
                <div style={{ height: 1, background: "var(--ps-border-light)", margin: "12px 0 16px" }} />
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-subtle)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Current Pension</div>
                <div style={ffRowStyle}>
                  <FFInput label="Annual Pension Amount" value={db.current_pension_annual} onChange={v => updateDB("current_pension_annual", v)} type="number" prefix="$" />
                  <FFSelect label="CPI Indexed?" value={db.pension_indexed} onChange={v => updateDB("pension_indexed", v)}
                    options={[{ value: "", label: "Select..." }, { value: "yes", label: "Yes" }, { value: "no", label: "No" }]} />
                </div>
              </>)}

              {/* Preserved benefit */}
              {db.status === "preserved" && (
                <div style={ffRowStyle}>
                  <FFInput label="Total Preserved Benefit" value={db.preserved_benefit} onChange={v => updateDB("preserved_benefit", v)} type="number" prefix="$" />
                  <div />
                </div>
              )}

              {/* Other scheme */}
              {isOther && (<>
                <div style={{ height: 1, background: "var(--ps-border-light)", margin: "12px 0 16px" }} />
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-subtle)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Other Scheme Details</div>
                <div style={ffRowStyle}>
                  <FFInput label="Estimated Annual Pension at Retirement" value={db.estimated_annual_pension} onChange={v => updateDB("estimated_annual_pension", v)} type="number" prefix="$" />
                  <div />
                </div>
              </>)}

              {/* Notes */}
              <div style={{ height: 1, background: "var(--ps-border-light)", margin: "12px 0 16px" }} />
              <div style={ffRowStyle}>
                <FFInput label="Notes" value={db.notes} onChange={v => updateDB("notes", v)} placeholder="Any additional details..." />
              </div>

              {/* Projection KPIs */}
              {(isPSS || isCSS) && db.status === "contributing" && currentSalary > 0 && (<>
                <div style={{ height: 1, background: "var(--ps-border-light)", margin: "12px 0 16px" }} />
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-subtle)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Projected Benefit at Exit (age {exitAge})</div>
                {isPSS && (
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <div style={kpiStyle}>
                      <div style={kpiLabel}>Projected FAS</div>
                      <div style={kpiVal}>${Math.round(projectedFAS).toLocaleString()}</div>
                    </div>
                    <div style={kpiStyle}>
                      <div style={kpiLabel}>Projected ABM</div>
                      <div style={kpiVal}>{projectedABM.toFixed(2)}</div>
                      <div style={{ fontSize: 9, color: "var(--ps-text-subtle)" }}>+{abmAccrual.toFixed(2)}/yr x {yearsToExit} yrs</div>
                    </div>
                    <div style={kpiStyle}>
                      <div style={kpiLabel}>Total Benefit</div>
                      <div style={{ ...kpiVal, color: "var(--ps-green)" }}>${cappedBenefit.toLocaleString()}</div>
                      {projectedBenefit > pssMBL && <div style={{ fontSize: 9, color: "#DC2626" }}>Capped at MBL (${Math.round(pssMBL).toLocaleString()})</div>}
                    </div>
                    <div style={kpiStyle}>
                      <div style={kpiLabel}>Est. Annual Pension</div>
                      <div style={{ ...kpiVal, color: "#7C3AED" }}>${projectedPension.toLocaleString()}/yr</div>
                      <div style={{ fontSize: 9, color: "var(--ps-text-subtle)" }}>PCF: {pcf.toFixed(1)} at age {exitAge}</div>
                    </div>
                  </div>
                )}
                {isCSS && (
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <div style={kpiStyle}>
                      <div style={kpiLabel}>Projected Final Salary</div>
                      <div style={kpiVal}>${Math.round(cssProjectedSalary).toLocaleString()}</div>
                    </div>
                    <div style={kpiStyle}>
                      <div style={kpiLabel}>Projected Years Service</div>
                      <div style={kpiVal}>{cssProjectedYears.toFixed(1)} yrs</div>
                    </div>
                    <div style={kpiStyle}>
                      <div style={kpiLabel}>Pension % of Salary</div>
                      <div style={kpiVal}>{(cssPensionPct * 100).toFixed(1)}%</div>
                    </div>
                    <div style={kpiStyle}>
                      <div style={kpiLabel}>Est. Annual Indexed Pension</div>
                      <div style={{ ...kpiVal, color: "#7C3AED" }}>${cssProjectedPension.toLocaleString()}/yr</div>
                    </div>
                  </div>
                )}
                <div style={{ padding: "8px 12px", borderRadius: 8, background: "var(--ps-surface-indigo)", border: "1px solid var(--ps-ring-indigo)", fontSize: 10, color: "var(--ps-text-secondary)", marginTop: 8 }}>
                  These projections are indicative only. Actual benefits depend on scheme rules, salary history, and decisions at exit. Always refer to your latest CSC benefit estimate.
                </div>
              </>)}
            </div>
          </div>
        );
      })()}
    </div>
  );
}


// ===========================================================================
// FACT FIND — Investments Form (Wraps & Investment Bonds, aligned to Base44)
// ===========================================================================

export const WRAP_DEFAULTS = {
  platform_name: "",
  owner: "client1",
  account_number: "",
  balance: "",
  portfolio: [],                 // [{ asset_name, asset_code, amount, allocation_pct }]
  fees: {
    admin_fee_type: "",          // "percentage" or "dollar"
    admin_fee_value: "",
    adviser_fee_type: "",
    adviser_fee_value: "",
    other_fees: "",
  },
};

export const INV_BOND_DEFAULTS = {
  product_name: "",
  owner: "client1",
  policy_number: "",
  balance: "",
  commencement_date: "",
  tax_treatment: "",             // "tax_paid" or "tax_deferred"
  portfolio: [],
};

export function InvestmentsForm({ factFind, updateFF, clientId, clientGuidMap }) {
  const [subTab, setSubTab] = useState("wraps");
  const [detailIdx, setDetailIdx] = useState(null);
  const [activeDetailTab, setActiveDetailTab] = useState("platform_details");
  const debounceTimers = useRef({});

  const wraps = factFind.wraps || [];
  const bonds = factFind.investmentBonds || [];

  // Load investments from API on mount
  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    async function load() {
      try {
        const [wrapsData, bondsData] = await Promise.all([
          investmentWrapsApi.getAll(clientId),
          investmentBondsApi.getAll(clientId),
        ]);
        if (cancelled) return;
        updateFF("wraps", Array.isArray(wrapsData) ? wrapsData : []);
        updateFF("investmentBonds", Array.isArray(bondsData) ? bondsData : []);
      } catch (error) {
        console.error("Failed to load investments:", error);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [clientId]);

  // Cleanup debounce timers on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(clearTimeout);
    };
  }, []);

  // Debounced wrap update to API
  const debouncedWrapUpdate = useCallback((id, data) => {
    const key = `wrap_${id}`;
    if (debounceTimers.current[key]) clearTimeout(debounceTimers.current[key]);
    debounceTimers.current[key] = setTimeout(async () => {
      try {
        await investmentWrapsApi.update(id, data);
      } catch (error) {
        console.error("Failed to update wrap:", error);
      }
    }, 1500);
  }, []);

  // Debounced bond update to API
  const debouncedBondUpdate = useCallback((id, data) => {
    const key = `bond_${id}`;
    if (debounceTimers.current[key]) clearTimeout(debounceTimers.current[key]);
    debounceTimers.current[key] = setTimeout(async () => {
      try {
        await investmentBondsApi.update(id, data);
      } catch (error) {
        console.error("Failed to update bond:", error);
      }
    }, 1500);
  }, []);

  const hasClients = factFind.client1 !== null || factFind.client2 !== null;
  const clientOptions = [];
  if (factFind.client1) clientOptions.push({ value: "client1", label: ((factFind.client1?.first_name || "") + " " + (factFind.client1?.last_name || "")).trim() || "Client 1" });
  if (factFind.client2) clientOptions.push({ value: "client2", label: ((factFind.client2?.first_name || "") + " " + (factFind.client2?.last_name || "")).trim() || "Client 2" });
  clientOptions.push({ value: "joint", label: "Joint" });
  (factFind.trusts || []).forEach((t, i) => { if (t.trust_name) clientOptions.push({ value: `trust_${i}`, label: t.trust_name }); });
  (factFind.companies || []).forEach((c, i) => { if (c.company_name) clientOptions.push({ value: `company_${i}`, label: c.company_name }); });
  (factFind.smsfs || []).forEach((s, i) => { if (s.smsf_name) clientOptions.push({ value: `smsf_${i}`, label: s.smsf_name }); });

  const clientName = (id) => {
    const found = clientOptions.find(c => c.value === id);
    return found ? found.label : id || "—";
  };

  // Wrap CRUD
  const addWrap = useCallback(async () => {
    const newWrap = { ...WRAP_DEFAULTS, fees: { ...WRAP_DEFAULTS.fees }, portfolio: [] };
    try {
      const created = await investmentWrapsApi.create(newWrap, clientGuidMap);
      updateFF("wraps", [...wraps, { ...newWrap, ...created }]);
    } catch (error) {
      console.error("Failed to create wrap:", error);
      updateFF("wraps", [...wraps, newWrap]);
    }
  }, [wraps, clientGuidMap, updateFF]);

  const removeWrap = useCallback(async (idx) => {
    const wrap = wraps[idx];
    if (wrap?.id) {
      try {
        await investmentWrapsApi.remove(wrap.id);
      } catch (error) {
        console.error("Failed to remove wrap:", error);
        return;
      }
    }
    updateFF("wraps", wraps.filter((_, i) => i !== idx));
    setDetailIdx(null);
  }, [wraps, updateFF]);

  const updateWrap = useCallback((idx, field, value) => {
    const updated = wraps.map((item, i) => i === idx ? { ...item, [field]: value } : item);
    updateFF("wraps", updated);
    const record = updated[idx];
    if (record?.id) debouncedWrapUpdate(record.id, record);
  }, [wraps, updateFF, debouncedWrapUpdate]);

  const updateWrapNested = useCallback((idx, parent, field, value) => {
    const updated = wraps.map((item, i) => i === idx ? { ...item, [parent]: { ...item[parent], [field]: value } } : item);
    updateFF("wraps", updated);
    const record = updated[idx];
    if (record?.id) debouncedWrapUpdate(record.id, record);
  }, [wraps, updateFF, debouncedWrapUpdate]);

  const updateWrapArray = useCallback((idx, arrName, arrIdx, field, value) => {
    const updated = wraps.map((item, i) => i === idx ? { ...item, [arrName]: item[arrName].map((a, ai) => ai === arrIdx ? { ...a, [field]: value } : a) } : item);
    updateFF("wraps", updated);
    const record = updated[idx];
    if (record?.id) debouncedWrapUpdate(record.id, record);
  }, [wraps, updateFF, debouncedWrapUpdate]);

  const addWrapArrayItem = useCallback(async (idx, arrName, template) => {
    const wrap = wraps[idx];
    if (wrap?.id && arrName === 'portfolio') {
      try {
        const created = await investmentWrapsApi.addPortfolioItem(wrap.id, template);
        const updated = wraps.map((item, i) => i === idx ? { ...item, [arrName]: [...(item[arrName] || []), { ...template, ...created }] } : item);
        updateFF("wraps", updated);
        return;
      } catch (error) {
        console.error("Failed to add portfolio item:", error);
      }
    }
    updateFF("wraps", wraps.map((item, i) => i === idx ? { ...item, [arrName]: [...(item[arrName] || []), template] } : item));
  }, [wraps, updateFF]);

  const removeWrapArrayItem = useCallback(async (idx, arrName, arrIdx) => {
    const wrap = wraps[idx];
    const item = wrap?.[arrName]?.[arrIdx];
    if (wrap?.id && arrName === 'portfolio' && item?.id) {
      try {
        await investmentWrapsApi.removePortfolioItem(wrap.id, item.id);
      } catch (error) {
        console.error("Failed to remove portfolio item:", error);
        return;
      }
    }
    updateFF("wraps", wraps.map((w, i) => i === idx ? { ...w, [arrName]: w[arrName].filter((_, ai) => ai !== arrIdx) } : w));
  }, [wraps, updateFF]);

  // Bond CRUD
  const addBond = useCallback(async () => {
    const newBond = { ...INV_BOND_DEFAULTS, portfolio: [] };
    try {
      const created = await investmentBondsApi.create(newBond, clientGuidMap);
      updateFF("investmentBonds", [...bonds, { ...newBond, ...created }]);
    } catch (error) {
      console.error("Failed to create bond:", error);
      updateFF("investmentBonds", [...bonds, newBond]);
    }
  }, [bonds, clientGuidMap, updateFF]);

  const removeBond = useCallback(async (idx) => {
    const bond = bonds[idx];
    if (bond?.id) {
      try {
        await investmentBondsApi.remove(bond.id);
      } catch (error) {
        console.error("Failed to remove bond:", error);
        return;
      }
    }
    updateFF("investmentBonds", bonds.filter((_, i) => i !== idx));
    setDetailIdx(null);
  }, [bonds, updateFF]);

  const updateBond = useCallback((idx, field, value) => {
    const updated = bonds.map((item, i) => i === idx ? { ...item, [field]: value } : item);
    updateFF("investmentBonds", updated);
    const record = updated[idx];
    if (record?.id) debouncedBondUpdate(record.id, record);
  }, [bonds, updateFF, debouncedBondUpdate]);

  const updateBondArray = useCallback((idx, arrName, arrIdx, field, value) => {
    const updated = bonds.map((item, i) => i === idx ? { ...item, [arrName]: item[arrName].map((a, ai) => ai === arrIdx ? { ...a, [field]: value } : a) } : item);
    updateFF("investmentBonds", updated);
    const record = updated[idx];
    if (record?.id) debouncedBondUpdate(record.id, record);
  }, [bonds, updateFF, debouncedBondUpdate]);

  const addBondArrayItem = useCallback(async (idx, arrName, template) => {
    const bond = bonds[idx];
    if (bond?.id && arrName === 'portfolio') {
      try {
        const created = await investmentBondsApi.addPortfolioItem(bond.id, template);
        const updated = bonds.map((item, i) => i === idx ? { ...item, [arrName]: [...(item[arrName] || []), { ...template, ...created }] } : item);
        updateFF("investmentBonds", updated);
        return;
      } catch (error) {
        console.error("Failed to add portfolio item:", error);
      }
    }
    updateFF("investmentBonds", bonds.map((item, i) => i === idx ? { ...item, [arrName]: [...(item[arrName] || []), template] } : item));
  }, [bonds, updateFF]);

  const removeBondArrayItem = useCallback(async (idx, arrName, arrIdx) => {
    const bond = bonds[idx];
    const item = bond?.[arrName]?.[arrIdx];
    if (bond?.id && arrName === 'portfolio' && item?.id) {
      try {
        await investmentBondsApi.removePortfolioItem(bond.id, item.id);
      } catch (error) {
        console.error("Failed to remove portfolio item:", error);
        return;
      }
    }
    updateFF("investmentBonds", bonds.map((b, i) => i === idx ? { ...b, [arrName]: b[arrName].filter((_, ai) => ai !== arrIdx) } : b));
  }, [bonds, updateFF]);

  if (!hasClients) {
    return (
      <div style={{ padding: "40px 24px", borderRadius: 12, border: "2px dashed var(--ps-border)", textAlign: "center" }}>
        <div style={{ fontSize: 28, marginBottom: 10 }}>👤</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 4 }}>No principals added yet</div>
        <div style={{ fontSize: 12, color: "var(--ps-text-subtle)" }}>Add at least one client under Principals first</div>
      </div>
    );
  }

  // Sub-tab bar
  const subTabBar = (
    <div style={{ display: "flex", gap: 4, marginBottom: 16, padding: "2px", background: "var(--ps-border-light)", borderRadius: 10 }}>
      {[
        { id: "wraps", label: "Wraps", icon: "📊", count: wraps.length, color: "var(--ps-green)" },
        { id: "bonds", label: "Investment Bonds", icon: "📑", count: bonds.length, color: "#0369A1" },
      ].map(s => {
        const isActive = subTab === s.id;
        return (
          <button key={s.id} onClick={() => { setSubTab(s.id); setDetailIdx(null); }} style={{
            padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer",
            background: isActive ? "var(--ps-surface)" : "transparent",
            boxShadow: isActive ? "0 1px 3px var(--ps-shadow-sm)" : "none",
            fontSize: 12, fontWeight: isActive ? 600 : 400,
            color: isActive ? s.color : "var(--ps-text-muted)",
            display: "flex", alignItems: "center", gap: 6,
            transition: "all 0.15s ease",
          }}>
            <span style={{ fontSize: 13 }}>{s.icon}</span> {s.label}
            {s.count > 0 && (
              <span style={{ background: isActive ? s.color + "20" : "var(--ps-border)", color: isActive ? s.color : "var(--ps-text-muted)", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 10 }}>{s.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );

  // Shared portfolio table
  const portfolioTable = (items, onUpdate, onAdd, onRemove) => (
    <div>
      {items.length > 0 && (
        <div style={{ marginBottom: 10, border: "1px solid var(--ps-border-light)", borderRadius: 8, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead><tr style={{ background: "var(--ps-surface-alt)" }}>
              <th style={{ padding: "6px 8px", textAlign: "left", fontWeight: 600, color: "var(--ps-text-muted)", fontSize: 11, borderBottom: "1px solid var(--ps-border)" }}>Asset Name</th>
              <th style={{ padding: "6px 8px", textAlign: "left", fontWeight: 600, color: "var(--ps-text-muted)", fontSize: 11, borderBottom: "1px solid var(--ps-border)" }}>Code/Ticker</th>
              <th style={{ padding: "6px 8px", textAlign: "left", fontWeight: 600, color: "var(--ps-text-muted)", fontSize: 11, borderBottom: "1px solid var(--ps-border)" }}>Amount</th>
              <th style={{ padding: "6px 8px", textAlign: "left", fontWeight: 600, color: "var(--ps-text-muted)", fontSize: 11, borderBottom: "1px solid var(--ps-border)" }}>Alloc %</th>
              <th style={{ padding: "6px 8px", width: 60, borderBottom: "1px solid var(--ps-border)" }}></th>
            </tr></thead>
            <tbody>
              {items.map((p, pi) => (
                <tr key={pi}>
                  <td style={{ padding: "4px 8px", borderBottom: "1px solid var(--ps-border-light)" }}><FFInput value={p.asset_name} onChange={v => onUpdate(pi, "asset_name", v)} placeholder="e.g. Vanguard Growth" /></td>
                  <td style={{ padding: "4px 8px", borderBottom: "1px solid var(--ps-border-light)" }}><FFInput value={p.asset_code} onChange={v => onUpdate(pi, "asset_code", v)} placeholder="e.g. VDHG" /></td>
                  <td style={{ padding: "4px 8px", borderBottom: "1px solid var(--ps-border-light)" }}><FFInput value={p.amount} onChange={v => onUpdate(pi, "amount", v)} type="number" prefix="$" /></td>
                  <td style={{ padding: "4px 8px", borderBottom: "1px solid var(--ps-border-light)" }}><FFInput value={p.allocation_pct} onChange={v => onUpdate(pi, "allocation_pct", v)} type="number" placeholder="%" /></td>
                  <td style={{ padding: "4px 8px", borderBottom: "1px solid var(--ps-border-light)" }}><button onClick={() => onRemove(pi)} style={{ fontSize: 10, color: "var(--ps-red)", cursor: "pointer", background: "none", border: "none", fontWeight: 500 }}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <button onClick={onAdd} style={{ padding: "5px 12px", borderRadius: 6, border: "1px dashed #059669", background: "var(--ps-surface-emerald)", cursor: "pointer", fontSize: 11, fontWeight: 600, color: "var(--ps-green)", display: "inline-flex", alignItems: "center", gap: 4 }}>
        <span>+</span> Add Holding
      </button>
    </div>
  );

  // Summary card renderer
  const summaryCard = (list, type, label, icon, color, nameField, onAdd) => (
    <div>
      {list.map((data, idx) => (
        <div key={idx} style={{ border: "1px solid var(--ps-border)", borderRadius: 12, background: "var(--ps-surface)", overflow: "hidden", marginBottom: 12, cursor: "pointer" }}
          onClick={() => { setDetailIdx(idx); setActiveDetailTab(type === "wrap" ? "platform_details" : "bond_details"); }}>
          <div style={{ padding: "12px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: color, color: "var(--ps-surface)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{icon}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ps-text-primary)" }}>{data[nameField] || `${label} ${idx + 1}`}</div>
                <div style={{ fontSize: 11, color: "var(--ps-text-subtle)" }}>{clientName(data.owner)}{data.balance ? ` — $${parseFloat(data.balance).toLocaleString()}` : ""}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "#3B82F6", fontWeight: 500 }}>Details →</span>
              <button onClick={(e) => { e.stopPropagation(); if (type === "wrap") removeWrap(idx); else removeBond(idx); }}
                style={{ padding: "4px 10px", borderRadius: 5, border: "1px solid var(--ps-ring-red)", background: "var(--ps-surface-red)", cursor: "pointer", fontSize: 11, color: "var(--ps-red)", fontWeight: 500 }}>Remove</button>
            </div>
          </div>
        </div>
      ))}
      <button onClick={onAdd} style={{ width: "100%", padding: "20px", borderRadius: 12, border: `2px dashed ${color}40`, background: color + "08", cursor: "pointer", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 13, fontWeight: 600, color: color }}>
        <span style={{ fontSize: 18 }}>+</span> Add {label}
      </button>
    </div>
  );

  return (
    <div>
      {subTabBar}

      {/* ── WRAPS ── */}
      {subTab === "wraps" && detailIdx === null && summaryCard(wraps, "wrap", "Wrap Account", "📊", "#059669", "platform_name", addWrap)}

      {subTab === "wraps" && detailIdx !== null && wraps[detailIdx] && (() => {
        const data = wraps[detailIdx]; const idx = detailIdx;
        const wrapDetailTabs = [
          { id: "platform_details", label: "Platform Details" },
          { id: "portfolio", label: "Portfolio" },
          { id: "fees", label: "Fees" },
        ];
        return (
          <div style={{ border: "1px solid var(--ps-border)", borderRadius: 12, background: "var(--ps-surface)", overflow: "hidden", marginBottom: 16 }}>
            <div style={{ padding: "12px 18px", background: "#05966908", borderBottom: "1px solid var(--ps-border)", display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={() => setDetailIdx(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "var(--ps-text-muted)" }}>←</button>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ps-text-primary)" }}>{data.platform_name || `Wrap Account ${idx + 1}`}</div>
            </div>
            <div style={{ padding: 18 }}>
              <div style={{ display: "flex", gap: 4, marginBottom: 14, padding: "2px", background: "var(--ps-border-light)", borderRadius: 8 }}>
                {wrapDetailTabs.map(t => {
                  const isActive = activeDetailTab === t.id;
                  return (
                    <button key={t.id} onClick={() => setActiveDetailTab(t.id)} style={{
                      padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer",
                      background: isActive ? "var(--ps-surface)" : "transparent",
                      boxShadow: isActive ? "0 1px 2px var(--ps-shadow-xs)" : "none",
                      fontSize: 11, fontWeight: isActive ? 600 : 400,
                      color: isActive ? "var(--ps-text-primary)" : "var(--ps-text-muted)", transition: "all 0.15s ease",
                    }}>{t.label}</button>
                  );
                })}
              </div>

              {activeDetailTab === "platform_details" && (<div>
                <div style={ffRowStyle}>
                  <FFInput label="Platform / Product Name" value={data.platform_name} onChange={v => updateWrap(idx, "platform_name", v)} placeholder="e.g. BT Panorama, Macquarie Wrap" />
                  <FFSelect label="Owner" value={data.owner} onChange={v => updateWrap(idx, "owner", v)} options={clientOptions} />
                </div>
                <div style={ffRowStyle}>
                  <FFInput label="Account Number" value={data.account_number} onChange={v => updateWrap(idx, "account_number", v)} placeholder="Account number" />
                  <FFInput label="Balance" value={data.balance} onChange={v => updateWrap(idx, "balance", v)} type="number" prefix="$" />
                </div>
              </div>)}

              {activeDetailTab === "portfolio" && portfolioTable(
                data.portfolio || [],
                (pi, f, v) => updateWrapArray(idx, "portfolio", pi, f, v),
                () => addWrapArrayItem(idx, "portfolio", { asset_name: "", asset_code: "", amount: "", allocation_pct: "" }),
                (pi) => removeWrapArrayItem(idx, "portfolio", pi)
              )}

              {activeDetailTab === "fees" && (<div>
                <div style={ffRowStyle}>
                  <FFSelect label="Admin Fee Type" value={data.fees?.admin_fee_type} onChange={v => updateWrapNested(idx, "fees", "admin_fee_type", v)}
                    options={[{ value: "", label: "Select..." }, { value: "percentage", label: "Percentage (%)" }, { value: "dollar", label: "Dollar amount ($)" }]} />
                  <FFInput label="Admin Fee Value" value={data.fees?.admin_fee_value} onChange={v => updateWrapNested(idx, "fees", "admin_fee_value", v)} type="number" />
                </div>
                <div style={ffRowStyle}>
                  <FFSelect label="Adviser Fee Type" value={data.fees?.adviser_fee_type} onChange={v => updateWrapNested(idx, "fees", "adviser_fee_type", v)}
                    options={[{ value: "", label: "Select..." }, { value: "percentage", label: "Percentage (%)" }, { value: "dollar", label: "Dollar amount ($)" }]} />
                  <FFInput label="Adviser Fee Value" value={data.fees?.adviser_fee_value} onChange={v => updateWrapNested(idx, "fees", "adviser_fee_value", v)} type="number" />
                </div>
                <div style={ffRowStyle}>
                  <FFInput label="Other Fees (details)" value={data.fees?.other_fees} onChange={v => updateWrapNested(idx, "fees", "other_fees", v)} placeholder="Additional fee details..." />
                  <div />
                </div>
              </div>)}
            </div>
          </div>
        );
      })()}

      {/* ── INVESTMENT BONDS ── */}
      {subTab === "bonds" && detailIdx === null && summaryCard(bonds, "bond", "Investment Bond", "📑", "#0369A1", "product_name", addBond)}

      {subTab === "bonds" && detailIdx !== null && bonds[detailIdx] && (() => {
        const data = bonds[detailIdx]; const idx = detailIdx;
        const bondDetailTabs = [
          { id: "bond_details", label: "Bond Details" },
          { id: "portfolio", label: "Portfolio" },
        ];
        return (
          <div style={{ border: "1px solid var(--ps-border)", borderRadius: 12, background: "var(--ps-surface)", overflow: "hidden", marginBottom: 16 }}>
            <div style={{ padding: "12px 18px", background: "#0369A108", borderBottom: "1px solid var(--ps-border)", display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={() => setDetailIdx(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "var(--ps-text-muted)" }}>←</button>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ps-text-primary)" }}>{data.product_name || `Investment Bond ${idx + 1}`}</div>
            </div>
            <div style={{ padding: 18 }}>
              <div style={{ display: "flex", gap: 4, marginBottom: 14, padding: "2px", background: "var(--ps-border-light)", borderRadius: 8 }}>
                {bondDetailTabs.map(t => {
                  const isActive = activeDetailTab === t.id;
                  return (
                    <button key={t.id} onClick={() => setActiveDetailTab(t.id)} style={{
                      padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer",
                      background: isActive ? "var(--ps-surface)" : "transparent",
                      boxShadow: isActive ? "0 1px 2px var(--ps-shadow-xs)" : "none",
                      fontSize: 11, fontWeight: isActive ? 600 : 400,
                      color: isActive ? "var(--ps-text-primary)" : "var(--ps-text-muted)", transition: "all 0.15s ease",
                    }}>{t.label}</button>
                  );
                })}
              </div>

              {activeDetailTab === "bond_details" && (<div>
                <div style={ffRowStyle}>
                  <FFInput label="Product / Provider Name" value={data.product_name} onChange={v => updateBond(idx, "product_name", v)} placeholder="e.g. Australian Unity, Centuria" />
                  <FFSelect label="Owner" value={data.owner} onChange={v => updateBond(idx, "owner", v)} options={clientOptions} />
                </div>
                <div style={ffRowStyle}>
                  <FFInput label="Policy Number" value={data.policy_number} onChange={v => updateBond(idx, "policy_number", v)} placeholder="Policy number" />
                  <FFInput label="Balance / Current Value" value={data.balance} onChange={v => updateBond(idx, "balance", v)} type="number" prefix="$" />
                </div>
                <div style={ffRowStyle}>
                  <FFInput label="Commencement Date" value={data.commencement_date} onChange={v => updateBond(idx, "commencement_date", v)} type="date" />
                  <FFSelect label="Tax Treatment" value={data.tax_treatment} onChange={v => updateBond(idx, "tax_treatment", v)}
                    options={[{ value: "", label: "Select..." }, { value: "tax_paid", label: "Tax paid" }, { value: "tax_deferred", label: "Tax deferred" }]} />
                </div>
              </div>)}

              {activeDetailTab === "portfolio" && portfolioTable(
                data.portfolio || [],
                (pi, f, v) => updateBondArray(idx, "portfolio", pi, f, v),
                () => addBondArrayItem(idx, "portfolio", { asset_name: "", asset_code: "", amount: "", allocation_pct: "" }),
                (pi) => removeBondArrayItem(idx, "portfolio", pi)
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}


// ===========================================================================
// FACT FIND — Trusts & Companies Form (combined, aligned to Base44)
// ===========================================================================

const TRUST_DEFAULTS = {
  trust_name: "",
  trust_type: "",                // "1"=Discretionary Family, "2"=Unit, "3"=Hybrid, "4"=Testamentary, "5"=Other
  beneficiaries: [],             // [{ benef_entity: "", benef_entitlement: "" }]
};

const COMPANY_DEFAULTS = {
  company_name: "",
  co_purpose: "",                // "1"=Operating business, "2"=Investment, "3"=Beneficiary of trust
  co_type: "",                   // "1"=Pty Ltd, "2"=Partnership, "3"=Sole trader, "4"=Charity
  co_losses: "",
  co_tax_rate: "25",             // 25% base rate entity or 30%
  shareholders: [],              // [{ sh_entity: "", sh_pct: "" }]

  // ── PROFIT & LOSS (summary — detail managed in Cashflow/Entities) ──
  pnl: {
    total_revenue: "",
    total_expenses: "",
    revenue_growth_rate: "3",    // annual % growth
    expense_growth_rate: "3",    // annual % growth
    // Detailed line items
    income_lines: [
      { id: "inc_1", label: "Trading Revenue", amount: "", growth_rate: "3", start_year: "", end_year: "" },
      { id: "inc_2", label: "Service Revenue", amount: "", growth_rate: "3", start_year: "", end_year: "" },
      { id: "inc_3", label: "Investment Income", amount: "", growth_rate: "2", start_year: "", end_year: "" },
      { id: "inc_4", label: "Rental Income", amount: "", growth_rate: "3", start_year: "", end_year: "" },
    ],
    expense_lines: [
      { id: "exp_1", label: "Salaries & Wages", amount: "", growth_rate: "3", start_year: "", end_year: "" },
      { id: "exp_2", label: "Director Fees", amount: "", growth_rate: "3", start_year: "", end_year: "" },
      { id: "exp_3", label: "Superannuation", amount: "", growth_rate: "3", start_year: "", end_year: "" },
      { id: "exp_4", label: "Rent / Occupancy", amount: "", growth_rate: "3", start_year: "", end_year: "" },
      { id: "exp_5", label: "Insurance", amount: "", growth_rate: "3", start_year: "", end_year: "" },
      { id: "exp_6", label: "Accounting & Legal", amount: "", growth_rate: "3", start_year: "", end_year: "" },
      { id: "exp_7", label: "Depreciation", amount: "", growth_rate: "0", start_year: "", end_year: "" },
      { id: "exp_8", label: "Interest Expense", amount: "", growth_rate: "0", start_year: "", end_year: "" },
      { id: "exp_9", label: "Motor Vehicle", amount: "", growth_rate: "3", start_year: "", end_year: "" },
      { id: "exp_10", label: "Marketing", amount: "", growth_rate: "3", start_year: "", end_year: "" },
      { id: "exp_11", label: "Other Operating", amount: "", growth_rate: "3", start_year: "", end_year: "" },
    ],
  },

  // ── EQUITY ──
  share_capital: "",
  retained_earnings: "",
  franking_account_balance: "",

  // Upload support
  uploaded_pnl: null,            // parsed P&L from uploaded file
  uploaded_bs: null,             // parsed balance sheet from uploaded file
};

export function TrustsCompaniesForm({ factFind, updateFF, clientId, client1Guid, client2Guid }) {
  const [subTab, setSubTab] = useState("trusts");
  const [trusts, setTrusts] = useState([]);
  const companies = factFind.companies || [];
  const debounceTimers = useRef({});

  // Build shareholder entity options from all available entities
  const buildShareholderOptions = (currentCompanyIdx) => {
    const opts = [{ value: "", label: "Select..." }];
    if (factFind.client1) {
      const name = ((factFind.client1.first_name || "") + " " + (factFind.client1.last_name || "")).trim() || "Client 1";
      opts.push({ value: "client1", label: `${name} (Client 1)` });
    }
    if (factFind.client2) {
      const name = ((factFind.client2.first_name || "") + " " + (factFind.client2.last_name || "")).trim() || "Client 2";
      opts.push({ value: "client2", label: `${name} (Client 2)` });
    }
    (factFind.children || []).forEach((c, i) => {
      if (c.name) opts.push({ value: `child_${i}`, label: `${c.name} (Child)` });
    });
    (factFind.dependants_list || []).forEach((d, i) => {
      if (d.name) opts.push({ value: `dependant_${i}`, label: `${d.name} (Dependant)` });
    });
    trusts.forEach((t, i) => {
      if (t.trust_name) opts.push({ value: `trust_${i}`, label: `${t.trust_name} (Trust)` });
    });
    companies.forEach((c, i) => {
      if (i !== currentCompanyIdx && c.company_name) opts.push({ value: `company_${i}`, label: `${c.company_name} (Company)` });
    });
    return opts;
  };

  // GUID maps for shareholder API calls
  const clientGuidMap = { client1: client1Guid, client2: client2Guid };
  const entityGuidMap = {};
  trusts.forEach((t, i) => { if (t.id) entityGuidMap[`trust_${i}`] = t.id; });
  companies.forEach((c, i) => { if (c.id) entityGuidMap[`company_${i}`] = c.id; });

  // Load trusts from API on mount
  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    async function load() {
      try {
        const all = await trustsApi.getAll(clientId);
        if (cancelled) return;
        setTrusts(all);
      } catch (error) {
        console.error("Failed to load trusts:", error);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [clientId]);

  // Cleanup debounce timers on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(clearTimeout);
    };
  }, []);

  // Debounced update to API
  const debouncedUpdate = useCallback((id, data) => {
    if (debounceTimers.current[id]) {
      clearTimeout(debounceTimers.current[id]);
    }
    debounceTimers.current[id] = setTimeout(async () => {
      try {
        await trustsApi.update(id, data);
      } catch (error) {
        console.error("Failed to update trust:", error);
      }
    }, 500);
  }, []);

  // Trust CRUD
  const addTrust = useCallback(async () => {
    if (!clientId) return;
    try {
      const created = await trustsApi.create(clientId, { ...TRUST_DEFAULTS, default_name: `Trust ${trusts.length + 1}` });
      setTrusts(prev => [...prev, created]);
    } catch (error) {
      console.error("Failed to create trust:", error);
    }
  }, [clientId, trusts]);

  const removeTrust = useCallback(async (idx) => {
    const trust = trusts[idx];
    if (trust?.id) {
      try {
        await trustsApi.remove(trust.id);
      } catch (error) {
        console.error("Failed to remove trust:", error);
        return;
      }
    }
    setTrusts(prev => prev.filter((_, i) => i !== idx));
  }, [trusts]);

  const updateTrust = useCallback((idx, field, value) => {
    setTrusts(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      const record = updated[idx];
      if (record.id) {
        const { id, client_id, ...fields } = record;
        debouncedUpdate(id, fields);
      }
      return updated;
    });
  }, [debouncedUpdate]);

  // Build beneficiary entity options from all available entities
  const buildBenefOptions = (currentTrustIdx) => {
    const opts = [{ value: "", label: "Select..." }];
    if (factFind.client1) {
      const name = ((factFind.client1.first_name || "") + " " + (factFind.client1.last_name || "")).trim() || "Client 1";
      opts.push({ value: "client1", label: `${name} (Client 1)` });
    }
    if (factFind.client2) {
      const name = ((factFind.client2.first_name || "") + " " + (factFind.client2.last_name || "")).trim() || "Client 2";
      opts.push({ value: "client2", label: `${name} (Client 2)` });
    }
    (factFind.children || []).forEach((c, i) => {
      if (c.name) opts.push({ value: `child_${i}`, label: `${c.name} (Child)` });
    });
    (factFind.dependants_list || []).forEach((d, i) => {
      if (d.name) opts.push({ value: `dependant_${i}`, label: `${d.name} (Dependant)` });
    });
    trusts.forEach((t, i) => {
      if (i !== currentTrustIdx && t.trust_name) opts.push({ value: `trust_${i}`, label: `${t.trust_name} (Trust)` });
    });
    companies.forEach((c, i) => {
      if (c.company_name) opts.push({ value: `company_${i}`, label: `${c.company_name} (Company)` });
    });
    return opts;
  };

  // Trust beneficiary helpers
  const addBenef = async (idx) => {
    const newBenef = { benef_entity: "", benef_entitlement: "" };
    const trust = trusts[idx];
    if (trust && trust.id) {
      try {
        const created = await trustsApi.addBeneficiary(trust.id, newBenef);
        newBenef._serverId = created.id || created._id || null;
      } catch (error) {
        console.error("Failed to create beneficiary:", error);
      }
    }
    const updated = trusts.map((item, i) => i === idx ? { ...item, beneficiaries: [...(item.beneficiaries || []), newBenef] } : item);
    setTrusts(updated);
  };
  const removeBenef = async (trustIdx, benefIdx) => {
    const trust = trusts[trustIdx];
    const benef = trust && trust.beneficiaries ? trust.beneficiaries[benefIdx] : null;
    if (trust && trust.id && benef && benef._serverId) {
      try {
        await trustsApi.removeBeneficiary(trust.id, benef._serverId);
      } catch (error) {
        console.error("Failed to delete beneficiary:", error);
      }
    }
    const updated = trusts.map((item, i) => i === trustIdx ? { ...item, beneficiaries: item.beneficiaries.filter((_, bi) => bi !== benefIdx) } : item);
    setTrusts(updated);
  };
  const updateBenef = async (trustIdx, benefIdx, field, value) => {
    const trust = trusts[trustIdx];
    const benef = trust && trust.beneficiaries ? trust.beneficiaries[benefIdx] : null;
    const updatedBenef = { ...benef, [field]: value };
    // Update local state immediately
    const updated = trusts.map((item, i) => i === trustIdx ? { ...item, beneficiaries: item.beneficiaries.map((b, bi) => bi === benefIdx ? updatedBenef : b) } : item);
    setTrusts(updated);
    // Sync to API: DELETE old + POST new (no PUT endpoint)
    if (trust && trust.id && benef && benef._serverId) {
      try {
        await trustsApi.removeBeneficiary(trust.id, benef._serverId);
        const created = await trustsApi.addBeneficiary(trust.id, updatedBenef, clientGuidMap);
        const newServerId = created.id || created._id || null;
        setTrusts(prev => prev.map((item, i) => i === trustIdx ? { ...item, beneficiaries: item.beneficiaries.map((b, bi) => bi === benefIdx ? { ...b, _serverId: newServerId } : b) } : item));
      } catch (error) {
        console.error("Failed to update beneficiary:", error);
      }
    }
  };

  // Load companies from API on mount
  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    async function load() {
      try {
        const all = await companiesApi.getAll(clientId);
        if (cancelled) return;
        const withServerIds = all.map(c => ({
          ...c,
          shareholders: (c.shareholders || []).map(s => ({ ...s, _serverId: s.id || s._id || null })),
        }));
        updateFF("companies", withServerIds);
      } catch (error) {
        console.error("Failed to load companies:", error);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [clientId]);

  // Debounced company update to API (for API-mapped fields only)
  const API_SYNCED_COMPANY_FIELDS = ['company_name', 'co_tax_rate', 'franking_account_balance', 'co_acn', 'co_abn'];
  const debouncedCompanyUpdate = useCallback((id, data) => {
    const key = `company_${id}`;
    if (debounceTimers.current[key]) {
      clearTimeout(debounceTimers.current[key]);
    }
    debounceTimers.current[key] = setTimeout(async () => {
      try {
        await companiesApi.update(id, data);
      } catch (error) {
        console.error("Failed to update company:", error);
      }
    }, 500);
  }, []);

  // Company CRUD
  const addCompany = useCallback(async () => {
    if (!clientId) return;
    try {
      const created = await companiesApi.create(clientId, { ...COMPANY_DEFAULTS, default_name: `Company ${companies.length + 1}` });
      const merged = { ...COMPANY_DEFAULTS, shareholders: [], ...created };
      updateFF("companies", [...companies, merged]);
    } catch (error) {
      console.error("Failed to create company:", error);
    }
  }, [clientId, companies, updateFF]);

  const removeCompany = useCallback(async (idx) => {
    const company = companies[idx];
    if (company?.id) {
      try {
        await companiesApi.remove(company.id);
      } catch (error) {
        console.error("Failed to remove company:", error);
        return;
      }
    }
    updateFF("companies", companies.filter((_, i) => i !== idx));
  }, [companies, updateFF]);

  const updateCompany = useCallback((idx, field, value) => {
    const updated = companies.map((item, i) => i === idx ? { ...item, [field]: value } : item);
    updateFF("companies", updated);
    // Debounce API sync for API-mapped fields
    const record = updated[idx];
    if (record?.id && API_SYNCED_COMPANY_FIELDS.includes(field)) {
      debouncedCompanyUpdate(record.id, record);
    }
  }, [companies, updateFF, debouncedCompanyUpdate]);

  // Company shareholder helpers
  const addShareholder = (idx) => {
    const updated = companies.map((item, i) =>
      i === idx ? { ...item, shareholders: [...(item.shareholders || []), { sh_entity: "", sh_pct: "", _isNew: true }] } : item
    );
    updateFF("companies", updated);
  };
  const removeShareholder = async (compIdx, shIdx) => {
    const company = companies[compIdx];
    const shareholder = company?.shareholders?.[shIdx];
    if (company?.id && shareholder?._serverId) {
      try {
        await companiesApi.removeShareholder(company.id, shareholder._serverId);
      } catch (error) {
        console.error("Failed to remove shareholder:", error);
        return;
      }
    }
    const updated = companies.map((item, i) =>
      i === compIdx
        ? { ...item, shareholders: item.shareholders.filter((_, si) => si !== shIdx) }
        : item
    );
    updateFF("companies", updated);
  };
  const shareholderDebounceTimers = useRef({});
  const companiesRef = useRef(companies);
  companiesRef.current = companies;
  useEffect(() => {
    return () => { Object.values(shareholderDebounceTimers.current).forEach(clearTimeout); };
  }, []);
  const updateShareholder = (compIdx, shIdx, field, value) => {
    const company = companies[compIdx];
    const shareholder = company?.shareholders?.[shIdx];
    const updatedSh = { ...shareholder, [field]: value };
    const updated = companies.map((item, i) => i === compIdx ? { ...item, shareholders: item.shareholders.map((s, si) => si === shIdx ? updatedSh : s) } : item);
    updateFF("companies", updated);
    if (!company?.id) return;
    const timerKey = `sh_${compIdx}_${shIdx}`;
    if (shareholderDebounceTimers.current[timerKey]) clearTimeout(shareholderDebounceTimers.current[timerKey]);
    shareholderDebounceTimers.current[timerKey] = setTimeout(async () => {
      try {
        const latestCompanies = companiesRef.current;
        const latestSh = latestCompanies[compIdx]?.shareholders?.[shIdx];
        const shToSync = { ...updatedSh, ...latestSh, [field]: value };
        if (shareholder?._serverId) {
          // Existing record: DELETE old + POST new
          await companiesApi.removeShareholder(company.id, shareholder._serverId);
          const created = await companiesApi.addShareholder(company.id, shToSync, clientGuidMap, entityGuidMap);
          const newServerId = created.id || created._id || null;
          const refreshed = companiesRef.current.map((item, i) => i === compIdx ? { ...item, shareholders: item.shareholders.map((s, si) => si === shIdx ? { ...s, _serverId: newServerId, _isNew: false } : s) } : item);
          updateFF("companies", refreshed);
        } else if (shToSync.sh_entity) {
          // New record with entity set: POST to create
          const created = await companiesApi.addShareholder(company.id, shToSync, clientGuidMap, entityGuidMap);
          const newServerId = created.id || created._id || null;
          const refreshed = companiesRef.current.map((item, i) => i === compIdx ? { ...item, shareholders: item.shareholders.map((s, si) => si === shIdx ? { ...s, _serverId: newServerId, _isNew: false } : s) } : item);
          updateFF("companies", refreshed);
        }
      } catch (error) {
        console.error("Failed to update shareholder:", error);
      }
    }, 1500);
  };

  // Sub-tab bar
  const subTabBar = (
    <div style={{
      display: "flex", gap: 4, marginBottom: 16,
      padding: "2px", background: "var(--ps-border-light)", borderRadius: 10,
    }}>
      {[
        { id: "trusts", label: "Trusts", icon: "🏛️", count: trusts.length, color: "#D97706" },
        { id: "companies", label: "Companies", icon: "🏢", count: companies.length, color: "#0369A1" },
      ].map(s => {
        const isActive = subTab === s.id;
        return (
          <button key={s.id} onClick={() => setSubTab(s.id)} style={{
            padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer",
            background: isActive ? "var(--ps-surface)" : "transparent",
            boxShadow: isActive ? "0 1px 3px var(--ps-shadow-sm)" : "none",
            fontSize: 12, fontWeight: isActive ? 600 : 400,
            color: isActive ? s.color : "var(--ps-text-muted)",
            display: "flex", alignItems: "center", gap: 6,
            transition: "all 0.15s ease",
          }}>
            <span style={{ fontSize: 13 }}>{s.icon}</span>
            {s.label}
            {s.count > 0 && (
              <span style={{
                background: isActive ? s.color + "20" : "var(--ps-border)",
                color: isActive ? s.color : "var(--ps-text-muted)",
                fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 10,
              }}>{s.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );

  // Inline beneficiary/shareholder table style
  const miniTableStyle = { width: "100%", borderCollapse: "collapse", fontSize: 12 };
  const miniThStyle = { padding: "6px 8px", textAlign: "left", fontWeight: 600, color: "var(--ps-text-muted)", fontSize: 11, borderBottom: "1px solid var(--ps-border)" };
  const miniTdStyle = { padding: "4px 8px", borderBottom: "1px solid var(--ps-border-light)" };

  return (
    <div>
      {subTabBar}

      {/* ── Trusts ── */}
      {subTab === "trusts" && (
        <div>
          {trusts.map((data, idx) => (
            <div key={idx} style={{ border: "1px solid var(--ps-border)", borderRadius: 12, background: "var(--ps-surface)", overflow: "hidden", marginBottom: 16 }}>
              <div style={{ padding: "12px 18px", background: "#D9770608", borderBottom: "1px solid var(--ps-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#D97706", color: "var(--ps-surface)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🏛️</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ps-text-primary)" }}>{data.trust_name || `Trust ${idx + 1}`}</div>
                </div>
                <button onClick={() => removeTrust(idx)} style={{ padding: "4px 10px", borderRadius: 5, border: "1px solid var(--ps-ring-red)", background: "var(--ps-surface-red)", cursor: "pointer", fontSize: 11, color: "var(--ps-red)", fontWeight: 500 }}>Remove</button>
              </div>
              <div style={{ padding: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-subtle)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Trust Details</div>
                <div style={ffRowStyle}>
                  <FFInput label="Trust Name" value={data.trust_name} onChange={v => updateTrust(idx, "trust_name", v)} placeholder="e.g. The Smith Family Trust" />
                  <FFSelect label="Trust Type" value={data.trust_type} onChange={v => updateTrust(idx, "trust_type", v)}
                    options={[{ value: "", label: "Select..." }, { value: "1", label: "Discretionary Family Trust" }, { value: "2", label: "Unit Trust" }, { value: "3", label: "Hybrid Trust" }, { value: "4", label: "Testamentary Trust" }, { value: "5", label: "Other" }]} />
                </div>

                {/* Beneficiaries */}
                <div style={{ height: 1, background: "var(--ps-border-light)", margin: "12px 0 16px" }} />
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-subtle)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Beneficiaries</div>
                {(data.beneficiaries || []).length > 0 && (
                  <div style={{ marginBottom: 10, border: "1px solid var(--ps-border-light)", borderRadius: 8, overflow: "hidden" }}>
                    <table style={miniTableStyle}>
                      <thead><tr style={{ background: "var(--ps-surface-alt)" }}>
                        <th style={miniThStyle}>Beneficiary</th>
                        <th style={miniThStyle}>Entitlement</th>
                        <th style={{ ...miniThStyle, width: 60 }}></th>
                      </tr></thead>
                      <tbody>
                        {(data.beneficiaries || []).map((b, bi) => (
                          <tr key={bi}>
                            <td style={miniTdStyle}><FFSelect value={b.benef_entity} onChange={v => updateBenef(idx, bi, "benef_entity", v)} options={buildBenefOptions(idx)} /></td>
                            <td style={miniTdStyle}><FFInput value={b.benef_entitlement} onChange={v => updateBenef(idx, bi, "benef_entitlement", v)} placeholder="e.g. 25%" /></td>
                            <td style={miniTdStyle}><button onClick={() => removeBenef(idx, bi)} style={{ fontSize: 10, color: "var(--ps-red)", cursor: "pointer", background: "none", border: "none", fontWeight: 500 }}>Remove</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <button onClick={() => addBenef(idx)} style={{ padding: "5px 12px", borderRadius: 6, border: "1px dashed #D97706", background: "var(--ps-surface-amber)", cursor: "pointer", fontSize: 11, fontWeight: 600, color: "#D97706", display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <span>+</span> Add Beneficiary
                </button>
              </div>
            </div>
          ))}
          <button onClick={addTrust} style={{ width: "100%", padding: "20px", borderRadius: 12, border: "2px dashed #FDE68A", background: "var(--ps-surface-amber)", cursor: "pointer", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "#D97706" }}>
            <span style={{ fontSize: 18 }}>+</span> Add Trust
          </button>
        </div>
      )}

      {/* ── Companies ── */}
      {subTab === "companies" && (
        <div>
          {companies.map((data, idx) => {
            const pnl = data.pnl || {};
            const incLines = pnl.income_lines || [];
            const expLines = pnl.expense_lines || [];
            const totalFromIncLines = incLines.reduce((s, l) => s + (parseFloat(l.amount) || 0), 0);
            const totalFromExpLines = expLines.reduce((s, l) => s + (parseFloat(l.amount) || 0), 0);
            const totalRevenue = totalFromIncLines > 0 ? totalFromIncLines : (parseFloat(pnl.total_revenue) || 0);
            const totalExpenses = totalFromExpLines > 0 ? totalFromExpLines : (parseFloat(pnl.total_expenses) || 0);
            const netProfit = totalRevenue - totalExpenses;
            const taxRate = (parseFloat(data.co_tax_rate) || 25) / 100;
            const taxPayable = Math.max(0, Math.round(netProfit * taxRate));
            const netProfitAfterTax = netProfit - taxPayable;

            const sectionHeadStyle = { fontSize: 11, fontWeight: 600, color: "var(--ps-text-subtle)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 };
            const dividerStyle = { height: 1, background: "var(--ps-border-light)", margin: "12px 0 16px" };
            const summaryRowStyle = { display: "flex", justifyContent: "space-between", padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700 };

            return (
            <div key={idx} style={{ border: "1px solid var(--ps-border)", borderRadius: 12, background: "var(--ps-surface)", overflow: "hidden", marginBottom: 16 }}>
              <div style={{ padding: "12px 18px", background: "#0369A108", borderBottom: "1px solid var(--ps-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#0369A1", color: "var(--ps-surface)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🏢</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ps-text-primary)" }}>{data.company_name || `Company ${idx + 1}`}</div>
                </div>
                <button onClick={() => removeCompany(idx)} style={{ padding: "4px 10px", borderRadius: 5, border: "1px solid var(--ps-ring-red)", background: "var(--ps-surface-red)", cursor: "pointer", fontSize: 11, color: "var(--ps-red)", fontWeight: 500 }}>Remove</button>
              </div>
              <div style={{ padding: 18 }}>

                {/* ── COMPANY DETAILS ── */}
                <div style={sectionHeadStyle}>Company Details</div>
                <div style={ffRowStyle}>
                  <FFInput label="Company Name" value={data.company_name} onChange={v => updateCompany(idx, "company_name", v)} placeholder="e.g. Smith Investments Pty Ltd" />
                  <FFSelect label="Tax Rate" value={data.co_tax_rate || "25"} onChange={v => updateCompany(idx, "co_tax_rate", v)}
                    options={[{ value: "25", label: "25% (Base Rate Entity)" }, { value: "30", label: "30% (Standard)" }]} />
                </div>
                <div style={ffRowStyle}>
                  <FFRadioRow label="Purpose of Company" value={data.co_purpose} onChange={v => updateCompany(idx, "co_purpose", v)}
                    options={[{ value: "1", label: "Operating business" }, { value: "2", label: "Investment" }, { value: "3", label: "Beneficiary of trust" }]} />
                  <FFRadioRow label="Company Type" value={data.co_type} onChange={v => updateCompany(idx, "co_type", v)}
                    options={[{ value: "1", label: "Pty Ltd" }, { value: "2", label: "Partnership" }, { value: "3", label: "Sole trader" }, { value: "4", label: "Charity" }]} />
                </div>
                <div style={ffRowStyle}>
                  <FFInput label="Pre-Existing Losses" value={data.co_losses} onChange={v => updateCompany(idx, "co_losses", v)} type="number" prefix="$" step="1000" />
                  <div />
                </div>

                {/* ── UPLOAD FINANCIAL STATEMENTS ── */}
                <div style={dividerStyle} />
                <div style={sectionHeadStyle}>Upload Financial Statements</div>
                <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                  <label style={{ flex: 1, padding: "16px", borderRadius: 8, border: "2px dashed var(--ps-border-mid)", background: "var(--ps-surface-alt)", cursor: "pointer", textAlign: "center" }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>📄</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-muted)" }}>Upload P&L</div>
                    <div style={{ fontSize: 9, color: "var(--ps-text-subtle)" }}>CSV or XLSX</div>
                    <input type="file" accept=".csv,.xlsx,.xls" style={{ display: "none" }} onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const text = await file.text();
                        const rows = text.split("\n").map(r => r.split(",").map(c => c.trim().replace(/^"|"$/g, "")));
                        const incLines = [];
                        const expLines = [];
                        let section = ""; // "income" or "expense"
                        rows.forEach(cols => {
                          if (cols.length < 2) return;
                          const label = cols[0];
                          const lower = label.toLowerCase();
                          if (lower.includes("revenue") || lower.includes("income") || lower === "sales" || lower.includes("trading")) section = "income";
                          if (lower.includes("expense") || lower.includes("cost") || lower.includes("wages") || lower.includes("salary") || lower.includes("depreciation") || lower.includes("rent") || lower.includes("insurance")) section = "expense";
                          const amt = parseFloat(cols[1]?.replace(/[$,]/g, ""));
                          if (!isNaN(amt) && amt > 0 && label && !lower.includes("total") && !lower.includes("net profit") && !lower.includes("npat") && !lower.includes("npbt") && !lower.includes("tax payable")) {
                            const line = { id: `upload_${Date.now()}_${Math.random().toString(36).slice(2,6)}`, label, amount: String(Math.round(amt)), growth_rate: "3", start_year: "", end_year: "" };
                            if (section === "expense" || lower.includes("expense") || lower.includes("cost") || lower.includes("wages") || lower.includes("salary") || lower.includes("super") || lower.includes("depreciation") || lower.includes("rent") || lower.includes("insurance") || lower.includes("interest") || lower.includes("marketing") || lower.includes("motor") || lower.includes("accounting") || lower.includes("legal")) {
                              expLines.push(line);
                            } else {
                              incLines.push(line);
                            }
                          }
                        });
                        if (incLines.length > 0 || expLines.length > 0) {
                          const companies = [...(factFind.companies || [])];
                          const curPnl = companies[idx]?.pnl || {};
                          companies[idx] = { ...companies[idx], pnl: {
                            ...curPnl,
                            income_lines: incLines.length > 0 ? incLines : (curPnl.income_lines || []),
                            expense_lines: expLines.length > 0 ? expLines : (curPnl.expense_lines || []),
                          }};
                          updateFF("companies", companies);
                          updateCompany(idx, "uploaded_pnl_name", file.name);
                        }
                      } catch (err) { console.error("P&L parse error:", err); }
                    }} />
                    {data.uploaded_pnl_name && <div style={{ marginTop: 6, color: "var(--ps-green)", fontSize: 10, fontWeight: 600 }}>✓ {data.uploaded_pnl_name}</div>}
                  </label>
                  <label style={{ flex: 1, padding: "16px", borderRadius: 8, border: "2px dashed var(--ps-border-mid)", background: "var(--ps-surface-alt)", cursor: "pointer", textAlign: "center" }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>📄</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-muted)" }}>Upload Balance Sheet</div>
                    <div style={{ fontSize: 9, color: "var(--ps-text-subtle)" }}>CSV or XLSX</div>
                    <input type="file" accept=".csv,.xlsx,.xls" style={{ display: "none" }} onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const text = await file.text();
                        const rows = text.split("\n").map(r => r.split(",").map(c => c.trim().replace(/^"|"$/g, "")));
                        const compKey = `company_${idx}`;
                        const newAssets = [];
                        const newLiabs = [];
                        let section = "";
                        const assetKeywords = ["cash", "receivable", "debtor", "inventory", "stock", "plant", "equipment", "vehicle", "property", "goodwill", "ip", "intellectual", "investment", "loan to", "wip", "work in progress", "share"];
                        const liabKeywords = ["loan", "creditor", "payable", "provision", "lease", "hp", "overdraft", "director", "div 7a", "mortgage", "credit card"];
                        const guessAssetType = (label) => {
                          const l = label.toLowerCase();
                          if (l.includes("cash") || l.includes("bank")) return "8";
                          if (l.includes("receivable") || l.includes("debtor")) return "50";
                          if (l.includes("inventory") || l.includes("stock")) return "51";
                          if (l.includes("plant") || l.includes("equipment")) return "52";
                          if (l.includes("goodwill")) return "53";
                          if (l.includes("ip") || l.includes("intellectual")) return "54";
                          if (l.includes("loan to") || l.includes("related")) return "55";
                          if (l.includes("wip") || l.includes("work in progress")) return "56";
                          if (l.includes("vehicle") || l.includes("car") || l.includes("motor")) return "2";
                          if (l.includes("commercial") || l.includes("warehouse") || l.includes("office") || l.includes("factory") || l.includes("industrial")) return "21";
                          if (l.includes("property") || l.includes("land") || l.includes("building")) return "18";
                          if (l.includes("share") || l.includes("invest")) return "12";
                          return "42";
                        };
                        const guessLiabType = (label) => {
                          const l = label.toLowerCase();
                          if (l.includes("director") || l.includes("div 7a")) return "60";
                          if (l.includes("creditor") || l.includes("payable")) return "61";
                          if (l.includes("provision") || l.includes("leave") || l.includes("tax")) return "62";
                          if (l.includes("hp") || l.includes("lease") || l.includes("hire")) return "63";
                          if (l.includes("overdraft")) return "64";
                          if (l.includes("related") || l.includes("intercompany")) return "65";
                          if (l.includes("mortgage")) return "2";
                          return "8";
                        };
                        rows.forEach(cols => {
                          if (cols.length < 2) return;
                          const label = cols[0];
                          const lower = label.toLowerCase();
                          if (lower.includes("asset")) { section = "asset"; return; }
                          if (lower.includes("liabilit")) { section = "liability"; return; }
                          if (lower.includes("equity") || lower.includes("total")) return;
                          const amt = parseFloat(cols[1]?.replace(/[$,]/g, ""));
                          if (!isNaN(amt) && amt > 0 && label) {
                            const isLiab = section === "liability" || liabKeywords.some(k => lower.includes(k));
                            if (isLiab) {
                              newLiabs.push({ d_name: label, d_ownType: "4", d_owner: compKey, d_type: guessLiabType(label), d_balance: String(Math.round(amt)), d_rate: "", d_freq: "12", d_repayments: "", d_term: "", d_io: "", d_fixed: "", d_has_redraw: "", d_redraw: "", d_redraw_limit: "", d_security: [], d_offset: [] });
                            } else {
                              newAssets.push({ a_name: label, a_ownType: "4", a_owner: compKey, a_type: guessAssetType(label), a_value: String(Math.round(amt)), a_purchase_price: String(Math.round(amt)), a_drp: "" });
                            }
                          }
                        });
                        if (newAssets.length > 0) updateFF("assets", [...(factFind.assets || []), ...newAssets]);
                        if (newLiabs.length > 0) updateFF("liabilities", [...(factFind.liabilities || []), ...newLiabs]);
                        if (newAssets.length > 0 || newLiabs.length > 0) updateCompany(idx, "uploaded_bs_name", file.name);
                      } catch (err) { console.error("BS parse error:", err); }
                    }} />
                    {data.uploaded_bs_name && <div style={{ marginTop: 6, color: "var(--ps-green)", fontSize: 10, fontWeight: 600 }}>✓ {data.uploaded_bs_name}</div>}
                  </label>
                </div>
                <div style={{ fontSize: 10, color: "var(--ps-text-muted)", fontStyle: "italic" }}>
                  P&L uploads populate income/expense lines on the Entities projection page. Balance sheet uploads create asset and liability entries in the A&L schedule.
                </div>

                {/* ── FINANCIAL SUMMARY ── */}
                <div style={dividerStyle} />
                <div style={sectionHeadStyle}>Financial Summary</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                  <div style={{ flex: 1, minWidth: 180, padding: "12px 16px", borderRadius: 8, background: "var(--ps-surface-sky)", border: "1px solid var(--ps-ring-blue)" }}>
                    <div style={{ fontSize: 10, color: "#0369A1", fontWeight: 600, textTransform: "uppercase" }}>Total Revenue</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#0369A1" }}>${totalRevenue.toLocaleString()}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 180, padding: "12px 16px", borderRadius: 8, background: "var(--ps-surface-red)", border: "1px solid var(--ps-ring-red)" }}>
                    <div style={{ fontSize: 10, color: "#DC2626", fontWeight: 600, textTransform: "uppercase" }}>Total Expenses</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#DC2626" }}>${totalExpenses.toLocaleString()}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 180, padding: "12px 16px", borderRadius: 8, background: netProfitAfterTax >= 0 ? "#ECFDF5" : "#FEF2F2", border: `1px solid ${netProfitAfterTax >= 0 ? "#A7F3D0" : "#FECACA"}` }}>
                    <div style={{ fontSize: 10, color: netProfitAfterTax >= 0 ? "#065F46" : "#991B1B", fontWeight: 600, textTransform: "uppercase" }}>NPAT ({data.co_tax_rate || 25}% tax)</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: netProfitAfterTax >= 0 ? "#065F46" : "#991B1B" }}>${netProfitAfterTax.toLocaleString()}</div>
                  </div>
                </div>
                <div style={{ fontSize: 10, color: "var(--ps-text-muted)", fontStyle: "italic", marginBottom: 4 }}>
                  Detailed income and expense breakdown is managed in the Cashflow section under Entities.
                </div>

                {/* ── EQUITY ── */}
                <div style={dividerStyle} />
                <div style={sectionHeadStyle}>Equity</div>
                <div style={ffRowStyle}>
                  <FFInput label="Share Capital" value={data.share_capital} onChange={v => updateCompany(idx, "share_capital", v)} type="number" prefix="$" />
                  <FFInput label="Retained Earnings" value={data.retained_earnings} onChange={v => updateCompany(idx, "retained_earnings", v)} type="number" prefix="$" />
                </div>
                <div style={ffRowStyle}>
                  <FFInput label="Franking Account Balance" value={data.franking_account_balance} onChange={v => updateCompany(idx, "franking_account_balance", v)} type="number" prefix="$" />
                  <div />
                </div>

                {/* ── SHAREHOLDERS ── */}
                <div style={dividerStyle} />
                <div style={sectionHeadStyle}>Shareholders</div>
                {(data.shareholders || []).length > 0 && (
                  <div style={{ marginBottom: 10, border: "1px solid var(--ps-border-light)", borderRadius: 8, overflow: "hidden" }}>
                    <table style={miniTableStyle}>
                      <thead><tr style={{ background: "var(--ps-surface-alt)" }}>
                        <th style={miniThStyle}>Shareholder</th>
                        <th style={miniThStyle}>Percentage</th>
                        <th style={{ ...miniThStyle, width: 60 }}></th>
                      </tr></thead>
                      <tbody>
                        {(data.shareholders || []).map((s, si) => (
                          <tr key={si}>
                            <td style={miniTdStyle}><FFSelect value={s.sh_entity} onChange={v => updateShareholder(idx, si, "sh_entity", v)} options={buildShareholderOptions(idx)} /></td>
                            <td style={miniTdStyle}><FFInput value={s.sh_pct} onChange={v => updateShareholder(idx, si, "sh_pct", v)} placeholder="e.g. 25%" /></td>
                            <td style={miniTdStyle}><button onClick={() => removeShareholder(idx, si)} style={{ fontSize: 10, color: "var(--ps-red)", cursor: "pointer", background: "none", border: "none", fontWeight: 500 }}>Remove</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <button onClick={() => addShareholder(idx)} style={{ padding: "5px 12px", borderRadius: 6, border: "1px dashed #0369A1", background: "var(--ps-surface-sky)", cursor: "pointer", fontSize: 11, fontWeight: 600, color: "#0369A1", display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <span>+</span> Add Shareholder
                </button>
              </div>
            </div>
            );
          })}
          <button onClick={addCompany} style={{ width: "100%", padding: "20px", borderRadius: 12, border: "2px dashed #7DD3FC", background: "var(--ps-surface-sky)", cursor: "pointer", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "#0369A1" }}>
            <span style={{ fontSize: 18 }}>+</span> Add Company
          </button>
        </div>
      )}
    </div>
  );
}


// ===========================================================================
// FACT FIND — SMSF Form (aligned to Base44 FactFindSMSF)
// ===========================================================================

const SMSF_ACCOUNT_DEFAULTS = {
  owner: "",
  tax_environment: "",           // "1"=Accumulation, "2"=Pension
  fund_percentage: "",
  balance: "",
  tax_free_amt: "",
  tax_free_pct: "",
  unp_amt: "",
  super_guarantee: "",           // "1"=Yes, "2"=No
  salary_sacrifice: "",
  after_tax: "",
  beneficiaries: [],             // [{ benef_who: "", benef_type: "", benef_entitlement: "" }]
};

const SMSF_DEFAULTS = {
  smsf_name: "",
  fund_type: "",                 // "1"=SMSF, "2"=SAF
  trustee_type: "",              // "1"=Corporate trustee, "2"=Individual trustee
  acct_type: "",                 // "1"=Pooled, "2"=Segregate
  smsf_balance: "",
  individual_trustee: "",
  accounts: [],
};

const SMSF_BENEF_DEFAULTS = {
  benef_who: "",
  benef_type: "",                // "binding", "non-binding", "lapsing", "non-lapsing"
  benef_entitlement: "",
};

export function SMSFForm({ factFind, updateFF, clientId }) {
  const items = factFind.smsfs || [];
  const debounceTimers = useRef({});

  // Load SMSFs from API on mount
  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    async function load() {
      try {
        const all = await smsfApi.getAll(clientId);
        if (cancelled) return;
        updateFF("smsfs", all);
      } catch (error) {
        console.error("Failed to load SMSFs:", error);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [clientId]);

  // Cleanup debounce timers on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(clearTimeout);
    };
  }, []);

  // Debounced update to API (only for smsf_name, trustee_type, smsf_abn)
  const API_SYNCED_FIELDS = ['smsf_name', 'trustee_type', 'smsf_abn'];
  const debouncedUpdate = useCallback((id, data) => {
    const key = `smsf_${id}`;
    if (debounceTimers.current[key]) {
      clearTimeout(debounceTimers.current[key]);
    }
    debounceTimers.current[key] = setTimeout(async () => {
      try {
        await smsfApi.update(id, data);
      } catch (error) {
        console.error("Failed to update SMSF:", error);
      }
    }, 500);
  }, []);

  // Fund CRUD
  const add = useCallback(async () => {
    if (!clientId) return;
    try {
      const created = await smsfApi.create({ ...SMSF_DEFAULTS, client_id: clientId });
      const merged = { ...SMSF_DEFAULTS, accounts: [], ...created };
      updateFF("smsfs", [...items, merged]);
    } catch (error) {
      console.error("Failed to create SMSF:", error);
    }
  }, [clientId, items, updateFF]);

  const remove = useCallback(async (idx) => {
    const smsf = items[idx];
    if (smsf?.id) {
      try {
        await smsfApi.remove(smsf.id);
      } catch (error) {
        console.error("Failed to remove SMSF:", error);
        return;
      }
    }
    updateFF("smsfs", items.filter((_, i) => i !== idx));
  }, [items, updateFF]);

  const update = useCallback((idx, field, value) => {
    const updated = items.map((item, i) => i === idx ? { ...item, [field]: value } : item);
    updateFF("smsfs", updated);
    // Debounce API sync for API-mapped fields
    const record = updated[idx];
    if (record?.id && API_SYNCED_FIELDS.includes(field)) {
      debouncedUpdate(record.id, record);
    }
  }, [items, updateFF, debouncedUpdate]);

  // Account CRUD
  const addAccount = (smsfIdx) => {
    updateFF("smsfs", items.map((item, i) => i === smsfIdx ? { ...item, accounts: [...item.accounts, { ...SMSF_ACCOUNT_DEFAULTS, beneficiaries: [] }] } : item));
  };
  const removeAccount = (smsfIdx, accIdx) => {
    updateFF("smsfs", items.map((item, i) => i === smsfIdx ? { ...item, accounts: item.accounts.filter((_, j) => j !== accIdx) } : item));
  };
  const updateAccount = (smsfIdx, accIdx, field, value) => {
    updateFF("smsfs", items.map((item, i) => i === smsfIdx ? {
      ...item, accounts: item.accounts.map((acc, j) => j === accIdx ? { ...acc, [field]: value } : acc)
    } : item));
  };

  // Beneficiary CRUD (nested inside account)
  const addBenef = (smsfIdx, accIdx) => {
    updateFF("smsfs", items.map((item, i) => i === smsfIdx ? {
      ...item, accounts: item.accounts.map((acc, j) => j === accIdx ? { ...acc, beneficiaries: [...(acc.beneficiaries || []), { ...SMSF_BENEF_DEFAULTS }] } : acc)
    } : item));
  };
  const removeBenef = (smsfIdx, accIdx, bIdx) => {
    updateFF("smsfs", items.map((item, i) => i === smsfIdx ? {
      ...item, accounts: item.accounts.map((acc, j) => j === accIdx ? { ...acc, beneficiaries: acc.beneficiaries.filter((_, k) => k !== bIdx) } : acc)
    } : item));
  };
  const updateBenef = (smsfIdx, accIdx, bIdx, field, value) => {
    updateFF("smsfs", items.map((item, i) => i === smsfIdx ? {
      ...item, accounts: item.accounts.map((acc, j) => j === accIdx ? {
        ...acc, beneficiaries: acc.beneficiaries.map((b, k) => k === bIdx ? { ...b, [field]: value } : b)
      } : acc)
    } : item));
  };

  // Client options for account owner
  const clientOptions = [{ value: "", label: "Select..." }];
  if (factFind.client1) clientOptions.push({ value: "client1", label: ((factFind.client1?.first_name || "") + " " + (factFind.client1?.last_name || "")).trim() || "Client 1" });
  if (factFind.client2) clientOptions.push({ value: "client2", label: ((factFind.client2?.first_name || "") + " " + (factFind.client2?.last_name || "")).trim() || "Client 2" });

  // Mini table styles
  const miniTableStyle = { width: "100%", borderCollapse: "collapse", fontSize: 12 };
  const miniThStyle = { padding: "6px 8px", textAlign: "left", fontWeight: 600, color: "var(--ps-text-muted)", fontSize: 11, borderBottom: "1px solid var(--ps-border)" };
  const miniTdStyle = { padding: "4px 8px", borderBottom: "1px solid var(--ps-border-light)" };
  const taxEnvLabel = (v) => v === "1" ? "Accumulation" : v === "2" ? "Pension" : "—";

  return (
    <div>
      {items.map((smsf, idx) => (
        <div key={idx} style={{ border: "1px solid var(--ps-border)", borderRadius: 12, background: "var(--ps-surface)", overflow: "hidden", marginBottom: 16 }}>
          <div style={{ padding: "12px 18px", background: "#6366F108", borderBottom: "1px solid var(--ps-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#6366F1", color: "var(--ps-surface)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🔒</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ps-text-primary)" }}>{smsf.smsf_name || `SMSF ${idx + 1}`}</div>
                <div style={{ fontSize: 11, color: "var(--ps-text-subtle)" }}>{smsf.accounts.length} account{smsf.accounts.length !== 1 ? "s" : ""}</div>
              </div>
            </div>
            <button onClick={() => remove(idx)} style={{ padding: "4px 10px", borderRadius: 5, border: "1px solid var(--ps-ring-red)", background: "var(--ps-surface-red)", cursor: "pointer", fontSize: 11, color: "var(--ps-red)", fontWeight: 500 }}>Remove</button>
          </div>
          <div style={{ padding: 18 }}>
            {/* ── SMSF Details ── */}
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-subtle)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>SMSF Details</div>
            <div style={ffRowStyle}>
              <FFInput label="SMSF Name" value={smsf.smsf_name} onChange={v => update(idx, "smsf_name", v)} placeholder="e.g. Smith Family Super Fund" />
              <FFInput label="SMSF Balance" value={smsf.smsf_balance} onChange={v => update(idx, "smsf_balance", v)} type="number" prefix="$" step="1000" />
            </div>
            <div style={ffRowStyle}>
              <FFRadioRow label="Type of Fund" value={smsf.fund_type} onChange={v => update(idx, "fund_type", v)}
                options={[{ value: "1", label: "SMSF" }, { value: "2", label: "SAF" }]} />
              <FFRadioRow label="Trustee Type" value={smsf.trustee_type} onChange={v => update(idx, "trustee_type", v)}
                options={[{ value: "1", label: "Corporate trustee" }, { value: "2", label: "Individual trustee" }]} />
            </div>
            <div style={ffRowStyle}>
              <FFRadioRow label="Account Type" value={smsf.acct_type} onChange={v => update(idx, "acct_type", v)}
                options={[{ value: "1", label: "Pooled" }, { value: "2", label: "Segregate" }]} />
              <FFInput label="Individual Trustee" value={smsf.individual_trustee} onChange={v => update(idx, "individual_trustee", v)} placeholder="" />
            </div>

            {/* ── Accounts ── */}
            <div style={{ height: 1, background: "var(--ps-border-light)", margin: "12px 0 16px" }} />
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-subtle)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Account Information</div>

            {smsf.accounts.map((acc, ai) => {
              const ownerLabel = acc.owner === "client1" ? (((factFind.client1?.first_name || "") + " " + (factFind.client1?.last_name || "")).trim() || "Client 1") :
                                 acc.owner === "client2" ? (((factFind.client2?.first_name || "") + " " + (factFind.client2?.last_name || "")).trim() || "Client 2") : "—";
              return (
                <div key={ai} style={{ border: "1px solid var(--ps-border)", borderRadius: 8, padding: 14, marginBottom: 10, background: "var(--ps-surface-alt)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ps-text-secondary)" }}>
                      {ownerLabel} — <span style={{ color: acc.tax_environment === "2" ? "var(--ps-red)" : "var(--ps-green)", fontWeight: 700 }}>{taxEnvLabel(acc.tax_environment)}</span>
                    </div>
                    <button onClick={() => removeAccount(idx, ai)} style={{ padding: "2px 8px", borderRadius: 4, border: "1px solid var(--ps-ring-red)", background: "var(--ps-surface-red)", cursor: "pointer", fontSize: 10, color: "var(--ps-red)", fontWeight: 500 }}>Remove</button>
                  </div>
                  <div style={ffRowStyle}>
                    <FFSelect label="Account Owner" value={acc.owner} onChange={v => updateAccount(idx, ai, "owner", v)} options={clientOptions} />
                    <FFSelect label="Tax Environment" value={acc.tax_environment} onChange={v => updateAccount(idx, ai, "tax_environment", v)}
                      options={[{ value: "", label: "Select..." }, { value: "1", label: "Accumulation" }, { value: "2", label: "Pension" }]} />
                  </div>
                  <div style={ffRowStyle}>
                    <FFInput label="% of Fund Owned" value={acc.fund_percentage} onChange={v => updateAccount(idx, ai, "fund_percentage", v)} type="number" suffix="%" step="1" />
                    <FFInput label="Account Balance" value={acc.balance} onChange={v => updateAccount(idx, ai, "balance", v)} type="number" prefix="$" step="1000" />
                  </div>
                  <div style={ffRowStyle}>
                    <FFInput label="Tax Free Amount" value={acc.tax_free_amt} onChange={v => updateAccount(idx, ai, "tax_free_amt", v)} type="number" prefix="$" step="1000" />
                    <FFInput label="Tax Free %" value={acc.tax_free_pct} onChange={v => updateAccount(idx, ai, "tax_free_pct", v)} placeholder="e.g. 30%" />
                  </div>
                  <div style={ffRowStyle}>
                    <FFInput label="UNP Amount" value={acc.unp_amt} onChange={v => updateAccount(idx, ai, "unp_amt", v)} type="number" prefix="$" step="1000" />
                    <FFRadioRow label="Super Guarantee?" value={acc.super_guarantee} onChange={v => updateAccount(idx, ai, "super_guarantee", v)}
                      options={[{ value: "1", label: "Yes" }, { value: "2", label: "No" }]} />
                  </div>
                  <div style={ffRowStyle}>
                    <FFInput label="Salary Sacrifice" value={acc.salary_sacrifice} onChange={v => updateAccount(idx, ai, "salary_sacrifice", v)} type="number" prefix="$" step="500" />
                    <FFInput label="After Tax" value={acc.after_tax} onChange={v => updateAccount(idx, ai, "after_tax", v)} type="number" prefix="$" step="500" />
                  </div>

                  {/* ── Account Beneficiaries ── */}
                  <div style={{ height: 1, background: "var(--ps-border)", margin: "10px 0 12px" }} />
                  <div style={{ fontSize: 10, fontWeight: 600, color: "var(--ps-text-subtle)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Beneficiaries</div>
                  {(acc.beneficiaries || []).length > 0 && (
                    <div style={{ marginBottom: 8, border: "1px solid var(--ps-border-light)", borderRadius: 6, overflow: "hidden" }}>
                      <table style={miniTableStyle}>
                        <thead><tr style={{ background: "var(--ps-surface-alt)" }}>
                          <th style={miniThStyle}>Who</th>
                          <th style={miniThStyle}>Type</th>
                          <th style={miniThStyle}>Entitlement</th>
                          <th style={{ ...miniThStyle, width: 50 }}></th>
                        </tr></thead>
                        <tbody>
                          {(acc.beneficiaries || []).map((b, bi) => (
                            <tr key={bi}>
                              <td style={miniTdStyle}><FFInput value={b.benef_who} onChange={v => updateBenef(idx, ai, bi, "benef_who", v)} placeholder="Entity name" /></td>
                              <td style={miniTdStyle}>
                                <FFSelect value={b.benef_type} onChange={v => updateBenef(idx, ai, bi, "benef_type", v)}
                                  options={[{ value: "", label: "Select..." }, { value: "binding", label: "Binding" }, { value: "non-binding", label: "Non-binding" }, { value: "lapsing", label: "Lapsing binding" }, { value: "non-lapsing", label: "Non-lapsing binding" }]} />
                              </td>
                              <td style={miniTdStyle}><FFInput value={b.benef_entitlement} onChange={v => updateBenef(idx, ai, bi, "benef_entitlement", v)} placeholder="e.g. 50%" /></td>
                              <td style={miniTdStyle}><button onClick={() => removeBenef(idx, ai, bi)} style={{ fontSize: 10, color: "var(--ps-red)", cursor: "pointer", background: "none", border: "none", fontWeight: 500 }}>Remove</button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <button onClick={() => addBenef(idx, ai)} style={{ padding: "4px 10px", borderRadius: 5, border: "1px dashed #6366F1", background: "var(--ps-surface-purple)", cursor: "pointer", fontSize: 10, fontWeight: 600, color: "#6366F1", display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <span>+</span> Add Beneficiary
                  </button>
                </div>
              );
            })}

            <button onClick={() => addAccount(idx)} style={{
              width: "100%", padding: "10px", borderRadius: 8,
              border: "1px dashed #C7D2FE", background: "var(--ps-surface-purple)",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              fontSize: 12, fontWeight: 600, color: "#6366F1",
            }}>
              <span style={{ fontSize: 14 }}>+</span> Add Account
            </button>
          </div>
        </div>
      ))}
      <button onClick={add} style={{ width: "100%", padding: "20px", borderRadius: 12, border: "2px dashed #C7D2FE", background: "var(--ps-surface-indigo)", cursor: "pointer", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "#6366F1" }}>
        <span style={{ fontSize: 18 }}>+</span> Add SMSF
      </button>
    </div>
  );
}




// ===========================================================================
// FACT FIND — Assets Form (aligned to Base44)
// ===========================================================================

export function AssetsForm({ factFind, updateFF, entityOwnerOptions, clientId }) {
  const [detailIdx, setDetailIdx] = useState(null);
  const debounceTimers = useRef({});

  const assets = factFind.assets || [];
  const clientOptions = entityOwnerOptions || [];

  // Load assets from API on mount
  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    async function load() {
      try {
        const all = await assetsApi.getAll(clientId);
        if (cancelled) return;
        updateFF("assets", all);
      } catch (error) {
        console.error("Failed to load assets:", error);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [clientId]);

  // Cleanup debounce timers on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(clearTimeout);
    };
  }, []);

  const clientName = (id) => {
    if (id?.startsWith("trust_")) {
      const idx = parseInt(id.split("_")[1]);
      return (factFind.trusts || [])[idx]?.trust_name || `Trust ${idx + 1}`;
    }
    if (id?.startsWith("company_")) {
      const idx = parseInt(id.split("_")[1]);
      return (factFind.companies || [])[idx]?.company_name || `Company ${idx + 1}`;
    }
    const found = clientOptions.find(c => c.value === id);
    return found ? found.label : id || "—";
  };

  const assetTypeLabel = (v) => {
    const map = { "1": "Principal residence", "19": "Principal residence (absent)", "18": "Investment property", "21": "Commercial property", "20": "Holiday home", "2": "Vehicle", "8": "Cash", "9": "Term deposits", "12": "Australian shares", "13": "International shares", "26": "Managed funds", "10": "Bonds - Australian", "11": "Bonds - International", "7": "Lifestyle - Other", "42": "Investment - Other", "50": "Receivables", "51": "Inventory", "52": "Plant & Equipment", "53": "Goodwill", "54": "IP", "55": "Related Party Loan", "56": "WIP" };
    return map[v] || v || "—";
  };

  // Debounced update to API
  const debouncedUpdate = useCallback((id, data) => {
    const key = `asset_${id}`;
    if (debounceTimers.current[key]) {
      clearTimeout(debounceTimers.current[key]);
    }
    debounceTimers.current[key] = setTimeout(async () => {
      try {
        await assetsApi.update(id, data);
      } catch (error) {
        console.error("Failed to update asset:", error);
      }
    }, 500);
  }, []);

  const addAsset = useCallback(async () => {
    const defaultName = `Asset ${assets.length + 1}`;
    const newAsset = { a_name: "", a_ownType: "", a_owner: "", a_type: "", a_value: "", a_purchase_price: "", a_purchase_date: "", a_rental_income: "", a_rental_freq: "" };
    if (clientId) {
      try {
        const clientGuidMap = { client1: clientId };
        const created = await assetsApi.create(newAsset, clientGuidMap, defaultName);
        const merged = { ...newAsset, ...created };
        updateFF("assets", [...assets, merged]);
      } catch (error) {
        console.error("Failed to create asset:", error);
      }
    } else {
      updateFF("assets", [...assets, newAsset]);
    }
  }, [clientId, assets, updateFF]);

  const removeAsset = useCallback(async (idx) => {
    const asset = assets[idx];
    if (asset?.id) {
      try {
        await assetsApi.remove(asset.id);
      } catch (error) {
        console.error("Failed to remove asset:", error);
        return;
      }
    }
    updateFF("assets", assets.filter((_, i) => i !== idx));
    setDetailIdx(null);
  }, [assets, updateFF]);

  const updateAsset = useCallback((idx, field, value) => {
    const updated = assets.map((item, i) => i === idx ? { ...item, [field]: value } : item);
    updateFF("assets", updated);
    const record = updated[idx];
    if (record?.id) {
      debouncedUpdate(record.id, record);
    }
  }, [assets, updateFF, debouncedUpdate]);

  return (
    <div>
      {detailIdx === null ? (
        <div>
          {assets.length > 0 && (
            <div style={{ border: "1px solid var(--ps-border)", borderRadius: 10, overflow: "hidden", marginBottom: 12, background: "var(--ps-surface)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead><tr style={{ background: "var(--ps-surface-alt)", borderBottom: "1px solid var(--ps-border)" }}>
                  <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: "var(--ps-text-muted)", fontSize: 11 }}>Asset Name</th>
                  <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: "var(--ps-text-muted)", fontSize: 11 }}>Owner</th>
                  <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: "var(--ps-text-muted)", fontSize: 11 }}>Type</th>
                  <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, color: "var(--ps-text-muted)", fontSize: 11 }}>Value</th>
                  <th style={{ padding: "8px 12px", width: 100 }}></th>
                </tr></thead>
                <tbody>
                  {assets.map((a, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid var(--ps-border-light)", cursor: "pointer" }} onClick={() => setDetailIdx(idx)}>
                      <td style={{ padding: "8px 12px", fontWeight: 600, color: "var(--ps-text-primary)" }}>{a.a_name || `Asset ${idx + 1}`}</td>
                      <td style={{ padding: "8px 12px", color: "var(--ps-text-muted)" }}>{a.a_ownType === "2" ? "Joint" : clientName(a.a_owner)}</td>
                      <td style={{ padding: "8px 12px", color: "var(--ps-text-muted)" }}>{assetTypeLabel(a.a_type)}</td>
                      <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, color: "var(--ps-text-primary)" }}>{a.a_value ? `$${parseFloat(a.a_value).toLocaleString()}` : "—"}</td>
                      <td style={{ padding: "8px 12px", textAlign: "right" }}>
                        <span style={{ fontSize: 11, color: "#3B82F6", fontWeight: 500, marginRight: 8 }}>Edit</span>
                        <button onClick={(e) => { e.stopPropagation(); removeAsset(idx); }} style={{ fontSize: 10, color: "var(--ps-red)", cursor: "pointer", background: "none", border: "none", fontWeight: 500 }}>Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <button onClick={addAsset} style={{ width: "100%", padding: assets.length === 0 ? "40px" : "16px", borderRadius: 12, border: "2px dashed var(--ps-ring-cyan)", background: "var(--ps-surface-teal)", cursor: "pointer", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "#0891B2", flexDirection: assets.length === 0 ? "column" : "row" }}>
            {assets.length === 0 && <span style={{ fontSize: 32, marginBottom: 8 }}>🏠</span>}
            <span style={{ fontSize: 16 }}>+</span> {assets.length === 0 ? "Add First Asset" : "Add Asset"}
          </button>
        </div>
      ) : assets[detailIdx] && (() => {
        const data = assets[detailIdx]; const idx = detailIdx;
        return (
          <div style={{ border: "1px solid var(--ps-border)", borderRadius: 12, background: "var(--ps-surface)", overflow: "hidden", marginBottom: 16 }}>
            <div style={{ padding: "12px 18px", background: "#0891B208", borderBottom: "1px solid var(--ps-border)", display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={() => setDetailIdx(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "var(--ps-text-muted)" }}>←</button>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ps-text-primary)" }}>{data.a_name || `Asset ${idx + 1}`}</div>
            </div>
            <div style={{ padding: 18 }}>
              <div style={ffRowStyle}>
                <FFInput label="Asset Name" value={data.a_name} onChange={v => updateAsset(idx, "a_name", v)} placeholder="e.g. Family Home Melbourne" />
                <FFSelect label="Ownership Type" value={data.a_ownType} onChange={v => updateAsset(idx, "a_ownType", v)}
                  options={[{ value: "", label: "Select..." }, { value: "1", label: "Sole ownership" }, { value: "2", label: "Joint" }, { value: "3", label: "Trust" }, { value: "4", label: "Company" }]} />
              </div>
              <div style={ffRowStyle}>
                {(() => {
                  let ownerOpts = [{ value: "", label: "Select..." }, ...clientOptions];
                  if (data.a_ownType === "3") {
                    ownerOpts = [{ value: "", label: "Select trust..." }, ...(factFind.trusts || []).map((t, i) => ({ value: `trust_${i}`, label: t.trust_name || `Trust ${i + 1}` }))];
                  } else if (data.a_ownType === "4") {
                    ownerOpts = [{ value: "", label: "Select company..." }, ...(factFind.companies || []).map((c, i) => ({ value: `company_${i}`, label: c.company_name || `Company ${i + 1}` }))];
                  }
                  return <FFSelect label="Owner" value={data.a_owner} onChange={v => updateAsset(idx, "a_owner", v)} options={ownerOpts} />;
                })()}
                <FFSelect label="Asset Type" value={data.a_type} onChange={v => updateAsset(idx, "a_type", v)}
                  options={[
                    { value: "", label: "Select..." },
                    ...(data.a_ownType !== "4" ? [
                      { value: "1", label: "Principal residence" },
                      { value: "19", label: "Principal residence (absent)" },
                    ] : []),
                    { value: "18", label: "Investment property" },
                    { value: "21", label: "Commercial property" },
                    ...(data.a_ownType !== "4" ? [{ value: "20", label: "Holiday home" }] : []),
                    { value: "2", label: "Vehicle" },
                    { value: "8", label: "Cash" },
                    { value: "9", label: "Term deposits" },
                    { value: "12", label: "Australian shares" },
                    { value: "13", label: "International shares" },
                    { value: "26", label: "Managed funds" },
                    { value: "10", label: "Bonds - Australian" },
                    { value: "11", label: "Bonds - International" },
                    ...(data.a_ownType !== "4" ? [{ value: "7", label: "Lifestyle - Other" }] : []),
                    { value: "42", label: "Investment - Other" },
                    // Company-specific asset types
                    ...(data.a_ownType === "4" ? [
                      { value: "50", label: "Receivables / Debtors" },
                      { value: "51", label: "Inventory / Stock" },
                      { value: "52", label: "Plant & Equipment" },
                      { value: "53", label: "Goodwill" },
                      { value: "54", label: "Intellectual Property" },
                      { value: "55", label: "Loan to Related Party" },
                      { value: "56", label: "Work in Progress" },
                    ] : []),
                  ]} />
              </div>
              <div style={ffRowStyle}>
                <FFInput label="Current Value" value={data.a_value} onChange={v => updateAsset(idx, "a_value", v)} type="number" prefix="$" />
                <FFInput label="Purchase Price" value={data.a_purchase_price} onChange={v => updateAsset(idx, "a_purchase_price", v)} type="number" prefix="$" />
              </div>
              <div style={ffRowStyle}>
                <FFInput label="Purchase Date" value={data.a_purchase_date} onChange={v => updateAsset(idx, "a_purchase_date", v)} type="date" />
                {data.a_type === "19" ? (
                  <FFInput label="Move-out Date" value={data.a_move_out_date} onChange={v => updateAsset(idx, "a_move_out_date", v)} type="date" />
                ) : ["12", "13", "26", "42"].includes(data.a_type) ? (
                  <FFSelect label="Reinvest Dividends (DRP)" value={data.a_drp || "no"}
                    onChange={v => updateAsset(idx, "a_drp", v)}
                    options={[{ value: "no", label: "No — pay to cash" }, { value: "yes", label: "Yes — reinvest" }]} />
                ) : <div />}
              </div>
              {data.a_type === "19" && (() => {
                const moveOut = data.a_move_out_date ? new Date(data.a_move_out_date) : null;
                const now = new Date();
                const sixYearExpiry = moveOut ? new Date(moveOut.getFullYear() + 6, moveOut.getMonth(), moveOut.getDate()) : null;
                const daysRemaining = sixYearExpiry ? Math.ceil((sixYearExpiry - now) / (1000 * 60 * 60 * 24)) : null;
                const yearsAbsent = moveOut ? ((now - moveOut) / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1) : null;
                const isExpired = daysRemaining !== null && daysRemaining <= 0;
                const isWarning = daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 365;
                return moveOut ? (
                  <div style={{ padding: "8px 12px", borderRadius: 8, background: isExpired ? "#FEF2F2" : isWarning ? "#FEF3C7" : "#ECFDF5", border: `1px solid ${isExpired ? "#FECACA" : isWarning ? "#FDE68A" : "#A7F3D0"}`, display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: 16 }}>{isExpired ? "⚠️" : isWarning ? "⏰" : "✅"}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: isExpired ? "#991B1B" : isWarning ? "#92400E" : "#065F46" }}>
                        6 Year Rule — {isExpired ? "EXPIRED" : `${daysRemaining.toLocaleString()} days remaining`}
                      </div>
                      <div style={{ fontSize: 10, color: isExpired ? "#B91C1C" : isWarning ? "#B45309" : "#047857" }}>
                        Absent {yearsAbsent} years · Expires {sixYearExpiry.toLocaleDateString("en-AU")} · {isExpired ? "CGT may apply from move-out date. Consider moving back to reset." : isWarning ? "Approaching expiry — consider moving back to reset the clock." : "CGT main residence exemption still available (s118-145 ITAA 1997)."}
                      </div>
                    </div>
                  </div>
                ) : null;
              })()}
              {(data.a_type === "18" || data.a_type === "19" || data.a_type === "21") && (<>
              <div style={{ height: 1, background: "var(--ps-border-light)", margin: "8px 0 16px" }} />
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-subtle)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Rental Income</div>
              <div style={ffRowStyle}>
                <FFInput label="Rental Income" value={data.a_rental_income} onChange={v => updateAsset(idx, "a_rental_income", v)} type="number" prefix="$" />
                <FFSelect label="Rental Frequency" value={data.a_rental_freq} onChange={v => updateAsset(idx, "a_rental_freq", v)}
                  options={[{ value: "", label: "Select..." }, { value: "52", label: "Weekly" }, { value: "26", label: "Fortnightly" }, { value: "12", label: "Monthly" }, { value: "4", label: "Quarterly" }, { value: "1", label: "Annually" }]} />
              </div>
              </>)}
              {data.a_type === "20" && (<>
              <div style={{ height: 1, background: "var(--ps-border-light)", margin: "8px 0 16px" }} />
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-subtle)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Holiday Home — Rental / Income Use</div>
              <div style={ffRowStyle}>
                <FFSelect label="Is this property rented out?" value={data.a_hh_rented} onChange={v => updateAsset(idx, "a_hh_rented", v)}
                  options={[{ value: "", label: "Select..." }, { value: "no", label: "No — personal use only" }, { value: "longterm", label: "Yes — long-term rental" }, { value: "airbnb", label: "Yes — Airbnb / short-term" }, { value: "mixed", label: "Mixed — partial rental" }]} />
                <div />
              </div>
              {(data.a_hh_rented === "longterm" || data.a_hh_rented === "airbnb" || data.a_hh_rented === "mixed") && (<>
              <div style={ffRowStyle}>
                <FFInput label="Rental Income" value={data.a_rental_income} onChange={v => updateAsset(idx, "a_rental_income", v)} type="number" prefix="$" />
                <FFSelect label="Rental Frequency" value={data.a_rental_freq} onChange={v => updateAsset(idx, "a_rental_freq", v)}
                  options={[{ value: "", label: "Select..." }, { value: "52", label: "Weekly" }, { value: "26", label: "Fortnightly" }, { value: "12", label: "Monthly" }, { value: "4", label: "Quarterly" }, { value: "1", label: "Annually" }]} />
              </div>
              <div style={{ height: 1, background: "var(--ps-border-light)", margin: "8px 0 12px" }} />
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-subtle)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Tax Deductibility</div>
              <div style={ffRowStyle}>
                <FFInput label="Days Available for Rent (per year)" value={data.a_hh_days_available} onChange={v => updateAsset(idx, "a_hh_days_available", v)} type="number" placeholder="e.g. 200" />
                <FFInput label="% of Property Rented" value={data.a_hh_pct_rented} onChange={v => updateAsset(idx, "a_hh_pct_rented", v)} type="number" placeholder="100" />
              </div>
              {(() => {
                const days = parseFloat(data.a_hh_days_available) || 0;
                const pct = parseFloat(data.a_hh_pct_rented) || 100;
                const deductiblePct = ((days / 365) * (pct / 100) * 100).toFixed(1);
                const rentalInc = (parseFloat(data.a_rental_income) || 0) * (parseFloat(data.a_rental_freq) || 52);
                return (
                  <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                    <div style={{ flex: 1, padding: "8px 12px", borderRadius: 8, background: "var(--ps-surface-alt)", border: "1px solid var(--ps-border)" }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: "var(--ps-text-muted)" }}>Deductible %</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: "var(--ps-text-primary)", fontFamily: "'JetBrains Mono', monospace" }}>{deductiblePct}%</div>
                      <div style={{ fontSize: 9, color: "var(--ps-text-subtle)" }}>{days} days / 365 x {pct}% property</div>
                    </div>
                    <div style={{ flex: 1, padding: "8px 12px", borderRadius: 8, background: "var(--ps-surface-alt)", border: "1px solid var(--ps-border)" }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: "var(--ps-text-muted)" }}>Annual Rental Income</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: "var(--ps-green)", fontFamily: "'JetBrains Mono', monospace" }}>${rentalInc.toLocaleString()}</div>
                    </div>
                    <div style={{ flex: 1, padding: "8px 12px", borderRadius: 8, background: "var(--ps-surface-alt)", border: "1px solid var(--ps-border)" }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: "var(--ps-text-muted)" }}>Personal Use</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: "var(--ps-text-primary)", fontFamily: "'JetBrains Mono', monospace" }}>{365 - days} days</div>
                    </div>
                  </div>
                );
              })()}
              <div style={{ padding: "6px 10px", borderRadius: 6, background: "var(--ps-surface-indigo)", border: "1px solid var(--ps-ring-indigo)", fontSize: 10, color: "var(--ps-text-secondary)", marginTop: 6 }}>
                Interest, rates, insurance and depreciation are deductible at {((parseFloat(data.a_hh_days_available) || 0) / 365 * (parseFloat(data.a_hh_pct_rented) || 100) / 100 * 100).toFixed(1)}%. Direct rental costs (management, cleaning, advertising) are 100% deductible. All rental income is assessable in full.
              </div>
              </>)}
              <div style={ffRowStyle}>
                <FFInput label="Annual Holding Costs (rates, insurance, body corp)" value={data.a_hh_holding_costs} onChange={v => updateAsset(idx, "a_hh_holding_costs", v)} type="number" prefix="$" placeholder="e.g. 8000" />
                <FFInput label="Annual Management / Rental Costs" value={data.a_hh_mgmt_costs} onChange={v => updateAsset(idx, "a_hh_mgmt_costs", v)} type="number" prefix="$" placeholder="e.g. 3000" />
              </div>
              </>)}
            </div>
          </div>
        );
      })()}
    </div>
  );
}


// ===========================================================================
// FACT FIND — Liabilities Form (aligned to Base44)
// ===========================================================================

export function LiabilitiesForm({ factFind, updateFF, entityOwnerOptions, clientId }) {
  const [detailIdx, setDetailIdx] = useState(null);
  const debounceTimers = useRef({});

  const assets = factFind.assets || [];
  const liabilities = factFind.liabilities || [];
  const clientOptions = entityOwnerOptions || [];

  // Load debts from API on mount
  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    async function load() {
      try {
        const all = await debtsApi.getAll(clientId);
        if (cancelled) return;
        updateFF("liabilities", all);
      } catch (error) {
        console.error("Failed to load debts:", error);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [clientId]);

  // Cleanup debounce timers on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(clearTimeout);
    };
  }, []);

  const clientName = (id) => {
    if (id?.startsWith("trust_")) {
      const idx = parseInt(id.split("_")[1]);
      return (factFind.trusts || [])[idx]?.trust_name || `Trust ${idx + 1}`;
    }
    if (id?.startsWith("company_")) {
      const idx = parseInt(id.split("_")[1]);
      return (factFind.companies || [])[idx]?.company_name || `Company ${idx + 1}`;
    }
    const found = clientOptions.find(c => c.value === id);
    return found ? found.label : id || "—";
  };

  const debtTypeLabel = (v) => {
    const map = { "1": "Home loan", "2": "Investment loan", "3": "Margin loan", "5": "Credit card", "6": "Reverse mortgage", "7": "Car loan", "8": "Other", "60": "Director loan (Div 7A)", "61": "Creditors", "62": "Provisions", "63": "HP/Lease", "64": "Overdraft", "65": "Related party loan", "66": "Shareholder loan" };
    return map[v] || v || "—";
  };
  const freqLabel = (v) => {
    const map = { "52": "Weekly", "26": "Fortnightly", "12": "Monthly", "4": "Quarterly", "1": "Annually" };
    return map[v] || "";
  };

  // Debounced update to API
  const debouncedUpdate = useCallback((id, data) => {
    const key = `debt_${id}`;
    if (debounceTimers.current[key]) {
      clearTimeout(debounceTimers.current[key]);
    }
    debounceTimers.current[key] = setTimeout(async () => {
      try {
        await debtsApi.update(id, data);
      } catch (error) {
        console.error("Failed to update debt:", error);
      }
    }, 500);
  }, []);

  const addLiability = useCallback(async () => {
    const defaultName = `Debt ${liabilities.length + 1}`;
    const newDebt = { d_name: "", d_ownType: "", d_owner: "", d_type: "", d_rate: "", d_freq: "", d_repayments: "", d_term: "", d_balance: "", d_io: "", d_fixed: "", d_has_redraw: "", d_redraw: "", d_redraw_limit: "", d_security: [], d_offset: [] };
    if (clientId) {
      try {
        const clientGuidMap = { client1: clientId };
        const created = await debtsApi.create(newDebt, clientGuidMap, defaultName);
        const merged = { ...newDebt, ...created };
        updateFF("liabilities", [...liabilities, merged]);
      } catch (error) {
        console.error("Failed to create debt:", error);
      }
    } else {
      updateFF("liabilities", [...liabilities, newDebt]);
    }
  }, [clientId, liabilities, updateFF]);

  const removeLiability = useCallback(async (idx) => {
    const debt = liabilities[idx];
    if (debt?.id) {
      try {
        await debtsApi.remove(debt.id);
      } catch (error) {
        console.error("Failed to remove debt:", error);
        return;
      }
    }
    updateFF("liabilities", liabilities.filter((_, i) => i !== idx));
    setDetailIdx(null);
  }, [liabilities, updateFF]);

  const updateLiability = useCallback((idx, field, value) => {
    const updated = liabilities.map((item, i) => i === idx ? { ...item, [field]: value } : item);
    updateFF("liabilities", updated);
    const record = updated[idx];
    if (record?.id) {
      debouncedUpdate(record.id, record);
    }
  }, [liabilities, updateFF, debouncedUpdate]);

  return (
    <div>
      {detailIdx === null ? (
        <div>
          {liabilities.length > 0 && (
            <div style={{ border: "1px solid var(--ps-border)", borderRadius: 10, overflow: "hidden", marginBottom: 12, background: "var(--ps-surface)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead><tr style={{ background: "var(--ps-surface-alt)", borderBottom: "1px solid var(--ps-border)" }}>
                  <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: "var(--ps-text-muted)", fontSize: 11 }}>Debt Name</th>
                  <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: "var(--ps-text-muted)", fontSize: 11 }}>Owner</th>
                  <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: "var(--ps-text-muted)", fontSize: 11 }}>Type</th>
                  <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, color: "var(--ps-text-muted)", fontSize: 11 }}>Balance</th>
                  <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, color: "var(--ps-text-muted)", fontSize: 11 }}>Repayment</th>
                  <th style={{ padding: "8px 12px", width: 100 }}></th>
                </tr></thead>
                <tbody>
                  {liabilities.map((d, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid var(--ps-border-light)", cursor: "pointer" }} onClick={() => setDetailIdx(idx)}>
                      <td style={{ padding: "8px 12px", fontWeight: 600, color: "var(--ps-text-primary)" }}>{d.d_name || `Liability ${idx + 1}`}</td>
                      <td style={{ padding: "8px 12px", color: "var(--ps-text-muted)" }}>{d.d_ownType === "2" ? "Joint" : clientName(d.d_owner)}</td>
                      <td style={{ padding: "8px 12px", color: "var(--ps-text-muted)" }}>{debtTypeLabel(d.d_type)}</td>
                      <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, color: "var(--ps-text-primary)" }}>{d.d_balance ? `$${parseFloat(d.d_balance).toLocaleString()}` : "—"}</td>
                      <td style={{ padding: "8px 12px", textAlign: "right", color: "var(--ps-text-muted)" }}>{d.d_repayments ? `$${parseFloat(d.d_repayments).toLocaleString()} ${freqLabel(d.d_freq)}` : "—"}</td>
                      <td style={{ padding: "8px 12px", textAlign: "right" }}>
                        <span style={{ fontSize: 11, color: "#3B82F6", fontWeight: 500, marginRight: 8 }}>Edit</span>
                        <button onClick={(e) => { e.stopPropagation(); removeLiability(idx); }} style={{ fontSize: 10, color: "var(--ps-red)", cursor: "pointer", background: "none", border: "none", fontWeight: 500 }}>Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <button onClick={addLiability} style={{ width: "100%", padding: liabilities.length === 0 ? "40px" : "16px", borderRadius: 12, border: "2px dashed #FCA5A5", background: "var(--ps-surface-red)", cursor: "pointer", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "var(--ps-red)", flexDirection: liabilities.length === 0 ? "column" : "row" }}>
            {liabilities.length === 0 && <span style={{ fontSize: 32, marginBottom: 8 }}>💳</span>}
            <span style={{ fontSize: 16 }}>+</span> {liabilities.length === 0 ? "Add First Liability" : "Add Liability"}
          </button>
        </div>
      ) : liabilities[detailIdx] && (() => {
        const data = liabilities[detailIdx]; const idx = detailIdx;
        return (
          <div style={{ border: "1px solid var(--ps-border)", borderRadius: 12, background: "var(--ps-surface)", overflow: "hidden", marginBottom: 16 }}>
            <div style={{ padding: "12px 18px", background: "#DC262608", borderBottom: "1px solid var(--ps-border)", display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={() => setDetailIdx(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "var(--ps-text-muted)" }}>←</button>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ps-text-primary)" }}>{data.d_name || `Liability ${idx + 1}`}</div>
            </div>
            <div style={{ padding: 18 }}>
              <div style={ffRowStyle}>
                <FFInput label="Debt Name" value={data.d_name} onChange={v => updateLiability(idx, "d_name", v)} placeholder="e.g. Home Loan - XYZ Bank" />
                <FFSelect label="Ownership Type" value={data.d_ownType} onChange={v => updateLiability(idx, "d_ownType", v)}
                  options={[{ value: "", label: "Select..." }, { value: "1", label: "Sole ownership" }, { value: "2", label: "Joint" }, { value: "3", label: "Trust" }, { value: "4", label: "Company" }]} />
              </div>
              <div style={ffRowStyle}>
                {(() => {
                  let ownerOpts = [{ value: "", label: "Select..." }, ...clientOptions];
                  if (data.d_ownType === "3") {
                    ownerOpts = [{ value: "", label: "Select trust..." }, ...(factFind.trusts || []).map((t, i) => ({ value: `trust_${i}`, label: t.trust_name || `Trust ${i + 1}` }))];
                  } else if (data.d_ownType === "4") {
                    ownerOpts = [{ value: "", label: "Select company..." }, ...(factFind.companies || []).map((c, i) => ({ value: `company_${i}`, label: c.company_name || `Company ${i + 1}` }))];
                  }
                  return <FFSelect label="Owner" value={data.d_owner} onChange={v => updateLiability(idx, "d_owner", v)} options={ownerOpts} />;
                })()}
                <FFSelect label="Debt Type" value={data.d_type} onChange={v => updateLiability(idx, "d_type", v)}
                  options={[
                    { value: "", label: "Select..." },
                    ...(data.d_ownType !== "4" ? [{ value: "1", label: "Home loan" }] : []),
                    { value: "2", label: "Investment loan" },
                    { value: "3", label: "Margin loan" },
                    { value: "5", label: "Credit card" },
                    ...(data.d_ownType !== "4" ? [{ value: "6", label: "Reverse mortgage" }] : []),
                    { value: "7", label: "Car loan" },
                    { value: "8", label: "Other" },
                    // Company-specific liability types
                    ...(data.d_ownType === "4" ? [
                      { value: "60", label: "Director loan (Div 7A)" },
                      { value: "61", label: "Creditors / Payables" },
                      { value: "62", label: "Provisions (Leave / Tax)" },
                      { value: "63", label: "HP / Lease liability" },
                      { value: "64", label: "Bank overdraft" },
                      { value: "65", label: "Related party loan" },
                      { value: "66", label: "Shareholder loan" },
                    ] : []),
                  ]} />
              </div>
              <div style={ffRowStyle}>
                <FFInput label="Current Balance" value={data.d_balance} onChange={v => updateLiability(idx, "d_balance", v)} type="number" prefix="$" />
                <FFInput label="Interest Rate" value={data.d_rate} onChange={v => updateLiability(idx, "d_rate", v)} placeholder="e.g. 6.49%" />
              </div>
              <div style={{ height: 1, background: "var(--ps-border-light)", margin: "8px 0 16px" }} />
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-subtle)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Repayments</div>
              <div style={ffRowStyle}>
                <FFSelect label="Repayment Frequency" value={data.d_freq} onChange={v => updateLiability(idx, "d_freq", v)}
                  options={[{ value: "", label: "Select..." }, { value: "52", label: "Weekly" }, { value: "26", label: "Fortnightly" }, { value: "12", label: "Monthly" }, { value: "4", label: "Quarterly" }]} />
                <FFInput label="Repayment Amount" value={data.d_repayments} onChange={v => updateLiability(idx, "d_repayments", v)} type="number" prefix="$" />
              </div>
              <div style={ffRowStyle}>
                <FFInput label="Term Remaining" value={data.d_term} onChange={v => updateLiability(idx, "d_term", v)} placeholder="e.g. 18 years" />
                <FFRadioRow label="Redraw Facility?" value={data.d_has_redraw} onChange={v => updateLiability(idx, "d_has_redraw", v)}
                  options={[{ value: "1", label: "Yes" }, { value: "2", label: "No" }]} />
              </div>
              {data.d_has_redraw === "1" && (
                <div style={ffRowStyle}>
                  <FFInput label="Current Redraw Balance" value={data.d_redraw} onChange={v => updateLiability(idx, "d_redraw", v)} type="number" prefix="$" placeholder="e.g. 12,500" />
                  <FFInput label="Redraw Facility Limit" value={data.d_redraw_limit} onChange={v => updateLiability(idx, "d_redraw_limit", v)} type="number" prefix="$" placeholder="e.g. 50,000" />
                </div>
              )}
              <div style={{ height: 1, background: "var(--ps-border-light)", margin: "8px 0 16px" }} />
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-subtle)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Loan Features</div>
              <div style={ffRowStyle}>
                <FFRadioRow label="Interest Only?" value={data.d_io} onChange={v => updateLiability(idx, "d_io", v)}
                  options={[{ value: "1", label: "Yes" }, { value: "2", label: "No" }]} />
                <FFRadioRow label="Fixed Rate?" value={data.d_fixed} onChange={v => updateLiability(idx, "d_fixed", v)}
                  options={[{ value: "1", label: "Yes" }, { value: "2", label: "No" }]} />
              </div>
              {assets.length > 0 && (<>
                <div style={{ height: 1, background: "var(--ps-border-light)", margin: "8px 0 16px" }} />
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-subtle)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Security</div>
                <div>
                  {assets.map((a, ai) => {
                    const isSelected = (data.d_security || []).includes(String(ai));
                    return (
                      <label key={ai} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", cursor: "pointer", fontSize: 12 }}>
                        <input type="checkbox" checked={isSelected} onChange={() => {
                          const current = data.d_security || [];
                          const key = String(ai);
                          const next = isSelected ? current.filter(s => s !== key) : [...current, key];
                          updateLiability(idx, "d_security", next);
                        }} />
                        <span style={{ color: "var(--ps-text-primary)" }}>{a.a_name || `Asset ${ai + 1}`}</span>
                        {a.a_value && <span style={{ color: "var(--ps-text-subtle)", fontSize: 11 }}>— ${parseFloat(a.a_value).toLocaleString()}</span>}
                      </label>
                    );
                  })}
                </div>
              </>)}
              {["1","2","3"].includes(data.d_type) && (() => {
                const cashAssets = (factFind.assets || []).filter(a => ["8","9","10","11"].includes(a.a_type));
                if (cashAssets.length === 0) return null;
                return (<>
                  <div style={{ height: 1, background: "var(--ps-border-light)", margin: "8px 0 16px" }} />
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-subtle)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Offset Account</div>
                  <div style={{ fontSize: 11, color: "var(--ps-text-muted)", marginBottom: 10 }}>Link a cash account as an offset — interest is calculated on the loan balance minus the offset balance.</div>
                  <div>
                    {cashAssets.map((a, ai) => {
                      const assetIdx = String((factFind.assets || []).indexOf(a));
                      const isSelected = (data.d_offset || []).includes(assetIdx);
                      return (
                        <label key={ai} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", cursor: "pointer", fontSize: 12 }}>
                          <input type="checkbox" checked={isSelected} onChange={() => {
                            const current = data.d_offset || [];
                            const next = isSelected ? current.filter(s => s !== assetIdx) : [...current, assetIdx];
                            updateLiability(idx, "d_offset", next);
                          }} />
                          <span style={{ color: "var(--ps-text-primary)" }}>{a.a_name || `Asset ${ai + 1}`}</span>
                          {a.a_value && <span style={{ color: "var(--ps-text-subtle)", fontSize: 11 }}>— ${parseFloat(a.a_value).toLocaleString()}</span>}
                        </label>
                      );
                    })}
                  </div>
                </>);
              })()}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
// ===========================================================================
// FACT FIND — Insurance Policies Form (Base44-aligned)
// ===========================================================================

const INSURANCE_TYPE_CONFIG = {
  "1":  { sumInsured: ["life"], premium: ["life"], showTaxEnv: true, showIPFields: false },
  "2":  { sumInsured: ["life", "tpd"], premium: ["life", "tpd"], showTaxEnv: true, showIPFields: false },
  "3":  { sumInsured: ["life", "trauma"], premium: ["life", "trauma"], showTaxEnv: true, showIPFields: false },
  "4":  { sumInsured: ["life", "tpd", "trauma"], premium: ["life", "tpd", "trauma"], showTaxEnv: true, showIPFields: false },
  "5":  { sumInsured: ["tpd"], premium: ["tpd"], showTaxEnv: true, showIPFields: false },
  "6":  { sumInsured: ["trauma"], premium: ["trauma"], showTaxEnv: false, showIPFields: false },
  "7":  { sumInsured: ["trauma", "tpd"], premium: ["trauma", "tpd"], showTaxEnv: false, showIPFields: false },
  "8":  { sumInsured: ["ip"], premium: ["ip"], showTaxEnv: true, showIPFields: true },
  "10": { sumInsured: ["life", "tpd"], premium: ["life", "tpd"], showTaxEnv: false, showIPFields: false },
  "11": { sumInsured: ["life", "tpd"], premium: ["life", "tpd"], showTaxEnv: false, showIPFields: false },
  "12": { sumInsured: ["life", "trauma"], premium: ["life", "trauma"], showTaxEnv: false, showIPFields: false },
  "13": { sumInsured: ["ip", "ip2"], premium: ["ip", "ip2"], showTaxEnv: false, showIPFields: true },
};

const INSURANCE_POLICY_TYPES = [
  { value: "1", label: "Life (Stand-alone)" },
  { value: "2", label: "Life with Linked TPD" },
  { value: "3", label: "Life with Linked Trauma" },
  { value: "4", label: "Life with Linked TPD/Trauma" },
  { value: "5", label: "TPD (Stand-alone)" },
  { value: "6", label: "Trauma (Stand-alone)" },
  { value: "7", label: "Trauma with Linked TPD" },
  { value: "8", label: "Income Protection (Stand-alone)" },
  { value: "10", label: "Life with Super linked TPD" },
  { value: "11", label: "Life with Flexi linked TPD" },
  { value: "12", label: "Life with Flexi linked Trauma" },
  { value: "13", label: "Super-Linked IP" },
];

const IP_WAITING_OPTIONS = [
  { value: "1", label: "30 days" }, { value: "2", label: "60 days" }, { value: "3", label: "90 days" },
  { value: "4", label: "120 days" }, { value: "5", label: "180 days" }, { value: "6", label: "1 year" },
  { value: "7", label: "2 years" }, { value: "8", label: "Other" },
];

const IP_BENEFIT_PERIOD_OPTIONS = [
  { value: "2", label: "180 days" }, { value: "3", label: "1 year" }, { value: "4", label: "2 years" },
  { value: "5", label: "3 years" }, { value: "6", label: "5 years" }, { value: "7", label: "to age 60" },
  { value: "8", label: "to age 65" }, { value: "9", label: "to age 67" }, { value: "10", label: "to age 70" },
];

const PREMIUM_FREQ_OPTIONS = [
  { value: "1", label: "Weekly" }, { value: "2", label: "Fortnightly" }, { value: "3", label: "Monthly" },
  { value: "4", label: "Quarterly" }, { value: "5", label: "Half-yearly" }, { value: "6", label: "Annual" },
];

const PREMIUM_STRUCTURE_OPTIONS = [
  { value: "1", label: "Stepped" }, { value: "2", label: "Level" }, { value: "3", label: "Hybrid" },
];

const EMPTY_INSURANCE_POLICY = {
  pol_name: "", pol_type: "", pol_tax_env: "", linked_fund_id: "",
  pol_owner: "", pol_insured: "", pol_insurer: "", pol_number: "",
  pol_waiting: "", pol_benefit_period: "",
  sum_insured_life: "", sum_insured_tpd: "", sum_insured_trauma: "", sum_insured_ip: "", sum_insured_ip2: "",
  premium_life: "", premium_tpd: "", premium_trauma: "", premium_ip: "", premium_ip2: "",
  pol_freq: "", pol_structure: "",
};

export function InsurancePoliciesForm({ factFind, updateFF, clientId, clientGuidMap }) {
  const [activeIdx, setActiveIdx] = useState(0);

  const policies = factFind.insurance?.policies || [];
  const setPolicies = (newPols) => updateFF("insurance", { ...(factFind.insurance || {}), policies: newPols });

  // ── Load policies from API on mount ──
  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    (async () => {
      try {
        const records = await insuranceApi.getAll(clientId);
        if (!cancelled) {
          updateFF("insurance", { ...(factFind.insurance || {}), policies: records });
        }
      } catch (err) {
        console.error('[InsurancePoliciesForm] Failed to load insurance policies:', err);
      }
    })();
    return () => { cancelled = true; };
  }, [clientId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Debounced update timer ref ──
  const updateTimerRef = useRef(null);

  // Owner options from principals
  const ownerOptions = [];
  if (factFind.client1) ownerOptions.push({ value: "client1", label: ((factFind.client1?.first_name || "") + " " + (factFind.client1?.last_name || "")).trim() || "Client 1" });
  if (factFind.client2) ownerOptions.push({ value: "client2", label: ((factFind.client2?.first_name || "") + " " + (factFind.client2?.last_name || "")).trim() || "Client 2" });

  const getOwnerName = (id) => ownerOptions.find(o => o.value === id)?.label || "this owner";

  // Build fund options for a given owner (super funds, pensions, SMSF accounts)
  const getOwnerFunds = (ownerId) => {
    if (!ownerId) return [];
    const funds = [];
    (factFind.superProducts || []).forEach((f, i) => {
      if (f.owner === ownerId) funds.push({ value: `super_${i}`, label: f.fund_name || `Super Fund ${i + 1}`, type: "Superannuation" });
    });
    (factFind.pensions || []).forEach((p, i) => {
      if (p.owner === ownerId) funds.push({ value: `pension_${i}`, label: p.fund_name || `Pension ${i + 1}`, type: "Pension" });
    });
    (factFind.smsfs || []).forEach((smsf, si) => {
      (smsf.accounts || []).forEach((a, ai) => {
        // Only show accumulation accounts for insurance linking (not pension phase)
        if (a.owner === ownerId && a.tax_environment !== "pension") {
          funds.push({ value: `smsf_${si}_${ai}`, label: `${smsf.smsf_name || "SMSF"} — ${a.tax_environment === "accumulation" ? "Accumulation" : "Account " + (ai + 1)}`, type: "SMSF" });
        }
      });
    });
    return funds;
  };

  const addPolicy = async () => {
    try {
      const result = await insuranceApi.create({ ...EMPTY_INSURANCE_POLICY }, clientGuidMap);
      const newPols = [...policies, result];
      setPolicies(newPols);
      setActiveIdx(newPols.length - 1);
    } catch (err) {
      console.error('[InsurancePoliciesForm] Failed to create policy:', err);
      const newPols = [...policies, { ...EMPTY_INSURANCE_POLICY }];
      setPolicies(newPols);
      setActiveIdx(newPols.length - 1);
    }
  };
  const removePolicy = async () => {
    if (policies.length === 0) return;
    const polToRemove = policies[activeIdx];
    const newPols = policies.filter((_, i) => i !== activeIdx);
    setPolicies(newPols);
    if (activeIdx >= newPols.length && activeIdx > 0) setActiveIdx(activeIdx - 1);
    if (polToRemove?.id) {
      try {
        await insuranceApi.remove(polToRemove.id);
      } catch (err) {
        console.error('[InsurancePoliciesForm] Failed to remove policy:', err);
      }
    }
  };
  const updatePolicy = (field, value) => {
    const updated = [...policies];
    updated[activeIdx] = { ...updated[activeIdx], [field]: value };
    // Reset linked fund when owner or tax env changes
    if (field === "pol_owner" || field === "pol_tax_env") updated[activeIdx].linked_fund_id = "";
    setPolicies(updated);

    // Debounced API update
    const policyData = updated[activeIdx];
    if (policyData.id) {
      if (updateTimerRef.current) clearTimeout(updateTimerRef.current);
      updateTimerRef.current = setTimeout(async () => {
        try {
          await insuranceApi.update(policyData.id, policyData);
        } catch (err) {
          console.error('[InsurancePoliciesForm] Failed to update policy:', err);
        }
      }, 1500);
    }
  };

  const pol = policies[activeIdx] || {};
  const config = INSURANCE_TYPE_CONFIG[pol.pol_type] || { sumInsured: [], premium: [], showTaxEnv: false, showIPFields: false };
  const ownerFunds = getOwnerFunds(pol.pol_owner);
  const showFundDropdown = config.showTaxEnv && pol.pol_tax_env === "super";

  // Section header helper
  const sectionHeader = (icon, title, borderColor, bgColor, textColor) => (
    <div style={{ padding: "10px 16px", borderLeft: `4px solid ${borderColor}`, background: bgColor, marginBottom: 12, borderRadius: "0 8px 8px 0" }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: textColor, display: "flex", alignItems: "center", gap: 8 }}>
        <span>{icon}</span> {title}
      </div>
    </div>
  );

  // Sum insured / premium input helper
  const moneyField = (label, value, onChange) => (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 4 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <span style={{ color: "var(--ps-text-subtle)", fontSize: 13 }}>$</span>
        <input type="number" value={value || ""} onChange={e => onChange(e.target.value)} step="1000" min="0"
          style={{ flex: 1, padding: "6px 8px", border: "1px solid var(--ps-border-mid)", borderRadius: 6, fontSize: 12, background: "var(--ps-surface)" }} />
      </div>
    </div>
  );

  if (policies.length === 0) {
    return (
      <div style={{ border: "2px dashed var(--ps-border)", borderRadius: 12, padding: "40px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>🛡️</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ps-text-primary)", marginBottom: 4 }}>No insurance policies added yet</div>
        <div style={{ fontSize: 12, color: "var(--ps-text-subtle)", marginBottom: 16 }}>Add details about life, TPD, trauma, income protection coverage.</div>
        <button onClick={addPolicy} style={{ padding: "8px 20px", borderRadius: 8, border: "2px solid #7C3AED", background: "var(--ps-surface)", color: "#7C3AED", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>+ Add First Policy</button>
      </div>
    );
  }

  return (
    <div>
      {/* Pill navigation + add/remove */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {policies.map((p, idx) => (
            <button key={idx} onClick={() => setActiveIdx(idx)} style={{
              padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
              border: activeIdx === idx ? "1px solid #7C3AED" : "1px solid var(--ps-border)",
              background: activeIdx === idx ? "var(--ps-surface-purple)" : "var(--ps-surface-alt)",
              color: activeIdx === idx ? "#6D28D9" : "var(--ps-text-muted)",
            }}>
              {p.pol_name || `Policy ${idx + 1}`}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={addPolicy} style={{ padding: "6px 14px", borderRadius: 8, border: "1px dashed var(--ps-border-mid)", background: "var(--ps-surface)", fontSize: 12, fontWeight: 600, color: "var(--ps-text-muted)", cursor: "pointer" }}>+ Add</button>
          <button onClick={removePolicy} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid var(--ps-ring-red)", background: "var(--ps-surface-red)", fontSize: 11, fontWeight: 600, color: "var(--ps-red)", cursor: "pointer" }}>Remove</button>
        </div>
      </div>

      {/* ── Policy Details ── */}
      <div style={{ border: "1px solid var(--ps-border)", borderRadius: 12, background: "var(--ps-surface)", overflow: "hidden", marginBottom: 12 }}>
        {sectionHeader("🛡️", "Policy Details", "#7C3AED", "var(--ps-surface-purple)", "#6D28D9")}
        <div style={{ padding: "0 16px 16px" }}>
          <div style={ffRowStyle}>
            <FFInput label="Policy name" value={pol.pol_name} onChange={v => updatePolicy("pol_name", v)} placeholder="e.g. Life Insurance - XYZ Provider" />
            <FFSelect label="Policy type" value={pol.pol_type} onChange={v => updatePolicy("pol_type", v)} options={INSURANCE_POLICY_TYPES} />
          </div>
          <div style={ffRowStyle}>
            <FFSelect label="Policy owner" value={pol.pol_owner} onChange={v => updatePolicy("pol_owner", v)} options={ownerOptions} />
            <FFSelect label="Life insured" value={pol.pol_insured} onChange={v => updatePolicy("pol_insured", v)} options={ownerOptions} />
          </div>

          {/* Tax environment (conditional) */}
          {config.showTaxEnv && (
            <div style={ffRowStyle}>
              <FFSelect label="Tax environment" value={pol.pol_tax_env} onChange={v => updatePolicy("pol_tax_env", v)}
                options={[{ value: "super", label: "Inside Superannuation" }, { value: "non-super", label: "Outside Superannuation" }]} />
              {showFundDropdown && (
                pol.pol_owner ? (
                  ownerFunds.length > 0 ? (
                    <FFSelect label="Which fund?" value={pol.linked_fund_id} onChange={v => updatePolicy("linked_fund_id", v)}
                      options={ownerFunds.map(f => ({ value: f.value, label: `${f.label} (${f.type})` }))} />
                  ) : (
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 4 }}>Which fund?</div>
                      <div style={{ padding: "6px 8px", border: "1px solid #F59E0B", background: "var(--ps-surface-amber)", borderRadius: 6, fontSize: 11, color: "var(--ps-badge-amber)" }}>
                        No super funds found for {getOwnerName(pol.pol_owner)}. Add funds in Superannuation or SMSF first.
                      </div>
                    </div>
                  )
                ) : (
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 4 }}>Which fund?</div>
                    <div style={{ padding: "6px 8px", border: "1px solid var(--ps-border)", background: "var(--ps-surface-alt)", borderRadius: 6, fontSize: 11, color: "var(--ps-text-subtle)" }}>Select a policy owner first</div>
                  </div>
                )
              )}
            </div>
          )}

          <div style={ffRowStyle}>
            <FFInput label="Insurer" value={pol.pol_insurer} onChange={v => updatePolicy("pol_insurer", v)} />
            <FFInput label="Policy number" value={pol.pol_number} onChange={v => updatePolicy("pol_number", v)} />
          </div>

          {/* IP-specific fields */}
          {config.showIPFields && (
            <div style={ffRowStyle}>
              <FFSelect label="Waiting period" value={pol.pol_waiting} onChange={v => updatePolicy("pol_waiting", v)} options={IP_WAITING_OPTIONS} />
              <FFSelect label="Benefit period" value={pol.pol_benefit_period} onChange={v => updatePolicy("pol_benefit_period", v)} options={IP_BENEFIT_PERIOD_OPTIONS} />
            </div>
          )}
        </div>
      </div>

      {/* ── Sum Insured ── */}
      {config.sumInsured.length > 0 && (
        <div style={{ border: "1px solid var(--ps-border)", borderRadius: 12, background: "var(--ps-surface)", overflow: "hidden", marginBottom: 12 }}>
          {sectionHeader("💰", "Sum Insured", "#059669", "var(--ps-surface-emerald)", "#065F46")}
          <div style={{ padding: "0 16px 16px" }}>
            {config.sumInsured.includes("life") && moneyField("Sum insured — Life", pol.sum_insured_life, v => updatePolicy("sum_insured_life", v))}
            {config.sumInsured.includes("tpd") && moneyField("Sum insured — TPD", pol.sum_insured_tpd, v => updatePolicy("sum_insured_tpd", v))}
            {config.sumInsured.includes("trauma") && moneyField("Sum insured — Trauma", pol.sum_insured_trauma, v => updatePolicy("sum_insured_trauma", v))}
            {config.sumInsured.includes("ip") && moneyField("Sum insured — Income Protection", pol.sum_insured_ip, v => updatePolicy("sum_insured_ip", v))}
            {config.sumInsured.includes("ip2") && moneyField("Sum insured — IP (2nd component)", pol.sum_insured_ip2, v => updatePolicy("sum_insured_ip2", v))}
          </div>
        </div>
      )}

      {/* ── Premium Details ── */}
      {config.premium.length > 0 && (
        <div style={{ border: "1px solid var(--ps-border)", borderRadius: 12, background: "var(--ps-surface)", overflow: "hidden", marginBottom: 12 }}>
          {sectionHeader("💵", "Premium Details", "#D97706", "var(--ps-surface-amber)", "var(--ps-badge-amber)")}
          <div style={{ padding: "0 16px 16px" }}>
            {config.premium.includes("life") && moneyField("Premium — Life", pol.premium_life, v => updatePolicy("premium_life", v))}
            {config.premium.includes("tpd") && moneyField("Premium — TPD", pol.premium_tpd, v => updatePolicy("premium_tpd", v))}
            {config.premium.includes("trauma") && moneyField("Premium — Trauma", pol.premium_trauma, v => updatePolicy("premium_trauma", v))}
            {config.premium.includes("ip") && moneyField("Premium — Income Protection", pol.premium_ip, v => updatePolicy("premium_ip", v))}
            {config.premium.includes("ip2") && moneyField("Premium — IP (2nd component)", pol.premium_ip2, v => updatePolicy("premium_ip2", v))}
            <div style={ffRowStyle}>
              <FFSelect label="Premium frequency" value={pol.pol_freq} onChange={v => updatePolicy("pol_freq", v)} options={PREMIUM_FREQ_OPTIONS} />
              <FFSelect label="Premium structure" value={pol.pol_structure} onChange={v => updatePolicy("pol_structure", v)} options={PREMIUM_STRUCTURE_OPTIONS} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ===========================================================================
// FACT FIND — Income Form (aligned to Base44)
// ===========================================================================

export function IncomeForm({ factFind, updateFF }) {
  const [activePerson, setActivePerson] = useState("client1");
  const [adjDetailIdx, setAdjDetailIdx] = useState(null);

  const hasClients = factFind.client1 !== null || factFind.client2 !== null;
  const clientOptions = [];
  if (factFind.client1) clientOptions.push({ value: "client1", label: ((factFind.client1?.first_name || "") + " " + (factFind.client1?.last_name || "")).trim() || "Client 1" });
  if (factFind.client2) clientOptions.push({ value: "client2", label: ((factFind.client2?.first_name || "") + " " + (factFind.client2?.last_name || "")).trim() || "Client 2" });

  const clientName = (id) => {
    const found = clientOptions.find(c => c.value === id);
    return found ? found.label : id || "—";
  };

  const incomeData = factFind.income || {};
  const personIncome = incomeData[activePerson] || {};
  const personAdjustments = personIncome.adjustments || [];

  const updatePersonIncome = (field, value) => {
    const current = factFind.income || {};
    const personData = current[activePerson] || {};
    updateFF("income", { ...current, [activePerson]: { ...personData, [field]: value } });
  };

  const updatePersonAdjustments = (newAdjs) => {
    const current = factFind.income || {};
    const personData = current[activePerson] || {};
    updateFF("income", { ...current, [activePerson]: { ...personData, adjustments: newAdjs } });
  };

  const addIncomeAdj = () => {
    updatePersonAdjustments([...personAdjustments, { adj_type: "", adj_amount: "", adj_start: "", adj_end: "", adj_notes: "" }]);
    setAdjDetailIdx(personAdjustments.length);
  };
  const removeIncomeAdj = (idx) => { updatePersonAdjustments(personAdjustments.filter((_, i) => i !== idx)); setAdjDetailIdx(null); };
  const updateIncomeAdj = (idx, field, value) => {
    updatePersonAdjustments(personAdjustments.map((a, i) => i === idx ? { ...a, [field]: value } : a));
  };

  const adjTypeLabel = (v) => {
    const map = { "1": "Salary", "2": "Fringe benefits", "3": "Non taxable income", "4": "Bonus income", "5": "Inheritance/windfall", "1000": "Business turnover" };
    return map[v] || v || "—";
  };

  if (!hasClients) {
    return (
      <div style={{ padding: "40px 24px", borderRadius: 12, border: "2px dashed var(--ps-border)", textAlign: "center" }}>
        <div style={{ fontSize: 28, marginBottom: 10 }}>👤</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 4 }}>No principals added yet</div>
        <div style={{ fontSize: 12, color: "var(--ps-text-subtle)" }}>Add at least one client under Principals first</div>
      </div>
    );
  }

  // Person toggle
  const personToggle = (
    <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
      {clientOptions.map(c => {
        const isActive = activePerson === c.value;
        return (
          <button key={c.value} onClick={() => { setActivePerson(c.value); setAdjDetailIdx(null); }} style={{
            padding: "6px 14px", borderRadius: 20, border: isActive ? "1px solid #3B82F6" : "1px solid var(--ps-border)",
            background: isActive ? "var(--ps-surface-blue)" : "var(--ps-surface)", cursor: "pointer",
            fontSize: 12, fontWeight: isActive ? 600 : 400,
            color: isActive ? "var(--ps-badge-blue)" : "var(--ps-text-muted)",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.value === "client1" ? "#3B82F6" : "#8B5CF6" }} />
            {c.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <div>
      {personToggle}

      {/* Income fields */}
      <div style={{ border: "1px solid var(--ps-border)", borderRadius: 12, background: "var(--ps-surface)", overflow: "hidden", marginBottom: 16 }}>
        <div style={{ padding: "12px 18px", background: "#05966908", borderBottom: "1px solid var(--ps-border)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#059669", color: "var(--ps-surface)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>💵</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ps-text-primary)" }}>Income — {clientName(activePerson)}</div>
        </div>
        <div style={{ padding: 18 }}>
          <div style={ffRowStyle}>
            <FFInput label="Gross Salary" value={personIncome.i_gross} onChange={v => updatePersonIncome("i_gross", v)} type="number" prefix="$" placeholder="Annual gross salary" />
            <FFRadioRow label="Superannuation Included?" value={personIncome.i_super_inc} onChange={v => updatePersonIncome("i_super_inc", v)}
              options={[{ value: "1", label: "Include super" }, { value: "2", label: "Exclude super" }]} />
          </div>
          <div style={ffRowStyle}>
            <FFRadioRow label="Receive Fringe Benefits?" value={personIncome.i_fbt} onChange={v => updatePersonIncome("i_fbt", v)}
              options={[{ value: "1", label: "Yes" }, { value: "2", label: "No" }]} />
            <FFInput label="Value of Fringe Benefits" value={personIncome.i_fbt_value} onChange={v => updatePersonIncome("i_fbt_value", v)} type="number" prefix="$" />
          </div>
          <div style={ffRowStyle}>
            <FFInput label="Expected Bonus Income" value={personIncome.i_bonus} onChange={v => updatePersonIncome("i_bonus", v)} type="number" prefix="$" />
            <FFInput label="Expected Annual Increase" value={personIncome.i_increase} onChange={v => updatePersonIncome("i_increase", v)} placeholder="e.g. 3%" />
          </div>
          <div style={ffRowStyle}>
            <FFRadioRow label="Any Non-Taxable Salary?" value={personIncome.i_nontax} onChange={v => updatePersonIncome("i_nontax", v)}
              options={[{ value: "1", label: "Yes" }, { value: "2", label: "No" }]} />
            <FFSelect label="Salary Paid" value={personIncome.i_pay_freq || "26"} onChange={v => updatePersonIncome("i_pay_freq", v)}
              options={[{ value: "52", label: "Weekly" }, { value: "26", label: "Fortnightly" }, { value: "12", label: "Monthly" }]} />
          </div>
        </div>
      </div>



      {/* Income adjustments */}
      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ps-text-secondary)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
        <span>📊</span> Income Adjustments — {clientName(activePerson)}
        <span style={{ background: "var(--ps-border)", color: "var(--ps-text-muted)", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 10 }}>{personAdjustments.length}</span>
      </div>

      {adjDetailIdx === null ? (
        <div>
          {personAdjustments.length > 0 && (
            <div style={{ border: "1px solid var(--ps-border)", borderRadius: 10, overflow: "hidden", marginBottom: 12, background: "var(--ps-surface)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead><tr style={{ background: "var(--ps-surface-alt)", borderBottom: "1px solid var(--ps-border)" }}>
                  <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: "var(--ps-text-muted)", fontSize: 11 }}>Type</th>
                  <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, color: "var(--ps-text-muted)", fontSize: 11 }}>Amount</th>
                  <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: "var(--ps-text-muted)", fontSize: 11 }}>Period</th>
                  <th style={{ padding: "8px 12px", width: 100 }}></th>
                </tr></thead>
                <tbody>
                  {personAdjustments.map((a, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid var(--ps-border-light)", cursor: "pointer" }} onClick={() => setAdjDetailIdx(idx)}>
                      <td style={{ padding: "8px 12px", fontWeight: 600, color: "var(--ps-text-primary)" }}>{adjTypeLabel(a.adj_type)}</td>
                      <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, color: "var(--ps-text-primary)" }}>{a.adj_amount ? `$${parseFloat(a.adj_amount).toLocaleString()}` : "—"}</td>
                      <td style={{ padding: "8px 12px", color: "var(--ps-text-muted)" }}>{a.adj_start || "—"}{a.adj_end ? ` – ${a.adj_end}` : ""}</td>
                      <td style={{ padding: "8px 12px", textAlign: "right" }}>
                        <span style={{ fontSize: 11, color: "#3B82F6", fontWeight: 500, marginRight: 8 }}>Edit</span>
                        <button onClick={(e) => { e.stopPropagation(); removeIncomeAdj(idx); }} style={{ fontSize: 10, color: "var(--ps-red)", cursor: "pointer", background: "none", border: "none", fontWeight: 500 }}>Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <button onClick={addIncomeAdj} style={{ width: "100%", padding: personAdjustments.length === 0 ? "30px" : "14px", borderRadius: 12, border: "2px dashed #6EE7B7", background: "var(--ps-surface-emerald)", cursor: "pointer", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "var(--ps-green)", flexDirection: personAdjustments.length === 0 ? "column" : "row" }}>
            {personAdjustments.length === 0 && <span style={{ fontSize: 24, marginBottom: 4 }}>📊</span>}
            <span style={{ fontSize: 16 }}>+</span> {personAdjustments.length === 0 ? "Add First Income Adjustment" : "Add Adjustment"}
          </button>
        </div>
      ) : personAdjustments[adjDetailIdx] && (() => {
        const a = personAdjustments[adjDetailIdx]; const idx = adjDetailIdx;
        return (
          <div style={{ border: "1px solid var(--ps-border)", borderRadius: 12, background: "var(--ps-surface)", overflow: "hidden", marginBottom: 16 }}>
            <div style={{ padding: "12px 18px", background: "#05966908", borderBottom: "1px solid var(--ps-border)", display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={() => setAdjDetailIdx(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "var(--ps-text-muted)" }}>←</button>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ps-text-primary)" }}>Income Adjustment {idx + 1}</div>
            </div>
            <div style={{ padding: 18 }}>
              <div style={ffRowStyle}>
                <FFSelect label="Adjustment Type" value={a.adj_type} onChange={v => updateIncomeAdj(idx, "adj_type", v)}
                  options={[{ value: "", label: "Select..." }, { value: "1", label: "Salary" }, { value: "2", label: "Fringe benefits" }, { value: "3", label: "Non taxable income" }, { value: "4", label: "Bonus income" }, { value: "5", label: "Inheritance/windfall" }, { value: "1000", label: "Business turnover" }]} />
                <FFInput label="Amount" value={a.adj_amount} onChange={v => updateIncomeAdj(idx, "adj_amount", v)} type="number" prefix="$" />
              </div>
              <div style={ffRowStyle}>
                <FFInput label="Start Year" value={a.adj_start} onChange={v => updateIncomeAdj(idx, "adj_start", v)} type="number" placeholder="YYYY" />
                <FFInput label="End Year" value={a.adj_end} onChange={v => updateIncomeAdj(idx, "adj_end", v)} type="number" placeholder="YYYY" />
              </div>
              <div style={ffRowStyle}>
                <FFInput label="Notes" value={a.adj_notes} onChange={v => updateIncomeAdj(idx, "adj_notes", v)} placeholder="Additional details..." />
                <div />
              </div>
            </div>
          </div>
        );
      })()}

      {/* Tax Losses */}
      <div style={{ border: "1px solid var(--ps-border)", borderRadius: 12, background: "var(--ps-surface)", overflow: "hidden", marginBottom: 16 }}>
        <div style={{ padding: "12px 18px", background: "#DC262608", borderBottom: "1px solid var(--ps-border)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#DC2626", color: "var(--ps-surface)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>📉</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ps-text-primary)" }}>Tax Losses — {clientName(activePerson)}</div>
        </div>
        <div style={{ padding: 18 }}>
          <div style={ffRowStyle}>
            <FFInput label="Existing CGT Losses" value={personIncome.i_cgt_losses || ""} onChange={v => updatePersonIncome("i_cgt_losses", v)} type="number" prefix="$" placeholder="Prior year net capital losses" />
            <FFInput label="Carry-Forward Revenue Losses" value={personIncome.i_revenue_losses || ""} onChange={v => updatePersonIncome("i_revenue_losses", v)} type="number" prefix="$" placeholder="Prior year revenue losses" />
          </div>
        </div>
      </div>
    </div>
  );
}


// ===========================================================================
// FACT FIND — Expenses Form (aligned to Base44)
// ===========================================================================

export function ExpensesForm({ factFind, updateFF, clientId }) {
  const [expAdjDetailIdx, setExpAdjDetailIdx] = useState(null);
  const expensesLoadedRef = useRef(false);
  const upsertTimerRef = useRef(null);
  const adjUpdateTimerRef = useRef(null);

  const expenseData = factFind.expenses || {};
  const expenseAdjustments = expenseData.adjustments || [];

  // Load expenses from API on mount
  useEffect(() => {
    if (clientId && !expensesLoadedRef.current) {
      expensesLoadedRef.current = true;
      expensesApi.getByClientId(clientId).then(record => {
        if (record) {
          updateFF("expenses", record);
        }
      }).catch(err => console.error('[ExpensesForm] Failed to load expenses:', err));
    }
  }, [clientId, updateFF]);

  const updateExpenseField = (field, value) => {
    const current = factFind.expenses || {};
    const updated = { ...current, [field]: value };
    updateFF("expenses", updated);

    // Debounced upsert to API
    if (clientId) {
      if (upsertTimerRef.current) clearTimeout(upsertTimerRef.current);
      upsertTimerRef.current = setTimeout(() => {
        expensesApi.upsert(clientId, updated).then(result => {
          if (result && result.id && !updated.id) {
            updateFF("expenses", { ...updated, id: result.id });
          }
        }).catch(err => console.error('[ExpensesForm] Failed to upsert expense:', err));
      }, 1500);
    }
  };

  const updateExpenseAdjustments = (newAdjs) => {
    const current = factFind.expenses || {};
    updateFF("expenses", { ...current, adjustments: newAdjs });
  };

  const addExpenseAdj = () => {
    const newAdj = { e_adj_type: "", e_adj_amount: "", e_adj_start: "", e_adj_end: "", e_adj_notes: "" };
    const expId = expenseData.id;
    if (expId && clientId) {
      expensesApi.addAdjustment(expId, newAdj).then(savedAdj => {
        const current = factFind.expenses || {};
        const currentAdjs = current.adjustments || [];
        updateFF("expenses", { ...current, adjustments: [...currentAdjs, savedAdj] });
        setExpAdjDetailIdx(currentAdjs.length);
      }).catch(err => console.error('[ExpensesForm] Failed to add adjustment:', err));
    } else {
      updateExpenseAdjustments([...expenseAdjustments, newAdj]);
      setExpAdjDetailIdx(expenseAdjustments.length);
    }
  };

  const removeExpenseAdj = (idx) => {
    const adj = expenseAdjustments[idx];
    const expId = expenseData.id;
    if (expId && adj && adj.id && clientId) {
      expensesApi.removeAdjustment(expId, adj.id).then(() => {
        updateExpenseAdjustments(expenseAdjustments.filter((_, i) => i !== idx));
        setExpAdjDetailIdx(null);
      }).catch(err => console.error('[ExpensesForm] Failed to remove adjustment:', err));
    } else {
      updateExpenseAdjustments(expenseAdjustments.filter((_, i) => i !== idx));
      setExpAdjDetailIdx(null);
    }
  };

  const updateExpenseAdj = (idx, field, value) => {
    const updated = expenseAdjustments.map((a, i) => i === idx ? { ...a, [field]: value } : a);
    updateExpenseAdjustments(updated);

    // Debounced API update for the specific adjustment
    const adj = updated[idx];
    const expId = expenseData.id;
    if (expId && adj && adj.id && clientId) {
      if (adjUpdateTimerRef.current) clearTimeout(adjUpdateTimerRef.current);
      adjUpdateTimerRef.current = setTimeout(() => {
        expensesApi.updateAdjustment(expId, adj.id, adj)
          .catch(err => console.error('[ExpensesForm] Failed to update adjustment:', err));
      }, 1500);
    }
  };

  const expAdjTypeLabel = (v) => {
    const map = { "1": "Home & Contents", "2": "Personal & Medical", "3": "Transport & Auto", "4": "Entertainment", "5": "Insurance", "6": "Debt servicing" };
    return map[v] || v || "—";
  };

  return (
    <div>
      {/* Expense fields */}
      <div style={{ border: "1px solid var(--ps-border)", borderRadius: 12, background: "var(--ps-surface)", overflow: "hidden", marginBottom: 16 }}>
        <div style={{ padding: "12px 18px", background: "#DC262608", borderBottom: "1px solid var(--ps-border)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#DC2626", color: "var(--ps-surface)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🧾</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ps-text-primary)" }}>Household Expenses</div>
        </div>
        <div style={{ padding: 18 }}>
          <div style={ffRowStyle}>
            <FFInput label="Annual Savings" value={expenseData.e_save} onChange={v => updateExpenseField("e_save", v)} type="number" prefix="$" placeholder="How much do you save per annum?" />
            <FFInput label="Estimated Discretionary Spending" value={expenseData.e_disc} onChange={v => updateExpenseField("e_disc", v)} type="number" prefix="$" />
          </div>
          <div style={ffRowStyle}>
            <FFSelect label="Spending Frequency" value={expenseData.e_freq} onChange={v => updateExpenseField("e_freq", v)}
              options={[{ value: "", label: "Select..." }, { value: "1", label: "Weekly" }, { value: "2", label: "Fortnightly" }, { value: "3", label: "Monthly" }, { value: "4", label: "Quarterly" }, { value: "5", label: "Annual" }]} />
            <div />
          </div>
          <div style={{ borderTop: "1px solid var(--ps-border-light)", marginTop: 12, paddingTop: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-muted)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <span>🏠</span> Rent Paid (if not living in own home)
            </div>
            <div style={ffRowStyle}>
              <FFInput label="Rent Paid" value={expenseData.rental_cost} onChange={v => updateExpenseField("rental_cost", v)} type="number" prefix="$" placeholder="e.g. 450" />
              <FFSelect label="Frequency" value={expenseData.rental_freq} onChange={v => updateExpenseField("rental_freq", v)}
                options={[{ value: "52", label: "Weekly" }, { value: "26", label: "Fortnightly" }, { value: "12", label: "Monthly" }]} />
            </div>
          </div>
        </div>
      </div>

      {/* Expense adjustments */}
      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ps-text-secondary)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
        <span>💰</span> Expense Adjustments
        <span style={{ background: "var(--ps-border)", color: "var(--ps-text-muted)", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 10 }}>{expenseAdjustments.length}</span>
      </div>

      {expAdjDetailIdx === null ? (
        <div>
          {expenseAdjustments.length > 0 && (
            <div style={{ border: "1px solid var(--ps-border)", borderRadius: 10, overflow: "hidden", marginBottom: 12, background: "var(--ps-surface)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead><tr style={{ background: "var(--ps-surface-alt)", borderBottom: "1px solid var(--ps-border)" }}>
                  <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: "var(--ps-text-muted)", fontSize: 11 }}>Type</th>
                  <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, color: "var(--ps-text-muted)", fontSize: 11 }}>Amount</th>
                  <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: "var(--ps-text-muted)", fontSize: 11 }}>Period</th>
                  <th style={{ padding: "8px 12px", width: 100 }}></th>
                </tr></thead>
                <tbody>
                  {expenseAdjustments.map((a, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid var(--ps-border-light)", cursor: "pointer" }} onClick={() => setExpAdjDetailIdx(idx)}>
                      <td style={{ padding: "8px 12px", fontWeight: 600, color: "var(--ps-text-primary)" }}>{expAdjTypeLabel(a.e_adj_type)}</td>
                      <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, color: "var(--ps-text-primary)" }}>{a.e_adj_amount ? `$${parseFloat(a.e_adj_amount).toLocaleString()}` : "—"}</td>
                      <td style={{ padding: "8px 12px", color: "var(--ps-text-muted)" }}>{a.e_adj_start || "—"}{a.e_adj_end ? ` – ${a.e_adj_end}` : ""}</td>
                      <td style={{ padding: "8px 12px", textAlign: "right" }}>
                        <span style={{ fontSize: 11, color: "#3B82F6", fontWeight: 500, marginRight: 8 }}>Edit</span>
                        <button onClick={(e) => { e.stopPropagation(); removeExpenseAdj(idx); }} style={{ fontSize: 10, color: "var(--ps-red)", cursor: "pointer", background: "none", border: "none", fontWeight: 500 }}>Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <button onClick={addExpenseAdj} style={{ width: "100%", padding: expenseAdjustments.length === 0 ? "30px" : "14px", borderRadius: 12, border: "2px dashed #FCA5A5", background: "var(--ps-surface-red)", cursor: "pointer", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "var(--ps-red)", flexDirection: expenseAdjustments.length === 0 ? "column" : "row" }}>
            {expenseAdjustments.length === 0 && <span style={{ fontSize: 24, marginBottom: 4 }}>💰</span>}
            <span style={{ fontSize: 16 }}>+</span> {expenseAdjustments.length === 0 ? "Add First Expense Adjustment" : "Add Adjustment"}
          </button>
        </div>
      ) : expenseAdjustments[expAdjDetailIdx] && (() => {
        const a = expenseAdjustments[expAdjDetailIdx]; const idx = expAdjDetailIdx;
        return (
          <div style={{ border: "1px solid var(--ps-border)", borderRadius: 12, background: "var(--ps-surface)", overflow: "hidden", marginBottom: 16 }}>
            <div style={{ padding: "12px 18px", background: "#DC262608", borderBottom: "1px solid var(--ps-border)", display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={() => setExpAdjDetailIdx(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "var(--ps-text-muted)" }}>←</button>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ps-text-primary)" }}>Expense Adjustment {idx + 1}</div>
            </div>
            <div style={{ padding: 18 }}>
              <div style={ffRowStyle}>
                <FFSelect label="Adjustment Type" value={a.e_adj_type} onChange={v => updateExpenseAdj(idx, "e_adj_type", v)}
                  options={[{ value: "", label: "Select..." }, { value: "1", label: "Home & Contents" }, { value: "2", label: "Personal & Medical" }, { value: "3", label: "Transport & Auto" }, { value: "4", label: "Entertainment" }, { value: "5", label: "Insurance" }, { value: "6", label: "Debt servicing" }]} />
                <FFInput label="Amount" value={a.e_adj_amount} onChange={v => updateExpenseAdj(idx, "e_adj_amount", v)} type="number" prefix="$" />
              </div>
              <div style={ffRowStyle}>
                <FFInput label="Start Year" value={a.e_adj_start} onChange={v => updateExpenseAdj(idx, "e_adj_start", v)} type="number" placeholder="YYYY" />
                <FFInput label="End Year" value={a.e_adj_end} onChange={v => updateExpenseAdj(idx, "e_adj_end", v)} type="number" placeholder="YYYY" />
              </div>
              <div style={ffRowStyle}>
                <FFInput label="Notes" value={a.e_adj_notes} onChange={v => updateExpenseAdj(idx, "e_adj_notes", v)} placeholder="Additional details..." />
                <div />
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
// ===========================================================================
// FACT FIND — Goals, Objectives & Risk Profile Form (Base44-aligned)
// ===========================================================================

const REASONS_GROUPS = [
  { title: "Wealth creation", items: [
    { label: "Portfolio advice", value: "6" },
    { label: "Investment property", value: "4" },
    { label: "Wealth creation strategies", value: "3" },
  ]},
  { title: "Wealth protection", items: [
    { label: "Review insurance needs", value: "7" },
    { label: "Review insurance policies", value: "8" },
  ]},
  { title: "Tax/Cashflow", items: [
    { label: "How to minimise personal income tax", value: "1" },
    { label: "Advice on tax structures", value: "2" },
    { label: "Budgeting advice", value: "3b" },
  ]},
  { title: "Debt management", items: [
    { label: "Debt restructuring", value: "12" },
    { label: "Review debt levels", value: "13" },
    { label: "Borrowing to invest", value: "14" },
    { label: "Borrowing to invest within superannuation", value: "15" },
  ]},
  { title: "Retirement products", items: [
    { label: "Review superannuation products", value: "16" },
    { label: "Self Managed Superannuation Funds (SMSF)", value: "17" },
    { label: "Defined benefit superannuation schemes", value: "18" },
    { label: "Retirement income stream strategies", value: "19" },
  ]},
  { title: "Lifestyle", items: [
    { label: "Minimise child care/nanny costs", value: "20" },
    { label: "Establish retirement timeframe", value: "21" },
    { label: "Review impact of reducing work", value: "22" },
    { label: "Principal residence property purchase", value: "23" },
  ]},
  { title: "Social security / Aged care", items: [
    { label: "Review aged care options", value: "24" },
    { label: "Maximise social security entitlement", value: "25" },
  ]},
];

const PROTECTION_CHECKBOXES = [
  { label: "Provide for your family in the event of your death", field: "ins_death", value: "52" },
  { label: "Protect yourself and your family in the event of Total & Permanent Disablement", field: "ins_tpd", value: "53" },
  { label: "Protect yourself and your family in the event of temporary illness", field: "ins_income", value: "54" },
  { label: "Protect your family against unforseen medical costs arising from a specific illness", field: "ins_trauma", value: "57" },
  { label: "Protect your assets against creditors", field: "ins_creditors", value: "58" },
  { label: "Guarantee that a portion of your assets can't lose money", field: "ins_guarantee", value: "59" },
];

const SUPER_FEATURES = [
  { label: "Access to a low cost product", field: "super_lowcost", value: "1" },
  { label: "Access to a product that offers low cost investment options", field: "super_lowcost_inv", value: "2" },
  { label: "Access to top performing investment managers", field: "super_top_mgr", value: "3" },
  { label: "Access to term deposits", field: "super_term", value: "4" },
  { label: "Access to direct shares - Australian", field: "super_shares_au", value: "7" },
  { label: "Access to direct shares - International", field: "super_shares_int", value: "8" },
  { label: "Access to broad investment menu", field: "super_broad", value: "9" },
  { label: "Access to socially responsible investments", field: "super_sri", value: "10" },
  { label: "Access to model portfolios", field: "super_model", value: "11" },
  { label: "Access to lifecycle investment strategy", field: "super_lifecycle", value: "12" },
  { label: "Automatic rebalancing back to your preferred risk profile", field: "super_rebalance", value: "13" },
  { label: "Able to make tax effective contributions to the product", field: "super_taxeff", value: "14" },
  { label: "Ability to make regular investment switches", field: "super_switches", value: "15" },
  { label: "Up to date portfolio information is available", field: "super_uptodate", value: "16" },
  { label: "Ability to manage tax effectiveness of investment strategy", field: "super_taxmgmt", value: "17" },
  { label: "Access to low cost insurance", field: "super_lowins", value: "18" },
  { label: "Access to insurance features consistent with my requirements", field: "super_insfeatures", value: "19" },
];

const OBJECTIVE_TYPES = [
  { value: "1", label: "Establish An Emergency Fund" },
  { value: "2", label: "Reduce Annual Expenses" },
  { value: "3", label: "Increase Cashflow" },
  { value: "4", label: "Reduce Your Working Hours" },
  { value: "5", label: "Take A Career Break" },
  { value: "6", label: "Send Your Children To Private School" },
  { value: "7", label: "Pay For Childrens University Expenses" },
  { value: "8", label: "Provide For Dependants" },
  { value: "9", label: "Go On A Holiday" },
  { value: "10", label: "Buy A Car" },
  { value: "11", label: "Gift Money To Children/Dependants" },
  { value: "12", label: "Pay For Other School Costs" },
  { value: "13", label: "Allocate Funds For Tutor" },
  { value: "14", label: "Allocate Funds For Other Extracurricular Activities" },
  { value: "15", label: "Help A Child Pay For A House" },
  { value: "16", label: "Return To Work After Children" },
  { value: "17", label: "Reduce Work Hours To Look After Children" },
  { value: "18", label: "Take Parental Leave" },
  { value: "19", label: "Set a wealth target in the future" },
  { value: "20", label: "Reduce Exposure To Volatile Growth Investments" },
  { value: "21", label: "Allocate Funds To Low Risk Interest Bearing Assets" },
  { value: "22", label: "Retain Investment" },
  { value: "23", label: "Put Aside Funds To Help Children Invest" },
  { value: "24", label: "Build A Share Portfolio" },
  { value: "25", label: "Rent Out An Existing Property" },
  { value: "26", label: "Purchase A New Principal Residence" },
  { value: "27", label: "Downsize A Principal Residence" },
  { value: "28", label: "Move Into A New Rental Property" },
  { value: "29", label: "Purchase A Holiday Home" },
  { value: "30", label: "Rent Out Your Holiday Home" },
  { value: "31", label: "Upgrade Your Home" },
  { value: "32", label: "Renovate Home" },
  { value: "33", label: "Purchase An Investment Property" },
  { value: "34", label: "Eliminate Your Credit Card Debts" },
  { value: "35", label: "Eliminate Your Mortgage" },
  { value: "36", label: "Eliminate All Debts" },
  { value: "37", label: "Reduce Investment Debt" },
  { value: "38", label: "Reduce Non Deductible Debt" },
  { value: "39", label: "Establish A Reverse Mortgage" },
  { value: "40", label: "Increase Investment Debt" },
  { value: "41", label: "Consolidate Debt" },
  { value: "42", label: "Increase Contributions To Super" },
  { value: "43", label: "Build Wealth For Your Retirement" },
  { value: "46", label: "Move Into Aged Care" },
  { value: "47", label: "Be Assessed For A Home Care Package" },
  { value: "48", label: "Establish A Granny Flat Interest Property Transfer" },
  { value: "49", label: "Establish A Granny Flat Interest Dollar Value" },
  { value: "50", label: "Bequeath An Amount To Your Estate" },
  { value: "55", label: "Sell An Existing Investment" },
  { value: "56", label: "Sell A Portion Of An Existing Investment" },
  { value: "59", label: "Capital Not At Risk Due To Market Fluctuations" },
  { value: "60", label: "Find A Superannuation Product That Is Suitable For Your Requirements" },
  { value: "61", label: "Maximise Centrelink Entitlements" },
  { value: "62", label: "Consolidate Superannuation Funds" },
  { value: "63", label: "Update Your Will" },
];

const OBJ_PROPERTY_TYPES = ["25", "29", "30", "33"];
const OBJ_DEBT_TYPES = ["34", "35", "36", "37", "38", "39", "40", "41"];
const OBJ_ASSET_TYPES = ["22", "55", "56"];

const OBJ_FREQUENCY_OPTIONS = [
  { value: "1", label: "Weekly" }, { value: "2", label: "Fortnightly" }, { value: "3", label: "Monthly" },
  { value: "4", label: "Quarterly" }, { value: "5", label: "Annual" }, { value: "6", label: "Every 2 years" },
  { value: "7", label: "Every 3 years" }, { value: "8", label: "Every 4 years" }, { value: "9", label: "Every 5 years" },
  { value: "10", label: "Every 7 years" }, { value: "11", label: "Every 10 years" },
];

const IMPORTANCE_OPTIONS = [
  { value: "1", label: "Not important" }, { value: "2", label: "Important" },
  { value: "3", label: "Very important" }, { value: "4", label: "Critical" },
];

const EMPTY_QUICK_PERSON = {
  ret_age: "", ret_importance: "", desired_income: "", income_rank: "",
  estate_amount: "", estate_importance: "", funeral_bond: "", funeral_amount: "", funeral_importance: "",
  ins_death: "", ins_tpd: "", ins_income: "", ins_trauma: "", ins_creditors: "", ins_guarantee: "", protection_importance: "",
  super_lowcost: "", super_lowcost_inv: "", super_top_mgr: "", super_term: "", super_shares_au: "", super_shares_int: "",
  super_broad: "", super_sri: "", super_model: "", super_lifecycle: "", super_rebalance: "", super_taxeff: "",
  super_switches: "", super_uptodate: "", super_taxmgmt: "", super_lowins: "", super_insfeatures: "", super_importance: "",
};

// ===========================================================================
// Risk Profile Questions & Scoring (Base44-aligned)
// ===========================================================================

const RISK_QUESTIONS = [
  { id: "q1", text: "Accessibility of your funds – desired liquidity", subtext: "Based on your stated goals, how long can these funds remain invested before you will need access?",
    options: [{ label: "Less than one year", value: "1" }, { label: "1 – 3 years", value: "2" }, { label: "3 to 5 years", value: "3" }, { label: "More than 5 years", value: "4" }] },
  { id: "q2", text: "Your desired rate of return", subtext: "What annual rate of return do you expect your investments to achieve to meet your goals?",
    options: [{ label: "Less than 5%", value: "1" }, { label: "5% – 10%", value: "2" }, { label: "More than 10%", value: "3" }] },
  { id: "q3", text: "Your attitude to capital risk", subtext: "Which statement best describes how you feel about potential losses on your investments?",
    options: [{ label: "The safety of my capital is most important. I am happy with lower returns to avoid significant losses.", value: "1" }, { label: "I prefer my capital to remain relatively stable, but it must also meet my income needs.", value: "2" }, { label: "I understand values may fluctuate and accept this as the price for potentially higher long-term returns.", value: "3" }, { label: "I am comfortable with a high degree of risk to pursue higher returns.", value: "4" }] },
  { id: "q4", text: "Your concerns about inflation", subtext: "How worried are you that inflation will erode the purchasing power of your savings and investments?",
    options: [{ label: "Not concerned", value: "1" }, { label: "Slightly concerned", value: "2" }, { label: "Moderately concerned", value: "3" }, { label: "Very concerned", value: "4" }, { label: "Highly concerned", value: "5" }] },
  { id: "q5", text: "Your concerns about legislative risk", subtext: "Would you rearrange your affairs to qualify for government benefits or tax advantages, knowing legislation may later change?",
    options: [{ label: "Not if there is any chance I would be worse off.", value: "1" }, { label: "I would consider it only if the chance of being worse off is small.", value: "2" }, { label: "If changes are being considered, I would rearrange things to safeguard my financial position.", value: "3" }, { label: "If I can be better off now, I would rearrange my affairs regardless of potential future changes.", value: "4" }] },
  { id: "q6", text: "Your investment knowledge & experience", subtext: "How familiar are you with investment markets and how different asset classes behave?",
    options: [{ label: "No experience at all.", value: "1" }, { label: "Not very familiar.", value: "2" }, { label: "I understand markets fluctuate and different sectors have different income, growth and tax characteristics. I value diversification.", value: "3" }, { label: "Experienced with all investment sectors and the factors that influence performance.", value: "4" }] },
  { id: "q7", text: "Your concern about volatility", subtext: "What is the maximum fall in portfolio value you would tolerate in any single 12-month period?",
    options: [{ label: "0%", value: "1" }, { label: "1% to 15%", value: "2" }, { label: "16% to 20%", value: "3" }, { label: "More than 20%", value: "4" }] },
  { id: "q8", text: "Your investment preferences – asset allocation", subtext: "Which of the following best describes your preference for growth versus stability?",
    options: [{ label: "I would only select investments that have a low degree of risk.", value: "2" }, { label: "I prefer mostly low-risk investments but am willing to have a small higher-risk component. I accept a negative return roughly once every nine years.", value: "4" }, { label: "I prefer a balanced spread of investments and accept a negative return roughly once every seven years.", value: "6" }, { label: "I prefer a diversified portfolio with an emphasis on higher returns. I accept a negative return roughly once every five years.", value: "8" }, { label: "I prefer higher-risk investments aiming for higher returns and accept a negative return roughly once every three years.", value: "10" }] },
];

const RISK_PROFILE_VALUES = [
  { value: "2301", label: "Cash" }, { value: "2382", label: "Conservative" }, { value: "2383", label: "Moderately Conservative" },
  { value: "2384", label: "Balanced" }, { value: "2385", label: "Growth" }, { value: "2386", label: "High Growth" },
];

const RISK_PROFILE_DISPLAY = { "2301": "Cash Management", "2382": "Conservative", "2383": "Moderately Conservative", "2384": "Balanced", "2385": "Growth", "2386": "High Growth" };

export function scoreToProfile(score) {
  if (score <= 15) return "Cash Management";
  if (score <= 20) return "Conservative";
  if (score <= 25) return "Moderately Conservative";
  if (score <= 30) return "Balanced";
  if (score <= 35) return "Growth";
  return "High Growth";
}

export function GoalsForm({ factFind, updateFF }) {
  const [mainTab, setMainTab] = useState("reasons");
  const [objSubTab, setObjSubTab] = useState("retirement");
  const [activePerson, setActivePerson] = useState({ retirement: "client1", estate: "client1", protection: "client1", products: "client1" });
  const [activeObjIdx, setActiveObjIdx] = useState(null);

  const goalsData = factFind.advice_reason || {};
  const reasons = goalsData.reasons || [];
  const quick = goalsData.quick || { client1: { ...EMPTY_QUICK_PERSON }, client2: { ...EMPTY_QUICK_PERSON } };
  const objectives = goalsData.objectives || [];

  const hasPartner = factFind.client2 !== null;
  const clientName = (id) => {
    if (id === "client1") return ((factFind.client1?.first_name || "") + " " + (factFind.client1?.last_name || "")).trim() || "Client 1";
    if (id === "client2") return ((factFind.client2?.first_name || "") + " " + (factFind.client2?.last_name || "")).trim() || "Client 2";
    return id;
  };

  const setReasons = (newReasons) => updateFF("advice_reason", { ...goalsData, reasons: newReasons });
  const setQuick = (newQuick) => updateFF("advice_reason", { ...goalsData, quick: newQuick });
  const setObjectives = (newObjs) => updateFF("advice_reason", { ...goalsData, objectives: newObjs });

  const toggleReason = (value) => {
    setReasons(reasons.includes(value) ? reasons.filter(v => v !== value) : [...reasons, value]);
  };

  const updateQuickField = (person, field, value) => {
    const updated = { ...quick, [person]: { ...(quick[person] || {}), [field]: value } };
    setQuick(updated);
  };

  const addObjective = () => {
    const newObj = { o_who: [], o_type: "", o_property: "", o_debt: "", o_asset: "", o_start: "", o_end: "", o_freq: "", o_amount: "", o_importance: "", o_why: "" };
    const newObjs = [...objectives, newObj];
    setObjectives(newObjs);
    setActiveObjIdx(newObjs.length - 1);
  };
  const removeObjective = (idx) => {
    setObjectives(objectives.filter((_, i) => i !== idx));
    if (activeObjIdx !== null && activeObjIdx >= idx) setActiveObjIdx(activeObjIdx > 0 ? activeObjIdx - 1 : null);
  };
  const updateObjective = (idx, field, value) => {
    setObjectives(objectives.map((o, i) => i === idx ? { ...o, [field]: value } : o));
  };

  const currentPerson = activePerson[objSubTab] || "client1";
  const personQuick = quick[currentPerson] || {};

  // Pill button style helper
  const pillStyle = (active) => ({
    padding: "6px 16px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "1px solid",
    borderColor: active ? "#3B82F6" : "var(--ps-border)", background: active ? "var(--ps-surface-blue)" : "var(--ps-surface-alt)", color: active ? "#2563EB" : "var(--ps-text-muted)",
    transition: "all 0.15s",
  });

  // Checkbox row helper
  const checkRow = (label, checked, onChange) => (
    <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, cursor: "pointer", background: checked ? "var(--ps-surface-blue)" : "transparent" }}>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ width: 16, height: 16, accentColor: "#3B82F6" }} />
      <span style={{ fontSize: 13, color: "var(--ps-text-body)" }}>{label}</span>
    </label>
  );

  // Person toggle bar
  const personToggle = (subTabKey) => (
    <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
      <button style={pillStyle(activePerson[subTabKey] === "client1")} onClick={() => setActivePerson({ ...activePerson, [subTabKey]: "client1" })}>{clientName("client1")}</button>
      {hasPartner && <button style={pillStyle(activePerson[subTabKey] === "client2")} onClick={() => setActivePerson({ ...activePerson, [subTabKey]: "client2" })}>{clientName("client2")}</button>}
    </div>
  );

  const objSubTabs = [
    { id: "retirement", label: "Retirement", icon: "🎯" },
    { id: "estate", label: "Estate", icon: "🏛️" },
    { id: "protection", label: "Wealth Protection", icon: "🛡️" },
    { id: "products", label: "Financial Products", icon: "💼" },
    { id: "detailed", label: "Detailed Objectives", icon: "📊" },
  ];

  return (
    <div>
      {/* Main tab toggle: Reasons / Objectives */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        <button style={pillStyle(mainTab === "reasons")} onClick={() => setMainTab("reasons")}>📝 Reasons</button>
        <button style={pillStyle(mainTab === "objectives")} onClick={() => setMainTab("objectives")}>🎯 Objectives</button>
      </div>

      {mainTab === "reasons" ? (
        /* ── REASONS TAB ── */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
          {REASONS_GROUPS.map((group, gIdx) => (
            <div key={gIdx} style={{ border: "1px solid var(--ps-border)", borderRadius: 10, background: "var(--ps-surface)", overflow: "hidden" }}>
              <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--ps-border-light)", background: "var(--ps-surface-alt)" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ps-text-primary)" }}>{group.title}</div>
              </div>
              <div style={{ padding: "8px 10px" }}>
                {group.items.map(item => checkRow(item.label, reasons.includes(item.value), () => toggleReason(item.value)))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ── OBJECTIVES TAB ── */
        <div>
          {/* Sub-tab pills */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
            {objSubTabs.map(t => (
              <button key={t.id} style={pillStyle(objSubTab === t.id)} onClick={() => setObjSubTab(t.id)}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* ── Retirement ── */}
          {objSubTab === "retirement" && (
            <div style={{ border: "1px solid var(--ps-border)", borderRadius: 12, background: "var(--ps-surface)", padding: "18px 20px" }}>
              {personToggle("retirement")}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 14 }}>
                <FFInput label="Desired retirement age" value={personQuick.ret_age} onChange={v => updateQuickField(currentPerson, "ret_age", v)} type="number" placeholder="e.g. 65" />
                <FFSelect label="How important is this goal" value={personQuick.ret_importance} onChange={v => updateQuickField(currentPerson, "ret_importance", v)} options={IMPORTANCE_OPTIONS} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <FFInput label="Desired income in retirement" value={personQuick.desired_income} onChange={v => updateQuickField(currentPerson, "desired_income", v)} type="number" prefix="$" step="1000" />
                <FFSelect label="Income importance (Rank)" value={personQuick.income_rank} onChange={v => updateQuickField(currentPerson, "income_rank", v)} options={IMPORTANCE_OPTIONS} />
              </div>
            </div>
          )}

          {/* ── Estate ── */}
          {objSubTab === "estate" && (
            <div style={{ border: "1px solid var(--ps-border)", borderRadius: 12, background: "var(--ps-surface)", padding: 18 }}>
              {personToggle("estate")}
              <div style={ffRowStyle}>
                <FFInput label="How much would you like to bequeath" value={personQuick.estate_amount} onChange={v => updateQuickField(currentPerson, "estate_amount", v)} type="number" prefix="$" step="10000" />
                <FFSelect label="How important is it to meet this" value={personQuick.estate_importance} onChange={v => updateQuickField(currentPerson, "estate_importance", v)} options={IMPORTANCE_OPTIONS} />
              </div>
              <div style={{ padding: "12px 14px", background: "var(--ps-surface-alt)", borderRadius: 8, marginTop: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ps-text-body)" }}>Do you wish to purchase a funeral bond?</span>
                <FFToggle label="" value={personQuick.funeral_bond === "1"} onChange={v => updateQuickField(currentPerson, "funeral_bond", v ? "1" : "")} />
              </div>
              {personQuick.funeral_bond === "1" && (
                <div style={{ ...ffRowStyle, marginTop: 8 }}>
                  <FFInput label="Funeral bond amount" value={personQuick.funeral_amount} onChange={v => updateQuickField(currentPerson, "funeral_amount", v)} type="number" prefix="$" step="1000" />
                  <FFSelect label="How important is achieving this" value={personQuick.funeral_importance} onChange={v => updateQuickField(currentPerson, "funeral_importance", v)} options={IMPORTANCE_OPTIONS} />
                </div>
              )}
            </div>
          )}

          {/* ── Wealth Protection ── */}
          {objSubTab === "protection" && (
            <div style={{ border: "1px solid var(--ps-border)", borderRadius: 12, background: "var(--ps-surface)", padding: 18 }}>
              {personToggle("protection")}
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ps-text-muted)", marginBottom: 8 }}>Specify what insurance you want to protect your family against:</div>
              {PROTECTION_CHECKBOXES.map(item => checkRow(
                item.label,
                personQuick[item.field] === item.value,
                () => updateQuickField(currentPerson, item.field, personQuick[item.field] === item.value ? "" : item.value)
              ))}
              <div style={{ marginTop: 12 }}>
                <FFSelect label="Specify how important providing protection is" value={personQuick.protection_importance} onChange={v => updateQuickField(currentPerson, "protection_importance", v)} options={IMPORTANCE_OPTIONS} />
              </div>
            </div>
          )}

          {/* ── Financial Products ── */}
          {objSubTab === "products" && (
            <div style={{ border: "1px solid var(--ps-border)", borderRadius: 12, background: "var(--ps-surface)", padding: 18 }}>
              {personToggle("products")}
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ps-text-muted)", marginBottom: 8 }}>Select superannuation features that are important:</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                {SUPER_FEATURES.map(item => checkRow(
                  item.label,
                  personQuick[item.field] === item.value,
                  () => updateQuickField(currentPerson, item.field, personQuick[item.field] === item.value ? "" : item.value)
                ))}
              </div>
              <div style={{ marginTop: 12 }}>
                <FFSelect label="How important is it for you to find a suitable superannuation account?" value={personQuick.super_importance} onChange={v => updateQuickField(currentPerson, "super_importance", v)} options={IMPORTANCE_OPTIONS} />
              </div>
            </div>
          )}

          {/* ── Detailed Objectives ── */}
          {objSubTab === "detailed" && (
            <>
              {objectives.length === 0 ? (
                <div style={{ border: "2px dashed var(--ps-border)", borderRadius: 12, padding: "40px 24px", textAlign: "center" }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>🎯</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ps-text-primary)", marginBottom: 4 }}>No objectives added yet</div>
                  <div style={{ fontSize: 12, color: "var(--ps-text-subtle)", marginBottom: 16 }}>Start by adding your first financial objective</div>
                  <button onClick={addObjective} style={{ padding: "8px 20px", borderRadius: 8, border: "2px solid #3B82F6", background: "var(--ps-surface)", color: "#3B82F6", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>+ Add First Objective</button>
                </div>
              ) : (
                <>
                  {/* Summary table */}
                  <div style={{ border: "1px solid var(--ps-border)", borderRadius: 12, background: "var(--ps-surface)", overflow: "hidden", marginBottom: 12 }}>
                    <div style={{ padding: "10px 16px", background: "var(--ps-surface-alt)", borderBottom: "1px solid var(--ps-border)", fontSize: 12, fontWeight: 700, color: "var(--ps-text-primary)" }}>
                      📊 Objectives Summary ({objectives.length})
                    </div>
                    <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: "var(--ps-surface-alt)", borderBottom: "1px solid var(--ps-border)" }}>
                          <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: "var(--ps-text-secondary)" }}>Objective type</th>
                          <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: "var(--ps-text-secondary)" }}>Start</th>
                          <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: "var(--ps-text-secondary)" }}>End</th>
                          <th style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, color: "var(--ps-text-secondary)" }}>Amount</th>
                          <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: "var(--ps-text-secondary)" }}>Importance</th>
                          <th style={{ padding: "8px 12px", textAlign: "center", fontWeight: 600, color: "var(--ps-text-secondary)" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {objectives.map((obj, idx) => (
                          <tr key={idx} onClick={() => setActiveObjIdx(idx)} style={{ cursor: "pointer", background: activeObjIdx === idx ? "var(--ps-surface-blue)" : "var(--ps-surface)", borderBottom: "1px solid var(--ps-border-light)" }}>
                            <td style={{ padding: "8px 12px", fontWeight: 500, color: "var(--ps-text-primary)" }}>{OBJECTIVE_TYPES.find(t => t.value === obj.o_type)?.label || "—"}</td>
                            <td style={{ padding: "8px 12px", color: "var(--ps-text-muted)" }}>{obj.o_start || "—"}</td>
                            <td style={{ padding: "8px 12px", color: "var(--ps-text-muted)" }}>{obj.o_end || "—"}</td>
                            <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, color: "var(--ps-text-primary)" }}>{obj.o_amount ? `$${parseFloat(obj.o_amount).toLocaleString()}` : "—"}</td>
                            <td style={{ padding: "8px 12px", color: "var(--ps-text-muted)" }}>{IMPORTANCE_OPTIONS.find(o => o.value === obj.o_importance)?.label || "—"}</td>
                            <td style={{ padding: "8px 12px", textAlign: "center" }}>
                              <button onClick={(e) => { e.stopPropagation(); removeObjective(idx); }} style={{ padding: "2px 8px", borderRadius: 4, border: "1px solid var(--ps-ring-red)", background: "var(--ps-surface-red)", cursor: "pointer", fontSize: 10, color: "var(--ps-red)", fontWeight: 500 }}>Remove</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Detail editor */}
                  {activeObjIdx !== null && objectives[activeObjIdx] && (() => {
                    const obj = objectives[activeObjIdx];
                    return (
                      <div style={{ border: "1px solid var(--ps-ring-blue)", borderRadius: 12, background: "#F0F7FF", padding: 18, marginBottom: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#3B82F6", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Editing Objective {activeObjIdx + 1}</div>
                        <div style={ffRowStyle}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 4 }}>Who does this objective belong to?</div>
                            <div style={{ display: "flex", gap: 8 }}>
                              <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                                <input type="checkbox" checked={(obj.o_who || []).includes("client1")} onChange={(e) => {
                                  const who = e.target.checked ? [...(obj.o_who || []), "client1"] : (obj.o_who || []).filter(w => w !== "client1");
                                  updateObjective(activeObjIdx, "o_who", who);
                                }} />
                                {clientName("client1")}
                              </label>
                              {hasPartner && (
                                <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                                  <input type="checkbox" checked={(obj.o_who || []).includes("client2")} onChange={(e) => {
                                    const who = e.target.checked ? [...(obj.o_who || []), "client2"] : (obj.o_who || []).filter(w => w !== "client2");
                                    updateObjective(activeObjIdx, "o_who", who);
                                  }} />
                                  {clientName("client2")}
                                </label>
                              )}
                            </div>
                          </div>
                          <FFSelect label="Objective type" value={obj.o_type} onChange={v => updateObjective(activeObjIdx, "o_type", v)} options={OBJECTIVE_TYPES} />
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 8 }}>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 4 }}>Start year</div>
                            <select value={obj.o_start} onChange={e => updateObjective(activeObjIdx, "o_start", e.target.value)} style={{ width: "100%", padding: "6px 8px", border: "1px solid var(--ps-border-mid)", borderRadius: 6, fontSize: 12, background: "var(--ps-surface-input)" }}>
                              <option value="">Select year...</option>
                              {Array.from({ length: 51 }, (_, i) => { const y = new Date().getFullYear() + i; return <option key={y} value={String(y)}>{y}</option>; })}
                            </select>
                          </div>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 4 }}>End year</div>
                            <select value={obj.o_end} onChange={e => updateObjective(activeObjIdx, "o_end", e.target.value)} style={{ width: "100%", padding: "6px 8px", border: "1px solid var(--ps-border-mid)", borderRadius: 6, fontSize: 12, background: "var(--ps-surface-input)" }}>
                              <option value="">Select year...</option>
                              {Array.from({ length: 51 }, (_, i) => { const y = new Date().getFullYear() + i; return <option key={y} value={String(y)}>{y}</option>; })}
                            </select>
                          </div>
                          <FFSelect label="Frequency" value={obj.o_freq} onChange={v => updateObjective(activeObjIdx, "o_freq", v)} options={OBJ_FREQUENCY_OPTIONS} />
                        </div>

                        {OBJ_PROPERTY_TYPES.includes(obj.o_type) && (
                          <div style={{ marginTop: 8 }}>
                            <FFSelect label="Which property is this objective for?" value={obj.o_property} onChange={v => updateObjective(activeObjIdx, "o_property", v)}
                              options={(factFind.assets || []).filter(a => a.a_type === "1" || a.a_type === "18" || a.a_type === "19" || a.a_type === "21").map((a, i) => ({ value: String(i), label: a.a_name || `Property ${i + 1}` }))} />
                          </div>
                        )}
                        {OBJ_DEBT_TYPES.includes(obj.o_type) && (
                          <div style={{ marginTop: 8 }}>
                            <FFSelect label="Which debt is this objective for?" value={obj.o_debt} onChange={v => updateObjective(activeObjIdx, "o_debt", v)}
                              options={(factFind.liabilities || []).map((d, i) => ({ value: String(i), label: d.d_name || `Debt ${i + 1}` }))} />
                          </div>
                        )}
                        {OBJ_ASSET_TYPES.includes(obj.o_type) && (
                          <div style={{ marginTop: 8 }}>
                            <FFSelect label="Which asset is this objective for?" value={obj.o_asset} onChange={v => updateObjective(activeObjIdx, "o_asset", v)}
                              options={(factFind.assets || []).map((a, i) => ({ value: String(i), label: a.a_name || `Asset ${i + 1}` }))} />
                          </div>
                        )}

                        <div style={{ ...ffRowStyle, marginTop: 8 }}>
                          <FFInput label="Amount" value={obj.o_amount} onChange={v => updateObjective(activeObjIdx, "o_amount", v)} type="number" prefix="$" step="1000" />
                          <FFSelect label="Importance" value={obj.o_importance} onChange={v => updateObjective(activeObjIdx, "o_importance", v)} options={IMPORTANCE_OPTIONS} />
                        </div>
                        <div style={{ marginTop: 8 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 4 }}>Why is this objective important to you?</div>
                          <textarea value={obj.o_why} onChange={e => updateObjective(activeObjIdx, "o_why", e.target.value)} rows={3}
                            style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--ps-border-mid)", borderRadius: 6, fontSize: 12, resize: "vertical", background: "var(--ps-surface)" }} />
                        </div>
                      </div>
                    );
                  })()}

                  {/* Add button */}
                  <button onClick={addObjective} style={{ width: "100%", padding: "16px", borderRadius: 12, border: "2px dashed #93C5FD", background: "var(--ps-surface-blue)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "#3B82F6" }}>
                    <span style={{ fontSize: 18 }}>+</span> Add Another Objective
                  </button>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ===========================================================================
// FACT FIND — Risk Profile Form (Base44-aligned)
// ===========================================================================

export function RiskProfileForm({ factFind, updateFF, clientId, loadRiskAndScope }) {
  const riskData = factFind.risk_profile || { client1: { answers: {}, score: 0, profile: "", specifiedProfile: "", adviserComments: "", clientComments: "", adjustedProfile: "", adjustmentReason: "" }, client2: { answers: {}, score: 0, profile: "", specifiedProfile: "", adviserComments: "", clientComments: "", adjustedProfile: "", adjustmentReason: "" }, mode: "", adjustRisk: "no" };
  const [riskPerson, setRiskPerson] = useState("client1");
  const [riskMode, setRiskMode] = useState(riskData.mode || "");
  const [adjustRisk, setAdjustRisk] = useState(riskData.adjustRisk || "no");

  const personData = riskData[riskPerson] || { answers: {}, score: 0, profile: "", specifiedProfile: "", adviserComments: "", clientComments: "", adjustedProfile: "", adjustmentReason: "" };

  // Load risk profiles + scope on mount
  const loadedRef = useRef(false);
  useEffect(() => {
    if (clientId && loadRiskAndScope && !loadedRef.current) {
      loadedRef.current = true;
      loadRiskAndScope(clientId);
    }
  }, [clientId, loadRiskAndScope]);

  // Debounced upsert for risk profile
  const riskDebounceRef = useRef(null);
  const debouncedRiskUpsert = useCallback((person, fullData) => {
    if (!clientId) return;
    if (riskDebounceRef.current) clearTimeout(riskDebounceRef.current);
    riskDebounceRef.current = setTimeout(async () => {
      try {
        const result = await clientRiskProfilesApi.upsert(clientId, person, fullData, fullData.id);
        if (result && result.id && !fullData.id) {
          updateFF("risk_profile", prev => {
            const rd = typeof prev === 'object' ? prev : (factFind.risk_profile || {});
            return { ...rd, [person]: { ...rd[person], id: result.id } };
          });
        }
      } catch (err) {
        console.error('[RiskProfileForm] Failed to upsert risk profile:', err);
      }
    }, 1500);
  }, [clientId, updateFF, factFind.risk_profile]);

  const hasPartner = factFind.client2 !== null;
  const clientName = (id) => {
    if (id === "client1") return ((factFind.client1?.first_name || "") + " " + (factFind.client1?.last_name || "")).trim() || "Client 1";
    if (id === "client2") return ((factFind.client2?.first_name || "") + " " + (factFind.client2?.last_name || "")).trim() || "Client 2";
    return id;
  };

  const saveAll = (newData) => updateFF("risk_profile", newData);

  const updatePersonField = (field, value) => {
    const updated = { ...riskData, [riskPerson]: { ...personData, [field]: value }, mode: riskMode, adjustRisk };
    saveAll(updated);
    debouncedRiskUpsert(riskPerson, { ...personData, [field]: value, mode: riskMode, adjustRisk });
  };
  const updateAnswer = (qId, value) => {
    updatePersonField("answers", { ...personData.answers, [qId]: value });
  };
  const doCalculate = () => {
    let total = 0;
    RISK_QUESTIONS.forEach(q => { const a = personData.answers[q.id]; if (a) total += parseInt(a); });
    const profile = scoreToProfile(total);
    const updated = { ...riskData, [riskPerson]: { ...personData, score: total, profile }, mode: riskMode, adjustRisk };
    saveAll(updated);
    debouncedRiskUpsert(riskPerson, { ...personData, score: total, profile, mode: riskMode, adjustRisk });
  };
  const doReset = () => {
    const resetPerson = { ...personData, answers: {}, score: 0, profile: "" };
    const updated = { ...riskData, [riskPerson]: resetPerson, mode: riskMode, adjustRisk };
    saveAll(updated);
    debouncedRiskUpsert(riskPerson, { ...resetPerson, mode: riskMode, adjustRisk });
  };
  const doSetMode = (m) => {
    setRiskMode(m);
    const updated = { ...riskData, mode: m, adjustRisk };
    saveAll(updated);
    debouncedRiskUpsert(riskPerson, { ...personData, mode: m, adjustRisk });
  };
  const doSetAdjust = (v) => {
    setAdjustRisk(v);
    const updated = { ...riskData, mode: riskMode, adjustRisk: v };
    saveAll(updated);
    debouncedRiskUpsert(riskPerson, { ...personData, mode: riskMode, adjustRisk: v });
  };

  const pillStyle = (active) => ({
    padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none",
    background: active ? "#3B82F6" : "var(--ps-border-light)", color: active ? "var(--ps-surface)" : "var(--ps-text-muted)",
  });

  return (
    <div>
      {/* Intro */}
      <div style={{ border: "1px solid var(--ps-border)", borderRadius: 12, background: "linear-gradient(135deg, #EFF6FF, #EEF2FF)", padding: 18, marginBottom: 12, display: "flex", gap: 12 }}>
        <div style={{ fontSize: 28 }}>🔑</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ps-text-primary)", marginBottom: 4 }}>Risk Profiler — Your attitude to investing</div>
          <div style={{ fontSize: 12, color: "var(--ps-text-secondary)", lineHeight: 1.5 }}>This questionnaire helps estimate tolerance to risk and align it with a suitable investment profile. It should be read alongside your broader goals, cashflow needs and overall financial position.</div>
        </div>
      </div>

      {/* Mode toggle */}
      <div style={{ border: "1px solid var(--ps-border)", borderRadius: 12, background: "var(--ps-surface)", padding: 16, marginBottom: 12, display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ps-text-primary)" }}>Risk profile</span>
        <button style={pillStyle(riskMode === "calculate")} onClick={() => doSetMode("calculate")}>Calculate</button>
        <button style={pillStyle(riskMode === "specify")} onClick={() => doSetMode("specify")}>Specify risk profile</button>
      </div>

      {(riskMode === "calculate" || riskMode === "specify") && (
        <>
          {/* Person toggle + reset */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--ps-surface-alt)", border: "1px solid var(--ps-border)", borderRadius: 10, padding: "10px 14px", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ps-text-primary)" }}>Applies to:</span>
              <button style={pillStyle(riskPerson === "client1")} onClick={() => setRiskPerson("client1")}>{clientName("client1")}</button>
              {hasPartner && <button style={pillStyle(riskPerson === "client2")} onClick={() => setRiskPerson("client2")}>{clientName("client2")}</button>}
            </div>
            {riskMode === "calculate" && (
              <button onClick={doReset} style={{ padding: "4px 12px", borderRadius: 6, border: "1px solid var(--ps-border-mid)", background: "var(--ps-surface)", fontSize: 11, fontWeight: 600, color: "var(--ps-text-muted)", cursor: "pointer" }}>↺ Reset Quiz</button>
            )}
          </div>

          {/* Specify mode */}
          {riskMode === "specify" && (
            <div style={{ border: "1px solid var(--ps-border)", borderRadius: 12, background: "var(--ps-surface)", padding: 16, marginBottom: 12 }}>
              <FFSelect label={`Select risk profile for ${clientName(riskPerson)}`} value={personData.specifiedProfile} onChange={v => updatePersonField("specifiedProfile", v)} options={RISK_PROFILE_VALUES} />
            </div>
          )}

          {/* Calculate mode — questions */}
          {riskMode === "calculate" && (
            <>
              {RISK_QUESTIONS.map((q, qIdx) => (
                <div key={q.id} style={{ border: "1px solid var(--ps-border)", borderRadius: 12, background: "var(--ps-surface)", overflow: "hidden", marginBottom: 10 }}>
                  <div style={{ padding: "12px 16px" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--ps-text-subtle)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Question {qIdx + 1}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ps-text-primary)", marginBottom: 2 }}>{q.text}</div>
                    <div style={{ fontSize: 11, color: "var(--ps-text-muted)", marginBottom: 10 }}>{q.subtext}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {q.options.map(opt => {
                        const selected = personData.answers[q.id] === opt.value;
                        return (
                          <button key={opt.value} onClick={() => updateAnswer(q.id, opt.value)} style={{
                            textAlign: "left", padding: "10px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12, lineHeight: 1.4, transition: "all 0.15s",
                            border: selected ? "2px solid #3B82F6" : "2px solid var(--ps-border)",
                            background: selected ? "var(--ps-surface-blue)" : "var(--ps-surface)",
                            fontWeight: selected ? 600 : 400,
                            color: selected ? "#1E40AF" : "var(--ps-text-body)",
                          }}>
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}

              {/* Calculate button */}
              <div style={{ border: "1px solid var(--ps-border)", borderRadius: 12, background: "var(--ps-surface)", padding: 16, textAlign: "center", marginBottom: 12 }}>
                <button onClick={doCalculate} style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: "#059669", color: "var(--ps-surface)", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                  Calculate risk profile ({clientName(riskPerson)})
                </button>
              </div>
            </>
          )}

          {/* Results */}
          {((riskMode === "calculate" && personData.profile) || (riskMode === "specify" && personData.specifiedProfile)) && (() => {
            const profileName = riskMode === "specify" ? RISK_PROFILE_DISPLAY[personData.specifiedProfile] : personData.profile;
            const allProfiles = ["Cash Management", "Conservative", "Moderately Conservative", "Balanced", "Growth", "High Growth"];
            return (
              <div style={{ border: "1px solid var(--ps-border)", borderRadius: 12, background: "var(--ps-surface)", overflow: "hidden", marginBottom: 12 }}>
                <div style={{ padding: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ps-text-primary)", marginBottom: 12 }}>Risk Profile Result</div>

                  {riskMode === "calculate" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                      <div style={{ background: "var(--ps-surface-alt)", borderRadius: 8, padding: 12, border: "1px solid var(--ps-border)" }}>
                        <div style={{ fontSize: 10, color: "var(--ps-text-subtle)", marginBottom: 2 }}>Risk Score</div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: "#3B82F6" }}>{personData.score}</div>
                      </div>
                      <div style={{ background: "var(--ps-surface-alt)", borderRadius: 8, padding: 12, border: "1px solid var(--ps-border)" }}>
                        <div style={{ fontSize: 10, color: "var(--ps-text-subtle)", marginBottom: 2 }}>Profile</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--ps-text-primary)" }}>{personData.profile}</div>
                      </div>
                    </div>
                  )}

                  {/* Profile pills */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                    {allProfiles.map(p => (
                      <div key={p} style={{
                        padding: "6px 14px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                        border: profileName === p ? "2px solid #3B82F6" : "2px solid var(--ps-border)",
                        background: profileName === p ? "#3B82F6" : "var(--ps-surface-alt)",
                        color: profileName === p ? "var(--ps-surface)" : "var(--ps-text-muted)",
                      }}>{p}</div>
                    ))}
                  </div>

                  {/* Comments & Adjustments */}
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ps-text-primary)", marginBottom: 10, marginTop: 16 }}>Comments & Adjustments</div>
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 4 }}>Adviser comments</div>
                    <textarea value={personData.adviserComments || ""} onChange={e => updatePersonField("adviserComments", e.target.value)} rows={3} placeholder="Enter adviser comments"
                      style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--ps-border-mid)", borderRadius: 6, fontSize: 12, resize: "vertical", background: "var(--ps-surface)" }} />
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 4 }}>Client comments</div>
                    <textarea value={personData.clientComments || ""} onChange={e => updatePersonField("clientComments", e.target.value)} rows={3} placeholder="Enter client comments"
                      style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--ps-border-mid)", borderRadius: 6, fontSize: 12, resize: "vertical", background: "var(--ps-surface)" }} />
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <FFSelect label="Adjust risk profile?" value={adjustRisk} onChange={v => doSetAdjust(v)} options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]} />
                  </div>
                  {adjustRisk === "yes" && (
                    <>
                      <FFSelect label="Select adjusted risk profile" value={personData.adjustedProfile || ""} onChange={v => updatePersonField("adjustedProfile", v)} options={RISK_PROFILE_VALUES} />
                      <div style={{ marginTop: 8 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ps-text-secondary)", marginBottom: 4 }}>Reason for adjustment</div>
                        <textarea value={personData.adjustmentReason || ""} onChange={e => updatePersonField("adjustmentReason", e.target.value)} rows={3} placeholder="Explain why the risk profile is being adjusted"
                          style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--ps-border-mid)", borderRadius: 6, fontSize: 12, resize: "vertical", background: "var(--ps-surface)" }} />
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
}

// ===========================================================================
// ADVICE — Scope of Advice Form (Base44-aligned)
// ===========================================================================

const ADVICE_AREAS = [
  { id: "superannuation", label: "Superannuation" },
  { id: "investments", label: "Investments" },
  { id: "insurance_needs", label: "Insurance — Needs Analysis" },
  { id: "insurance_product_advice", label: "Insurance — Product Advice" },
  { id: "retirement_planning", label: "Retirement Planning" },
  { id: "estate_planning", label: "Estate Planning" },
  { id: "debt_management", label: "Debt Management" },
  { id: "portfolio_review", label: "Portfolio Review" },
];

const SOA_TYPE_OPTIONS = [
  { value: "comprehensive", label: "Comprehensive" },
  { value: "limited", label: "Limited" },
  { value: "scaled", label: "Scaled" },
];

export function ScopeOfAdviceForm({ factFind, updateFF, clientId }) {
  const scope = factFind.advice_request?.scope || {};

  // Debounced upsert for scope of advice
  const scopeDebounceRef = useRef(null);
  const debouncedScopeUpsert = useCallback((fullData) => {
    if (!clientId) return;
    if (scopeDebounceRef.current) clearTimeout(scopeDebounceRef.current);
    scopeDebounceRef.current = setTimeout(async () => {
      try {
        const result = await scopeOfAdviceApi.upsert(clientId, fullData, fullData.id);
        if (result && result.id && !fullData.id) {
          updateFF("advice_request.scope", prev => {
            const s = typeof prev === 'object' ? prev : (factFind.advice_request?.scope || {});
            return { ...s, id: result.id };
          });
        }
      } catch (err) {
        console.error('[ScopeOfAdviceForm] Failed to upsert scope:', err);
      }
    }, 1500);
  }, [clientId, updateFF, factFind.advice_request?.scope]);

  const update = (field, value) => {
    const updated = { ...scope, [field]: value };
    updateFF("advice_request.scope", updated);
    debouncedScopeUpsert(updated);
  };

  const toggleArea = (areaId) => {
    update(areaId, !scope[areaId]);
  };

  const selectedCount = ADVICE_AREAS.filter(a => scope[a.id]).length;

  return (
    <div>
      {/* SOA Type */}
      <div style={{ border: "1px solid var(--ps-border)", borderRadius: 12, background: "var(--ps-surface)", overflow: "hidden", marginBottom: 12 }}>
        <div style={{ padding: "10px 16px", borderLeft: "4px solid #0D9488", background: "var(--ps-surface-teal)", borderRadius: "0 8px 8px 0" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0D9488", display: "flex", alignItems: "center", gap: 8 }}>
            <span>📐</span> Advice Type
          </div>
        </div>
        <div style={{ padding: "12px 16px" }}>
          <FFSelect label="SOA Type" value={scope.soa_type || ""} onChange={v => update("soa_type", v)} options={SOA_TYPE_OPTIONS} />
        </div>
      </div>

      {/* Areas of Advice */}
      <div style={{ border: "1px solid var(--ps-border)", borderRadius: 12, background: "var(--ps-surface)", overflow: "hidden", marginBottom: 12 }}>
        <div style={{ padding: "10px 16px", borderLeft: "4px solid #0D9488", background: "var(--ps-surface-teal)", borderRadius: "0 8px 8px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0D9488", display: "flex", alignItems: "center", gap: 8 }}>
            <span>✅</span> Areas of Advice
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#0D9488" }}>{selectedCount} selected</span>
        </div>
        <div style={{ padding: "12px 16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {ADVICE_AREAS.map(area => {
              const checked = !!scope[area.id];
              return (
                <label key={area.id} onClick={() => toggleArea(area.id)} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, cursor: "pointer", transition: "all 0.15s",
                  border: checked ? "2px solid #0D9488" : "2px solid var(--ps-border)",
                  background: checked ? "var(--ps-surface-teal)" : "var(--ps-surface)",
                }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center",
                    border: checked ? "2px solid #0D9488" : "2px solid var(--ps-border-mid)",
                    background: checked ? "#0D9488" : "var(--ps-surface)",
                    color: "var(--ps-surface)", fontSize: 11, fontWeight: 700,
                  }}>{checked ? "✓" : ""}</div>
                  <span style={{ fontSize: 12, fontWeight: checked ? 600 : 400, color: checked ? "#134E4A" : "var(--ps-text-secondary)" }}>{area.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      {/* Additional Notes */}
      <div style={{ border: "1px solid var(--ps-border)", borderRadius: 12, background: "var(--ps-surface)", overflow: "hidden", marginBottom: 12 }}>
        <div style={{ padding: "10px 16px", borderLeft: "4px solid #0D9488", background: "var(--ps-surface-teal)", borderRadius: "0 8px 8px 0" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0D9488", display: "flex", alignItems: "center", gap: 8 }}>
            <span>📝</span> Additional Notes
          </div>
        </div>
        <div style={{ padding: "12px 16px" }}>
          <textarea value={scope.additional_notes || ""} onChange={e => update("additional_notes", e.target.value)} rows={4} placeholder="Add any additional notes about the scope..."
            style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--ps-border-mid)", borderRadius: 6, fontSize: 12, resize: "vertical", background: "var(--ps-surface)" }} />
        </div>
      </div>
    </div>
  );
}


// ===========================================================================
// ADVICE — Transactions Form (Base44-aligned)
// ===========================================================================

const TXN_BUY_ASSET_TYPES = [
  { value: "12", label: "Australian — Listed" }, { value: "13", label: "International — Listed" },
  { value: "26", label: "Managed funds" }, { value: "10", label: "Government bonds — listed" },
  { value: "9", label: "Term deposit" }, { value: "8", label: "Cash" }, { value: "40", label: "Related party loan" },
  { value: "1", label: "Principal residence" }, { value: "18", label: "Investment property" },
  { value: "21", label: "Commercial property" }, { value: "27", label: "Holiday home" },
];
const TXN_OWNERSHIP_TYPES = [
  { value: "1", label: "Sole ownership" }, { value: "2", label: "Joint" }, { value: "7", label: "Tenants in common" },
];
const TXN_DEBT_TYPES = [
  { value: "1", label: "Home loan" }, { value: "2", label: "Investment loan" }, { value: "3", label: "Margin loan" },
  { value: "4", label: "Split loan" }, { value: "5", label: "Credit card" }, { value: "6", label: "Reverse mortgage" },
  { value: "7", label: "Car loan" }, { value: "9", label: "Home equity release" },
  { value: "10", label: "Related party loan" }, { value: "8", label: "Other" },
];
const TXN_RENT_FREQ = [
  { value: "weekly", label: "Weekly" }, { value: "fortnightly", label: "Fortnightly" },
  { value: "monthly", label: "Monthly" }, { value: "quarterly", label: "Quarterly" }, { value: "annually", label: "Annually" },
];
const TXN_PROPERTY_TYPES = ["1", "18", "19", "21", "27"];

const txnId = () => "txn_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
const txnFmt = (v) => { const n = parseFloat(v); return isNaN(n) ? "—" : "$" + n.toLocaleString("en-AU", { maximumFractionDigits: 0 }); };
const txnLbl = (arr, val) => arr.find(x => x.value === val)?.label || "—";

const EMPTY_BUY = { id: "", description: "", asset_type: "", ownership_type: "", owner_id: "", asx_code: "", international_code: "", apir_code: "", amount: "", purchase_date: "", is_today_dollars: false, rental_income: "", rent_frequency: "", debt_security_id: "" };
const EMPTY_SELL = { id: "", description: "", asset_idx: "", owner_id: "", entity_type: "", sell_entire_amount: false, amount: "", transaction_costs_pct: "1", sell_year: "", sell_date: "", sbc_eligible: "", sbc_15yr: "", sbc_active_asset: "", sbc_retirement: "", sbc_retirement_amt: "", sbc_rollover: "" };
const EMPTY_DEBT = { id: "", description: "", start_date: "", ownership_type: "", owner_id: "", entity_type: "", debt_type: "", interest_rate: "", is_interest_only: false, interest_only_end_date: "", loan_amount: "", repayments: "", repayment_freq: "12", term_years: "", is_redraw_available: false, redraw_balance: "", redraw_limit: "", establishment_cost: "", is_offset_available: false, is_purchase_security: false };
const EMPTY_NEW_SUPER = { id: "", fund_name: "", product: "", owner: "client1", balance: "", is_sg_fund: false, contributions: { super_guarantee: "", salary_sacrifice: "", salary_sacrifice_indexed: false, after_tax: "", after_tax_indexed: false, spouse_received: "", spouse_received_indexed: false, split_received: "", split_out_pct: "", concessional: "" }, tax_components: { taxable_portion: "", tax_free_portion: "" }, fees: { admin_fee: "", percent_fee: "", insurance_fee: "", ins_inflation_on: false, ins_inflation_rate: "" }, beneficiaries: [], portfolio: [] };
const EMPTY_NEW_PENSION = { id: "", fund_name: "", product: "", owner: "client1", balance: "", pension_type: "account-based", drawdown_rate: "5", drawdown_type: "percentage", drawdown_amount: "", drawdown_frequency: "monthly", tax_components: { taxable_portion: "", tax_free_portion: "", tax_free_pct: "" }, fees: { admin_fee: "", percent_fee: "", insurance_fee: "0" }, portfolio: [] };

