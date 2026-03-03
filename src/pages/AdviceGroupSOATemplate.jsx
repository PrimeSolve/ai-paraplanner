import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import {
  GripVertical,
  ChevronDown,
  Settings2,
  RotateCcw,
  Upload,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import SectionConfigEditor from '@/components/soa/SectionConfigEditor';
import ExampleSOALibrary from '@/components/soa/ExampleSOALibrary';
import {
  DEFAULT_SECTION_GROUPS,
  getSectionStatus,
  countConfigured,
} from '@/utils/soaTemplateDefaults';

function StatusDot({ status }) {
  const colors = {
    configured: 'bg-green-500',
    auto: 'bg-blue-500',
    partial: 'bg-amber-500',
    'needs-config': 'bg-slate-300',
  };
  return (
    <span
      className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${colors[status] || colors['needs-config']}`}
    />
  );
}

function MiniBadge({ label, active }) {
  return (
    <span
      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
        active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'
      }`}
    >
      {label}
    </span>
  );
}

export default function AdviceGroupSOATemplate() {
  const [adminTemplate, setAdminTemplate] = useState(null);
  const [groupTemplate, setGroupTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState([]);
  const [sections, setSections] = useState(
    () => JSON.parse(JSON.stringify(DEFAULT_SECTION_GROUPS))
  );
  const [adminSections, setAdminSections] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [overrides, setOverrides] = useState({});

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      // Load admin template as base
      let adminSecs = JSON.parse(JSON.stringify(DEFAULT_SECTION_GROUPS));
      try {
        const adminTemplates = await base44.entities.SOATemplate.filter({ owner_type: 'admin' });
        if (adminTemplates[0]?.sections) {
          const loaded = typeof adminTemplates[0].sections === 'string'
            ? JSON.parse(adminTemplates[0].sections)
            : adminTemplates[0].sections;
          if (Array.isArray(loaded) && loaded.length > 0) {
            adminSecs = loaded;
          }
          setAdminTemplate(adminTemplates[0]);
        }
      } catch { /* silent */ }
      setAdminSections(adminSecs);

      // Load group template overrides
      if (currentUser.advice_group_id) {
        try {
          const groupTemplates = await base44.entities.SOATemplate.filter({
            owner_type: 'advice_group',
            advice_group_id: currentUser.advice_group_id,
          });
          if (groupTemplates[0]) {
            setGroupTemplate(groupTemplates[0]);
            if (groupTemplates[0].sections) {
              const loaded = typeof groupTemplates[0].sections === 'string'
                ? JSON.parse(groupTemplates[0].sections)
                : groupTemplates[0].sections;
              if (Array.isArray(loaded) && loaded.length > 0) {
                setSections(loaded);
                // Track which sections have overrides
                const overrideMap = {};
                for (const group of loaded) {
                  for (const s of group.sections) {
                    if (s.prompt?.system || s.example_content) {
                      overrideMap[s.id] = true;
                    }
                  }
                }
                setOverrides(overrideMap);
                setExpandedGroups(loaded.map((g) => g.group));
                setLoading(false);
                return;
              }
            }
          }
        } catch { /* silent */ }
      }

      setSections(adminSecs);
      setExpandedGroups(adminSecs.map((g) => g.group));
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { sections: JSON.stringify(sections) };
      if (groupTemplate?.id) {
        await base44.entities.SOATemplate.update(groupTemplate.id, payload);
      } else {
        const created = await base44.entities.SOATemplate.create({
          owner_type: 'advice_group',
          advice_group_id: user.advice_group_id,
          inherits_from_id: adminTemplate?.id,
          ...payload,
        });
        setGroupTemplate(created);
      }
      toast.success('Template saved successfully');
    } catch {
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const toggleGroup = (groupId) => {
    setExpandedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((g) => g !== groupId)
        : [...prev, groupId]
    );
  };

  const handleDragEnd = (result) => {
    const { source, destination, type } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const newSections = Array.from(sections);
    if (type === 'GROUP') {
      const [movedGroup] = newSections.splice(source.index, 1);
      newSections.splice(destination.index, 0, movedGroup);
      setSections(newSections);
    } else if (type === 'SECTION') {
      const sourceGroupIdx = newSections.findIndex((g) => g.group === source.droppableId);
      const destGroupIdx = newSections.findIndex((g) => g.group === destination.droppableId);
      const [movedSection] = newSections[sourceGroupIdx].sections.splice(source.index, 1);
      newSections[destGroupIdx].sections.splice(destination.index, 0, movedSection);
      setSections(newSections);
    }
  };

  const openEditor = (section) => {
    setEditingSection(section);
    setEditorOpen(true);
  };

  const handleSectionSave = (sectionId, config) => {
    setSections((prev) =>
      prev.map((group) => ({
        ...group,
        sections: group.sections.map((s) =>
          s.id === sectionId
            ? { ...s, prompt: config.prompt, example_content: config.example_content, data_feeds: config.data_feeds }
            : s
        ),
      }))
    );
    setOverrides((prev) => ({ ...prev, [sectionId]: true }));
    toast.success('Section updated');
  };

  const resetSectionToDefault = (sectionId) => {
    if (!adminSections) return;

    let adminSection = null;
    for (const group of adminSections) {
      const found = group.sections.find((s) => s.id === sectionId);
      if (found) { adminSection = found; break; }
    }
    if (!adminSection) return;

    setSections((prev) =>
      prev.map((group) => ({
        ...group,
        sections: group.sections.map((s) =>
          s.id === sectionId
            ? { ...adminSection }
            : s
        ),
      }))
    );
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[sectionId];
      return next;
    });
    toast.success('Reset to default');
  };

  const toggleSectionEnabled = (sectionId) => {
    setSections((prev) =>
      prev.map((group) => ({
        ...group,
        sections: group.sections.map((s) =>
          s.id === sectionId
            ? { ...s, enabled: s.enabled === false ? true : false }
            : s
        ),
      }))
    );
  };

  const { configured, total } = countConfigured(sections);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="py-6 px-8" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div className="mb-6">
        <div className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1">
          Template Configuration
        </div>
        <h1 className="text-2xl font-bold text-slate-900">
          Advice Group Template
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Customise AI prompts and data feeds from the PrimeSolve default
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-purple-900 mb-0.5">Advice Group Template</h4>
          <p className="text-sm text-purple-700">
            Customise from the PrimeSolve default. Sections using the default will auto-update when the admin changes theirs.
            Overridden sections are marked with a purple indicator. You can disable sections to hide them from advisers.
          </p>
        </div>
      </div>

      {/* Stats & Actions */}
      <div className="flex gap-4 mb-6 items-center justify-between">
        <div className="flex gap-4">
          <div className="flex items-center gap-3 bg-white rounded-lg border border-slate-200 px-6 py-3">
            <span className="text-2xl font-bold text-slate-800">{total}</span>
            <span className="text-sm text-slate-600">Total</span>
          </div>
          <div className="flex items-center gap-3 bg-white rounded-lg border border-slate-200 px-6 py-3">
            <span className="text-2xl font-bold text-green-600">{configured}</span>
            <span className="text-sm text-slate-600">Configured</span>
          </div>
          <div className="flex items-center gap-3 bg-white rounded-lg border border-slate-200 px-6 py-3">
            <span className="text-2xl font-bold text-purple-600">{Object.keys(overrides).length}</span>
            <span className="text-sm text-slate-600">Overrides</span>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          {saving ? 'Saving...' : 'Save Template'}
        </Button>
      </div>

      {/* Section Groups with Drag & Drop */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="groups" type="GROUP">
          {(provided) => (
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
                        className={`bg-white border border-slate-200 rounded-lg overflow-hidden ${
                          snapshot.isDragging ? 'shadow-lg border-purple-400' : ''
                        }`}
                      >
                        <button
                          onClick={() => toggleGroup(group.group)}
                          {...provided.dragHandleProps}
                          className="w-full flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left cursor-grab active:cursor-grabbing"
                        >
                          <GripVertical className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-base flex-shrink-0">
                            {group.icon}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-slate-800">{group.groupLabel}</div>
                          </div>
                          <span className="text-xs font-medium text-slate-500">
                            {group.sections.length} sections
                          </span>
                          <ChevronDown
                            className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          />
                        </button>

                        {isExpanded && (
                          <Droppable droppableId={group.group} type="SECTION">
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={`border-t border-slate-200 p-3 space-y-2 ${
                                  snapshot.isDraggingOver ? 'bg-purple-50/50' : ''
                                }`}
                              >
                                {group.sections.map((section, sectionIdx) => {
                                  const status = getSectionStatus(section);
                                  const hasPrompt = !!section.prompt?.system;
                                  const hasExample = !!section.example_content;
                                  const feedCount = section.data_feeds?.length || 0;
                                  const isOverride = !!overrides[section.id];
                                  const isDisabled = section.enabled === false;

                                  return (
                                    <Draggable
                                      key={section.id}
                                      draggableId={`${group.group}-${section.id}`}
                                      index={sectionIdx}
                                    >
                                      {(provided, snapshot) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          className={`flex items-center gap-3 p-3 bg-white border rounded-lg transition-all ${
                                            snapshot.isDragging
                                              ? 'shadow-md border-purple-400'
                                              : isOverride
                                              ? 'border-purple-300 border-l-4 border-l-purple-500'
                                              : 'border-slate-200'
                                          } ${isDisabled ? 'opacity-50' : ''}`}
                                        >
                                          <div
                                            {...provided.dragHandleProps}
                                            className="cursor-grab active:cursor-grabbing flex-shrink-0"
                                          >
                                            <GripVertical className="w-4 h-4 text-slate-300" />
                                          </div>

                                          <StatusDot status={status} />

                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                              <span className="font-medium text-sm text-slate-800">
                                                {section.label}
                                              </span>
                                              {isOverride && (
                                                <span className="text-[10px] font-semibold text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded">
                                                  Override
                                                </span>
                                              )}
                                              {!isOverride && (
                                                <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                                                  Default
                                                </span>
                                              )}
                                            </div>
                                            <div className="text-xs text-slate-500 truncate">
                                              {section.desc}
                                            </div>
                                          </div>

                                          <div className="flex items-center gap-1.5 flex-shrink-0">
                                            <MiniBadge label="Prompt" active={hasPrompt} />
                                            <MiniBadge label="Example" active={hasExample} />
                                            <MiniBadge
                                              label={feedCount > 0 ? `${feedCount} feeds` : 'Feed'}
                                              active={feedCount > 0}
                                            />
                                          </div>

                                          <div className="flex items-center gap-1 flex-shrink-0">
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                toggleSectionEnabled(section.id);
                                              }}
                                              title={isDisabled ? 'Enable section' : 'Disable section'}
                                            >
                                              {isDisabled ? (
                                                <EyeOff className="w-4 h-4" />
                                              ) : (
                                                <Eye className="w-4 h-4" />
                                              )}
                                            </Button>
                                            {isOverride && (
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 w-8 p-0 text-slate-400 hover:text-amber-600"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  resetSectionToDefault(section.id);
                                                }}
                                                title="Reset to default"
                                              >
                                                <RotateCcw className="w-3.5 h-3.5" />
                                              </Button>
                                            )}
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              className="flex-shrink-0 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                openEditor(section);
                                              }}
                                            >
                                              <Settings2 className="w-3.5 h-3.5 mr-1" />
                                              Configure
                                            </Button>
                                          </div>
                                        </div>
                                      )}
                                    </Draggable>
                                  );
                                })}
                                {provided.placeholder}
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

      {/* Example SOA Library */}
      {user?.advice_group_id && (
        <div className="mt-8">
          <ExampleSOALibrary
            ownerType="advice_group"
            ownerId={user.advice_group_id}
            onExtractedSections={() => {}}
          />
        </div>
      )}

      {/* Section Config Editor Modal */}
      <SectionConfigEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        section={editingSection}
        onSave={handleSectionSave}
      />
    </div>
  );
}
