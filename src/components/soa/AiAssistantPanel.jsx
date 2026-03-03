import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, RefreshCw, Check, X, Loader2, AlertTriangle } from 'lucide-react';

/**
 * Reusable AI assistant panel for generating and refining SOA section content.
 *
 * Props:
 *  - sectionId: string — the template section identifier
 *  - sectionLabel: string — human-readable section name
 *  - currentContent: string — the current boilerplate text in the editor
 *  - onAccept: (text: string) => void — called when user accepts AI output
 *  - exampleContent: string | null — extracted content from an uploaded example SOA
 */
export default function AiAssistantPanel({
  sectionId,
  sectionLabel,
  currentContent,
  onAccept,
  exampleContent,
}) {
  const [instructions, setInstructions] = useState('');
  const [generating, setGenerating] = useState(false);
  const [refining, setRefining] = useState(false);
  const [preview, setPreview] = useState('');

  const handleGenerate = async () => {
    setGenerating(true);
    setPreview('');
    try {
      const result = await base44.ai.generateSection({
        section_id: sectionId,
        section_label: sectionLabel,
        instructions: instructions || undefined,
        example_content: exampleContent || undefined,
      });
      setPreview(result.content || result.text || '');
    } catch {
      setPreview('');
    } finally {
      setGenerating(false);
    }
  };

  const handleRefine = async () => {
    if (!currentContent && !preview) return;
    setRefining(true);
    try {
      const result = await base44.ai.refine({
        section_id: sectionId,
        section_label: sectionLabel,
        content: preview || currentContent,
        instructions,
      });
      setPreview(result.content || result.text || '');
    } catch {
      // keep existing preview on error
    } finally {
      setRefining(false);
    }
  };

  const busy = generating || refining;

  return (
    <div className="border border-slate-200 rounded-xl bg-gradient-to-b from-blue-50/60 to-white p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-semibold text-slate-800">AI Assistant</span>
      </div>

      {/* Instructions input */}
      <Textarea
        placeholder='Additional instructions — e.g. "make more formal", "add super detail"'
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
        rows={2}
        className="text-sm"
        disabled={busy}
      />

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white"
          onClick={handleGenerate}
          disabled={busy}
        >
          {generating ? (
            <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 mr-1" />
          )}
          Generate with AI
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={handleRefine}
          disabled={busy || (!currentContent && !preview)}
        >
          {refining ? (
            <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
          )}
          Refine
        </Button>
      </div>

      {/* Loading state */}
      {busy && (
        <div className="flex items-center gap-2 text-sm text-blue-600 py-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          {generating ? 'Generating content...' : 'Refining content...'}
        </div>
      )}

      {/* Preview area */}
      {preview && !busy && (
        <div className="space-y-2">
          <div className="bg-white border border-slate-200 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-medium text-amber-700">
                AI-generated — review for accuracy
              </span>
            </div>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{preview}</p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => {
                onAccept(preview);
                setPreview('');
              }}
            >
              <Check className="w-3.5 h-3.5 mr-1" />
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPreview('')}
            >
              <X className="w-3.5 h-3.5 mr-1" />
              Discard
            </Button>
          </div>
        </div>
      )}

      {/* Example content hint */}
      {exampleContent && !busy && !preview && (
        <button
          type="button"
          className="w-full text-left text-sm text-blue-600 hover:text-blue-700 bg-blue-50 rounded-lg p-3 border border-blue-100"
          onClick={() => onAccept(exampleContent)}
        >
          <span className="font-medium">Use example as basis</span>
          <span className="block text-xs text-blue-500 mt-0.5 line-clamp-2">
            {exampleContent}
          </span>
        </button>
      )}
    </div>
  );
}
