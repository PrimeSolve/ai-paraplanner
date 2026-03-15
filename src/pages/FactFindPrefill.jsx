import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { documentsApi, factFindChatApi } from '@/api/primeSolveClient';
import { useFactFind } from '@/components/factfind/useFactFind';
import { createPageUrl } from '../utils';
import FactFindLayout from '../components/factfind/FactFindLayout';
import FactFindHeader from '../components/factfind/FactFindHeader';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Send, Loader2, MessageCircle, FileText, CheckCircle2, AlertTriangle
} from 'lucide-react';

export default function FactFindPrefill() {
  const { factFind, loading: ffLoading, updateSection, clientId } = useFactFind();

  const [loading, setLoading] = useState(true);
  const [hasExtractedDocs, setHasExtractedDocs] = useState(false);
  const [messages, setMessages] = useState([]);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Check for extracted documents on mount
  useEffect(() => {
    if (ffLoading || !clientId) return;

    async function checkDocuments() {
      try {
        const docs = await documentsApi.getByClient(clientId);
        const extracted = docs.filter(d => d.extracted_sections);
        setHasExtractedDocs(extracted.length > 0);

        // If extracted docs exist, send initial greeting
        if (extracted.length > 0 && factFind?.id) {
          await sendChatMessage('', []);
        }
      } catch (err) {
        console.error('Failed to check documents:', err);
        toast.error('Failed to load documents');
      } finally {
        setLoading(false);
      }
    }

    checkDocuments();
  }, [ffLoading, clientId, factFind?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const sendChatMessage = async (message, history) => {
    setSending(true);

    // Add user message to display (skip for initial empty greeting)
    if (message) {
      setMessages(prev => [...prev, { role: 'user', content: message }]);
    }

    try {
      const response = await factFindChatApi.sendMessage(factFind.id, {
        message,
        conversationHistory: history,
        clientId,
      });

      const { reply, fieldUpdates } = response;

      // Add assistant message
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: reply,
        fieldUpdates: fieldUpdates || [],
      }]);

      // Update conversation history for next call
      const newHistory = [...history];
      if (message) {
        newHistory.push({ role: 'user', content: message });
      }
      newHistory.push({ role: 'assistant', content: reply });
      setConversationHistory(newHistory);

      // Apply field updates via existing updateSection logic
      if (fieldUpdates && fieldUpdates.length > 0) {
        for (const update of fieldUpdates) {
          try {
            const data = buildUpdatePayload(update.field, update.value);
            await updateSection(update.section, data);
          } catch (err) {
            console.error('Failed to apply field update:', err);
          }
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        fieldUpdates: [],
      }]);
    } finally {
      setSending(false);
    }
  };

  const handleSend = async () => {
    const message = inputValue.trim();
    if (!message || sending) return;

    setInputValue('');
    await sendChatMessage(message, conversationHistory);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading || ffLoading) {
    return (
      <FactFindLayout currentSection="prefill" factFindId={factFind?.id}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </FactFindLayout>
    );
  }

  // No extracted documents — show message with link
  if (!hasExtractedDocs) {
    return (
      <FactFindLayout currentSection="prefill" factFindId={factFind?.id}>
        <FactFindHeader
          title="Pre-fill your Fact Find"
          description="Chat with our AI assistant to review and confirm your extracted document data."
          factFind={factFind}
        />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-md space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center">
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">
              No documents found
            </h3>
            <p className="text-sm text-slate-600">
              Please upload documents in the Documents section first. Once your documents
              have been processed, come back here to review the extracted data with our AI assistant.
            </p>
            <Link to={createPageUrl('ClientDocuments')}>
              <Button className="mt-2 bg-blue-600 hover:bg-blue-700 text-white">
                Go to Documents
              </Button>
            </Link>
          </div>
        </div>
      </FactFindLayout>
    );
  }

  // Chat interface
  return (
    <FactFindLayout currentSection="prefill" factFindId={factFind?.id}>
      <FactFindHeader
        title="Pre-fill your Fact Find"
        description="Chat with our AI assistant to review and confirm your extracted document data."
        factFind={factFind}
      />

      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && sending && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin mr-2" />
              <span className="text-sm text-slate-500">Loading your document summary...</span>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] space-y-2`}>
                {/* Message bubble */}
                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-md shadow-sm'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-1">
                      <MessageCircle className="w-3.5 h-3.5 text-blue-600" />
                      <span className="text-xs font-semibold text-blue-600">AI Assistant</span>
                    </div>
                  )}
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>

                {/* Field update confirmation chips */}
                {msg.fieldUpdates && msg.fieldUpdates.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pl-1">
                    {msg.fieldUpdates.map((update, j) => (
                      <span
                        key={j}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        Saved: {update.field} &rarr; {String(update.value)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {sending && messages.length > 0 && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-slate-200 bg-white px-4 py-3">
          <div className="flex items-end gap-2 max-w-4xl mx-auto">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              rows={1}
              className="flex-1 resize-none rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400"
              style={{ maxHeight: '120px', minHeight: '40px' }}
              disabled={sending}
            />
            <Button
              onClick={handleSend}
              disabled={!inputValue.trim() || sending}
              size="icon"
              className="h-10 w-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-slate-400 text-center mt-2">
            Review the extracted data and confirm or correct any fields. Press Enter to send.
          </p>
        </div>
      </div>
    </FactFindLayout>
  );
}

/**
 * Build a nested update payload from a dot-notation field path and value.
 * e.g. "personal.first_name" + "John" => { personal: { first_name: "John" } }
 */
function buildUpdatePayload(fieldPath, value) {
  const parts = fieldPath.replace(/\[(\d+)\]/g, '.$1').split('.');
  const result = {};
  let current = result;

  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    const nextKey = parts[i + 1];
    current[key] = /^\d+$/.test(nextKey) ? [] : {};
    current = current[key];
  }

  current[parts[parts.length - 1]] = value;
  return result;
}
