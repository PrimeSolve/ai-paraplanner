import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import SOARequestLayout from '../components/soa/SOARequestLayout';
import { ChevronDown, ChevronRight, GripVertical, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';

// ==========================================================================
// SECTION DEFINITIONS
// ==========================================================================
const SOA_SECTION_GROUPS = {
  welcome: {
    id: 'welcome',
    title: 'Welcome & Introduction',
    sections: [
      { id: 'coverLetter', name: 'Cover Letter', hint: 'Personalised introduction letter to the client' },
      { id: 'coverPage', name: 'Cover Page', hint: 'Title page with client and adviser details' },
      { id: 'howToRead', name: 'How to Read This Document', hint: 'Guide for navigating the SOA' }
    ]
  },
  summary: {
    id: 'summary',
    title: 'Executive Summary & Scope',
    sections: [
      { id: 'execSummary', name: 'Executive Summary', hint: 'High-level overview of recommendations' },
      { id: 'subjectMatter', name: 'Subject Matter - Financial Needs & Objectives', hint: "Client's stated goals and objectives" },
      { id: 'scopeOfAdvice', name: 'Scope of Advice', hint: "What this advice covers and doesn't cover" }
    ]
  },
  circumstances: {
    id: 'circumstances',
    title: 'Relevant Circumstances & Current Situation',
    sections: [
      { id: 'relevantCircumstances', name: 'Relevant Circumstances', hint: 'Key factors considered in this advice' },
      { id: 'personalInfo', name: 'Personal Information & Current Situation', hint: 'Client demographics and life situation', source: 'Fact Find' },
      { id: 'dependants', name: 'Dependants', hint: "Information about client's dependants", source: 'Fact Find' },
      { id: 'insuranceInForce', name: 'Personal Insurance Policies in Force', hint: 'Existing insurance coverage', source: 'Insurance' },
      { id: 'estatePlanning', name: 'Estate Planning', hint: 'Current estate planning arrangements' },
      { id: 'financialPosition', name: 'Current Financial Position', hint: 'Assets, liabilities, and net worth', source: 'Fact Find' },
      { id: 'cashflowStatement', name: 'Cash Flow Statement', hint: 'Income and expenses breakdown', source: 'Cashflow Model' },
      { id: 'taxPosition', name: 'Tax Position', hint: 'Current tax situation overview' }
    ]
  },
  riskProfile: {
    id: 'riskProfile',
    title: 'Risk Profile',
    sections: [
      { id: 'riskProfileSection', name: 'Risk Profile', hint: "Client's risk tolerance assessment", source: 'Fact Find' },
      { id: 'varianceToRisk', name: 'Variance to Risk Profile', hint: 'Explanation if recommendations differ from profile' }
    ]
  },
  strategies: {
    id: 'strategies',
    title: 'Recommended Strategies',
    sections: [
      { id: 'wealthProtection', name: 'Wealth & Asset Protection', hint: 'Insurance and protection strategies' },
      { id: 'insuranceNeedsAnalysis', name: 'Insurance Needs Analysis', hint: 'Detailed insurance requirements analysis', source: 'Insurance' },
      { id: 'recommendedInsuranceCover', name: 'Recommended/Elected Insurance Cover', hint: 'Proposed insurance coverage and rationale' },
      { id: 'debtManagement', name: 'Debt Management', hint: 'Strategies for managing debt' },
      { id: 'wealthAccumulation', name: 'Wealth Accumulation', hint: 'Savings and investment strategies' },
      { id: 'retirementPlanning', name: 'Retirement Planning', hint: 'Strategies for retirement preparation' },
      { id: 'socialSecurity', name: 'Social Security', hint: 'Centrelink and government benefits' },
      { id: 'estatePlanningStrategy', name: 'Estate Planning Strategy', hint: 'Strategies for estate and succession' }
    ]
  },
  products: {
    id: 'products',
    title: 'Product Recommendations',
    sections: [
      { id: 'recommendedInsuranceProduct', name: 'Recommended Insurance Product', hint: 'Specific insurance product recommendation' },
      { id: 'insuranceSuperComparison', name: 'Insurance Super Comparison', hint: 'Inside vs outside super analysis' },
      { id: 'recommendedWealthProduct', name: 'Recommended Wealth Accumulation / Retirement Product', hint: 'Investment and retirement product recommendation' },
      { id: 'recommendedPortfolio', name: 'Recommended Portfolio', hint: 'Investment portfolio recommendation', source: 'Portfolio' },
      { id: 'assetAllocation', name: 'Asset Allocation', hint: 'Target asset allocation breakdown', source: 'Portfolio' }
    ]
  },
  fees: {
    id: 'fees',
    title: 'Fees & Disclosure',
    sections: [
      { id: 'adviserFees', name: 'Adviser Fee & Remuneration Disclosure', hint: 'Full fee disclosure' },
      { id: 'ongoingFees', name: 'Ongoing Advice & Service Fees', hint: 'Recurring fee arrangements' },
      { id: 'commissions', name: 'Commissions', hint: 'Commission disclosure' },
      { id: 'disclaimer', name: 'Disclaimer', hint: 'Legal disclaimers' },
      { id: 'howToProceed', name: 'How to Proceed / Authority to Proceed', hint: 'Next steps and sign-off section' }
    ]
  },
  appendices: {
    id: 'appendices',
    title: 'Appendices',
    collapsed: true,
    sections: [
      { id: 'appendixPDS', name: 'Product Disclosure Statements', hint: 'Links to relevant PDS documents', noTips: true },
      { id: 'appendixProjections', name: 'Projections & Assumptions', hint: 'Detailed projection methodology', source: 'Assumptions' },
      { id: 'appendixInsuranceDefs', name: 'Insurance Definitions', hint: 'Glossary of insurance terms', noTips: true },
      { id: 'appendixSuperTax', name: 'Taxation of Superannuation Benefits', hint: 'Super tax rules reference', noTips: true },
      { id: 'appendixResearch', name: 'Research Reports', hint: 'Supporting research documentation', noTips: true }
    ]
  }
};

const DEFAULT_GROUP_ORDER = ['welcome', 'summary', 'circumstances', 'riskProfile', 'strategies', 'products', 'fees', 'appendices'];

// ==========================================================================
// MAIN COMPONENT
// ==========================================================================
export default function SOARequestDetails() {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [soaRequest, setSOARequest] = useState(null);
  
  // Form state
  const [referenceNumber, setReferenceNumber] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [adviserName, setAdviserName] = useState('');
  const [adviserArn, setAdviserArn] = useState('');
  const [afslNumber, setAfslNumber] = useState('');
  const [licenseeName, setLicenseeName] = useState('');
  const [adviserPhone, setAdviserPhone] = useState('');
  
  // Section state
  const [groupOrder, setGroupOrder] = useState(DEFAULT_GROUP_ORDER);
  const [sections, setSections] = useState({});
  const [tips, setTips] = useState({});
  const [collapsedGroups, setCollapsedGroups] = useState({ appendices: true });
  const [expandedTips, setExpandedTips] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const id = urlParams.get('id');
      
      if (!id) {
        toast.error('No SOA Request ID provided');
        setLoading(false);
        return;
      }
      
      const requests = await base44.entities.SOARequest.filter({ id });
      if (!requests[0]) {
        toast.error('SOA Request not found');
        setLoading(false);
        return;
      }
      
      const soaReq = requests[0];
      setSOARequest(soaReq);
      
      const details = soaReq.soa_details || {};
      
      setReferenceNumber(details.reference_number || '');
      setDueDate(details.due_date || '');
      setAdviserName(details.adviser_name || '');
      setAdviserArn(details.adviser_arn || '');
      setAfslNumber(details.afsl_number || '');
      setLicenseeName(details.licensee_name || '');
      setAdviserPhone(details.adviser_phone || '');
      
      setGroupOrder(details.group_order || DEFAULT_GROUP_ORDER);
      setSections(details.sections || getDefaultSections());
      setTips(details.tips || {});
      setCollapsedGroups(details.collapsed_groups || { appendices: true });
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const getDefaultSections = () => {
    const defaults = {};
    Object.values(SOA_SECTION_GROUPS).forEach(group => {
      group.sections.forEach(section => {
        defaults[section.id] = true;
      });
    });
    return defaults;
  };

  const toggleSection = (sectionId) => {
    setSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const toggleTipExpanded = (sectionId) => {
    setExpandedTips(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const updateTip = (sectionId, value) => {
    setTips(prev => ({
      ...prev,
      [sectionId]: value
    }));
  };

  const toggleGroupCollapsed = (groupId) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const getStats = () => {
    const includedCount = Object.values(sections).filter(Boolean).length;
    const tipsCount = Object.values(tips).filter(t => t && t.trim()).length;
    return { includedCount, tipsCount };
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.SOARequest.update(soaRequest.id, {
        soa_details: {
          reference_number: referenceNumber,
          due_date: dueDate,
          adviser_name: adviserName,
          adviser_arn: adviserArn,
          afsl_number: afslNumber,
          licensee_name: licenseeName,
          adviser_phone: adviserPhone,
          group_order: groupOrder,
          sections,
          tips,
          collapsed_groups: collapsedGroups
        }
      });
      toast.success('SOA details saved');
      navigate(createPageUrl('SOARequestReview') + `?id=${soaRequest.id}`);
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  const stats = getStats();

  return (
    <SOARequestLayout currentSection="details" soaRequest={soaRequest}>
      <div className="flex-1 overflow-auto bg-slate-50 p-6">
        <div className="w-full">
          {/* Dark Banner */}
          <div style={{ backgroundColor: '#1E293B', padding: '24px 32px', borderRadius: '16px 16px 0 0' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#FFFFFF', margin: '0 0 4px 0', letterSpacing: '-0.01em' }}>
              SOA Details
            </h1>
            <p style={{ fontSize: '14px', fontWeight: 400, color: '#94A3B8', margin: 0 }}>
              Configure sections, reorder, and provide tips for generating the SOA.
            </p>
          </div>

          {/* White Content Card */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '0 0 16px 16px', border: '1px solid #E2E8F0', borderTop: 'none' }}>
            <div className="p-6 space-y-6">
            {/* Scope Notice */}
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <span className="text-xl">💡</span>
            <div>
              <h4 className="font-bold text-amber-900">Intelligent Section Inclusion</h4>
              <p className="text-sm text-amber-800 mt-1">
                Sections are automatically included or excluded based on your <strong>Scope of Advice</strong> selections.
                You can manually override these defaults below.
              </p>
            </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 gap-4">
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-blue-700">{stats.includedCount}</div>
                <div className="text-sm text-blue-600">Sections included</div>
              </CardContent>
            </Card>
            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-purple-700">{stats.tipsCount}</div>
                <div className="text-sm text-purple-600">With tips</div>
              </CardContent>
            </Card>
            </div>

            {/* SOA Reference Information */}
            <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">📋</span>
                SOA Reference Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>SOA Reference Number</Label>
                  <Input
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="e.g. SOA-2025-001"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Preferred Due Date</Label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
            </Card>

            {/* Adviser Details */}
            <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center">👤</span>
                Adviser Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Adviser Name</Label>
                  <Input
                    value={adviserName}
                    onChange={(e) => setAdviserName(e.target.value)}
                    placeholder="Full name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>ARN</Label>
                  <Input
                    value={adviserArn}
                    onChange={(e) => setAdviserArn(e.target.value)}
                    placeholder="e.g. 123456"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>AFSL Number</Label>
                  <Input
                    value={afslNumber}
                    onChange={(e) => setAfslNumber(e.target.value)}
                    placeholder="e.g. 234567"
                    className="mt-1"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Practice / Licensee Name</Label>
                  <Input
                    value={licenseeName}
                    onChange={(e) => setLicenseeName(e.target.value)}
                    placeholder="e.g. ABC Financial Planning Pty Ltd"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Adviser Phone</Label>
                  <Input
                    value={adviserPhone}
                    onChange={(e) => setAdviserPhone(e.target.value)}
                    placeholder="e.g. 0400 000 000"
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
            </Card>

            {/* SOA Sections */}
            <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">📑</span>
                SOA Sections
              </CardTitle>
              <p className="text-sm text-slate-600 mt-2">
                <strong>Include</strong> – Section appears in SOA &nbsp;|&nbsp;
                <strong>Tips</strong> – Guide the AI on how to write this section
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {groupOrder.map(groupId => {
                const group = SOA_SECTION_GROUPS[groupId];
                if (!group) return null;
                
                const isCollapsed = collapsedGroups[groupId];
                
                return (
                  <div key={groupId} className="border border-slate-200 rounded-lg overflow-hidden">
                    {/* Group Header */}
                    <div
                      className="flex items-center gap-3 px-4 py-3 bg-slate-100 cursor-pointer hover:bg-slate-200 transition-colors"
                      onClick={() => toggleGroupCollapsed(groupId)}
                    >
                      <GripVertical className="w-4 h-4 text-slate-400" />
                      {isCollapsed ? (
                        <ChevronRight className="w-5 h-5 text-slate-500" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-500" />
                      )}
                      <span className="font-semibold text-slate-800 flex-1">{group.title}</span>
                      <span className="text-xs bg-slate-300 text-slate-700 px-2 py-1 rounded-full">
                        {group.sections.length} sections
                      </span>
                    </div>
                    
                    {/* Group Content */}
                    {!isCollapsed && (
                      <div className="divide-y divide-slate-100">
                        {group.sections.map(section => (
                          <SectionItem
                            key={section.id}
                            section={section}
                            included={sections[section.id] !== false}
                            tipText={tips[section.id] || ''}
                            tipExpanded={expandedTips[section.id]}
                            onToggleInclude={() => toggleSection(section.id)}
                            onToggleTip={() => toggleTipExpanded(section.id)}
                            onUpdateTip={(value) => updateTip(section.id, value)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

            {/* Footer */}
            <div className="flex justify-between items-center" style={{ padding: '24px 32px', borderTop: '1px solid #E2E8F0' }}>
              <Button variant="outline" onClick={() => navigate(createPageUrl('SOARequestAssumptions') + `?id=${soaRequest?.id}`)}>
                ◀ Back
              </Button>
              <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 min-w-[140px]">
                {saving ? 'Saving...' : 'Save & Next ▶'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </SOARequestLayout>
  );
}

// ==========================================================================
// SECTION ITEM COMPONENT
// ==========================================================================
function SectionItem({ section, included, tipText, tipExpanded, onToggleInclude, onToggleTip, onUpdateTip }) {
  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-3">
        <GripVertical className="w-4 h-4 text-slate-300" />
        
        <div className="flex-1 min-w-0">
          <div className="font-medium text-slate-800">{section.name}</div>
          <div className="text-sm text-slate-500 flex items-center gap-2">
            {section.hint}
            {section.source && (
              <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                📥 {section.source}
              </span>
            )}
          </div>
        </div>
        
        <button
          onClick={onToggleInclude}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            included
              ? 'bg-green-100 text-green-700 border border-green-300'
              : 'bg-slate-100 text-slate-500 border border-slate-300'
          }`}
        >
          {included ? '✓ Include' : '— Exclude'}
        </button>
        
        {!section.noTips && (
          <button
            onClick={onToggleTip}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tipExpanded || tipText
                ? 'bg-amber-100 text-amber-700 border border-amber-300'
                : 'bg-slate-100 text-slate-500 border border-slate-300'
            }`}
          >
            <Lightbulb className="w-4 h-4 inline mr-1" />
            Tips
          </button>
        )}
      </div>
      
      {tipExpanded && !section.noTips && (
        <div className="mt-3 ml-7 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-2 mb-2 text-xs text-amber-700">
            <Lightbulb className="w-4 h-4 flex-shrink-0" />
            <span>Help the AI write this section better. These tips guide the content but won't appear in the final SOA.</span>
          </div>
          <Textarea
            value={tipText}
            onChange={(e) => onUpdateTip(e.target.value)}
            placeholder="e.g. Emphasise the tax benefits, use simple language, mention the client's specific concern about..."
            rows={2}
            className="text-sm"
          />
        </div>
      )}
    </div>
  );
}