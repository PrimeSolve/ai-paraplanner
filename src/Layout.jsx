import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { RoleProvider } from '@/components/RoleContext';
import AppShell from '@/components/AppShell';
import AdviceGroupLayout from '@/components/advicegroup/AdviceGroupLayout';
import AdviserLayout from '@/components/adviser/AdviserLayout';

export default function Layout({ children, currentPageName }) {
  const [loading, setLoading] = useState(false);



  // Pages that should not have the AppShell navigation
  const noNavPages = ['Whitepaper', 'PublicHome', 'PublicAbout', 'PublicPricing', 'PublicContact', 'Register', 'SignIn', 'VerifyEmail', 'AvatarMarketing'];
  const adviceGroupPages = ['AdviceGroupDashboard', 'AdviceGroupSOARequests', 'AdviceGroupCompleted', 'AdviceGroupAdvisers', 'AdviceGroupClients', 'AdviceGroupProfile', 'AdviceGroupSettings', 'AdviceGroupHelp', 'AdviceGroupRiskProfiles', 'AdviceGroupModelPortfolios', 'AdviceGroupSOATemplate'];
  const adviserPages = ['AdviserDashboard', 'AdviserClients', 'AdviserFactFinds', 'AdviserSOARequests', 'AdviserSettings', 'AdviserProfile', 'AdviserHelp'];
  const hideNav = noNavPages.includes(currentPageName) || adviceGroupPages.includes(currentPageName) || adviserPages.includes(currentPageName);

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

  if (currentPageName === 'AdminTeam') {
    pageActions = (
      <button
        onClick={() => {
          // This is a workaround - we'll use a custom event
          window.dispatchEvent(new CustomEvent('openAddMemberDialog'));
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
        + Add Member
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
  
  if (adviceGroupPages.includes(currentPageName)) {
    layoutComponent = <AdviceGroupLayout currentPage={currentPageName} pageActions={pageActions}>{pageContent}</AdviceGroupLayout>;
  } else if (adviserPages.includes(currentPageName)) {
    layoutComponent = <AdviserLayout currentPage={currentPageName} pageActions={pageActions}>{pageContent}</AdviserLayout>;
  } else if (!hideNav) {
    layoutComponent = <AppShell pageActions={pageActions} pageTitle={pageTitle}>{pageContent}</AppShell>;
  } else {
    layoutComponent = children;
  }

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
        {layoutComponent}
      </div>
    </RoleProvider>
  );
}