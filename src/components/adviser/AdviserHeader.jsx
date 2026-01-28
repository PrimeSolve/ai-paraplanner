import React from 'react';
import { base44 } from '@/api/base44Client';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { User, HelpCircle, LogOut, ChevronDown, Home } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { useRole } from '@/components/RoleContext';

export default function AdviserHeader({ user }) {
  const navigate = useNavigate();
  const { originalUser, resetToOriginal } = useRole();
  const [adviserName, setAdviserName] = React.useState(null);

  React.useEffect(() => {
    if (user?.email) {
      base44.entities.Adviser.filter({ email: user.email }).then(advisers => {
        if (advisers.length > 0) {
          setAdviserName(`${advisers[0].first_name} ${advisers[0].last_name}`);
        }
      });
    }
  }, [user?.email]);

  // Always display the actual logged-in user - NEVER switch
  if (!user) return null;
  
  const displayName = adviserName || user.full_name || user.email;

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  const handleGoHome = () => {
    resetToOriginal();
    // Navigate to appropriate dashboard based on original user role
    if (originalUser.role === 'admin') {
      navigate(createPageUrl('AdminDashboard'));
    } else {
      // Add other role navigation here when needed
      navigate(createPageUrl('AdviceGroupDashboard'));
    }
  };

  const getProfilePageByRole = () => {
    // Always use the ORIGINAL logged-in user's role, never the impersonated role
    const profileUser = originalUser || user;
    if (!profileUser) return 'MyProfile';
    
    if (profileUser.role === 'admin') {
      return 'MyProfile';
    } else if (profileUser.advice_group_id) {
      return 'AdviceGroupMyProfile';
    } else {
      return 'AdviserSettings';
    }
  };

  return (
    <div style={{
      background: 'white',
      padding: '4px 32px',
      borderBottom: '1px solid #e2e8f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {originalUser && (
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
              transition: 'all 0.2s'
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
        )}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 12px',
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            cursor: 'pointer'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              color: 'white',
              fontSize: '12px'
            }}>
              {getInitials(displayName)}
            </div>
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>
              {displayName}
            </span>
            <ChevronDown size={16} style={{ color: '#64748b' }} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem asChild>
            <Link to={createPageUrl(getProfilePageByRole())} className="flex items-center cursor-pointer">
              <User className="w-4 h-4 mr-3 text-[#64748b]" />
              My Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <HelpCircle className="w-4 h-4 mr-3 text-[#64748b]" />
            Help & Support
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => base44.auth.logout()}>
            <LogOut className="w-4 h-4 mr-3 text-[#64748b]" />
            Log Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}