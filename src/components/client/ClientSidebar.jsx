import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useRole } from '../RoleContext';
import { createPageUrl } from '../../utils';
import {
  Home,
  FileText,
  MessageSquare,
  FileCheck,
  Settings,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export default function ClientSidebar({ currentPage }) {
  const [adviceGroup, setAdviceGroup] = useState(null);
  const [businessDetails, setBusinessDetails] = useState(null);
  const [logo, setLogo] = useState(null);
  const { originalUser } = useRole();
  const [factFindOpen, setFactFindOpen] = useState(true);
  const [adviceOpen, setAdviceOpen] = useState(true);

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

  const NavLink = ({ path, label, icon: Icon, indent, badge }) => {
    const isActive = currentPage === path;
    return (
      <Link
        to={createPageUrl(path)}
        className={`flex items-center gap-3 py-3 rounded-xl text-sm font-medium no-underline transition-all mb-1 relative ${
          indent ? 'px-3 pl-11' : 'px-3'
        } ${
          isActive
            ? 'bg-white/10 text-white'
            : 'text-[#94a3b8] hover:bg-white/[0.05] hover:text-white'
        }`}
      >
        {isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-md bg-white" />
        )}
        {Icon && <Icon className="w-5 h-5" />}
        <span>{label}</span>
        {badge && (
          <span className="ml-auto bg-[#f97316] text-white text-[11px] font-bold px-2 py-0.5 rounded-xl">
            {badge}
          </span>
        )}
      </Link>
    );
  };

  const ExpandableSection = ({ label, icon: Icon, isOpen, onToggle, children }) => {
    const Chevron = isOpen ? ChevronDown : ChevronRight;
    return (
      <>
        <button
          onClick={onToggle}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all mb-1 text-[#94a3b8] hover:bg-white/[0.05] hover:text-white bg-transparent border-none cursor-pointer"
        >
          <Icon className="w-5 h-5" />
          <span>{label}</span>
          <Chevron className="w-4 h-4 ml-auto" />
        </button>
        {isOpen && children}
      </>
    );
  };

  return (
    <div className="w-[260px] bg-[#0f172a] fixed top-0 left-0 bottom-0 flex flex-col z-50">
      {/* Logo Header */}
      <div className="h-16 px-6 flex items-center border-b border-white/[0.08]">
        <Link to={createPageUrl('ClientDashboard')} className="flex items-center gap-3 text-white no-underline">
          <div className="w-10 h-10 bg-[#1e293b] rounded-xl flex items-center justify-center font-bold text-sm shadow-lg overflow-hidden">
            {logo ? (
              <img src={logo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              'AI'
            )}
          </div>
          <div>
            <div className="text-white text-sm font-bold">{getCompanyName()}</div>
            <div className="text-[#94a3b8] text-xs font-medium uppercase tracking-wide">
              CLIENT PORTAL
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-4 overflow-y-auto">
        {/* Main section */}
        <div className="mb-7">
          <NavLink path="ClientDashboard" label="Dashboard" icon={Home} />

          <ExpandableSection
            label="Fact Find"
            icon={FileText}
            isOpen={factFindOpen}
            onToggle={() => setFactFindOpen(!factFindOpen)}
          >
            <NavLink path="ClientFactFindForm" label="Form View" indent />
            <NavLink path="ClientFactFindAI" label="AI Fact Find" indent />
          </ExpandableSection>

          <ExpandableSection
            label="Advice"
            icon={TrendingUp}
            isOpen={adviceOpen}
            onToggle={() => setAdviceOpen(!adviceOpen)}
          >
            <NavLink path="ClientCashflow" label="Cashflow Model" indent />
            <NavLink path="ClientAdviceHistory" label="Advice History" indent />
          </ExpandableSection>

          <NavLink path="ClientDocuments" label="Documents" icon={FileCheck} />
          <NavLink path="ClientMessages" label="Messages" icon={MessageSquare} />
        </div>

        {/* ACCOUNT section */}
        <div className="mb-7 border-t border-white/[0.08] pt-6">
          <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
            ACCOUNT
          </div>
          <NavLink path="ClientSettings" label="Settings" icon={Settings} />
        </div>
      </nav>

      {/* AI Assistant Button */}
      <div className="p-4">
        <Link to={createPageUrl('ClientHelp')} className="no-underline">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:from-[#4f46e5] hover:to-[#7c3aed] cursor-pointer transition-all shadow-lg shadow-purple-900/30">
            <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white font-semibold text-sm">AI Assistant</div>
              <div className="text-white/80 text-xs">Ask for help</div>
            </div>
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">?</span>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
