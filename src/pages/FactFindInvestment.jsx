import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import FactFindLayout from '../components/factfind/FactFindLayout';
import FactFindHeader from '../components/factfind/FactFindHeader';
import { useFactFind } from '@/components/factfind/useFactFind';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowRight, ArrowLeft } from 'lucide-react';

export default function FactFindInvestment() {
  const navigate = useNavigate();
  const { factFind, loading: ffLoading } = useFactFind();
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [currentTab, setCurrentTab] = useState('wrap');
  const [activeIndex, setActiveIndex] = useState(0);
  const [wrapCount, setWrapCount] = useState(0);
  const [bondCount, setBondCount] = useState(0);

  const globalStateRef = React.useRef({
    investments: [],
    currentTab: 'wrap',
    activeIdx: { wrap: 0, bonds: 0 }
  });

  const wrapForTab = useCallback((tab) => {
    const id = tab === 'wrap' ? 'wrapWrap' : 'bondsWrap';
    return document.getElementById(id);
  }, []);

  const cloneTemplateDiv = useCallback((id) => {
    const src = document.getElementById(id);
    if (!src) {
      console.error(`Template not found: ${id}`);
      return null;
    }
    const tmp = document.createElement('div');
    tmp.innerHTML = (src.innerHTML || '').trim();
    return tmp.firstElementChild;
  }, []);

  const readTabToArray = useCallback((tab) => {
    const wrap = wrapForTab(tab);
    if (!wrap) return [];

    const cards = [...wrap.querySelectorAll('.entry')];
    return cards.map((card) => {
      const data = {};
      const inputs = card.querySelectorAll('input:not([type="button"]), select, textarea');
      inputs.forEach(input => {
        if (input.type === 'radio') {
          const baseName = input.name.replace(/__\d+$/, '');
          if (input.checked) {
            data[baseName] = input.value;
          }
        } else if (input.type !== 'button') {
          data[input.name] = input.value;
        }
      });
      return data;
    });
  }, [wrapForTab]);

  const renumber = useCallback((tab) => {
    const wrap = wrapForTab(tab);
    if (!wrap) return;

    [...wrap.querySelectorAll('.entry')].forEach((card, i) => {
      const idxSpan = card.querySelector('.idx');
      if (idxSpan) idxSpan.textContent = i + 1;

      if (tab === 'wrap') {
        card.querySelectorAll('input[type="radio"][name^="w_owner_type"]')
          .forEach(r => { r.name = 'w_owner_type__' + (i + 1); });
      } else {
        card.querySelectorAll('input[type="radio"][name^="b_owner_type"]')
          .forEach(r => { r.name = 'b_owner_type__' + (i + 1); });
        card.querySelectorAll('input[type="radio"][name^="b_type"]')
          .forEach(r => { r.name = 'b_type__' + (i + 1); });
      }
    });
  }, [wrapForTab]);

  const updatePills = useCallback((tab, index) => {
    const pillsId = tab === 'wrap' ? 'wrapPills' : 'bondsPills';
    const pillsContainer = document.getElementById(pillsId);
    if (!pillsContainer) return;

    pillsContainer.innerHTML = '';
    const wrap = wrapForTab(tab);
    if (!wrap) return;

    const cards = [...wrap.querySelectorAll('.entry')];
    cards.forEach((card, i) => {
      const pill = document.createElement('button');
      const isActive = i === index;
      pill.type = 'button';

      const nameInput = card.querySelector('input[name="investment_name"], input[name="bond_name"]');
      let displayName = nameInput?.value?.trim();
      if (!displayName) {
        displayName = tab === 'wrap' ? `Wrap ${i + 1}` : `Bond ${i + 1}`;
      }

      pill.className = `px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
        isActive
          ? 'bg-blue-600 text-white shadow-md'
          : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
      }`;
      pill.textContent = displayName;

      pill.onclick = (e) => {
        e.preventDefault();
        setActiveIndex(i);
        showOnlyActiveEntry(tab, i);
      };

      pillsContainer.appendChild(pill);
    });
  }, [wrapForTab]);

  const showOnlyActiveEntry = useCallback((tab, index) => {
    const wrap = wrapForTab(tab);
    if (!wrap) return;

    const cards = [...wrap.querySelectorAll('.entry')];
    cards.forEach((card, i) => {
      card.style.display = i === index ? '' : 'none';
    });
  }, [wrapForTab]);

  const fillCardFromData = useCallback((card, tab, data) => {
    if (!data || !card) return;

    if (tab === 'wrap') {
      const nameInput = card.querySelector('input[name="investment_name"]');
      if (nameInput && data.investment_name) nameInput.value = data.investment_name;

      if (data.w_owner_type) {
        card.querySelectorAll('input[type="radio"][name^="w_owner_type"]').forEach(r => {
          r.checked = r.value === data.w_owner_type;
        });
      }

      const ownerSelect = card.querySelector('select[name="w_owner"]');
      if (ownerSelect) {
        ownerSelect.innerHTML = '<option value="">Select owner…</option>';
        const clientName = factFind?.personal?.client?.first_name
          ? `${factFind.personal.client.first_name} ${factFind.personal.client.last_name}`.trim()
          : null;
        const partnerName = factFind?.personal?.partner?.first_name
          ? `${factFind.personal.partner.first_name} ${factFind.personal.partner.last_name}`.trim()
          : null;

        if (clientName) ownerSelect.innerHTML += `<option value="client">${clientName}</option>`;
        if (partnerName) ownerSelect.innerHTML += `<option value="partner">${partnerName}</option>`;

        // Add trusts
        const trusts = factFind?.trusts_companies?.entities?.filter(e => e.entity_type === 'trust') || [];
        trusts.forEach((trust, i) => {
          ownerSelect.innerHTML += `<option value="trust-${i}">${trust.entity_name || `Trust ${i + 1}`}</option>`;
        });

        // Add companies
        const companies = factFind?.trusts_companies?.entities?.filter(e => e.entity_type === 'company') || [];
        companies.forEach((company, i) => {
          ownerSelect.innerHTML += `<option value="company-${i}">${company.entity_name || `Company ${i + 1}`}</option>`;
        });

        // Add SMSFs
        const smsfFunds = factFind?.smsf?.funds || [];
        smsfFunds.forEach((smsf, i) => {
          ownerSelect.innerHTML += `<option value="smsf-${i}">${smsf.smsf_name || `SMSF ${i + 1}`}</option>`;
        });

        if (data.w_owner) ownerSelect.value = data.w_owner;
      }

      const providerInput = card.querySelector('input[name="w_provider"]');
      if (providerInput && data.w_provider) providerInput.value = data.w_provider;
    }

    if (tab === 'bonds') {
      const nameInput = card.querySelector('input[name="bond_name"]');
      if (nameInput && data.bond_name) nameInput.value = data.bond_name;

      if (data.b_owner_type) {
        card.querySelectorAll('input[type="radio"][name^="b_owner_type"]').forEach(r => {
          r.checked = r.value === data.b_owner_type;
        });
      }

      const ownerSelect = card.querySelector('select[name="b_owner"]');
      if (ownerSelect) {
        ownerSelect.innerHTML = '<option value="">Select owner…</option>';
        const clientName = factFind?.personal?.client?.first_name
          ? `${factFind.personal.client.first_name} ${factFind.personal.client.last_name}`.trim()
          : null;
        const partnerName = factFind?.personal?.partner?.first_name
          ? `${factFind.personal.partner.first_name} ${factFind.personal.partner.last_name}`.trim()
          : null;

        if (clientName) ownerSelect.innerHTML += `<option value="client">${clientName}</option>`;
        if (partnerName) ownerSelect.innerHTML += `<option value="partner">${partnerName}</option>`;

        // Add trusts only (no companies or SMSFs for bonds)
        const trusts = factFind?.trusts_companies?.entities?.filter(e => e.entity_type === 'trust') || [];
        trusts.forEach((trust, i) => {
          ownerSelect.innerHTML += `<option value="trust-${i}">${trust.entity_name || `Trust ${i + 1}`}</option>`;
        });

        if (data.b_owner) ownerSelect.value = data.b_owner;
      }

      if (data.b_type) {
        card.querySelectorAll('input[type="radio"][name^="b_type"]').forEach(r => {
          r.checked = r.value === data.b_type;
        });
      }

      const providerInput = card.querySelector('input[name="b_provider"]');
      if (providerInput && data.b_provider) providerInput.value = data.b_provider;

      const valueInput = card.querySelector('input[name="b_value"]');
      if (valueInput && data.b_value) valueInput.value = data.b_value;

      const contribInput = card.querySelector('input[name="b_contrib"]');
      if (contribInput && data.b_contrib) contribInput.value = data.b_contrib;
    }
  }, [factFind]);

  const addEntry = useCallback((tab, existingData = null) => {
    const wrap = wrapForTab(tab);
    if (!wrap) return;

    const templateId = tab === 'wrap' ? 'wrapTemplate' : 'bondTemplate';
    const node = cloneTemplateDiv(templateId);
    if (!node) return;

    wrap.appendChild(node);

    if (existingData) {
      fillCardFromData(node, tab, existingData);
    }

    renumber(tab);
    const newCount = wrap.querySelectorAll('.entry').length;
    if (tab === 'wrap') {
      setWrapCount(newCount);
    } else {
      setBondCount(newCount);
    }

    const newIndex = newCount - 1;
    setActiveIndex(newIndex);
    updatePills(tab, newIndex);
    showOnlyActiveEntry(tab, newIndex);
  }, [wrapForTab, cloneTemplateDiv, fillCardFromData, renumber, updatePills, showOnlyActiveEntry]);

  const removeEntry = useCallback((node, tab) => {
    node.remove();
    const wrap = wrapForTab(tab);
    const remaining = wrap.querySelectorAll('.entry').length;
    renumber(tab);

    if (tab === 'wrap') {
      setWrapCount(remaining);
    } else {
      setBondCount(remaining);
    }

    if (remaining > 0) {
      const newIndex = Math.max(0, remaining - 1);
      setActiveIndex(newIndex);
      showOnlyActiveEntry(tab, newIndex);
      updatePills(tab, newIndex);
    } else {
      setActiveIndex(0);
    }
  }, [wrapForTab, renumber, showOnlyActiveEntry, updatePills]);

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
    if (factFind?.id && factFind.investment) {
      globalStateRef.current.investments = factFind.investment.investments || [];
      globalStateRef.current.currentTab = factFind.investment.currentTab || 'wrap';
      globalStateRef.current.activeIdx = factFind.investment.activeIdx || { wrap: 0, bonds: 0 };
    }
  }, [factFind?.id]);

  useEffect(() => {
    if (!ffLoading && factFind?.id) {
      setTimeout(() => {
        const wrapWrap = document.getElementById('wrapWrap');
        const bondsWrap = document.getElementById('bondsWrap');

        if (wrapWrap) wrapWrap.innerHTML = '';
        if (bondsWrap) bondsWrap.innerHTML = '';

        const wraps = globalStateRef.current.investments.filter(i => i.investment_type === 'wrap');
        const bonds = globalStateRef.current.investments.filter(i => i.investment_type === 'bond');

        if (wraps.length > 0) {
          wraps.forEach((data) => {
            addEntry('wrap', data);
          });
        }

        if (bonds.length > 0) {
          bonds.forEach((data) => {
            addEntry('bonds', data);
          });
        }

        const activeIdx = globalStateRef.current.activeIdx?.[currentTab] || 0;
        setActiveIndex(activeIdx);
        updatePills(currentTab, activeIdx);
        showOnlyActiveEntry(currentTab, activeIdx);
      }, 50);
    }
  }, [ffLoading, factFind?.id, addEntry, updatePills, showOnlyActiveEntry, currentTab]);

  useEffect(() => {
    const clickHandler = (e) => {
      if (e.target.closest('.add-first-wrap') || e.target.closest('.add-wrap')) {
        e.preventDefault();
        addEntry('wrap');
      }
      if (e.target.closest('.add-first-bond') || e.target.closest('.add-bond')) {
        e.preventDefault();
        addEntry('bonds');
      }
      if (e.target.closest('.entry-remove')) {
        e.preventDefault();
        const node = e.target.closest('.entry');
        removeEntry(node, currentTab);
      }
    };

    const inputHandler = (e) => {
      if (e.target.matches('input[name="investment_name"], input[name="bond_name"]')) {
        updatePills(currentTab, activeIndex);
      }
      clearTimeout(window._investmentSaveTimeout);
      window._investmentSaveTimeout = setTimeout(() => {
        saveInvestmentState();
      }, 500);
    };

    document.addEventListener('click', clickHandler);
    document.addEventListener('input', inputHandler);
    return () => {
      document.removeEventListener('click', clickHandler);
      document.removeEventListener('input', inputHandler);
    };
  }, [currentTab, activeIndex, updatePills, addEntry, removeEntry]);

  const saveInvestmentState = useCallback(async () => {
    if (!factFind?.id) return;

    try {
      const wraps = readTabToArray('wrap').map(i => ({ ...i, investment_type: 'wrap' }));
      const bonds = readTabToArray('bonds').map(i => ({ ...i, investment_type: 'bond' }));
      
      globalStateRef.current.investments = [...wraps, ...bonds];
      globalStateRef.current.currentTab = currentTab;
      globalStateRef.current.activeIdx = {
        wrap: currentTab === 'wrap' ? activeIndex : globalStateRef.current.activeIdx?.wrap || 0,
        bonds: currentTab === 'bonds' ? activeIndex : globalStateRef.current.activeIdx?.bonds || 0
      };

      await base44.entities.FactFind.update(factFind.id, {
        investment: {
          investments: globalStateRef.current.investments,
          currentTab: globalStateRef.current.currentTab,
          activeIdx: globalStateRef.current.activeIdx
        }
      });
    } catch (error) {
      console.error('Save failed:', error);
    }
  }, [factFind?.id, readTabToArray, currentTab, activeIndex]);

  const handleNext = async () => {
    if (!factFind?.id) {
      toast.error('Unable to save data');
      return;
    }

    setSaving(true);
    try {
      const sectionsCompleted = [...(factFind.sections_completed || [])];
      if (!sectionsCompleted.includes('investment')) {
        sectionsCompleted.push('investment');
      }

      await base44.entities.FactFind.update(factFind.id, {
        investment: {
          investments: globalStateRef.current.investments,
          currentTab: globalStateRef.current.currentTab,
          activeIdx: globalStateRef.current.activeIdx
        },
        sections_completed: sectionsCompleted,
        completion_percentage: Math.round((sectionsCompleted.length / 14) * 100)
      });

      navigate(createPageUrl('FactFindAssetsLiabilities') + `?id=${factFind.id}`);
    } catch (error) {
      toast.error('Failed to save data');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate(createPageUrl('FactFindSuperannuation') + `?id=${factFind?.id || ''}`);
  };

  if (ffLoading) {
    return (
      <FactFindLayout currentSection="investment" factFind={factFind}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </FactFindLayout>
    );
  }

  const currentCount = currentTab === 'wrap' ? wrapCount : bondCount;

  return (
    <FactFindLayout currentSection="investment" factFind={factFind}>
      <FactFindHeader
        title="Investments"
        description="Capture Wrap/Mastertrusts and Investment bonds."
        factFind={factFind}
        user={user}
      />

      {/* Hidden Templates */}
      <div id="wrapTemplate" style={{ display: 'none' }}>
        <div className="entry bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-4">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Wrap <span className="idx">1</span></h3>
              <p className="text-xs text-slate-500 mt-1">Fill in the details below</p>
            </div>
            <button type="button" className="entry-remove px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100">Remove</button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Investment name</label>
              <input type="text" name="investment_name" placeholder="e.g. Smith Family Wrap Account" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">Ownership type</label>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="w_owner_type__1" value="2" className="w-4 h-4" />
                    <span className="text-sm text-slate-700">Joint</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="w_owner_type__1" value="1" className="w-4 h-4" />
                    <span className="text-sm text-slate-700">Sole ownership</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Wrap owner</label>
                <select name="w_owner" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select owner…</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Wrap product provider</label>
              <input type="text" name="w_provider" placeholder="" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>
      </div>

      <div id="bondTemplate" style={{ display: 'none' }}>
        <div className="entry bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-4">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Bond <span className="idx">1</span></h3>
              <p className="text-xs text-slate-500 mt-1">Fill in the details below</p>
            </div>
            <button type="button" className="entry-remove px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100">Remove</button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Bond name</label>
              <input type="text" name="bond_name" placeholder="e.g. Smith Education Bond" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">Bond ownership type</label>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="b_owner_type__1" value="2" className="w-4 h-4" />
                    <span className="text-sm text-slate-700">Joint</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="b_owner_type__1" value="1" className="w-4 h-4" />
                    <span className="text-sm text-slate-700">Sole ownership</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Bond owner</label>
                <select name="b_owner" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select owner…</option>
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">Bond type</label>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="b_type__1" value="1" className="w-4 h-4" />
                    <span className="text-sm text-slate-700">Investment bond</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="b_type__1" value="2" className="w-4 h-4" />
                    <span className="text-sm text-slate-700">Education bond</span>
                  </label>
                </div>
              </div>

              <div></div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Bond provider</label>
              <input type="text" name="b_provider" placeholder="" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Bond value</label>
                <div className="flex items-center">
                  <span className="text-slate-500 mr-2">$</span>
                  <input type="number" name="b_value" placeholder="0.00" step="0.01" min="0" className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Contribution</label>
                <div className="flex items-center">
                  <span className="text-slate-500 mr-2">$</span>
                  <input type="number" name="b_contrib" placeholder="0.00" step="0.01" min="0" className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="w-full space-y-6">
          {/* Tabs - Part of form content */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setCurrentTab('wrap');
                setActiveIndex(0);
                setTimeout(() => updatePills('wrap', 0), 0);
              }}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                currentTab === 'wrap'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
              }`}
            >
              Wrap / Mastertrust
            </button>
            <button
              onClick={() => {
                setCurrentTab('bonds');
                setActiveIndex(0);
                setTimeout(() => updatePills('bonds', 0), 0);
              }}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                currentTab === 'bonds'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
              }`}
            >
              Investment bonds
            </button>
          </div>

          <div id="wrapWrap" style={{ display: currentTab === 'wrap' ? 'block' : 'none' }} className="space-y-4" />
          <div id="bondsWrap" style={{ display: currentTab === 'bonds' ? 'block' : 'none' }} className="space-y-4" />

          {currentCount === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="text-5xl mb-6">{currentTab === 'wrap' ? '📊' : '💰'}</div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">
                Do you have any {currentTab === 'wrap' ? 'Wrap or Mastertrust accounts?' : 'Investment bonds?'}
              </h3>
              <p className="text-slate-600 text-center mb-8 max-w-md">
                {currentTab === 'wrap'
                  ? 'Add details about your investment platform accounts and portfolios.'
                  : 'Add details about your investment bond accounts and contributions.'}
              </p>
              <Button
                onClick={() => addEntry(currentTab)}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30"
              >
                + Add {currentTab === 'wrap' ? 'Wrap / Mastertrust' : 'Investment Bond'}
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <div id={currentTab === 'wrap' ? 'wrapPills' : 'bondsPills'} className="flex gap-2" />
                <button
                  onClick={() => addEntry(currentTab)}
                  className="ml-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0 shadow-sm"
                >
                  + Add {currentTab === 'wrap' ? 'Wrap' : 'Bond'}
                </button>
              </div>
            </>
          )}

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