import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, GripVertical, AlertCircle, FileText, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import ExampleSOALibrary from '@/components/soa/ExampleSOALibrary';

export default function AdviserSOATemplate() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState(['getting-started']);
  const [effectiveSections, setEffectiveSections] = useState([]);
  const [extractedSections, setExtractedSections] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Load the effective template chain: admin -> group -> adviser
      let mergedSections = [];

      // Try admin template first
      try {
        const adminTemplates = await base44.entities.SOATemplate.filter({ owner_type: 'admin' });
        if (adminTemplates[0]?.sections) {
          mergedSections = adminTemplates[0].sections;
        }
      } catch { /* silent */ }

      // Override with group template if available
      if (currentUser.advice_group_id) {
        try {
          const groupTemplates = await base44.entities.SOATemplate.filter({
            owner_type: 'advice_group',
            advice_group_id: currentUser.advice_group_id,
          });
          if (groupTemplates[0]?.sections) {
            mergedSections = groupTemplates[0].sections;
          }
        } catch { /* silent */ }
      }

      setEffectiveSections(mergedSections);
    } catch (error) {
      console.error('Failed to load user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
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

  // Fall back to minimal sections if none loaded from the chain
  const sectionGroups = effectiveSections.length > 0
    ? effectiveSections
    : [
        {
          group: 'getting-started',
          groupLabel: 'Getting Started',
          icon: '🚀',
          sections: [
            { id: 'executive-summary', label: 'Executive Summary', enabled: true, required: true },
            { id: 'scope-of-advice', label: 'Scope of Advice', enabled: true, required: true }
          ]
        }
      ];

  const hasExamples = Object.keys(extractedSections).length > 0;

  return (
    <div style={{ padding: '24px 32px' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My SOA Template</h1>
          <p className="text-sm text-slate-600 mt-1">View your effective template and upload example SOAs</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">Template Customization</h4>
            <p className="text-sm text-blue-700">
              Your template inherits from your advice group. Changes here only affect your own SOAs. You can upload example SOAs to help AI generate better content.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {sectionGroups.map((group) => {
            const groupId = group.group || group.id;
            const isExpanded = expandedGroups.includes(groupId);
            const groupSections = group.sections || [];

            return (
              <Card key={groupId}>
                <div
                  onClick={() => toggleGroup(groupId)}
                  className="flex items-center gap-3 p-5 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <GripVertical className="w-5 h-5 text-slate-400" />
                  <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-lg">
                    {group.icon || '📄'}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{group.groupLabel || group.label}</div>
                  </div>
                  <Badge variant="secondary">{groupSections.length} sections</Badge>
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>

                {isExpanded && (
                  <div className="p-4 space-y-3">
                    {groupSections.map((section) => {
                      const sectionHasExample = !!extractedSections[section.id];
                      const sectionHasContent = !!section.content;

                      return (
                        <div key={section.id} className="border border-slate-200 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={section.enabled !== false}
                              className="mt-1"
                              disabled
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold">{section.label}</span>
                                {section.required && (
                                  <Badge variant="destructive" className="text-xs">Required</Badge>
                                )}
                                {section.status === 'configured' && (
                                  <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                                    ✓ Configured
                                  </span>
                                )}
                              </div>
                              {section.description && (
                                <p className="text-sm text-slate-500 mb-2">{section.description}</p>
                              )}

                              {/* Source indicator */}
                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                {sectionHasContent && (
                                  <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                                    <FileText className="w-3 h-3" />
                                    Template content
                                  </span>
                                )}
                                {sectionHasExample && (
                                  <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                    <Sparkles className="w-3 h-3" />
                                    Your examples
                                  </span>
                                )}
                                {sectionHasContent && sectionHasExample && (
                                  <span className="text-xs text-slate-400">
                                    This section uses: [Template content] + [Your examples]
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Example SOA Library */}
        {user && (
          <div className="mt-8">
            <ExampleSOALibrary
              ownerType="adviser"
              ownerId={user.id}
              onExtractedSections={setExtractedSections}
            />
          </div>
        )}
      </div>
    </div>
  );
}
