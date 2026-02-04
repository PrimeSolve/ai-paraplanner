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
import { User, HelpCircle, LogOut, Home, ChevronRight, MessageSquare, RefreshCw, Info } from 'lucide-react';
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

  // The actual logged-in user (for profile display)
  const loggedInUser = originalUser || user;

  const handleGoHome = () => {
    resetToOriginal();
    // Navigate to the original user's dashboard
    if (loggedInUser?.role === 'admin') {
      navigate(createPageUrl('AdminDashboard'));
    } else if (loggedInUser?.role === 'advice_group') {
      navigate(createPageUrl('AdviceGroupDashboard'));
    } else if (loggedInUser?.role === 'adviser') {
      navigate(createPageUrl('AdviserDashboard'));
    }
  };

  const handleBreadcrumbClick = (index) => {
    navigateToLevel(index);
    const level = navigationChain[index];
    // Navigate to appropriate dashboard for that level
    if (level.type === 'advice_group') {
      navigate(createPageUrl('AdviceGroupDashboard'));
    } else if (level.type === 'adviser') {
      navigate(createPageUrl('AdviserDashboard'));
    }
  };

  const getProfileUrl = () => {
    // Profile is always the ORIGINAL user's profile page
    if (loggedInUser?.role === 'admin') {
      return createPageUrl('AdminProfile');
    } else if (loggedInUser?.role === 'advice_group') {
      return createPageUrl('AdviceGroupMyProfile');
    } else if (loggedInUser?.role === 'adviser') {
      return createPageUrl('AdviserProfile');
    }
    return createPageUrl('AdminProfile');
  };

  const getInitials = () => {
    const name = loggedInUser?.display_name || loggedInUser?.full_name || loggedInUser?.email || '';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';
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
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '64px',
      background: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      paddingLeft: (isSOARequestAnyPage || isFactFindAnyPage) ? '320px' : (location.pathname.includes('Client') ? '288px' : '260px'),
      paddingRight: '32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      zIndex: 40,
    }}>
      {/* Left side: Home button (if viewing as) + Breadcrumbs OR Page Title */}
       <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '16px' }}>
         {isViewingAs && (
           <button
             onClick={handleGoHome}
             style={{
               display: 'flex',
               alignItems: 'center',
               gap: '8px',
               padding: '8px 12px',
               background: '#eff6ff',
               border: '1px solid #bfdbfe',
               borderRadius: '8px',
               cursor: 'pointer',
               color: '#3b82f6',
               transition: 'all 0.2s',
             }}
             onMouseEnter={(e) => {
               e.currentTarget.style.background = '#dbeafe';
               e.currentTarget.style.borderColor = '#93c5fd';
             }}
             onMouseLeave={(e) => {
               e.currentTarget.style.background = '#eff6ff';
               e.currentTarget.style.borderColor = '#bfdbfe';
             }}
             title="Return to my dashboard"
           >
             <Home size={18} />
           </button>
         )}
         {pageTitle && !isViewingAs && (
           <h1 style={{
             fontFamily: "'Plus Jakarta Sans', sans-serif",
             fontWeight: 700,
             fontSize: '20px',
             color: '#111827',
             margin: 0
           }}>
             {pageTitle}
           </h1>
         )}
         {isViewingAs && (
           <>
             {/* Breadcrumb trail */}
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
               <span style={{ color: '#64748b' }}>Viewing:</span>
               {navigationChain.map((level, index) => (
                 <React.Fragment key={index}>
                   {index > 0 && <ChevronRight size={14} style={{ color: '#94a3b8' }} />}
                   <button
                     onClick={() => handleBreadcrumbClick(index)}
                     style={{
                       background: index === navigationChain.length - 1 ? '#eff6ff' : 'transparent',
                       border: 'none',
                       padding: '4px 8px',
                       borderRadius: '4px',
                       cursor: 'pointer',
                       color: index === navigationChain.length - 1 ? '#3b82f6' : '#64748b',
                       fontWeight: index === navigationChain.length - 1 ? 600 : 400,
                     }}
                   >
                     {level.name}
                   </button>
                 </React.Fragment>
               ))}
             </div>
           </>
         )}
       </div>

      {/* Right side: Page Actions + Fact Find / SOA Request Buttons + User menu */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {pageActions && <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>{pageActions}</div>}
        {isFactFindPage && (
          <>
            {/* Talk to Assistant */}
            <Link to={createPageUrl('FactFindAssistant') + (factFindId ? `?id=${factFindId}` : '')}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(to right, #14b8a6, #10b981)',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '20px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                e.currentTarget.style.opacity = '0.9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.opacity = '1';
              }}>
                <MessageSquare size={16} />
                <span>Talk to our assistant</span>
                <span style={{
                  background: '#fbbf24',
                  color: '#78350f',
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  marginLeft: '4px'
                }}>LIVE</span>
              </div>
            </Link>

            {/* Refresh Button */}
            <button
              onClick={handleRefreshClick}
              disabled={refreshing}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                background: '#f97316',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
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
            {/* Talk to AI Paraplanner */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'linear-gradient(to right, #14b8a6, #10b981)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
              e.currentTarget.style.opacity = '0.9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.opacity = '1';
            }}>
              <MessageSquare size={16} />
              <span>Talk to AI Paraplanner</span>
              <span style={{
                background: '#fbbf24',
                color: '#78350f',
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '4px',
                marginLeft: '4px'
              }}>NEW</span>
            </div>

            {/* Projected Position Button */}
            <button style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: '#a855f7',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              fontSize: '18px'
            }}
            title="Projected Position"
            >
              📊
            </button>
          </>
        )}

        {loggedInUser && (
          <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '8px 12px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
            }}>
              {loggedInUser.profile_image_url ? (
                <img 
                  src={loggedInUser.profile_image_url} 
                  alt="Profile" 
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    objectFit: 'cover',
                  }} 
                />
              ) : (
                <div style={{
                  width: '32px',
                  height: '32px',
                  background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 700,
                }}>
                  {getInitials()}
                </div>
              )}
              <span style={{ color: '#1e293b' }}>
                {loggedInUser.display_name || loggedInUser.full_name || loggedInUser.email}
              </span>
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


    </div>
  );
}