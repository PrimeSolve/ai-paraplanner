import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import axiosInstance from '@/api/axiosInstance';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  AlertCircle,
  Loader2,
  Home,
  ChevronRight,
  FileText,
  TrendingUp,
  DollarSign,
  Shield,
} from 'lucide-react';
import { getIconComponent } from '@/components/IconPicker';
import { FileText as DefaultSectionIcon } from 'lucide-react';
import ExampleSOALibrary from '@/components/soa/ExampleSOALibrary';
import TemplateLibrary from '@/components/soa/TemplateLibrary';
import SOATemplateStylingPanel from '@/components/SOATemplateStylingPanel';
import {
  DEFAULT_SECTION_GROUPS,
  getSectionStatus,
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

function DataFeedChip({ feedKey }) {
  const [source, field] = feedKey.split('.');
  const sourceConfig = DATA_SOURCES[source];
  const fieldConfig = sourceConfig?.fields[field];
  if (!sourceConfig || !fieldConfig) return null;

  return (
    <span
      className="inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded text-white"
      style={{ backgroundColor: sourceConfig.color }}
    >
      {fieldConfig.label}
    </span>
  );
}

export default function AdviserSOATemplate() {
  // View state: 'library' or 'detail'
  const [view, setView] = useState('library');

  // Library state
  const [templates, setTemplates] = useState([]);
  const [loadingLibrary, setLoadingLibrary] = useState(true);
  const [activeTemplateId, setActiveTemplateId] = useState(null);
  // TODO: Check user.permissions.canOverrideSOATemplate from auth context
  const [canOverride, setCanOverride] = useState(false);

  // Detail/view state
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState([]);
  const [effectiveSections, setEffectiveSections] = useState([]);
  const [viewingTemplate, setViewingTemplate] = useState(null);
  const [settingsPanelTemplateId, setSettingsPanelTemplateId] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      // TODO: Check user.permissions.canOverrideSOATemplate from auth context
      setCanOverride(currentUser?.permissions?.canOverrideSOATemplate ?? false);
      await loadTemplates(currentUser);
    } catch (error) {
      console.error('Failed to load user:', error);
      setLoadingLibrary(false);
    }
  };

  const loadTemplates = async (currentUser) => {
    const usr = currentUser || user;
    setLoadingLibrary(true);
    try {
      let loaded;
      try {
        loaded = await base44.soaTemplateApi.getAvailable();
      } catch {
        // Fallback: load all templates via axiosInstance
        try {
          const response = await axiosInstance.get('/soa-templates');
          const data = Array.isArray(response.data) ? response.data : (response.data?.items || []);
          loaded = data;
        } catch {
          loaded = [];
        }
      }
      setTemplates(loaded);

      // Determine active template (adviser-level or group default)
      // TODO: Check adviser's selected template or advice group's defaultTemplateId
      const groupTmpls = loaded.filter((t) => (t.ownerType ?? t.owner_type) === 1);
      if (groupTmpls.length > 0) {
        setActiveTemplateId(groupTmpls[0].id);
      } else if (loaded.length > 0) {
        setActiveTemplateId(loaded[0].id);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoadingLibrary(false);
    }
  };

  const viewTemplateDetail = (tmpl) => {
    setViewingTemplate(tmpl);

    let sections;
    const rawSections = tmpl.sections || tmpl.template_data;
    if (rawSections) {
      const parsed = typeof rawSections === 'string'
        ? JSON.parse(rawSections)
        : rawSections;
      // Handle wrapped format { sections: [...] }
      const unwrapped = parsed?.sections || parsed;
      sections = Array.isArray(unwrapped) ? unwrapped : JSON.parse(JSON.stringify(DEFAULT_SECTION_GROUPS));
    } else {
      sections = JSON.parse(JSON.stringify(DEFAULT_SECTION_GROUPS));
    }

    // Filter out disabled sections
    const filtered = sections.map((group) => ({
      ...group,
      sections: group.sections.filter((s) => s.enabled !== false),
    })).filter((group) => group.sections.length > 0);

    setEffectiveSections(filtered);
    setExpandedGroups(filtered.map((g) => g.group));
    setView('detail');
  };

  const toggleGroup = (groupId) => {
    setExpandedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((g) => g !== groupId)
        : [...prev, groupId]
    );
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
            View your available SOA document templates
          </p>
        </div>

        {/* Permission restriction message */}
        {!canOverride && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-amber-800">
              <strong>Template editing is restricted.</strong> Your advice group administrator
              has not enabled template overrides for advisers. Contact your advice group admin
              to request access.
            </p>
          </div>
        )}

        <TemplateLibrary
          templates={templates}
          activeTemplateId={activeTemplateId}
          defaultTemplateId={templates.find((t) => (t.ownerType ?? t.owner_type) === 0)?.id}
          onEdit={viewTemplateDetail}
          onView={viewTemplateDetail}
          onDuplicate={viewTemplateDetail}
          onDelete={() => {}}
          onStylingSettings={(tmpl) => setSettingsPanelTemplateId(tmpl.id)}
          level="adviser"
          canCreate={canOverride}
          loading={loadingLibrary}
        />

        {settingsPanelTemplateId && (
          <SOATemplateStylingPanel
            templateId={settingsPanelTemplateId}
            onClose={() => setSettingsPanelTemplateId(null)}
          />
        )}

        {/* Example SOA Library */}
        {user && (
          <div className="mt-8">
            <ExampleSOALibrary
              ownerType="adviser"
              ownerId={user.id}
              onExtractedSections={() => {}}
            />
          </div>
        )}
      </div>
    );
  }

  // ── DETAIL VIEW (read-only) ──
  return (
    <div>
      {/* Back navigation bar */}
      <div
        className="flex items-center gap-2 bg-white"
        style={{ padding: '10px 24px', borderBottom: '0.5px solid #e2e8f0' }}
      >
        <button
          onClick={() => setView('library')}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to templates
        </button>
        <span className="text-sm text-slate-300">/</span>
        <span className="text-sm text-slate-800 font-semibold">
          {viewingTemplate?.name || 'AI Paraplanner'}
        </span>
      </div>

    <div className="py-6 px-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {viewingTemplate?.name || 'SOA Section Configuration'}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          View your effective template sections
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-6 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-teal-900 mb-0.5">Read-Only View</h4>
          <p className="text-sm text-teal-700">
            Your SOA sections are configured by your advice group. You can upload example SOAs below to help the AI match your writing style and preferences.
          </p>
        </div>
      </div>

      {/* Section Groups */}
      <div className="space-y-3">
        {effectiveSections.map((group, groupIdx) => {
          const isExpanded = expandedGroups.includes(group.group);
          const groupIconStyle = getGroupIconStyle(groupIdx);
          const GroupIcon = groupIconStyle.Icon;
          const groupConfigured = group.sections.filter(
            (s) => { const st = getSectionStatus(s); return st === 'configured' || st === 'auto'; }
          ).length;

          return (
            <Card key={group.group} className="overflow-hidden">
              {/* Group header */}
              <button
                onClick={() => toggleGroup(group.group)}
                className="w-full flex items-center gap-3 p-4 hover:bg-slate-100 transition-colors text-left"
                style={{
                  backgroundColor: 'var(--color-background-secondary, #f8fafc)',
                  borderBottom: isExpanded ? '0.5px solid #e2e8f0' : 'none',
                }}
              >
                <span className="text-slate-400 flex-shrink-0" style={{ fontSize: 16, lineHeight: 1 }}>⠿</span>
                <div
                  className="flex items-center justify-center flex-shrink-0 rounded-lg"
                  style={{ width: 32, height: 32, backgroundColor: groupIconStyle.bg }}
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

              {isExpanded && (
                <div className="p-3 space-y-2">
                  {group.sections.map((section) => {
                    const status = getSectionStatus(section);
                    const hasPrompt = !!section.prompt?.system;
                    const hasExample = !!section.example_content;
                    const feedCount = section.data_feeds?.length || 0;
                    const SectionIcon = getIconComponent(section.icon) || DefaultSectionIcon;

                    return (
                      <div
                        key={section.id}
                        className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg"
                      >
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

                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-slate-800">
                            {section.label}
                          </div>
                          <div className="text-xs text-slate-500 truncate">
                            {section.desc}
                          </div>
                          {feedCount > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {section.data_feeds.slice(0, 5).map((feed) => (
                                <DataFeedChip key={feed} feedKey={feed} />
                              ))}
                              {feedCount > 5 && (
                                <span className="text-[10px] text-slate-400 font-medium px-1.5 py-0.5">
                                  +{feedCount - 5} more
                                </span>
                              )}
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
            onExtractedSections={() => {}}
          />
        </div>
      )}
    </div>
    </div>
  );
}
