import { useState, useEffect } from 'react';
import axiosInstance from '@/api/axiosInstance';

const FALLBACK_AVATARS = [
  { id: 'a1', name: 'Sarah', style: 'Professional', initials: 'SA', bg: '#E1F5EE', color: '#0F6E56', embedId: 'sarah_professional_01' },
  { id: 'a2', name: 'James', style: 'Business',     initials: 'JM', bg: '#E6F1FB', color: '#185FA5', embedId: 'james_business_01' },
  { id: 'a3', name: 'Priya', style: 'Friendly',     initials: 'PR', bg: '#FAEEDA', color: '#854F0B', embedId: 'priya_friendly_01' },
  { id: 'a4', name: 'David', style: 'Formal',       initials: 'DK', bg: '#EEEDFE', color: '#3C3489', embedId: 'david_formal_01' },
  { id: 'a5', name: 'Amara', style: 'Warm',         initials: 'AM', bg: '#FBEAF0', color: '#72243E', embedId: 'amara_warm_01' },
  { id: 'a6', name: 'Liam',  style: 'Approachable', initials: 'LT', bg: '#EAF3DE', color: '#27500A', embedId: 'liam_approachable_01' },
];

export default function useLiveAvatars() {
  const [avatars, setAvatars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchAvatars() {
      try {
        const { data } = await axiosInstance.get('/avatar/avatars');
        if (!cancelled) {
          setAvatars(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to fetch avatars:', err);
          setAvatars(FALLBACK_AVATARS);
          setError(err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchAvatars();

    return () => { cancelled = true; };
  }, []);

  return { avatars, loading, error };
}
