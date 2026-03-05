import React, { useState, useMemo, useCallback } from 'react';
import { ChevronDown, ChevronRight, X, Sparkles, Check, Square, CheckSquare } from 'lucide-react';
import {
  SOA_DATA_GROUPS,
  TABLES_BY_GROUP,
  TABLE_MAP,
  GROUP_MAP,
  estimateTokenBudget,
  tokenBudgetLabel,
  smartSuggest,
} from '@/constants/soaDataRegistry';

function FeedCheckbox({ checked, onChange, className = '' }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
        checked
          ? 'bg-indigo-600 border-indigo-600 text-white'
          : 'bg-white border-slate-300 hover:border-indigo-400'
      } ${className}`}
    >
      {checked && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
    </button>
  );
}

export default function DataFeedPicker({
  selected = [],
  onChange,
  sectionLabel = '',
  sectionPrompt = '',
}) {
  const [expandedGroups, setExpandedGroups] = useState([]);

  // ── Derived state ───────────────────────────────────────

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const groupCounts = useMemo(() => {
    const counts = {};
    for (const group of SOA_DATA_GROUPS) {
      const tables = TABLES_BY_GROUP[group.id] || [];
      counts[group.id] = {
        total: tables.length,
        selected: tables.filter((t) => selectedSet.has(t.id)).length,
      };
    }
    return counts;
  }, [selectedSet]);

  const totalTokens = useMemo(() => estimateTokenBudget(selected), [selected]);
  const budget = useMemo(() => tokenBudgetLabel(totalTokens), [totalTokens]);

  // ── Handlers ────────────────────────────────────────────

  const toggleGroup = useCallback((groupId) => {
    setExpandedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((g) => g !== groupId)
        : [...prev, groupId]
    );
  }, []);

  const toggleTable = useCallback(
    (tableId) => {
      const next = selectedSet.has(tableId)
        ? selected.filter((id) => id !== tableId)
        : [...selected, tableId];
      onChange(next);
    },
    [selected, selectedSet, onChange]
  );

  const toggleGroupAll = useCallback(
    (groupId) => {
      const tables = TABLES_BY_GROUP[groupId] || [];
      const tableIds = tables.map((t) => t.id);
      const allSelected = tableIds.every((id) => selectedSet.has(id));

      let next;
      if (allSelected) {
        next = selected.filter((id) => !tableIds.includes(id));
      } else {
        const toAdd = tableIds.filter((id) => !selectedSet.has(id));
        next = [...selected, ...toAdd];
      }
      onChange(next);
    },
    [selected, selectedSet, onChange]
  );

  const removeTable = useCallback(
    (tableId) => {
      onChange(selected.filter((id) => id !== tableId));
    },
    [selected, onChange]
  );

  const handleSmartSuggest = useCallback(() => {
    const suggested = smartSuggest(sectionLabel, sectionPrompt);
    onChange(suggested);
  }, [sectionLabel, sectionPrompt, onChange]);

  // ── Render ──────────────────────────────────────────────

  return (
    <div className="space-y-2">
      {/* Smart Suggest button */}
      <button
        type="button"
        onClick={handleSmartSuggest}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-semibold hover:from-violet-600 hover:to-purple-700 transition-all shadow-sm mb-1"
      >
        <Sparkles className="w-4 h-4" />
        Smart Suggest
      </button>

      {/* Grouped accordion */}
      {SOA_DATA_GROUPS.map((group) => {
        const tables = TABLES_BY_GROUP[group.id] || [];
        const counts = groupCounts[group.id];
        const isExpanded = expandedGroups.includes(group.id);
        const allSelected = counts.total > 0 && counts.selected === counts.total;
        const someSelected = counts.selected > 0 && !allSelected;

        return (
          <div
            key={group.id}
            className="border rounded-lg overflow-hidden bg-white"
            style={{ borderColor: counts.selected > 0 ? group.color + '60' : '#e2e8f0' }}
          >
            {/* Group header */}
            <button
              type="button"
              onClick={() => toggleGroup(group.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors text-left"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0" />
              )}
              <span className="text-base flex-shrink-0">{group.icon}</span>
              <span className="font-semibold text-sm text-slate-800 flex-1">
                {group.label}
              </span>
              <span className="text-xs text-slate-400 mr-1">
                {counts.total} tables
              </span>
              {counts.selected > 0 && (
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: group.color }}
                >
                  {counts.selected}/{counts.total}
                </span>
              )}
            </button>

            {/* Expanded content */}
            {isExpanded && (
              <div className="border-t border-slate-100 px-3 py-2 space-y-0.5 bg-slate-50/50">
                {/* Select All toggle */}
                <div
                  className="flex items-center gap-3 px-2 py-2 rounded-md cursor-pointer hover:bg-white border-b border-slate-200 mb-1"
                  onClick={() => toggleGroupAll(group.id)}
                >
                  <FeedCheckbox checked={allSelected} onChange={() => toggleGroupAll(group.id)} />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Select All in {group.label}
                  </span>
                </div>

                {/* Individual table checkboxes */}
                {tables.map((table) => {
                  const isSelected = selectedSet.has(table.id);

                  return (
                    <div
                      key={table.id}
                      className={`flex items-start gap-3 px-2 py-2 rounded-md cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-indigo-50 hover:bg-indigo-100'
                          : 'hover:bg-white'
                      }`}
                      onClick={() => toggleTable(table.id)}
                    >
                      <FeedCheckbox
                        checked={isSelected}
                        onChange={() => toggleTable(table.id)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>
                          {table.label}
                        </div>
                        <div className="text-xs text-slate-500 leading-snug">
                          {table.description}
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded flex-shrink-0 ${
                          table.tokenEstimate === 'large'
                            ? 'bg-red-100 text-red-700'
                            : table.tokenEstimate === 'medium'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {table.tokenEstimate}
                      </span>
                    </div>
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
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Selected ({selected.length})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {selected.map((tableId) => {
              const table = TABLE_MAP[tableId];
              const group = table ? GROUP_MAP[table.group] : null;
              if (!table || !group) return null;

              return (
                <span
                  key={tableId}
                  className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full text-white shadow-sm"
                  style={{ backgroundColor: group.color }}
                >
                  {table.label}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeTable(tableId); }}
                    className="hover:bg-white/25 rounded-full p-0.5 transition-colors ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Token budget indicator */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-200">
        <span className="text-xs text-slate-400">
          ~{totalTokens.toLocaleString()} estimated tokens
        </span>
        <span
          className="text-xs font-bold px-3 py-1 rounded-full text-white shadow-sm"
          style={{ backgroundColor: budget.color }}
        >
          {budget.label}
        </span>
      </div>
    </div>
  );
}
