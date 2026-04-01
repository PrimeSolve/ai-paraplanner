import React, { useState, useEffect, useMemo } from 'react';
import axiosInstance from '@/api/axiosInstance';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  GripVertical,
  ChevronDown,
  ChevronUp,
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
  Eye,
  TrendingUp,
  DollarSign,
  Shield,
  Search,
  Copy,
  Share2,
  Pencil,
} from 'lucide-react';
import { toast } from 'sonner';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { getIconComponent } from '@/components/IconPicker';
import { FileText as DefaultSectionIcon } from 'lucide-react';
import SectionConfigEditor from '@/components/soa/SectionConfigEditor';
import ClairePanel from '@/components/soa/ClairePanel';
import SOATemplateStylingPanel from '@/components/SOATemplateStylingPanel';
import {
  DEFAULT_SECTION_GROUPS,
  getSectionStatus,
  countConfigured,
  DATA_SOURCES,
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
      style={{ width: 7, height: 7, backgroundColor: colorMap[status] || colorMap['needs-config'] }}
    />
  );
}

function MiniBadge({ label, active, variant }) {
  const styles = {
    prompt: active
      ? { backgroundColor: '#ede9fe', color: '#6d28d9' }
      : { backgroundColor: 'var(--color-background-secondary, #f1f5f9)', color: 'var(--color-text-secondary, #64748b)' },
    example: active
      ? { backgroundColor: '#dcfce7', color: '#15803d' }
      : { backgroundColor: 'var(--color-background-secondary, #f1f5f9)', color: 'var(--color-text-secondary, #64748b)' },
    feed: active
      ? { backgroundColor: '#fef3c7', color: '#b45309' }
      : { backgroundColor: 'var(--color-background-secondary, #f1f5f9)', color: 'var(--color-text-secondary, #64748b)' },
  };
  const s = styles[variant] || styles.prompt;
  return (
    <span
      className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
      style={s}
    >
      {label}
    </span>
  );
}

const GROUP_ICON_DEFAULTS = [
  { bg: '#ede9fe', fg: '#6d28d9', Icon: DefaultSectionIcon },
  { bg: '#dcfce7', fg: '#15803d', Icon: TrendingUp },
  { bg: '#fef3c7', fg: '#b45309', Icon: DollarSign },
  { bg: '#dbeafe', fg: '#1d4ed8', Icon: Shield },
];

function getGroupIconStyle(groupIdx) {
  if (groupIdx < GROUP_ICON_DEFAULTS.length) return GROUP_ICON_DEFAULTS[groupIdx];
  return { bg: 'var(--color-background-secondary, #f1f5f9)', fg: '#64748b', Icon: DefaultSectionIcon };
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
  const [settingsPanelTemplateId, setSettingsPanelTemplateId] = useState(null);
  const [claireSectionStates, setClaireSectionStates] = useState({});
  const [claireNewSections, setClaireNewSections] = useState([]);
  const [templateName, setTemplateName] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const [editingGroupLabel, setEditingGroupLabel] = useState(null);

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
        if (Array.isArray(secs)) {
          if (secs.length === 0) {
            setSections([]);
            setExpandedGroups([]);
            loaded = true;
          } else {
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
      if (Array.isArray(parsed)) {
        if (parsed.length === 0) {
          setSections([]);
          setExpandedGroups([]);
          loaded = true;
        } else {
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
      console.log('[handleSave] template.id:', template?.id);
      console.log('[handleSave] sectionData length:', sectionData.length);
      if (template?.id) {
        const response = await axiosInstance.put(`/soa-templates/${template.id}`, {
          name: templateName,
          description: templateDesc,
          sections: sectionData,
        });
        console.log('[handleSave] PUT response:', response.status, response.data?.sections ? 'has sections' : 'NO sections');
      } else {
        const { data: created } = await axiosInstance.post('/soa-templates', {
          name: templateName,
          description: templateDesc,
          ownerType: 0,
          ownerId: template?.ownerId ?? template?.owner_id ?? '00000000-0000-0000-0000-000000000000',
          sections: sectionData,
        });
        console.log('[handleSave] POST response:', created?.id);
        setTemplate(created);
      }
      toast.success('Template saved successfully');
      // Refresh library data
      loadTemplates();
    } catch (error) {
      console.error('[handleSave] SAVE FAILED:', error);
      console.error('[handleSave] Response:', error.response?.status, JSON.stringify(error.response?.data, null, 2));
      console.error('[handleSave] Validation errors:', JSON.stringify(error.response?.data?.errors, null, 2));
      toast.error(`Failed to save template: ${error.response?.status || error.message}`);
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
    } catch (error) {
      console.error('[handleNameDescSave] SAVE FAILED:', error);
      console.error('[handleNameDescSave] Response:', error.response?.status, error.response?.data);
      toast.error(`Failed to save: ${error.response?.status || error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleNewFromScratch = async () => {
    try {
      const { data: created } = await axiosInstance.post('/soa-templates', {
        name: 'New Template',
        description: '',
        ownerType: 0,
        ownerId: '00000000-0000-0000-0000-000000000000',
        category: 'Default',
        templateData: JSON.stringify({ sections: [] }),
        isActive: true,
      });
      toast.success('Template created');
      await loadTemplates();
      openEditor(created);
    } catch (error) {
      console.error('handleNewFromScratch error:', error);
      toast.error('Failed to create template');
    }
  };

  const handleDuplicate = async (tmpl) => {
    try {
      const { data: duplicated } = await axiosInstance.post(
        `/soa-templates/${tmpl.id}/duplicate`,
        {
          name: `${tmpl.name} (Copy)`,
          ownerType: 0,
          ownerId: '00000000-0000-0000-0000-000000000000',
        }
      );
      toast.success('Template duplicated');
      await loadTemplates();
      openEditor(duplicated);
    } catch (error) {
      console.error('handleDuplicate error:', error);
      toast.error('Failed to duplicate template');
    }
  };

  const handleShareToggle = async (tmpl) => {
    try {
      if (tmpl.isShared || tmpl.is_shared) {
        await axiosInstance.delete(`/soa-templates/${tmpl.id}/share`);
        toast.success('Template unshared');
      } else {
        await axiosInstance.post(`/soa-templates/${tmpl.id}/share`, {});
        toast.success('Template shared');
      }
      await loadTemplates();
    } catch (error) {
      console.error('handleShareToggle error:', error);
      toast.error('Failed to update sharing');
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
          ? { ...s, label: config.label, desc: config.desc, icon: config.icon, prompt: config.prompt, example_content: config.example_content, data_feeds: config.data_feeds }
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

  const handleAddGroup = () => {
    const newGroup = {
      group: crypto.randomUUID(),
      groupLabel: 'New Section',
      icon: '',
      sections: [],
    };
    const newSections = [...sections, newGroup];
    setSections(newSections);
    setExpandedGroups((prev) => [...prev, newGroup.group]);
    handleSave(newSections);
  };

  const handleDeleteGroup = (groupKey) => {
    const group = sections.find((g) => g.group === groupKey);
    if (!window.confirm(`Delete "${group?.groupLabel}" and all its sub-sections? This cannot be undone.`)) return;
    const newSections = sections.filter((g) => g.group !== groupKey);
    setSections(newSections);
    handleSave(newSections);
    toast.success('Section deleted');
  };

  const handleGroupLabelChange = (groupKey, newLabel) => {
    const newSections = sections.map((g) =>
      g.group === groupKey ? { ...g, groupLabel: newLabel } : g
    );
    setSections(newSections);
    handleSave(newSections);
    setEditingGroupLabel(null);
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

  // ── Library filter state ──
  const [searchTerm, setSearchTerm] = useState('');
  const [shareFilter, setShareFilter] = useState('all');

  const filteredTemplates = useMemo(() => {
    let list = templates;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (t) =>
          (t.name || '').toLowerCase().includes(q) ||
          (t.description || '').toLowerCase().includes(q)
      );
    }
    if (shareFilter === 'shared') {
      list = list.filter((t) => t.isShared || t.is_shared);
    } else if (shareFilter === 'system') {
      list = list.filter((t) => (t.ownerType ?? t.owner_type) === 0);
    }
    return list;
  }, [templates, searchTerm, shareFilter]);

  // Helper: parse sections from a template object
  const parseSections = (tmpl) => {
    const raw = tmpl.sections || tmpl.templateData || tmpl.template_data;
    if (!raw) return [];
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      const unwrapped = parsed?.sections || parsed;
      return Array.isArray(unwrapped) ? unwrapped : [];
    } catch {
      return [];
    }
  };

  // Helper: format date for display
  const formatTemplateDate = (tmpl) => {
    const d = tmpl.updatedAt || tmpl.updated_at || tmpl.createdAt || tmpl.created_at;
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return '—'; }
  };

  // Determine active template (first one marked isActive, or the PrimeSolve Default)
  const activeTemplateId = useMemo(() => {
    const active = templates.find((t) => t.isActive || t.is_active);
    if (active) return active.id;
    const ps = templates.find((t) => t.name === 'PrimeSolve Default');
    return ps?.id || null;
  }, [templates]);

  // ── LIBRARY VIEW ──
  if (view === 'library') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-background, #f8fafc)' }}>
        {/* TOPBAR breadcrumb */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 28px',
            fontSize: 13,
            color: '#64748b',
            borderBottom: '1px solid #e2e8f0',
            background: '#fff',
          }}
        >
          <span style={{ fontSize: 15 }}>🏠</span>
          <ChevronRight style={{ width: 14, height: 14, color: '#94a3b8' }} />
          <span style={{ color: '#1e293b', fontWeight: 600 }}>SOA Templates</span>
          <span
            style={{
              marginLeft: 6,
              background: 'linear-gradient(135deg, #00C9B1, #1E88E5)',
              color: '#fff',
              fontSize: 11,
              fontWeight: 700,
              borderRadius: 10,
              padding: '1px 8px',
              minWidth: 20,
              textAlign: 'center',
            }}
          >
            {templates.length}
          </span>
        </div>

        {/* PAGE CONTENT */}
        <div style={{ padding: '28px 32px' }}>
          {/* PAGE HEADER */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <h1
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 22,
                  fontWeight: 700,
                  color: '#1e293b',
                  margin: 0,
                  letterSpacing: '-0.3px',
                }}
              >
                SOA Templates
              </h1>
              <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                Manage system-level SOA document templates available to all advice groups
              </p>
            </div>
            <button
              onClick={handleNewFromScratch}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'linear-gradient(135deg, #00C9B1, #00A693)',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '9px 18px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,201,177,0.25)',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,201,177,0.35)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,201,177,0.25)'; }}
            >
              <Plus style={{ width: 15, height: 15 }} />
              New Template
            </button>
          </div>

          {/* FILTERS BAR */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 20,
            }}
          >
            <div style={{ position: 'relative' }}>
              <Search
                style={{
                  position: 'absolute',
                  left: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 15,
                  height: 15,
                  color: '#94a3b8',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: 260,
                  padding: '8px 12px 8px 32px',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  fontSize: 13,
                  color: '#1e293b',
                  background: '#fff',
                  outline: 'none',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#00C9B1')}
                onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
              />
            </div>
            <select
              value={shareFilter}
              onChange={(e) => setShareFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                fontSize: 13,
                color: '#1e293b',
                background: '#fff',
                cursor: 'pointer',
                outline: 'none',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#00C9B1')}
              onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
            >
              <option value="all">All Templates</option>
              <option value="shared">Shared</option>
              <option value="system">System Only</option>
            </select>
            <span style={{ marginLeft: 'auto', fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>
              {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* LOADING STATE */}
          {loadingLibrary && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    borderRadius: 14,
                    border: '1px solid #e2e8f0',
                    background: '#fff',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ padding: '16px 18px 12px', background: '#F8FAFB', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ width: 100, height: 14, background: '#e2e8f0', borderRadius: 4 }} className="animate-pulse" />
                  </div>
                  <div style={{ padding: '12px 18px' }}>
                    <div style={{ width: '80%', height: 10, background: '#f1f5f9', borderRadius: 3, marginBottom: 10 }} className="animate-pulse" />
                    <div style={{ width: '50%', height: 10, background: '#f1f5f9', borderRadius: 3 }} className="animate-pulse" />
                  </div>
                  <div style={{ padding: '10px 14px', background: '#f8fafc', borderTop: '1px solid #f1f5f9' }}>
                    <div style={{ width: 60, height: 24, background: '#e2e8f0', borderRadius: 4 }} className="animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* EMPTY STATE */}
          {!loadingLibrary && filteredTemplates.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <p style={{ fontSize: 15, color: '#64748b', fontWeight: 500 }}>No templates found</p>
              <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
                {searchTerm || shareFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Create your first template to get started'}
              </p>
            </div>
          )}

          {/* TEMPLATE GRID */}
          {!loadingLibrary && filteredTemplates.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {filteredTemplates.map((tmpl) => {
                const secs = parseSections(tmpl);
                const { configured: cfgCount, total: totalCount } = countConfigured(secs);
                const isActive = tmpl.id === activeTemplateId;
                const isShared = tmpl.isShared || tmpl.is_shared || false;

                return (
                  <div
                    key={tmpl.id}
                    style={{
                      borderRadius: 14,
                      border: isActive
                        ? '1px solid rgba(0,201,177,0.4)'
                        : '1px solid #e2e8f0',
                      background: '#fff',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                      boxShadow: isActive
                        ? '0 0 0 3px rgba(0,201,177,0.10), 0 2px 8px rgba(0,201,177,0.12)'
                        : '0 1px 3px rgba(0,0,0,0.04)',
                      cursor: 'default',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = isActive
                        ? '0 0 0 3px rgba(0,201,177,0.15), 0 8px 24px rgba(0,201,177,0.18)'
                        : '0 8px 24px rgba(0,0,0,0.08)';
                      if (!isActive) e.currentTarget.style.borderColor = 'rgba(0,201,177,0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = isActive
                        ? '0 0 0 3px rgba(0,201,177,0.10), 0 2px 8px rgba(0,201,177,0.12)'
                        : '0 1px 3px rgba(0,0,0,0.04)';
                      e.currentTarget.style.borderColor = isActive
                        ? 'rgba(0,201,177,0.4)'
                        : '#e2e8f0';
                    }}
                  >
                    {/* Top bar gradient for active */}
                    {isActive && (
                      <div
                        style={{
                          height: 2,
                          background: 'linear-gradient(90deg, #00C9B1, #1E88E5)',
                          width: '100%',
                          flexShrink: 0,
                        }}
                      />
                    )}

                    {/* Card preview area */}
                    <div
                      style={{
                        padding: '16px 18px 12px',
                        background: '#F8FAFB',
                        borderBottom: '1px solid #f1f5f9',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 14,
                      }}
                    >
                      {/* CSS document preview */}
                      <div
                        style={{
                          width: 36,
                          minWidth: 36,
                          background: '#fff',
                          border: '1px solid #e2e8f0',
                          borderRadius: 4,
                          padding: '6px 5px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 3,
                          flexShrink: 0,
                        }}
                      >
                        {[100, 80, 60, 50, 100, 80, 60, 50].map((w, i) => (
                          <div
                            key={i}
                            style={{
                              height: 2,
                              borderRadius: 1,
                              width: `${w}%`,
                              background:
                                i === 0 && isActive
                                  ? '#00C9B1'
                                  : '#d1d5db',
                            }}
                          />
                        ))}
                      </div>

                      {/* Card name + badges */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: '#1e293b',
                            lineHeight: 1.3,
                            marginBottom: 6,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {tmpl.name || 'Untitled Template'}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                          {isActive && (
                            <span
                              style={{
                                display: 'inline-block',
                                fontSize: 10,
                                fontWeight: 600,
                                padding: '2px 7px',
                                borderRadius: 10,
                                background: '#dcfce7',
                                color: '#15803d',
                              }}
                            >
                              Active
                            </span>
                          )}
                          {isShared && (
                            <span
                              style={{
                                display: 'inline-block',
                                fontSize: 10,
                                fontWeight: 600,
                                padding: '2px 7px',
                                borderRadius: 10,
                                background: '#dbeafe',
                                color: '#1d4ed8',
                              }}
                            >
                              Shared
                            </span>
                          )}
                          <span
                            style={{
                              display: 'inline-block',
                              fontSize: 10,
                              fontWeight: 600,
                              padding: '2px 7px',
                              borderRadius: 10,
                              background: '#f1f5f9',
                              color: '#64748b',
                            }}
                          >
                            System
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card body */}
                    <div style={{ padding: '12px 18px', flex: 1 }}>
                      {tmpl.description && (
                        <p
                          style={{
                            fontSize: 11,
                            color: '#64748b',
                            lineHeight: 1.5,
                            margin: '0 0 10px 0',
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {tmpl.description}
                        </p>
                      )}
                      {/* Metrics row */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          fontSize: 11,
                          color: '#94a3b8',
                        }}
                      >
                        <span>{totalCount} section{totalCount !== 1 ? 's' : ''}</span>
                        <span style={{ color: '#d1d5db' }}>|</span>
                        <span>{cfgCount} configured</span>
                        <span style={{ color: '#d1d5db' }}>|</span>
                        <span>{formatTemplateDate(tmpl)}</span>
                      </div>
                    </div>

                    {/* Action bar (card footer) */}
                    <div
                      style={{
                        padding: '10px 14px',
                        background: '#f8fafc',
                        borderTop: '1px solid #f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      {/* Edit — primary teal style */}
                      <button
                        onClick={() => openEditor(tmpl)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 12,
                          fontWeight: 600,
                          color: '#00C9B1',
                          background: 'rgba(0,201,177,0.08)',
                          border: '1px solid rgba(0,201,177,0.3)',
                          borderRadius: 6,
                          padding: '5px 10px',
                          cursor: 'pointer',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,201,177,0.15)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0,201,177,0.08)')}
                      >
                        <Pencil style={{ width: 12, height: 12 }} />
                        Edit
                      </button>
                      {/* Duplicate — ghost */}
                      <button
                        onClick={() => handleDuplicate(tmpl)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 12,
                          fontWeight: 500,
                          color: '#64748b',
                          background: 'transparent',
                          border: '1px solid #e2e8f0',
                          borderRadius: 6,
                          padding: '5px 10px',
                          cursor: 'pointer',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <Copy style={{ width: 12, height: 12 }} />
                        Duplicate
                      </button>
                      {/* Share — ghost */}
                      <button
                        onClick={() => handleShareToggle(tmpl)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 12,
                          fontWeight: 500,
                          color: '#64748b',
                          background: 'transparent',
                          border: '1px solid #e2e8f0',
                          borderRadius: 6,
                          padding: '5px 10px',
                          cursor: 'pointer',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <Share2 style={{ width: 12, height: 12 }} />
                        Share
                      </button>

                      <div style={{ flex: 1 }} />

                      {/* Delete — ghost, red on hover, hidden for active template */}
                      {!isActive && (
                        <button
                          onClick={() => handleDelete(tmpl)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 12,
                            fontWeight: 500,
                            color: '#64748b',
                            background: 'transparent',
                            border: '1px solid #e2e8f0',
                            borderRadius: 6,
                            padding: '5px 10px',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#ef4444';
                            e.currentTarget.style.borderColor = '#fca5a5';
                            e.currentTarget.style.background = '#fef2f2';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = '#64748b';
                            e.currentTarget.style.borderColor = '#e2e8f0';
                            e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <Trash2 style={{ width: 12, height: 12 }} />
                          Delete
                        </button>
                      )}

                      {/* Configure — blue tint style */}
                      <button
                        onClick={() => openEditor(tmpl)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 12,
                          fontWeight: 600,
                          color: '#1E88E5',
                          background: 'rgba(30,136,229,0.08)',
                          border: '1px solid rgba(30,136,229,0.25)',
                          borderRadius: 6,
                          padding: '5px 10px',
                          cursor: 'pointer',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(30,136,229,0.15)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(30,136,229,0.08)')}
                      >
                        <Settings2 style={{ width: 12, height: 12 }} />
                        Configure
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

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
    {/* Back navigation bar (Change 1) */}
    <div
      className="flex items-center gap-2 bg-white text-sm"
      style={{ borderBottom: '0.5px solid #e2e8f0', padding: '10px 24px' }}
    >
      <button
        onClick={() => { setView('library'); setClaireOpen(false); }}
        className="flex items-center gap-1 text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to templates
      </button>
      <span className="text-slate-300 select-none">/</span>
      <span className="text-slate-800 font-semibold">
        {templateName || 'AI Paraplanner'}
      </span>
    </div>

    <div className={`flex flex-1 ${claireOpen ? 'overflow-hidden' : ''}`}>
    <div className={`py-6 px-8 ${claireOpen ? 'w-[65%] overflow-y-auto' : 'w-full'} transition-all`}>

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

      {/* Stats & Actions (Change 2) */}
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
          <Button
            variant="outline"
            className="hover:bg-purple-50"
            style={{ borderColor: '#6366f1', color: '#6366f1' }}
            onClick={() => toast.info('Generating preview with dummy data…')}
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
                const groupStyle = getGroupIconStyle(groupIdx);
                const GroupIcon = group.icon ? (getIconComponent(group.icon) || groupStyle.Icon) : groupStyle.Icon;

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
                        {/* Group header (Change 3) */}
                        <div
                          {...provided.dragHandleProps}
                          onClick={() => toggleGroup(group.group)}
                          className="w-full flex items-center gap-3 p-4 hover:bg-slate-100 transition-colors text-left cursor-grab active:cursor-grabbing"
                          style={{
                            backgroundColor: 'var(--color-background-secondary, #f8fafc)',
                            borderBottom: isExpanded ? '0.5px solid #e2e8f0' : 'none',
                          }}
                        >
                          <span className="text-slate-400 flex-shrink-0 select-none" style={{ fontSize: 16, lineHeight: 1 }}>⠿</span>
                          <div
                            className="flex items-center justify-center flex-shrink-0 rounded-lg"
                            style={{ width: 32, height: 32, backgroundColor: groupStyle.bg }}
                          >
                            <GroupIcon style={{ width: 18, height: 18, color: groupStyle.fg }} />
                          </div>
                          <div className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                            {editingGroupLabel === group.group ? (
                              <input
                                type="text"
                                defaultValue={group.groupLabel}
                                autoFocus
                                className="bg-white border border-indigo-300 rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                                style={{ fontSize: 14, fontWeight: 500 }}
                                onClick={(e) => e.stopPropagation()}
                                onBlur={(e) => handleGroupLabelChange(group.group, e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.target.blur();
                                  }
                                }}
                              />
                            ) : (
                              <div
                                className="text-slate-800 cursor-text hover:bg-white hover:px-2 hover:py-0.5 hover:rounded hover:border hover:border-slate-300 transition-all"
                                style={{ fontSize: 14, fontWeight: 500 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingGroupLabel(group.group);
                                }}
                              >
                                {group.groupLabel}
                              </div>
                            )}
                          </div>
                          <span className="flex-shrink-0" style={{ fontSize: 12, color: '#64748b' }}>
                            {groupConfigured} / {group.sections.length} configured
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="flex-shrink-0 text-red-400 hover:text-red-600 hover:bg-red-50 p-1 h-auto"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteGroup(group.group);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <span className="flex-shrink-0">
                            {isExpanded
                              ? <ChevronUp className="w-4 h-4 text-slate-400" />
                              : <ChevronDown className="w-4 h-4 text-slate-400" />
                            }
                          </span>
                        </div>

                        {/* Sub-section rows (Change 3 & 4) */}
                        {isExpanded && (
                          <Droppable droppableId={group.group} type="SECTION">
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={`p-3 space-y-2 ${
                                  snapshot.isDraggingOver ? 'bg-indigo-50/50' : ''
                                }`}
                              >
                                {group.sections.map((section, sectionIdx) => {
                                  const status = getSectionStatus(section);
                                  const hasPrompt = !!section.prompt?.system;
                                  const hasExample = !!section.example_content;
                                  const feedCount = section.data_feeds?.length || 0;
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

                                          <StatusDot status={status} />

                                          {/* Sub-icon 26x26 rounded square */}
                                          <div
                                            className="flex items-center justify-center flex-shrink-0 rounded-md"
                                            style={{
                                              width: 26,
                                              height: 26,
                                              backgroundColor: section.icon
                                                ? groupStyle.bg
                                                : 'var(--color-background-secondary, #f1f5f9)',
                                            }}
                                          >
                                            <SectionIcon
                                              style={{
                                                width: 14,
                                                height: 14,
                                                color: section.icon ? groupStyle.fg : '#64748b',
                                              }}
                                            />
                                          </div>

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
                                            <MiniBadge label="Prompt" active={hasPrompt} variant="prompt" />
                                            <MiniBadge label="Example" active={hasExample} variant="example" />
                                            <MiniBadge
                                              label={feedCount > 0 ? `${feedCount} feeds` : 'Feed'}
                                              active={feedCount > 0}
                                              variant="feed"
                                            />
                                          </div>

                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="flex-shrink-0 hover:bg-indigo-50"
                                            style={{ borderColor: '#a5b4fc', color: '#6366f1' }}
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
                                {/* Add sub-section button */}
                                <button
                                  className="w-full mt-2 flex items-center justify-center gap-1.5 py-2 text-sm rounded-lg transition-colors"
                                  style={{ color: '#64748b' }}
                                  onMouseEnter={(e) => { e.currentTarget.style.color = '#6366f1'; e.currentTarget.style.backgroundColor = '#f5f3ff'; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                                  onClick={() => handleAddSection(group.group)}
                                >
                                  <Plus className="w-4 h-4" />
                                  Add Sub-section
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

      <Button
        variant="outline"
        className="w-full mt-4 border-dashed border-slate-300 text-slate-500 hover:text-indigo-600 hover:border-indigo-300"
        onClick={handleAddGroup}
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
    </div>
  );
}
