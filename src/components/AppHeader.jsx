import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
import { User, HelpCircle, LogOut, Home, ChevronRight } from 'lucide-react';

export default function AppHeader() {
  const navigate = useNavigate();
  const { 
    user, 
    originalUser, 
    navigationChain, 
    isViewingAs, 
    navigateToLevel, 
    resetToOriginal 
  } = useRole();

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

  return (
    <div style={{
      background: '#ffffff',
      padding: '8px 32px',
      borderBottom: '1px solid #e2e8f0',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      {/* Left side: Home button + Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {isViewingAs && (
          <>
            <button
              onClick={handleGoHome}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                background: 'transparent',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                cursor: 'pointer',
                color: '#64748b',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.color = '#1e293b';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#64748b';
              }}
              title="Return to my dashboard"
            >
              <Home size={18} />
            </button>

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

      {/* Right side: User menu */}
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
  );
}