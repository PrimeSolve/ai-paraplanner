import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import FactFindLayout from '../components/factfind/FactFindLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function FactFindAssistant() {
  const navigate = useNavigate();
  const [factFind, setFactFind] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');

        if (id) {
          const finds = await base44.entities.FactFind.filter({ id });
          if (finds[0]) {
            setFactFind(finds[0]);
          }
        }

        // Initial greeting message
        setMessages([
          {
            role: 'assistant',
            content: 'Hello! I\'m your AI assistant here to help you complete your Fact Find. I can answer questions, explain sections, and guide you through the process. What would you like to know?'
          }
        ]);
      } catch (error) {
        console.error('Error loading fact find:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const quickQuestions = [
    'What do I need to get started?',
    'Where should I begin?',
    'Explain Risk Profile',
    'What documents do I need?'
  ];

  const handleQuickQuestion = async (question) => {
    setInput(question);
    await handleSend(question);
  };

  const handleSend = async (messageText) => {
    const message = messageText || input;
    if (!message.trim() || sending) return;

    const userMessage = { role: 'user', content: message };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setSending(true);

    try {
      // Call AI integration to get response
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a helpful financial planning assistant helping a client complete their Fact Find. The client has asked: "${message}". 
        
Context: The Fact Find includes sections for Personal Details, Dependants, Trusts & Companies, SMSF, Superannuation, Investment, Assets & Liabilities, Income & Expenses, Insurance, Super & Tax, Advice Reasons, and Risk Profile.

Provide a helpful, friendly, and concise response. Be specific and actionable.`,
        add_context_from_internet: false
      });

      const assistantMessage = {
        role: 'assistant',
        content: response
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage = {
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again or contact support if the issue persists.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <FactFindLayout currentSection="assistant" factFind={factFind}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </FactFindLayout>
    );
  }

  return (
    <FactFindLayout currentSection="assistant" factFind={factFind}>
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-5 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-extrabold text-slate-800 mb-1">Fact Find Assistant</h3>
            <p className="text-sm text-slate-600">
              Chat with our AI assistant to help complete your Fact Find. Ask questions, get guidance, and work through each section together.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Dashboard Button */}
            <button
              className="w-11 h-11 rounded-lg bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center shadow-md transition-all flex-shrink-0 relative group"
            >
              📊
              <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Dashboard
              </span>
            </button>
            
            <div className="text-right">
              <div className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1">Progress</div>
              <div className="text-2xl font-bold text-blue-600">{factFind?.completion_percentage || 0}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
          {messages.length === 1 && (
            <div className="max-w-3xl mx-auto">
              <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-4">
                  <Bot className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-slate-800 mb-2">AI Assistant</h4>
                <p className="text-slate-600 mb-6">Ready to help you complete your Fact Find</p>
                
                <div className="border-t border-blue-100 pt-6 mt-6">
                  <div className="flex items-center gap-2 mb-4 justify-center">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                    <h5 className="font-bold text-slate-800">Start a conversation</h5>
                  </div>
                  <p className="text-sm text-slate-600 mb-4">
                    Ask me anything about your Fact Find. I can help you understand each section, answer questions, and guide you through the process.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {quickQuestions.map((question, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        className="border-blue-200 hover:bg-blue-50 hover:border-blue-300 text-left h-auto py-3"
                        onClick={() => handleQuickQuestion(question)}
                      >
                        {question}
                      </Button>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          )}

          {messages.map((message, idx) => (
            <div
              key={idx}
              className={cn(
                "flex gap-3 max-w-3xl mx-auto",
                message.role === 'user' ? "justify-end" : "justify-start"
              )}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              
              <div
                className={cn(
                  "rounded-2xl px-4 py-3 max-w-[75%]",
                  message.role === 'user'
                    ? "bg-slate-800 text-white"
                    : "bg-white border border-slate-200 text-slate-800"
                )}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
              </div>

              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-slate-600" />
                </div>
              )}
            </div>
          ))}

          {sending && (
            <div className="flex gap-3 max-w-3xl mx-auto">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="rounded-2xl px-4 py-3 bg-white border border-slate-200">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-slate-200 bg-white px-8 py-4 flex-shrink-0">
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-3">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about your Fact Find..."
                className="flex-1 bg-slate-50 border-slate-200"
                disabled={sending}
              />
              <Button
                onClick={() => handleSend()}
                disabled={!input.trim() || sending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {sending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-slate-500 mt-2 text-center">
              Press Enter to send • This AI assistant is here to help guide you through your Fact Find
            </p>
          </div>
        </div>
      </div>
    </FactFindLayout>
  );
}