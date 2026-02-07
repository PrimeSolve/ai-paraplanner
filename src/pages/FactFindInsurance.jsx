import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import FactFindLayout from '../components/factfind/FactFindLayout';
import FactFindHeader from '../components/factfind/FactFindHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowRight, ArrowLeft, Plus, Trash2 } from 'lucide-react';

// Insurance type configuration
const INSURANCE_TYPE_CONFIG = {
  '1': { sumInsured: ['life'], premium: ['life'], showTaxEnv: true, showIPFields: false },
  '2': { sumInsured: ['life', 'tpd'], premium: ['life', 'tpd'], showTaxEnv: true, showIPFields: false },
  '3': { sumInsured: ['life', 'trauma'], premium: ['life', 'trauma'], showTaxEnv: true, showIPFields: false },
  '4': { sumInsured: ['life', 'tpd', 'trauma'], premium: ['life', 'tpd', 'trauma'], showTaxEnv: true, showIPFields: false },
  '5': { sumInsured: ['tpd'], premium: ['tpd'], showTaxEnv: true, showIPFields: false },
  '6': { sumInsured: ['trauma'], premium: ['trauma'], showTaxEnv: false, showIPFields: false },
  '7': { sumInsured: ['trauma', 'tpd'], premium: ['trauma', 'tpd'], showTaxEnv: false, showIPFields: false },
  '8': { sumInsured: ['ip'], premium: ['ip'], showTaxEnv: true, showIPFields: true },
  '10': { sumInsured: ['life', 'tpd'], premium: ['life', 'tpd'], showTaxEnv: false, showIPFields: false },
  '11': { sumInsured: ['life', 'tpd'], premium: ['life', 'tpd'], showTaxEnv: false, showIPFields: false },
  '12': { sumInsured: ['life', 'trauma'], premium: ['life', 'trauma'], showTaxEnv: false, showIPFields: false },
  '13': { sumInsured: ['ip', 'ip2'], premium: ['ip', 'ip2'], showTaxEnv: false, showIPFields: true }
};

import { useFactFind } from '@/components/factfind/useFactFind';

export default function FactFindInsurance() {
  const navigate = useNavigate();
  const { factFind, loading: ffLoading } = useFactFind();
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  
  const [policies, setPolicies] = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);

  // Get principals for owner/insured dropdowns
  const getPrincipalOptions = useCallback(() => {
    if (!factFind) return [];
    const opts = [];

    const clientName = factFind?.personal?.first_name
      ? `${factFind.personal.first_name} ${factFind.personal.last_name || ''}`.trim()
      : null;
    const partnerName = factFind?.personal?.partner?.first_name
      ? `${factFind.personal.partner.first_name} ${factFind.personal.partner.last_name || ''}`.trim()
      : null;

    if (clientName) opts.push({ label: clientName, value: 'client' });
    if (partnerName) opts.push({ label: partnerName, value: 'partner' });

    return opts;
  }, [factFind]);

  // Get super funds for super fund dropdown
  const getSuperFundOptions = useCallback(() => {
    if (!factFind) return [];
    const opts = [];

    (factFind?.superannuation?.super_accounts || []).forEach((acc, i) => {
      opts.push({ label: acc.super_name || `Super ${i + 1}`, value: `super-${i}` });
    });

    (factFind?.smsf?.funds || []).forEach((smsf, i) => {
      opts.push({ label: smsf.smsf_name || `SMSF ${i + 1}`, value: `smsf-${i}` });
    });

    return opts;
  }, [factFind]);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    if (factFind?.insurance) {
      const insuranceData = factFind.insurance;
      setPolicies(insuranceData.policies || []);
      setActiveIdx(insuranceData.activeIdx || 0);
    }
  }, [factFind]);

  // Save-before-nav listener
  useEffect(() => {
    const handleSaveBeforeNav = async () => {
      if (!factFind?.id) return;

      try {
        await base44.entities.FactFind.update(factFind.id, {
          insurance: { activeIdx, policies }
        });
      } catch (error) {
        console.error('Failed to save insurance before nav:', error);
      }
    };

    window.addEventListener('factfind-save-before-nav', handleSaveBeforeNav);
    return () => window.removeEventListener('factfind-save-before-nav', handleSaveBeforeNav);
  }, [factFind?.id, activeIdx, policies]);



  const addPolicy = () => {
    const newPolicy = {
      pol_name: '',
      pol_type: '',
      pol_tax_env: '',
      pol_super_fund: '',
      pol_owner: '',
      pol_insured: '',
      pol_insurer: '',
      pol_number: '',
      pol_waiting: '',
      pol_benefit_period: '',
      sum_insured_life: '',
      sum_insured_tpd: '',
      sum_insured_trauma: '',
      sum_insured_ip: '',
      sum_insured_ip2: '',
      premium_life: '',
      premium_tpd: '',
      premium_trauma: '',
      premium_ip: '',
      premium_ip2: '',
      pol_freq: '',
      pol_structure: ''
    };
    const newPolicies = [...policies, newPolicy];
    setPolicies(newPolicies);
    setActiveIdx(newPolicies.length - 1);
  };

  const removePolicy = () => {
    if (policies.length === 0) return;
    setPolicies(prev => prev.filter((_, i) => i !== activeIdx));
    if (activeIdx >= policies.length - 1 && activeIdx > 0) {
      setActiveIdx(activeIdx - 1);
    }
  };

  const updatePolicy = (field, value) => {
    setPolicies(prev => {
      const updated = [...prev];
      updated[activeIdx] = { ...updated[activeIdx], [field]: value };
      return updated;
    });
  };

  const currentPolicy = policies[activeIdx] || {};
  const config = INSURANCE_TYPE_CONFIG[currentPolicy.pol_type] || { sumInsured: [], premium: [], showTaxEnv: false, showIPFields: false };

  const handleNext = async () => {
    if (!factFind?.id) {
      toast.error('Unable to save data');
      return;
    }

    setSaving(true);
    try {
      const sectionsCompleted = [...(factFind.sections_completed || [])];
      if (!sectionsCompleted.includes('insurance')) {
        sectionsCompleted.push('insurance');
      }

      await base44.entities.FactFind.update(factFind.id, {
        insurance: { activeIdx, policies },
        sections_completed: sectionsCompleted,
        completion_percentage: Math.round((sectionsCompleted.length / 14) * 100)
      });

      navigate(createPageUrl('FactFindSuperTax') + `?id=${factFind.id}`);
    } catch (error) {
      toast.error('Failed to save data');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate(createPageUrl('FactFindIncomeExpenses') + `?id=${factFind?.id || ''}`);
  };

  if (ffLoading) {
    return (
      <FactFindLayout currentSection="insurance" factFind={factFind}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </FactFindLayout>
    );
  }

  const principalOptions = getPrincipalOptions();
  const superFundOptions = getSuperFundOptions();

  return (
    <FactFindLayout currentSection="insurance" factFind={factFind}>
      <FactFindHeader
        title="Insurance policies"
        description="Add details about your life, TPD, trauma, income protection, and other insurance coverage."
        factFind={factFind}
        user={user}
      />

      <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="w-full space-y-6">
          {policies.length === 0 ? (
            <div className="border border-gray-200 rounded-lg p-12 text-center bg-white">
              <div className="text-5xl mb-4">🛡️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Do you have any insurance policies?
              </h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Add details about your life, TPD, trauma, income protection, and other insurance coverage.
              </p>
              <button onClick={addPolicy} className="inline-flex items-center gap-2 px-6 py-2.5 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium transition-colors">
                <Plus className="w-4 h-4" />
                Add First Policy
              </button>
            </div>
          ) : (
            <>
              {/* PILL NAVIGATION - SEPARATED: Items left, Add/Remove right */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  {policies.map((pol, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveIdx(idx)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        activeIdx === idx
                          ? 'bg-white border-blue-500 text-blue-700 shadow-sm'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {pol.pol_name || `Policy ${idx + 1}`}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={addPolicy} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-dashed border-gray-300 text-gray-500 hover:border-blue-500 hover:text-blue-600 transition-colors">
                    <Plus className="w-4 h-4" />
                    Add Policy
                  </button>
                  {policies.length > 0 && (
                    <button onClick={removePolicy} className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors px-3 py-2">
                      Remove
                    </button>
                  )}
                </div>
              </div>

              {/* POLICY EDITOR */}
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-6 space-y-4">
                  {/* Basic Details */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Policy name</label>
                    <input
                      type="text"
                      value={currentPolicy.pol_name}
                      onChange={(e) => updatePolicy('pol_name', e.target.value)}
                      placeholder="e.g. Life Insurance - XYZ Provider"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Policy type</label>
                    <select
                      value={currentPolicy.pol_type}
                      onChange={(e) => updatePolicy('pol_type', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select policy type…</option>
                      <option value="1">Life (Stand-alone)</option>
                      <option value="2">Life with Linked TPD</option>
                      <option value="3">Life with Linked Trauma</option>
                      <option value="4">Life with Linked TPD/Trauma</option>
                      <option value="5">TPD (Stand-alone)</option>
                      <option value="6">Trauma (Stand alone)</option>
                      <option value="7">Trauma with Linked TPD</option>
                      <option value="8">Income protection (Stand-alone)</option>
                      <option value="10">Life with Super linked TPD</option>
                      <option value="11">Life with Flexi linked TPD</option>
                      <option value="12">Life with flexi linked Trauma</option>
                      <option value="13">Super-Linked IP</option>
                    </select>
                  </div>

                  {/* Tax Environment - Conditional */}
                  {config.showTaxEnv && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Tax environment</label>
                      <select
                        value={currentPolicy.pol_tax_env}
                        onChange={(e) => updatePolicy('pol_tax_env', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select…</option>
                        <option value="super">Superannuation</option>
                        <option value="non-super">Non-superannuation</option>
                      </select>
                    </div>
                  )}

                  {/* Super Fund - Conditional */}
                  {config.showTaxEnv && currentPolicy.pol_tax_env === 'super' && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Superannuation fund</label>
                      <select
                        value={currentPolicy.pol_super_fund}
                        onChange={(e) => updatePolicy('pol_super_fund', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select super fund…</option>
                        {superFundOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Policy owner</label>
                      <select
                        value={currentPolicy.pol_owner}
                        onChange={(e) => updatePolicy('pol_owner', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select…</option>
                        {principalOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Life insured</label>
                      <select
                        value={currentPolicy.pol_insured}
                        onChange={(e) => updatePolicy('pol_insured', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select…</option>
                        {principalOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Insurer</label>
                      <input
                        type="text"
                        value={currentPolicy.pol_insurer}
                        onChange={(e) => updatePolicy('pol_insurer', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Policy number</label>
                      <input
                        type="text"
                        value={currentPolicy.pol_number}
                        onChange={(e) => updatePolicy('pol_number', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* IP-specific fields */}
                  {config.showIPFields && (
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Waiting period</label>
                        <select
                          value={currentPolicy.pol_waiting}
                          onChange={(e) => updatePolicy('pol_waiting', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select…</option>
                          <option value="1">30 days</option>
                          <option value="2">60 days</option>
                          <option value="3">90 days</option>
                          <option value="4">120 days</option>
                          <option value="5">180 days</option>
                          <option value="6">1 year</option>
                          <option value="7">2 years</option>
                          <option value="8">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Benefit period</label>
                        <select
                          value={currentPolicy.pol_benefit_period}
                          onChange={(e) => updatePolicy('pol_benefit_period', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select…</option>
                          <option value="2">180 days</option>
                          <option value="3">1 year</option>
                          <option value="4">2 years</option>
                          <option value="5">3 years</option>
                          <option value="6">5 years</option>
                          <option value="7">to age 60</option>
                          <option value="8">to age 65</option>
                          <option value="9">to age 67</option>
                          <option value="10">to age 70</option>
                        </select>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* SUM INSURED SECTION */}
              {config.sumInsured.length > 0 && (
                <Card className="border-slate-200 shadow-sm">
                  <div className="bg-blue-600 px-6 py-3 rounded-t-lg">
                    <h4 className="font-bold text-white">Sum Insured</h4>
                  </div>
                  <CardContent className="p-6 space-y-4">
                    {config.sumInsured.includes('life') && (
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Sum insured - Life</label>
                        <div className="flex items-center">
                          <span className="text-slate-500 mr-2">$</span>
                          <input
                            type="number"
                            value={currentPolicy.sum_insured_life}
                            onChange={(e) => updatePolicy('sum_insured_life', e.target.value)}
                            step="0.01"
                            min="0"
                            className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    )}

                    {config.sumInsured.includes('tpd') && (
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Sum insured - TPD</label>
                        <div className="flex items-center">
                          <span className="text-slate-500 mr-2">$</span>
                          <input
                            type="number"
                            value={currentPolicy.sum_insured_tpd}
                            onChange={(e) => updatePolicy('sum_insured_tpd', e.target.value)}
                            step="0.01"
                            min="0"
                            className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    )}

                    {config.sumInsured.includes('trauma') && (
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Sum insured - Trauma</label>
                        <div className="flex items-center">
                          <span className="text-slate-500 mr-2">$</span>
                          <input
                            type="number"
                            value={currentPolicy.sum_insured_trauma}
                            onChange={(e) => updatePolicy('sum_insured_trauma', e.target.value)}
                            step="0.01"
                            min="0"
                            className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    )}

                    {config.sumInsured.includes('ip') && (
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Sum insured - Income Protection</label>
                        <div className="flex items-center">
                          <span className="text-slate-500 mr-2">$</span>
                          <input
                            type="number"
                            value={currentPolicy.sum_insured_ip}
                            onChange={(e) => updatePolicy('sum_insured_ip', e.target.value)}
                            step="0.01"
                            min="0"
                            className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    )}

                    {config.sumInsured.includes('ip2') && (
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Sum insured - IP (2nd component)</label>
                        <div className="flex items-center">
                          <span className="text-slate-500 mr-2">$</span>
                          <input
                            type="number"
                            value={currentPolicy.sum_insured_ip2}
                            onChange={(e) => updatePolicy('sum_insured_ip2', e.target.value)}
                            step="0.01"
                            min="0"
                            className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* PREMIUM SECTION */}
              {config.premium.length > 0 && (
                <Card className="border-slate-200 shadow-sm">
                  <div className="bg-green-600 px-6 py-3 rounded-t-lg">
                    <h4 className="font-bold text-white">Premium Details</h4>
                  </div>
                  <CardContent className="p-6 space-y-4">
                    {config.premium.includes('life') && (
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Premium - Life</label>
                        <div className="flex items-center">
                          <span className="text-slate-500 mr-2">$</span>
                          <input
                            type="number"
                            value={currentPolicy.premium_life}
                            onChange={(e) => updatePolicy('premium_life', e.target.value)}
                            step="0.01"
                            min="0"
                            className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    )}

                    {config.premium.includes('tpd') && (
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Premium - TPD</label>
                        <div className="flex items-center">
                          <span className="text-slate-500 mr-2">$</span>
                          <input
                            type="number"
                            value={currentPolicy.premium_tpd}
                            onChange={(e) => updatePolicy('premium_tpd', e.target.value)}
                            step="0.01"
                            min="0"
                            className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    )}

                    {config.premium.includes('trauma') && (
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Premium - Trauma</label>
                        <div className="flex items-center">
                          <span className="text-slate-500 mr-2">$</span>
                          <input
                            type="number"
                            value={currentPolicy.premium_trauma}
                            onChange={(e) => updatePolicy('premium_trauma', e.target.value)}
                            step="0.01"
                            min="0"
                            className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    )}

                    {config.premium.includes('ip') && (
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Premium - Income Protection</label>
                        <div className="flex items-center">
                          <span className="text-slate-500 mr-2">$</span>
                          <input
                            type="number"
                            value={currentPolicy.premium_ip}
                            onChange={(e) => updatePolicy('premium_ip', e.target.value)}
                            step="0.01"
                            min="0"
                            className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    )}

                    {config.premium.includes('ip2') && (
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Premium - IP (2nd component)</label>
                        <div className="flex items-center">
                          <span className="text-slate-500 mr-2">$</span>
                          <input
                            type="number"
                            value={currentPolicy.premium_ip2}
                            onChange={(e) => updatePolicy('premium_ip2', e.target.value)}
                            step="0.01"
                            min="0"
                            className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Premium frequency</label>
                        <select
                          value={currentPolicy.pol_freq}
                          onChange={(e) => updatePolicy('pol_freq', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select…</option>
                          <option value="1">Weekly</option>
                          <option value="2">Fortnightly</option>
                          <option value="3">Monthly</option>
                          <option value="4">Quarterly</option>
                          <option value="5">Half-yearly</option>
                          <option value="6">Annual</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Premium structure</label>
                        <select
                          value={currentPolicy.pol_structure}
                          onChange={(e) => updatePolicy('pol_structure', e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select…</option>
                          <option value="1">Stepped</option>
                          <option value="2">Level</option>
                          <option value="3">Hybrid</option>
                        </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* NAVIGATION */}
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <Button onClick={handleBack} variant="outline" disabled={saving} className="border-slate-300 text-slate-700 hover:bg-slate-50">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>

                <Button onClick={handleNext} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30">
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Save & continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </FactFindLayout>
  );
}