import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useRole } from '../RoleContext';
import SidebarLayout from '../navigation/SidebarLayout';
import {
  Home,
  FileText,
  MessageSquare,
  FileCheck,
  Settings,
} from 'lucide-react';

export default function ClientSidebar({ currentPage }) {
  const [adviceGroup, setAdviceGroup] = useState(null);
  const [businessDetails, setBusinessDetails] = useState(null);
  const [logo, setLogo] = useState(null);
  const { originalUser } = useRole();

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await base44.auth.me();

        const clients = await base44.entities.Client.filter({ user_email: userData.email });
        if (clients.length > 0) {
          const clientData = clients[0];

          if (clientData.advice_group_id) {
            const groups = await base44.entities.AdviceGroup.filter({ id: clientData.advice_group_id });
            if (groups.length > 0) {
              setAdviceGroup(groups[0]);
              if (groups[0]?.logo_url) {
                setLogo(groups[0].logo_url);
              }
            }
          }
        }

        const details = localStorage.getItem('businessDetails');
        if (details) {
          const parsed = JSON.parse(details);
          setBusinessDetails(parsed);
          if (parsed?.logo_url && !logo) {
            setLogo(parsed.logo_url);
          }
        }
      } catch (error) {
        console.error('Error loading client data:', error);
      }
    };
    loadData();
  }, [logo]);

  const getCompanyName = () => {
    if (originalUser?.role === 'admin') {
      return businessDetails?.company_name || 'AI Paraplanner';
    }
    return adviceGroup?.name || 'Advice Group';
  };

  const navSections = [
    { items: [
      { path: 'ClientDashboard', label: 'Dashboard', icon: Home },
      { path: 'FactFindWelcome', label: 'My Fact Find', icon: FileText },
      { path: 'ClientDocuments', label: 'Documents', icon: FileCheck },
      { path: 'ClientMessages', label: 'Messages', icon: MessageSquare, badge: 3 },
    ]},
    { label: 'ACCOUNT', border: true, items: [
      { path: 'ClientSettings', label: 'Settings', icon: Settings }
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
      homePath="ClientDashboard"
      logoContent={logoContent}
      title={getCompanyName()}
      subtitle="CLIENT PORTAL"
      navSections={navSections}
      helpPath="ClientHelp"
      currentPage={currentPage}
    />
  );
}
