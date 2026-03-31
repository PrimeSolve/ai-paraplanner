import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { loginRedirect, getActiveAccount } from '@/auth/msalInstance';
import { loginRequest } from '@/auth/msalConfig';
import { base44 } from '@/api/base44Client';
import axiosInstance from '@/api/axiosInstance';
import { motion, AnimatePresence } from 'framer-motion';
import NeuralBackground from '../components/NeuralBackground';

const STORAGE_KEY = 'pendingRegistration';

// Validate email format
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Validate ABN (11 digits)
function isValidABN(abn) {
  return /^\d{11}$/.test(abn.replace(/\s/g, ''));
}

const licensees = [
  'Lifespan Financial Planning',
  'AMP Financial Planning',
  'Count Financial',
  'Synchron',
  'WT Financial Group',
  'Centrepoint Alliance',
  'Fitzpatricks Private Wealth',
  'Other',
];

const proofPoints = [
  'SOA drafted in under 24 hours',
  'Lifespan compliance framework built in',
  'Human paraplanner review on every document',
  'No lock-in contracts — start today',
];

// ── Step indicator ──
function StepIndicator({ currentStep }) {
  const steps = ['Account Type', 'Your Details', 'Microsoft Account'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 48 }}>
      {steps.map((label, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === currentStep;
        const isDone   = stepNum < currentStep;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <motion.div
                animate={{
                  background: isActive
                    ? 'linear-gradient(135deg, #00C9B1, #00A693)'
                    : isDone
                    ? 'rgba(0,201,177,0.15)'
                    : 'rgba(255,255,255,0.06)',
                  boxShadow: isActive ? '0 0 16px rgba(0,201,177,0.4)' : 'none',
                }}
                style={{
                  width: 28, height: 28, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 600, flexShrink: 0,
                  fontFamily: "'Syne', sans-serif",
                  color: isActive ? '#060D1A' : isDone ? '#00C9B1' : 'rgba(176,196,222,0.6)',
                  border: isDone ? '1px solid rgba(0,201,177,0.3)' : isActive ? 'none' : '1px solid rgba(255,255,255,0.12)',
                }}
              >
                {isDone ? '✓' : stepNum}
              </motion.div>
              <span style={{
                fontSize: 11, fontWeight: isActive ? 500 : 400,
                color: isActive ? '#F0F4FF' : 'rgba(176,196,222,0.5)',
              }}>
                {label}
              </span>
            </div>
            {i < 2 && (
              <div style={{
                flex: 1, height: 1, margin: '0 8px',
                background: 'rgba(255,255,255,0.08)',
                position: 'relative', overflow: 'hidden',
              }}>
                <motion.div
                  animate={{ width: currentStep > stepNum ? '100%' : '0%' }}
                  transition={{ duration: 0.6, ease: 'easeInOut' }}
                  style={{
                    position: 'absolute', top: 0, left: 0, bottom: 0,
                    background: '#00C9B1',
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Account type card ──
function AccountTypeCard({ icon, title, sub, selected, onClick }) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -2, borderColor: 'rgba(0,201,177,0.25)' }}
      style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '22px 24px', borderRadius: 16, cursor: 'pointer',
        border: selected
          ? '1px solid rgba(0,201,177,0.5)'
          : '1px solid rgba(255,255,255,0.08)',
        background: selected
          ? 'rgba(0,201,177,0.06)'
          : 'rgba(255,255,255,0.03)',
        transition: 'border-color 0.3s, background 0.3s',
        boxShadow: selected ? '0 0 30px rgba(0,201,177,0.08)' : 'none',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {selected && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 16,
          background: 'linear-gradient(135deg, rgba(0,201,177,0.06) 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />
      )}
      <motion.div
        animate={{ background: selected ? 'rgba(0,201,177,0.18)' : 'rgba(0,201,177,0.1)' }}
        style={{
          width: 48, height: 48, borderRadius: 14, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20,
          border: selected ? '1px solid rgba(0,201,177,0.4)' : '1px solid rgba(0,201,177,0.2)',
        }}
      >
        {icon}
      </motion.div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 3 }}>{title}</div>
        <div style={{ fontSize: 12, color: 'rgba(176,196,222,0.6)', fontWeight: 300 }}>{sub}</div>
      </div>
      <motion.div
        animate={{ borderColor: selected ? '#00C9B1' : 'rgba(176,196,222,0.4)' }}
        style={{
          width: 18, height: 18, flexShrink: 0, marginRight: 4,
          borderRight: '1.5px solid rgba(176,196,222,0.4)',
          borderBottom: '1.5px solid rgba(176,196,222,0.4)',
          transform: 'rotate(-45deg)',
        }}
      />
    </motion.div>
  );
}

// ── Input field ──
function InputField({ label, type = 'text', placeholder, value, onChange }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{
        fontSize: 12, fontWeight: 500,
        color: 'rgba(176,196,222,0.8)', letterSpacing: '0.3px',
      }}>
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%',
          background: focused ? 'rgba(0,201,177,0.04)' : 'rgba(255,255,255,0.04)',
          border: focused
            ? '1px solid rgba(0,201,177,0.4)'
            : '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12, padding: '13px 16px',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 14, color: '#F0F4FF', outline: 'none',
          transition: 'all 0.25s',
          boxShadow: focused ? '0 0 0 3px rgba(0,201,177,0.08)' : 'none',
        }}
      />
    </div>
  );
}

// ── Microsoft logo (CSS only) ──
function MicrosoftLogo() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, width: 20, height: 20, flexShrink: 0 }}>
      {[['#F25022','#7FBA00'],['#00A4EF','#FFB900']].map((row, i) =>
        row.map((color, j) => (
          <div key={`${i}-${j}`} style={{ background: color, borderRadius: 1 }} />
        ))
      )}
    </div>
  );
}

// ── Main Register component ──
export default function Register() {
  const navigate = useNavigate();
  const { accounts } = useMsal();
  const isMsalAuthenticated = useIsAuthenticated();

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedType, setSelectedType] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '',
    practiceName: '', phone: '', licensee: '',
  });

  // Registration processing state
  const [isProcessing, setIsProcessing] = useState(false);

  // Check for pending registration on mount (after MSAL redirect)
  useEffect(() => {
    const pending = sessionStorage.getItem(STORAGE_KEY);
    if (pending && isMsalAuthenticated && accounts.length > 0) {
      const regData = JSON.parse(pending);
      completeRegistration(regData, accounts[0]);
    }
  }, [isMsalAuthenticated, accounts]);

  // If user is already authenticated but landed on /register, pre-fill email
  useEffect(() => {
    if (isMsalAuthenticated && accounts.length > 0 && !sessionStorage.getItem(STORAGE_KEY)) {
      const msalEmail = accounts[0]?.username || '';
      if (msalEmail) {
        setFormData((prev) => ({ ...prev, email: msalEmail }));
      }
    }
  }, [isMsalAuthenticated, accounts]);

  // Complete registration after MSAL returns
  async function completeRegistration(regData, msalAccount) {
    setIsProcessing(true);
    setCurrentStep(3);

    try {
      if (regData.accountType === 'adviser') {
        await completeAdviserRegistration(regData, msalAccount);
      } else {
        await completeGroupRegistration(regData, msalAccount);
      }

      sessionStorage.removeItem(STORAGE_KEY);
      toast.success('Registration successful! Welcome to AI Paraplanner.');

      // Redirect to appropriate dashboard
      if (regData.accountType === 'adviser') {
        navigate('/AdviserDashboard', { replace: true });
      } else {
        navigate('/AdviceGroupDashboard', { replace: true });
      }
    } catch (error) {
      console.error('Registration failed:', error);
      const message =
        error.response?.data?.message ||
        error.response?.data?.title ||
        error.message ||
        'Registration failed. Please try again.';
      toast.error(message);
      setIsProcessing(false);
      setCurrentStep(2);
    }
  }

  async function completeAdviserRegistration(regData, msalAccount) {
    let tenantId = regData.matchedGroupId;

    if (!tenantId) {
      try {
        const newTenant = await base44.entities.AdviceGroup.create({
          name: regData.practiceName || regData.licenseeName,
          licensee_name: regData.licenseeName,
          afsl_number: regData.afslNumber,
          subscription_tier: 'Free',
          is_active: true,
        });
        tenantId = newTenant.id;
      } catch (error) {
        console.warn('Tenant creation failed, attempting with direct API:', error.message);
        const response = await axiosInstance.post('/tenants', {
          name: regData.practiceName || regData.licenseeName,
          licenseeName: regData.licenseeName,
          afslNumber: regData.afslNumber,
          subscriptionTier: 'Free',
          isActive: true,
        });
        tenantId = response.data.id;
      }
    }

    try {
      await base44.entities.User.create({
        email: regData.email,
        first_name: regData.firstName,
        last_name: regData.lastName,
        phone: regData.phone,
        role: 2,
        tenant_id: tenantId,
        entra_object_id: msalAccount.localAccountId,
        is_active: true,
      });
    } catch (error) {
      console.warn('User creation via entity failed, trying auth.register:', error.message);
      await base44.auth.register({
        email: regData.email,
        first_name: regData.firstName,
        last_name: regData.lastName,
        phone: regData.phone,
        role: 2,
        tenant_id: tenantId,
        entra_object_id: msalAccount.localAccountId,
        is_active: true,
      });
    }
  }

  async function completeGroupRegistration(regData, msalAccount) {
    let tenantId;
    try {
      const newTenant = await base44.entities.AdviceGroup.create({
        name: regData.groupName,
        licensee_name: regData.licenseeName,
        abn: regData.abn,
        afsl_number: regData.afslNumber,
        subscription_tier: 'Free',
        is_active: true,
      });
      tenantId = newTenant.id;
    } catch (error) {
      console.warn('Tenant creation failed, attempting with direct API:', error.message);
      const response = await axiosInstance.post('/tenants', {
        name: regData.groupName,
        licenseeName: regData.licenseeName,
        abn: regData.abn,
        afslNumber: regData.afslNumber,
        subscriptionTier: 'Free',
        isActive: true,
      });
      tenantId = response.data.id;
    }

    try {
      await base44.entities.User.create({
        email: regData.email,
        first_name: regData.firstName,
        last_name: regData.lastName,
        phone: regData.phone,
        role: 1,
        tenant_id: tenantId,
        entra_object_id: msalAccount.localAccountId,
        is_active: true,
      });
    } catch (error) {
      console.warn('User creation via entity failed, trying auth.register:', error.message);
      await base44.auth.register({
        email: regData.email,
        first_name: regData.firstName,
        last_name: regData.lastName,
        phone: regData.phone,
        role: 1,
        tenant_id: tenantId,
        entra_object_id: msalAccount.localAccountId,
        is_active: true,
      });
    }
  }

  // Handle "Continue with Microsoft" — store form data and trigger MSAL
  async function handleMicrosoftLogin() {
    const regData = selectedType === 'adviser'
      ? {
          accountType: 'adviser',
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          practiceName: formData.practiceName,
          licenseeName: formData.licensee,
        }
      : {
          accountType: 'advice_group',
          groupName: formData.practiceName,
          licenseeName: formData.licensee,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
        };

    // Store in sessionStorage before MSAL redirect
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(regData));

    // If already authenticated, skip MSAL redirect and complete registration
    if (isMsalAuthenticated && accounts.length > 0) {
      await completeRegistration(regData, accounts[0]);
      return;
    }

    try {
      await loginRedirect(window.location.origin + '/Register');
    } catch (error) {
      console.error('MSAL redirect failed:', error);
      toast.error('Failed to redirect to Microsoft login. Please try again.');
    }
  }

  function updateField(field) {
    return (e) => setFormData(prev => ({ ...prev, [field]: e.target.value }));
  }

  function goToStep(n) {
    setCurrentStep(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div style={{ background: '#060D1A', minHeight: '100vh', color: '#F0F4FF', fontFamily: "'DM Sans', sans-serif" }}>
      <NeuralBackground opacity={0.4} />

      <div style={{
        position: 'relative', zIndex: 10,
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        minHeight: '100vh',
      }}>

        {/* ── LEFT PANEL ── */}
        <div style={{
          position: 'relative',
          padding: '60px 64px',
          display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between',
          borderRight: '1px solid rgba(0,201,177,0.1)',
          overflow: 'hidden',
        }}>
          {/* Glow blobs */}
          <div style={{
            position: 'absolute', bottom: -100, left: -100,
            width: 500, height: 500, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,201,177,0.1) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', top: 100, right: -60,
            width: 300, height: 300, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(30,136,229,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          {/* Logo */}
          <motion.a
            href="/"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              textDecoration: 'none', color: '#F0F4FF',
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700, fontSize: 18,
            }}
          >
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'linear-gradient(135deg, #00C9B1, #1E88E5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: '#fff',
            }}>AI</div>
            <span style={{ color: '#00C9B1' }}>AI</span>&nbsp;Paraplanner
          </motion.a>

          {/* Middle content */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 0' }}
          >
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: 'rgba(0,201,177,0.08)',
              border: '1px solid rgba(0,201,177,0.2)',
              borderRadius: 100, padding: '4px 12px',
              fontSize: 10, fontWeight: 500, color: '#00C9B1',
              letterSpacing: '1px', textTransform: 'uppercase',
              marginBottom: 24, width: 'fit-content',
            }}>
              <span style={{
                width: 5, height: 5, borderRadius: '50%',
                background: '#00C9B1', display: 'inline-block',
                animation: 'pulse 2s ease-in-out infinite',
              }} />
              Built for Australian Advisers
            </div>

            <h2 style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 'clamp(32px, 3vw, 46px)',
              fontWeight: 700, letterSpacing: '-1px',
              lineHeight: 1.1, marginBottom: 16,
            }}>
              The future of<br />
              <em style={{
                fontStyle: 'normal',
                background: 'linear-gradient(135deg, #00C9B1, #00E5FF)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>paraplanning</em><br />
              starts here.
            </h2>

            <p style={{
              fontSize: 15, color: 'rgba(176,196,222,0.6)',
              fontWeight: 300, lineHeight: 1.7,
              maxWidth: 380, marginBottom: 48,
            }}>
              Join Australian financial advisers already using AI Paraplanner to deliver faster, smarter, more compliant advice.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {proofPoints.map((point, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: 'rgba(176,196,222,0.8)', fontWeight: 300 }}
                >
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(0,201,177,0.1)',
                    border: '1px solid rgba(0,201,177,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, color: '#00C9B1', fontWeight: 600,
                  }}>✓</div>
                  {point}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            style={{ fontSize: 12, color: 'rgba(176,196,222,0.6)', fontWeight: 300 }}
          >
            By creating an account you agree to our{' '}
            <a href="/terms" style={{ color: '#00C9B1', textDecoration: 'none' }}>Terms of Service</a>
            {' '}and{' '}
            <a href="/privacy" style={{ color: '#00C9B1', textDecoration: 'none' }}>Privacy Policy</a>.
          </motion.div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '60px 64px', position: 'relative',
        }}>
          {/* Already have account */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            style={{
              position: 'absolute', top: 32, right: 64,
              fontSize: 13, color: 'rgba(176,196,222,0.6)', fontWeight: 300,
            }}
          >
            Already have an account?{' '}
            <a href="/login" style={{ color: '#00C9B1', textDecoration: 'none', fontWeight: 500 }}>
              Sign In
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.4 }}
            style={{ width: '100%', maxWidth: 440 }}
          >
            <StepIndicator currentStep={currentStep} />

            <AnimatePresence mode="wait">

              {/* ── STEP 1: Account Type ── */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
                >
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 700, letterSpacing: '-0.8px', marginBottom: 4 }}>
                    Create your account
                  </div>
                  <div style={{ fontSize: 14, color: 'rgba(176,196,222,0.6)', fontWeight: 300, marginBottom: 8 }}>
                    How will you be using AI Paraplanner?
                  </div>

                  <AccountTypeCard
                    icon="💼"
                    title="I'm a Financial Adviser"
                    sub="Register as an individual adviser and connect to your advice group"
                    selected={selectedType === 'adviser'}
                    onClick={() => setSelectedType('adviser')}
                  />
                  <AccountTypeCard
                    icon="🏛"
                    title="I'm an Advice Group"
                    sub="Register your practice and invite your advisers"
                    selected={selectedType === 'group'}
                    onClick={() => setSelectedType('group')}
                  />

                  <motion.button
                    onClick={() => selectedType && goToStep(2)}
                    whileHover={selectedType ? { y: -2, boxShadow: '0 12px 36px rgba(0,201,177,0.4)' } : {}}
                    style={{
                      width: '100%', padding: 15, borderRadius: 12, border: 'none',
                      background: selectedType
                        ? 'linear-gradient(135deg, #00C9B1, #00A693)'
                        : 'rgba(255,255,255,0.06)',
                      color: selectedType ? '#060D1A' : 'rgba(176,196,222,0.4)',
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 15, fontWeight: 600, cursor: selectedType ? 'pointer' : 'not-allowed',
                      transition: 'all 0.25s', marginTop: 4,
                    }}
                  >
                    Continue →
                  </motion.button>
                </motion.div>
              )}

              {/* ── STEP 2: Your Details ── */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
                >
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 700, letterSpacing: '-0.8px', marginBottom: 4 }}>
                    Your details
                  </div>
                  <div style={{ fontSize: 14, color: 'rgba(176,196,222,0.6)', fontWeight: 300, marginBottom: 8 }}>
                    Tell us a bit about yourself.
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <InputField label="First name" placeholder="James" value={formData.firstName} onChange={updateField('firstName')} />
                    <InputField label="Last name" placeholder="Furniss" value={formData.lastName} onChange={updateField('lastName')} />
                  </div>
                  <InputField label="Work email" type="email" placeholder="james@yourpractice.com.au" value={formData.email} onChange={updateField('email')} />
                  <InputField label="Practice name" placeholder="EQ8 Private Wealth" value={formData.practiceName} onChange={updateField('practiceName')} />
                  <InputField label="Phone number" type="tel" placeholder="+61 4xx xxx xxx" value={formData.phone} onChange={updateField('phone')} />

                  {/* Licensee select */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 500, color: 'rgba(176,196,222,0.8)', letterSpacing: '0.3px' }}>
                      Licensee / Dealer group
                    </label>
                    <select
                      value={formData.licensee}
                      onChange={updateField('licensee')}
                      style={{
                        width: '100%', background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 12, padding: '13px 16px',
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 14, color: formData.licensee ? '#F0F4FF' : 'rgba(176,196,222,0.35)',
                        outline: 'none', cursor: 'pointer',
                        WebkitAppearance: 'none',
                      }}
                    >
                      <option value="" disabled>Select your licensee...</option>
                      {licensees.map(l => <option key={l} value={l} style={{ background: '#0D1929', color: '#F0F4FF' }}>{l}</option>)}
                    </select>
                  </div>

                  <motion.button
                    onClick={() => goToStep(3)}
                    whileHover={{ y: -2, boxShadow: '0 12px 36px rgba(0,201,177,0.4)' }}
                    style={{
                      width: '100%', padding: 15, borderRadius: 12, border: 'none',
                      background: 'linear-gradient(135deg, #00C9B1, #00A693)',
                      color: '#060D1A', fontFamily: "'DM Sans', sans-serif",
                      fontSize: 15, fontWeight: 600, cursor: 'pointer',
                      transition: 'all 0.25s', marginTop: 4,
                    }}
                  >
                    Continue →
                  </motion.button>
                  <button
                    onClick={() => goToStep(1)}
                    style={{
                      width: '100%', padding: 13, borderRadius: 12,
                      background: 'transparent',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'rgba(176,196,222,0.6)',
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 14, fontWeight: 400, cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    ← Back
                  </button>
                </motion.div>
              )}

              {/* ── STEP 3: Microsoft ── */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
                >
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 700, letterSpacing: '-0.8px', marginBottom: 4 }}>
                    Connect your account
                  </div>
                  <div style={{ fontSize: 14, color: 'rgba(176,196,222,0.6)', fontWeight: 300, marginBottom: 8 }}>
                    AI Paraplanner uses Microsoft for secure sign-in.
                  </div>

                  {/* Microsoft button — wired to existing loginRedirect */}
                  <motion.button
                    onClick={() => handleMicrosoftLogin()}
                    whileHover={{ borderColor: 'rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.08)', y: -1 }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                      width: '100%', padding: 14, borderRadius: 12,
                      border: '1px solid rgba(255,255,255,0.12)',
                      background: 'rgba(255,255,255,0.04)',
                      color: '#F0F4FF', fontFamily: "'DM Sans', sans-serif",
                      fontSize: 14, fontWeight: 500, cursor: 'pointer',
                      transition: 'all 0.25s',
                    }}
                  >
                    <MicrosoftLogo />
                    Continue with Microsoft
                  </motion.button>

                  <div style={{
                    textAlign: 'center', fontSize: 12,
                    color: 'rgba(176,196,222,0.5)', fontWeight: 300,
                  }}>
                    You'll be redirected to Microsoft to authenticate securely.
                  </div>

                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    fontSize: 11, color: 'rgba(176,196,222,0.4)',
                  }}>
                    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
                    Why Microsoft?
                    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
                  </div>

                  {[
                    { icon: '🔒', text: 'Enterprise-grade security built in' },
                    { icon: '⚡', text: 'Single sign-on across your practice' },
                    { icon: '✓', text: 'Works with your existing Microsoft 365' },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: 'rgba(176,196,222,0.8)', fontWeight: 300 }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                        background: 'rgba(0,201,177,0.1)',
                        border: '1px solid rgba(0,201,177,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, color: '#00C9B1',
                      }}>
                        {item.icon}
                      </div>
                      {item.text}
                    </div>
                  ))}

                  <button
                    onClick={() => goToStep(2)}
                    style={{
                      width: '100%', padding: 13, borderRadius: 12,
                      background: 'transparent',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'rgba(176,196,222,0.6)',
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 14, fontWeight: 400, cursor: 'pointer',
                      transition: 'all 0.2s', marginTop: 4,
                    }}
                  >
                    ← Back
                  </button>
                </motion.div>
              )}

            </AnimatePresence>

            <div style={{
              textAlign: 'center', fontSize: 13,
              color: 'rgba(176,196,222,0.6)', fontWeight: 300, marginTop: 24,
            }}>
              Already have an account?{' '}
              <a href="/login" style={{ color: '#00C9B1', textDecoration: 'none', fontWeight: 500 }}>
                Sign in →
              </a>
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
