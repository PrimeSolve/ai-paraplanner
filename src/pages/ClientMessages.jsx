import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import ClientLayout from '../components/client/ClientLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send } from 'lucide-react';

export default function ClientMessages() {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error('Failed to load user:', error);
      }
    };
    loadUser();
  }, []);

  const messages = [
    { 
      id: 1, 
      from: 'adviser', 
      name: 'Your Adviser', 
      content: 'Hi! I\'ve reviewed your fact find. Let\'s schedule a meeting to discuss next steps.',
      date: '2026-01-23 14:30',
      read: true
    },
    { 
      id: 2, 
      from: 'client', 
      name: 'You', 
      content: 'Thanks! I\'m available this week.',
      date: '2026-01-23 15:45',
      read: true
    }
  ];

  return (
    <ClientLayout currentPage="ClientMessages">
      <div className="bg-white border-b border-slate-200 px-8 py-6 sticky top-0 z-10">
        <h1 className="text-2xl font-['Fraunces'] font-medium text-slate-800">Messages</h1>
        <p className="text-sm text-slate-600 mt-1">Communicate with your financial adviser</p>
      </div>

      <div className="p-8 max-w-4xl mx-auto">
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex gap-3 ${msg.from === 'client' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.from === 'adviser' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {msg.name.charAt(0)}
                  </div>
                  <div className={`flex-1 ${msg.from === 'client' ? 'text-right' : ''}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold">{msg.name}</span>
                      <span className="text-xs text-slate-500">{msg.date}</span>
                    </div>
                    <div className={`inline-block p-3 rounded-lg ${
                      msg.from === 'adviser' 
                        ? 'bg-purple-50 text-slate-800' 
                        : 'bg-slate-100 text-slate-800'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4">
              <Textarea
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="mb-3"
              />
              <Button className="bg-purple-600 hover:bg-purple-700 w-full">
                <Send className="w-4 h-4 mr-2" />
                Send Message
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ClientLayout>
  );
}