import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { LayoutDashboard, Users, FileText, CheckCircle, Settings, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useRole } from '../RoleContext';

export default function AdviserSidebar({ currentPage, loggedInUser }) {
  const [adviser, setAdviser] = useState(null);
  const [logo, setLogo] = useState(null);
  const [businessDetails, setBusinessDetails] = useState(null);
  const { switchedToId, navigationChain, originalUser } = useRole();

  useEffect(() => {
    const loadAdviserAndLogo = async () => {
      try {
        let logoUrl = null;
        
        // Determine whose logo to show based on originalUser
        if (originalUser?.role === 'admin') {
          const details = localStorage.getItem('businessDetails');
          if (details) {
            const parsed = JSON.parse(details);
            setBusinessDetails(parsed);
            if (parsed?.logo_url) {
              logoUrl = parsed.logo_url;
            }
          }
        } else if (switchedToId) {
          // If viewing as adviser, get their details
          const adviserData = await base44.entities.Adviser.list();
          const selectedAdviser = adviserData.find(a => a.id === switchedToId);
          setAdviser(selectedAdviser);
          setBusinessDetails(selectedAdviser);

          if (selectedAdviser?.advice_group_id) {
            const groups = await base44.entities.AdviceGroup.filter({ id: selectedAdviser.advice_group_id });
            if (groups?.[0]?.logo_url) {
              logoUrl = groups[0].logo_url;
            }
          }
        } else if (originalUser?.role === 'adviser') {
          // If logged in as adviser
          const advisers = await base44.entities.Adviser.filter({ user_id: originalUser.id });
          if (advisers.length > 0) {
            setAdviser(advisers[0]);
            setBusinessDetails(advisers[0]);
            
            if (advisers[0]?.advice_group_id) {
              const groups = await base44.entities.AdviceGroup.filter({ id: advisers[0].advice_group_id });
              if (groups?.[0]?.logo_url) {
                logoUrl = groups[0].logo_url;
              }
            }
          }
        }
        
        if (logoUrl) setLogo(logoUrl);
      } catch (error) {
        console.error('Failed to load adviser:', error);
      }
    };
    loadAdviserAndLogo();
  }, [switchedToId, originalUser]);

  const getCompanyName = () => {
    if (originalUser?.role === 'admin') {
      return businessDetails?.company_name || 'AI Paraplanner';
    }
    return businessDetails?.company || adviser?.company || 'Adviser';
  };

  const getSubtitle = () => {
    if (navigationChain.length === 0) {
      return 'ADVISER PORTAL';
    }
    const current = navigationChain[navigationChain.length - 1];
    return `VIEWING ${current.type.replace('_', ' ').toUpperCase()}`;
  };

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: 'AdviserDashboard', id: 'dashboard' },
    { label: 'Clients', icon: Users, path: 'AdviserClients', id: 'clients' },
    { label: 'SOA Requests', icon: FileText, path: 'AdviserSOARequests', id: 'soa-requests' },
    { label: 'Completed SOAs', icon: CheckCircle, path: 'AdviserCompletions', id: 'completed' }
  ];

  const accountItems = [
    { label: 'Settings', icon: Settings, path: 'AdviserSettings', id: 'settings' }
  ];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '260px',
      height: '100vh',
      background: '#0f172a',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 100,
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
    }}>
      {/* Logo Section */}
      <div style={{
        height: '64px',
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <Link to={createPageUrl('AdviserDashboard')} style={{ display: 'flex', alignItems: 'center', gap: '14px', textDecoration: 'none' }}>
          <div style={{
            width: '44px',
            height: '44px',
            background: logo ? '#1e293b' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '700',
            color: 'white',
            fontSize: '16px',
            overflow: 'hidden'
          }}>
            {logo ? (
              <img src={logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              'AI'
            )}
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'white', fontWeight: 600 }}>
              {getCompanyName()}
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>
              {getSubtitle()}
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '20px 12px', overflowY: 'auto' }}>
        <div style={{ marginBottom: '24px' }}>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <Link
                key={item.id}
                to={createPageUrl(item.path)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  color: isActive ? '#6366f1' : '#94a3b8',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  marginBottom: '4px',
                  background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent'
                }}
              >
                {isActive && (
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    width: '3px',
                    height: '24px',
                    background: '#6366f1',
                    borderRadius: '0 4px 4px 0'
                  }} />
                )}
                <Icon size={20} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge && (
                  <span style={{
                    padding: '2px 8px',
                    background: '#6366f1',
                    color: 'white',
                    fontSize: '10px',
                    fontWeight: '700',
                    borderRadius: '6px'
                  }}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Account Section */}
        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '0 12px', marginBottom: '8px' }}>
            ACCOUNT
          </div>
          {accountItems.map(item => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <Link
                key={item.id}
                to={createPageUrl(item.path)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  color: isActive ? '#6366f1' : '#94a3b8',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  marginBottom: '4px',
                  background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent'
                }}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* AI Assistant Button */}
      <div style={{ padding: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <Link to={createPageUrl('AdviserHelp')} style={{ textDecoration: 'none' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px',
            background: 'linear-gradient(to right, #6366f1, #8b5cf6)',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(to right, #4f46e5, #7c3aed)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(to right, #6366f1, #8b5cf6)';
          }}
          >
            <div style={{
              width: '36px',
              height: '36px',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Sparkles size={20} style={{ color: 'white' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: 'white', fontWeight: 600, fontSize: '14px' }}>
                AI Assistant
              </div>
              <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '12px' }}>
                Ask for help
              </div>
            </div>
            <div style={{
              width: '24px',
              height: '24px',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ color: 'white', fontSize: '12px', fontWeight: 700 }}>?</span>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}