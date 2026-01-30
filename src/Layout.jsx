import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { RoleProvider } from '@/components/RoleContext';
import AppShell from '@/components/AppShell';

export default function Layout({ children, currentPageName }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        // This will cause a re-render after RoleProvider's loadUserData is called
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

  // Pages that should not have the AppShell navigation
  const noNavPages = ['Whitepaper', 'PublicHome', 'PublicAbout', 'PublicPricing', 'PublicContact', 'Register', 'SignIn'];
  const hideNav = noNavPages.includes(currentPageName);

  // Check if in test mode for top padding
  const isInTestMode = typeof window !== 'undefined' && !!localStorage.getItem('test_mode_entity');

  // For AdminAdviceGroups page specifically, pass the button directly
  let pageActions = null;
  let pageTitle = 'Advice Groups';
  
  if (currentPageName === 'AdminAdviceGroups') {
    pageActions = (
      <button
        onClick={() => {
          // This is a workaround - we'll use a custom event
          window.dispatchEvent(new CustomEvent('openAddAdviceGroupDialog'));
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 18px',
          background: '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        + Add Advice Group
      </button>
    );
  } else {
    pageTitle = null;
  }

  const pageContent = children;

  return (
    <RoleProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100" style={{ paddingTop: isInTestMode ? '40px' : '0' }}>
        <style>{`
          :root {
            --primary: #1e293b;
            --primary-light: #334155;
            --accent: #f59e0b;
            --accent-dark: #d97706;
          }
        `}</style>
        {hideNav ? children : <AppShell pageActions={pageActions} pageTitle={pageTitle}>{pageContent}</AppShell>}
      </div>
    </RoleProvider>
  );
}