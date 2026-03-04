import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { loginRedirect, getActiveAccount } from '@/auth/msalInstance';
import { loginRequest } from '@/auth/msalConfig';
import { base44 } from '@/api/base44Client';
import axiosInstance from '@/api/axiosInstance';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Briefcase,
  Building2,
  ArrowLeft,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Info,
  User,
  Phone,
  Mail,
  Hash,
  FileText,
} from 'lucide-react';

const STORAGE_KEY = 'pendingRegistration';

// Validate email format
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Validate ABN (11 digits)
function isValidABN(abn) {
  return /^\d{11}$/.test(abn.replace(/\s/g, ''));
}

// Step indicator component
function StepIndicator({ currentStep, totalSteps }) {
  const labels = ['Account Type', 'Your Details', 'Microsoft Account'];
  return (
    <div className="flex items-center justify-center gap-2 mb-10">
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1;
        const isActive = step === currentStep;
        const isCompleted = step < currentStep;
        return (
          <React.Fragment key={step}>
            {i > 0 && (
              <div
                className={`h-[2px] w-10 transition-colors ${
                  isCompleted ? 'bg-blue-500' : 'bg-slate-200'
                }`}
              />
            )}
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-br from-[#1d4ed8] to-[#3b82f6] text-white shadow-lg'
                    : isCompleted
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  step
                )}
              </div>
              <span
                className={`text-sm font-medium hidden sm:inline ${
                  isActive ? 'text-slate-900' : isCompleted ? 'text-blue-600' : 'text-slate-400'
                }`}
              >
                {labels[i]}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function Register() {
  const navigate = useNavigate();
  const { accounts } = useMsal();
  const isMsalAuthenticated = useIsAuthenticated();

  const [step, setStep] = useState(1);
  const [accountType, setAccountType] = useState(null); // 'adviser' or 'advice_group'

  // Adviser form fields
  const [adviserForm, setAdviserForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    afslNumber: '',
    practiceName: '',
    licenseeName: '',
    termsAccepted: false,
  });

  // Advice group form fields
  const [groupForm, setGroupForm] = useState({
    groupName: '',
    licenseeName: '',
    abn: '',
    afslNumber: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    termsAccepted: false,
  });

  // AFSL lookup state
  const [afslLookupState, setAfslLookupState] = useState({
    loading: false,
    found: false,
    notFound: false,
    groupName: '',
    groupId: null,
  });

  // Form validation errors
  const [errors, setErrors] = useState({});

  // Registration processing state
  const [isProcessing, setIsProcessing] = useState(false);

  // Whether user came authenticated (email should be locked)
  const [emailLocked, setEmailLocked] = useState(false);

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
      setAdviserForm((prev) => ({ ...prev, email: msalEmail }));
      setGroupForm((prev) => ({ ...prev, email: msalEmail }));
      if (msalEmail) setEmailLocked(true);
    }
  }, [isMsalAuthenticated, accounts]);

  // AFSL lookup
  const lookupAFSL = useCallback(async (afslNumber) => {
    if (!afslNumber || afslNumber.trim().length < 3) {
      setAfslLookupState({ loading: false, found: false, notFound: false, groupName: '', groupId: null });
      return;
    }

    setAfslLookupState({ loading: true, found: false, notFound: false, groupName: '', groupId: null });

    try {
      // TODO: This endpoint may need to be created on the API side.
      // Expected: GET /api/v1/tenants?afslNumber={value}
      const response = await axiosInstance.get('/tenants', {
        params: { afslNumber: afslNumber.trim() },
      });

      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.items || response.data?.data || [];

      if (data.length > 0) {
        const group = data[0];
        setAfslLookupState({
          loading: false,
          found: true,
          notFound: false,
          groupName: group.name || group.Name || '',
          groupId: group.id || group.Id,
        });
      } else {
        setAfslLookupState({ loading: false, found: false, notFound: true, groupName: '', groupId: null });
      }
    } catch (error) {
      console.warn('AFSL lookup failed:', error.message);
      // If the endpoint doesn't exist yet, treat as not found
      setAfslLookupState({ loading: false, found: false, notFound: true, groupName: '', groupId: null });
    }
  }, []);

  // Validate adviser form
  function validateAdviserForm() {
    const errs = {};
    if (!adviserForm.firstName.trim()) errs.firstName = 'First name is required';
    if (!adviserForm.lastName.trim()) errs.lastName = 'Last name is required';
    if (!adviserForm.email.trim()) errs.email = 'Email is required';
    else if (!isValidEmail(adviserForm.email)) errs.email = 'Invalid email format';
    if (!adviserForm.afslNumber.trim()) errs.afslNumber = 'AFSL number is required';
    if (afslLookupState.notFound && !adviserForm.licenseeName.trim()) {
      errs.licenseeName = 'Licensee name is required when no group match is found';
    }
    if (!adviserForm.termsAccepted) errs.termsAccepted = 'You must accept the terms';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // Validate group form
  function validateGroupForm() {
    const errs = {};
    if (!groupForm.groupName.trim()) errs.groupName = 'Group name is required';
    if (!groupForm.licenseeName.trim()) errs.licenseeName = 'Licensee name is required';
    if (!groupForm.abn.trim()) errs.abn = 'ABN is required';
    else if (!isValidABN(groupForm.abn)) errs.abn = 'ABN must be 11 digits';
    if (!groupForm.firstName.trim()) errs.firstName = 'First name is required';
    if (!groupForm.lastName.trim()) errs.lastName = 'Last name is required';
    if (!groupForm.email.trim()) errs.email = 'Email is required';
    else if (!isValidEmail(groupForm.email)) errs.email = 'Invalid email format';
    if (!groupForm.termsAccepted) errs.termsAccepted = 'You must accept the terms';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // Handle continue from Step 2 — store data and trigger MSAL
  async function handleContinue() {
    if (accountType === 'adviser') {
      if (!validateAdviserForm()) return;
    } else {
      if (!validateGroupForm()) return;
    }

    const formData =
      accountType === 'adviser'
        ? {
            accountType: 'adviser',
            firstName: adviserForm.firstName,
            lastName: adviserForm.lastName,
            email: adviserForm.email,
            phone: adviserForm.phone,
            afslNumber: adviserForm.afslNumber,
            practiceName: adviserForm.practiceName,
            licenseeName: adviserForm.licenseeName,
            matchedGroupId: afslLookupState.found ? afslLookupState.groupId : null,
            matchedGroupName: afslLookupState.found ? afslLookupState.groupName : null,
          }
        : {
            accountType: 'advice_group',
            groupName: groupForm.groupName,
            licenseeName: groupForm.licenseeName,
            abn: groupForm.abn.replace(/\s/g, ''),
            afslNumber: groupForm.afslNumber,
            firstName: groupForm.firstName,
            lastName: groupForm.lastName,
            email: groupForm.email,
            phone: groupForm.phone,
          };

    // Store in sessionStorage before MSAL redirect
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(formData));

    // If already authenticated, skip MSAL redirect and complete registration
    if (isMsalAuthenticated && accounts.length > 0) {
      await completeRegistration(formData, accounts[0]);
      return;
    }

    // Trigger MSAL login redirect
    setStep(3);
    try {
      await loginRedirect(window.location.origin + '/Register');
    } catch (error) {
      console.error('MSAL redirect failed:', error);
      toast.error('Failed to redirect to Microsoft login. Please try again.');
    }
  }

  // Complete registration after MSAL returns
  async function completeRegistration(regData, msalAccount) {
    setIsProcessing(true);
    setStep(3);

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
      // Go back to step 2 so user can retry without losing form data
      setStep(2);
    }
  }

  async function completeAdviserRegistration(regData, msalAccount) {
    let tenantId = regData.matchedGroupId;

    if (!tenantId) {
      // Create new advice group / tenant
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
        // TODO: If this endpoint doesn't exist, the API team needs to create POST /api/v1/tenants
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

    // Create user record
    try {
      await base44.entities.User.create({
        email: regData.email,
        first_name: regData.firstName,
        last_name: regData.lastName,
        phone: regData.phone,
        role: 2, // Adviser
        tenant_id: tenantId,
        entra_object_id: msalAccount.localAccountId,
        is_active: true,
      });
    } catch (error) {
      console.warn('User creation via entity failed, trying auth.register:', error.message);
      // TODO: If POST /api/v1/users doesn't work, the API team may need to adjust this endpoint
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
    // Create the tenant
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
      // TODO: If this endpoint doesn't exist, the API team needs to create POST /api/v1/tenants
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

    // Create the admin user for this group
    try {
      await base44.entities.User.create({
        email: regData.email,
        first_name: regData.firstName,
        last_name: regData.lastName,
        phone: regData.phone,
        role: 1, // AdviceGroupAdmin
        tenant_id: tenantId,
        entra_object_id: msalAccount.localAccountId,
        is_active: true,
      });
    } catch (error) {
      console.warn('User creation via entity failed, trying auth.register:', error.message);
      // TODO: If POST /api/v1/users doesn't work, the API team may need to adjust this endpoint
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

  // Update adviser form field
  function updateAdviserField(field, value) {
    setAdviserForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  // Update group form field
  function updateGroupField(field, value) {
    setGroupForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  // Check if adviser form "Continue" should be enabled
  const isAdviserFormValid =
    adviserForm.firstName.trim() &&
    adviserForm.lastName.trim() &&
    adviserForm.email.trim() &&
    isValidEmail(adviserForm.email) &&
    adviserForm.afslNumber.trim() &&
    adviserForm.termsAccepted &&
    (!afslLookupState.notFound || adviserForm.licenseeName.trim());

  // Check if group form "Continue" should be enabled
  const isGroupFormValid =
    groupForm.groupName.trim() &&
    groupForm.licenseeName.trim() &&
    groupForm.abn.trim() &&
    isValidABN(groupForm.abn) &&
    groupForm.firstName.trim() &&
    groupForm.lastName.trim() &&
    groupForm.email.trim() &&
    isValidEmail(groupForm.email) &&
    groupForm.termsAccepted;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-black/5 py-3">
        <div className="max-w-[1400px] mx-auto px-6 sm:px-12 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 no-underline">
            <div className="w-[42px] h-[42px] bg-gradient-to-br from-[#1d4ed8] to-[#3b82f6] rounded-xl flex items-center justify-center font-bold text-white text-sm shadow-lg">
              AI
            </div>
            <span className="font-semibold text-[22px] text-[#0f172a]">
              AI <span className="text-[#3b82f6]">Paraplanner</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">Already have an account?</span>
            <button
              onClick={() => loginRedirect()}
              className="px-5 py-2.5 rounded-[10px] text-[14px] font-semibold text-[#0f172a] bg-transparent border-2 border-[#e2e8f0] hover:border-[#0f172a] hover:bg-[#0f172a] hover:text-white transition-all cursor-pointer"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pt-[100px] pb-20 px-4 sm:px-6">
        <div className="max-w-[640px] mx-auto">
          <StepIndicator currentStep={step} totalSteps={3} />

          {/* Step 1: Account Type Selection */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="text-center mb-8">
                <h1 className="text-[28px] font-bold text-slate-900 mb-2">Create your account</h1>
                <p className="text-slate-500 text-[16px]">How will you be using AI Paraplanner?</p>
              </div>

              <div className="space-y-4">
                {/* Adviser Option */}
                <button
                  onClick={() => {
                    setAccountType('adviser');
                    setStep(2);
                    setErrors({});
                  }}
                  className={`w-full text-left p-6 rounded-xl border-2 transition-all cursor-pointer bg-white hover:border-blue-400 hover:shadow-lg ${
                    accountType === 'adviser' ? 'border-blue-500 shadow-lg' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#1d4ed8] flex items-center justify-center flex-shrink-0">
                      <Briefcase className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-[18px] font-semibold text-slate-900 mb-1">
                        I'm a Financial Adviser
                      </h3>
                      <p className="text-[14px] text-slate-500 leading-relaxed">
                        Register as an individual adviser and connect to your advice group
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-300 mt-1 flex-shrink-0 ml-auto" />
                  </div>
                </button>

                {/* Advice Group Option */}
                <button
                  onClick={() => {
                    setAccountType('advice_group');
                    setStep(2);
                    setErrors({});
                  }}
                  className={`w-full text-left p-6 rounded-xl border-2 transition-all cursor-pointer bg-white hover:border-blue-400 hover:shadow-lg ${
                    accountType === 'advice_group' ? 'border-blue-500 shadow-lg' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#6d28d9] flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-[18px] font-semibold text-slate-900 mb-1">
                        I'm an Advice Group
                      </h3>
                      <p className="text-[14px] text-slate-500 leading-relaxed">
                        Register your practice and invite your advisers
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-300 mt-1 flex-shrink-0 ml-auto" />
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Step 2A: Adviser Registration Form */}
          {step === 2 && accountType === 'adviser' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="text-center mb-8">
                <h1 className="text-[28px] font-bold text-slate-900 mb-2">Adviser Registration</h1>
                <p className="text-slate-500 text-[16px]">Tell us about yourself and your practice</p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
                {/* Personal Details */}
                <div>
                  <h3 className="text-[15px] font-semibold text-slate-700 mb-4 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Personal Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="adv-firstName">First Name *</Label>
                      <Input
                        id="adv-firstName"
                        value={adviserForm.firstName}
                        onChange={(e) => updateAdviserField('firstName', e.target.value)}
                        placeholder="John"
                        className={errors.firstName ? 'border-red-400' : ''}
                      />
                      {errors.firstName && (
                        <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="adv-lastName">Last Name *</Label>
                      <Input
                        id="adv-lastName"
                        value={adviserForm.lastName}
                        onChange={(e) => updateAdviserField('lastName', e.target.value)}
                        placeholder="Smith"
                        className={errors.lastName ? 'border-red-400' : ''}
                      />
                      {errors.lastName && (
                        <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label htmlFor="adv-email">Email *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          id="adv-email"
                          type="email"
                          value={adviserForm.email}
                          onChange={(e) => updateAdviserField('email', e.target.value)}
                          placeholder="john@example.com"
                          disabled={emailLocked}
                          className={`pl-9 ${errors.email ? 'border-red-400' : ''} ${
                            emailLocked ? 'bg-slate-50 text-slate-500' : ''
                          }`}
                        />
                      </div>
                      {errors.email && (
                        <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="adv-phone">Phone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          id="adv-phone"
                          type="tel"
                          value={adviserForm.phone}
                          onChange={(e) => updateAdviserField('phone', e.target.value)}
                          placeholder="0400 000 000"
                          className="pl-9"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-100" />

                {/* Practice Details */}
                <div>
                  <h3 className="text-[15px] font-semibold text-slate-700 mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Practice Details
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="adv-afsl">AFSL Number *</Label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          id="adv-afsl"
                          value={adviserForm.afslNumber}
                          onChange={(e) => {
                            updateAdviserField('afslNumber', e.target.value);
                            // Reset lookup state when typing
                            setAfslLookupState({
                              loading: false,
                              found: false,
                              notFound: false,
                              groupName: '',
                              groupId: null,
                            });
                          }}
                          onBlur={() => lookupAFSL(adviserForm.afslNumber)}
                          placeholder="e.g. 123456"
                          className={`pl-9 ${errors.afslNumber ? 'border-red-400' : ''}`}
                        />
                        {afslLookupState.loading && (
                          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
                        )}
                      </div>
                      {errors.afslNumber && (
                        <p className="text-red-500 text-xs mt-1">{errors.afslNumber}</p>
                      )}

                      {/* AFSL lookup result */}
                      {afslLookupState.found && (
                        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-green-700">
                            Found: <strong>{afslLookupState.groupName}</strong> (AFSL{' '}
                            {adviserForm.afslNumber})
                          </p>
                        </div>
                      )}
                      {afslLookupState.notFound && (
                        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
                          <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-blue-700">
                            No existing group found for this AFSL. We'll create a new group for you.
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="adv-practice">Practice/Company Name</Label>
                      <Input
                        id="adv-practice"
                        value={adviserForm.practiceName}
                        onChange={(e) => updateAdviserField('practiceName', e.target.value)}
                        placeholder="Your practice name (optional)"
                      />
                    </div>

                    {/* Show licensee name field if no AFSL match */}
                    {afslLookupState.notFound && (
                      <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                        <Label htmlFor="adv-licensee">Licensee Name *</Label>
                        <Input
                          id="adv-licensee"
                          value={adviserForm.licenseeName}
                          onChange={(e) => updateAdviserField('licenseeName', e.target.value)}
                          placeholder="Name of the AFSL holder/licensee"
                          className={errors.licenseeName ? 'border-red-400' : ''}
                        />
                        {errors.licenseeName && (
                          <p className="text-red-500 text-xs mt-1">{errors.licenseeName}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-100" />

                {/* Terms */}
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="adv-terms"
                    checked={adviserForm.termsAccepted}
                    onCheckedChange={(checked) => {
                      updateAdviserField('termsAccepted', !!checked);
                    }}
                    className="mt-1"
                  />
                  <label htmlFor="adv-terms" className="text-sm text-slate-600 leading-relaxed cursor-pointer">
                    I agree to the{' '}
                    <a href="#" className="text-blue-600 hover:underline">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="#" className="text-blue-600 hover:underline">
                      Privacy Policy
                    </a>
                  </label>
                </div>
                {errors.termsAccepted && (
                  <p className="text-red-500 text-xs -mt-4">{errors.termsAccepted}</p>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => {
                      setStep(1);
                      setErrors({});
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors rounded-lg hover:bg-slate-50 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                  <button
                    onClick={handleContinue}
                    disabled={!isAdviserFormValid}
                    className="flex items-center gap-2 px-6 py-3 rounded-[10px] text-[15px] font-semibold text-white bg-gradient-to-br from-[#1d4ed8] to-[#3b82f6] hover:-translate-y-0.5 shadow-lg hover:shadow-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg"
                  >
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2B: Advice Group Registration Form */}
          {step === 2 && accountType === 'advice_group' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="text-center mb-8">
                <h1 className="text-[28px] font-bold text-slate-900 mb-2">Advice Group Registration</h1>
                <p className="text-slate-500 text-[16px]">Register your practice on AI Paraplanner</p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
                {/* Group Details */}
                <div>
                  <h3 className="text-[15px] font-semibold text-slate-700 mb-4 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Group Details
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="grp-name">Group/Practice Name *</Label>
                      <Input
                        id="grp-name"
                        value={groupForm.groupName}
                        onChange={(e) => updateGroupField('groupName', e.target.value)}
                        placeholder="Your practice name"
                        className={errors.groupName ? 'border-red-400' : ''}
                      />
                      {errors.groupName && (
                        <p className="text-red-500 text-xs mt-1">{errors.groupName}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="grp-licensee">Licensee Name *</Label>
                      <Input
                        id="grp-licensee"
                        value={groupForm.licenseeName}
                        onChange={(e) => updateGroupField('licenseeName', e.target.value)}
                        placeholder="Name of the AFSL holder/licensee"
                        className={errors.licenseeName ? 'border-red-400' : ''}
                      />
                      {errors.licenseeName && (
                        <p className="text-red-500 text-xs mt-1">{errors.licenseeName}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="grp-abn">ABN *</Label>
                        <div className="relative">
                          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <Input
                            id="grp-abn"
                            value={groupForm.abn}
                            onChange={(e) => updateGroupField('abn', e.target.value)}
                            placeholder="11 digit ABN"
                            className={`pl-9 ${errors.abn ? 'border-red-400' : ''}`}
                          />
                        </div>
                        {errors.abn && (
                          <p className="text-red-500 text-xs mt-1">{errors.abn}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="grp-afsl">AFSL Number</Label>
                        <div className="relative">
                          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <Input
                            id="grp-afsl"
                            value={groupForm.afslNumber}
                            onChange={(e) => updateGroupField('afslNumber', e.target.value)}
                            placeholder="Optional"
                            className="pl-9"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-100" />

                {/* Primary Contact */}
                <div>
                  <h3 className="text-[15px] font-semibold text-slate-700 mb-4 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Primary Contact
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="grp-firstName">First Name *</Label>
                      <Input
                        id="grp-firstName"
                        value={groupForm.firstName}
                        onChange={(e) => updateGroupField('firstName', e.target.value)}
                        placeholder="John"
                        className={errors.firstName ? 'border-red-400' : ''}
                      />
                      {errors.firstName && (
                        <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="grp-lastName">Last Name *</Label>
                      <Input
                        id="grp-lastName"
                        value={groupForm.lastName}
                        onChange={(e) => updateGroupField('lastName', e.target.value)}
                        placeholder="Smith"
                        className={errors.lastName ? 'border-red-400' : ''}
                      />
                      {errors.lastName && (
                        <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label htmlFor="grp-email">Email *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          id="grp-email"
                          type="email"
                          value={groupForm.email}
                          onChange={(e) => updateGroupField('email', e.target.value)}
                          placeholder="john@example.com"
                          disabled={emailLocked}
                          className={`pl-9 ${errors.email ? 'border-red-400' : ''} ${
                            emailLocked ? 'bg-slate-50 text-slate-500' : ''
                          }`}
                        />
                      </div>
                      {errors.email && (
                        <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="grp-phone">Phone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          id="grp-phone"
                          type="tel"
                          value={groupForm.phone}
                          onChange={(e) => updateGroupField('phone', e.target.value)}
                          placeholder="0400 000 000"
                          className="pl-9"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-100" />

                {/* Terms */}
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="grp-terms"
                    checked={groupForm.termsAccepted}
                    onCheckedChange={(checked) => {
                      updateGroupField('termsAccepted', !!checked);
                    }}
                    className="mt-1"
                  />
                  <label htmlFor="grp-terms" className="text-sm text-slate-600 leading-relaxed cursor-pointer">
                    I agree to the{' '}
                    <a href="#" className="text-blue-600 hover:underline">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="#" className="text-blue-600 hover:underline">
                      Privacy Policy
                    </a>
                  </label>
                </div>
                {errors.termsAccepted && (
                  <p className="text-red-500 text-xs -mt-4">{errors.termsAccepted}</p>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => {
                      setStep(1);
                      setErrors({});
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors rounded-lg hover:bg-slate-50 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                  <button
                    onClick={handleContinue}
                    disabled={!isGroupFormValid}
                    className="flex items-center gap-2 px-6 py-3 rounded-[10px] text-[15px] font-semibold text-white bg-gradient-to-br from-[#1d4ed8] to-[#3b82f6] hover:-translate-y-0.5 shadow-lg hover:shadow-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg"
                  >
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Processing / Microsoft Account */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="text-center">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 sm:p-12">
                  <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-6" />
                  <h2 className="text-[22px] font-bold text-slate-900 mb-3">
                    {isProcessing ? 'Setting up your account...' : 'Redirecting to Microsoft...'}
                  </h2>
                  <p className="text-slate-500 text-[15px] max-w-[400px] mx-auto">
                    {isProcessing
                      ? 'We\'re creating your account and setting everything up. This will only take a moment.'
                      : 'You\'ll be redirected to Microsoft to create or sign in to your account. Please wait...'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
