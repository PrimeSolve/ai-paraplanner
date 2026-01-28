import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { RoleProvider } from '@/components/RoleContext';
import AppShell from '@/components/AppShell';

export default function Layout({ children, currentPageName }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        await base44.auth.me();
      } catch (error) {
        // User not authenticated
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  return (
    <RoleProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <style>{`
          :root {
            --primary: #1e293b;
            --primary-light: #334155;
            --accent: #f59e0b;
            --accent-dark: #d97706;
          }
        `}</style>
        <AppShell>
          {children}
        </AppShell>
      </div>
    </RoleProvider>
  );
}