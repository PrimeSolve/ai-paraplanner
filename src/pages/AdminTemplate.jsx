import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import AdminLayout from '../components/admin/AdminLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminTemplate() {
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState(['getting-started', 'client-info', 'financial-position']);

  const defaultSections = [
    {
      group: 'getting-started',
      groupLabel: 'Getting Started',
      groupIcon: '🚀',
      sections: [
        { id: 'executive-summary', label: 'Executive Summary', enabled: true, required: true, tips: '' },
        { id: 'scope-of-advice', label: 'Scope of Advice', enabled: true, required: true, tips: '' },
        { id: 'basis-of-advice', label: 'Basis of Advice', enabled: true, required: true, tips: '' }
      ]
    },
    {
      group: 'client-info',
      groupLabel: 'Client Information',
      groupIcon: '👤',
      sections: [
        { id: 'personal-details', label: 'Personal Details', enabled: true, required: true, tips: '' },
        { id: 'family-situation', label: 'Family Situation', enabled: true, required: false, tips: '' },
        { id: 'employment', label: 'Employment & Income', enabled: true, required: true, tips: '' }
      ]
    },
    {
      group: 'financial-position',
      groupLabel: 'Financial Position',
      groupIcon: '💰',
      sections: [
        { id: 'assets-liabilities', label: 'Assets & Liabilities', enabled: true, required: true, tips: '' },
        { id: 'income-expenses', label: 'Income & Expenses', enabled: true, required: true, tips: '' },
        { id: 'superannuation', label: 'Superannuation', enabled: true, required: true, tips: '' },
        { id: 'insurance', label: 'Insurance', enabled: true, required: true, tips: '' }
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
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <span className="text-xl">ℹ️</span>
          <div>
            <h4 className="font-semibold text-indigo-900 mb-1">Template Inheritance</h4>
            <p className="text-sm text-indigo-700">
              This is the master template. Advice groups inherit these sections and can customize them. Changes here affect all groups unless they've overridden specific sections.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-6 bg-white rounded-xl border border-slate-200 p-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-['Fraunces'] font-semibold text-indigo-600">
              {defaultSections.reduce((acc, g) => acc + g.sections.length, 0)}
            </span>
            <span className="text-sm text-slate-600">Total Sections</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-['Fraunces'] font-semibold text-green-600">
              {defaultSections.reduce((acc, g) => acc + g.sections.filter(s => s.enabled).length, 0)}
            </span>
            <span className="text-sm text-slate-600">Enabled</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-['Fraunces'] font-semibold text-amber-600">
              {defaultSections.reduce((acc, g) => acc + g.sections.filter(s => s.required).length, 0)}
            </span>
            <span className="text-sm text-slate-600">Required</span>
          </div>
        </div>

        {/* Section Groups */}
        <div className="space-y-4">
          {defaultSections.map((group) => {
            const isExpanded = expandedGroups.includes(group.group);
            return (
              <Card key={group.group}>
                <div
                  onClick={() => toggleGroup(group.group)}
                  className="flex items-center gap-3 p-5 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <GripVertical className="w-5 h-5 text-slate-400" />
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-lg">
                    {group.groupIcon}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{group.groupLabel}</div>
                  </div>
                  <Badge variant="secondary">{group.sections.length} sections</Badge>
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>

                {isExpanded && (
                  <div className="p-4 space-y-3">
                    {group.sections.map((section) => (
                      <div key={section.id} className="border border-slate-200 rounded-lg p-4">
                        <div className="flex items-start gap-3 mb-3">
                          <Checkbox checked={section.enabled} className="mt-1" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold">{section.label}</span>
                              {section.required && (
                                <Badge variant="destructive" className="text-xs">Required</Badge>
                              )}
                            </div>
                            <Textarea
                              placeholder="Add guidance or tips for this section..."
                              value={section.tips}
                              className="mt-2 text-sm"
                              rows={2}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}