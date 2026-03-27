import React, { useState, useEffect } from 'react';
import axiosInstance from '@/api/axiosInstance';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  GripVertical,
  ChevronDown,
  ChevronLeft,
  Settings2,
  Loader2,
  AlertCircle,
  Sparkles,
  AlertTriangle,
  Home,
  ChevronRight,
  Trash2,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import SectionConfigEditor from '@/components/soa/SectionConfigEditor';
import ClairePanel from '@/components/soa/ClairePanel';
import TemplateLibrary from '@/components/soa/TemplateLibrary';
import {
  DEFAULT_SECTION_GROUPS,
  getSectionStatus,
  countConfigured,
  DATA_SOURCES,
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
        active
          ? 'bg-green-100 text-green-700'
          : 'bg-slate-100 text-slate-400'
      }`}
    >
      {label}
    </span>
  );
}

export default function AdminTemplate() {
  // View state: 'library' or 'editor'
  const [view, setView] = useState('library');
  const [editingTemplateId, setEditingTemplateId] = useState(null);

  // Library state
  const [templates, setTemplates] = useState([]);
  const [loadingLibrary, setLoadingLibrary] = useState(true);

  // Editor state
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState([]);
  const [sections, setSections] = useState(
    () => JSON.parse(JSON.stringify(DEFAULT_SECTION_GROUPS))
  );
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [claireOpen, setClaireOpen] = useState(false);
  const [claireSectionStates, setClaireSectionStates] = useState({});
  const [claireNewSections, setClaireNewSections] = useState([]);
  const [templateName, setTemplateName] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoadingLibrary(true);
    try {
      const response = await axiosInstance.get('/soa-templates', { params: { ownerType: 0 } });
      const data = Array.isArray(response.data) ? response.data : (response.data?.items || []);
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoadingLibrary(false);
    }
  };

  const openEditor = async (tmpl) => {
    setLoading(true);
    setEditingTemplateId(tmpl.id);
    setTemplate(tmpl);
    setTemplateName(tmpl.name || '');
    setTemplateDesc(tmpl.description || '');

    let loaded = false;

    // Try sections field from API response
    if (tmpl.sections || tmpl.templateData) {
      try {
        const raw = tmpl.sections || tmpl.templateData;
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        let secs = parsed.sections || parsed;
        if (Array.isArray(secs) && secs.length > 0) {
          // If sections are grouped (have a 'group' property and nested 'sections'), use as-is
          // If sections are flat, wrap them into groups matching DEFAULT_SECTION_GROUPS structure
          if (!secs[0].group || !Array.isArray(secs[0].sections)) {
            const groupMap = {};
            for (const s of secs) {
              const gKey = s.group || s.category || 'general';
              if (!groupMap[gKey]) {
                const defaultGroup = DEFAULT_SECTION_GROUPS.find((g) => g.group === gKey);
                groupMap[gKey] = {
                  group: gKey,
                  groupLabel: defaultGroup?.groupLabel || gKey,
                  icon: defaultGroup?.icon || '',
                  sections: [],
                };
              }
              groupMap[gKey].sections.push(s);
            }
            secs = Object.values(groupMap);
          }
          setSections(secs);
          setExpandedGroups(secs.map((g) => g.group));
          loaded = true;
        }
      } catch (e) {
        console.error('Failed to parse template_data:', e);
      }
    }

    // Fall back to legacy sections field
    if (!loaded && tmpl.sections) {
      const parsed = typeof tmpl.sections === 'string'
        ? JSON.parse(tmpl.sections)
        : tmpl.sections;
      if (Array.isArray(parsed) && parsed.length > 0) {
        let secs = parsed;
        // Handle flat sections in legacy field too
        if (!secs[0].group || !Array.isArray(secs[0].sections)) {
          const groupMap = {};
          for (const s of secs) {
            const gKey = s.group || s.category || 'general';
            if (!groupMap[gKey]) {
              const defaultGroup = DEFAULT_SECTION_GROUPS.find((g) => g.group === gKey);
              groupMap[gKey] = {
                group: gKey,
                groupLabel: defaultGroup?.groupLabel || gKey,
                icon: defaultGroup?.icon || '',
                sections: [],
              };
            }
            groupMap[gKey].sections.push(s);
          }
          secs = Object.values(groupMap);
        }
        setSections(secs);
        setExpandedGroups(secs.map((g) => g.group));
        loaded = true;
      }
    }

    // Last resort: use defaults
    if (!loaded) {
      setSections(JSON.parse(JSON.stringify(DEFAULT_SECTION_GROUPS)));
      setExpandedGroups(DEFAULT_SECTION_GROUPS.map((g) => g.group));
    }

    setView('editor');
    setLoading(false);
  };

  const handleSave = async (sectionsOverride) => {
    setSaving(true);
    try {
      const sectionData = JSON.stringify({ sections: sectionsOverride || sections });
      if (template?.id) {
        await axiosInstance.put(`/soa-templates/${template.id}`, {
          name: templateName,
          description: templateDesc,
          sections: sectionData,
        });
      } else {
        const { data: created } = await axiosInstance.post('/soa-templates', {
          name: templateName,
          description: templateDesc,
          ownerType: 0,
          ownerId: template?.ownerId ?? template?.owner_id ?? '00000000-0000-0000-0000-000000000000',
          sections: sectionData,
        });
        setTemplate(created);
      }
      toast.success('Template saved successfully');
      // Refresh library data
      loadTemplates();
    } catch {
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleNameDescSave = async () => {
    setSaving(true);
    try {
      const sectionData = JSON.stringify({ sections });
      if (template?.id) {
        await axiosInstance.put(`/soa-templates/${template.id}`, {
          name: templateName,
          description: templateDesc,
          sections: sectionData,
        });
      } else {
        const { data: created } = await axiosInstance.post('/soa-templates', {
          name: templateName,
          description: templateDesc,
          ownerType: 0,
          ownerId: template?.ownerId ?? template?.owner_id ?? '00000000-0000-0000-0000-000000000000',
          sections: sectionData,
        });
        setTemplate(created);
      }
      toast.success('Template saved successfully');
      loadTemplates();
    } catch {
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleNewFromScratch = async () => {
    try {
      // Create a new template with empty section prompts
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
        name: 'New System Template',
        description: '',
        ownerType: 0,
        ownerId: null,
        sections: JSON.stringify({ sections: emptySections }),
      });
      toast.success('Template created');
      await loadTemplates();
      openEditor(created);
    } catch (error) {
      console.error('handleNewFromScratch error:', error);
      toast.error('Failed to create template');
    }
  };

  const handleNewFromDefault = async () => {
    // Find the default template and duplicate it
    const defaultTmpl = templates.find((t) => t.name === 'PrimeSolve Default' || t.ownerType === 0 || t.owner_type === 0);
    if (!defaultTmpl) {
      toast.error('No default template found — use "Start from scratch" instead');
      return;
    }
    try {
      const { data: duplicated } = await axiosInstance.post(
        `/soa-templates/${defaultTmpl.id}/duplicate`,
        {
          name: `${defaultTmpl.name || 'Default'} (Copy)`,
          ownerType: 0,
          ownerId: '00000000-0000-0000-0000-000000000000',
        }
      );
      toast.success('Template duplicated');
      await loadTemplates();
      openEditor(duplicated);
    } catch (error) {
      console.error('handleNewFromDefault duplicate API error:', error);
      try {
        // Fallback: create manually
        const { data: created } = await axiosInstance.post('/soa-templates', {
          name: `${defaultTmpl.name || 'Default'} (Copy)`,
          description: defaultTmpl.description || '',
          ownerType: 0,
          ownerId: '00000000-0000-0000-0000-000000000000',
          sections: defaultTmpl.sections
            ? (typeof defaultTmpl.sections === 'string' ? defaultTmpl.sections : JSON.stringify(defaultTmpl.sections))
            : JSON.stringify({ sections: DEFAULT_SECTION_GROUPS }),
        });
        toast.success('Template duplicated');
        await loadTemplates();
        openEditor(created);
      } catch (fallbackError) {
        console.error('handleNewFromDefault fallback error:', fallbackError);
        toast.error('Failed to duplicate template');
      }
    }
  };

  const handleDelete = async (tmpl) => {
    if (tmpl.name === 'PrimeSolve Default') {
      toast.error('Cannot delete the PrimeSolve Default template');
      return;
    }
    if (!window.confirm(`Delete template "${tmpl.name}"? This cannot be undone.`)) return;
    try {
      const deleteId = tmpl.id ?? tmpl.Id;
      console.log('handleDelete: tmpl =', JSON.stringify(tmpl, null, 2), 'deleteId =', deleteId);
      if (!deleteId) {
        console.error('handleDelete: no id found on template object, keys:', Object.keys(tmpl));
        toast.error('Failed to delete template — no ID found');
        return;
      }
      await axiosInstance.delete(`/soa-templates/${deleteId}`);
      toast.success('Template deleted');
      await loadTemplates();
    } catch (error) {
      console.error('handleDelete error:', error);
      console.error('handleDelete response:', error.response?.status, error.response?.data);
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
    const newSections = sections.map((group) => ({
      ...group,
      sections: group.sections.map((s) =>
        s.id === sectionId
          ? { ...s, label: config.label, desc: config.desc, prompt: config.prompt, example_content: config.example_content, data_feeds: config.data_feeds }
          : s
      ),
    }));
    setSections(newSections);
    handleSave(newSections);
    toast.success('Section updated');
  };

  const handleDeleteSection = (sectionId) => {
    if (!window.confirm('Delete this section? This cannot be undone.')) return;
    const newSections = sections
      .map((group) => ({
        ...group,
        sections: group.sections.filter((s) => s.id !== sectionId),
      }))
      .filter((group) => group.sections.length > 0);
    setSections(newSections);
    handleSave(newSections);
    toast.success('Section deleted');
  };

  const handleAddSection = (category) => {
    const newSections = sections.map((group) => {
      if (group.group !== category) return group;
      const nextOrder = group.sections.length > 0
        ? Math.max(...group.sections.map((s) => s.order ?? 0)) + 1
        : 1;
      return {
        ...group,
        sections: [
          ...group.sections,
          {
            id: crypto.randomUUID(),
            name: 'New Section',
            label: 'New Section',
            description: '',
            desc: '',
            category,
            order: nextOrder,
            prompt: '',
            exampleContent: '',
            example_content: '',
            dataFeeds: [],
            data_feeds: [],
            outputFormat: 'prose',
            maxWords: 300,
            tone: 'professional',
            isEnabled: true,
          },
        ],
      };
    });
    setSections(newSections);
    handleSave(newSections);
    // Open editor for the new section so user can set title/description
    const addedGroup = newSections.find((g) => g.group === category);
    const newSection = addedGroup?.sections[addedGroup.sections.length - 1];
    if (newSection) {
      openSectionEditor(newSection);
    }
  };

  const handleAddSectionStandalone = () => {
    const lastGroup = sections[sections.length - 1];
    const category = lastGroup ? lastGroup.group : 'general';
    handleAddSection(category);
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
            Manage system-level SOA document templates available to all advice groups
          </p>
        </div>

        <TemplateLibrary
          templates={templates}
          activeTemplateId={null}
          defaultTemplateId={templates.find((t) => t.name === 'PrimeSolve Default')?.id}
          onEdit={openEditor}
          onView={openEditor}
          onDuplicate={(tmpl) => {
            handleNewFromDefault();
          }}
          onDelete={handleDelete}
          onNewFromClaire={async () => {
            // Find default and open editor with Claire
            let defaultTmpl = templates.find((t) => (t.ownerType === 0 || t.owner_type === 0));
            if (!defaultTmpl) {
              // No template loaded yet — create one so Claire has something to work with
              try {
                const { data } = await axiosInstance.post('/soa-templates', {
                  name: 'PrimeSolve Default',
                  description: '',
                  ownerType: 0,
                  ownerId: '00000000-0000-0000-0000-000000000000',
                  sections: JSON.stringify(DEFAULT_SECTION_GROUPS),
                });
                defaultTmpl = data;
                await loadTemplates();
              } catch {
                toast.error('Failed to create template — please try again');
                return;
              }
            }
            openEditor(defaultTmpl);
            setTimeout(() => setClaireOpen(true), 100);
          }}
          onNewFromDefault={handleNewFromDefault}
          onNewFromScratch={handleNewFromScratch}
          level="admin"
          loading={loadingLibrary}
        />
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
    <div className={`flex ${claireOpen ? 'h-[calc(100vh-64px)]' : ''}`}>
    <div className={`py-6 px-8 ${claireOpen ? 'w-[65%] overflow-y-auto' : 'w-full'} transition-all`}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-4">
        <Home className="w-4 h-4" />
        <ChevronRight className="w-3.5 h-3.5" />
        <button
          onClick={() => { setView('library'); setClaireOpen(false); }}
          className="hover:text-slate-700 transition-colors"
        >
          SOA Templates
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-800 font-medium">
          {templateName || 'Edit Template'}
        </span>
      </div>

      {/* Back button + Header */}
      <div className="mb-6">
        <button
          onClick={() => { setView('library'); setClaireOpen(false); }}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Templates
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {templateName || 'Edit Template'}
        </h1>
      </div>

      {/* Editable Name & Description */}
      <div className="space-y-3 mb-6">
        <input
          type="text"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          onBlur={handleNameDescSave}
          placeholder="Template name"
          className="w-full text-lg font-semibold border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <input
          type="text"
          value={templateDesc}
          onChange={(e) => setTemplateDesc(e.target.value)}
          onBlur={handleNameDescSave}
          placeholder="Template description"
          className="w-full text-sm text-slate-600 border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Stats & Actions */}
      <div className="flex gap-4 mb-6 items-center justify-between">
        <div className="flex gap-4">
          <div className="flex items-center gap-3 bg-white rounded-lg border border-slate-200 px-6 py-3">
            <span className="text-2xl font-bold text-slate-800">{total}</span>
            <span className="text-sm text-slate-600">Total sections</span>
          </div>
          <div className="flex items-center gap-3 bg-white rounded-lg border border-slate-200 px-6 py-3">
            <span className="text-2xl font-bold text-green-600">{configured}</span>
            <span className="text-sm text-slate-600">Configured</span>
          </div>
          <div className="flex items-center gap-3 bg-white rounded-lg border border-slate-200 px-6 py-3">
            <span className="text-2xl font-bold text-amber-500">{total - configured}</span>
            <span className="text-sm text-slate-600">Needs config</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
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
            onClick={() => handleSave()}
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {saving ? 'Saving...' : 'Save Template'}
          </Button>
        </div>
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
                const groupConfigured = group.sections.filter(
                  (s) => {
                    const st = getSectionStatus(s);
                    return st === 'configured' || st === 'auto';
                  }
                ).length;

                return (
                  <Draggable key={group.group} draggableId={group.group} index={groupIdx}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`bg-white border border-slate-200 rounded-lg overflow-hidden ${
                          snapshot.isDragging ? 'shadow-lg border-indigo-400' : ''
                        }`}
                      >
                        <button
                          onClick={() => toggleGroup(group.group)}
                          {...provided.dragHandleProps}
                          className="w-full flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left cursor-grab active:cursor-grabbing"
                        >
                          <GripVertical className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-base flex-shrink-0">
                            {group.icon}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-slate-800">
                              {group.groupLabel}
                            </div>
                          </div>
                          <span className="text-xs font-medium text-slate-500">
                            {groupConfigured}/{group.sections.length} configured
                          </span>
                          <ChevronDown
                            className={`w-4 h-4 text-slate-400 transition-transform ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </button>

                        {isExpanded && (
                          <Droppable droppableId={group.group} type="SECTION">
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={`border-t border-slate-200 p-3 space-y-2 ${
                                  snapshot.isDraggingOver ? 'bg-indigo-50/50' : ''
                                }`}
                              >
                                {group.sections.map((section, sectionIdx) => {
                                  const status = getSectionStatus(section);
                                  const hasPrompt = !!section.prompt?.system;
                                  const hasExample = !!section.example_content;
                                  const feedCount = section.data_feeds?.length || 0;
                                  const claireIndicator = getClaireIndicator(section.id);

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
                                              ? 'shadow-md border-indigo-400'
                                              : claireIndicator === 'populated'
                                              ? 'border-green-300'
                                              : claireIndicator === 'gap'
                                              ? 'border-amber-300 bg-amber-50/30'
                                              : claireIndicator === 'skipped'
                                              ? 'opacity-40'
                                              : 'border-slate-200'
                                          }`}
                                        >
                                          <div
                                            {...provided.dragHandleProps}
                                            className="cursor-grab active:cursor-grabbing flex-shrink-0"
                                          >
                                            <GripVertical className="w-4 h-4 text-slate-300" />
                                          </div>

                                          {claireIndicator === 'mapped' || claireIndicator === 'populated' ? (
                                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-green-500" />
                                          ) : claireIndicator === 'gap' ? (
                                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-amber-500" />
                                          ) : (
                                            <StatusDot status={status} />
                                          )}

                                          <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm text-slate-800">
                                              {section.label}
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

                                          <div className="flex items-center gap-1.5 flex-shrink-0">
                                            <MiniBadge label="Prompt" active={hasPrompt} />
                                            <MiniBadge label="Example" active={hasExample} />
                                            <MiniBadge
                                              label={feedCount > 0 ? `${feedCount} feeds` : 'Feed'}
                                              active={feedCount > 0}
                                            />
                                          </div>

                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="flex-shrink-0 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openSectionEditor(section);
                                            }}
                                          >
                                            <Settings2 className="w-3.5 h-3.5 mr-1" />
                                            Configure
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="flex-shrink-0 text-red-500 border-red-200 hover:bg-red-50"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDeleteSection(section.id);
                                            }}
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </Button>
                                        </div>
                                      )}
                                    </Draggable>
                                  );
                                })}
                                {provided.placeholder}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full mt-2 border-dashed border-slate-300 text-slate-500 hover:text-indigo-600 hover:border-indigo-300"
                                  onClick={() => handleAddSection(group.group)}
                                >
                                  <Plus className="w-4 h-4 mr-1.5" />
                                  Add Section
                                </Button>
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

      <Button
        variant="outline"
        className="w-full mt-4 border-dashed border-slate-300 text-slate-500 hover:text-indigo-600 hover:border-indigo-300"
        onClick={handleAddSectionStandalone}
      >
        <Plus className="w-4 h-4 mr-1.5" />
        Add Section
      </Button>

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
  );
}
