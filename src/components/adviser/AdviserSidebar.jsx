import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useRole } from '../RoleContext';
import SidebarLayout from '../navigation/SidebarLayout';
import { LayoutDashboard, Users, FileText, CheckCircle, Settings, TrendingUp, ScrollText, Search, LifeBuoy } from 'lucide-react';

export default function AdviserSidebar({ currentPage }) {
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

  const navSections = [
    { label: 'NAVIGATION', items: [
      { label: 'Dashboard', icon: LayoutDashboard, path: 'AdviserDashboard' },
      { label: 'Clients', icon: Users, path: 'AdviserClients' },
      { label: 'Product Research', icon: Search, path: 'ProductResearch' },
      { label: 'Models', icon: TrendingUp, path: 'AdviserModels' },
      { label: 'SOA Queue', icon: FileText, path: 'AdviserSOARequests' },
      { label: 'Completed SOAs', icon: CheckCircle, path: 'AdviserCompletions' },
      { label: 'Advice Records', icon: ScrollText, path: 'AdviserAdviceRecords' }
    ]},
    { label: 'ACCOUNT', border: true, items: [
      { label: 'Settings', icon: Settings, path: 'AdviserSettings' }
    ]},
    { label: 'SUPPORT', border: true, items: [
      { label: 'Support Tickets', icon: LifeBuoy, path: 'AdviserSupport' }
    ]}
  ];

  const logoContent = (
    <div className="w-10 h-10 bg-[#1e293b] rounded-xl flex items-center justify-center font-bold text-sm shadow-lg overflow-hidden">
      {logo ? (
        <img src={logo} alt="Logo" className="w-full h-full object-cover" />
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
      subtitle={getSubtitle()}
      navSections={navSections}
      helpPath="AdviserHelp"
      currentPage={currentPage}
    />
  );
}
