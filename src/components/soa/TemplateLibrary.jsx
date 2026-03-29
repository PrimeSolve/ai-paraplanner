import React from 'react';
import TemplateCard from './TemplateCard';

/**
 * TemplateLibrary — grid of template cards with "New Template" flow.
 *
 * Props:
 *   templates         — array of template objects
 *   activeTemplateId  — the ID of the currently active/default template
 *   defaultTemplateId — the ID of the PrimeSolve Admin default template
 *   onEdit            — (template) => void
 *   onView            — (template) => void
 *   onUse             — (template) => void — set as default
 *   onDuplicate       — (template) => void
 *   onDelete          — (template) => void
 *   onNewFromClaire   — () => void
 *   onNewFromScratch  — () => void
 *   level             — 'admin' | 'advice_group' | 'adviser'
 *   canCreate         — whether the user can create new templates (default true)
 *   loading           — show loading state
 */
export default function TemplateLibrary({
  templates = [],
  activeTemplateId,
  defaultTemplateId,
  onEdit,
  onView,
  onUse,
  onDuplicate,
  onDelete,
  onNewFromClaire,
  onShare,
  onNewFromScratch,
  level = 'advice_group',
  canCreate = true,
  loading = false,
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 animate-pulse">
            <div className="w-10 h-10 bg-slate-200 rounded-lg mb-3" />
            <div className="h-5 bg-slate-200 rounded w-3/4 mb-2" />
            <div className="h-4 bg-slate-100 rounded w-1/2 mb-4" />
            <div className="h-3 bg-slate-100 rounded w-full mb-4" />
            <div className="flex gap-2">
              <div className="h-8 bg-slate-100 rounded w-16" />
              <div className="h-8 bg-slate-100 rounded w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            isDefault={(template.ownerType ?? template.owner_type) === 0}
            isActive={template.id === activeTemplateId}
            level={level}
            onEdit={onEdit}
            onView={onView}
            onUse={onUse}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
            onShare={onShare}
          />
        ))}
      </div>
  );
}
