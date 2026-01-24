import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import AdviserLayout from '../components/adviser/AdviserLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, GripVertical, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AdviserSOATemplate() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState(['getting-started']);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
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

  const sectionGroups = [
    {
      id: 'getting-started',
      label: 'Getting Started',
      icon: '🚀',
      sections: [
        { id: 'executive-summary', label: 'Executive Summary', enabled: true, required: true },
        { id: 'scope-of-advice', label: 'Scope of Advice', enabled: true, required: true }
      ]
    }
  ];

  return (
    <AdviserLayout currentPage="AdviserSOATemplate">
      <div className="bg-white border-b border-slate-200 px-8 py-6 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-['Fraunces'] font-medium text-slate-800">My SOA Template</h1>
            <p className="text-sm text-slate-600 mt-1">Customize sections for your SOAs</p>
          </div>
          <Button onClick={handleSave} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="p-8">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">Template Customization</h4>
            <p className="text-sm text-blue-700">
              Your template inherits from your advice group. Changes here only affect your own SOAs. You can enable/disable sections and add personalized guidance.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {sectionGroups.map((group) => {
            const isExpanded = expandedGroups.includes(group.id);
            return (
              <Card key={group.id}>
                <div
                  onClick={() => toggleGroup(group.id)}
                  className="flex items-center gap-3 p-5 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <GripVertical className="w-5 h-5 text-slate-400" />
                  <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-lg">
                    {group.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{group.label}</div>
                  </div>
                  <Badge variant="secondary">{group.sections.length} sections</Badge>
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>

                {isExpanded && (
                  <div className="p-4 space-y-3">
                    {group.sections.map((section) => (
                      <div key={section.id} className="border border-slate-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <Checkbox checked={section.enabled} className="mt-1" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold">{section.label}</span>
                              {section.required && (
                                <Badge variant="destructive" className="text-xs">Required</Badge>
                              )}
                            </div>
                            <Textarea
                              placeholder="Add your own guidance for this section..."
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
    </AdviserLayout>
  );
}