import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import ClientLayout from '../components/client/ClientLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, FolderOpen } from 'lucide-react';

export default function ClientDocuments() {
  const [user, setUser] = useState(null);

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

  const documents = [
    { id: 1, name: 'Statement of Advice - Jan 2026.pdf', type: 'SOA', date: '2026-01-20', size: '2.4 MB' },
    { id: 2, name: 'Investment Summary.pdf', type: 'Report', date: '2026-01-15', size: '1.8 MB' },
    { id: 3, name: 'Risk Profile Assessment.pdf', type: 'Assessment', date: '2026-01-10', size: '856 KB' }
  ];

  return (
    <ClientLayout currentPage="ClientDocuments">
      <div className="bg-white border-b border-slate-200 px-8 py-6 sticky top-0 z-10">
        <h1 className="text-2xl font-['Fraunces'] font-medium text-slate-800">My Documents</h1>
        <p className="text-sm text-slate-600 mt-1">Access your financial documents and reports</p>
      </div>

      <div className="p-8">
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-600 px-6 py-4">
                    Document
                  </th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-600 px-6 py-4">
                    Type
                  </th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-600 px-6 py-4">
                    Date
                  </th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-600 px-6 py-4">
                    Size
                  </th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wider text-slate-600 px-6 py-4">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-purple-600" />
                        </div>
                        <span className="font-medium">{doc.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="secondary">{doc.type}</Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(doc.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {doc.size}
                    </td>
                    <td className="px-6 py-4">
                      <Button size="sm" variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </ClientLayout>
  );
}