import React, { useState } from 'react';
import { Upload, Play, Download, Copy, Trash2, X, RefreshCw } from 'lucide-react';

export default function AdviserAvatarSetup() {
  const [activeTab, setActiveTab] = useState('avatar');
  const [avatarType, setAvatarType] = useState('stock');
  const [selectedAvatar, setSelectedAvatar] = useState('James');
  const [expandedTemplates, setExpandedTemplates] = useState(['factfind']);
  const [showGenerating, setShowGenerating] = useState(false);

  const toggleTemplate = (id) => {
    setExpandedTemplates(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleGenerateVideo = () => {
    setShowGenerating(true);
    setTimeout(() => {
      setActiveTab('library');
      setShowGenerating(false);
    }, 2000);
  };

  const stockAvatars = [
    { id: 'James', emoji: '👨‍💼', traits: 'Authoritative • Trustworthy' },
    { id: 'Mia', emoji: '👩', traits: 'Calm • Approachable' },
    { id: 'Marcus', emoji: '👨‍💻', traits: 'Energetic • Engaging' },
    { id: 'Sarah', emoji: '👩‍💼', traits: 'Modern • Confident' },
    { id: 'Emma', emoji: '👩‍🦰', traits: 'Professional • Warm' },
    { id: 'Richard', emoji: '👴', traits: 'Experienced • Wise' },
    { id: 'Nicole', emoji: '👩‍🦱', traits: 'Warm • Articulate' },
    { id: 'Daniel', emoji: '🧑', traits: 'Friendly • Relaxed' }
  ];

  const assetLibrary = [
    { id: 1, name: 'Fact Find Welcome', type: 'Fact Find', client: 'Sarah Quattrocelli', time: 'Today, 10:32 AM', status: 'ready', duration: '0:45', size: '12.4 MB', emoji: '👨‍💼' },
    { id: 2, name: 'SOA Delivery', type: 'SOA', client: 'John Davidson', time: 'Yesterday, 3:15 PM', status: 'ready', duration: '1:23', size: '28.7 MB', emoji: '👨‍💼' },
    { id: 3, name: 'Fact Find Welcome', type: 'Fact Find', client: 'Emma Mitchell', time: 'Today, 11:45 AM', status: 'processing', duration: 'Generating...', size: '', emoji: '👨‍💼' },
    { id: 4, name: 'Fact Find Welcome', type: 'Fact Find', client: 'Robert Thompson', time: '3 days ago', status: 'ready', duration: '0:52', size: '14.1 MB', emoji: '👨‍💼' },
    { id: 5, name: 'Custom Message', type: 'Custom', client: 'Linda Williams', time: '5 days ago', status: 'failed', duration: 'Generation failed', size: '', emoji: '⚠️' }
  ];

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>Your AI Avatar</h2>
        <p style={{ fontSize: '15px', color: '#64748b' }}>Set up your digital twin and manage video message templates</p>
      </div>

      {/* Video Generating Banner */}
      {showGenerating && (
        <div style={{ background: 'linear-gradient(135deg, #1e40af, #7c3aed)', borderRadius: '12px', padding: '24px', marginBottom: '24px', color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{ width: '48px', height: '48px', background: 'rgba(255,255,255,0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <RefreshCw className="w-6 h-6 animate-spin" />
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>Your Video is Being Prepared</div>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>Fact Find Welcome for Sarah Quattrocelli</div>
            </div>
          </div>
          <div style={{ height: '6px', background: 'rgba(255,255,255,0.2)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: '#fff', borderRadius: '3px', width: '45%', transition: 'width 2s ease' }} />
          </div>
          <div style={{ marginTop: '12px', fontSize: '13px', opacity: 0.8 }}>This typically takes 2-3 minutes. You'll be notified when it's ready.</div>
        </div>
      )}

      {/* Section Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid #e2e8f0' }}>
        {[
          { id: 'avatar', label: 'Avatar Selection' },
          { id: 'messages', label: 'Message Templates' },
          { id: 'library', label: 'Asset Library' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: 500,
              color: activeTab === tab.id ? '#3b82f6' : '#64748b',
              background: 'none',
              border: 'none',
              borderBottom: `2px solid ${activeTab === tab.id ? '#3b82f6' : 'transparent'}`,
              marginBottom: '-1px',
              cursor: 'pointer'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Avatar Selection Section */}
      {activeTab === 'avatar' && (
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>Choose Your Avatar Type</h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Select how you want to appear in client videos</p>
          </div>
          <div style={{ padding: '24px' }}>
            {/* Avatar Choice Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
              <div
                onClick={() => setAvatarType('custom')}
                style={{
                  border: `2px solid ${avatarType === 'custom' ? '#3b82f6' : '#e2e8f0'}`,
                  background: avatarType === 'custom' ? 'rgba(59, 130, 246, 0.05)' : 'white',
                  borderRadius: '16px',
                  padding: '32px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  position: 'relative'
                }}
              >
                {avatarType === 'custom' && (
                  <div style={{ position: 'absolute', top: '16px', right: '16px', width: '24px', height: '24px', background: '#3b82f6', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>✓</div>
                )}
                <div style={{ width: '80px', height: '80px', margin: '0 auto 20px', background: avatarType === 'custom' ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'linear-gradient(135deg, #f1f5f9, #e2e8f0)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Upload className={`w-9 h-9 ${avatarType === 'custom' ? 'text-white' : 'text-slate-500'}`} />
                </div>
                <h4 style={{ fontSize: '18px', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>Custom Avatar</h4>
                <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>Create a digital twin using your own face and voice. Maximum client trust.</p>
                <span style={{ display: 'inline-block', padding: '4px 12px', background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: '#fff', fontSize: '12px', fontWeight: 600, borderRadius: '20px' }}>Included in Pro</span>
              </div>

              <div
                onClick={() => setAvatarType('stock')}
                style={{
                  border: `2px solid ${avatarType === 'stock' ? '#3b82f6' : '#e2e8f0'}`,
                  background: avatarType === 'stock' ? 'rgba(59, 130, 246, 0.05)' : 'white',
                  borderRadius: '16px',
                  padding: '32px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  position: 'relative'
                }}
              >
                {avatarType === 'stock' && (
                  <div style={{ position: 'absolute', top: '16px', right: '16px', width: '24px', height: '24px', background: '#3b82f6', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>✓</div>
                )}
                <div style={{ width: '80px', height: '80px', margin: '0 auto 20px', background: avatarType === 'stock' ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'linear-gradient(135deg, #f1f5f9, #e2e8f0)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg className={`w-9 h-9 ${avatarType === 'stock' ? 'text-white' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                </div>
                <h4 style={{ fontSize: '18px', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>Stock Avatar</h4>
                <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>Choose from 20+ professional avatars. Instant setup, no video required.</p>
                <span style={{ display: 'inline-block', padding: '4px 12px', background: '#fef3c7', color: '#d97706', fontSize: '12px', fontWeight: 600, borderRadius: '20px' }}>Quick Start</span>
              </div>
            </div>

            {/* Stock Avatar Grid */}
            {avatarType === 'stock' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                {stockAvatars.map(avatar => (
                  <div
                    key={avatar.id}
                    onClick={() => setSelectedAvatar(avatar.id)}
                    style={{
                      border: `2px solid ${selectedAvatar === avatar.id ? '#3b82f6' : '#e2e8f0'}`,
                      background: selectedAvatar === avatar.id ? 'rgba(59, 130, 246, 0.05)' : 'white',
                      borderRadius: '16px',
                      padding: '20px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      position: 'relative'
                    }}
                  >
                    {selectedAvatar === avatar.id && (
                      <div style={{ position: 'absolute', top: '12px', right: '12px', width: '20px', height: '20px', background: '#3b82f6', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>✓</div>
                    )}
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>{avatar.emoji}</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}>{avatar.id}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{avatar.traits}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Custom Avatar Upload */}
            {avatarType === 'custom' && (
              <div>
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '16px', marginBottom: '20px', display: 'flex', gap: '12px' }}>
                  <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e40af', marginBottom: '4px' }}>How Custom Avatars Work</div>
                    <div style={{ fontSize: '13px', color: '#1e40af', lineHeight: 1.5 }}>Upload a short video of yourself speaking. Our AI will create a digital twin that can deliver any message in your voice and likeness. Your avatar will be ready within 24-48 hours.</div>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    Video Requirements
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {[
                      '2-5 minutes of continuous speech',
                      'Well-lit, neutral background',
                      'Look directly at camera',
                      'Clear audio, minimal background noise',
                      'MP4 or MOV format',
                      'Maximum 500MB file size'
                    ].map((req, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b' }}>
                        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                        </svg>
                        {req}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ border: '2px dashed #cbd5e1', borderRadius: '16px', padding: '48px', textAlign: 'center' }}>
                  <div style={{ width: '64px', height: '64px', margin: '0 auto 16px', background: '#f1f5f9', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Upload className="w-8 h-8 text-slate-500" />
                  </div>
                  <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>Upload Your Training Video</h4>
                  <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>Drag and drop your video here, or click to browse</p>
                  <button style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                    <Upload className="w-4 h-4" />
                    Select Video File
                  </button>
                </div>
              </div>
            )}
          </div>
          <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
            <span style={{ fontSize: '13px', color: '#64748b' }}>Your selection is saved automatically</span>
            <button style={{ padding: '10px 20px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
              Save Avatar Selection
            </button>
          </div>
        </div>
      )}

      {/* Message Templates Section */}
      {activeTab === 'messages' && (
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>Message Templates</h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Configure templates for automated video generation</p>
          </div>
          <div style={{ padding: '24px' }}>
            {/* Fact Find Welcome Template */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', marginBottom: '16px', overflow: 'hidden' }}>
              <div
                onClick={() => toggleTemplate('factfind')}
                style={{ padding: '16px 20px', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#dbeafe', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/>
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>Fact Find Welcome</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Video created when client starts their Fact Find</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 500, background: '#d1fae5', color: '#059669' }}>Configured</span>
                </div>
              </div>
              {expandedTemplates.includes('factfind') && (
                <div style={{ padding: '20px', borderTop: '1px solid #e2e8f0' }}>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Message Script</label>
                    <textarea
                      style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', minHeight: '120px', fontFamily: 'inherit' }}
                      defaultValue="Hi {{client_first_name}}, welcome to your personal Fact Find!\n\nI'm {{adviser_name}}, and I'll be your financial adviser throughout this process. This Fact Find will help me understand your complete financial picture so I can provide you with tailored advice.\n\nTake your time completing each section. If you have any questions, our AI assistant is here to help, or you can reach out to me directly.\n\nLooking forward to working with you!"
                    />
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Use variables to personalise your message. A new video will be generated for each client.</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button style={{ padding: '10px 20px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                      Reset to Default
                    </button>
                    <button style={{ padding: '10px 20px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                      Save Template
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Asset Library Section */}
      {activeTab === 'library' && (
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>Asset Library</h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>All your generated avatar videos</p>
          </div>
          <div style={{ padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Video</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Type</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Client</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Created</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Status</th>
                  <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assetLibrary.map(asset => (
                  <tr key={asset.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '64px', height: '40px', borderRadius: '6px', background: asset.status === 'failed' ? 'linear-gradient(135deg, #fecaca, #fca5a5)' : 'linear-gradient(135deg, #1e293b, #334155)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', position: 'relative' }}>
                          {asset.emoji}
                          {asset.status === 'ready' && (
                            <div style={{ position: 'absolute', width: '20px', height: '20px', background: 'rgba(255,255,255,0.9)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Play className="w-3 h-3 text-slate-800 ml-0.5" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>{asset.name}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>{asset.duration}{asset.size && ` • ${asset.size}`}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 500, background: asset.type === 'Fact Find' ? '#dbeafe' : asset.type === 'SOA' ? '#d1fae5' : '#ede9fe', color: asset.type === 'Fact Find' ? '#2563eb' : asset.type === 'SOA' ? '#059669' : '#7c3aed' }}>
                        {asset.type}
                      </span>
                    </td>
                    <td style={{ padding: '16px', color: '#1e293b' }}>{asset.client}</td>
                    <td style={{ padding: '16px', color: '#64748b' }}>{asset.time}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 500, background: asset.status === 'ready' ? '#d1fae5' : asset.status === 'processing' ? '#fef3c7' : '#fee2e2', color: asset.status === 'ready' ? '#059669' : asset.status === 'processing' ? '#d97706' : '#dc2626' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }} />
                        {asset.status === 'ready' ? 'Ready' : asset.status === 'processing' ? 'Processing' : 'Failed'}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        {asset.status === 'ready' && (
                          <>
                            <button style={{ width: '32px', height: '32px', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                              <Play className="w-4 h-4 text-slate-500" />
                            </button>
                            <button style={{ width: '32px', height: '32px', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                              <Download className="w-4 h-4 text-slate-500" />
                            </button>
                            <button style={{ width: '32px', height: '32px', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                              <Copy className="w-4 h-4 text-slate-500" />
                            </button>
                          </>
                        )}
                        {asset.status === 'failed' && (
                          <button style={{ width: '32px', height: '32px', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            <RefreshCw className="w-4 h-4 text-slate-500" />
                          </button>
                        )}
                        <button style={{ width: '32px', height: '32px', border: '1px solid #e2e8f0', borderRadius: '6px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                          <Trash2 className="w-4 h-4 text-slate-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
            <span style={{ fontSize: '13px', color: '#64748b' }}>Showing 5 of 12 videos</span>
            <button style={{ padding: '10px 20px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
              Load More
            </button>
          </div>
        </div>
      )}
    </div>
  );
}