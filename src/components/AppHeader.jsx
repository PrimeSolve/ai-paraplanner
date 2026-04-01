import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useRole } from './RoleContext';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { User, HelpCircle, LogOut, Home, ChevronRight, MessageSquare, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const ROLE_PORTAL_LABELS = {
  admin: 'Platform Admin',
  advice_group: 'Advice Group',
  adviser: 'Adviser',
  client: 'Client',
};

const ROLE_DASHBOARDS = {
  admin: 'AdminDashboard',
  advice_group: 'AdviceGroupDashboard',
  adviser: 'AdviserDashboard',
  client: 'ClientDashboard',
};

const ROLE_PROFILES = {
  admin: 'AdminProfile',
  advice_group: 'AdviceGroupMyProfile',
  adviser: 'AdviserProfile',
  client: 'ClientProfile',
};

export default function AppHeader({ pageActions, pageTitle }) {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    user,
    originalUser,
    navigationChain,
    isViewingAs,
    navigateToLevel,
    resetToOriginal
  } = useRole();

  const [showRefreshWarning, setShowRefreshWarning] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isFactFindAnyPage = location.pathname.includes('FactFind');
  const isSOARequestPage = location.pathname.includes('SOARequestDetails');
  const isSOARequestAnyPage = location.pathname.includes('SOARequest');
  const factFindId = new URLSearchParams(window.location.search).get('id');

  const loggedInUser = originalUser || user;
  const userRole = loggedInUser?.role || 'admin';

  const getPortalLabel = () => {
    return ROLE_PORTAL_LABELS[userRole] || 'Portal';
  };

  const handleGoHome = () => {
    resetToOriginal();
    const dashboard = ROLE_DASHBOARDS[userRole];
    if (dashboard) {
      navigate(createPageUrl(dashboard));
    }
  };

  const handleBreadcrumbClick = (index) => {
    navigateToLevel(index);
    const level = navigationChain[index];
    if (level.type === 'advice_group') {
      navigate(createPageUrl('AdviceGroupDashboard'));
    } else if (level.type === 'adviser') {
      navigate(createPageUrl('AdviserDashboard'));
    } else if (level.type === 'client') {
      navigate(createPageUrl('ClientDashboard') + `?client_email=${level.email}`);
    }
  };

  const getProfileUrl = () => {
    return createPageUrl(ROLE_PROFILES[userRole] || 'AdminProfile');
  };

  const getInitials = () => {
    const name = loggedInUser?.display_name || loggedInUser?.full_name || loggedInUser?.email || '';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';
  };

  const getDisplayName = () => {
    return loggedInUser?.display_name || loggedInUser?.full_name || loggedInUser?.email || '';
  };

  // Format the current date like "Wed 2 April 2026"
  const getFormattedDate = () => {
    const now = new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${days[now.getDay()]} ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
  };

  // Get current page name from path
  const getCurrentPageName = () => {
    if (pageTitle) return pageTitle;
    const path = location.pathname;
    const pageName = path.split('/').pop() || 'Dashboard';
    return pageName.replace(/([A-Z])/g, ' $1').trim().replace(/^ /, '');
  };

  const handleRefreshClick = () => {
    setShowRefreshWarning(true);
    setConfirmDelete(false);
  };

  const handleConfirmRefresh = async () => {
    if (!confirmDelete) {
      toast.error('Please confirm you understand this will delete all data');
      return;
    }
    setRefreshing(true);
    setShowRefreshWarning(false);
    try {
      if (factFindId) {
        toast.success('Data refreshed successfully');
        window.location.reload();
      }
    } catch (error) {
      toast.error('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <>
      <div style={{
        width: '100%',
        height: '52px',
        background: '#fff',
        borderBottom: '0.5px solid #E0E6F0',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 40,
        flexShrink: 0,
      }}>
        {/* Left side: Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#8A9BBE' }}>
          {isViewingAs && (
            <button
              onClick={handleGoHome}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '28px', height: '28px', borderRadius: '50%',
                background: 'transparent', border: 'none', cursor: 'pointer', color: '#8A9BBE',
                marginRight: '2px',
              }}
              title="Return to my dashboard"
            >
              <Home size={13} />
            </button>
          )}
          {!isViewingAs && (
            <svg width="13" height="13" viewBox="0 0 16 16" fill="#8A9BBE"><path d="M8 1L1 7h2v7h4v-4h2v4h4V7h2L8 1z"/></svg>
          )}
          {isViewingAs ? (
            <>
              <button
                onClick={handleGoHome}
                style={{
                  background: 'transparent', border: 'none', padding: '2px 4px',
                  cursor: 'pointer', color: '#8A9BBE', fontSize: '12px',
                }}
              >
                {getPortalLabel()}
              </button>
              {navigationChain.map((level, index) => (
                <React.Fragment key={index}>
                  <span style={{ color: '#C5CFDF' }}>›</span>
                  <button
                    onClick={() => handleBreadcrumbClick(index)}
                    style={{
                      background: 'transparent', border: 'none', padding: '2px 4px',
                      cursor: 'pointer',
                      color: index === navigationChain.length - 1 ? '#0A1628' : '#8A9BBE',
                      fontWeight: index === navigationChain.length - 1 ? 500 : 400,
                      fontSize: '12px',
                    }}
                  >
                    {level.name}
                  </button>
                </React.Fragment>
              ))}
            </>
          ) : (
            <>
              <span style={{ color: '#C5CFDF' }}>›</span>
              <span style={{ color: '#0A1628', fontWeight: 500 }}>{getCurrentPageName()}</span>
              <span style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 600,
                background: 'rgba(0,201,177,0.1)', color: '#00C9B1', marginLeft: '4px',
              }}>
                {getPortalLabel()}
              </span>
            </>
          )}
        </div>

        {/* Right side: date, page actions, special buttons, name, avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {pageActions && <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>{pageActions}</div>}

          {isFactFindAnyPage && (
            <>
              <Link to={createPageUrl('FactFindAssistant') + (factFindId ? `?id=${factFindId}` : '')}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'linear-gradient(to right, #14b8a6, #10b981)',
                  color: 'white', padding: '6px 14px', borderRadius: '20px',
                  cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                }}>
                  <MessageSquare size={14} />
                  <span>Talk to our assistant</span>
                  <span style={{
                    background: '#fbbf24', color: '#78350f', fontSize: '9px', fontWeight: 700,
                    padding: '1px 5px', borderRadius: '4px', marginLeft: '2px',
                  }}>LIVE</span>
                </div>
              </Link>
              <button
                onClick={handleRefreshClick}
                disabled={refreshing}
                style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  background: '#f97316', color: 'white', border: 'none',
                  cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '14px',
                  opacity: refreshing ? 0.5 : 1,
                }}
                title="Refresh Data"
              >
                🔄
              </button>
            </>
          )}

          {isSOARequestPage && (
            <>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'linear-gradient(to right, #14b8a6, #10b981)',
                color: 'white', padding: '6px 14px', borderRadius: '20px',
                cursor: 'pointer', fontSize: '12px', fontWeight: 600,
              }}>
                <MessageSquare size={14} />
                <span>Talk to AI Paraplanner</span>
                <span style={{
                  background: '#fbbf24', color: '#78350f', fontSize: '9px', fontWeight: 700,
                  padding: '1px 5px', borderRadius: '4px', marginLeft: '2px',
                }}>NEW</span>
              </div>
              <button style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: '#a855f7', color: 'white', border: 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '14px',
              }}
              title="Projected Position"
              >
                📊
              </button>
            </>
          )}

          <span style={{ fontSize: '11px', color: '#8A9BBE' }}>{getFormattedDate()}</span>

          {loggedInUser && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '4px 8px', background: 'transparent', border: 'none',
                  cursor: 'pointer', borderRadius: '8px',
                }}>
                  <span style={{ fontSize: '12px', fontWeight: 500, color: '#3A4A6B' }}>
                    {getDisplayName()}
                  </span>
                  <div style={{
                    width: '30px', height: '30px', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '10px', fontWeight: 700, color: '#fff',
                    overflow: 'hidden',
                    background: loggedInUser.profile_image_url ? 'transparent' : 'linear-gradient(135deg, #1D9E75, #0F6E56)',
                  }}>
                    {loggedInUser.profile_image_url ? (
                      <img
                        src={loggedInUser.profile_image_url}
                        alt="Profile"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      getInitials()
                    )}
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" style={{ width: '224px' }}>
                <DropdownMenuItem asChild>
                  <Link to={getProfileUrl()} style={{ cursor: 'pointer' }}>
                    <User size={16} style={{ marginRight: '12px' }} />
                    My Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <HelpCircle size={16} style={{ marginRight: '12px' }} />
                  Help & Support
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => base44.auth.logout()}>
                  <LogOut size={16} style={{ marginRight: '12px' }} />
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Refresh Warning Dialog */}
      <Dialog open={showRefreshWarning} onOpenChange={setShowRefreshWarning}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                ⚠️
              </div>
              Refresh Fact Find Data
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-slate-700">
              Are you sure you want to refresh all Fact Find data?
            </p>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
              <div className="flex gap-2 mb-2">
                <span className="text-xl flex-shrink-0">⚠️</span>
                <div>
                  <h4 className="font-bold text-slate-800 mb-2">WARNING: This will:</h4>
                  <ul className="text-sm text-slate-700 space-y-1">
                    <li>• Clear all current fact find data</li>
                    <li>• This action cannot be undone</li>
                  </ul>
                </div>
              </div>
            </div>
            <p className="text-sm text-slate-600">
              Only use this if you want to start fresh with your fact find.
            </p>
            <div className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg bg-slate-50">
              <Checkbox
                id="confirm-delete"
                checked={confirmDelete}
                onCheckedChange={setConfirmDelete}
                className="mt-0.5"
              />
              <label
                htmlFor="confirm-delete"
                className="text-sm text-slate-700 cursor-pointer leading-tight"
              >
                I understand this will delete all my current fact find data
              </label>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowRefreshWarning(false)}
                className="border-slate-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmRefresh}
                disabled={!confirmDelete}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Yes, Refresh Data
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
