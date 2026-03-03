import React, { useState } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { DATA_SOURCES } from '@/utils/soaTemplateDefaults';

const ESTIMATED_TOKENS_PER_FIELD = 150;

export default function DataFeedPicker({ selected = [], onChange }) {
  const [expandedSources, setExpandedSources] = useState(
    Object.keys(DATA_SOURCES)
  );

  const toggleSource = (sourceKey) => {
    setExpandedSources((prev) =>
      prev.includes(sourceKey)
        ? prev.filter((k) => k !== sourceKey)
        : [...prev, sourceKey]
    );
  };

  const toggleField = (feedKey) => {
    const next = selected.includes(feedKey)
      ? selected.filter((k) => k !== feedKey)
      : [...selected, feedKey];
    onChange(next);
  };

  const removeField = (feedKey) => {
    onChange(selected.filter((k) => k !== feedKey));
  };

  const getSourceForFeed = (feedKey) => {
    const [source] = feedKey.split('.');
    return DATA_SOURCES[source] || null;
  };

  const countSelectedInSource = (sourceKey) => {
    return selected.filter((k) => k.startsWith(sourceKey + '.')).length;
  };

  const estimatedTokens = selected.length * ESTIMATED_TOKENS_PER_FIELD;

  return (
    <div className="space-y-3">
      {Object.entries(DATA_SOURCES).map(([sourceKey, source]) => {
        const isExpanded = expandedSources.includes(sourceKey);
        const selectedCount = countSelectedInSource(sourceKey);

        return (
          <div
            key={sourceKey}
            className="border rounded-lg overflow-hidden"
            style={{ borderColor: source.color + '30' }}
          >
            <button
              type="button"
              onClick={() => toggleSource(sourceKey)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
            >
              <span className="text-lg">{source.icon}</span>
              <span className="font-semibold text-sm text-slate-800 flex-1">
                {source.label}
              </span>
              {selectedCount > 0 && (
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: source.color }}
                >
                  {selectedCount} selected
                </span>
              )}
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {isExpanded && (
              <div className="border-t px-4 py-2 space-y-1" style={{ borderColor: source.color + '20' }}>
                {Object.entries(source.fields).map(([fieldKey, field]) => {
                  const feedKey = `${sourceKey}.${fieldKey}`;
                  const isSelected = selected.includes(feedKey);

                  return (
                    <label
                      key={feedKey}
                      className={`flex items-start gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                        isSelected ? 'bg-slate-50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleField(feedKey)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-800">
                          {field.label}
                        </div>
                        <div className="text-xs text-slate-500">{field.desc}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="pt-3 border-t border-slate-200">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Selected fields ({selected.length})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {selected.map((feedKey) => {
              const source = getSourceForFeed(feedKey);
              const [sourceKey, fieldKey] = feedKey.split('.');
              const field = DATA_SOURCES[sourceKey]?.fields[fieldKey];
              if (!source || !field) return null;

              return (
                <span
                  key={feedKey}
                  className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full text-white"
                  style={{ backgroundColor: source.color }}
                >
                  {field.label}
                  <button
                    type="button"
                    onClick={() => removeField(feedKey)}
                    className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            ~{estimatedTokens.toLocaleString()} estimated tokens
          </div>
        </div>
      )}
    </div>
  );
}
