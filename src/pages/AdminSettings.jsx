import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import {
  Building2,
  Target,
  Users,
  Bell,
  UserPlus,
  Settings2,
  Upload,
  Briefcase,
  Shield,
  TrendingUp,
  BarChart3,
  User,
  CreditCard,
  HelpCircle,
  LogOut,
  ChevronDown,
  Palette,
  Link2,
  Sun,
  Moon,
  Monitor,
  ChevronRight
} from 'lucide-react';

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('business');
  const [logoPreview, setLogoPreview] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error('Failed to load user:', error);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    // Load logo preview from saved business details
    const saved = localStorage.getItem('businessDetails');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.logo_url) {
        setLogoPreview(parsed.logo_url);
      }
    }
  }, []);

  const [businessDetails, setBusinessDetails] = useState(() => {
    const saved = localStorage.getItem('businessDetails');
    return saved ? JSON.parse(saved) : {
      companyName: 'AI Paraplanner',
      abn: '12 345 678 901',
      businessEmail: 'hello@aiparaplanner.com.au',
      supportEmail: 'support@aiparaplanner.com.au',
      address: 'Level 10, 123 Collins Street\nMelbourne VIC 3000',
      role: 'admin',
      logo_url: null
    };
  });

  const [slaTargets, setSlaTargets] = useState({
    comprehensiveSOA: 24,
    limitedAdvice: 12,
    breachAlert: 48
  });

  const [slaSettings, setSlaSettings] = useState({
    autoEscalate: true,
    includeWeekends: false
  });

  const [teamDefaults, setTeamDefaults] = useState({
    defaultCapacity: 5,
    assignmentMode: 'manual',
    workingDays: 'monday-friday',
    businessHoursStart: '09:00',
    businessHoursEnd: '17:30',
    allowSelfAssign: true
  });

  const [notifications, setNotifications] = useState({
    soaSubmitted: true,
    soaApproved: true,
    slaBreach: true,
    newAdviceGroup: false,
    newAdviser: false,
    supportTicket: true
  });

  const [adviserOnboarding, setAdviserOnboarding] = useState({
    requireAFSL: true,
    requireApproval: true,
    sendWelcomeEmail: true,
    showChecklist: false,
    welcomeMessage: 'Welcome to AI Paraplanner! We\'re excited to have you on board. Complete your profile setup to start submitting SOA requests.'
  });

  const [integrations, setIntegrations] = useState({
    sendgrid: { connected: true, name: 'SendGrid', description: 'Transactional email delivery', color: '#1A82E2' },
    stripe: { connected: true, name: 'Stripe', description: 'Payment processing & billing', color: '#635BFF' },
    entra: { connected: true, name: 'Microsoft Entra ID', description: 'Identity & access management', color: '#00A4EF' },
    claude: { connected: true, name: 'Anthropic Claude', description: 'AI-powered SOA generation', color: '#D4A574' },
    livekit: { connected: false, name: 'LiveKit', description: 'Real-time audio & video', color: '#7C3AED' }
  });

  const [themeSelection, setThemeSelection] = useState(() => {
    return document.documentElement.getAttribute('data-theme') || 'dark';
  });

  const [apiKey, setApiKey] = useState('sk_live_51234567890abcdefghijklmnopqrstuvwxyz');
  const [showApiKey, setShowApiKey] = useState(false);

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        toast.loading('Uploading logo...', { id: 'logo-upload' });
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        setLogoPreview(file_url);
        setBusinessDetails({...businessDetails, logo_url: file_url});
        toast.success('Logo uploaded successfully', { id: 'logo-upload' });
      } catch (error) {
        toast.error('Failed to upload logo', { id: 'logo-upload' });
      }
    }
  };

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark' ||
    (!document.documentElement.getAttribute('data-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const tabs = [
    { id: 'business', label: 'Business Details', icon: Building2 },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'sla', label: 'SLA & Targets', icon: Target },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'adviser', label: 'Adviser Onboarding', icon: UserPlus },
    { id: 'integrations', label: 'Integrations', icon: Link2 }
  ];

  // Inline style objects for theme-aware styling
  const s = {
    page: {
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100%',
      fontFamily: "'DM Sans', sans-serif",
    },
    topbar: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 24px',
      borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0'}`,
      background: isDark ? '#040B15' : '#ffffff',
    },
    breadcrumb: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '13px',
      color: isDark ? 'rgba(176,196,222,0.65)' : '#64748b',
    },
    breadcrumbActive: {
      color: isDark ? '#F0F4FF' : '#0f172a',
      fontWeight: 500,
    },
    badge: {
      fontSize: '10px',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      padding: '2px 8px',
      borderRadius: '6px',
      background: isDark ? 'rgba(0,201,177,0.1)' : 'rgba(0,166,147,0.08)',
      color: '#00A693',
    },
    settingsLayout: {
      display: 'grid',
      gridTemplateColumns: '200px 1fr',
      flex: 1,
      minHeight: 0,
    },
    subnav: {
      padding: '20px 12px',
      background: isDark ? '#040B15' : '#ffffff',
      borderRight: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0'}`,
      overflowY: 'auto',
    },
    subnavTitle: {
      fontSize: '9px',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      color: isDark ? 'rgba(176,196,222,0.45)' : '#94a3b8',
      fontWeight: 600,
      padding: '0 10px',
      marginBottom: '8px',
    },
    subnavItem: (isActive) => ({
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 10px',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: isActive ? 500 : 400,
      cursor: 'pointer',
      transition: 'all 0.15s',
      background: isActive ? 'rgba(0,201,177,0.08)' : 'transparent',
      color: isActive ? '#00A693' : (isDark ? 'rgba(176,196,222,0.65)' : '#64748b'),
      border: 'none',
      width: '100%',
      textAlign: 'left',
    }),
    content: {
      padding: '24px',
      overflowY: 'auto',
      background: isDark ? '#060D1A' : '#f8fafc',
    },
    card: {
      background: isDark ? 'rgba(13,25,41,0.7)' : '#ffffff',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0'}`,
      borderRadius: '14px',
      marginBottom: '16px',
    },
    cardHeader: {
      padding: '18px 22px',
      borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9'}`,
    },
    cardHeaderTitle: {
      fontSize: '14px',
      fontWeight: 600,
      color: isDark ? '#F0F4FF' : '#0f172a',
      margin: 0,
    },
    cardHeaderDesc: {
      fontSize: '12px',
      color: isDark ? 'rgba(176,196,222,0.5)' : '#94a3b8',
      marginTop: '2px',
    },
    cardBody: {
      padding: '22px',
    },
    saveBar: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: '10px',
      padding: '16px 22px',
      borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9'}`,
    },
    label: {
      fontSize: '12px',
      fontWeight: 500,
      color: isDark ? 'rgba(176,196,222,0.75)' : '#475569',
      marginBottom: '6px',
      display: 'block',
    },
    hint: {
      fontSize: '11px',
      color: isDark ? 'rgba(176,196,222,0.4)' : '#94a3b8',
      marginTop: '4px',
    },
    input: {
      background: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0'}`,
      borderRadius: '8px',
      color: isDark ? '#F0F4FF' : '#0f172a',
      fontSize: '13px',
      padding: '8px 12px',
      width: '100%',
      outline: 'none',
      fontFamily: "'DM Sans', sans-serif",
    },
    textarea: {
      background: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0'}`,
      borderRadius: '8px',
      color: isDark ? '#F0F4FF' : '#0f172a',
      fontSize: '13px',
      padding: '8px 12px',
      width: '100%',
      minHeight: '80px',
      resize: 'vertical',
      outline: 'none',
      fontFamily: "'DM Sans', sans-serif",
    },
    cancelBtn: {
      padding: '7px 16px',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: 500,
      cursor: 'pointer',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0'}`,
      background: 'transparent',
      color: isDark ? 'rgba(176,196,222,0.65)' : '#64748b',
      fontFamily: "'DM Sans', sans-serif",
    },
    saveBtn: {
      padding: '7px 20px',
      borderRadius: '8px',
      fontSize: '13px',
      fontWeight: 500,
      cursor: 'pointer',
      border: 'none',
      background: '#00C9B1',
      color: '#ffffff',
      fontFamily: "'DM Sans', sans-serif",
    },
    toggleRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 0',
      borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.03)' : '#f1f5f9'}`,
    },
    toggleLabel: {
      fontSize: '13px',
      fontWeight: 500,
      color: isDark ? '#F0F4FF' : '#0f172a',
    },
    toggleDesc: {
      fontSize: '11px',
      color: isDark ? 'rgba(176,196,222,0.45)' : '#94a3b8',
      marginTop: '2px',
    },
    groupLabel: {
      fontSize: '10px',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      color: isDark ? 'rgba(176,196,222,0.4)' : '#94a3b8',
      paddingTop: '16px',
      paddingBottom: '4px',
    },
  };

  /* ----- Custom Toggle Component ----- */
  const Toggle = ({ checked, onChange }) => (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: '36px',
        height: '20px',
        borderRadius: '10px',
        border: 'none',
        padding: '2px',
        cursor: 'pointer',
        transition: 'background 0.2s',
        background: checked ? '#00C9B1' : (isDark ? 'rgba(255,255,255,0.1)' : '#E0E6F0'),
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
      }}
    >
      <div style={{
        width: '16px',
        height: '16px',
        borderRadius: '50%',
        background: '#ffffff',
        transition: 'transform 0.2s',
        transform: checked ? 'translateX(16px)' : 'translateX(0px)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
      }} />
    </button>
  );

  /* ----- RENDER SECTIONS ----- */

  const renderBusinessDetails = () => (
    <>
      {/* Card 1 — Logo */}
      <div style={s.card}>
        <div style={s.cardHeader}>
          <div style={s.cardHeaderTitle}>Company Logo</div>
        </div>
        <div style={s.cardBody}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: '16px',
              overflow: 'hidden',
              flexShrink: 0,
            }}>
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : 'AI'}
            </div>
            <div>
              <label style={{ cursor: 'pointer' }}>
                <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 500,
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0'}`,
                  color: isDark ? 'rgba(176,196,222,0.65)' : '#64748b',
                  background: 'transparent',
                  cursor: 'pointer',
                }}>
                  <Upload style={{ width: '14px', height: '14px' }} />
                  Upload
                </span>
              </label>
              <div style={s.hint}>PNG or SVG, max 2MB</div>
            </div>
          </div>
        </div>
      </div>

      {/* Card 2 — Company Information */}
      <div style={s.card}>
        <div style={s.cardHeader}>
          <div style={s.cardHeaderTitle}>Company Information</div>
        </div>
        <div style={s.cardBody}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={s.label}>Company Name</label>
              <input
                style={s.input}
                value={businessDetails.companyName}
                onChange={(e) => setBusinessDetails({...businessDetails, companyName: e.target.value})}
              />
            </div>
            <div>
              <label style={s.label}>ABN</label>
              <input
                style={s.input}
                value={businessDetails.abn}
                onChange={(e) => setBusinessDetails({...businessDetails, abn: e.target.value})}
              />
            </div>
            <div>
              <label style={s.label}>Role</label>
              <Select
                value={businessDetails.role}
                onValueChange={(value) => setBusinessDetails({...businessDetails, role: value})}
              >
                <SelectTrigger style={{
                  ...s.input,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  height: '38px',
                  padding: '0 12px',
                }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="advice_group">Advice Group</SelectItem>
                  <SelectItem value="adviser">Adviser</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={s.label}>Business Contact Email</label>
              <input
                type="email"
                style={s.input}
                value={businessDetails.businessEmail}
                onChange={(e) => setBusinessDetails({...businessDetails, businessEmail: e.target.value})}
              />
              <div style={s.hint}>Used for invoicing and business enquiries</div>
            </div>
            <div>
              <label style={s.label}>Support Email</label>
              <input
                type="email"
                style={s.input}
                value={businessDetails.supportEmail}
                onChange={(e) => setBusinessDetails({...businessDetails, supportEmail: e.target.value})}
              />
              <div style={s.hint}>Displayed to advisers for support requests</div>
            </div>
          </div>
          <div>
            <label style={s.label}>Business Address</label>
            <textarea
              style={s.textarea}
              value={businessDetails.address}
              onChange={(e) => setBusinessDetails({...businessDetails, address: e.target.value})}
            />
          </div>
        </div>
        <div style={s.saveBar}>
          <button style={s.cancelBtn}>Cancel</button>
          <button
            style={s.saveBtn}
            onClick={() => {
              localStorage.setItem('businessDetails', JSON.stringify(businessDetails));
              window.dispatchEvent(new Event('businessDetailsUpdated'));
              toast.success('Business details saved successfully');
            }}
          >
            Save changes
          </button>
        </div>
      </div>
    </>
  );

  const renderAppearance = () => {
    const themes = [
      {
        id: 'light',
        label: 'Light',
        preview: (
          <div style={{ display: 'flex', height: '48px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
            <div style={{ width: '30%', background: '#ffffff' }} />
            <div style={{ flex: 1, background: '#f8fafc' }} />
          </div>
        ),
      },
      {
        id: 'dark',
        label: 'Dark',
        preview: (
          <div style={{ display: 'flex', height: '48px', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ width: '30%', background: '#0f172a' }} />
            <div style={{ flex: 1, background: '#060D1A' }} />
          </div>
        ),
      },
      {
        id: 'system',
        label: 'System',
        preview: (
          <div style={{ display: 'flex', height: '48px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
            <div style={{ flex: 1, background: 'linear-gradient(135deg, #f8fafc 50%, #060D1A 50%)' }} />
          </div>
        ),
      },
    ];

    return (
      <div style={s.card}>
        <div style={s.cardHeader}>
          <div style={s.cardHeaderTitle}>Theme</div>
          <div style={s.cardHeaderDesc}>Choose how the interface looks</div>
        </div>
        <div style={s.cardBody}>
          <div style={{ display: 'flex', gap: '16px' }}>
            {themes.map((t) => {
              const selected = themeSelection === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setThemeSelection(t.id)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '10px',
                    border: `1.5px solid ${selected ? 'rgba(0,201,177,0.4)' : (isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0')}`,
                    background: selected ? 'rgba(0,201,177,0.04)' : 'transparent',
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  {t.preview}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '10px' }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      border: `2px solid ${selected ? '#00C9B1' : (isDark ? 'rgba(255,255,255,0.12)' : '#cbd5e1')}`,
                      background: selected ? '#00C9B1' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {selected && (
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ffffff' }} />
                      )}
                    </div>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: 500,
                      color: selected ? (isDark ? '#F0F4FF' : '#0f172a') : (isDark ? 'rgba(176,196,222,0.5)' : '#94a3b8'),
                    }}>
                      {t.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <div style={s.saveBar}>
          <button style={s.cancelBtn} onClick={() => setThemeSelection(document.documentElement.getAttribute('data-theme') || 'dark')}>Cancel</button>
          <button
            style={s.saveBtn}
            onClick={() => {
              if (themeSelection === 'system') {
                document.documentElement.removeAttribute('data-theme');
              } else {
                document.documentElement.setAttribute('data-theme', themeSelection);
              }
              localStorage.setItem('theme', themeSelection);
              toast.success('Theme updated');
            }}
          >
            Save changes
          </button>
        </div>
      </div>
    );
  };

  const renderSLA = () => {
    const slaCards = [
      { key: 'comprehensiveSOA', label: 'Comprehensive SOA', hint: 'Full advice document turnaround' },
      { key: 'limitedAdvice', label: 'Limited Advice', hint: 'Scaled advice turnaround' },
      { key: 'breachAlert', label: 'SLA Breach Alert', hint: 'Alert threshold for overdue items' },
    ];

    return (
      <div style={s.card}>
        <div style={s.cardHeader}>
          <div style={s.cardHeaderTitle}>SLA Targets</div>
          <div style={s.cardHeaderDesc}>Configure target turnaround times</div>
        </div>
        <div style={s.cardBody}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            {slaCards.map((item) => (
              <div
                key={item.key}
                style={{
                  padding: '20px',
                  borderRadius: '10px',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0'}`,
                  background: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc',
                  textAlign: 'center',
                }}
              >
                <div style={{ ...s.label, textAlign: 'center', marginBottom: '12px' }}>{item.label}</div>
                <input
                  type="number"
                  value={slaTargets[item.key]}
                  onChange={(e) => setSlaTargets({ ...slaTargets, [item.key]: parseInt(e.target.value) || 0 })}
                  style={{
                    ...s.input,
                    fontSize: '18px',
                    fontVariantNumeric: 'tabular-nums',
                    textAlign: 'center',
                    fontWeight: 600,
                    width: '80px',
                    margin: '0 auto',
                    display: 'block',
                    padding: '8px',
                  }}
                />
                <div style={{ fontSize: '11px', color: isDark ? 'rgba(176,196,222,0.4)' : '#94a3b8', marginTop: '6px' }}>hours</div>
                <div style={{ ...s.hint, marginTop: '8px' }}>{item.hint}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={s.saveBar}>
          <button style={s.cancelBtn}>Cancel</button>
          <button style={s.saveBtn} onClick={() => toast.success('SLA targets saved')}>Save changes</button>
        </div>
      </div>
    );
  };

  const renderNotifications = () => (
    <div style={s.card}>
      <div style={s.cardHeader}>
        <div style={s.cardHeaderTitle}>Email Notifications</div>
        <div style={s.cardHeaderDesc}>Configure which events trigger email alerts</div>
      </div>
      <div style={s.cardBody}>
        <div style={s.groupLabel}>SOA Events</div>
        <div style={s.toggleRow}>
          <div>
            <div style={s.toggleLabel}>SOA submitted</div>
            <div style={s.toggleDesc}>Notify when a new SOA request is submitted</div>
          </div>
          <Toggle checked={notifications.soaSubmitted} onChange={(v) => setNotifications({...notifications, soaSubmitted: v})} />
        </div>
        <div style={s.toggleRow}>
          <div>
            <div style={s.toggleLabel}>SOA approved</div>
            <div style={s.toggleDesc}>Notify when an SOA is approved by the adviser</div>
          </div>
          <Toggle checked={notifications.soaApproved} onChange={(v) => setNotifications({...notifications, soaApproved: v})} />
        </div>
        <div style={s.toggleRow}>
          <div>
            <div style={s.toggleLabel}>SLA breach</div>
            <div style={s.toggleDesc}>Notify when an SOA exceeds its target turnaround</div>
          </div>
          <Toggle checked={notifications.slaBreach} onChange={(v) => setNotifications({...notifications, slaBreach: v})} />
        </div>

        <div style={s.groupLabel}>Platform Events</div>
        <div style={s.toggleRow}>
          <div>
            <div style={s.toggleLabel}>New advice group registered</div>
            <div style={s.toggleDesc}>Notify when a new advice group signs up</div>
          </div>
          <Toggle checked={notifications.newAdviceGroup} onChange={(v) => setNotifications({...notifications, newAdviceGroup: v})} />
        </div>
        <div style={s.toggleRow}>
          <div>
            <div style={s.toggleLabel}>New adviser registered</div>
            <div style={s.toggleDesc}>Notify when a new adviser signs up</div>
          </div>
          <Toggle checked={notifications.newAdviser} onChange={(v) => setNotifications({...notifications, newAdviser: v})} />
        </div>
        <div style={{ ...s.toggleRow, borderBottom: 'none' }}>
          <div>
            <div style={s.toggleLabel}>Support ticket opened</div>
            <div style={s.toggleDesc}>Notify when a new support ticket is created</div>
          </div>
          <Toggle checked={notifications.supportTicket} onChange={(v) => setNotifications({...notifications, supportTicket: v})} />
        </div>
      </div>
      <div style={s.saveBar}>
        <button style={s.cancelBtn}>Cancel</button>
        <button style={s.saveBtn} onClick={() => toast.success('Notification preferences saved')}>Save changes</button>
      </div>
    </div>
  );

  const renderAdviserOnboarding = () => (
    <div style={s.card}>
      <div style={s.cardHeader}>
        <div style={s.cardHeaderTitle}>Onboarding Settings</div>
        <div style={s.cardHeaderDesc}>Configure how new advisers are onboarded</div>
      </div>
      <div style={s.cardBody}>
        <div style={s.toggleRow}>
          <div>
            <div style={s.toggleLabel}>Require AFSL verification</div>
            <div style={s.toggleDesc}>Advisers must provide valid AFSL details during registration</div>
          </div>
          <Toggle checked={adviserOnboarding.requireAFSL} onChange={(v) => setAdviserOnboarding({...adviserOnboarding, requireAFSL: v})} />
        </div>
        <div style={s.toggleRow}>
          <div>
            <div style={s.toggleLabel}>Require licensee approval</div>
            <div style={s.toggleDesc}>New adviser accounts must be approved before access is granted</div>
          </div>
          <Toggle checked={adviserOnboarding.requireApproval} onChange={(v) => setAdviserOnboarding({...adviserOnboarding, requireApproval: v})} />
        </div>
        <div style={s.toggleRow}>
          <div>
            <div style={s.toggleLabel}>Send welcome email</div>
            <div style={s.toggleDesc}>Automatically send a welcome email when an adviser is approved</div>
          </div>
          <Toggle checked={adviserOnboarding.sendWelcomeEmail} onChange={(v) => setAdviserOnboarding({...adviserOnboarding, sendWelcomeEmail: v})} />
        </div>
        <div style={{ ...s.toggleRow, borderBottom: 'none' }}>
          <div>
            <div style={s.toggleLabel}>Show onboarding checklist</div>
            <div style={s.toggleDesc}>Display a getting-started checklist on first login</div>
          </div>
          <Toggle checked={adviserOnboarding.showChecklist} onChange={(v) => setAdviserOnboarding({...adviserOnboarding, showChecklist: v})} />
        </div>

        <div style={{ marginTop: '20px' }}>
          <label style={s.label}>Welcome Message</label>
          <textarea
            style={s.textarea}
            value={adviserOnboarding.welcomeMessage}
            onChange={(e) => setAdviserOnboarding({...adviserOnboarding, welcomeMessage: e.target.value})}
          />
          <div style={s.hint}>Shown to advisers on their first login</div>
        </div>
      </div>
      <div style={s.saveBar}>
        <button style={s.cancelBtn}>Cancel</button>
        <button style={s.saveBtn} onClick={() => toast.success('Onboarding settings saved')}>Save changes</button>
      </div>
    </div>
  );

  const renderIntegrations = () => (
    <div style={s.card}>
      <div style={s.cardHeader}>
        <div style={s.cardHeaderTitle}>Connected Services</div>
        <div style={s.cardHeaderDesc}>Manage external service integrations</div>
      </div>
      <div style={s.cardBody}>
        {Object.entries(integrations).map(([key, integration], idx, arr) => (
          <div
            key={key}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 0',
              borderBottom: idx < arr.length - 1 ? `1px solid ${isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9'}` : 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: `${integration.color}18`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <div style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '4px',
                  background: integration.color,
                }} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: isDark ? '#F0F4FF' : '#0f172a' }}>
                  {integration.name}
                </div>
                <div style={{ fontSize: '11px', color: isDark ? 'rgba(176,196,222,0.4)' : '#94a3b8' }}>
                  {integration.description}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {integration.connected ? (
                <>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 500,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: isDark ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.08)',
                    color: '#10b981',
                  }}>
                    Connected
                  </span>
                  <button
                    onClick={() => setIntegrations({...integrations, [key]: {...integration, connected: false}})}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '7px',
                      fontSize: '12px',
                      fontWeight: 500,
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0'}`,
                      background: 'transparent',
                      color: isDark ? 'rgba(176,196,222,0.5)' : '#94a3b8',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                    onMouseEnter={(e) => { e.target.style.borderColor = '#ef4444'; e.target.style.color = '#ef4444'; }}
                    onMouseLeave={(e) => { e.target.style.borderColor = isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0'; e.target.style.color = isDark ? 'rgba(176,196,222,0.5)' : '#94a3b8'; }}
                  >
                    Disconnect
                  </button>
                </>
              ) : (
                <>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 500,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9',
                    color: isDark ? 'rgba(176,196,222,0.4)' : '#94a3b8',
                  }}>
                    Not connected
                  </span>
                  <button
                    onClick={() => setIntegrations({...integrations, [key]: {...integration, connected: true}})}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '7px',
                      fontSize: '12px',
                      fontWeight: 500,
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0'}`,
                      background: 'transparent',
                      color: isDark ? 'rgba(176,196,222,0.5)' : '#94a3b8',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                    onMouseEnter={(e) => { e.target.style.borderColor = '#00C9B1'; e.target.style.color = '#00C9B1'; }}
                    onMouseLeave={(e) => { e.target.style.borderColor = isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0'; e.target.style.color = isDark ? 'rgba(176,196,222,0.5)' : '#94a3b8'; }}
                  >
                    Connect
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const sectionMap = {
    business: renderBusinessDetails,
    appearance: renderAppearance,
    sla: renderSLA,
    notifications: renderNotifications,
    adviser: renderAdviserOnboarding,
    integrations: renderIntegrations,
  };

  return (
    <div style={s.page}>
      {/* SETTINGS LAYOUT */}
      <div style={s.settingsLayout}>
        {/* LEFT SUB-NAV */}
        <div style={s.subnav}>
          <div style={s.subnavTitle}>Settings</div>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={s.subnavItem(isActive)}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc';
                    e.currentTarget.style.color = isDark ? '#F0F4FF' : '#0f172a';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = isDark ? 'rgba(176,196,222,0.65)' : '#64748b';
                  }
                }}
              >
                <Icon style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* SETTINGS CONTENT */}
        <div style={s.content}>
          {sectionMap[activeTab]?.()}
        </div>
      </div>
    </div>
  );
}