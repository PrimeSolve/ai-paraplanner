import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  X,
  Send,
  Upload,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Loader2,
  FileText,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

// ── Mock data for testing ──────────────────────────────────────────────────────

const mockAnalysis = {
  mapped: [
    { defaultSectionId: 'cover-letter', sectionName: 'Cover Letter', confidence: 0.95 },
    { defaultSectionId: 'cover-page', sectionName: 'Cover Page', confidence: 0.92 },
    { defaultSectionId: 'executive-summary', sectionName: 'Executive Summary', confidence: 0.88 },
    { defaultSectionId: 'financial-needs', sectionName: 'Financial Needs & Objectives', confidence: 0.91 },
    { defaultSectionId: 'scope-of-advice', sectionName: 'Scope of Advice', confidence: 0.94 },
    { defaultSectionId: 'personal-information', sectionName: 'Personal Information', confidence: 0.97 },
    { defaultSectionId: 'dependants', sectionName: 'Dependants', confidence: 0.89 },
    { defaultSectionId: 'financial-position', sectionName: 'Financial Position', confidence: 0.93 },
    { defaultSectionId: 'cash-flow-statement', sectionName: 'Cash Flow Statement', confidence: 0.87 },
    { defaultSectionId: 'insurance-in-force', sectionName: 'Insurance in Force', confidence: 0.90 },
    { defaultSectionId: 'estate-planning', sectionName: 'Estate Planning', confidence: 0.86 },
    { defaultSectionId: 'tax-position', sectionName: 'Tax Position', confidence: 0.85 },
    { defaultSectionId: 'wealth-asset-protection', sectionName: 'Wealth & Asset Protection', confidence: 0.88 },
    { defaultSectionId: 'insurance-needs-analysis', sectionName: 'Insurance Needs Analysis', confidence: 0.92 },
    { defaultSectionId: 'recommended-insurance-cover', sectionName: 'Recommended Insurance Cover', confidence: 0.91 },
    { defaultSectionId: 'debt-management', sectionName: 'Debt Management', confidence: 0.84 },
    { defaultSectionId: 'wealth-accumulation', sectionName: 'Wealth Accumulation', confidence: 0.87 },
    { defaultSectionId: 'retirement-planning', sectionName: 'Retirement Planning', confidence: 0.93 },
    { defaultSectionId: 'recommended-insurance-product', sectionName: 'Recommended Insurance Product', confidence: 0.90 },
    { defaultSectionId: 'recommended-wealth-product', sectionName: 'Recommended Wealth Product', confidence: 0.88 },
    { defaultSectionId: 'recommended-portfolio', sectionName: 'Recommended Portfolio', confidence: 0.86 },
    { defaultSectionId: 'transactions', sectionName: 'Transactions', confidence: 0.94 },
    { defaultSectionId: 'projected-outcomes', sectionName: 'Projected Outcomes', confidence: 0.89 },
    { defaultSectionId: 'how-to-proceed', sectionName: 'How to Proceed', confidence: 0.91 },
  ],
  newSections: [
    { sectionName: 'Investment Philosophy', description: 'Found in uploaded doc, no default match' },
    { sectionName: 'Market Outlook', description: 'Found in uploaded doc, no default match' },
    { sectionName: 'Client Acknowledgements', description: 'Found in uploaded doc, no default match' },
  ],
  gaps: [
    { defaultSectionId: 'adviser-fee-disclosure', sectionName: 'Adviser Fee Disclosure' },
    { defaultSectionId: 'disclaimer', sectionName: 'Disclaimer' },
    { defaultSectionId: 'authority-to-proceed', sectionName: 'Authority to Proceed' },
    { defaultSectionId: 'how-to-read', sectionName: 'How to Read This Document' },
  ],
};

// ── Stubbed API hooks ──────────────────────────────────────────────────────────

// TODO: wire to ClaireController
const analyseDocuments = async (files) => {
  // TODO: POST /api/claire/analyse
  // Returns: { mapped, newSections, gaps }
  await new Promise((r) => setTimeout(r, 4000));
  return mockAnalysis;
};

// TODO: wire to ClaireController
const buildTemplate = async (analysisResults, gapDecisions) => {
  // TODO: POST /api/claire/build
  // Returns: stream of section updates
  const allSections = [
    ...analysisResults.mapped.map((s) => ({ sectionId: s.defaultSectionId, sectionName: s.sectionName })),
    ...analysisResults.newSections.map((s) => ({ sectionId: `new-${s.sectionName.toLowerCase().replace(/\s+/g, '-')}`, sectionName: s.sectionName })),
  ];
  return allSections;
};

// TODO: wire to ClaireController
const sendMessage = async (message, templateContext) => {
  // TODO: POST /api/claire/chat
  // Returns: { reply, sectionUpdates }
  await new Promise((r) => setTimeout(r, 1500));
  return {
    reply: `I've noted your request: "${message}". I'll apply those changes to the relevant sections. You can review the updated sections in the template panel on the left.`,
    sectionUpdates: [],
  };
};

// ── Progress steps for processing state ────────────────────────────────────────

const PROGRESS_STEPS = [
  'Reading uploaded files',
  'Identifying sections',
  'Mapping to default template',
  'Preparing recommendations',
];

// ── Suggested prompt chips ─────────────────────────────────────────────────────

const SUGGESTED_PROMPTS = [
  'Make all sections more concise',
  'Add compliance disclaimers',
  'Change tone to formal',
  'Review gap sections',
];

// ── Main component ─────────────────────────────────────────────────────────────

export default function ClairePanel({ onClose, onSectionUpdate, onSectionStateChange }) {
  const [claireState, setClaireState] = useState('upload'); // 'upload' | 'processing' | 'results' | 'building' | 'chat'
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [analysisResults, setAnalysisResults] = useState(null); // { mapped: [], newSections: [], gaps: [] }
  const [buildProgress, setBuildProgress] = useState([]); // [{ sectionId, sectionName, status: 'pending'|'building'|'done' }]
  const [messages, setMessages] = useState([]); // conversation history for chat phase
  const [progressStepIndex, setProgressStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [gapModalOpen, setGapModalOpen] = useState(false);
  const [gapDecisions, setGapDecisions] = useState({}); // { sectionId: 'include' | 'skip' }
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const chatInputRef = useRef(null);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, buildProgress]);

  // Focus chat input when entering chat state
  useEffect(() => {
    if (claireState === 'chat') {
      setTimeout(() => chatInputRef.current?.focus(), 300);
    }
  }, [claireState]);

  // ── File handling ──────────────────────────────────────────────────────────

  const handleFiles = useCallback((files) => {
    const validFiles = Array.from(files).filter((f) => {
      const ext = f.name.toLowerCase().split('.').pop();
      return ['pdf', 'docx', 'txt'].includes(ext);
    });
    setUploadedFiles((prev) => {
      const combined = [...prev, ...validFiles];
      return combined.slice(0, 5); // max 5 files
    });
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeFile = (index) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Analysis ───────────────────────────────────────────────────────────────

  const handleAnalyse = async () => {
    setClaireState('processing');
    setProgressStepIndex(0);
    setCompletedSteps([]);

    // Simulate progressive step completion
    for (let i = 0; i < PROGRESS_STEPS.length; i++) {
      await new Promise((r) => setTimeout(r, 800));
      setProgressStepIndex(i + 1);
      if (i < PROGRESS_STEPS.length - 1) {
        setCompletedSteps((prev) => [...prev, i]);
      }
    }

    try {
      const results = await analyseDocuments(uploadedFiles);
      setAnalysisResults(results);
      setCompletedSteps([0, 1, 2, 3]);

      // Initialize gap decisions
      const decisions = {};
      results.gaps.forEach((g) => {
        decisions[g.defaultSectionId] = 'include'; // default to include
      });
      setGapDecisions(decisions);

      // Notify parent about section states
      if (onSectionStateChange) {
        const stateMap = {};
        results.mapped.forEach((s) => { stateMap[s.defaultSectionId] = 'mapped'; });
        results.gaps.forEach((s) => { stateMap[s.defaultSectionId] = 'gap'; });
        onSectionStateChange(stateMap, results.newSections);
      }

      await new Promise((r) => setTimeout(r, 500));
      setClaireState('results');
    } catch (error) {
      console.error('Analysis failed:', error);
      setClaireState('upload');
    }
  };

  // ── Build template ─────────────────────────────────────────────────────────

  const handleBuildTemplate = async () => {
    if (!analysisResults) return;
    setClaireState('building');

    const allSections = await buildTemplate(analysisResults, gapDecisions);
    setBuildProgress(allSections.map((s) => ({ ...s, status: 'pending' })));

    // Simulate building sections one by one
    for (let i = 0; i < allSections.length; i++) {
      setBuildProgress((prev) =>
        prev.map((item, idx) =>
          idx === i ? { ...item, status: 'building' } : item
        )
      );

      await new Promise((r) => setTimeout(r, 300 + Math.random() * 400));

      setBuildProgress((prev) =>
        prev.map((item, idx) =>
          idx === i ? { ...item, status: 'done' } : item
        )
      );

      // Notify parent about section population
      if (onSectionUpdate) {
        onSectionUpdate(allSections[i].sectionId, 'populated');
      }
    }

    // Transition to chat
    setMessages([
      {
        role: 'assistant',
        content: "All done! Your template has been populated with content from your uploaded documents. You can ask me to refine any section — just type below.",
        timestamp: new Date().toISOString(),
      },
    ]);
    setClaireState('chat');
  };

  // ── Chat ───────────────────────────────────────────────────────────────────

  const handleSendMessage = async (text) => {
    const userMsg = text || chatInput.trim();
    if (!userMsg || isSending) return;

    setChatInput('');
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: userMsg, timestamp: new Date().toISOString() },
    ]);
    setIsSending(true);

    try {
      const response = await sendMessage(userMsg, analysisResults);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: response.reply, timestamp: new Date().toISOString() },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: "Sorry, I encountered an error. Please try again.", timestamp: new Date().toISOString() },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleChatKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // ── Gap review ─────────────────────────────────────────────────────────────

  const handleGapDecision = (sectionId, decision) => {
    setGapDecisions((prev) => ({ ...prev, [sectionId]: decision }));
  };

  const applyGapDecisions = () => {
    setGapModalOpen(false);
    if (onSectionStateChange) {
      const stateMap = {};
      analysisResults.mapped.forEach((s) => { stateMap[s.defaultSectionId] = 'mapped'; });
      analysisResults.gaps.forEach((s) => {
        stateMap[s.defaultSectionId] = gapDecisions[s.defaultSectionId] === 'skip' ? 'skipped' : 'gap';
      });
      onSectionStateChange(stateMap, analysisResults.newSections);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200">
      {/* Panel header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-gradient-to-r from-purple-600 to-purple-500 flex-shrink-0">
        <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm">C</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-white font-semibold text-sm">Claire</div>
          <div className="text-white/80 text-xs">SOA Template Builder</div>
        </div>
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/20 transition-colors text-white/90 text-xs font-medium"
          title="Exit Claire"
        >
          <X className="w-3.5 h-3.5" />
          Exit Claire
        </button>
      </div>

      {/* Panel body */}
      <div className="flex-1 overflow-y-auto">
        {claireState === 'upload' && renderUploadState()}
        {claireState === 'processing' && renderProcessingState()}
        {claireState === 'results' && renderResultsState()}
        {claireState === 'building' && renderBuildingState()}
        {claireState === 'chat' && renderChatState()}
      </div>

      {/* Chat input (only in chat state) */}
      {claireState === 'chat' && (
        <div className="border-t border-slate-200 px-4 py-3 bg-white flex-shrink-0">
          {/* Suggested prompts */}
          {messages.length <= 1 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSendMessage(prompt)}
                  disabled={isSending}
                  className="text-xs px-3 py-1.5 rounded-full border border-purple-200 text-purple-600 hover:bg-purple-50 transition-colors disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2">
            <textarea
              ref={chatInputRef}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={handleChatKeyDown}
              placeholder="Ask Claire to refine..."
              rows={1}
              className="flex-1 resize-none border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 placeholder:text-slate-400"
              disabled={isSending}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isSending || !chatInput.trim()}
              className="w-10 h-10 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-all flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Gap review modal */}
      <Dialog open={gapModalOpen} onOpenChange={setGapModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Sections Not Found ({analysisResults?.gaps?.length || 0})
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600 mb-4">
            These default sections weren't in your uploaded documents.
          </p>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {analysisResults?.gaps?.map((gap) => (
              <div key={gap.defaultSectionId} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                <span className="text-sm font-medium text-slate-800">{gap.sectionName}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleGapDecision(gap.defaultSectionId, 'include')}
                    className={`text-xs px-3 py-1 rounded-md transition-colors ${
                      gapDecisions[gap.defaultSectionId] === 'include'
                        ? 'bg-green-100 text-green-700 font-medium'
                        : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    Include
                  </button>
                  <button
                    onClick={() => handleGapDecision(gap.defaultSectionId, 'skip')}
                    className={`text-xs px-3 py-1 rounded-md transition-colors ${
                      gapDecisions[gap.defaultSectionId] === 'skip'
                        ? 'bg-amber-100 text-amber-700 font-medium'
                        : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    Skip
                  </button>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={applyGapDecisions} className="bg-purple-600 hover:bg-purple-700">
              Apply Selections
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  // ── State renderers ────────────────────────────────────────────────────────

  function renderUploadState() {
    return (
      <div className="p-5 space-y-5">
        {/* Welcome */}
        <div className="flex gap-3">
          <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-white font-bold text-xs">C</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-slate-700 leading-relaxed">
            Hi! I'm Claire, your compliance and template assistant.
            <br /><br />
            Upload your existing SOA template or prior completed SOAs and I'll map them to your template sections automatically.
          </div>
        </div>

        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-purple-500 bg-purple-50'
              : 'border-slate-300 hover:border-purple-400 hover:bg-purple-50/50'
          }`}
        >
          <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-700 mb-1">
            Drop files here
          </p>
          <p className="text-xs text-slate-500 mb-1">PDF, DOCX, or TXT</p>
          <p className="text-xs text-slate-400">or click to browse (up to 5 files)</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.txt"
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />
        </div>

        {/* Uploaded file chips */}
        {uploadedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {uploadedFiles.map((file, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 text-xs bg-purple-50 text-purple-700 border border-purple-200 rounded-full px-3 py-1.5"
              >
                <FileText className="w-3 h-3" />
                {file.name}
                <button
                  onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                  className="ml-0.5 hover:text-purple-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Analyse button */}
        <Button
          onClick={handleAnalyse}
          disabled={uploadedFiles.length === 0}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload & Analyse
        </Button>
      </div>
    );
  }

  function renderProcessingState() {
    return (
      <div className="p-5 space-y-5">
        <div className="flex gap-3">
          <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 relative">
            <span className="text-white font-bold text-xs">C</span>
            <Loader2 className="w-4 h-4 text-purple-300 animate-spin absolute -bottom-0.5 -right-0.5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-800 mb-4">Analysing your documents...</p>
            <div className="space-y-3">
              {PROGRESS_STEPS.map((step, idx) => {
                const isCompleted = completedSteps.includes(idx);
                const isActive = idx < progressStepIndex && !isCompleted;
                const isVisible = idx < progressStepIndex;

                return (
                  <div
                    key={step}
                    className={`flex items-center gap-2.5 transition-all duration-500 ${
                      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    ) : isActive ? (
                      <Loader2 className="w-4 h-4 text-purple-500 animate-spin flex-shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-slate-300 flex-shrink-0" />
                    )}
                    <span className={`text-sm ${isCompleted ? 'text-green-700' : isActive ? 'text-purple-700' : 'text-slate-500'}`}>
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-slate-400 mt-4">This may take 20-30 seconds</p>
          </div>
        </div>
      </div>
    );
  }

  function renderResultsState() {
    if (!analysisResults) return null;

    return (
      <div className="p-5 space-y-4">
        {/* Summary bar */}
        <div className="flex items-center gap-4 bg-slate-50 rounded-lg p-3 border border-slate-200">
          <span className="flex items-center gap-1.5 text-sm">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="font-semibold text-green-700">{analysisResults.mapped.length}</span>
            <span className="text-slate-500">mapped</span>
          </span>
          <span className="flex items-center gap-1.5 text-sm">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span className="font-semibold text-purple-700">{analysisResults.newSections.length}</span>
            <span className="text-slate-500">new</span>
          </span>
          <span className="flex items-center gap-1.5 text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="font-semibold text-amber-700">{analysisResults.gaps.length}</span>
            <span className="text-slate-500">gaps</span>
          </span>
        </div>

        {/* Claire's message */}
        <div className="flex gap-3">
          <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-white font-bold text-xs">C</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-slate-700 leading-relaxed">
            I've analysed your documents and mapped <strong>{analysisResults.mapped.length} sections</strong> to the PrimeSolve defaults.
            I also found <strong>{analysisResults.newSections.length} sections</strong> unique to your practice that I'll create as custom sections.
            <br /><br />
            There are <strong>{analysisResults.gaps.length} default sections</strong> I couldn't find in your documents — I've flagged these for your review.
            <br /><br />
            I'm ready to populate the template. Shall I proceed?
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2">
          <Button
            onClick={handleBuildTemplate}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            Yes, build my template
          </Button>
          <Button
            variant="outline"
            onClick={() => setGapModalOpen(true)}
            className="w-full border-amber-300 text-amber-700 hover:bg-amber-50"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Review gaps first
          </Button>
        </div>
      </div>
    );
  }

  function renderBuildingState() {
    return (
      <div className="p-5 space-y-4">
        {/* Summary bar */}
        {analysisResults && (
          <div className="flex items-center gap-4 bg-slate-50 rounded-lg p-3 border border-slate-200">
            <span className="flex items-center gap-1.5 text-sm">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="font-semibold text-green-700">{analysisResults.mapped.length}</span>
              <span className="text-slate-500">mapped</span>
            </span>
            <span className="flex items-center gap-1.5 text-sm">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span className="font-semibold text-purple-700">{analysisResults.newSections.length}</span>
              <span className="text-slate-500">new</span>
            </span>
          </div>
        )}

        <div className="flex gap-3 mb-3">
          <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-white font-bold text-xs">C</span>
          </div>
          <p className="text-sm font-medium text-slate-800 pt-1.5">Building your template...</p>
        </div>

        {/* Progress list */}
        <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
          {buildProgress.map((item) => (
            <div key={item.sectionId} className="flex items-center gap-2.5 py-1.5 px-2">
              {item.status === 'done' && (
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              )}
              {item.status === 'building' && (
                <Loader2 className="w-4 h-4 text-purple-500 animate-spin flex-shrink-0" />
              )}
              {item.status === 'pending' && (
                <div className="w-4 h-4 rounded-full border-2 border-slate-200 flex-shrink-0" />
              )}
              <span className={`text-sm ${
                item.status === 'done' ? 'text-green-700' : item.status === 'building' ? 'text-purple-700 font-medium' : 'text-slate-400'
              }`}>
                {item.sectionName}
                {item.status === 'done' && <span className="text-slate-400 ml-1">— populated</span>}
                {item.status === 'building' && <span className="text-purple-400 ml-1">— working...</span>}
              </span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
    );
  }

  function renderChatState() {
    return (
      <div className="p-4 space-y-4">
        {/* Summary bar */}
        {analysisResults && (
          <div className="flex items-center gap-4 bg-slate-50 rounded-lg p-3 border border-slate-200">
            <span className="flex items-center gap-1.5 text-sm">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="font-semibold text-green-700">{analysisResults.mapped.length}</span>
              <span className="text-slate-500">mapped</span>
            </span>
            <span className="flex items-center gap-1.5 text-sm">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span className="font-semibold text-purple-700">{analysisResults.newSections.length}</span>
              <span className="text-slate-500">new</span>
            </span>
            <span className="flex items-center gap-1.5 text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span className="font-semibold text-amber-700">{analysisResults.gaps.length}</span>
              <span className="text-slate-500">gaps</span>
            </span>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, idx) => (
          <div key={idx}>
            {msg.role === 'user' ? (
              <div className="flex justify-end">
                <div className="max-w-[85%]">
                  <div className="bg-purple-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed">
                    {msg.content}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white font-bold text-xs">C</span>
                </div>
                <div className="flex-1">
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {isSending && (
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white font-bold text-xs">C</span>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    );
  }
}
