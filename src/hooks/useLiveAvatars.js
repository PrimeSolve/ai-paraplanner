import { useState, useEffect, useCallback } from 'react';
import { fetchAvatarsByIds } from '@/api/liveAvatarApi';

const AVATAR_IDS = [
  '0930fd59-c8ad-434d-ad53-b391a1768720',
  '65f9e3c9-d48b-4118-b73a-4ae2e3cbb8f0',
  '64b526e4-741c-43b6-a918-4e40f3261c7a',
  '073b60a9-89a8-45aa-8902-c358f64d2852',
  'e9844e6d-847e-4964-a92b-7ecd066f69df',
  '0aae6046-0ab9-44fe-a08d-c5ac3f406d34',
  'ab0765ad-69de-41fb-9f8a-bd01c3c52d6f',
  'b4fc2d60-3b82-4694-b243-93e9d2bb0242',
];

export function useLiveAvatars() {
  const [avatars, setAvatars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAvatarsByIds(AVATAR_IDS);
      setAvatars(data);
    } catch (err) {
      console.error('Failed to load LiveAvatar avatars:', err);
      setError('Unable to load avatars');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { avatars, loading, error, retry: load };
}
