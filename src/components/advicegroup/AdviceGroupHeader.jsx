import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { User, HelpCircle, LogOut, Home } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useRole } from '@/components/RoleContext';

const colors = {
  core: {
    white: '#ffffff',
    navy: '#1e293b',
    greyLight: '#e2e8f0',
  },
  accent: {
    purple: '#8b5cf6',
    blueDeep: '#1d4ed8',
  }
};

export default function AdviceGroupHeader({ user }) {
  return (
    <div style={{
      background: colors.core.white,
      padding: '4px 32px',
      borderBottom: `1px solid ${colors.core.greyLight}`,
      position: 'sticky',
      top: 0,
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
    }}>
      {user && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '8px 12px',
              background: colors.core.white,
              border: `1px solid ${colors.core.greyLight}`,
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
            }}>
              {user.profile_image_url ? (
                <img src={user.profile_image_url} alt="Profile" style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  objectFit: 'cover',
                }} />
              ) : (
                <div style={{
                  width: '32px',
                  height: '32px',
                  background: `linear-gradient(135deg, ${colors.accent.purple}, ${colors.accent.blueDeep})`,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: colors.core.white,
                  fontSize: '12px',
                  fontWeight: 700,
                }}>
                  {(user.display_name || user.full_name)?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
              )}
              <span style={{ color: colors.core.navy }}>{user.display_name || user.full_name || user.email}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" style={{ width: '224px' }}>
            <DropdownMenuItem asChild>
              <Link to={createPageUrl('AdviceGroupMyProfile')} style={{ cursor: 'pointer' }}>
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