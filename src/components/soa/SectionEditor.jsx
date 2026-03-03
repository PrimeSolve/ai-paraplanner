import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Save, X } from 'lucide-react';
import AiAssistantPanel from './AiAssistantPanel';

const AVAILABLE_VARIABLES = [
  { key: '{client_name}', label: 'Client Name' },
  { key: '{adviser_name}', label: 'Adviser Name' },
  { key: '{advice_group_name}', label: 'Advice Group' },
  { key: '{super_balance}', label: 'Super Balance' },
  { key: '{investment_balance}', label: 'Investment Balance' },
  { key: '{insurance_cover}', label: 'Insurance Cover' },
  { key: '{risk_profile}', label: 'Risk Profile' },
  { key: '{current_date}', label: 'Current Date' },
  { key: '{partner_name}', label: 'Partner Name' },
  { key: '{retirement_age}', label: 'Retirement Age' },
];

/**
 * Modal dialog for editing a single SOA template section.
 *
 * Props:
 *  - open: boolean
 *  - onOpenChange: (open: boolean) => void
 *  - section: { id, label, description, status, badge, content }
 *  - exampleContent: string | null — matching extracted example content
 *  - onSave: (sectionId: string, content: string) => void
 */
export default function SectionEditor({
  open,
  onOpenChange,
  section,
  exampleContent,
  onSave,
}) {
  const [content, setContent] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (section) {
      setContent(section.content || '');
    }
  }, [section]);

  if (!section) return null;

  const insertVariable = (variable) => {
    const el = textareaRef.current;
    if (!el) {
      setContent((prev) => prev + variable);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const before = content.slice(0, start);
    const after = content.slice(end);
    const next = before + variable + after;
    setContent(next);
    // restore cursor after variable
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + variable.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const handleSave = () => {
    onSave(section.id, content);
    onOpenChange(false);
  };

  // Find variables already in content to highlight
  const usedVars = AVAILABLE_VARIABLES.filter((v) => content.includes(v.key));

  // Determine content type badge text
  const contentType = section.badge || 'Boilerplate';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle className="text-lg">{section.label}</DialogTitle>
            <Badge variant="secondary" className="text-xs">
              {contentType}
            </Badge>
          </div>
          <DialogDescription>{section.description}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 grid grid-cols-[1fr_260px] gap-4 min-h-0 overflow-hidden">
          {/* Main editing area */}
          <div className="flex flex-col gap-3 min-h-0 overflow-hidden">
            {/* Textarea */}
            <ScrollArea className="flex-1 min-h-0">
              <Textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter boilerplate content for this section..."
                className="min-h-[280px] text-sm font-mono resize-none"
                rows={14}
              />
            </ScrollArea>

            {/* Used variable chips */}
            {usedVars.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {usedVars.map((v) => (
                  <span
                    key={v.key}
                    className="inline-flex items-center text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full"
                  >
                    {v.key}
                  </span>
                ))}
              </div>
            )}

            {/* AI Assistant Panel */}
            <AiAssistantPanel
              sectionId={section.id}
              sectionLabel={section.label}
              currentContent={content}
              onAccept={(text) => setContent(text)}
              exampleContent={exampleContent}
            />
          </div>

          {/* Variable sidebar */}
          <div className="border border-slate-200 rounded-xl bg-slate-50 p-3 flex flex-col min-h-0 overflow-hidden">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
              Variables
            </span>
            <ScrollArea className="flex-1 min-h-0">
              <div className="space-y-1.5">
                {AVAILABLE_VARIABLES.map((v) => (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => insertVariable(v.key)}
                    className="w-full text-left text-sm px-2.5 py-1.5 rounded-lg hover:bg-blue-100 transition-colors group"
                  >
                    <span className="font-mono text-blue-600 group-hover:text-blue-800 text-xs">
                      {v.key}
                    </span>
                    <span className="block text-xs text-slate-500 mt-0.5">{v.label}</span>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="w-3.5 h-3.5 mr-1" />
            Cancel
          </Button>
          <Button
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
            onClick={handleSave}
          >
            <Save className="w-3.5 h-3.5 mr-1" />
            Save Section
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
