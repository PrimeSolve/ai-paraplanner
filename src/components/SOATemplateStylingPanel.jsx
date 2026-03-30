import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, RotateCcw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import axiosInstance from '@/api/axiosInstance';
import { tintColour } from '@/utils/colourUtils';

// ─── Default config ───────────────────────────────────────────────
export const DEFAULT_STYLING_CONFIG = {
  brand: {
    primary_colour: '#1B3A6B',
    accent_colour: '#C8A951',
    font_family: 'Arial',
    logo_url: null,
    cover_layout: 'standard',
  },
  typography: {
    h1: { size_pt: 18, bold: true },
    h2: { size_pt: 14, bold: true },
    h3: { size_pt: 12, bold: true },
    body: { size_pt: 11, line_spacing: 1.15 },
    footnote: { size_pt: 9, line_spacing: 1.0 },
    table_text: { size_pt: 10, line_spacing: 1.0 },
  },
  page_layout: {
    margins_mm: { top: 25, bottom: 25, left: 25, right: 25 },
    header: {
      logo_left: true,
      title_right: true,
      title_right_text: 'Statement of Advice',
    },
    footer: {
      page_numbers: true,
      afs_line: true,
      confidentiality: false,
      confidentiality_text:
        'This document is confidential and prepared for the named recipient only.',
    },
    section_page_breaks: true,
  },
  tables: {
    column_header: {
      fill_inherits_primary: true,
      fill_override: null,
      text_colour: '#FFFFFF',
      bold: true,
    },
    sub_heading_row: {
      fill_tint_pct: 25,
      text_colour_inherits_primary: true,
      bold: true,
      italic: false,
    },
    left_column: {
      fill_tint_pct: 12,
      text_colour_inherits_primary: true,
      bold: false,
      width_pct: 40,
    },
    total_row: {
      fill_inherits_primary: true,
      fill_override: null,
      text_colour: '#FFFFFF',
      bold: true,
    },
    striped: { enabled: true, even_row_colour: '#F7F9FC' },
    borders: { style: 'thin', colour: '#CCCCCC' },
    cell_padding_pt: 4,
  },
  callouts: {
    important_note: {
      border_colour_inherits_accent: true,
      border_colour_override: null,
      fill_colour: '#FFF9EC',
    },
    warning_box: {
      left_border_colour: '#D9534F',
      fill_colour: '#FFF4F4',
    },
  },
  document_assembly: {
    toc_auto_gen_from_visible: true,
    include_how_to_read: true,
    include_appendix_icons: true,
  },
};

// ─── API helpers ──────────────────────────────────────────────────
const getStylingConfig = (templateId) =>
  axiosInstance.get(`/soa-templates/${templateId}/styling-config`).then((r) => r.data);

const saveStylingConfig = (templateId, config) =>
  axiosInstance.put(`/soa-templates/${templateId}/styling-config`, config).then((r) => r.data);

// ─── Tiny reusable controls ──────────────────────────────────────
function ColourInput({ value, onChange, disabled }) {
  const ref = useRef();
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-8 h-8 rounded border border-slate-300 cursor-pointer shrink-0"
        style={{ backgroundColor: value || '#EEEEEE' }}
        onClick={() => !disabled && ref.current?.click()}
      />
      <input
        ref={ref}
        type="color"
        value={value || '#EEEEEE'}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="sr-only"
      />
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-24 px-2 py-1 text-xs border border-slate-300 rounded font-mono disabled:bg-slate-50 disabled:text-slate-400"
        placeholder="#000000"
      />
    </div>
  );
}

function InheritedSwatch({ colour, label }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-4 h-4 rounded shrink-0"
        style={{ backgroundColor: colour, borderRadius: 4, border: '1px solid #d1d5db' }}
      />
      <span className="text-[11px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{label}</span>
    </div>
  );
}

function NumberInput({ value, onChange, min, max }) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-20 px-2 py-1 text-sm border border-slate-300 rounded"
    />
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
        checked ? 'bg-indigo-600' : 'bg-slate-200'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

function Field({ label, children, helper }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <div className="min-w-0">
        <span className="text-sm text-slate-700">{label}</span>
        {helper && <p className="text-[11px] text-slate-400 mt-0.5">{helper}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function SectionHeading({ title }) {
  return <h3 className="text-sm font-semibold text-slate-800 mt-6 mb-2 border-b border-slate-200 pb-1">{title}</h3>;
}

function BoolSelect({ value, onChange }) {
  return (
    <select
      value={value ? 'yes' : 'no'}
      onChange={(e) => onChange(e.target.value === 'yes')}
      className="w-20 px-2 py-1 text-sm border border-slate-300 rounded"
    >
      <option value="yes">Yes</option>
      <option value="no">No</option>
    </select>
  );
}

// ─── Main panel ──────────────────────────────────────────────────
export default function SOATemplateStylingPanel({ templateId, onClose }) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getStylingConfig(templateId)
      .then((data) => {
        if (cancelled) return;
        if (!data || Object.keys(data).length === 0) {
          setConfig(structuredClone(DEFAULT_STYLING_CONFIG));
        } else {
          setConfig(data);
        }
      })
      .catch(() => {
        if (!cancelled) setConfig(structuredClone(DEFAULT_STYLING_CONFIG));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [templateId]);

  const set = useCallback(
    (path, value) =>
      setConfig((prev) => {
        const next = structuredClone(prev);
        const keys = path.split('.');
        let obj = next;
        for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
        obj[keys[keys.length - 1]] = value;
        return next;
      }),
    [],
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveStylingConfig(templateId, config);
      toast.success('Styling settings saved');
    } catch (err) {
      toast.error(`Failed to save: ${err.response?.status || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setConfig(structuredClone(DEFAULT_STYLING_CONFIG));
    toast.success('Reset to defaults');
  };

  // Derived colours
  const primary = config?.brand?.primary_colour || '#1B3A6B';
  const accent = config?.brand?.accent_colour || '#C8A951';

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed top-0 right-0 z-50 h-full w-[600px] max-w-full bg-white shadow-xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Global Styling Settings</h2>
            <p className="text-xs text-slate-500">Configure visual styling for the generated .docx output</p>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : !config ? null : (
            <>
              {/* ── Section 1: Brand ── */}
              <SectionHeading title="Brand" />
              <Field label="Primary colour" helper="Drives heading colour, table headers and cover page accent.">
                <ColourInput value={config.brand.primary_colour} onChange={(v) => set('brand.primary_colour', v)} />
              </Field>
              <Field label="Accent colour" helper="Used for callout borders and important note boxes.">
                <ColourInput value={config.brand.accent_colour} onChange={(v) => set('brand.accent_colour', v)} />
              </Field>
              <Field label="Font family">
                <select
                  value={config.brand.font_family}
                  onChange={(e) => set('brand.font_family', e.target.value)}
                  className="w-44 px-2 py-1 text-sm border border-slate-300 rounded"
                >
                  <option>Arial</option>
                  <option>Calibri</option>
                  <option>Times New Roman</option>
                  <option>Georgia</option>
                </select>
              </Field>
              <Field label="Logo">
                <input
                  type="text"
                  value={config.brand.logo_url || ''}
                  onChange={(e) => set('brand.logo_url', e.target.value || null)}
                  placeholder="Upload or paste URL…"
                  className="w-44 px-2 py-1 text-sm border border-slate-300 rounded"
                />
              </Field>

              {/* ── Section 2: Typography ── */}
              <SectionHeading title="Typography" />
              <Field label="H1 size (pt)">
                <NumberInput value={config.typography.h1.size_pt} onChange={(v) => set('typography.h1.size_pt', v)} min={10} max={36} />
              </Field>
              <Field label="H2 size (pt)">
                <NumberInput value={config.typography.h2.size_pt} onChange={(v) => set('typography.h2.size_pt', v)} min={10} max={28} />
              </Field>
              <Field label="H3 size (pt)">
                <NumberInput value={config.typography.h3.size_pt} onChange={(v) => set('typography.h3.size_pt', v)} min={9} max={22} />
              </Field>
              <Field label="Body size (pt)">
                <NumberInput value={config.typography.body.size_pt} onChange={(v) => set('typography.body.size_pt', v)} min={8} max={14} />
              </Field>
              <Field label="Line spacing">
                <select
                  value={config.typography.body.line_spacing}
                  onChange={(e) => set('typography.body.line_spacing', Number(e.target.value))}
                  className="w-44 px-2 py-1 text-sm border border-slate-300 rounded"
                >
                  <option value={1.0}>1.0 — tight</option>
                  <option value={1.15}>1.15 — standard</option>
                  <option value={1.5}>1.5 — relaxed</option>
                </select>
              </Field>
              <Field label="Table text size (pt)">
                <NumberInput value={config.typography.table_text.size_pt} onChange={(v) => set('typography.table_text.size_pt', v)} min={8} max={13} />
              </Field>

              {/* ── Section 3: Page Layout ── */}
              <SectionHeading title="Page Layout" />
              <Field label="Margin top (mm)">
                <NumberInput value={config.page_layout.margins_mm.top} onChange={(v) => set('page_layout.margins_mm.top', v)} min={5} max={50} />
              </Field>
              <Field label="Margin bottom (mm)">
                <NumberInput value={config.page_layout.margins_mm.bottom} onChange={(v) => set('page_layout.margins_mm.bottom', v)} min={5} max={50} />
              </Field>
              <Field label="Margin left (mm)">
                <NumberInput value={config.page_layout.margins_mm.left} onChange={(v) => set('page_layout.margins_mm.left', v)} min={5} max={50} />
              </Field>
              <Field label="Margin right (mm)">
                <NumberInput value={config.page_layout.margins_mm.right} onChange={(v) => set('page_layout.margins_mm.right', v)} min={5} max={50} />
              </Field>
              <Field label="Logo in header (left)">
                <Toggle checked={config.page_layout.header.logo_left} onChange={(v) => set('page_layout.header.logo_left', v)} />
              </Field>
              <Field label="Document title in header (right)">
                <Toggle checked={config.page_layout.header.title_right} onChange={(v) => set('page_layout.header.title_right', v)} />
              </Field>
              <Field label="Page numbers in footer">
                <Toggle checked={config.page_layout.footer.page_numbers} onChange={(v) => set('page_layout.footer.page_numbers', v)} />
              </Field>
              <Field label="AFSL line in footer">
                <Toggle checked={config.page_layout.footer.afs_line} onChange={(v) => set('page_layout.footer.afs_line', v)} />
              </Field>
              <Field label="Confidentiality line in footer">
                <Toggle checked={config.page_layout.footer.confidentiality} onChange={(v) => set('page_layout.footer.confidentiality', v)} />
              </Field>
              <Field label="Each section starts on a new page">
                <Toggle checked={config.page_layout.section_page_breaks} onChange={(v) => set('page_layout.section_page_breaks', v)} />
              </Field>

              {/* ── Section 4: Table Styles ── */}
              <SectionHeading title="Table Styles" />
              <Field label="Column header fill">
                <InheritedSwatch colour={primary} label="inherits primary" />
              </Field>
              <Field label="Column header text">
                <ColourInput value={config.tables.column_header.text_colour} onChange={(v) => set('tables.column_header.text_colour', v)} />
              </Field>
              <Field label="Column header bold">
                <BoolSelect value={config.tables.column_header.bold} onChange={(v) => set('tables.column_header.bold', v)} />
              </Field>
              <Field label="Sub-heading row fill">
                <InheritedSwatch colour={tintColour(primary, 25)} label="inherits primary" />
              </Field>
              <Field label="Sub-heading text">
                <InheritedSwatch colour={primary} label="inherits primary" />
              </Field>
              <Field label="Sub-heading bold">
                <BoolSelect value={config.tables.sub_heading_row.bold} onChange={(v) => set('tables.sub_heading_row.bold', v)} />
              </Field>
              <Field label="Left column fill">
                <InheritedSwatch colour={tintColour(primary, 12)} label="inherits primary" />
              </Field>
              <Field label="Left column text">
                <InheritedSwatch colour={primary} label="inherits primary" />
              </Field>
              <Field label="Left column width %">
                <NumberInput value={config.tables.left_column.width_pct} onChange={(v) => set('tables.left_column.width_pct', v)} min={20} max={60} />
              </Field>
              <Field label="Total row fill">
                <InheritedSwatch colour={primary} label="inherits primary" />
              </Field>
              <Field label="Total row text">
                <ColourInput value={config.tables.total_row.text_colour} onChange={(v) => set('tables.total_row.text_colour', v)} />
              </Field>
              <Field label="Striped rows">
                <BoolSelect value={config.tables.striped.enabled} onChange={(v) => set('tables.striped.enabled', v)} />
              </Field>
              <Field label="Border style">
                <select
                  value={config.tables.borders.style}
                  onChange={(e) => set('tables.borders.style', e.target.value)}
                  className="w-28 px-2 py-1 text-sm border border-slate-300 rounded"
                >
                  <option value="none">None</option>
                  <option value="thin">Thin</option>
                  <option value="medium">Medium</option>
                </select>
              </Field>
              <Field label="Border colour">
                <ColourInput value={config.tables.borders.colour} onChange={(v) => set('tables.borders.colour', v)} />
              </Field>
              <Field label="Cell padding (pt)">
                <NumberInput value={config.tables.cell_padding_pt} onChange={(v) => set('tables.cell_padding_pt', v)} min={2} max={10} />
              </Field>

              {/* Live table preview */}
              <TablePreview config={config} primary={primary} />

              {/* ── Section 5: Callout Styles ── */}
              <SectionHeading title="Callout Styles" />
              <Field label="Important note border">
                <InheritedSwatch colour={accent} label="inherits accent" />
              </Field>
              <Field label="Important note fill">
                <ColourInput value={config.callouts.important_note.fill_colour} onChange={(v) => set('callouts.important_note.fill_colour', v)} />
              </Field>
              <Field label="Warning box left border">
                <ColourInput value={config.callouts.warning_box.left_border_colour} onChange={(v) => set('callouts.warning_box.left_border_colour', v)} />
              </Field>
              <Field label="Warning box fill">
                <ColourInput value={config.callouts.warning_box.fill_colour} onChange={(v) => set('callouts.warning_box.fill_colour', v)} />
              </Field>

              {/* Live callout previews */}
              <CalloutPreviews config={config} accent={accent} />

              {/* ── Section 6: Document Assembly ── */}
              <SectionHeading title="Document Assembly" />
              <Field label="Auto-generate TOC from visible sections only">
                <Toggle checked={config.document_assembly.toc_auto_gen_from_visible} onChange={(v) => set('document_assembly.toc_auto_gen_from_visible', v)} />
              </Field>
              <Field label='Include "How to read this document" as fixed first section'>
                <Toggle checked={config.document_assembly.include_how_to_read} onChange={(v) => set('document_assembly.include_how_to_read', v)} />
              </Field>
              <Field label="Include appendix reference icons inline">
                <Toggle checked={config.document_assembly.include_appendix_icons} onChange={(v) => set('document_assembly.include_appendix_icons', v)} />
              </Field>
            </>
          )}
        </div>

        {/* Footer (sticky) */}
        {!loading && config && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 shrink-0">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Reset to defaults
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
              Save settings
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Live table preview ──────────────────────────────────────────
function TablePreview({ config, primary }) {
  const borderStyle = config.tables.borders.style;
  const borderColour = config.tables.borders.colour;
  const borderWidth = borderStyle === 'none' ? 0 : borderStyle === 'medium' ? 2 : 1;
  const border = borderWidth ? `${borderWidth}px solid ${borderColour}` : 'none';
  const pad = config.tables.cell_padding_pt;
  const leftW = `${config.tables.left_column.width_pct}%`;
  const subFill = tintColour(primary, config.tables.sub_heading_row.fill_tint_pct);
  const leftFill = tintColour(primary, config.tables.left_column.fill_tint_pct);
  const evenRow = config.tables.striped.enabled ? config.tables.striped.even_row_colour : '#FFFFFF';

  const cellStyle = { padding: pad, border, fontSize: 11 };

  return (
    <div className="mt-3 mb-4">
      <p className="text-[11px] text-slate-400 mb-1 font-medium">Live preview</p>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
        <thead>
          <tr>
            <th style={{ ...cellStyle, background: primary, color: config.tables.column_header.text_colour, fontWeight: config.tables.column_header.bold ? 700 : 400, width: leftW, textAlign: 'left' }}>
              Net worth statement
            </th>
            <th style={{ ...cellStyle, background: primary, color: config.tables.column_header.text_colour, fontWeight: config.tables.column_header.bold ? 700 : 400, textAlign: 'right' }}>
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {/* Sub-heading: Assets */}
          <tr>
            <td colSpan={2} style={{ ...cellStyle, background: subFill, color: primary, fontWeight: config.tables.sub_heading_row.bold ? 700 : 400 }}>
              Assets
            </td>
          </tr>
          {/* Data row 1 (odd) */}
          <tr>
            <td style={{ ...cellStyle, background: leftFill, color: primary }}>Property</td>
            <td style={{ ...cellStyle, textAlign: 'right' }}>$950,000</td>
          </tr>
          {/* Data row 2 (even) */}
          <tr>
            <td style={{ ...cellStyle, background: leftFill, color: primary }}>Super</td>
            <td style={{ ...cellStyle, background: evenRow, textAlign: 'right' }}>$320,000</td>
          </tr>
          {/* Sub-heading: Liabilities */}
          <tr>
            <td colSpan={2} style={{ ...cellStyle, background: subFill, color: primary, fontWeight: config.tables.sub_heading_row.bold ? 700 : 400 }}>
              Liabilities
            </td>
          </tr>
          {/* Data row 3 */}
          <tr>
            <td style={{ ...cellStyle, background: leftFill, color: primary }}>Mortgage</td>
            <td style={{ ...cellStyle, textAlign: 'right' }}>$480,000</td>
          </tr>
          {/* Total row */}
          <tr>
            <td style={{ ...cellStyle, background: primary, color: config.tables.total_row.text_colour, fontWeight: config.tables.total_row.bold ? 700 : 400 }}>
              Net worth
            </td>
            <td style={{ ...cellStyle, background: primary, color: config.tables.total_row.text_colour, fontWeight: config.tables.total_row.bold ? 700 : 400, textAlign: 'right' }}>
              $790,000
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ─── Live callout previews ───────────────────────────────────────
function CalloutPreviews({ config, accent }) {
  return (
    <div className="mt-3 mb-4 space-y-3">
      <p className="text-[11px] text-slate-400 mb-1 font-medium">Live preview</p>

      {/* Important note */}
      <div
        style={{
          border: `2px solid ${accent}`,
          background: config.callouts.important_note.fill_colour,
          borderRadius: 6,
          padding: '10px 14px',
          fontSize: 12,
        }}
      >
        <strong>Important note</strong>
        <p style={{ margin: '4px 0 0', color: '#555' }}>
          This is a sample important note that highlights key information for the client.
        </p>
      </div>

      {/* Warning box */}
      <div
        style={{
          borderLeft: `3px solid ${config.callouts.warning_box.left_border_colour}`,
          background: config.callouts.warning_box.fill_colour,
          borderRadius: 4,
          padding: '10px 14px',
          fontSize: 12,
        }}
      >
        <strong>Warning</strong>
        <p style={{ margin: '4px 0 0', color: '#555' }}>
          This is a sample warning box that draws attention to potential risks.
        </p>
      </div>
    </div>
  );
}
