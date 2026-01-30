import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { ChevronLeft } from 'lucide-react';
import ClientSidebar from './ClientSidebar';

export default function ClientLayout({ children, currentPage }) {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const clientId = params.get('id');
  const isAdminView = !!clientId;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <ClientSidebar currentPage={currentPage} />
      <div className="flex-1 ml-72 flex flex-col">
        {isAdminView && (
          <div className="bg-white border-b border-slate-200 px-8 py-3 flex items-center gap-2">
            <button
              onClick={() => navigate(createPageUrl('AdminClients'))}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium text-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Clients
            </button>
            <span className="text-slate-400">•</span>
            <span className="text-slate-600 text-sm">{currentPage === 'ClientDashboard' ? 'Client Overview' : 'Client'}</span>
          </div>
        )}
        <div className="flex-1" style={{ paddingTop: '64px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}