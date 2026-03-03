import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Save, X, Upload, Info } from 'lucide-react';
import { toast } from 'sonner';
import DataFeedPicker from './DataFeedPicker';
import { OUTPUT_FORMATS, TONE_OPTIONS } from '@/utils/soaTemplateDefaults';

export default function SectionConfigEditor({
  open,
  onOpenChange,
  section,
  onSave,
}) {
  const [prompt, setPrompt] = useState({ system: '', output_format: 'prose', max_words: 500, tone: 'professional_clear' });
  const [exampleContent, setExampleContent] = useState('');
  const [dataFeeds, setDataFeeds] = useState([]);
  const [activeTab, setActiveTab] = useState('prompt');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (section) {
      setPrompt({
        system: section.prompt?.system || '',
        output_format: section.prompt?.output_format || 'prose',
        max_words: section.prompt?.max_words || 500,
        tone: section.prompt?.tone || 'professional_clear',
      });
      setExampleContent(section.example_content || '');
      setDataFeeds(section.data_feeds || []);
      setActiveTab('prompt');
    }
  }, [section]);

  if (!section) return null;

  const handleSave = () => {
    onSave(section.id, {
      prompt,
      example_content: exampleContent,
      data_feeds: dataFeeds,
    });
    onOpenChange(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setExampleContent(ev.target.result);
        toast.success('Example content loaded from file');
      };
      reader.readAsText(file);
    } else {
      toast.info('Example upload processing... PDF/DOCX extraction will be available soon.');
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const hasPrompt = !!prompt.system;
  const hasExample = !!exampleContent;
  const hasFeedCount = dataFeeds.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>
            {section.label}
          </DialogTitle>
          <DialogDescription>{section.desc}</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="w-full justify-start gap-1 bg-slate-100 p-1">
            <TabsTrigger value="prompt" className="text-sm gap-1.5">
              <span>AI Prompt</span>
            </TabsTrigger>
            <TabsTrigger value="example" className="text-sm gap-1.5">
              <span>Example Content</span>
            </TabsTrigger>
            <TabsTrigger value="datafeed" className="text-sm gap-1.5">
              <span>Data Feed</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: AI Prompt */}
          <TabsContent value="prompt" className="flex-1 min-h-0 overflow-auto mt-4 space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-700">
                This prompt tells the AI how to generate this section. It&apos;s not document content &mdash; it&apos;s instructions the AI follows using real client data.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">System Prompt</label>
              <textarea
                value={prompt.system}
                onChange={(e) => setPrompt((p) => ({ ...p, system: e.target.value }))}
                placeholder="Write instructions for the AI to generate this section. E.g.: Write a comprehensive executive summary for this SOA..."
                className="w-full min-h-[200px] p-3 border border-slate-300 rounded-lg text-sm resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Output Format</label>
                <Select
                  value={prompt.output_format}
                  onValueChange={(v) => setPrompt((p) => ({ ...p, output_format: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OUTPUT_FORMATS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Max Words</label>
                <Input
                  type="number"
                  min={50}
                  max={5000}
                  step={50}
                  value={prompt.max_words}
                  onChange={(e) => setPrompt((p) => ({ ...p, max_words: parseInt(e.target.value) || 500 }))}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tone</label>
                <Select
                  value={prompt.tone}
                  onValueChange={(v) => setPrompt((p) => ({ ...p, tone: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TONE_OPTIONS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          {/* Tab 2: Example Content */}
          <TabsContent value="example" className="flex-1 min-h-0 overflow-auto mt-4 space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
              <Info className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700">
                Paste or upload an example of what this section should look like. The AI uses this as a style and structure reference. Any client details will be stripped.
              </p>
            </div>

            <div
              className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer hover:border-slate-400 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-600">
                Drop a PDF, DOCX, or TXT file here
              </p>
              <p className="text-xs text-slate-400 mt-1">or click to browse</p>
            </div>

            <div className="relative flex items-center gap-3">
              <div className="flex-1 border-t border-slate-200" />
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                or paste directly
              </span>
              <div className="flex-1 border-t border-slate-200" />
            </div>

            <div>
              <textarea
                value={exampleContent}
                onChange={(e) => setExampleContent(e.target.value)}
                placeholder="Paste example content for this section here..."
                className="w-full min-h-[200px] p-3 border border-slate-300 rounded-lg text-sm resize-y focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                style={{ fontFamily: 'Georgia, serif' }}
              />
            </div>

            {exampleContent && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  Any real client details in this example will be automatically stripped when generating new SOAs.
                </p>
              </div>
            )}
          </TabsContent>

          {/* Tab 3: Data Feed */}
          <TabsContent value="datafeed" className="flex-1 min-h-0 mt-4 space-y-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex items-start gap-2">
              <Info className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-purple-700">
                Select which client data fields the AI receives when generating this section. More data = better output but higher token cost.
              </p>
            </div>

            <ScrollArea className="max-h-[400px]">
              <DataFeedPicker
                selected={dataFeeds}
                onChange={setDataFeeds}
              />
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 mt-3">
          <div className="flex items-center gap-3 text-xs">
            <span className={hasPrompt ? 'text-green-600 font-medium' : 'text-slate-400'}>
              {hasPrompt ? '\u2705 Prompt set' : '\u25CB Prompt'}
            </span>
            <span className="text-slate-300">|</span>
            <span className={hasExample ? 'text-green-600 font-medium' : 'text-slate-400'}>
              {hasExample ? '\u2705 Example set' : '\u25CB Example'}
            </span>
            <span className="text-slate-300">|</span>
            <span className={hasFeedCount > 0 ? 'text-green-600 font-medium' : 'text-slate-400'}>
              {hasFeedCount > 0 ? `\u2705 ${hasFeedCount} data fields` : '\u25CB Data feed'}
            </span>
          </div>
          <div className="flex gap-2">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
