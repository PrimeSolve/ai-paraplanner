import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import FactFindLayout from '../components/factfind/FactFindLayout';
import FactFindHeader from '../components/factfind/FactFindHeader';
import { useFactFind } from '../components/factfind/useFactFind';
import { useFactFindEntities } from '../components/factfind/useFactFindEntities';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowRight, ArrowLeft, Trash2, Plus, Landmark, UserPlus, Building } from 'lucide-react';
import EntityDot from '../components/factfind/EntityDot';
import EntitySelect from '../components/factfind/EntitySelect';

export default function FactFindTrusts() {
  const navigate = useNavigate();
  const { factFind, loading: ffLoading, updateSection } = useFactFind();
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [currentTab, setCurrentTab] = useState('trust');
  const [activeIndex, setActiveIndex] = useState(0);
  const [trustsCount, setTrustsCount] = useState(0);
  const [companiesCount, setCompaniesCount] = useState(0);
  
  // Calculate current entity ID for exclusion
  const currentEntityId = useMemo(() => {
    if (!factFind?.client1_profile?.trusts_companies?.entities) return null;
    
    const entities = factFind.client1_profile.trusts_companies.entities.filter(e => e.type === currentTab);
    if (activeIndex >= entities.length) return null;
    
    // Find the actual index in the full entities array
    const currentEntity = entities[activeIndex];
    const fullIndex = factFind.trusts_companies.entities.findIndex(e => e === currentEntity);
    
    return fullIndex >= 0 ? `${currentTab}_${fullIndex}` : null;
  }, [factFind?.id, currentTab, activeIndex]);
  
  const entityList = useFactFindEntities(factFind, { excludeId: currentEntityId });

  const globalStateRef = React.useRef({
    entities: [],
    currentTab: 'trust',
    activeIndex: {
      trust: 0,
      company: 0
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
      const data = { type: tab }; // Add type field

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
        const benefRows = card.querySelectorAll('tbody.benef-list tr');
        data.beneficiaries = Array.from(benefRows).map(row => ({
          benef_entity: row.querySelector('select[name="benef_entity"]')?.value || '',
          benef_entitlement: row.querySelector('input[name="benef_entitlement"]')?.value || ''
        }));
      } else {
        const shRows = card.querySelectorAll('tbody.sh-list tr');
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

      pill.className = `px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
        isActive
          ? 'bg-blue-600 border-blue-600 text-white shadow-md'
          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
      }`;
      pill.textContent = displayName;

      pill.onclick = (e) => {
        e.preventDefault();
        setActiveIndex(i);
        showOnlyActiveEntry(tab, i);
        updatePills(tab, i);
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

      const abnInput = card.querySelector('input[name="trust_abn"]');
      if (abnInput && data.trust_abn) abnInput.value = data.trust_abn;

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
        const benefTable = card.querySelector('.benef-list-table');
        const benefEmpty = card.querySelector('.benef-list-empty');
        const benefBtn = card.querySelector('.add-benef');
        benefTable?.classList.remove('hidden');
        benefEmpty?.classList.add('hidden');
        benefBtn?.classList.remove('hidden');
      }
    } else {
      const nameInput = card.querySelector('input[name="company_name"]');
      if (nameInput && data.company_name) nameInput.value = data.company_name;

      const abnInput = card.querySelector('input[name="company_abn"]');
      if (abnInput && data.company_abn) abnInput.value = data.company_abn;

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
        const shTable = card.querySelector('.sh-list-table');
        const shEmpty = card.querySelector('.sh-list-empty');
        const shBtn = card.querySelector('.add-shareholder');
        shTable?.classList.remove('hidden');
        shEmpty?.classList.add('hidden');
        shBtn?.classList.remove('hidden');
      }
    }
  }, []);

  // ============================================
  // CREATE BENEFICIARY ROW
  // ============================================

  const createBeneficiaryRow = useCallback((card, data = {}) => {
    const row = document.createElement('tr');
    row.className = 'benef-row border-b border-slate-100 hover:bg-purple-50/50';

    const entityOptions = entityList && entityList.length > 0
      ? entityList.map(entity => `<option value="${entity.id}">\u25CF ${entity.label} (${entity.type})</option>`).join('')
      : '';

    row.innerHTML = `
      <td class="py-2 px-2">
        <select name="benef_entity" class="w-full px-2 py-1.5 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500">
          <option value="">Select entity…</option>
          ${entityOptions}
        </select>
      </td>
      <td class="py-2 px-2">
        <input type="text" name="benef_entitlement" placeholder="e.g. 25% or fixed amount" class="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
      </td>
      <td class="py-2 px-2 text-center">
        <button type="button" class="remove-benef text-red-500 hover:text-red-700 text-xs font-medium">Remove</button>
      </td>
    `;

    const removeBtn = row.querySelector('.remove-benef');
    if (removeBtn) {
      removeBtn.onclick = (e) => {
        e.preventDefault();
        row.remove();
      };
    }

    if (data?.benef_entity) {
      const el = row.querySelector('select[name="benef_entity"]');
      if (el) el.value = data.benef_entity;
    }
    if (data?.benef_entitlement) {
      const el = row.querySelector('input[name="benef_entitlement"]');
      if (el) el.value = data.benef_entitlement;
    }

    return row;
  }, [entityList]);

  // ============================================
  // CREATE SHAREHOLDER ROW
  // ============================================

  const createShareholderRow = useCallback((card, data = {}) => {
    const row = document.createElement('tr');
    row.className = 'sh-row border-b border-slate-100 hover:bg-orange-50/50';

    const entityOptions = entityList && entityList.length > 0
      ? entityList.map(entity => `<option value="${entity.id}">\u25CF ${entity.label} (${entity.type})</option>`).join('')
      : '';

    row.innerHTML = `
      <td class="py-2 px-2">
        <select name="sh_entity" class="w-full px-2 py-1.5 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500">
          <option value="">Select entity…</option>
          ${entityOptions}
        </select>
      </td>
      <td class="py-2 px-2">
        <input type="text" name="sh_pct" placeholder="e.g. 25%" class="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
      </td>
      <td class="py-2 px-2 text-center">
        <button type="button" class="remove-sh text-red-500 hover:text-red-700 text-xs font-medium">Remove</button>
      </td>
    `;

    const removeBtn = row.querySelector('.remove-sh');
    if (removeBtn) {
      removeBtn.onclick = (e) => {
        e.preventDefault();
        row.remove();
      };
    }

    if (data?.sh_entity) {
      const el = row.querySelector('select[name="sh_entity"]');
      if (el) el.value = data.sh_entity;
    }
    if (data?.sh_pct) {
      const el = row.querySelector('input[name="sh_pct"]');
      if (el) el.value = data.sh_pct;
    }

    return row;
  }, [entityList]);

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
    
    // Use setTimeout to ensure state updates before showing entry
    setTimeout(() => {
      updatePills(tab, newIndex);
      showOnlyActiveEntry(tab, newIndex);
    }, 0);
  }, [wrapForTab, cloneTemplateDiv, fillCardFromData, renumber, updatePills, showOnlyActiveEntry]);

  // ============================================
  // REMOVE ENTRY
  // ============================================

  const removeEntry = useCallback(async (node, tab) => {
    node.remove();
    const wrap = wrapForTab(tab);
    if (!wrap) return;
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

    // Save to database immediately
    if (factFind?.id) {
      const trustEntities = readTabToArray('trust');
      const companyEntities = readTabToArray('company');
      
      globalStateRef.current.entities = [...trustEntities, ...companyEntities];
      globalStateRef.current.currentTab = currentTab;
      globalStateRef.current.activeIndex = {
        trust: currentTab === 'trust' ? activeIndex : globalStateRef.current.activeIndex?.trust || 0,
        company: currentTab === 'company' ? activeIndex : globalStateRef.current.activeIndex?.company || 0
      };
      
      await updateSection('Client1FactFind', { TrustsCompanies: {
        entities: globalStateRef.current.entities,
        currentTab: globalStateRef.current.currentTab,
        activeIndex: globalStateRef.current.activeIndex
      } });
    }
  }, [wrapForTab, renumber, showOnlyActiveEntry, updatePills, factFind?.id, readTabToArray, currentTab, activeIndex, updateSection]);

  // ============================================
  // LOAD USER AND SYNC FACTFIND
  // ============================================

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
    const tcData = factFind?.client1_profile?.trusts_companies;
    if (factFind?.id && tcData) {
      globalStateRef.current.entities = tcData.entities || [];
      globalStateRef.current.currentTab = tcData.currentTab || 'trust';
      globalStateRef.current.activeIndex = tcData.activeIndex || { trust: 0, company: 0 };
    }
  }, [factFind?.id]);

  // ============================================
  // SAVE STATE
  // ============================================

  const saveTrustsState = useCallback(async () => {
    if (!factFind?.id) return;

    try {
      const trustEntities = readTabToArray('trust');
      const companyEntities = readTabToArray('company');
      
      globalStateRef.current.entities = [...trustEntities, ...companyEntities];
      globalStateRef.current.currentTab = currentTab;
      globalStateRef.current.activeIndex = {
        trust: currentTab === 'trust' ? activeIndex : globalStateRef.current.activeIndex?.trust || 0,
        company: currentTab === 'company' ? activeIndex : globalStateRef.current.activeIndex?.company || 0
      };

      await updateSection('Client1FactFind', { TrustsCompanies: {
        entities: globalStateRef.current.entities,
        currentTab: globalStateRef.current.currentTab,
        activeIndex: globalStateRef.current.activeIndex
      } });
    } catch (error) {
      console.error('Save failed:', error);
    }
  }, [factFind?.id, readTabToArray, currentTab, activeIndex, updateSection]);

  // ============================================
  // INITIALIZE DOM
  // ============================================

  useEffect(() => {
    if (!ffLoading && factFind?.id) {
      setTimeout(() => {
        const trustsWrap = document.getElementById('trustsWrap');
        const companiesWrap = document.getElementById('companiesWrap');

        if (trustsWrap) trustsWrap.innerHTML = '';
        if (companiesWrap) companiesWrap.innerHTML = '';

        const trusts = globalStateRef.current.entities.filter(e => e.type === 'trust');
        const companies = globalStateRef.current.entities.filter(e => e.type === 'company');

        if (trusts.length > 0) {
          trusts.forEach((trustData) => {
            addEntry('trust', trustData);
          });
        }

        if (companies.length > 0) {
          companies.forEach((companyData) => {
            addEntry('company', companyData);
          });
        }

        const activeIdx = globalStateRef.current.activeIndex?.[currentTab] || 0;
        setActiveIndex(activeIdx);
        updatePills(currentTab, activeIdx);
        showOnlyActiveEntry(currentTab, activeIdx);
      }, 50);
    }
  }, [ffLoading, factFind?.id, addEntry, updatePills, showOnlyActiveEntry, currentTab]);

  // ============================================
  // SETUP INPUT LISTENERS
  // ============================================

  useEffect(() => {
    const updateTableVisibility = (card, type) => {
      if (!card) return;
      
      const container = type === 'benef' ? card.querySelector('.benef-container') : card.querySelector('.sh-container');
      const table = type === 'benef' ? card.querySelector('.benef-list-table') : card.querySelector('.sh-list-table');
      const empty = type === 'benef' ? card.querySelector('.benef-list-empty') : card.querySelector('.sh-list-empty');
      const addBtn = type === 'benef' ? card.querySelector('.add-benef') : card.querySelector('.add-shareholder');
      const list = type === 'benef' ? card.querySelector('.benef-list') : card.querySelector('.sh-list');

      if (!list) return;
      
      const hasRows = list.querySelectorAll(type === 'benef' ? 'tr.benef-row' : 'tr.sh-row').length > 0;

      if (hasRows) {
        table?.classList.remove('hidden');
        empty?.classList.add('hidden');
        addBtn?.classList.remove('hidden');
      } else {
        table?.classList.add('hidden');
        empty?.classList.remove('hidden');
        addBtn?.classList.add('hidden');
      }
    };

    const clickHandler = (e) => {
      if (e.target.closest('.add-benef')) {
        e.preventDefault();
        const card = e.target.closest('.entry');
        const list = card.querySelector('.benef-list');
        const row = createBeneficiaryRow(card);
        list.appendChild(row);
        updateTableVisibility(card, 'benef');
      }
      if (e.target.closest('.add-shareholder')) {
        e.preventDefault();
        const card = e.target.closest('.entry');
        const list = card.querySelector('.sh-list');
        const row = createShareholderRow(card);
        list.appendChild(row);
        updateTableVisibility(card, 'sh');
      }
      if (e.target.closest('.entry-remove')) {
        e.preventDefault();
        const node = e.target.closest('.entry');
        const tab = currentTab;
        removeEntry(node, tab);
      }
      if (e.target.closest('.remove-benef')) {
        const card = e.target.closest('.entry');
        setTimeout(() => updateTableVisibility(card, 'benef'), 0);
      }
      if (e.target.closest('.remove-sh')) {
        const card = e.target.closest('.entry');
        setTimeout(() => updateTableVisibility(card, 'sh'), 0);
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
      }, [currentTab, activeIndex, updatePills, saveTrustsState, removeEntry, createShareholderRow, createBeneficiaryRow]);

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

      const trustEntities = readTabToArray('trust');
      const companyEntities = readTabToArray('company');
      globalStateRef.current.entities = [...trustEntities, ...companyEntities];

      await updateSection('Client1FactFind', { TrustsCompanies: {
        entities: globalStateRef.current.entities,
        currentTab: globalStateRef.current.currentTab,
        activeIndex: globalStateRef.current.activeIndex
      } });
      
      // Update sections completed separately
      await base44.entities.FactFind.update(factFind.id, {
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

  if (ffLoading) {
    return (
      <FactFindLayout currentSection="trusts" factFindId={factFind?.id}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </FactFindLayout>
    );
  }

  return (
    <FactFindLayout currentSection="trusts" factFindId={factFind?.id}>
      <FactFindHeader
        title="Trusts & Companies"
        description="Add any trusts and companies you own or control."
        factFind={factFind}
        user={user}
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
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-3">
                <h3 className="text-blue-700 font-semibold flex items-center gap-2">
                  <Landmark className="w-5 h-5" />
                  Trust Details
                </h3>
              </div>
              <div className="p-4">
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
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">ABN</label>
                  <input type="text" name="trust_abn" placeholder="e.g. 12 345 678 901" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                </div>
              </div>
            </div>

                {/* Beneficiaries Section */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-amber-50 border-l-4 border-amber-500 p-3">
                    <h3 className="text-amber-700 font-semibold flex items-center gap-2">
                      <UserPlus className="w-5 h-5" />
                      Trustee Beneficiaries
                    </h3>
                  </div>
                  <div className="p-4">
                
                <div className="benef-container">
                  {/* Table with headers */}
                  <div className="benef-list-table mb-3 overflow-x-auto">
                    <table className="w-full text-xs border-collapse min-w-[500px]">
                      <thead>
                        <tr className="border-b border-purple-200">
                          <th className="text-left py-2 px-2 font-semibold text-slate-600">Beneficiary</th>
                          <th className="text-left py-2 px-2 font-semibold text-slate-600">Entitlement</th>
                          <th className="w-16"></th>
                        </tr>
                      </thead>
                      <tbody className="benef-list">
                        {/* Beneficiary rows go here */}
                      </tbody>
                    </table>
                  </div>

                  {/* Empty state */}
                  <div className="benef-list-empty text-center py-4">
                    <p className="text-sm text-slate-600 mb-3">No beneficiaries added yet</p>
                  </div>

                  {/* Add button */}
                  <button type="button" className="add-benef inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Plus className="w-4 h-4" />
                    Add Beneficiary
                  </button>
                </div>
              </div>
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
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-3">
                <h3 className="text-blue-700 font-semibold flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Company Details
                </h3>
              </div>
              <div className="p-4">
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Company name</label>
                    <input type="text" name="company_name" placeholder="e.g. Smith Investments Pty Ltd" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">ABN</label>
                    <input type="text" name="company_abn" placeholder="e.g. 12 345 678 901" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
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
          </div>

              {/* Shareholders Section */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-amber-50 border-l-4 border-amber-500 p-3">
                  <h3 className="text-amber-700 font-semibold flex items-center gap-2">
                    <UserPlus className="w-5 h-5" />
                    Shareholders
                  </h3>
                </div>
                <div className="p-4">

              <div className="sh-container">
                {/* Table with headers */}
                <div className="sh-list-table mb-3 overflow-x-auto">
                  <table className="w-full text-xs border-collapse min-w-[500px]">
                    <thead>
                      <tr className="border-b border-orange-200">
                        <th className="text-left py-2 px-2 font-semibold text-slate-600">Shareholder</th>
                        <th className="text-left py-2 px-2 font-semibold text-slate-600">Percentage</th>
                        <th className="w-16"></th>
                      </tr>
                    </thead>
                    <tbody className="sh-list">
                      {/* Shareholder rows go here */}
                    </tbody>
                  </table>
                </div>

                {/* Empty state */}
                <div className="sh-list-empty text-center py-4">
                  <p className="text-sm text-slate-600 mb-3">No shareholders added yet</p>
                </div>

                {/* Add button */}
                <button type="button" className="add-shareholder inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <Plus className="w-4 h-4" />
                  Add Shareholder
                </button>
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
                setCurrentTab('trust');
                setActiveIndex(0);
                setTimeout(() => updatePills('trust', 0), 0);
              }}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                currentTab === 'trust'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span>🏛️</span>
              Trusts
            </button>
            <button
              onClick={() => {
                setCurrentTab('company');
                setActiveIndex(0);
                setTimeout(() => updatePills('company', 0), 0);
              }}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                currentTab === 'company'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span>🏢</span>
              Companies
            </button>
          </div>

          <div id="trustsWrap" className="space-y-4" style={{ display: currentTab === 'trust' ? 'block' : 'none' }} />
          <div id="companiesWrap" className="space-y-4" style={{ display: currentTab === 'company' ? 'block' : 'none' }} />

          {/* Welcome Screen */}
          {(currentTab === 'trust' ? trustsCount : companiesCount) === 0 ? (
            <div className="border border-gray-200 rounded-lg p-12 text-center bg-white">
              <div className="text-5xl mb-4">
                {currentTab === 'trust' ? '🏛️' : '🏢'}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {currentTab === 'trust' ? 'Do you have any trusts?' : 'Do you have any companies?'}
              </h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                {currentTab === 'trust'
                  ? 'Add details about family trusts, unit trusts, or other trust structures you control.'
                  : 'Add details about private companies, Pty Ltd structures, or corporate entities you own.'}
              </p>
              <button
                onClick={() => addEntry(currentTab)}
                className="inline-flex items-center gap-2 px-6 py-2.5 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add First {currentTab === 'trust' ? 'Trust' : 'Company'}
              </button>
            </div>
          ) : (
            <>
              {/* Pills Navigation - SEPARATED: Items left, Add right */}
              <div className="flex items-center justify-between mb-4">
                <div id={currentTab === 'trust' ? 'trustPills' : 'companyPills'} className="flex items-center gap-2" />
                <button
                  onClick={() => addEntry(currentTab)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-dashed border-gray-300 text-gray-500 hover:border-blue-500 hover:text-blue-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add {currentTab === 'trust' ? 'Trust' : 'Company'}
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


    </FactFindLayout>
  );
}