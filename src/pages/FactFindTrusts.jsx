import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import FactFindLayout from '../components/factfind/FactFindLayout';
import FactFindHeader from '../components/factfind/FactFindHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowRight, ArrowLeft, Trash2 } from 'lucide-react';

export default function FactFindTrusts() {
  const navigate = useNavigate();
  const [factFind, setFactFind] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentTab, setCurrentTab] = useState('trust');
  const [activeIndex, setActiveIndex] = useState(0);
  const [trustsCount, setTrustsCount] = useState(0);
  const [companiesCount, setCompaniesCount] = useState(0);

  const globalStateRef = React.useRef({
    trusts: {
      trusts: [],
      companies: [],
      currentTab: 'trust',
      activeIndex: {
        trust: 0,
        company: 0
      }
    }
  });

  // ============================================
  // CORE DOM MANIPULATION
  // ============================================

  const wrapForTab = useCallback((tab) => {
    const id = tab === 'trust' ? 'trustsWrap' : 'companiesWrap';
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

  // ============================================
  // READ DATA FROM DOM
  // ============================================

  const readTabToArray = useCallback((tab) => {
    const wrap = wrapForTab(tab);
    if (!wrap) return [];

    const cards = [...wrap.querySelectorAll('.entry')];
    return cards.map((card) => {
      const data = {};
      
      // Get all inputs/selects
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

      // Read beneficiaries/shareholders rows
      if (tab === 'trust') {
        const benefRows = card.querySelectorAll('.benef-row');
        data.beneficiaries = Array.from(benefRows).map(row => ({
          benef_entity: row.querySelector('select[name="benef_entity"]')?.value || '',
          benef_entitlement: row.querySelector('input[name="benef_entitlement"]')?.value || ''
        }));
      } else {
        const shRows = card.querySelectorAll('.sh-row');
        data.shareholders = Array.from(shRows).map(row => ({
          sh_entity: row.querySelector('select[name="sh_entity"]')?.value || '',
          sh_pct: row.querySelector('input[name="sh_pct"]')?.value || ''
        }));
      }

      return data;
    });
  }, [wrapForTab]);

  // ============================================
  // RENUMBER ENTRIES
  // ============================================

  const renumber = useCallback((tab) => {
    const wrap = wrapForTab(tab);
    if (!wrap) return;

    [...wrap.querySelectorAll('.entry')].forEach((card, i) => {
      const idxSpan = card.querySelector('.idx');
      if (idxSpan) idxSpan.textContent = i + 1;

      // Renumber radio buttons
      if (tab === 'trust') {
        // Trusts don't have radio buttons in this spec
      } else {
        card.querySelectorAll('input[type="radio"][name^="co_purpose"]')
          .forEach(r => { r.name = 'co_purpose__' + (i + 1); });
        card.querySelectorAll('input[type="radio"][name^="co_type"]')
          .forEach(r => { r.name = 'co_type__' + (i + 1); });
      }
    });
  }, [wrapForTab]);

  // ============================================
  // UPDATE PILL NAVIGATION
  // ============================================

  const updatePills = useCallback((tab, index) => {
    const pillsId = tab === 'trust' ? 'trustPills' : 'companyPills';
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

      let displayName = '';
      if (tab === 'trust') {
        const nameInput = card.querySelector('input[name="trust_name"]');
        displayName = nameInput?.value?.trim() || `Trust ${i + 1}`;
      } else {
        const nameInput = card.querySelector('input[name="company_name"]');
        displayName = nameInput?.value?.trim() || `Company ${i + 1}`;
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

  // ============================================
  // SHOW ONLY ACTIVE ENTRY
  // ============================================

  const showOnlyActiveEntry = useCallback((tab, index) => {
    const wrap = wrapForTab(tab);
    if (!wrap) return;

    const cards = [...wrap.querySelectorAll('.entry')];
    cards.forEach((card, i) => {
      card.style.display = i === index ? '' : 'none';
    });
  }, [wrapForTab]);

  // ============================================
  // FILL CARD WITH DATA
  // ============================================

  const fillCardFromData = useCallback((card, tab, data) => {
    if (!data || !card) return;

    if (tab === 'trust') {
      const nameInput = card.querySelector('input[name="trust_name"]');
      if (nameInput && data.trust_name) nameInput.value = data.trust_name;

      const typeSelect = card.querySelector('select[name="trust_type"]');
      if (typeSelect && data.trust_type) typeSelect.value = data.trust_type;

      // Fill beneficiaries
      if (Array.isArray(data.beneficiaries) && data.beneficiaries.length > 0) {
        const benefContainer = card.querySelector('.benef-list');
        if (benefContainer) {
          benefContainer.innerHTML = '';
          data.beneficiaries.forEach((benef) => {
            const row = createBeneficiaryRow(card, benef);
            benefContainer.appendChild(row);
          });
        }
      }
    } else {
      const nameInput = card.querySelector('input[name="company_name"]');
      if (nameInput && data.company_name) nameInput.value = data.company_name;

      const lossesInput = card.querySelector('input[name="co_losses"]');
      if (lossesInput && data.co_losses) lossesInput.value = data.co_losses;

      const profitInput = card.querySelector('input[name="co_profit"]');
      if (profitInput && data.co_profit) profitInput.value = data.co_profit;

      // Radio: Purpose
      if (data.co_purpose) {
        card.querySelectorAll('input[type="radio"][name^="co_purpose"]').forEach(r => {
          r.checked = r.value === data.co_purpose;
        });
      }

      // Radio: Type
      if (data.co_type) {
        card.querySelectorAll('input[type="radio"][name^="co_type"]').forEach(r => {
          r.checked = r.value === data.co_type;
        });
      }

      // Fill shareholders
      if (Array.isArray(data.shareholders) && data.shareholders.length > 0) {
        const shContainer = card.querySelector('.sh-list');
        if (shContainer) {
          shContainer.innerHTML = '';
          data.shareholders.forEach((sh) => {
            const row = createShareholderRow(card, sh);
            shContainer.appendChild(row);
          });
        }
      }
    }
  }, []);

  // ============================================
  // CREATE BENEFICIARY ROW
  // ============================================

  const createBeneficiaryRow = useCallback((card, data = {}) => {
    const row = document.createElement('div');
    row.className = 'benef-row flex gap-2 items-end pb-2';
    
    const clientName = factFind?.personal?.client?.first_name 
      ? `${factFind.personal.client.first_name} ${factFind.personal.client.last_name}`.trim()
      : 'Client';
    
    const childrenOptions = factFind?.dependants?.children
      ?.map((c, i) => `<option value="child-${i}">${c.child_name || `Child ${i + 1}`}</option>`)
      .join('') || '';
    
    const dependantsOptions = factFind?.dependants?.dependants_list
      ?.map((d, i) => `<option value="dependent-${i}">${d.dep_name || `Dependant ${i + 1}`}</option>`)
      .join('') || '';
    
    const trustOptions = globalStateRef.current.trusts.trusts
      .map((t, i) => `<option value="trust-${i}">${t.trust_name || `Trust ${i + 1}`}</option>`)
      .join('');
    
    const companyOptions = globalStateRef.current.trusts.companies
      .map((c, i) => `<option value="company-${i}">${c.company_name || `Company ${i + 1}`}</option>`)
      .join('');
    
    row.innerHTML = `
      <select name="benef_entity" class="flex-1 px-3 py-2 border border-slate-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
        <option value="">Select entity…</option>
        <option value="client">${clientName}</option>
        ${childrenOptions}
        ${dependantsOptions}
        ${trustOptions}
        ${companyOptions}
      </select>
      <input type="text" name="benef_entitlement" placeholder="e.g. 25% or fixed amount" class="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      <button type="button" class="remove-benef px-3 py-2 text-red-600 hover:bg-red-50 rounded-md text-sm font-medium">Remove</button>
    `;

    const removeBtn = row.querySelector('.remove-benef');
    removeBtn.onclick = (e) => {
      e.preventDefault();
      row.remove();
    };

    if (data?.benef_entity) {
      row.querySelector('select[name="benef_entity"]').value = data.benef_entity;
    }
    if (data?.benef_entitlement) {
      row.querySelector('input[name="benef_entitlement"]').value = data.benef_entitlement;
    }

    return row;
  }, [factFind]);

  // ============================================
  // CREATE SHAREHOLDER ROW
  // ============================================

  const createShareholderRow = useCallback((card, data = {}) => {
    const row = document.createElement('div');
    row.className = 'sh-row flex gap-2 items-end pb-2';
    
    const clientName = factFind?.personal?.client?.first_name 
      ? `${factFind.personal.client.first_name} ${factFind.personal.client.last_name}`.trim()
      : 'Client';
    
    const childrenOptions = factFind?.dependants?.children
      ?.map((c, i) => `<option value="child-${i}">${c.child_name || `Child ${i + 1}`}</option>`)
      .join('') || '';
    
    const dependantsOptions = factFind?.dependants?.dependants_list
      ?.map((d, i) => `<option value="dependent-${i}">${d.dep_name || `Dependant ${i + 1}`}</option>`)
      .join('') || '';
    
    const trustOptions = globalStateRef.current.trusts.trusts
      .map((t, i) => `<option value="trust-${i}">${t.trust_name || `Trust ${i + 1}`}</option>`)
      .join('');
    
    const companyOptions = globalStateRef.current.trusts.companies
      .map((c, i) => `<option value="company-${i}">${c.company_name || `Company ${i + 1}`}</option>`)
      .join('');
    
    row.innerHTML = `
      <select name="sh_entity" class="flex-1 px-3 py-2 border border-slate-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
        <option value="">Select entity…</option>
        <option value="client">${clientName}</option>
        ${childrenOptions}
        ${dependantsOptions}
        ${trustOptions}
        ${companyOptions}
      </select>
      <input type="text" name="sh_pct" placeholder="e.g. 25%" class="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      <button type="button" class="remove-sh px-3 py-2 text-red-600 hover:bg-red-50 rounded-md text-sm font-medium">Remove</button>
    `;

    const removeBtn = row.querySelector('.remove-sh');
    removeBtn.onclick = (e) => {
      e.preventDefault();
      row.remove();
    };

    if (data?.sh_entity) {
      row.querySelector('select[name="sh_entity"]').value = data.sh_entity;
    }
    if (data?.sh_pct) {
      row.querySelector('input[name="sh_pct"]').value = data.sh_pct;
    }

    return row;
  }, [factFind]);

  // ============================================
  // ADD ENTRY
  // ============================================

  const addEntry = useCallback((tab, existingData = null) => {
    const wrap = wrapForTab(tab);
    if (!wrap) return;

    const templateId = tab === 'trust' ? 'trustTemplate' : 'companyTemplate';
    const node = cloneTemplateDiv(templateId);
    if (!node) return;

    wrap.appendChild(node);

    if (existingData) {
      fillCardFromData(node, tab, existingData);
    }

    renumber(tab);
    const newCount = wrap.querySelectorAll('.entry').length;
    if (tab === 'trust') {
      setTrustsCount(newCount);
    } else {
      setCompaniesCount(newCount);
    }

    const newIndex = newCount - 1;
    setActiveIndex(newIndex);
    updatePills(tab, newIndex);
    showOnlyActiveEntry(tab, newIndex);
  }, [wrapForTab, cloneTemplateDiv, fillCardFromData, renumber, updatePills, showOnlyActiveEntry]);

  // ============================================
  // REMOVE ENTRY
  // ============================================

  const removeEntry = useCallback((node, tab) => {
    node.remove();
    const wrap = wrapForTab(tab);
    const remaining = wrap.querySelectorAll('.entry').length;
    renumber(tab);

    if (tab === 'trust') {
      setTrustsCount(remaining);
    } else {
      setCompaniesCount(remaining);
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

  // ============================================
  // LOAD DATA
  // ============================================

  const loadData = useCallback(async () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');

      if (id) {
        const finds = await base44.entities.FactFind.filter({ id });
        if (finds[0]) {
          setFactFind(finds[0]);
          if (finds[0].trusts) {
            globalStateRef.current.trusts = {
              ...finds[0].trusts,
              currentTab: finds[0].trusts.currentTab || 'trust',
              activeIndex: finds[0].trusts.activeIndex || { trust: 0, company: 0 }
            };
          }
        }
      }
    } catch (error) {
      console.error('Error loading fact find:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================
  // SAVE STATE
  // ============================================

  const saveTrustsState = useCallback(async () => {
    if (!factFind?.id) return;

    try {
      globalStateRef.current.trusts.trusts = readTabToArray('trust');
      globalStateRef.current.trusts.companies = readTabToArray('company');
      globalStateRef.current.trusts.currentTab = currentTab;
      globalStateRef.current.trusts.activeIndex = {
        trust: currentTab === 'trust' ? activeIndex : globalStateRef.current.trusts.activeIndex?.trust || 0,
        company: currentTab === 'company' ? activeIndex : globalStateRef.current.trusts.activeIndex?.company || 0
      };

      await base44.entities.FactFind.update(factFind.id, {
        trusts: globalStateRef.current.trusts
      });
    } catch (error) {
      console.error('Save failed:', error);
    }
  }, [factFind?.id, readTabToArray, currentTab, activeIndex]);

  // ============================================
  // INITIALIZE DOM
  // ============================================

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!loading && factFind?.id) {
      setTimeout(() => {
        const trustsWrap = document.getElementById('trustsWrap');
        const companiesWrap = document.getElementById('companiesWrap');

        if (trustsWrap) trustsWrap.innerHTML = '';
        if (companiesWrap) companiesWrap.innerHTML = '';

        if (globalStateRef.current.trusts.trusts?.length > 0) {
          globalStateRef.current.trusts.trusts.forEach((trustData) => {
            addEntry('trust', trustData);
          });
        }

        if (globalStateRef.current.trusts.companies?.length > 0) {
          globalStateRef.current.trusts.companies.forEach((companyData) => {
            addEntry('company', companyData);
          });
        }

        const activeIdx = globalStateRef.current.trusts.activeIndex?.[currentTab] || 0;
        setActiveIndex(activeIdx);
        updatePills(currentTab, activeIdx);
        showOnlyActiveEntry(currentTab, activeIdx);
      }, 50);
    }
  }, [loading, factFind?.id, addEntry, updatePills, showOnlyActiveEntry, currentTab]);

  // ============================================
  // SETUP INPUT LISTENERS
  // ============================================

  useEffect(() => {
    const clickHandler = (e) => {
      if (e.target.closest('.add-benef')) {
        e.preventDefault();
        const card = e.target.closest('.entry');
        const list = card.querySelector('.benef-list');
        const row = document.createElement('div');
        row.className = 'benef-row flex gap-2 items-end pb-2';
        row.innerHTML = `
          <select name="benef_entity" class="flex-1 px-3 py-2 border border-slate-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Select entity…</option>
            <option value="client">Client</option>
            <option value="partner">Partner</option>
          </select>
          <input type="text" name="benef_entitlement" placeholder="e.g. 25% or fixed amount" class="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button type="button" class="remove-benef px-3 py-2 text-red-600 hover:bg-red-50 rounded-md text-sm font-medium">Remove</button>
        `;
        row.querySelector('.remove-benef').onclick = () => row.remove();
        list.appendChild(row);
      }
      if (e.target.closest('.add-shareholder')) {
        e.preventDefault();
        const card = e.target.closest('.entry');
        const list = card.querySelector('.sh-list');
        const row = document.createElement('div');
        row.className = 'sh-row flex gap-2 items-end pb-2';
        row.innerHTML = `
          <select name="sh_entity" class="flex-1 px-3 py-2 border border-slate-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Select entity…</option>
            <option value="client">Client</option>
            <option value="partner">Partner</option>
          </select>
          <input type="text" name="sh_pct" placeholder="e.g. 25%" class="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button type="button" class="remove-sh px-3 py-2 text-red-600 hover:bg-red-50 rounded-md text-sm font-medium">Remove</button>
        `;
        row.querySelector('.remove-sh').onclick = () => row.remove();
        list.appendChild(row);
      }
      if (e.target.closest('.entry-remove')) {
        e.preventDefault();
        const node = e.target.closest('.entry');
        const tab = currentTab;
        removeEntry(node, tab);
      }
    };

    const inputHandler = (e) => {
      if (e.target.matches('input[name="trust_name"], input[name="company_name"]')) {
        updatePills(currentTab, activeIndex);
      }
      clearTimeout(window._trustsSaveTimeout);
      window._trustsSaveTimeout = setTimeout(() => {
        saveTrustsState();
      }, 500);
    };

    document.addEventListener('click', clickHandler);
    document.addEventListener('input', inputHandler);
    return () => {
      document.removeEventListener('click', clickHandler);
      document.removeEventListener('input', inputHandler);
    };
  }, [currentTab, activeIndex, updatePills, saveTrustsState, removeEntry]);

  // ============================================
  // NAVIGATION
  // ============================================

  const handleNext = async () => {
    if (!factFind?.id) {
      toast.error('Unable to save data');
      return;
    }

    setSaving(true);
    try {
      const sectionsCompleted = [...(factFind.sections_completed || [])];
      if (!sectionsCompleted.includes('trusts')) {
        sectionsCompleted.push('trusts');
      }

      await base44.entities.FactFind.update(factFind.id, {
        trusts: globalStateRef.current.trusts,
        sections_completed: sectionsCompleted,
        completion_percentage: Math.round((sectionsCompleted.length / 14) * 100)
      });

      navigate(createPageUrl('FactFindSMSF') + `?id=${factFind.id}`);
    } catch (error) {
      toast.error('Failed to save data');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate(createPageUrl('FactFindDependants') + `?id=${factFind?.id || ''}`);
  };

  if (loading) {
    return (
      <FactFindLayout currentSection="trusts" factFind={factFind}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </FactFindLayout>
    );
  }

  return (
    <FactFindLayout currentSection="trusts" factFind={factFind}>
      <FactFindHeader
        title="Trusts & Companies"
        description="Add any trusts and companies you own or control."
        factFind={factFind}
        tabs={[
          { id: 'trust', label: 'Trusts' },
          { id: 'company', label: 'Companies' }
        ]}
        activeTab={currentTab}
        onTabChange={(tab) => {
          setCurrentTab(tab);
          setActiveIndex(0);
          setTimeout(() => updatePills(tab, 0), 0);
        }}
      />

      {/* Hidden Templates */}
      <div id="trustTemplate" style={{ display: 'none' }}>
        <div className="entry bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-4">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Trust <span className="idx">1</span></h3>
              <p className="text-xs text-slate-500 mt-1">Fill in the details below</p>
            </div>
            <button type="button" className="entry-remove px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100">Remove</button>
          </div>

          <div className="space-y-6">
            {/* Trust Details Section */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="text-sm font-semibold text-blue-700 mb-4 flex items-center gap-2"><span className="w-1 h-5 bg-blue-600 rounded"></span>🏛️ Trust Details</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Trust name</label>
                  <input type="text" name="trust_name" placeholder="e.g. The Smith Family Trust" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Trust type</label>
                  <select name="trust_type" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select…</option>
                    <option value="1">Discretionary Family Trust</option>
                    <option value="2">Unit Trust</option>
                    <option value="3">Hybrid Trust</option>
                    <option value="4">Testamentary Trust</option>
                    <option value="5">Other</option>
                  </select>
                </div>
                </div>
                </div>

                {/* Beneficiaries Section */}
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <h4 className="text-sm font-semibold text-purple-700 mb-4 flex items-center gap-2"><span className="w-1 h-5 bg-purple-600 rounded"></span>👥 Trustee Beneficiaries</h4>
              <div className="benef-list space-y-2 mb-3">
                {/* Beneficiary rows go here */}
              </div>
              <button type="button" class="add-benef px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700">+ Add beneficiary</button>
            </div>
          </div>
        </div>
      </div>

      <div id="companyTemplate" style={{ display: 'none' }}>
        <div className="entry bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-4">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Company <span className="idx">1</span></h3>
              <p className="text-xs text-slate-500 mt-1">Fill in the details below</p>
            </div>
            <button type="button" className="entry-remove px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100">Remove</button>
          </div>

          <div className="space-y-6">
            {/* Company Details Section */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="text-sm font-semibold text-blue-700 mb-4 flex items-center gap-2"><span className="w-1 h-5 bg-blue-600 rounded"></span>🏢 Company Details</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Company name</label>
                  <input type="text" name="company_name" placeholder="e.g. Smith Investments Pty Ltd" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">Purpose of company</label>
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="co_purpose__1" value="1" className="w-4 h-4" />
                        <span className="text-sm text-slate-700">Operating business</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="co_purpose__1" value="2" className="w-4 h-4" />
                        <span className="text-sm text-slate-700">Investment</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="co_purpose__1" value="3" className="w-4 h-4" />
                        <span className="text-sm text-slate-700">Beneficiary of trust</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">Company type</label>
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="co_type__1" value="1" className="w-4 h-4" />
                        <span className="text-sm text-slate-700">Pty Ltd</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="co_type__1" value="2" className="w-4 h-4" />
                        <span className="text-sm text-slate-700">Partnership</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="co_type__1" value="3" className="w-4 h-4" />
                        <span className="text-sm text-slate-700">Sole trader</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="co_type__1" value="4" className="w-4 h-4" />
                        <span className="text-sm text-slate-700">Charity</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Pre-existing losses</label>
                    <div className="flex items-center">
                      <span className="text-slate-500 mr-2">$</span>
                      <input type="number" name="co_losses" placeholder="0.00" step="0.01" min="0" className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Annual profit</label>
                    <div className="flex items-center">
                      <span className="text-slate-500 mr-2">$</span>
                      <input type="number" name="co_profit" placeholder="0.00" step="0.01" min="0" className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                </div>
              </div>
              </div>

              {/* Shareholders Section */}
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <h4 className="text-sm font-semibold text-orange-700 mb-4 flex items-center gap-2"><span className="w-1 h-5 bg-orange-600 rounded"></span>📊 Shareholders</h4>
              <div className="sh-list space-y-2 mb-3">
                {/* Shareholder rows go here */}
              </div>
              <button type="button" className="add-shareholder px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700">+ Add shareholder</button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="w-full space-y-6">
          <div id="trustsWrap" className="space-y-4" style={{ display: currentTab === 'trust' ? 'block' : 'none' }} />
          <div id="companiesWrap" className="space-y-4" style={{ display: currentTab === 'company' ? 'block' : 'none' }} />

          {/* Welcome Screen */}
          {(currentTab === 'trust' ? trustsCount : companiesCount) === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="text-5xl mb-6">
                {currentTab === 'trust' ? '🏛️' : '🏢'}
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">
                {currentTab === 'trust' ? 'Do you have any trusts?' : 'Do you have any companies?'}
              </h3>
              <p className="text-slate-600 text-center mb-8 max-w-md">
                {currentTab === 'trust'
                  ? 'Add details about family trusts, unit trusts, or other trust structures.'
                  : 'Add details about private companies, Pty Ltd structures, or corporate entities.'}
              </p>
              <Button
                onClick={() => addEntry(currentTab)}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30"
              >
                Add {currentTab === 'trust' ? 'Trust' : 'Company'}
              </Button>
            </div>
          ) : (
            <>
              {/* Pills Navigation */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <div id={currentTab === 'trust' ? 'trustPills' : 'companyPills'} className="flex gap-2" />
                <button
                  onClick={() => addEntry(currentTab)}
                  className="ml-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0 shadow-sm"
                >
                  + Add {currentTab === 'trust' ? 'Trust' : 'Company'}
                </button>
              </div>
            </>
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

      {/* Setup event listeners for add buttons */}
      {typeof window !== 'undefined' && (
        <script dangerouslySetInnerHTML={{__html: `
          document.addEventListener('click', function(e) {
            if (e.target.closest('.add-benef')) {
              e.preventDefault();
              const card = e.target.closest('.entry');
              const list = card.querySelector('.benef-list');
              const row = document.createElement('div');
              row.className = 'benef-row flex gap-2 items-end pb-2';
              row.innerHTML = \`
                <select name="benef_entity" class="flex-1 px-3 py-2 border border-slate-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select entity…</option>
                  <option value="client">Client</option>
                  <option value="partner">Partner</option>
                </select>
                <input type="text" name="benef_entitlement" placeholder="e.g. 25% or fixed amount" class="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button type="button" class="remove-benef px-3 py-2 text-red-600 hover:bg-red-50 rounded-md text-sm font-medium">Remove</button>
              \`;
              row.querySelector('.remove-benef').onclick = (e) => {
                e.preventDefault();
                row.remove();
              };
              list.appendChild(row);
            }
            if (e.target.closest('.add-shareholder')) {
              e.preventDefault();
              const card = e.target.closest('.entry');
              const list = card.querySelector('.sh-list');
              const row = document.createElement('div');
              row.className = 'sh-row flex gap-2 items-end pb-2';
              row.innerHTML = \`
                <select name="sh_entity" class="flex-1 px-3 py-2 border border-slate-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select entity…</option>
                  <option value="client">Client</option>
                  <option value="partner">Partner</option>
                </select>
                <input type="text" name="sh_pct" placeholder="e.g. 25%" class="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button type="button" class="remove-sh px-3 py-2 text-red-600 hover:bg-red-50 rounded-md text-sm font-medium">Remove</button>
              \`;
              row.querySelector('.remove-sh').onclick = (e) => {
                e.preventDefault();
                row.remove();
              };
              list.appendChild(row);
            }
            if (e.target.closest('.entry-remove')) {
              e.preventDefault();
              e.target.closest('.entry').remove();
            }
          });
        `}} />
      )}
    </FactFindLayout>
  );
}