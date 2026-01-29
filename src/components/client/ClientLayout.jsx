import React from 'react';
import ClientSidebar from './ClientSidebar';

export default function ClientLayout({ children, currentPage }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <ClientSidebar currentPage={currentPage} />
      <div className="flex-1 ml-72">
        {children}
      </div>
    </div>
  );
}