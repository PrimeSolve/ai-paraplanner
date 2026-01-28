import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FolderOpen } from 'lucide-react';

export default function AdviserDocuments() {
  return (
    <div style={{ padding: '24px 32px' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Documents</h1>
          <p className="text-sm text-slate-600 mt-1">Manage client documents and resources</p>
        </div>
        <Button className="bg-teal-600 hover:bg-teal-700">
          <Upload className="w-4 h-4 mr-2" />
          Upload Document
        </Button>
      </div>

      <Card className="p-12 text-center">
        <FolderOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-800 mb-2">No documents yet</h3>
        <p className="text-slate-600 mb-4">Upload and organize your client documents here</p>
        <Button className="bg-teal-600 hover:bg-teal-700">
          <Upload className="w-4 h-4 mr-2" />
          Upload First Document
        </Button>
      </Card>
    </div>
  );
}