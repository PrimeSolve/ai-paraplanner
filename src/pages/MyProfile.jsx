import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';

export default function MyProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const redirectToProfilePage = async () => {
      try {
        const user = await base44.auth.me();
        
        // Determine which profile page based on user role and entity
        if (user.role === 'admin') {
          navigate(createPageUrl('AdminProfile'));
        } else if (user.role === 'user') {
          // Check which type of user - adviser, advice group, or client
          if (user.adviser_id) {
            navigate(createPageUrl('AdviserProfile'));
          } else if (user.advice_group_id) {
            navigate(createPageUrl('AdviceGroupProfile'));
          } else if (user.client_id) {
            navigate(createPageUrl('ClientProfile'));
          }
        }
      } catch (error) {
        console.error('Failed to redirect:', error);
      } finally {
        setLoading(false);
      }
    };

    redirectToProfilePage();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  return null;
}