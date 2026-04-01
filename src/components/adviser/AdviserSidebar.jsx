import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useRole } from '../RoleContext';
import SidebarLayout from '../navigation/SidebarLayout';
import { LayoutDashboard, Users, FileText, Settings, ScrollText, Search, LifeBuoy, CreditCard } from 'lucide-react';

export default function AdviserSidebar({ currentPage, onHelpClick }) {
  const [adviser, setAdviser] = useState(null);
  const [logo, setLogo] = useState(null);
  const [businessDetails, setBusinessDetails] = useState(null);
  const { switchedToId, navigationChain, originalUser } = useRole();

  useEffect(() => {
    const loadAdviserAndLogo = async () => {
      try {
        let logoUrl = null;

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

  // TODO: re-add "Completed SOAs" and "Models" when features are ready for launch
  const navSections = [
    { label: 'NAVIGATION', items: [
      { label: 'Dashboard', icon: LayoutDashboard, path: 'AdviserDashboard' },
      { label: 'Clients', icon: Users, path: 'AdviserClients' },
      { label: 'Product Research', icon: Search, path: 'ProductResearch' },
      { label: 'SOA Queue', icon: FileText, path: 'AdviserSOARequests' },
      { label: 'Advice History', icon: ScrollText, path: 'AdviserAdviceHistory' }
    ]},
    { label: 'ACCOUNT', border: true, items: [
      { label: 'Billing', icon: CreditCard, path: 'Billing' },
      { label: 'Settings', icon: Settings, path: 'AdviserSettings' }
    ]},
    { label: 'SUPPORT', border: true, items: [
      { label: 'Support Tickets', icon: LifeBuoy, path: 'AdviserSupport' }
    ]}
  ];

  const logoContent = (
    <div style={{
      width: '30px',
      height: '30px',
      background: 'linear-gradient(135deg, #00C9B1, #1E88E5)',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '11px',
      fontWeight: 700,
      color: '#fff',
      flexShrink: 0,
      overflow: 'hidden',
    }}>
      {logo ? (
        <img src={logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        'AI'
      )}
    </div>
  );

  return (
    <SidebarLayout
      homePath="AdviserDashboard"
      logoContent={logoContent}
      title={getCompanyName()}
      subtitle={null}
      navSections={navSections}
      helpPath={onHelpClick ? undefined : "AdviserHelp"}
      helpText="Ask Henry"
      currentPage={currentPage}
      onHelpClick={onHelpClick}
      accentColor="#00C9B1"
    />
  );
}
