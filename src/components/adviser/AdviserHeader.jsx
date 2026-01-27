import React from 'react';
import { base44 } from '@/api/base44Client';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { User, HelpCircle, LogOut, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function AdviserHeader({ user }) {
  if (!user) return null;

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  return (
    <div style={{
      background: 'white',
      padding: '4px 32px',
      borderBottom: '1px solid #e2e8f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
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
              background: 'linear-gradient(135deg, #f97316, #ec4899)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              color: 'white',
              fontSize: '12px'
            }}>
              {getInitials(user.full_name)}
            </div>
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>
              {user.full_name || user.email}
            </span>
            <ChevronDown size={16} style={{ color: '#64748b' }} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem asChild>
            <Link to={createPageUrl('AdviserSettings')} className="flex items-center cursor-pointer">
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