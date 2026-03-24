import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Trash2 } from 'lucide-react';

// TODO: add streaming support for faster response feel

/**
 * Henry AI co-pilot slide-in panel.
 *
 * Props:
 *  - version: 'adviser' | 'client'
 *  - isOpen: boolean
 *  - onClose: () => void
 *  - messages: Array<{ role, content, timestamp }>
 *  - isLoading: boolean
 *  - onSend: (text: string) => void
 *  - onClear: () => void
 *  - userName: string — first name of the current user (for welcome message)
 */
export default function HenryPanel({
  version = 'adviser',
  isOpen,
  onClose,
  messages,
  isLoading,
  onSend,
  onClear,
  userName,
}) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    onSend(text);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const subtitle = version === 'adviser' ? 'AI Paraplanner Co-Pilot' : 'AI Assistant';

  const welcomeMessage = version === 'adviser'
    ? `Hi${userName ? ` ${userName}` : ''}! I'm Henry, your AI paraplanning co-pilot. I can help you navigate the platform, find client information, create tasks and tickets, or answer questions about your SOA pipeline and cashflow models. What do you need?`
    : `Hi${userName ? ` ${userName}` : ''}! I'm Henry. I can help you understand how to complete your fact find, upload documents, or answer any questions about using the platform. What would you like help with?`;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-[60] transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-[380px] bg-white shadow-2xl z-[70] flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6]">
          <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">H</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white font-semibold text-sm">Henry</div>
            <div className="text-white/80 text-xs">{subtitle}</div>
          </div>
          <button
            onClick={onClear}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
            title="Clear conversation"
          >
            <Trash2 className="w-4 h-4 text-white/80" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* Welcome message (shown when no messages yet) */}
          {messages.length === 0 && !isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white font-bold text-xs">H</span>
              </div>
              <div className="flex-1">
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-slate-700 leading-relaxed">
                  {welcomeMessage}
                </div>
              </div>
            </div>
          )}

          {/* Message bubbles */}
          {messages.map((msg, idx) => (
            <div key={idx}>
              {msg.role === 'user' ? (
                /* User message — right aligned */
                <div className="flex justify-end">
                  <div className="max-w-[80%]">
                    <div className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed">
                      {msg.content}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 text-right">
                      {formatTime(msg.timestamp)}
                    </div>
                  </div>
                </div>
              ) : (
                /* Assistant message — left aligned */
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white font-bold text-xs">H</span>
                  </div>
                  <div className="flex-1">
                    <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {formatTime(msg.timestamp)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white font-bold text-xs">H</span>
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

        {/* Input bar */}
        <form onSubmit={handleSubmit} className="border-t border-slate-200 px-4 py-3 bg-white">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className="flex-1 resize-none border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1]/30 focus:border-[#6366f1] placeholder:text-slate-400"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="w-10 h-10 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:from-[#4f46e5] hover:to-[#7c3aed] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-all flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

function formatTime(isoString) {
  if (!isoString) return '';
  try {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}
