import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useRole } from '../RoleContext';
import SidebarLayout from '../navigation/SidebarLayout';
import {
  LayoutDashboard,
  Layers,
  Users,
  UserCheck,
  FileText,
  Settings,
  UsersRound,
  MessageSquare,
  Settings2,
  UserCircle
} from 'lucide-react';

export default function AdminSidebar({ currentPage, onHelpClick }) {
  const { navigationChain } = useRole();
  const [businessDetails, setBusinessDetails] = useState(null);
  const [soaQueueCount, setSoaQueueCount] = useState(0);

  useEffect(() => {
    const loadBusinessDetails = () => {
      const saved = localStorage.getItem('businessDetails');
      if (saved) {
        setBusinessDetails(JSON.parse(saved));
      }
    };
    loadBusinessDetails();

    window.addEventListener('businessDetailsUpdated', loadBusinessDetails);
    return () => {
      window.removeEventListener('businessDetailsUpdated', loadBusinessDetails);
    };
  }, []);

  useEffect(() => {
    const loadQueueCount = async () => {
      try {
        const soaRequests = await base44.entities.SOARequest.list('-created_date', 200);
        const activeCount = soaRequests.filter(s => s.status === 'submitted' || s.status === 'in_progress').length;
        setSoaQueueCount(activeCount);
      } catch (error) {
        console.error('Failed to load SOA queue count:', error);
      }
    };
    loadQueueCount();
  }, []);

  const getSubtitle = () => {
    if (navigationChain.length === 0) {
      return 'ADMIN PORTAL';
    }
    const current = navigationChain[navigationChain.length - 1];
    return `VIEWING ${current.type.replace('_', ' ').toUpperCase()}`;
  };

  const navSections = [
    { label: 'OVERVIEW', items: [
      { label: 'Dashboard', path: 'AdminDashboard', icon: LayoutDashboard },
      { label: 'SOA Queue', path: 'AdminQueue', icon: Layers, badge: soaQueueCount > 0 ? String(soaQueueCount) : null, badgeColor: 'warn' }
    ]},
    { label: 'MANAGEMENT', items: [
      { label: 'Advice Groups', path: 'AdminAdviceGroups', icon: Users },
      { label: 'Advisers', path: 'AdminAdvisers', icon: UserCheck },
      { label: 'Clients', path: 'AdminClients', icon: Users }
    ]},
    { label: 'SUPPORT', items: [
      { label: 'All Tickets', path: 'AdminTickets', icon: MessageSquare }
    ]},
    { label: 'CONFIGURATION', items: [
      { label: 'Data Manager', path: 'AdminDataManager', icon: Settings2 },
      { label: 'SOA Template', path: 'AdminTemplate', icon: FileText },
      { label: 'Avatar', path: 'AdminAvatarConfig', icon: UserCircle },
      { label: 'Team', path: 'AdminTeam', icon: UsersRound },
      { label: 'Settings', path: 'AdminSettings', icon: Settings }
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
      {businessDetails?.logo_url ? (
        <img src={businessDetails.logo_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        'AI'
      )}
    </div>
  );

  return (
    <SidebarLayout
      homePath="AdminDashboard"
      logoContent={logoContent}
      title={businessDetails?.company_name || 'AI Paraplanner'}
      accentColor="#00C9B1"
      subtitle={null}
      navSections={navSections}
      onHelpClick={onHelpClick}
      helpText="Ask Henry"
      currentPage={currentPage}
    />
  );
}
