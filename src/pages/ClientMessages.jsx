import React, { useState } from 'react';
import {
  MessageSquare, 
  Filter,
  Search,
  ChevronDown,
  X,
  Bot,
  User,
  FileText,
  HelpCircle,
  Sparkles
} from 'lucide-react';

// Source configurations
const sourceConfig = {
  'Fact Find': { color: 'bg-blue-100 text-blue-700', icon: FileText },
  'SOA Request': { color: 'bg-green-100 text-green-700', icon: Sparkles },
  'Support': { color: 'bg-purple-100 text-purple-700', icon: HelpCircle },
  'General': { color: 'bg-slate-100 text-slate-600', icon: MessageSquare },
};

// Mock conversation data
const mockConversations = [
  { 
    id: 1, 
    date: '30/01/2026', 
    time: '14:30',
    source: 'Fact Find', 
    topic: 'Questions about superannuation section',
    messageCount: 8,
    messages: [
      { role: 'user', content: "I'm not sure what to put for my employer super contribution rate.", time: '14:30' },
      { role: 'assistant', content: "No problem! Your employer super contribution rate is typically 11% (the current superannuation guarantee rate). You can find the exact percentage on your payslip or by checking your super fund's online portal.", time: '14:30' },
      { role: 'user', content: "I found it - it says 11.5% on my payslip", time: '14:32' },
      { role: 'assistant', content: "Great find! 11.5% is above the minimum. I'll record that for you. Do you also make any voluntary contributions?", time: '14:32' },
    ]
  },
  { 
    id: 2, 
    date: '28/01/2026', 
    time: '10:15',
    source: 'Fact Find', 
    topic: 'Help with insurance details',
    messageCount: 5,
    messages: [
      { role: 'user', content: "What insurance details do I need to provide?", time: '10:15' },
      { role: 'assistant', content: "For the insurance section, we need details about any existing policies you hold: Life Insurance, TPD, Income Protection, and Trauma cover.", time: '10:15' },
    ]
  },
  { 
    id: 3, 
    date: '25/01/2026', 
    time: '16:45',
    source: 'SOA Request', 
    topic: 'Clarification on investment strategy',
    messageCount: 12,
    messages: [
      { role: 'user', content: "Can you explain the investment strategy recommendation?", time: '16:45' },
      { role: 'assistant', content: "Based on your risk profile, we've recommended a Balanced growth strategy with 60-70% growth assets and 30-40% defensive assets.", time: '16:45' },
    ]
  },
  { 
    id: 4, 
    date: '20/01/2026', 
    time: '09:00',
    source: 'Support', 
    topic: 'How to upload documents',
    messageCount: 3,
    messages: [
      { role: 'user', content: "How do I upload my tax return?", time: '09:00' },
      { role: 'assistant', content: "Go to the 'Documents' section in your sidebar, then click 'Upload Document'. You can drag and drop or browse for files.", time: '09:00' },
    ]
  },
];

const filterOptions = [
  { label: 'All Conversations', value: 'all' },
  { label: 'Fact Find', value: 'Fact Find' },
  { label: 'SOA Request', value: 'SOA Request' },
  { label: 'Support', value: 'Support' },
];

export default function ClientMessages() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversation, setSelectedConversation] = useState(null);

  const filteredConversations = mockConversations.filter(conv => {
    const matchesFilter = activeFilter === 'all' || conv.source === activeFilter;
    const matchesSearch = conv.topic.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getSourceConfig = (source) => sourceConfig[source] || sourceConfig['General'];

  return (
    <div style={{ padding: '24px 32px' }}>
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Conversation History</h1>
          <p className="text-slate-600">View your past interactions with our AI assistants</p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64 bg-white"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-slate-200 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white cursor-pointer min-w-[180px]"
            >
              {filterOptions.map((filter) => (
                <option key={filter.value} value={filter.value}>{filter.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Conversations Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-slate-50 border-b border-slate-200">
            <div className="col-span-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</div>
            <div className="col-span-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Source</div>
            <div className="col-span-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Topic</div>
            <div className="col-span-1 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Messages</div>
            <div className="col-span-2 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</div>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredConversations.length > 0 ? (
              filteredConversations.map((conv) => {
                const config = getSourceConfig(conv.source);
                const SourceIcon = config.icon;
                
                return (
                  <div key={conv.id} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-slate-50 transition-colors items-center">
                    <div className="col-span-2">
                      <div className="text-sm font-medium text-slate-800">{conv.date}</div>
                      <div className="text-xs text-slate-500">{conv.time}</div>
                    </div>
                    <div className="col-span-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
                        <SourceIcon className="w-3 h-3" />
                        {conv.source}
                      </span>
                    </div>
                    <div className="col-span-5">
                      <p className="text-sm text-slate-700 truncate">{conv.topic}</p>
                    </div>
                    <div className="col-span-1 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-sm font-medium text-slate-600">
                        {conv.messageCount}
                      </span>
                    </div>
                    <div className="col-span-2 flex items-center justify-end">
                      <button 
                        onClick={() => setSelectedConversation(conv)}
                        className="flex items-center gap-2 px-4 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors font-medium"
                      >
                        <MessageSquare className="w-4 h-4" />
                        View
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-6 py-12 text-center">
                <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No conversations found</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 text-sm text-slate-500">
          Showing {filteredConversations.length} of {mockConversations.length} conversations
        </div>

        {/* Conversation Detail Modal */}
        {selectedConversation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">{selectedConversation.topic}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${getSourceConfig(selectedConversation.source).color}`}>
                      {selectedConversation.source}
                    </span>
                    <span className="text-sm text-slate-500">{selectedConversation.date} at {selectedConversation.time}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedConversation(null)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {selectedConversation.messages.map((msg, idx) => (
                  <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-purple-100 text-purple-600'
                    }`}>
                      {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div className={`max-w-[80%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                      <div className={`inline-block px-4 py-2.5 rounded-2xl text-sm ${
                        msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-md' : 'bg-slate-100 text-slate-700 rounded-bl-md'
                      }`}>
                        {msg.content}
                      </div>
                      <div className={`text-xs text-slate-400 mt-1 ${msg.role === 'user' ? 'text-right' : ''}`}>{msg.time}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
                <p className="text-sm text-slate-500 text-center">This is a read-only view of your conversation history</p>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}