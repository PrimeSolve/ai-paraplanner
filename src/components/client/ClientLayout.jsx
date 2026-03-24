import React from 'react';
import ClientSidebar from './ClientSidebar';
import useHenry from '../henry/useHenry';
import HenryPanel from '../henry/HenryPanel';

// TODO: client Henry — expand capabilities when client portal is fuller

export default function ClientLayout({ children, currentPage }) {
  const henry = useHenry({ version: 'client' });

  return (
    <div className="flex min-h-screen bg-slate-50">
      <ClientSidebar currentPage={currentPage} onHelpClick={henry.openPanel} />
      <div className="flex-1 ml-[260px]" style={{ paddingTop: '64px' }}>
        {children}
      </div>
      <HenryPanel
        version="client"
        isOpen={henry.isOpen}
        onClose={henry.closePanel}
        messages={henry.messages}
        isLoading={henry.isLoading}
        onSend={henry.sendMessage}
        onClear={henry.clearHistory}
      />
    </div>
  );
}