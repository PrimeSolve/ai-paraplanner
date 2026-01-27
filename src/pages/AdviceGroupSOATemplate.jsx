import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, GripVertical, AlertCircle, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import AdviceGroupSidebar from '../components/advicegroup/AdviceGroupSidebar';
import AdviceGroupHeader from '../components/advicegroup/AdviceGroupHeader';

export default function AdviceGroupSOATemplate() {
  const [template, setTemplate] = useState(null);
  const [adminTemplate, setAdminTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState(['getting-started']);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Load admin template (base)
      const adminTemplates = await base44.entities.SOATemplate.filter({ owner_type: 'admin' });
      if (adminTemplates[0]) {
        setAdminTemplate(adminTemplates[0]);
      }

      // Load group template if exists
      if (currentUser.advice_group_id) {
        const groupTemplates = await base44.entities.SOATemplate.filter({
          owner_type: 'advice_group',
          advice_group_id: currentUser.advice_group_id
        });
        if (groupTemplates[0]) {
          setTemplate(groupTemplates[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const sections = adminTemplate?.sections || [];
      
      if (template?.id) {
        await base44.entities.SOATemplate.update(template.id, { sections });
      } else {
        await base44.entities.SOATemplate.create({
          owner_type: 'advice_group',
          advice_group_id: user.advice_group_id,
          inherits_from_id: adminTemplate?.id,
          sections
        });
      }
      toast.success('Template saved successfully');
      loadTemplates();
    } catch (error) {
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const colors = {
    core: {
      navy: '#1e293b',
      slate: '#475569',
      slateLight: '#64748b',
      grey: '#94a3b8',
      greyLight: '#e2e8f0',
      offWhite: '#f8fafc',
      white: '#ffffff',
    },
    accent: {
      blue: '#3b82f6',
      blueDeep: '#1d4ed8',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      coral: '#f97316',
      purple: '#8b5cf6',
      pink: '#ec4899',
      cyan: '#06b6d4',
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
    },
    {
      id: 'client-info',
      label: 'Client Information',
      icon: '👤',
      sections: [
        { id: 'personal-details', label: 'Personal Details', enabled: true, required: true },
        { id: 'family-situation', label: 'Family Situation', enabled: true, required: false }
      ]
    }
  ];

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      background: colors.core.offWhite,
    }}>
      <AdviceGroupSidebar currentPage="template" />

      <div style={{
        marginLeft: '260px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      }}>
        <AdviceGroupHeader user={user} />

        {/* Main Content */}
        <div style={{
          flex: 1,
          padding: '32px',
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            border: `1px solid ${colors.core.greyLight}`,
            padding: '24px',
            marginBottom: '24px',
          }}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
            <div>
              <h1 style={{fontSize: '24px', fontWeight: 600, color: colors.core.navy, margin: 0}}>SOA Template</h1>
              <p style={{fontSize: '14px', color: colors.core.slateLight, marginTop: '8px', margin: 0}}>Customize sections for your advice group</p>
            </div>
            <Button onClick={handleSave} disabled={saving} style={{background: '#06b6d4', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 500}}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>

          <div style={{
          background: '#dbeafe',
          border: '1px solid #93c5fd',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px',
          display: 'flex',
          gap: '12px',
        }}>
          <AlertCircle style={{width: '20px', height: '20px', color: '#2563eb', flexShrink: 0, marginTop: '4px'}} />
          <div>
            <h4 style={{fontWeight: 600, color: '#1e3a8a', marginBottom: '8px'}}>Template Inheritance</h4>
            <p style={{fontSize: '14px', color: '#1e40af'}}>
              This template inherits from the admin default. Your advisers can further customize their own versions. Changes here apply to all advisers who haven't customized their templates.
            </p>
          </div>
        </div>

        <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
          {sectionGroups.map((group) => {
            const isExpanded = expandedGroups.includes(group.id);
            return (
              <Card key={group.id} style={{borderRadius: '12px', background: colors.core.white, border: `1px solid ${colors.core.greyLight}`}}>
                <div
                  onClick={() => toggleGroup(group.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '20px',
                    background: colors.core.offWhite,
                    cursor: 'pointer',
                    borderBottom: `1px solid ${colors.core.greyLight}`,
                  }}
                >
                  <GripVertical style={{width: '20px', height: '20px', color: colors.core.slateLight}} />
                  <div style={{width: '32px', height: '32px', background: '#cffafe', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px'}}>
                    {group.icon}
                  </div>
                  <div style={{flex: 1}}>
                    <div style={{fontWeight: 600}}>{group.label}</div>
                  </div>
                  <Badge variant="secondary">{group.sections.length} sections</Badge>
                  {isExpanded ? <ChevronUp style={{width: '20px', height: '20px'}} /> : <ChevronDown style={{width: '20px', height: '20px'}} />}
                </div>

                {isExpanded && (
                  <div style={{padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px'}}>
                    {group.sections.map((section) => (
                      <div key={section.id} style={{border: `1px solid ${colors.core.greyLight}`, borderRadius: '8px', padding: '16px'}}>
                        <div style={{display: 'flex', gap: '12px', marginBottom: '12px'}}>
                          <Checkbox checked={section.enabled} />
                          <div style={{flex: 1}}>
                            <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px'}}>
                              <span style={{fontWeight: 600}}>{section.label}</span>
                              {section.required && (
                                <Badge variant="destructive" style={{fontSize: '12px'}}>Required</Badge>
                              )}
                            </div>
                            <Textarea
                              placeholder="Add guidance or tips for this section..."
                              style={{marginTop: '8px', fontSize: '14px'}}
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
        </div>
      </div>
    </div>
  );
}