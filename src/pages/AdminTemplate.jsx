import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  GripVertical,
  ChevronDown,
  ChevronLeft,
  Settings2,
  Upload,
  Loader2,
  AlertCircle,
  Sparkles,
  AlertTriangle,
  Home,
  ChevronRight,
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
  const [exampleCount, setExampleCount] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [claireOpen, setClaireOpen] = useState(false);
  const [claireSectionStates, setClaireSectionStates] = useState({});
  const [claireNewSections, setClaireNewSections] = useState([]);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoadingLibrary(true);
    try {
      let loaded;
      try {
        loaded = await base44.soaTemplateApi.getAvailable();
      } catch {
        loaded = await base44.entities.SOATemplate.filter({ owner_type: 'admin' });
      }
      setTemplates(loaded);
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

    if (tmpl.sections) {
      const parsed = typeof tmpl.sections === 'string'
        ? JSON.parse(tmpl.sections)
        : tmpl.sections;
      if (Array.isArray(parsed) && parsed.length > 0) {
        setSections(parsed);
        setExpandedGroups(parsed.map((g) => g.group));
      } else {
        setSections(JSON.parse(JSON.stringify(DEFAULT_SECTION_GROUPS)));
        setExpandedGroups(DEFAULT_SECTION_GROUPS.map((g) => g.group));
      }
    } else {
      setSections(JSON.parse(JSON.stringify(DEFAULT_SECTION_GROUPS)));
      setExpandedGroups(DEFAULT_SECTION_GROUPS.map((g) => g.group));
    }

    setView('editor');
    setLoading(false);
    loadExampleCount();
  };

  const loadExampleCount = async () => {
    try {
      const examples = await base44.entities.SoaExample.filter({ owner_type: 'admin' });
      setExampleCount(examples.length);
    } catch {
      // silent
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { sections: JSON.stringify(sections) };
      if (template?.id) {
        await base44.entities.SOATemplate.update(template.id, payload);
      } else {
        const created = await base44.entities.SOATemplate.create({
          owner_type: 'admin',
          ...payload,
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

  const handleExampleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploadResult = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.SoaExample.create({
        name: file.name,
        owner_type: 'admin',
        owner_id: 'admin',
        file_url: uploadResult.file_url || uploadResult.url,
        status: 'processing',
      });
      toast.success('Example uploaded — AI is analyzing your SOA...');
      loadExampleCount();
    } catch {
      toast.info('Example upload processing...');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleNewFromScratch = async () => {
    console.log('[DEBUG] handleNewFromScratch called');
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
      const created = await base44.entities.SOATemplate.create({
        owner_type: 'admin',
        name: 'New System Template',
        description: '',
        sections: JSON.stringify(emptySections),
      });
      console.log('[DEBUG] handleNewFromScratch created:', created);
      toast.success('Template created');
      await loadTemplates();
      openEditor(created);
    } catch (error) {
      console.error('[DEBUG] handleNewFromScratch error:', error);
      toast.error('Failed to create template');
    }
  };

  const handleNewFromDefault = async () => {
    console.log('[DEBUG] handleNewFromDefault called, templates:', templates);
    // Find the default template and duplicate it
    const defaultTmpl = templates.find((t) => t.name === 'PrimeSolve Default' || t.owner_type === 'admin');
    if (!defaultTmpl) {
      toast.error('No default template found — use "Start from scratch" instead');
      return;
    }
    try {
      const duplicated = await base44.soaTemplateApi.duplicate(defaultTmpl.id, {
        name: `${defaultTmpl.name || 'Default'} (Copy)`,
        ownerType: 'admin',
        ownerId: '00000000-0000-0000-0000-000000000000',
      });
      console.log('[DEBUG] handleNewFromDefault duplicated:', duplicated);
      toast.success('Template duplicated');
      await loadTemplates();
      openEditor(duplicated);
    } catch (error) {
      console.error('[DEBUG] handleNewFromDefault duplicate API error:', error);
      try {
        // Fallback: create manually
        const created = await base44.entities.SOATemplate.create({
          owner_type: 'admin',
          name: `${defaultTmpl.name || 'Default'} (Copy)`,
          description: defaultTmpl.description || '',
          sections: defaultTmpl.sections,
        });
        console.log('[DEBUG] handleNewFromDefault fallback created:', created);
        toast.success('Template duplicated');
        await loadTemplates();
        openEditor(created);
      } catch (fallbackError) {
        console.error('[DEBUG] handleNewFromDefault fallback error:', fallbackError);
        toast.error('Failed to duplicate template');
      }
    }
  };

  const handleDelete = async (tmpl) => {
    if (tmpl.name === 'PrimeSolve Default') {
      toast.error('Cannot delete the PrimeSolve Default template');
      return;
    }
    try {
      await base44.entities.SOATemplate.delete(tmpl.id);
      toast.success('Template deleted');
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
            ? { ...s, prompt: config.prompt, example_content: config.example_content, data_feeds: config.data_feeds }
            : s
        ),
      }))
    );
    toast.success('Section updated');
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
            let defaultTmpl = templates.find((t) => t.owner_type === 'admin');
            if (!defaultTmpl) {
              // No template loaded yet — create one so Claire has something to work with
              try {
                defaultTmpl = await base44.entities.SOATemplate.create({
                  owner_type: 'admin',
                  name: 'PrimeSolve Default',
                  description: '',
                  sections: JSON.stringify(DEFAULT_SECTION_GROUPS),
                });
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
          {template?.name || 'Edit Template'}
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
          Editing: {template?.name || 'PrimeSolve Default Template'}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure AI prompts, examples, and data feeds for each section
        </p>
      </div>

      {/* Example SOA Library Banner */}
      <div className="mb-6 rounded-xl p-5 text-white" style={{ background: 'linear-gradient(135deg, #312e81 0%, #4338ca 50%, #6366f1 100%)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg mb-1">Example SOA Library</h3>
            <p className="text-indigo-200 text-sm">
              Upload complete SOA documents. The AI will extract each section to learn your style and structure.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {exampleCount > 0 && (
              <span className="text-sm text-indigo-200">
                {exampleCount} example{exampleCount !== 1 ? 's' : ''}
              </span>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx"
              onChange={handleExampleUpload}
              className="hidden"
            />
            <Button
              className="bg-white text-indigo-700 hover:bg-indigo-50"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-1.5" />
              )}
              Upload Example SOA
            </Button>
          </div>
        </div>
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
            onClick={handleSave}
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
