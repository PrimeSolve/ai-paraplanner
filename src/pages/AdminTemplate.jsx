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
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function AdminTemplate() {
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState(['welcome-intro', 'executive-summary', 'financial-analysis']);
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
      group: 'risk-profile',
      groupLabel: 'Risk Profile',
      icon: '⚖️',
      sections: [
        { id: 'risk-profile', label: 'Risk Profile', description: 'Risk tolerance assessment', status: 'needs-comment', badge: 'Fact Find' },
        { id: 'variance-to-profile', label: 'Variance to Risk Profile', description: 'Explanation if different', status: 'needs-comment', badge: null }
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
        { id: 'retirement-planning', label: 'Retirement Planning', description: 'Retirement preparation', status: 'needs-comment', badge: null },
        { id: 'social-security', label: 'Social Security', description: 'Government benefits', status: 'needs-comment', badge: null },
        { id: 'estate-planning-strategy', label: 'Estate Planning Strategy', description: 'Estate succession', status: 'needs-comment', badge: null }
      ]
    },
    {
      group: 'product-recommendations',
      groupLabel: 'Product Recommendations',
      icon: '🎯',
      sections: [
        { id: 'recommended-insurance-product', label: 'Recommended Insurance Product', description: 'Insurance recommendations', status: 'needs-comment', badge: 'Products' },
        { id: 'insurance-super-comparison', label: 'Insurance Super Comparison', description: 'Inside vs outside super', status: 'needs-comment', badge: null },
        { id: 'recommended-wealth-product', label: 'Recommended Wealth Product', description: 'Investment products', status: 'needs-comment', badge: 'Products' },
        { id: 'recommended-portfolio', label: 'Recommended Portfolio', description: 'Portfolio recommendation', status: 'needs-comment', badge: 'Portfolio' },
        { id: 'asset-allocation', label: 'Asset Allocation', description: 'Allocation breakdown', status: 'needs-comment', badge: 'Portfolio' }
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
    setSections(defaultSections);
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

  const handleDragEnd = (result) => {
    const { source, destination, type, draggableId } = result;
    
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const newSections = Array.from(sections);

    if (type === 'GROUP') {
      // Reorder groups
      const [movedGroup] = newSections.splice(source.index, 1);
      newSections.splice(destination.index, 0, movedGroup);
      setSections(newSections);
    } else if (type === 'SECTION') {
      // Reorder sections within a group
      const sourceGroupIdx = newSections.findIndex(g => g.group === source.droppableId);
      const destGroupIdx = newSections.findIndex(g => g.group === destination.droppableId);
      
      const [movedSection] = newSections[sourceGroupIdx].sections.splice(source.index, 1);
      newSections[destGroupIdx].sections.splice(destination.index, 0, movedSection);
      setSections(newSections);
    }

    toast.success('Order updated');
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

        {/* Section Groups with Drag & Drop */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="groups" type="GROUP">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="space-y-3"
              >
                {sections.map((group, groupIdx) => {
                  const isExpanded = expandedGroups.includes(group.group);
                  return (
                    <Draggable key={group.group} draggableId={group.group} index={groupIdx}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`bg-white border border-slate-200 rounded-lg overflow-hidden ${snapshot.isDragging ? 'shadow-lg border-blue-400' : ''}`}
                        >
                          <button
                            onClick={() => toggleGroup(group.group)}
                            {...provided.dragHandleProps}
                            className="w-full flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left cursor-grab active:cursor-grabbing"
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
                            <Droppable droppableId={group.group} type="SECTION">
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.droppableProps}
                                  className={`border-t border-slate-200 p-4 space-y-3 ${snapshot.isDraggingOver ? 'bg-blue-50' : ''}`}
                                >
                                  {group.sections.map((section, sectionIdx) => (
                                    <Draggable key={section.id} draggableId={`${group.group}-${section.id}`} index={sectionIdx}>
                                      {(provided, snapshot) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          className={`flex items-start gap-4 p-4 bg-white border border-slate-200 rounded-lg transition-all ${
                                            snapshot.isDragging ? 'shadow-md border-blue-400 bg-blue-50' : ''
                                          } ${
                                            section.status === 'configured' ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-orange-500'
                                          }`}
                                        >
                                          <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing flex-shrink-0 pt-1">
                                            <GripVertical className="w-4 h-4 text-slate-400" />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-slate-800">{section.label}</div>
                                            <div className="text-sm text-slate-500 mt-1">{section.description}</div>
                                          </div>
                                          <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                                            {section.badge && (
                                              <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2.5 py-1 rounded-full whitespace-nowrap">
                                                {section.badge}
                                              </span>
                                            )}
                                            {section.status === 'configured' && (
                                              <span className="text-xs font-semibold text-green-700 bg-green-100 px-3 py-1.5 rounded-full whitespace-nowrap">
                                                ✓ Configured
                                              </span>
                                            )}
                                            {section.status === 'needs-comment' && (
                                              <span className="text-xs font-semibold text-orange-700 bg-orange-100 px-3 py-1.5 rounded-full whitespace-nowrap">
                                                ⚠ Needs content
                                              </span>
                                            )}
                                            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                              <Edit className="w-3.5 h-3.5 mr-1" />
                                              Edit
                                            </Button>
                                          </div>
                                        </div>
                                      )}
                                    </Draggable>
                                  ))}
                                  {provided.placeholder}
                                  <button className="w-full py-2 text-sm font-medium text-blue-600 hover:text-blue-700 mt-2">
                                    <Plus className="w-4 h-4 inline mr-1" />
                                    Add Custom Section
                                  </button>
                                </div>
                              )}
                            </Droppable>
                          )}
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </AdminLayout>
  );
}