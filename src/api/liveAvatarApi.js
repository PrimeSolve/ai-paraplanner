import axios from 'axios';

const LIVEAVATAR_API_URL = 'https://api.liveavatar.com/v1';

const liveAvatarClient = axios.create({
  baseURL: LIVEAVATAR_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

liveAvatarClient.interceptors.request.use((config) => {
  const apiKey = import.meta.env.VITE_LIVEAVATAR_API_KEY;
  if (apiKey) {
    config.headers.Authorization = `Bearer ${apiKey}`;
  }
  return config;
});

/**
 * Fetch a single avatar by ID.
 * Response shape: { data: { id, name, preview_url, status, type, default_voice, ... } }
 */
export async function fetchAvatar(avatarId) {
  const response = await liveAvatarClient.get(`/avatars/${avatarId}`);
  return response.data.data ?? response.data;
}

/**
 * Fetch multiple avatars by their IDs concurrently.
 * Deduplicates IDs before fetching.
 */
export async function fetchAvatarsByIds(avatarIds) {
  const uniqueIds = [...new Set(avatarIds)];
  const results = await Promise.all(
    uniqueIds.map((id) => fetchAvatar(id))
  );
  return results;
}
