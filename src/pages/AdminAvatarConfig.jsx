import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { ExternalLink, Play, Check } from 'lucide-react';
import axiosInstance from '@/api/axiosInstance';
import { AVATARS } from '@/constants/avatars';
import { toast } from 'sonner';

const ROLE_TABS = [
  { id: 'client_welcome', label: 'Client welcome' },
  { id: 'adviser',        label: 'Adviser' },
  { id: 'advice_group',   label: 'Advice group' },
  { id: 'global_admin',   label: 'Global admin' },
];

const ROLE_TOGGLE_META = {
  client_welcome: { label: 'Client welcome avatar', desc: 'Show an interactive avatar when a client logs in for the first time' },
  adviser:        { label: 'Adviser avatar',         desc: 'Show an interactive avatar on the adviser dashboard' },
  advice_group:   { label: 'Advice group avatar',    desc: 'Show an interactive avatar for advice group administrators' },
  global_admin:   { label: 'Global admin avatar',    desc: 'Show an interactive avatar for global administrators' },
};

const DEFAULT_SCRIPTS = {
  client_welcome: `Hi [Client Name], welcome — it's great to have you here.\n\nMy name is [Adviser Name], and I'm your financial adviser. This is your personal client portal — a secure space where we'll work together on your financial plan, share documents, and track your progress.\n\nBefore we dive in, I'd love to get a clear picture of where you're at. That's what we call the Fact Find — it takes around 15 to 20 minutes.\n\nSo — are you ready to get started on your Fact Find?`,
  adviser:        `Welcome back, [Adviser Name]. Here's your dashboard overview for [Practice Name].\n\nYou have new client activity to review. Shall I walk you through the highlights?`,
  advice_group:   `Hello and welcome to the [Practice Name] advice group portal.\n\nI'm here to help you manage your team and monitor advice quality. What would you like to start with?`,
  global_admin:   `Welcome to the [Practice Name] administration console.\n\nI can help you configure platform settings, manage teams, and review system health. How can I assist you today?`,
};

const ELEVEN_LABS_VOICES = [
  { id: 'v1', name: 'Tim Hall',  desc: 'Your voice',          badge: 'Cloned',  badgeColor: '#16a34a' },
  { id: 'v2', name: 'Andrew',    desc: 'Launch video',         badge: 'Cloned',  badgeColor: '#16a34a' },
  { id: 'v3', name: 'Rachel',    desc: 'ElevenLabs library',   badge: 'Library', badgeColor: '#3b82f6' },
  { id: 'v4', name: 'Callum',    desc: 'ElevenLabs library',   badge: 'Library', badgeColor: '#3b82f6' },
];

const TOKEN_CHIPS = ['Client Name', 'Adviser Name', 'Practice Name'];

const defaultConfigForRole = (role) => ({
  is_enabled: true,
  avatar_id: AVATARS[0]?.id || '',
  voice_id: '',
  voice_provider: 'liveavatar',
  welcome_script: DEFAULT_SCRIPTS[role] || '',
});

// ── Component ──────────────────────────────────────────────────────────────────

export default function AdminAvatarConfig() {
  const [activeRole, setActiveRole] = useState('client_welcome');
  const [voiceTab, setVoiceTab] = useState('liveavatar');
  const [elevenLabsConnected, setElevenLabsConnected] = useState(false);
  const [configByRole, setConfigByRole] = useState({});
  const [savedByRole, setSavedByRole] = useState({});
  const [fetchedRoles, setFetchedRoles] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const scriptRef = useRef(null);

  const currentConfig = configByRole[activeRole] || defaultConfigForRole(activeRole);
  const avatarEnabled = currentConfig.is_enabled;
  const toggleMeta = ROLE_TOGGLE_META[activeRole];
  const currentAvatar = AVATARS.find(a => a.id === currentConfig.avatar_id) || AVATARS[0] || {};

  const updateConfig = (field, value) => {
    setConfigByRole(prev => ({
      ...prev,
      [activeRole]: { ...(prev[activeRole] || defaultConfigForRole(activeRole)), [field]: value },
    }));
  };

  const handleToggle = (checked) => updateConfig('is_enabled', checked);

  const handleAvatarSelect = (avatarId) => {
    const avatar = AVATARS.find(a => a.id === avatarId);
    if (!avatar) return;
    updateConfig('avatar_id', avatarId);
    const saved = savedByRole[activeRole];
    if (saved && saved.voice_id) {
      // User already saved a custom voice for this role — keep it
      updateConfig('voice_id', saved.voice_id);
      updateConfig('voice_provider', saved.voice_provider || 'elevenlabs');
      setVoiceTab(saved.voice_provider || 'elevenlabs');
    } else {
      // No saved custom voice — apply the avatar's default ElevenLabs voice
      updateConfig('voice_id', avatar.defaultVoiceId);
      updateConfig('voice_provider', 'elevenlabs');
      setVoiceTab('elevenlabs');
    }
  };

  const fetchConfig = useCallback(async (role) => {
    try {
      const { data } = await axiosInstance.get(`/avatar/config/${role}`);
      const config = {
        is_enabled: data.isEnabled ?? true,
        avatar_id: data.avatarId || AVATARS[0]?.id || '',
        voice_id: data.voiceId || '',
        voice_provider: data.voiceProvider || 'liveavatar',
        welcome_script: data.welcomeScript ?? DEFAULT_SCRIPTS[role] ?? '',
      };
      setConfigByRole(prev => ({ ...prev, [role]: config }));
      setSavedByRole(prev => ({ ...prev, [role]: config }));
      setVoiceTab(config.voice_provider || 'liveavatar');
    } catch (err) {
      if (err.response?.status === 404) {
        const defaults = defaultConfigForRole(role);
        setConfigByRole(prev => ({ ...prev, [role]: defaults }));
        setSavedByRole(prev => ({ ...prev, [role]: defaults }));
      }
    }
    setFetchedRoles(prev => ({ ...prev, [role]: true }));
    setLoading(false);
  }, []);

  useEffect(() => { fetchConfig('client_welcome'); }, [fetchConfig]);

  useEffect(() => {
    if (!fetchedRoles[activeRole]) {
      fetchConfig(activeRole);
    } else {
      const cfg = configByRole[activeRole];
      if (cfg) setVoiceTab(cfg.voice_provider || 'liveavatar');
    }
  }, [activeRole]);

  const handleVoiceTabChange = (tab) => {
    setVoiceTab(tab);
    updateConfig('voice_provider', tab);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axiosInstance.put(`/avatar/config/${activeRole}`, {
        isEnabled: currentConfig.is_enabled,
        avatarId: currentConfig.avatar_id,
        voiceId: currentConfig.voice_id,
        voiceProvider: currentConfig.voice_provider,
        welcomeScript: currentConfig.welcome_script,
      });
      setSavedByRole(prev => ({ ...prev, [activeRole]: { ...currentConfig } }));
      toast.success('Configuration saved');
    } catch (err) {
      toast.error(`Failed to save configuration: ${err.response?.status || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = async () => {
    setFetchedRoles(prev => ({ ...prev, [activeRole]: false }));
    await fetchConfig(activeRole);
  };

  const insertToken = useCallback((token) => {
    const ta = scriptRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const text = currentConfig.welcome_script;
    const insert = `[${token}]`;
    const updated = text.substring(0, start) + insert + text.substring(end);
    updateConfig('welcome_script', updated);
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = ta.selectionEnd = start + insert.length;
    });
  }, [activeRole, configByRole]);

  return (
    <div className="min-h-screen" style={{ background: '#f8fafc' }}>
      <div style={{ padding: '28px 32px', paddingBottom: '112px' }}>
        {/* Header */}
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Avatar configuration</h1>
        <p className="text-sm text-slate-500 mb-6">Configure the AI Paraplanner avatar experience for each role level</p>

        {/* Role Tabs */}
        <div className="flex bg-slate-100 rounded-full p-1 mb-8">
          {ROLE_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveRole(tab.id)}
              className="flex-1 text-sm font-medium py-2 rounded-full transition-all"
              style={{
                background: activeRole === tab.id ? '#fff' : 'transparent',
                color: activeRole === tab.id ? '#1e293b' : '#64748b',
                boxShadow: activeRole === tab.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Enable Avatar */}
        <SectionLabel>Enable Avatar</SectionLabel>
        <div className="bg-white rounded-xl border border-slate-200 px-5 py-4 mb-8 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-800">{toggleMeta.label}</div>
            <div className="text-xs text-slate-500 mt-0.5">{toggleMeta.desc}</div>
          </div>
          <Switch
            checked={avatarEnabled}
            onCheckedChange={handleToggle}
            className="data-[state=checked]:bg-[#1D9E75]"
          />
        </div>

        {/* Dimmable content */}
        <div style={{ opacity: avatarEnabled ? 1 : 0.35, pointerEvents: avatarEnabled ? 'auto' : 'none', transition: 'opacity 0.2s' }}>

          {/* Choose Avatar + Live Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Choose Avatar */}
            <div>
              <SectionLabel>Choose Avatar</SectionLabel>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-600">Powered by LiveAvatar</span>
                  <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    Connected
                  </span>
                </div>
                <div className="p-4 grid grid-cols-3 gap-3">
                  {AVATARS.map(avatar => {
                    const selected = avatar.id === currentConfig.avatar_id;
                    return (
                      <button
                        key={avatar.id}
                        onClick={() => handleAvatarSelect(avatar.id)}
                        className="flex flex-col items-center p-3 rounded-lg border transition-all relative"
                        style={{
                          borderColor: selected ? '#1D9E75' : '#e2e8f0',
                          borderWidth: selected ? '2px' : '1px',
                          background: '#fff',
                        }}
                      >
                        <span className="text-xs font-medium text-slate-800">{avatar.name}</span>
                        {selected && (
                          <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-[#1D9E75] flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Live Preview */}
            <div>
              <SectionLabel>Live Preview</SectionLabel>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
                <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="text-sm font-semibold text-slate-800">{currentAvatar.name}</div>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    Live preview
                  </span>
                </div>
                <div style={{ background: '#1e293b', aspectRatio: '16/9' }}>
                  {currentAvatar.embedId ? (
                    <iframe
                      src={`https://embed.liveavatar.com/v1/${currentAvatar.embedId}`}
                      allow="microphone"
                      title="LiveAvatar Embed"
                      style={{ width: "100%", height: "100%", border: "none", aspectRatio: "16/9" }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center h-full">
                      <div className="text-white text-sm font-semibold">{currentAvatar.name}</div>
                    </div>
                  )}
                </div>
                <div className="px-5 py-3 border-t border-slate-100">
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Interact with the avatar to preview how it will appear to your clients. Select a different avatar above to update the preview.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Voice Selection */}
          <SectionLabel>Voice Selection</SectionLabel>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-8">
            {/* Voice sub-tabs */}
            <div className="px-5 pt-4 pb-0 flex gap-0 border-b border-slate-100">
              {[{ id: 'liveavatar', label: 'LiveAvatar' }, { id: 'elevenlabs', label: 'ElevenLabs' }].map(t => (
                <button
                  key={t.id}
                  onClick={() => handleVoiceTabChange(t.id)}
                  className="text-sm font-medium pb-3 px-4 transition-all relative"
                  style={{
                    color: voiceTab === t.id ? '#1e293b' : '#94a3b8',
                    borderBottom: voiceTab === t.id ? '2px solid #1e293b' : '2px solid transparent',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="p-5">
              {voiceTab === 'liveavatar' && (
                <div
                  className="border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center py-10 text-center"
                >
                  <span className="text-2xl mb-2">🎙️</span>
                  <div className="text-sm font-medium text-slate-700">LiveAvatar voice library</div>
                  <div className="text-xs text-slate-400 mt-0.5">SDK embed</div>
                </div>
              )}

              {voiceTab === 'elevenlabs' && !elevenLabsConnected && (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <span className="text-3xl mb-3">🔊</span>
                  <div className="text-base font-semibold text-slate-800 mb-1">Connect your ElevenLabs account</div>
                  <p className="text-sm text-slate-500 max-w-sm mb-5">
                    Link your ElevenLabs account to access premium cloned voices and the full voice library.
                  </p>
                  <button
                    onClick={() => setElevenLabsConnected(true)}
                    className="inline-flex items-center gap-2 bg-slate-900 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    Connect ElevenLabs
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {voiceTab === 'elevenlabs' && elevenLabsConnected && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-medium text-slate-500">Connected voices</span>
                    <button
                      onClick={() => setElevenLabsConnected(false)}
                      className="text-xs text-rose-500 hover:text-rose-600 font-medium"
                    >
                      Disconnect
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ELEVEN_LABS_VOICES.map(voice => {
                      const isSelected = currentConfig.voice_id === voice.id;
                      return (
                      <div
                        key={voice.id}
                        onClick={() => { updateConfig('voice_id', voice.id); updateConfig('voice_provider', 'elevenlabs'); }}
                        className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all"
                        style={{
                          borderColor: isSelected ? '#1D9E75' : '#e2e8f0',
                          borderWidth: isSelected ? '2px' : '1px',
                          background: isSelected ? 'rgba(29,158,117,0.05)' : '#fff',
                        }}
                      >
                        <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center text-white flex-shrink-0">
                          <span className="text-sm">🔊</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-800">{voice.name}</span>
                            <span
                              className="text-[10px] font-medium px-1.5 py-0.5 rounded-full text-white"
                              style={{ background: voice.badgeColor }}
                            >
                              {voice.badge}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400">{voice.desc}</div>
                        </div>
                        <button className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-colors flex-shrink-0">
                          <Play className="w-3.5 h-3.5 ml-0.5" />
                        </button>
                      </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Welcome Script */}
          <SectionLabel>Welcome Script</SectionLabel>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-8">
            <div className="px-5 pt-4 pb-3 flex gap-2 flex-wrap">
              {TOKEN_CHIPS.map(token => (
                <button
                  key={token}
                  onClick={() => insertToken(token)}
                  className="text-xs font-medium px-3 py-1.5 rounded-full border border-[#1D9E75] text-[#1D9E75] hover:bg-[#1D9E75]/5 transition-colors"
                >
                  [{token}]
                </button>
              ))}
            </div>
            <div className="px-5 pb-5">
              <textarea
                ref={scriptRef}
                value={currentConfig.welcome_script}
                onChange={e => updateConfig('welcome_script', e.target.value)}
                rows={8}
                className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-700 leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30 focus:border-[#1D9E75]"
              />
              <p className="text-[11px] text-slate-400 mt-2">
                Tip: end your script with a question — the client's "Yes" triggers the fact find to load.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-[220px] right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-end gap-3 z-40">
        <button onClick={handleDiscard} className="text-sm font-medium text-slate-600 px-5 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
          Discard changes
        </button>
        <button onClick={handleSave} disabled={saving} className="text-sm font-medium text-white px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50" style={{ background: '#1D9E75' }}>
          {saving ? 'Saving…' : 'Save configuration'}
        </button>
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
      {children}
    </div>
  );
}
