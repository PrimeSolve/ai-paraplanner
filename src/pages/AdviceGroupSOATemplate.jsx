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
  const [adminTemplate, setAdminTemplate] = useState(null);
  const [groupTemplate, setGroupTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState(['welcome-intro', 'executive-summary']);
  const [sections, setSections] = useState([]);

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
        { id: 'executive-summary', label: 'Executive Summary', description: 'High-level overview of recommendations', status: 'configured', badge: null },
        { id: 'subject-matter', label: 'Subject Matter - Financial Needs & Objectives', description: "Client's stated goals and objectives", status: 'needs-comment', badge: null },
        { id: 'scope-of-advice', label: 'Scope of Advice', description: "What this advice covers and doesn't cover", status: 'needs-comment', badge: null }
      ]
    },
    {
      group: 'relevant-circumstances',
      groupLabel: 'Relevant Circumstances & Current Situation',
      icon: '👤',
      sections: [
        { id: 'relevant-circumstances', label: 'Relevant Circumstances', description: 'Key factors considered', status: 'needs-comment', badge: null },
        { id: 'personal-information', label: 'Personal Information', description: 'Demographics and life situation', status: 'needs-comment', badge: 'Fact Find' },
        { id: 'dependants', label: 'Dependants', description: "Client's dependants", status: 'needs-comment', badge: 'Fact Find' },
        { id: 'insurance-in-force', label: 'Insurance in Force', description: 'Existing coverage', status: 'needs-comment', badge: 'Insurance' },
        { id: 'estate-planning', label: 'Estate Planning', description: 'Current arrangements', status: 'needs-comment', badge: null },
        { id: 'financial-position', label: 'Financial Position', description: 'Assets and liabilities', status: 'needs-comment', badge: 'Fact Find' },
        { id: 'cash-flow-statement', label: 'Cash Flow Statement', description: 'Income and expenses', status: 'needs-comment', badge: 'Cashflow' },
        { id: 'tax-position', label: 'Tax Position', description: 'Current tax situation', status: 'needs-comment', badge: null }
      ]
    },
    {
      group: 'recommendations',
      groupLabel: 'Recommended Strategies',
      icon: '💡',
      sections: [
        { id: 'wealth-asset-protection', label: 'Wealth & Asset Protection', description: 'Insurance strategies', status: 'needs-comment', badge: null },
        { id: 'insurance-needs-analysis', label: 'Insurance Needs Analysis', description: 'Requirements analysis', status: 'needs-comment', badge: 'Insurance' },
        { id: 'recommended-insurance-cover', label: 'Recommended Insurance Cover', description: 'Coverage amounts', status: 'needs-comment', badge: 'Insurance' },
        { id: 'debt-management', label: 'Debt Management', description: 'Debt strategies', status: 'needs-comment', badge: null },
        { id: 'wealth-accumulation', label: 'Wealth Accumulation', description: 'Investment strategies', status: 'needs-comment', badge: null },
        { id: 'retirement-planning', label: 'Retirement Planning', description: 'Retirement preparation', status: 'needs-comment', badge: null }
      ]
    },
    {
      group: 'product-recommendations',
      groupLabel: 'Product Recommendations',
      icon: '🎯',
      sections: [
        { id: 'recommended-insurance-product', label: 'Recommended Insurance Product', description: 'Insurance recommendations', status: 'needs-comment', badge: 'Products' },
        { id: 'recommended-wealth-product', label: 'Recommended Wealth Product', description: 'Investment products', status: 'needs-comment', badge: 'Products' },
        { id: 'recommended-portfolio', label: 'Recommended Portfolio', description: 'Portfolio recommendation', status: 'needs-comment', badge: 'Portfolio' }
      ]
    },
    {
      group: 'fees-disclosure',
      groupLabel: 'Fees & Disclosure',
      icon: '💰',
      sections: [
        { id: 'adviser-fee-disclosure', label: 'Adviser Fee Disclosure', description: 'Full fee disclosure', status: 'needs-comment', badge: null },
        { id: 'commissions', label: 'Commissions', description: 'Commission disclosure', status: 'needs-comment', badge: null },
        { id: 'disclaimer', label: 'Disclaimer', description: 'Legal disclaimers', status: 'needs-comment', badge: null },
        { id: 'how-to-proceed', label: 'How to Proceed', description: 'Next steps', status: 'needs-comment', badge: null }
      ]
    }
  ];

  useEffect(() => {
    setSections(defaultSections);
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const adminTemplates = await base44.entities.SOATemplate.filter({ owner_type: 'admin' });
      if (adminTemplates[0]) {
        setAdminTemplate(adminTemplates[0]);
      }

      if (currentUser.advice_group_id) {
        const groupTemplates = await base44.entities.SOATemplate.filter({
          owner_type: 'advice_group',
          advice_group_id: currentUser.advice_group_id
        });
        if (groupTemplates[0]) {
          setGroupTemplate(groupTemplates[0]);
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
      if (groupTemplate?.id) {
        await base44.entities.SOATemplate.update(groupTemplate.id, { sections });
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

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev =>
      prev.includes(groupId) ? prev.filter(g => g !== groupId) : [...prev, groupId]
    );
  };

  const handleDragEnd = (result) => {
    const { source, destination, type, draggableId } = result;
    
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const newSections = Array.from(sections);

    if (type === 'GROUP') {
      const [movedGroup] = newSections.splice(source.index, 1);
      newSections.splice(destination.index, 0, movedGroup);
      setSections(newSections);
    } else if (type === 'SECTION') {
      const sourceGroupIdx = newSections.findIndex(g => g.group === source.droppableId);
      const destGroupIdx = newSections.findIndex(g => g.group === destination.droppableId);
      
      const [movedSection] = newSections[sourceGroupIdx].sections.splice(source.index, 1);
      newSections[destGroupIdx].sections.splice(destination.index, 0, movedSection);
      setSections(newSections);
    }

    toast.success('Order updated');
  };

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