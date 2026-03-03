import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import ExampleSOALibrary from '@/components/soa/ExampleSOALibrary';
import {
  DEFAULT_SECTION_GROUPS,
  getSectionStatus,
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
      className={`w-2 h-2 rounded-full flex-shrink-0 ${colors[status] || colors['needs-config']}`}
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
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState([]);
  const [effectiveSections, setEffectiveSections] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      let mergedSections = JSON.parse(JSON.stringify(DEFAULT_SECTION_GROUPS));

      // Load admin template
      try {
        const adminTemplates = await base44.entities.SOATemplate.filter({ owner_type: 'admin' });
        if (adminTemplates[0]?.sections) {
          const loaded = typeof adminTemplates[0].sections === 'string'
            ? JSON.parse(adminTemplates[0].sections)
            : adminTemplates[0].sections;
          if (Array.isArray(loaded) && loaded.length > 0) {
            mergedSections = loaded;
          }
        }
      } catch { /* silent */ }

      // Override with group template
      if (currentUser.advice_group_id) {
        try {
          const groupTemplates = await base44.entities.SOATemplate.filter({
            owner_type: 'advice_group',
            advice_group_id: currentUser.advice_group_id,
          });
          if (groupTemplates[0]?.sections) {
            const loaded = typeof groupTemplates[0].sections === 'string'
              ? JSON.parse(groupTemplates[0].sections)
              : groupTemplates[0].sections;
            if (Array.isArray(loaded) && loaded.length > 0) {
              mergedSections = loaded;
            }
          }
        } catch { /* silent */ }
      }

      // Filter out disabled sections
      const filtered = mergedSections.map((group) => ({
        ...group,
        sections: group.sections.filter((s) => s.enabled !== false),
      })).filter((group) => group.sections.length > 0);

      setEffectiveSections(filtered);
      setExpandedGroups(filtered.map((g) => g.group));
    } catch (error) {
      console.error('Failed to load user:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleGroup = (groupId) => {
    setExpandedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((g) => g !== groupId)
        : [...prev, groupId]
    );
  };

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
        <div className="text-xs font-semibold text-teal-600 uppercase tracking-wide mb-1">
          My SOA Template
        </div>
        <h1 className="text-2xl font-bold text-slate-900">
          SOA Section Configuration
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          View your effective template and upload example SOAs to help the AI match your style
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
        {effectiveSections.map((group) => {
          const isExpanded = expandedGroups.includes(group.group);

          return (
            <Card key={group.group} className="overflow-hidden">
              <button
                onClick={() => toggleGroup(group.group)}
                className="w-full flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center text-base flex-shrink-0">
                  {group.icon}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-slate-800">{group.groupLabel}</div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {group.sections.length} sections
                </Badge>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {isExpanded && (
                <div className="border-t border-slate-200 p-3 space-y-2">
                  {group.sections.map((section) => {
                    const status = getSectionStatus(section);
                    const hasPrompt = !!section.prompt?.system;
                    const hasExample = !!section.example_content;
                    const feedCount = section.data_feeds?.length || 0;

                    return (
                      <div
                        key={section.id}
                        className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg"
                      >
                        <StatusDot status={status} />

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

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <MiniBadge label="Prompt" active={hasPrompt} />
                          <MiniBadge label="Example" active={hasExample} />
                          <MiniBadge
                            label={feedCount > 0 ? `${feedCount} feeds` : 'Feed'}
                            active={feedCount > 0}
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
  );
}
