import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import AdminLayout from '../components/admin/AdminLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { GripVertical, ChevronDown, Plus, Edit, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminTemplate() {
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState(['getting-started', 'client-info', 'financial-position']);

  const defaultSections = [
    {
      group: 'welcome-intro',
      groupLabel: 'Welcome & Introduction',
      icon: '👋',
      sections: [
        { id: 'cover-letter', label: 'Cover Letter', description: 'Personalised introduction letter to the client', status: 'configured' },
        { id: 'cover-page', label: 'Cover Page', description: 'Title page with client and adviser details', status: 'configured' },
        { id: 'how-to-read', label: 'How to Read This Document', description: 'Guide for navigating the SOA', status: 'needs-comment' }
      ]
    },
    {
      group: 'executive-summary',
      groupLabel: 'Executive Summary & Scope',
      icon: '📋',
      sections: [
        { id: 'executive-summary', label: 'Executive Summary', description: 'High-level overview of recommendations', status: 'configured' },
        { id: 'subject-matter', label: 'Subject Matter - Financial Needs & Objectives', description: "Client's stated goals and objectives", status: 'needs-comment' }
      ]
    },
    {
      group: 'financial-analysis',
      groupLabel: 'Financial Analysis',
      icon: '💰',
      sections: [
        { id: 'financial-position', label: 'Financial Position', description: 'Assets, liabilities and net worth analysis', status: 'configured' },
        { id: 'cash-flow', label: 'Cash Flow Analysis', description: 'Income and expenses overview', status: 'configured' },
        { id: 'insurance-needs', label: 'Insurance Needs Analysis', description: 'Protection gap analysis', status: 'configured' }
      ]
    },
    {
      group: 'recommendations',
      groupLabel: 'Recommendations & Strategy',
      icon: '🎯',
      sections: [
        { id: 'investment-strategy', label: 'Investment Strategy', description: 'Asset allocation and portfolio approach', status: 'configured' },
        { id: 'product-recommendations', label: 'Product Recommendations', description: 'Specific products and platforms', status: 'needs-comment' },
        { id: 'insurance-recommendations', label: 'Insurance Recommendations', description: 'Insurance products and coverage', status: 'configured' }
      ]
    },
    {
      group: 'implementation',
      groupLabel: 'Implementation',
      icon: '✅',
      sections: [
        { id: 'action-plan', label: 'Action Plan', description: 'Steps to implement advice', status: 'configured' },
        { id: 'timeline', label: 'Implementation Timeline', description: 'Proposed timeframe for actions', status: 'configured' }
      ]
    },
    {
      group: 'assumptions',
      groupLabel: 'Assumptions & Basis',
      icon: '📊',
      sections: [
        { id: 'financial-assumptions', label: 'Financial Assumptions', description: 'Market returns and economic assumptions', status: 'configured' },
        { id: 'basis-of-advice', label: 'Basis of Advice', description: 'How the advice was developed', status: 'needs-comment' }
      ]
    }
  ];

  useEffect(() => {
    loadTemplate();
  }, []);

  const loadTemplate = async () => {
    try {
      const templates = await base44.entities.SOATemplate.filter({ owner_type: 'admin' });
      if (templates[0]) {
        setTemplate(templates[0]);
      }
    } catch (error) {
      console.error('Failed to load template:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (template?.id) {
        await base44.entities.SOATemplate.update(template.id, {
          sections: defaultSections
        });
      } else {
        await base44.entities.SOATemplate.create({
          owner_type: 'admin',
          sections: defaultSections
        });
      }
      toast.success('Template saved successfully');
    } catch (error) {
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev =>
      prev.includes(groupId) ? prev.filter(g => g !== groupId) : [...prev, groupId]
    );
  };

  return (
    <AdminLayout currentPage="AdminTemplate">
      <div className="bg-white border-b border-slate-200 px-8 py-6 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-['Fraunces'] font-medium text-slate-800">Default SOA Template</h1>
            <p className="text-sm text-slate-600 mt-1">Configure the base template inherited by all groups</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">Preview</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
              {saving ? 'Saving...' : 'Save Template'}
            </Button>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-0.5">System Default Template</h4>
            <p className="text-sm text-blue-700">
              This template is the baseline for all SOAs. Advice Groups can customize from here, and advisers can override if permitted.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4 mb-6">
          <div className="flex items-center gap-3 bg-white rounded-lg border border-slate-200 px-6 py-3">
            <span className="text-2xl font-bold text-slate-800">{defaultSections.reduce((acc, g) => acc + g.sections.length, 0)}</span>
            <span className="text-sm text-slate-600">Total sections</span>
          </div>
          <div className="flex items-center gap-3 bg-white rounded-lg border border-slate-200 px-6 py-3">
            <span className="text-2xl font-bold text-green-600">{defaultSections.reduce((acc, g) => acc + g.sections.filter(s => s.status === 'configured').length, 0)}</span>
            <span className="text-sm text-slate-600">Configured</span>
          </div>
          <div className="flex items-center gap-3 bg-white rounded-lg border border-slate-200 px-6 py-3">
            <span className="text-2xl font-bold text-orange-600">{defaultSections.reduce((acc, g) => acc + g.sections.filter(s => s.status === 'needs-comment').length, 0)}</span>
            <span className="text-sm text-slate-600">Pending</span>
          </div>
        </div>

        {/* Section Groups */}
        <div className="space-y-3">
          {defaultSections.map((group) => {
            const isExpanded = expandedGroups.includes(group.group);
            const configuredCount = group.sections.filter(s => s.status === 'configured').length;
            return (
              <div key={group.group} className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleGroup(group.group)}
                  className="w-full flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                >
                  <GripVertical className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-base flex-shrink-0">
                    {group.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-slate-800">{group.groupLabel}</div>
                  </div>
                  <span className="text-xs font-medium text-slate-600 bg-white px-2.5 py-1 rounded-full">
                    {group.sections.length} sections
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-200 p-4 space-y-3">
                    {group.sections.map((section) => (
                      <div key={section.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-slate-800">{section.label}</div>
                          <div className="text-xs text-slate-600 mt-0.5">{section.description}</div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {section.status === 'configured' && (
                            <span className="text-xs font-semibold text-green-700 bg-green-100 px-2.5 py-1 rounded">
                              ✓ Configured
                            </span>
                          )}
                          {section.status === 'needs-comment' && (
                            <span className="text-xs font-semibold text-orange-700 bg-orange-100 px-2.5 py-1 rounded">
                              ⚠ Needs comment
                            </span>
                          )}
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                            <Edit className="w-3.5 h-3.5 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    ))}
                    <button className="w-full py-2 text-sm font-medium text-blue-600 hover:text-blue-700 mt-2">
                      <Plus className="w-4 h-4 inline mr-1" />
                      Add Custom Section
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}