import { useState, useEffect } from 'react';
import axiosInstance from '@/api/axiosInstance';

const FALLBACK_AVATARS = [
  { id: '0930fd59-c8ad-434d-ad53-b391a1768720', name: 'Sarah', style: 'Professional', initials: 'SA', bg: '#E1F5EE', color: '#0F6E56' },
  { id: '65f9e3c9-d48b-4118-b73a-4ae2e3cbb8f0', name: 'James', style: 'Business',     initials: 'JM', bg: '#E6F1FB', color: '#185FA5' },
  { id: '64b526e4-741c-43b6-a918-4e40f3261c7a', name: 'Priya', style: 'Friendly',     initials: 'PR', bg: '#FAEEDA', color: '#854F0B' },
  { id: '073b60a9-89a8-45aa-8902-c358f64d2852', name: 'David', style: 'Formal',       initials: 'DK', bg: '#EEEDFE', color: '#3C3489' },
  { id: 'e9844e6d-847e-4964-a92b-7ecd066f69df', name: 'Amara', style: 'Warm',         initials: 'AM', bg: '#FBEAF0', color: '#72243E' },
  { id: '0aae6046-0ab9-44fe-a08d-c5ac3f406d34', name: 'Liam',  style: 'Approachable', initials: 'LT', bg: '#EAF3DE', color: '#27500A' },
  { id: 'ab0765ad-69de-41fb-9f8a-bd01c3c52d6f', name: 'Avatar 7', style: 'Classic',   initials: 'A7', bg: '#E8EAF6', color: '#283593' },
  { id: 'b4fc2d60-3b82-4694-b243-93e9d2bb0242', name: 'Avatar 8', style: 'Modern',    initials: 'A8', bg: '#FFF3E0', color: '#E65100' },
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
