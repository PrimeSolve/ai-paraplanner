import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import axiosInstance from '@/api/axiosInstance';
import { Button } from '@/components/ui/button';
import {
  GripVertical,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  Settings2,
  RotateCcw,
  Upload,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  X,
  AlertTriangle,
  Home,
  ChevronRight,
  Plus,
  FileText,
  TrendingUp,
  DollarSign,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { getIconComponent } from '@/components/IconPicker';
import { FileText as DefaultSectionIcon } from 'lucide-react';
import SectionConfigEditor from '@/components/soa/SectionConfigEditor';
import ExampleSOALibrary from '@/components/soa/ExampleSOALibrary';
import ClairePanel from '@/components/soa/ClairePanel';
import TemplateLibrary from '@/components/soa/TemplateLibrary';
import SOATemplateStylingPanel from '@/components/SOATemplateStylingPanel';
import {
  DEFAULT_SECTION_GROUPS,
  getSectionStatus,
  countConfigured,
} from '@/utils/soaTemplateDefaults';

function StatusDot({ status }) {
  const colorMap = {
    configured: '#16a34a',
    auto: '#16a34a',
    partial: '#d97706',
    'needs-config': '#d1d5db',
  };
  return (
    <span
      className="flex-shrink-0 rounded-full"
      style={{
        width: 7,
        height: 7,
        backgroundColor: colorMap[status] || colorMap['needs-config'],
      }}
    />
  );
}

function TagPill({ label, variant }) {
  const styles = {
    prompt: { background: '#ede9fe', color: '#6d28d9' },
    'prompt-off': { background: 'var(--color-background-secondary, #f1f5f9)', color: 'var(--color-text-secondary, #64748b)' },
    example: { background: '#dcfce7', color: '#15803d' },
    'example-off': { background: 'var(--color-background-secondary, #f1f5f9)', color: 'var(--color-text-secondary, #64748b)' },
    feed: { background: '#fef3c7', color: '#b45309' },
    'feed-off': { background: 'var(--color-background-secondary, #f1f5f9)', color: 'var(--color-text-secondary, #64748b)' },
  };
  const s = styles[variant] || styles['prompt-off'];
  return (
    <span
      className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
      style={{ backgroundColor: s.background, color: s.color }}
    >
      {label}
    </span>
  );
}

const GROUP_ICON_DEFAULTS = [
  { bg: '#ede9fe', fg: '#6d28d9', Icon: FileText },
  { bg: '#dcfce7', fg: '#15803d', Icon: TrendingUp },
  { bg: '#fef3c7', fg: '#b45309', Icon: DollarSign },
  { bg: '#dbeafe', fg: '#1d4ed8', Icon: Shield },
];

function getGroupIconStyle(groupIdx) {
  if (groupIdx < GROUP_ICON_DEFAULTS.length) return GROUP_ICON_DEFAULTS[groupIdx];
  return { bg: 'var(--color-background-secondary, #f1f5f9)', fg: '#64748b', Icon: FileText };
}

export default function AdviceGroupSOATemplate() {
  // View state: 'library' or 'editor'
  const [view, setView] = useState('library');

  // Library state
  const [templates, setTemplates] = useState([]);
  const [loadingLibrary, setLoadingLibrary] = useState(true);
  const [activeTemplateId, setActiveTemplateId] = useState(null);

  // Editor state
  const [adminTemplate, setAdminTemplate] = useState(null);
  const [groupTemplate, setGroupTemplate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState([]);
  const [sections, setSections] = useState(
    () => JSON.parse(JSON.stringify(DEFAULT_SECTION_GROUPS))
  );
  const [adminSections, setAdminSections] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [settingsPanelTemplateId, setSettingsPanelTemplateId] = useState(null);
  const [overrides, setOverrides] = useState({});
  const [claireOpen, setClaireOpen] = useState(false);
  const [claireSectionStates, setClaireSectionStates] = useState({});
  const [claireNewSections, setClaireNewSections] = useState([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      await loadTemplates(currentUser);
    } catch (error) {
      console.error('Failed to load user:', error);
      setLoadingLibrary(false);
    }
  };

  const loadTemplates = async () => {
    setLoadingLibrary(true);
    try {
      const response = await axiosInstance.get('/soa-templates/available');
      const data = Array.isArray(response.data)
        ? response.data
        : (response.data?.items || response.data?.data || []);
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
      setTemplates([]);
    } finally {
      setLoadingLibrary(false);
    }
  };

  const openEditor = (tmpl) => {
    setLoading(true);
    setGroupTemplate(tmpl);

    const rawSections = tmpl.sections || tmpl.template_data;
    if (rawSections) {
      const parsed = typeof rawSections === 'string'
        ? JSON.parse(rawSections)
        : rawSections;
      // Handle wrapped format { sections: [...] }
      const unwrapped = parsed?.sections || parsed;
      if (Array.isArray(unwrapped) && unwrapped.length > 0) {
        setSections(unwrapped);
        // Track which sections have overrides
        const overrideMap = {};
        for (const group of unwrapped) {
          for (const s of group.sections) {
            if (s.prompt?.system || s.example_content) {
              overrideMap[s.id] = true;
            }
          }
        }
        setOverrides(overrideMap);
        setExpandedGroups(unwrapped.map((g) => g.group));
      }
    } else {
      // New template with default sections
      const defaultSecs = adminSections || JSON.parse(JSON.stringify(DEFAULT_SECTION_GROUPS));
      setSections(defaultSecs);
      setExpandedGroups(defaultSecs.map((g) => g.group));
      setOverrides({});
    }

    setView('editor');
    setLoading(false);
  };

  const handleViewDefault = (tmpl) => {
    // Open default template in read-only-ish mode (same editor, just viewing)
    openEditor(tmpl);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const sectionData = JSON.stringify({ sections });
      const ownerType = groupTemplate?.ownerType ?? groupTemplate?.owner_type;
      if (groupTemplate?.id && ownerType !== 0) {
        await axiosInstance.put(`/soa-templates/${groupTemplate.id}`, {
          name: groupTemplate.name,
          description: groupTemplate.description,
          sections: sectionData,
        });
      } else {
        const { data: created } = await axiosInstance.post('/soa-templates', {
          name: groupTemplate?.name || 'Advice Group Template',
          description: groupTemplate?.description || '',
          ownerType: 1,
          ownerId: user.advice_group_id || '',
          sections: sectionData,
        });
        setGroupTemplate(created);
      }
      toast.success('Template saved successfully');
      loadTemplates();
    } catch (error) {
      console.error('[AdviceGroup handleSave] SAVE FAILED:', error);
      console.error('[AdviceGroup handleSave] Response:', error.response?.status, error.response?.data);
      toast.error(`Failed to save: ${error.response?.status || error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSetAsDefault = async (tmpl) => {
    // TODO: Call PATCH /api/v1/advice-groups/{id} with { defaultTemplateId: tmpl.id }
    setActiveTemplateId(tmpl.id);
    toast.success('Template set as default for SOA generation');
  };

  const handleNewFromDefault = async () => {
    const defaultTmpl = templates.find((t) => t.owner_type === 0 || t.ownerType === 0);
    if (!defaultTmpl) return;

    try {
      const { data: duplicated } = await axiosInstance.post(
        `/soa-templates/${defaultTmpl.id}/duplicate`,
        {
          name: `${defaultTmpl.name || 'Default'} (Copy)`,
          ownerType: 1,
          ownerId: user?.advice_group_id || '',
        }
      );
      toast.success('Template created from default');
      await loadTemplates();
      openEditor(duplicated);
    } catch {
      // Fallback: create manually
      try {
        const { data: created } = await axiosInstance.post('/soa-templates', {
          name: `${defaultTmpl.name || 'Default'} (Copy)`,
          description: '',
          ownerType: 1,
          ownerId: user?.advice_group_id || '',
          sections: typeof defaultTmpl.sections === 'string' ? defaultTmpl.sections : JSON.stringify(defaultTmpl.sections),
        });
        toast.success('Template created from default');
        await loadTemplates();
        openEditor(created);
      } catch {
        toast.error('Failed to create template');
      }
    }
  };

  const handleNewFromScratch = async () => {
    try {
      const emptySections = DEFAULT_SECTION_GROUPS.map((g) => ({
        ...g,
        sections: g.sections.map((s) => ({
          ...s,
          prompt: { system: '', output_format: 'prose', max_words: 500, tone: 'professional_clear' },
          example_content: '',
          data_feeds: [],
        })),
      }));
      const { data: created } = await axiosInstance.post('/soa-templates', {
        name: 'New Template',
        description: '',
        ownerType: 1,
        ownerId: user?.advice_group_id || '',
        sections: JSON.stringify({ sections: emptySections }),
      });
      toast.success('Template created');
      await loadTemplates();
      openEditor(created);
    } catch {
      toast.error('Failed to create template');
    }
  };

  const handleDelete = async (tmpl) => {
    const ownerType = tmpl.ownerType ?? tmpl.owner_type;
    if (ownerType === 0) {
      toast.error('Cannot delete the PrimeSolve Default template');
      return;
    }
    try {
      await axiosInstance.delete(`/soa-templates/${tmpl.id}`);
      toast.success('Template deleted');
      if (activeTemplateId === tmpl.id) {
        setActiveTemplateId(null);
      }
      loadTemplates();
    } catch {
      toast.error('Failed to delete template');
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

  const openSectionEditor = (section) => {
    setEditingSection(section);
    setEditorOpen(true);
  };

  const handleSectionSave = (sectionId, config) => {
    setSections((prev) =>
      prev.map((group) => ({
        ...group,
        sections: group.sections.map((s) =>
          s.id === sectionId
            ? { ...s, icon: config.icon, prompt: config.prompt, example_content: config.example_content, data_feeds: config.data_feeds }
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

  const handleClaireSectionStateChange = (stateMap, newSections) => {
    setClaireSectionStates(stateMap);
    setClaireNewSections(newSections || []);
  };

  const handleClaireSectionUpdate = (sectionId, status) => {
    setClaireSectionStates((prev) => ({ ...prev, [sectionId]: status }));
  };

  const handleGapInlineAction = (sectionId, action) => {
    setClaireSectionStates((prev) => ({
      ...prev,
      [sectionId]: action === 'include' ? 'gap' : 'skipped',
    }));
  };

  const handleAddSection = (groupId) => {
    setSections((prev) =>
      prev.map((group) => {
        if (group.group !== groupId) return group;
        const newId = `${groupId}-custom-${Date.now()}`;
        return {
          ...group,
          sections: [
            ...group.sections,
            {
              id: newId,
              label: 'New Section',
              desc: 'Click Configure to set up this section',
              group: groupId,
              enabled: true,
              order: group.sections.length + 1,
              prompt: { system: '', output_format: 'prose', max_words: 500, tone: 'professional_clear' },
              example_content: '',
              data_feeds: [],
            },
          ],
        };
      })
    );
  };

  const getClaireIndicator = (sectionId) => {
    const state = claireSectionStates[sectionId];
    if (!state || !claireOpen) return null;
    return state;
  };

  // ── LIBRARY VIEW ──
  if (view === 'library') {
    return (
      <div className="py-6 px-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-4">
          <Home className="w-4 h-4" />
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-800 font-medium">SOA Templates</span>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            SOA Templates
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your SOA document templates
          </p>
        </div>

        <TemplateLibrary
          templates={templates}
          activeTemplateId={activeTemplateId}
          defaultTemplateId={templates.find((t) => (t.ownerType ?? t.owner_type) === 0)?.id}
          onEdit={(tmpl) => {
            const ot = tmpl.ownerType ?? tmpl.owner_type;
            if (ot === 0) {
              handleViewDefault(tmpl);
            } else {
              openEditor(tmpl);
            }
          }}
          onView={handleViewDefault}
          onUse={handleSetAsDefault}
          onDuplicate={(tmpl) => {
            const ot = tmpl.ownerType ?? tmpl.owner_type;
            if (ot === 0) {
              handleNewFromDefault();
            } else {
              // Duplicate owned template
              (async () => {
                try {
                  const { data: duplicated } = await axiosInstance.post(
                    `/soa-templates/${tmpl.id}/duplicate`,
                    {
                      name: `${tmpl.name || 'Template'} (Copy)`,
                      ownerType: 1,
                      ownerId: user?.advice_group_id || '',
                    }
                  );
                  toast.success('Template duplicated');
                  await loadTemplates();
                } catch {
                  const { data: created } = await axiosInstance.post('/soa-templates', {
                    name: `${tmpl.name || 'Template'} (Copy)`,
                    ownerType: 1,
                    ownerId: user?.advice_group_id || '',
                    sections: typeof tmpl.sections === 'string' ? tmpl.sections : JSON.stringify(tmpl.sections),
                  });
                  toast.success('Template duplicated');
                  await loadTemplates();
                }
              })();
            }
          }}
          onDelete={handleDelete}
          onNewFromClaire={() => {
            const groupTmpl = templates.find((t) => (t.ownerType ?? t.owner_type) === 1);
            const target = groupTmpl || templates.find((t) => (t.ownerType ?? t.owner_type) === 0);
            if (target) {
              openEditor(target);
              setTimeout(() => setClaireOpen(true), 100);
            }
          }}
          onNewFromDefault={handleNewFromDefault}
          onNewFromScratch={handleNewFromScratch}
          onStylingSettings={(tmpl) => setSettingsPanelTemplateId(tmpl.id)}
          level="advice_group"
          loading={loadingLibrary}
        />

        {settingsPanelTemplateId && (
          <SOATemplateStylingPanel
            templateId={settingsPanelTemplateId}
            onClose={() => setSettingsPanelTemplateId(null)}
          />
        )}
      </div>
    );
  }

  // ── EDITOR VIEW ──
  const { configured, total } = countConfigured(sections);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${claireOpen ? 'h-[calc(100vh-48px)]' : ''}`}>
    {/* Change 1: Back navigation bar */}
    <div
      className="flex items-center gap-2 bg-white flex-shrink-0"
      style={{ padding: '10px 24px', borderBottom: '0.5px solid #e2e8f0' }}
    >
      <button
        onClick={() => { setView('library'); setClaireOpen(false); }}
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to templates
      </button>
      <span className="text-sm text-slate-300">/</span>
      <span className="text-sm text-slate-800 font-semibold">
        {groupTemplate?.name || 'AI Paraplanner'}
      </span>
    </div>

    <div className={`flex flex-1 ${claireOpen ? 'overflow-hidden' : ''}`}>
    {/* Left panel — template content */}
    <div className={`py-6 px-8 ${claireOpen ? 'w-[65%] overflow-y-auto' : 'w-full'} transition-all`}>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Editing: {groupTemplate?.name || 'Advice Group Template'}
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

      {/* Stats & Actions — Change 2: Preview button added */}
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
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="border-[#6366f1] text-[#6366f1] hover:bg-indigo-50"
            onClick={() => toast('Generating preview with dummy data…')}
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview with dummy data
          </Button>
          {!claireOpen && (
            <Button
              variant="outline"
              className="border-purple-500 text-purple-600 hover:bg-purple-50"
              onClick={() => setClaireOpen(true)}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Build with Claire
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {saving ? 'Saving...' : 'Save Template'}
          </Button>
        </div>
      </div>

      {/* Section Groups with Drag & Drop — Change 3 & 4 */}
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
                const groupIconStyle = getGroupIconStyle(groupIdx);
                const GroupIcon = groupIconStyle.Icon;
                const groupConfigured = group.sections.filter(
                  (s) => { const st = getSectionStatus(s); return st === 'configured' || st === 'auto'; }
                ).length;

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
                        {/* Group header */}
                        <button
                          onClick={() => toggleGroup(group.group)}
                          {...provided.dragHandleProps}
                          className="w-full flex items-center gap-3 p-4 hover:bg-slate-100 transition-colors text-left cursor-grab active:cursor-grabbing"
                          style={{
                            backgroundColor: 'var(--color-background-secondary, #f8fafc)',
                            borderBottom: isExpanded ? '0.5px solid #e2e8f0' : 'none',
                          }}
                        >
                          <span className="text-slate-400 flex-shrink-0" style={{ fontSize: 16, lineHeight: 1 }}>⠿</span>
                          <div
                            className="flex items-center justify-center flex-shrink-0 rounded-lg"
                            style={{
                              width: 32,
                              height: 32,
                              backgroundColor: groupIconStyle.bg,
                            }}
                          >
                            <GroupIcon style={{ width: 18, height: 18, color: groupIconStyle.fg }} />
                          </div>
                          <span className="flex-1 text-sm font-medium text-slate-800">
                            {group.groupLabel}
                          </span>
                          <span className="text-xs text-slate-500">
                            {groupConfigured} / {group.sections.length} configured
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </button>

                        {/* Sub-sections — hidden when collapsed */}
                        {isExpanded && (
                          <Droppable droppableId={group.group} type="SECTION">
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={`p-3 space-y-2 ${
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
                                  const claireIndicator = getClaireIndicator(section.id);

                                  const SectionIcon = getIconComponent(section.icon) || DefaultSectionIcon;

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
                                              : claireIndicator === 'populated'
                                              ? 'border-green-300 animate-[flash-green_1s_ease-out]'
                                              : claireIndicator === 'gap'
                                              ? 'border-amber-300 bg-amber-50/30'
                                              : claireIndicator === 'skipped'
                                              ? 'opacity-40'
                                              : isOverride
                                              ? 'border-purple-300 border-l-4 border-l-purple-500'
                                              : 'border-slate-200'
                                          } ${isDisabled ? 'opacity-50' : ''}`}
                                        >
                                          {/* Drag handle */}
                                          <div
                                            {...provided.dragHandleProps}
                                            className="cursor-grab active:cursor-grabbing flex-shrink-0"
                                          >
                                            <GripVertical className="w-4 h-4 text-slate-300" />
                                          </div>

                                          {/* Status dot */}
                                          <StatusDot status={status} />

                                          {/* Sub-icon */}
                                          <div
                                            className="flex items-center justify-center flex-shrink-0 rounded-md"
                                            style={{
                                              width: 26,
                                              height: 26,
                                              backgroundColor: section.icon
                                                ? groupIconStyle.bg
                                                : 'var(--color-background-secondary, #f1f5f9)',
                                            }}
                                          >
                                            <SectionIcon
                                              style={{
                                                width: 14,
                                                height: 14,
                                                color: section.icon ? groupIconStyle.fg : '#64748b',
                                              }}
                                            />
                                          </div>

                                          {/* Title + description */}
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
                                            </div>
                                            <div className="text-xs text-slate-500 truncate">
                                              {claireIndicator === 'gap' ? (
                                                <span className="text-amber-600">Not found in your documents</span>
                                              ) : section.desc}
                                            </div>
                                            {claireIndicator === 'gap' && (
                                              <div className="flex gap-2 mt-1.5">
                                                <button
                                                  onClick={(e) => { e.stopPropagation(); handleGapInlineAction(section.id, 'include'); }}
                                                  className="text-[11px] text-green-600 hover:text-green-700 font-medium"
                                                >
                                                  Include anyway
                                                </button>
                                                <button
                                                  onClick={(e) => { e.stopPropagation(); handleGapInlineAction(section.id, 'skip'); }}
                                                  className="text-[11px] text-slate-400 hover:text-slate-600 font-medium"
                                                >
                                                  Skip this section
                                                </button>
                                              </div>
                                            )}
                                          </div>

                                          {/* Tag pills */}
                                          <div className="flex items-center gap-1.5 flex-shrink-0">
                                            <TagPill label="Prompt" variant={hasPrompt ? 'prompt' : 'prompt-off'} />
                                            <TagPill label="Example" variant={hasExample ? 'example' : 'example-off'} />
                                            <TagPill
                                              label={feedCount > 0 ? `${feedCount} feeds` : 'Feed'}
                                              variant={feedCount > 0 ? 'feed' : 'feed-off'}
                                            />
                                          </div>

                                          {/* Actions */}
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
                                              className="flex-shrink-0 text-[#6366f1] hover:bg-indigo-50"
                                              style={{ borderColor: '#a5b4fc' }}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                openSectionEditor(section);
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

                                {/* Add sub-section row */}
                                <button
                                  onClick={() => handleAddSection(group.group)}
                                  className="w-full flex items-center justify-center gap-1.5 py-2.5 text-sm text-slate-400 hover:text-[#6366f1] hover:bg-indigo-50/50 rounded-lg transition-colors"
                                >
                                  <Plus className="w-4 h-4" />
                                  Add sub-section
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

    {/* Right panel — Claire */}
    {claireOpen && (
      <div className="w-[35%] border-l border-slate-200 flex-shrink-0 h-full">
        <ClairePanel
          onClose={() => setClaireOpen(false)}
          onSectionUpdate={handleClaireSectionUpdate}
          onSectionStateChange={handleClaireSectionStateChange}
        />
      </div>
    )}
    </div>
    </div>
  );
}
