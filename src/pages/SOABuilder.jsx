import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44, aiApi } from '@/api/primeSolveClient';
import { toast } from 'sonner';
import { formatDate } from '../utils/dateUtils';
import { createAdviceRecord } from '@/utils/adviceRecordHelpers';
import {
  ChevronLeft, ChevronRight, FileText, Send, Eye, ShieldCheck,
  Sparkles, Loader2, PanelLeftClose, PanelLeft, Check, Save,
  BookOpen, Users, Briefcase, Shield, TrendingUp, Package,
  Settings, FileStack, ClipboardList
} from 'lucide-react';

// ──────────────────────────────────────────────────────────────
// Section definitions
// ──────────────────────────────────────────────────────────────

const SECTION_GROUPS = [
  {
    key: 'welcome',
    label: 'Welcome & Introduction',
    icon: BookOpen,
    sections: [
      { id: 'cover_letter', title: 'Cover Letter', type: 'ai_edit' },
      { id: 'cover_page', title: 'Cover Page', type: 'auto' },
      { id: 'how_to_read', title: 'How to Read This Document', type: 'editable' },
    ]
  },
  {
    key: 'executive',
    label: 'Executive Summary & Scope',
    icon: ClipboardList,
    sections: [
      { id: 'executive_summary', title: 'Executive Summary', type: 'ai_edit' },
      { id: 'financial_needs', title: 'Financial Needs & Objectives', type: 'ai_edit' },
      { id: 'scope_of_advice', title: 'Scope of Advice', type: 'ai_edit' },
    ]
  },
  {
    key: 'circumstances',
    label: 'Relevant Circumstances',
    icon: Users,
    sections: [
      { id: 'personal_info', title: 'Personal Information', type: 'data_table' },
      { id: 'dependants', title: 'Dependants', type: 'data_table' },
      { id: 'financial_position', title: 'Financial Position', type: 'data_table' },
      { id: 'cash_flow', title: 'Cash Flow', type: 'data_table' },
      { id: 'insurance_current', title: 'Current Insurance', type: 'data_table' },
      { id: 'estate_planning', title: 'Estate Planning', type: 'ai_edit' },
      { id: 'tax_position', title: 'Tax Position', type: 'ai_edit' },
    ]
  },
  {
    key: 'strategies',
    label: 'Recommended Strategies',
    icon: TrendingUp,
    sections: [
      { id: 'wealth_protection', title: 'Wealth Protection Strategy', type: 'ai_edit' },
      { id: 'insurance_needs', title: 'Insurance Needs Analysis', type: 'ai_edit' },
      { id: 'insurance_cover', title: 'Recommended Insurance Cover', type: 'ai_edit' },
      { id: 'debt_management', title: 'Debt Management', type: 'ai_edit' },
      { id: 'wealth_accumulation', title: 'Wealth Accumulation', type: 'ai_edit' },
      { id: 'retirement_planning', title: 'Retirement Planning', type: 'ai_edit' },
    ]
  },
  {
    key: 'products',
    label: 'Product Recommendations',
    icon: Package,
    sections: [
      { id: 'insurance_product', title: 'Insurance Product Recommendation', type: 'ai_edit' },
      { id: 'wealth_product', title: 'Wealth Product Recommendation', type: 'ai_edit' },
      { id: 'portfolio', title: 'Portfolio Construction', type: 'ai_edit' },
    ]
  },
  {
    key: 'implementation',
    label: 'Implementation',
    icon: Settings,
    sections: [
      { id: 'transactions', title: 'Transactions & Implementation', type: 'data_table' },
      { id: 'projected_outcomes', title: 'Projected Outcomes', type: 'ai_edit' },
    ]
  },
  {
    key: 'fees',
    label: 'Fees & Disclosure',
    icon: Briefcase,
    sections: [
      { id: 'fee_disclosure', title: 'Fee Disclosure', type: 'ai_edit' },
      { id: 'commissions', title: 'Commissions & Benefits', type: 'ai_edit' },
      { id: 'disclaimer', title: 'Disclaimer & Warnings', type: 'editable' },
      { id: 'how_to_proceed', title: 'How to Proceed', type: 'editable' },
    ]
  },
  {
    key: 'appendices',
    label: 'Appendices',
    icon: FileStack,
    sections: [
      { id: 'detailed_projections', title: 'Detailed Projections', type: 'data_table' },
      { id: 'risk_assessment', title: 'Risk Assessment', type: 'ai_edit' },
      { id: 'authority_to_proceed', title: 'Authority to Proceed', type: 'editable' },
    ]
  },
];

const ALL_SECTIONS = SECTION_GROUPS.flatMap(g => g.sections);

const TYPE_BADGES = {
  editable: { label: 'Editable', bg: '#dbeafe', color: '#1d4ed8' },
  auto: { label: 'Auto', bg: '#dcfce7', color: '#15803d' },
  ai_edit: { label: 'AI+Edit', bg: '#fef3c7', color: '#b45309' },
  data_table: { label: 'Data Table', bg: '#f3e8ff', color: '#7c3aed' },
};

// ──────────────────────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────────────────────

export default function SOABuilder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const documentId = searchParams.get('id');

  // Data state
  const [loading, setLoading] = useState(true);
  const [doc, setDoc] = useState(null);
  const [soaRequest, setSoaRequest] = useState(null);
  const [client, setClient] = useState(null);
  const [contents, setContents] = useState({});
  const [sectionStatuses, setSectionStatuses] = useState({});

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [generatingSection, setGeneratingSection] = useState(null);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [refineInputs, setRefineInputs] = useState({});

  // Refs for scroll
  const sectionRefs = useRef({});
  const saveTimeoutRef = useRef(null);

  // ── Load data on mount ──
  useEffect(() => {
    if (!documentId) {
      toast.error('No SOA Document ID provided');
      setLoading(false);
      return;
    }
    loadDocument();
  }, [documentId]);

  const loadDocument = async () => {
    try {
      const docs = await base44.entities.SoaDocument.filter({ id: documentId });
      const docData = docs[0];
      if (!docData) {
        toast.error('SOA Document not found');
        setLoading(false);
        return;
      }
      setDoc(docData);

      const parsedContents = (() => {
        try { return JSON.parse(docData.section_contents || '{}'); } catch { return {}; }
      })();
      const parsedStatuses = (() => {
        try { return JSON.parse(docData.section_statuses || '{}'); } catch { return {}; }
      })();
      setContents(parsedContents);
      setSectionStatuses(parsedStatuses);

      // Load SOA request
      if (docData.soa_request_id) {
        const requests = await base44.entities.SOARequest.filter({ id: docData.soa_request_id });
        const reqData = requests[0];
        setSoaRequest(reqData);

        // Load client
        if (reqData?.client_id) {
          const clients = await base44.entities.Client.filter({ id: reqData.client_id });
          setClient(clients[0] || null);
        }
      }
    } catch (error) {
      console.error('Error loading SOA document:', error);
      toast.error('Failed to load SOA document');
    } finally {
      setLoading(false);
    }
  };

  // ── Auto-save with debounce ──
  const calculateProgress = useCallback(() => {
    const total = ALL_SECTIONS.length;
    const completed = ALL_SECTIONS.filter(s => {
      const status = sectionStatuses[s.id];
      if (status === 'complete' || status === 'auto_generated') return true;
      if (contents[s.id] && contents[s.id].trim().length > 0) return true;
      return false;
    }).length;
    return Math.round((completed / total) * 100);
  }, [contents, sectionStatuses]);

  const doSave = useCallback(async (newContents, newStatuses) => {
    if (!documentId) return;
    setSaving(true);
    try {
      await base44.entities.SoaDocument.update(documentId, {
        section_contents: JSON.stringify(newContents),
        section_statuses: JSON.stringify(newStatuses),
        completion_percentage: (() => {
          const total = ALL_SECTIONS.length;
          const completed = ALL_SECTIONS.filter(s => {
            const status = newStatuses[s.id];
            if (status === 'complete' || status === 'auto_generated') return true;
            if (newContents[s.id] && newContents[s.id].trim().length > 0) return true;
            return false;
          }).length;
          return Math.round((completed / total) * 100);
        })()
      });
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setSaving(false);
    }
  }, [documentId]);

  const scheduleSave = useCallback((newContents, newStatuses) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      doSave(newContents, newStatuses);
    }, 2000);
  }, [doSave]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  // ── Content handlers ──
  const handleContentChange = useCallback((sectionId, value) => {
    setContents(prev => {
      const next = { ...prev, [sectionId]: value };
      scheduleSave(next, sectionStatuses);
      return next;
    });
  }, [sectionStatuses, scheduleSave]);

  // ── AI generation ──
  const handleGenerateSection = async (sectionId, additionalInstructions = '') => {
    setGeneratingSection(sectionId);
    try {
      const result = await aiApi.generateSection(documentId, sectionId, additionalInstructions);
      const generatedContent = result.content || result.generated_content || '';
      const newContents = { ...contents, [sectionId]: generatedContent };
      const newStatuses = { ...sectionStatuses, [sectionId]: 'auto_generated' };
      setContents(newContents);
      setSectionStatuses(newStatuses);
      doSave(newContents, newStatuses);
      toast.success('Section generated successfully');
    } catch (error) {
      console.error('AI generation failed:', error);
      toast.error('Failed to generate section');
    } finally {
      setGeneratingSection(null);
    }
  };

  const handleGenerateAll = async () => {
    setGeneratingAll(true);
    try {
      const result = await aiApi.generateAll(documentId);
      // Reload the document to get updated contents
      await loadDocument();
      toast.success('All sections generated successfully');
    } catch (error) {
      console.error('Generate all failed:', error);
      toast.error('Failed to generate all sections');
    } finally {
      setGeneratingAll(false);
    }
  };

  const handleComplianceCheck = async () => {
    try {
      const result = await aiApi.complianceCheck(documentId);
      if (result.issues && result.issues.length > 0) {
        toast.error(`${result.issues.length} compliance issue(s) found`);
      } else {
        toast.success('No compliance issues found');
      }

      // Create a compliance_review AdviceRecord
      const currentUser = await base44.auth.me();
      const hasIssues = result.issues && result.issues.length > 0;
      createAdviceRecord({
        recordType: 'compliance_review',
        title: `Compliance Review - ${doc?.name || 'SOA Document'}`,
        status: hasIssues ? 'Requires Changes' : 'Approved',
        clientId: soaRequest?.client_id || client?.id,
        adviserId: currentUser.id,
        linkedEntities: {
          soaDocumentId: documentId,
          adviceRequestId: soaRequest?.id,
        },
        snapshots: {
          adviceModel: soaRequest || null,
        },
        notes: hasIssues
          ? `${result.issues.length} compliance issue(s) found: ${result.issues.map(i => i.message || i).join('; ')}`
          : 'No compliance issues found. Document approved.',
        createdBy: currentUser.email,
      });
    } catch (error) {
      console.error('Compliance check failed:', error);
      toast.error('Failed to run compliance check');
    }
  };

  // ── Scroll navigation ──
  const scrollToSection = (sectionId) => {
    const el = sectionRefs.current[sectionId];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ── Progress calc ──
  const progress = useMemo(() => {
    const total = ALL_SECTIONS.length;
    const completed = ALL_SECTIONS.filter(s => {
      const status = sectionStatuses[s.id];
      if (status === 'complete' || status === 'auto_generated') return true;
      if (contents[s.id] && contents[s.id].trim().length > 0) return true;
      return false;
    }).length;
    return { completed, total, pct: Math.round((completed / total) * 100) };
  }, [contents, sectionStatuses]);

  // ── Save status text ──
  const saveStatusText = useMemo(() => {
    if (saving) return 'Saving...';
    if (!lastSaved) return '';
    const diff = Math.floor((Date.now() - lastSaved.getTime()) / 60000);
    if (diff < 1) return 'Auto-saved just now';
    return `Auto-saved ${diff} min ago`;
  }, [saving, lastSaved]);

  // Re-render save text every 30s
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  // ── Client info ──
  const clientName = client
    ? `${client.first_name || ''} ${client.last_name || ''}`.trim() || 'Client'
    : 'Client';
  const adviserName = soaRequest?.soa_details?.adviser_name || soaRequest?.created_by || '';

  // ── Section status icon ──
  const getSectionIcon = (sectionId) => {
    const status = sectionStatuses[sectionId];
    if (status === 'complete') return <span style={{ color: '#22c55e' }}>&#10003;</span>;
    if (status === 'auto_generated') return <span style={{ color: '#eab308', fontSize: '12px' }}>&#9889;</span>;
    if (contents[sectionId] && contents[sectionId].trim().length > 0)
      return <span style={{ color: '#22c55e' }}>&#10003;</span>;
    return <span style={{ color: '#94a3b8', fontSize: '12px' }}>&#9675;</span>;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f8fafc' }}>
        <Loader2 className="animate-spin" style={{ width: 48, height: 48, color: '#475569' }} />
      </div>
    );
  }

  return (
    <>
      {/* Google Font */}
      <link href="https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,300;8..60,400;8..60,600;8..60,700&display=swap" rel="stylesheet" />

      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: "'Inter', sans-serif" }}>

        {/* ──────── LEFT SIDEBAR ──────── */}
        <div style={{
          width: sidebarOpen ? 280 : 0,
          minWidth: sidebarOpen ? 280 : 0,
          background: '#0f172a',
          color: '#e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.2s, min-width 0.2s',
          overflow: 'hidden',
        }}>
          {/* Client + Adviser */}
          <div style={{ padding: '20px 20px 12px', borderBottom: '1px solid #1e293b' }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9', marginBottom: 2 }}>{clientName}</div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>{adviserName ? `Adviser: ${adviserName}` : ''}</div>
          </div>

          {/* Progress */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e293b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>
              <span>{progress.completed} of {progress.total} sections</span>
              <span>{progress.pct}%</span>
            </div>
            <div style={{ height: 6, background: '#1e293b', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress.pct}%`, background: 'linear-gradient(90deg, #6366f1, #818cf8)', borderRadius: 3, transition: 'width 0.3s' }} />
            </div>
          </div>

          {/* Section Navigation */}
          <div style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
            {SECTION_GROUPS.map(group => {
              const Icon = group.icon;
              return (
                <div key={group.key} style={{ marginBottom: 4 }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 20px', fontSize: 10, fontWeight: 700,
                    color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.08em'
                  }}>
                    <Icon style={{ width: 14, height: 14 }} />
                    {group.label}
                  </div>
                  {group.sections.map(section => (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                        padding: '6px 20px 6px 34px', background: 'none', border: 'none',
                        color: '#cbd5e1', fontSize: 13, textAlign: 'left', cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#1e293b'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <span style={{ width: 16, textAlign: 'center' }}>{getSectionIcon(section.id)}</span>
                      <span style={{ flex: 1 }}>{section.title}</span>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>

          {/* Bottom Actions */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button
              onClick={handleGenerateAll}
              disabled={generatingAll}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '10px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
                cursor: generatingAll ? 'wait' : 'pointer', opacity: generatingAll ? 0.7 : 1,
              }}
            >
              {generatingAll ? <Loader2 className="animate-spin" style={{ width: 16, height: 16 }} /> : <Sparkles style={{ width: 16, height: 16 }} />}
              {generatingAll ? 'Generating...' : 'Generate All with AI'}
            </button>
            <button
              onClick={() => toast.info('Preview coming soon')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '8px', background: '#1e293b', color: '#cbd5e1',
                border: '1px solid #334155', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer',
              }}
            >
              <Eye style={{ width: 14, height: 14 }} />
              Preview Document
            </button>
            <button
              onClick={handleComplianceCheck}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '8px', background: '#1e293b', color: '#cbd5e1',
                border: '1px solid #334155', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer',
              }}
            >
              <ShieldCheck style={{ width: 14, height: 14 }} />
              Compliance Check
            </button>
          </div>
        </div>

        {/* ──────── MAIN CONTENT ──────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f8fafc' }}>

          {/* Sticky Top Bar */}
          <div style={{
            position: 'sticky', top: 0, zIndex: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 24px', background: '#fff', borderBottom: '1px solid #e2e8f0',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={() => setSidebarOpen(prev => !prev)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 4 }}
                title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              >
                {sidebarOpen ? <PanelLeftClose style={{ width: 20, height: 20 }} /> : <PanelLeft style={{ width: 20, height: 20 }} />}
              </button>
              <button
                onClick={() => navigate(-1)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#6366f1', fontSize: 13, fontWeight: 500,
                }}
              >
                <ChevronLeft style={{ width: 16, height: 16 }} /> Back
              </button>
              <span style={{ color: '#cbd5e1' }}>|</span>
              <span style={{ fontSize: 13, color: '#64748b' }}>SOA-{documentId?.slice(0, 8)}</span>
              <span style={{
                padding: '2px 10px', background: '#fef3c7', color: '#b45309',
                borderRadius: 20, fontSize: 11, fontWeight: 600,
              }}>Draft</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {saveStatusText && (
                <span style={{ fontSize: 12, color: saving ? '#6366f1' : '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {saving ? <Loader2 className="animate-spin" style={{ width: 12, height: 12 }} /> : <Check style={{ width: 12, height: 12 }} />}
                  {saveStatusText}
                </span>
              )}
              <button
                onClick={() => toast.info('Submit for review coming soon')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 18px', background: '#4f46e5', color: '#fff',
                  border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >
                <Send style={{ width: 14, height: 14 }} /> Submit for Review
              </button>
            </div>
          </div>

          {/* Scrollable Document */}
          <div style={{ flex: 1, overflow: 'auto', padding: '32px 24px 80px' }}>
            <div style={{ maxWidth: 780, margin: '0 auto' }}>

              {/* Document Title */}
              <div style={{ textAlign: 'center', marginBottom: 48 }}>
                <h1 style={{
                  fontFamily: "'Source Serif 4', 'Georgia', serif",
                  fontSize: 32, fontWeight: 700, color: '#0f172a',
                  marginBottom: 8, letterSpacing: '-0.02em',
                }}>
                  Statement of Advice
                </h1>
                <p style={{ fontFamily: "'Source Serif 4', 'Georgia', serif", fontSize: 18, color: '#475569', marginBottom: 4 }}>
                  Prepared for {clientName}
                </p>
                {adviserName && (
                  <p style={{ fontSize: 14, color: '#94a3b8' }}>
                    Adviser: {adviserName}
                    {soaRequest?.soa_details?.afsl_number && ` | AFSL ${soaRequest.soa_details.afsl_number}`}
                  </p>
                )}
                <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
                  {formatDate(new Date())}
                </p>
              </div>

              {/* Sections */}
              {SECTION_GROUPS.map(group => {
                const Icon = group.icon;
                return (
                  <div key={group.key} style={{ marginBottom: 40 }}>
                    {/* Group Divider */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '12px 0', marginBottom: 24,
                      borderBottom: '2px solid #e0e7ff',
                    }}>
                      <Icon style={{ width: 18, height: 18, color: '#6366f1' }} />
                      <span style={{
                        fontSize: 11, fontWeight: 700, color: '#6366f1',
                        textTransform: 'uppercase', letterSpacing: '0.1em',
                      }}>
                        {group.label}
                      </span>
                    </div>

                    {group.sections.map(section => (
                      <SectionBlock
                        key={section.id}
                        section={section}
                        content={contents[section.id] || ''}
                        status={sectionStatuses[section.id]}
                        isGenerating={generatingSection === section.id}
                        refineInput={refineInputs[section.id] || ''}
                        onRefineInputChange={(val) => setRefineInputs(prev => ({ ...prev, [section.id]: val }))}
                        onContentChange={(val) => handleContentChange(section.id, val)}
                        onGenerate={(instructions) => handleGenerateSection(section.id, instructions)}
                        sectionRef={el => { sectionRefs.current[section.id] = el; }}
                      />
                    ))}
                  </div>
                );
              })}

            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ──────────────────────────────────────────────────────────────
// Section Block Component
// ──────────────────────────────────────────────────────────────

function SectionBlock({
  section, content, status, isGenerating,
  refineInput, onRefineInputChange,
  onContentChange, onGenerate, sectionRef
}) {
  const badge = TYPE_BADGES[section.type] || TYPE_BADGES.editable;
  const isEditable = section.type !== 'auto';
  const isAiGenerated = status === 'auto_generated';
  const textareaRef = useRef(null);

  // Auto-expand textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [content]);

  return (
    <div ref={sectionRef} style={{ marginBottom: 32, scrollMarginTop: 80 }}>
      {/* Section heading */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <h2 style={{
          fontFamily: "'Source Serif 4', 'Georgia', serif",
          fontSize: 22, fontWeight: 600, color: '#0f172a', margin: 0,
        }}>
          {section.title}
        </h2>
        <span style={{
          padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600,
          background: badge.bg, color: badge.color,
        }}>
          {badge.label}
        </span>
      </div>

      {/* AI-generated disclaimer */}
      {isAiGenerated && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px', marginBottom: 12,
          background: '#fefce8', border: '1px solid #fde68a', borderRadius: 8,
          fontSize: 12, color: '#92400e',
        }}>
          <Sparkles style={{ width: 14, height: 14, color: '#d97706' }} />
          This content was generated by AI. Please review and edit before finalising.
        </div>
      )}

      {/* Content area */}
      {section.type === 'auto' ? (
        <div style={{
          padding: '24px', borderRadius: 8,
          border: '2px dashed #86efac', background: '#f0fdf4',
          color: '#15803d', fontSize: 14,
        }}>
          This section is automatically populated from client data.
        </div>
      ) : isGenerating ? (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          padding: '48px 24px', borderRadius: 8, background: '#faf5ff',
          border: '1px solid #e9d5ff', color: '#7c3aed',
        }}>
          <Loader2 className="animate-spin" style={{ width: 20, height: 20 }} />
          <span style={{ fontSize: 14, fontWeight: 500 }}>Generating content with AI...</span>
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder="Start writing, or click Generate with AI..."
          style={{
            width: '100%', minHeight: 80, padding: '16px',
            fontFamily: "'Source Serif 4', 'Georgia', serif",
            fontSize: 15, lineHeight: 1.75, color: '#1e293b',
            background: 'transparent', border: 'none', outline: 'none',
            resize: 'none', overflow: 'hidden',
            borderBottom: '1px solid #f1f5f9',
          }}
          onFocus={e => { e.target.style.borderBottom = '1px solid #c7d2fe'; }}
          onBlur={e => { e.target.style.borderBottom = '1px solid #f1f5f9'; }}
        />
      )}

      {/* AI Toolbar */}
      {isEditable && !isGenerating && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 0', marginTop: 4,
        }}>
          <button
            onClick={() => onGenerate('')}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '6px 14px', background: '#f5f3ff', color: '#7c3aed',
              border: '1px solid #e9d5ff', borderRadius: 6, fontSize: 12,
              fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            <Sparkles style={{ width: 12, height: 12 }} />
            Generate with AI
          </button>
          <input
            type="text"
            value={refineInput}
            onChange={(e) => onRefineInputChange(e.target.value)}
            placeholder="Refine instructions..."
            style={{
              flex: 1, padding: '6px 12px', fontSize: 12,
              border: '1px solid #e2e8f0', borderRadius: 6, outline: 'none',
              color: '#475569',
            }}
            onFocus={e => { e.target.style.borderColor = '#c7d2fe'; }}
            onBlur={e => { e.target.style.borderColor = '#e2e8f0'; }}
            onKeyDown={e => { if (e.key === 'Enter' && refineInput.trim()) onGenerate(refineInput); }}
          />
          <button
            onClick={() => { if (refineInput.trim()) onGenerate(refineInput); }}
            disabled={!refineInput.trim()}
            style={{
              padding: '6px 14px', background: refineInput.trim() ? '#4f46e5' : '#e2e8f0',
              color: refineInput.trim() ? '#fff' : '#94a3b8',
              border: 'none', borderRadius: 6, fontSize: 12,
              fontWeight: 600, cursor: refineInput.trim() ? 'pointer' : 'default',
              whiteSpace: 'nowrap',
            }}
          >
            Refine
          </button>
        </div>
      )}
    </div>
  );
}
