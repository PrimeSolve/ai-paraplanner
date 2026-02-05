import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import FactFindLayout from '../components/factfind/FactFindLayout';
import FactFindHeader from '../components/factfind/FactFindHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'super', label: 'Superannuation', icon: '💰' },
  { id: 'tax', label: 'Tax', icon: '📋' }
];

const EMPTY_SUPER = {
  sg_mode: '',
  specify_sg: '',
  tbc_used: '',
  tbc_used_amt: '',
  tbc_current: '',
  ncc_trigger: '',
  ncc_year: '',
  ncc_amount_used: ''
};

const EMPTY_TAX = {
  pre_losses: '',
  pre_cgt_losses: ''
};

export default function FactFindSuperTax() {
  const navigate = useNavigate();
  const { factFind, loading: ffLoading } = useFactFind();
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  
  const [currentTab, setCurrentTab] = useState('super');
  const [activePerson, setActivePerson] = useState('c1');
  const [hasPartner, setHasPartner] = useState(false);

  const [data, setData] = useState({
    client: { super: { ...EMPTY_SUPER }, tax: { ...EMPTY_TAX } },
    partner: { super: { ...EMPTY_SUPER }, tax: { ...EMPTY_TAX } }
  });

  // Get principal names for pill labels
  const principalNames = useMemo(() => {
    const clientName = factFind?.personal?.client?.first_name
      ? `${factFind.personal.client.first_name} ${factFind.personal.client.last_name || ''}`.trim()
      : 'Client';
    const partnerName = factFind?.personal?.partner?.first_name
      ? `${factFind.personal.partner.first_name} ${factFind.personal.partner.last_name || ''}`.trim()
      : 'Partner';

    return { client: clientName, partner: partnerName };
  }, [factFind]);

  // Check if partner exists
  useEffect(() => {
    if (factFind?.personal?.partner?.first_name) {
      setHasPartner(true);
    }
  }, [factFind]);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');

        if (id) {
          const finds = await base44.entities.FactFind.filter({ id });
          if (finds[0]) {
            setFactFind(finds[0]);

            // Load existing supertax data
            if (finds[0].supertax) {
              const st = finds[0].supertax;
              setData({
                client: {
                  super: st.client?.super || { ...EMPTY_SUPER },
                  tax: st.client?.tax || { ...EMPTY_TAX }
                },
                partner: {
                  super: st.partner?.super || { ...EMPTY_SUPER },
                  tax: st.partner?.tax || { ...EMPTY_TAX }
                }
              });
              if (st.currentTab) setCurrentTab(st.currentTab);
              if (st.activePerson) setActivePerson(st.activePerson);
              if (st.hasPartner !== undefined) setHasPartner(st.hasPartner);
            }
          }
        }
      } catch (error) {
        console.error('Error loading fact find:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Get current person key
  const personKey = activePerson === 'c1' ? 'client' : 'partner';
  const currentSuper = data[personKey].super;
  const currentTax = data[personKey].tax;

  // Update super field
  const updateSuper = useCallback((field, value) => {
    setData(prev => ({
      ...prev,
      [personKey]: {
        ...prev[personKey],
        super: { ...prev[personKey].super, [field]: value }
      }
    }));
  }, [personKey]);

  // Update tax field
  const updateTax = useCallback((field, value) => {
    setData(prev => ({
      ...prev,
      [personKey]: {
        ...prev[personKey],
        tax: { ...prev[personKey].tax, [field]: value }
      }
    }));
  }, [personKey]);



  // Navigation
  const handleNext = async () => {
    if (!factFind?.id) {
      toast.error('Unable to save data');
      return;
    }

    setSaving(true);
    try {
      const sectionsCompleted = [...(factFind.sections_completed || [])];
      if (!sectionsCompleted.includes('super_tax')) {
        sectionsCompleted.push('super_tax');
      }

      await base44.entities.FactFind.update(factFind.id, {
        supertax: {
          currentTab,
          activePerson,
          hasPartner,
          client: data.client,
          partner: data.partner
        },
        sections_completed: sectionsCompleted,
        completion_percentage: Math.round((sectionsCompleted.length / 14) * 100)
      });

      navigate(createPageUrl('FactFindAdviceReason') + `?id=${factFind.id}`);
    } catch (error) {
      toast.error('Failed to save data');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate(createPageUrl('FactFindInsurance') + `?id=${factFind?.id || ''}`);
  };

  if (loading) {
    return (
      <FactFindLayout currentSection="super_tax" factFind={factFind}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </FactFindLayout>
    );
  }

  return (
    <FactFindLayout currentSection="super_tax" factFind={factFind}>
      <FactFindHeader
        title="Super & Tax"
        description="Enter superannuation and tax details. Switch between Client and Partner as needed."
        factFind={factFind}
        user={user}
      />

      <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="w-full space-y-6">
           {/* Tabs - Part of form content */}
           <div className="flex gap-2">
             {TABS.map(tab => (
               <button
                 key={tab.id}
                 onClick={() => setCurrentTab(tab.id)}
                 className={`px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${
                   currentTab === tab.id
                     ? 'bg-blue-600 text-white'
                     : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
                 }`}
               >
                 <span>{tab.icon}</span>
                 {tab.label}
               </button>
             ))}
           </div>

           {/* Person Pills */}
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActivePerson('c1')}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-bold transition-all",
                    activePerson === 'c1'
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  {principalNames.client}
                </button>
                {hasPartner && (
                  <button
                    onClick={() => setActivePerson('c2')}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-bold transition-all",
                      activePerson === 'c2'
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    {principalNames.partner}
                  </button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Super Tab */}
          {currentTab === 'super' && (
            <Card className="border-slate-200 shadow-sm">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 rounded-t-lg">
                <h4 className="font-bold text-white">
                  {activePerson === 'c1' ? principalNames.client : principalNames.partner} - Superannuation
                </h4>
              </div>
              <CardContent className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    How much superannuation guarantee do you receive?
                  </label>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`sg_mode_${activePerson}`}
                        value="default"
                        checked={currentSuper.sg_mode === 'default'}
                        onChange={(e) => updateSuper('sg_mode', e.target.value)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm text-slate-700">Use default SG</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`sg_mode_${activePerson}`}
                        value="specify"
                        checked={currentSuper.sg_mode === 'specify'}
                        onChange={(e) => updateSuper('sg_mode', e.target.value)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm text-slate-700">Specify SG</span>
                    </label>
                  </div>
                </div>

                {currentSuper.sg_mode === 'specify' && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Specify SG</label>
                    <div className="flex items-center">
                      <span className="text-slate-500 mr-2">$</span>
                      <input
                        type="number"
                        value={currentSuper.specify_sg}
                        onChange={(e) => updateSuper('specify_sg', e.target.value)}
                        step="0.01"
                        min="0"
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Have you used any amounts against your Transfer Balance Cap?
                  </label>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`tbc_used_${activePerson}`}
                        value="Yes"
                        checked={currentSuper.tbc_used === 'Yes'}
                        onChange={(e) => updateSuper('tbc_used', e.target.value)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm text-slate-700">Yes</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`tbc_used_${activePerson}`}
                        value="No"
                        checked={currentSuper.tbc_used === 'No'}
                        onChange={(e) => updateSuper('tbc_used', e.target.value)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm text-slate-700">No</span>
                    </label>
                  </div>
                </div>

                {currentSuper.tbc_used === 'Yes' && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Transfer balance cap already used
                      </label>
                      <div className="flex items-center">
                        <span className="text-slate-500 mr-2">$</span>
                        <input
                          type="number"
                          value={currentSuper.tbc_used_amt}
                          onChange={(e) => updateSuper('tbc_used_amt', e.target.value)}
                          step="0.01"
                          min="0"
                          className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Current Transfer Balance Cap
                      </label>
                      <input
                        type="text"
                        value={currentSuper.tbc_current}
                        onChange={(e) => updateSuper('tbc_current', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Have you triggered the bring forward trigger for NCC?
                  </label>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`ncc_trigger_${activePerson}`}
                        value="Yes"
                        checked={currentSuper.ncc_trigger === 'Yes'}
                        onChange={(e) => updateSuper('ncc_trigger', e.target.value)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm text-slate-700">Yes</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`ncc_trigger_${activePerson}`}
                        value="No"
                        checked={currentSuper.ncc_trigger === 'No'}
                        onChange={(e) => updateSuper('ncc_trigger', e.target.value)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm text-slate-700">No</span>
                    </label>
                  </div>
                </div>

                {currentSuper.ncc_trigger === 'Yes' && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Year bring forward was triggered?
                      </label>
                      <select
                        value={currentSuper.ncc_year}
                        onChange={(e) => updateSuper('ncc_year', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select year…</option>
                        <option value="2024">2023/2024</option>
                        <option value="2025">2024/2025</option>
                        <option value="2026">2025/2026</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Amount used against bring forward
                      </label>
                      <div className="flex items-center">
                        <span className="text-slate-500 mr-2">$</span>
                        <input
                          type="number"
                          value={currentSuper.ncc_amount_used}
                          onChange={(e) => updateSuper('ncc_amount_used', e.target.value)}
                          step="0.01"
                          min="0"
                          className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tax Tab */}
          {currentTab === 'tax' && (
            <Card className="border-slate-200 shadow-sm">
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-3 rounded-t-lg">
                <h4 className="font-bold text-white">
                  {activePerson === 'c1' ? principalNames.client : principalNames.partner} - Tax
                </h4>
              </div>
              <CardContent className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Pre-existing losses</label>
                  <div className="flex items-center">
                    <span className="text-slate-500 mr-2">$</span>
                    <input
                      type="number"
                      value={currentTax.pre_losses}
                      onChange={(e) => updateTax('pre_losses', e.target.value)}
                      step="0.01"
                      min="0"
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Pre-existing CGT losses</label>
                  <div className="flex items-center">
                    <span className="text-slate-500 mr-2">$</span>
                    <input
                      type="number"
                      value={currentTax.pre_cgt_losses}
                      onChange={(e) => updateTax('pre_cgt_losses', e.target.value)}
                      step="0.01"
                      min="0"
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <Button
                  onClick={handleBack}
                  variant="outline"
                  disabled={saving}
                  className="border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>

                <Button
                  onClick={handleNext}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30"
                >
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