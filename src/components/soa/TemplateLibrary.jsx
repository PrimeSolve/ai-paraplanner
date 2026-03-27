import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Plus,
  Copy,
  FileText,
} from 'lucide-react';
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
 *   onNewFromDefault  — () => void
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
  onNewFromDefault,
  onNewFromScratch,
  level = 'advice_group',
  canCreate = true,
  loading = false,
}) {
  const [newDialogOpen, setNewDialogOpen] = useState(false);

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
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            isDefault={template.ownerType === 0}
            isActive={template.id === activeTemplateId}
            level={level}
            onEdit={onEdit}
            onView={onView}
            onUse={onUse}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
          />
        ))}

        {/* New Template card */}
        {canCreate && (
          <button
            onClick={() => setNewDialogOpen(true)}
            className="border-2 border-dashed border-slate-300 rounded-xl p-5 flex flex-col items-center justify-center text-center hover:border-slate-400 hover:bg-slate-50 transition-colors min-h-[220px]"
          >
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center mb-3">
              <Plus className="w-5 h-5 text-slate-500" />
            </div>
            <span className="font-semibold text-slate-700 text-sm">New Template</span>
            <span className="text-xs text-slate-500 mt-1">Create a new SOA template</span>
          </button>
        )}
      </div>

      {/* New Template Dialog */}
      <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Template</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 mt-2">
            <button
              onClick={() => { setNewDialogOpen(false); onNewFromDefault?.(); }}
              className="w-full text-left p-4 border border-slate-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <Copy className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <div className="font-semibold text-slate-800 text-sm">Start from Default</div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Duplicate the PrimeSolve default and customise it
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => { setNewDialogOpen(false); onNewFromScratch?.(); }}
              className="w-full text-left p-4 border border-slate-200 rounded-lg hover:border-slate-400 hover:bg-slate-50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <div className="font-semibold text-slate-800 text-sm">Start from scratch</div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Build a blank template with no pre-configured sections
                  </p>
                </div>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
