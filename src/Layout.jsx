import React, { useEffect } from 'react';
import AppShell from '@/components/AppShell';

export default function Layout({ children, currentPageName }) {
  // Load LiveKit SDK for voice AI
  useEffect(() => {
    if (!document.getElementById('livekit-sdk')) {
      const script = document.createElement('script');
      script.id = 'livekit-sdk';
      script.src = 'https://cdn.jsdelivr.net/npm/livekit-client@2/dist/livekit-client.umd.min.js';
      script.async = true;
      script.onload = () => {
        console.log('[Voice] LiveKit SDK loaded successfully');
        console.log('[Voice] LivekitClient available:', typeof window.LivekitClient);
      };
      script.onerror = () => {
        console.error('[Voice] Failed to load LiveKit SDK');
      };
      document.head.appendChild(script);
    } else {
      console.log('[Voice] LiveKit SDK script tag already exists');
      console.log('[Voice] LivekitClient available:', typeof window.LivekitClient);
    }
  }, []);



  // Pages that should not have the AppShell navigation
  const noNavPages = ['Whitepaper', 'PublicHome', 'PublicAbout', 'PublicPricing', 'PublicContact', 'Register', 'SignIn', 'VerifyEmail', 'AvatarMarketing', 'ClientCashflow', 'ClientFactFindAI'];
  const hideNav = noNavPages.includes(currentPageName);

  // Check if in test mode for top padding
  const isInTestMode = typeof window !== 'undefined' && !!localStorage.getItem('test_mode_entity');

  // For AdminAdviceGroups page specifically, pass the button directly
  let pageActions = null;
  let pageTitle = null;
  
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
          background: '#0F4C5C',
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
  }


  if (currentPageName === 'AdminDataManager') {
    pageActions = (
      <button
        onClick={() => {
          window.dispatchEvent(new CustomEvent('openNewDatabaseDialog'));
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 18px',
          background: '#0F4C5C',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        + New Database
      </button>
    );
  }

  if (currentPageName === 'AdminAdvisers') {
    pageActions = (
      <button
        onClick={() => {
          window.dispatchEvent(new CustomEvent('openAddAdviserAdminDialog'));
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 18px',
          background: '#0F4C5C',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        + Add Adviser
      </button>
    );
  }

  if (currentPageName === 'AdviceGroupAdvisers') {
    pageActions = (
      <button
        onClick={() => {
          window.dispatchEvent(new CustomEvent('openAddAdviserDialog'));
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 18px',
          background: '#0F4C5C',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        + Add Adviser
      </button>
    );
  }

  if (currentPageName === 'AdviserClients') {
    pageActions = (
      <button
        onClick={() => {
          window.dispatchEvent(new CustomEvent('openAddClientDialog'));
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 18px',
          background: '#0F4C5C',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        + Add Client
      </button>
    );
  }

  if (currentPageName === 'AdviserSOARequests') {
    pageActions = (
      <button
        onClick={() => {
          window.dispatchEvent(new CustomEvent('openAddSOAQueueDialog'));
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 18px',
          background: '#0F4C5C',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        + New SOA Request
      </button>
    );
  }

  const pageContent = children;

  // Determine which layout to use
  let layoutComponent = null;

  if (!hideNav) {
    layoutComponent = <AppShell pageActions={pageActions} pageTitle={pageTitle}>{pageContent}</AppShell>;
  } else {
    layoutComponent = children;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100" style={{ paddingTop: isInTestMode ? '40px' : '0', ...(hideNav ? { height: '100vh', overflow: 'hidden' } : {}) }}>
      <style>{`
        :root {
          --primary: #1e293b;
          --primary-light: #334155;
          --accent: #f59e0b;
          --accent-dark: #d97706;
        }
      `}</style>
      {layoutComponent}
    </div>
  );
}