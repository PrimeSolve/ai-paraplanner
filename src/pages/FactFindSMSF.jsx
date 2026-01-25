import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import FactFindLayout from '../components/factfind/FactFindLayout';
import FactFindHeader from '../components/factfind/FactFindHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowRight, ArrowLeft } from 'lucide-react';

const MAX_SMSF = 2;

export default function FactFindSMSF() {
  const navigate = useNavigate();
  const [factFind, setFactFind] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [smsfCount, setSmsfCount] = useState(0);

  const globalStateRef = React.useRef({
    smsf: {
      funds: [],
      activeIndex: 0
    }
  });

  // ============================================
  // CORE DOM MANIPULATION
  // ============================================

  const wrapForTab = useCallback(() => {
    return document.getElementById('smsfWrap');
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

  const readTabToArray = useCallback(() => {
    const wrap = wrapForTab();
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

      // Read account rows
      const acctRows = card.querySelectorAll('tbody.acct-list tr');
      data.accounts = Array.from(acctRows).map(row => ({
        acct_owner: row.querySelector('select[name="acct_owner"]')?.value || '',
        tax_env: row.querySelector('select[name="tax_env"]')?.value || '',
        tax_free_amt: row.querySelector('input[name="tax_free_amt"]')?.value || '',
        tax_free_pct: row.querySelector('input[name="tax_free_pct"]')?.value || '',
        unp_amt: row.querySelector('input[name="unp_amt"]')?.value || '',
        super_guarantee: row.querySelector('select[name="super_guarantee"]')?.value || '',
        salary_sacrifice: row.querySelector('input[name="salary_sacrifice"]')?.value || '',
        after_tax: row.querySelector('input[name="after_tax"]')?.value || ''
      }));

      // Read beneficiary rows
      const benefRows = card.querySelectorAll('tbody.benef-list tr');
      data.beneficiaries = Array.from(benefRows).map(row => ({
        benef_account: row.querySelector('select[name="benef_account"]')?.value || '',
        benef_who: row.querySelector('select[name="benef_who"]')?.value || '',
        benef_type: row.querySelector('select[name="benef_type"]')?.value || '',
        benef_entitlement: row.querySelector('input[name="benef_entitlement"]')?.value || ''
      }));

      return data;
    });
  }, [wrapForTab]);

  // ============================================
  // RENUMBER ENTRIES
  // ============================================

  const renumber = useCallback(() => {
    const wrap = wrapForTab();
    if (!wrap) return;

    [...wrap.querySelectorAll('.entry')].forEach((card, i) => {
      const idxSpan = card.querySelector('.idx');
      if (idxSpan) idxSpan.textContent = i + 1;

      card.querySelectorAll('input[type="radio"][name^="fund_type"]')
        .forEach(r => { r.name = 'fund_type__' + (i + 1); });
      card.querySelectorAll('input[type="radio"][name^="trustee_type"]')
        .forEach(r => { r.name = 'trustee_type__' + (i + 1); });
      card.querySelectorAll('input[type="radio"][name^="acct_type"]')
        .forEach(r => { r.name = 'acct_type__' + (i + 1); });
    });
  }, [wrapForTab]);

  // ============================================
  // UPDATE PILL NAVIGATION
  // ============================================

  const updatePills = useCallback((index) => {
    const pillsContainer = document.getElementById('smsfPills');
    if (!pillsContainer) return;

    pillsContainer.innerHTML = '';
    const wrap = wrapForTab();
    if (!wrap) return;

    const cards = [...wrap.querySelectorAll('.entry')];

    cards.forEach((card, i) => {
      const pill = document.createElement('button');
      const isActive = i === index;
      pill.type = 'button';

      const nameInput = card.querySelector('input[name="smsf_name"]');
      const displayName = nameInput?.value?.trim() || `SMSF ${i + 1}`;

      pill.className = `px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
        isActive
          ? 'bg-blue-600 text-white shadow-md'
          : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
      }`;
      pill.textContent = displayName;

      pill.onclick = (e) => {
        e.preventDefault();
        setActiveIndex(i);
        showOnlyActiveEntry(i);
      };

      pillsContainer.appendChild(pill);
    });
  }, [wrapForTab]);

  // ============================================
  // SHOW ONLY ACTIVE ENTRY
  // ============================================

  const showOnlyActiveEntry = useCallback((index) => {
    const wrap = wrapForTab();
    if (!wrap) return;

    const cards = [...wrap.querySelectorAll('.entry')];
    cards.forEach((card, i) => {
      card.style.display = i === index ? '' : 'none';
    });
  }, [wrapForTab]);

  // ============================================
  // FILL CARD WITH DATA
  // ============================================

  const fillCardFromData = useCallback((card, data) => {
    if (!data || !card) return;

    const nameInput = card.querySelector('input[name="smsf_name"]');
    if (nameInput && data.smsf_name) nameInput.value = data.smsf_name;

    const fundTypeRadios = card.querySelectorAll('input[type="radio"][name^="fund_type"]');
    if (data.fund_type) {
      fundTypeRadios.forEach(r => { r.checked = r.value === data.fund_type; });
    }

    const trusteeTypeRadios = card.querySelectorAll('input[type="radio"][name^="trustee_type"]');
    if (data.trustee_type) {
      trusteeTypeRadios.forEach(r => { r.checked = r.value === data.trustee_type; });
    }

    const acctTypeRadios = card.querySelectorAll('input[type="radio"][name^="acct_type"]');
    if (data.acct_type) {
      acctTypeRadios.forEach(r => { r.checked = r.value === data.acct_type; });
    }

    const balanceInput = card.querySelector('input[name="smsf_balance"]');
    if (balanceInput && data.smsf_balance) balanceInput.value = data.smsf_balance;

    const trusteeInput = card.querySelector('input[name="individual_trustee"]');
    if (trusteeInput && data.individual_trustee) trusteeInput.value = data.individual_trustee;

    // Fill accounts
    if (Array.isArray(data.accounts) && data.accounts.length > 0) {
      const acctContainer = card.querySelector('.acct-list');
      if (acctContainer) {
        acctContainer.innerHTML = '';
        data.accounts.forEach((acct) => {
          const row = createAccountRow(card, acct);
          acctContainer.appendChild(row);
        });
      }
      const acctTable = card.querySelector('.acct-list-table');
      const acctEmpty = card.querySelector('.acct-list-empty');
      const acctBtn = card.querySelector('.add-acct');
      acctTable?.classList.remove('hidden');
      acctEmpty?.classList.add('hidden');
      acctBtn?.classList.remove('hidden');
    }

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
  }, []);

  // ============================================
  // CREATE ACCOUNT ROW
  // ============================================

  const createAccountRow = useCallback((card, data = {}) => {
   const row = document.createElement('tr');
   row.className = 'acct-row border-b border-slate-100 hover:bg-orange-50/50';

   const clientName = factFind?.personal?.client?.first_name 
     ? `${factFind.personal.client.first_name} ${factFind.personal.client.last_name}`.trim()
     : 'Client';

   const partnerName = factFind?.personal?.partner?.first_name 
     ? `${factFind.personal.partner.first_name} ${factFind.personal.partner.last_name}`.trim()
     : null;

   const partnerOption = partnerName ? `<option value="partner">${partnerName}</option>` : '';

   row.innerHTML = `
     <td class="py-2 px-2">
       <select name="acct_owner" class="w-full px-2 py-1.5 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500">
         <option value="">Select…</option>
         <option value="client">${clientName}</option>
         ${partnerName ? `<option value="partner">${partnerName}</option>` : ''}
       </select>
     </td>
     <td class="py-2 px-2">
       <select name="tax_env" class="w-full px-2 py-1.5 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500">
         <option value="">Select…</option>
         <option value="1">Superannuation</option>
         <option value="2">Pension</option>
       </select>
     </td>
     <td class="py-2 px-2">
       <div class="flex items-center">
         <span class="text-slate-400 text-xs mr-1">$</span>
         <input type="number" name="tax_free_amt" placeholder="0.00" step="0.01" min="0" class="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
       </div>
     </td>
     <td class="py-2 px-2">
       <input type="text" name="tax_free_pct" placeholder="e.g. 30%" class="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
     </td>
     <td class="py-2 px-2">
       <div class="flex items-center">
         <span class="text-slate-400 text-xs mr-1">$</span>
         <input type="number" name="unp_amt" placeholder="0.00" step="0.01" min="0" class="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
       </div>
     </td>
     <td class="py-2 px-2">
       <select name="super_guarantee" class="w-full px-2 py-1.5 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500">
         <option value="">Select…</option>
         <option value="1">Yes</option>
         <option value="2">No</option>
       </select>
     </td>
     <td class="py-2 px-2">
       <input type="text" name="salary_sacrifice" placeholder="" class="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
     </td>
     <td class="py-2 px-2">
       <div class="flex items-center">
         <span class="text-slate-400 text-xs mr-1">$</span>
         <input type="number" name="after_tax" placeholder="0.00" step="0.01" min="0" class="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
       </div>
     </td>
     <td class="py-2 px-2 text-center">
       <button type="button" class="remove-acct text-red-500 hover:text-red-700 text-xs font-medium">Remove</button>
     </td>
   `;

   const removeBtn = row.querySelector('.remove-acct');
   removeBtn.onclick = (e) => {
     e.preventDefault();
     row.remove();
   };

   if (data?.acct_owner) row.querySelector('select[name="acct_owner"]').value = data.acct_owner;
   if (data?.tax_env) row.querySelector('select[name="tax_env"]').value = data.tax_env;
   if (data?.tax_free_amt) row.querySelector('input[name="tax_free_amt"]').value = data.tax_free_amt;
   if (data?.tax_free_pct) row.querySelector('input[name="tax_free_pct"]').value = data.tax_free_pct;
   if (data?.unp_amt) row.querySelector('input[name="unp_amt"]').value = data.unp_amt;
   if (data?.super_guarantee) row.querySelector('select[name="super_guarantee"]').value = data.super_guarantee;
   if (data?.salary_sacrifice) row.querySelector('input[name="salary_sacrifice"]').value = data.salary_sacrifice;
   if (data?.after_tax) row.querySelector('input[name="after_tax"]').value = data.after_tax;

   return row;
  }, [factFind]);

  // ============================================
  // CREATE BENEFICIARY ROW
  // ============================================

  const createBeneficiaryRow = useCallback((card, data = {}) => {
    const row = document.createElement('tr');
    row.className = 'benef-row border-b border-slate-100 hover:bg-purple-50/50';

    const clientName = factFind?.personal?.client?.first_name 
      ? `${factFind.personal.client.first_name} ${factFind.personal.client.last_name}`.trim()
      : 'Client';

    const partnerName = factFind?.personal?.partner?.first_name 
      ? `${factFind.personal.partner.first_name} ${factFind.personal.partner.last_name}`.trim()
      : null;

    row.innerHTML = `
      <td class="py-2 px-2">
        <select name="benef_account" class="w-full px-2 py-1.5 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500">
          <option value="">Select…</option>
        </select>
      </td>
      <td class="py-2 px-2">
        <select name="benef_who" class="w-full px-2 py-1.5 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500">
          <option value="">Select entity…</option>
          <option value="client">${clientName}</option>
          ${partnerName ? `<option value="partner">${partnerName}</option>` : ''}
        </select>
      </td>
      <td class="py-2 px-2">
        <select name="benef_type" class="w-full px-2 py-1.5 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500">
          <option value="">Select…</option>
          <option value="1">Binding</option>
          <option value="2">Non binding</option>
          <option value="3">Reversionary</option>
          <option value="4">Not sure</option>
        </select>
      </td>
      <td class="py-2 px-2">
        <input type="text" name="benef_entitlement" placeholder="e.g. 50%" class="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
      </td>
      <td class="py-2 px-2 text-center">
        <button type="button" class="remove-benef text-red-500 hover:text-red-700 text-xs font-medium">Remove</button>
      </td>
    `;

    const removeBtn = row.querySelector('.remove-benef');
    removeBtn.onclick = (e) => {
      e.preventDefault();
      row.remove();
    };

    if (data?.benef_account) row.querySelector('select[name="benef_account"]').value = data.benef_account;
    if (data?.benef_who) row.querySelector('select[name="benef_who"]').value = data.benef_who;
    if (data?.benef_type) row.querySelector('select[name="benef_type"]').value = data.benef_type;
    if (data?.benef_entitlement) row.querySelector('input[name="benef_entitlement"]').value = data.benef_entitlement;

    return row;
  }, [factFind]);

  // ============================================
  // ADD ENTRY
  // ============================================

  const addEntry = useCallback((existingData = null) => {
    if (smsfCount >= MAX_SMSF) {
      toast.error(`Maximum ${MAX_SMSF} SMSFs allowed`);
      return;
    }

    const wrap = wrapForTab();
    if (!wrap) return;

    const node = cloneTemplateDiv('smsfTemplate');
    if (!node) return;

    wrap.appendChild(node);

    if (existingData) {
      fillCardFromData(node, existingData);
    }

    renumber();
    const newCount = wrap.querySelectorAll('.entry').length;
    setSmsfCount(newCount);

    const newIndex = newCount - 1;
    setActiveIndex(newIndex);
    updatePills(newIndex);
    showOnlyActiveEntry(newIndex);
  }, [wrapForTab, cloneTemplateDiv, fillCardFromData, renumber, updatePills, showOnlyActiveEntry, smsfCount]);

  // ============================================
  // REMOVE ENTRY
  // ============================================

  const removeEntry = useCallback((node) => {
    node.remove();
    const wrap = wrapForTab();
    const remaining = wrap.querySelectorAll('.entry').length;
    renumber();
    setSmsfCount(remaining);

    if (remaining > 0) {
      const newIndex = Math.max(0, remaining - 1);
      setActiveIndex(newIndex);
      showOnlyActiveEntry(newIndex);
      updatePills(newIndex);
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
          if (finds[0].smsf) {
            globalStateRef.current.smsf = {
              ...finds[0].smsf,
              activeIndex: finds[0].smsf.activeIndex || 0
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
  // INITIALIZE DOM
  // ============================================

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!loading && factFind?.id) {
      setTimeout(() => {
        const wrap = wrapForTab();
        if (wrap) wrap.innerHTML = '';

        if (globalStateRef.current.smsf.funds?.length > 0) {
          globalStateRef.current.smsf.funds.forEach((smsfData) => {
            addEntry(smsfData);
          });
        }

        const activeIdx = globalStateRef.current.smsf.activeIndex || 0;
        setActiveIndex(activeIdx);
        updatePills(activeIdx);
        showOnlyActiveEntry(activeIdx);
      }, 50);
    }
  }, [loading, factFind?.id, addEntry, updatePills, showOnlyActiveEntry]);

  // ============================================
  // SETUP INPUT LISTENERS
  // ============================================

  useEffect(() => {
    const updateTableVisibility = (card, type) => {
      const container = type === 'acct' ? card.querySelector('.acct-container') : card.querySelector('.benef-container');
      const table = type === 'acct' ? card.querySelector('.acct-list-table') : card.querySelector('.benef-list-table');
      const empty = type === 'acct' ? card.querySelector('.acct-list-empty') : card.querySelector('.benef-list-empty');
      const addBtn = type === 'acct' ? card.querySelector('.add-acct') : card.querySelector('.add-benef');
      const list = type === 'acct' ? card.querySelector('.acct-list') : card.querySelector('.benef-list');

      const hasRows = list.querySelectorAll(type === 'acct' ? '.acct-row' : '.benef-row').length > 0;

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
      if (e.target.closest('.add-first-acct') || e.target.closest('.add-acct')) {
        e.preventDefault();
        const card = e.target.closest('.entry');
        const list = card.querySelector('.acct-list');
        const row = createAccountRow(card);
        list.appendChild(row);
        updateTableVisibility(card, 'acct');
      }
      if (e.target.closest('.add-first-benef') || e.target.closest('.add-benef')) {
        e.preventDefault();
        const card = e.target.closest('.entry');
        const list = card.querySelector('.benef-list');
        const row = createBeneficiaryRow(card);
        list.appendChild(row);
        updateTableVisibility(card, 'benef');
      }
      if (e.target.closest('.entry-remove')) {
        e.preventDefault();
        const node = e.target.closest('.entry');
        removeEntry(node);
      }
      if (e.target.closest('.remove-acct')) {
        const card = e.target.closest('.entry');
        setTimeout(() => updateTableVisibility(card, 'acct'), 0);
      }
      if (e.target.closest('.remove-benef')) {
        const card = e.target.closest('.entry');
        setTimeout(() => updateTableVisibility(card, 'benef'), 0);
      }
    };

    const inputHandler = (e) => {
      if (e.target.matches('input[name="smsf_name"]')) {
        updatePills(activeIndex);
      }
      clearTimeout(window._smsfSaveTimeout);
      window._smsfSaveTimeout = setTimeout(() => {
        saveSmsfState();
      }, 500);
    };

    document.addEventListener('click', clickHandler);
    document.addEventListener('input', inputHandler);
    return () => {
      document.removeEventListener('click', clickHandler);
      document.removeEventListener('input', inputHandler);
    };
  }, [activeIndex, updatePills, removeEntry, createAccountRow, createBeneficiaryRow]);

  // ============================================
  // SAVE STATE
  // ============================================

  const saveSmsfState = useCallback(async () => {
    if (!factFind?.id) return;

    try {
      globalStateRef.current.smsf.funds = readTabToArray();
      globalStateRef.current.smsf.activeIndex = activeIndex;

      await base44.entities.FactFind.update(factFind.id, {
        smsf: globalStateRef.current.smsf
      });
    } catch (error) {
      console.error('Save failed:', error);
    }
  }, [factFind?.id, readTabToArray, activeIndex]);

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
      if (!sectionsCompleted.includes('smsf')) {
        sectionsCompleted.push('smsf');
      }

      await base44.entities.FactFind.update(factFind.id, {
        smsf: globalStateRef.current.smsf,
        sections_completed: sectionsCompleted,
        completion_percentage: Math.round((sectionsCompleted.length / 14) * 100)
      });

      navigate(createPageUrl('FactFindSuperannuation') + `?id=${factFind.id}`);
    } catch (error) {
      toast.error('Failed to save data');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate(createPageUrl('FactFindTrusts') + `?id=${factFind?.id || ''}`);
  };

  if (loading) {
    return (
      <FactFindLayout currentSection="smsf" factFind={factFind}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </FactFindLayout>
    );
  }

  return (
    <FactFindLayout currentSection="smsf" factFind={factFind}>
      <FactFindHeader
        title="SMSF"
        description="Add details about your SMSF, including trustees, members, and pension accounts."
        factFind={factFind}
      />

      {/* Hidden Template */}
      <div id="smsfTemplate" style={{ display: 'none' }}>
        <div className="entry bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-4">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">SMSF <span className="idx">1</span></h3>
              <p className="text-xs text-slate-500 mt-1">Fill in the details below</p>
            </div>
            <button type="button" className="entry-remove px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100">Remove</button>
          </div>

          <div className="space-y-6">
            {/* SMSF Details Section */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="text-sm font-semibold text-blue-700 mb-4 flex items-center gap-2"><span className="w-1 h-5 bg-blue-600 rounded"></span>💰 SMSF Details</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">SMSF name</label>
                  <input type="text" name="smsf_name" placeholder="e.g. Smith Family Super Fund" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">Type of fund</label>
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="fund_type__1" value="1" className="w-4 h-4" />
                        <span className="text-sm text-slate-700">SMSF</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="fund_type__1" value="2" className="w-4 h-4" />
                        <span className="text-sm text-slate-700">SAF</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">Trustee type</label>
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="trustee_type__1" value="1" className="w-4 h-4" />
                        <span className="text-sm text-slate-700">Corporate trustee</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="trustee_type__1" value="2" className="w-4 h-4" />
                        <span className="text-sm text-slate-700">Individual trustee</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-3">What type of accounts does this fund operate?</label>
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="acct_type__1" value="1" className="w-4 h-4" />
                        <span className="text-sm text-slate-700">Pooled</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="acct_type__1" value="2" className="w-4 h-4" />
                        <span className="text-sm text-slate-700">Segregate</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">SMSF balance</label>
                    <div className="flex items-center">
                      <span className="text-slate-500 mr-2">$</span>
                      <input type="number" name="smsf_balance" placeholder="0.00" step="0.01" min="0" className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Individual trustee</label>
                  <input type="text" name="individual_trustee" placeholder="" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>

            {/* Account Information Section */}
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <h4 className="text-sm font-semibold text-orange-700 mb-4 flex items-center gap-2"><span className="w-1 h-5 bg-orange-600 rounded"></span>📊 Account Information</h4>
              
              <div className="acct-container">
                {/* Table with headers */}
                <div className="acct-list-table hidden mb-3 overflow-x-auto">
                  <table className="w-full text-xs border-collapse min-w-[900px]">
                    <thead>
                      <tr className="border-b border-orange-200">
                        <th className="text-left py-2 px-2 font-semibold text-slate-600">Account Owner</th>
                        <th className="text-left py-2 px-2 font-semibold text-slate-600">Tax Environment</th>
                        <th className="text-left py-2 px-2 font-semibold text-slate-600">Tax Free Amt</th>
                        <th className="text-left py-2 px-2 font-semibold text-slate-600">Tax Free %</th>
                        <th className="text-left py-2 px-2 font-semibold text-slate-600">UNP Amount</th>
                        <th className="text-left py-2 px-2 font-semibold text-slate-600">Super Guar?</th>
                        <th className="text-left py-2 px-2 font-semibold text-slate-600">Salary Sac</th>
                        <th className="text-left py-2 px-2 font-semibold text-slate-600">After Tax</th>
                        <th className="w-16"></th>
                      </tr>
                    </thead>
                    <tbody className="acct-list">
                      {/* Account rows go here */}
                    </tbody>
                  </table>
                </div>

                {/* Empty state */}
                <div className="acct-list-empty text-center py-6">
                  <p className="text-sm text-slate-600 mb-3">No accounts added yet</p>
                  <button type="button" className="add-first-acct px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700">+ Add First Account</button>
                </div>

                {/* Add button - only show if accounts exist */}
                <button type="button" className="add-acct hidden px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700">+ Add account</button>
              </div>
            </div>

            {/* Beneficiaries Section */}
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <h4 className="text-sm font-semibold text-purple-700 mb-4 flex items-center gap-2"><span className="w-1 h-5 bg-purple-600 rounded"></span>👥 Beneficiaries</h4>
              
              <div className="benef-container">
                {/* Table with headers */}
                <div className="benef-list-table hidden mb-3 overflow-x-auto">
                  <table className="w-full text-xs border-collapse min-w-[700px]">
                    <thead>
                      <tr className="border-b border-purple-200">
                        <th className="text-left py-2 px-2 font-semibold text-slate-600">Beneficiary Account</th>
                        <th className="text-left py-2 px-2 font-semibold text-slate-600">Who is Beneficiary</th>
                        <th className="text-left py-2 px-2 font-semibold text-slate-600">Beneficiary Type</th>
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
                <div className="benef-list-empty text-center py-6">
                  <p className="text-sm text-slate-600 mb-3">No beneficiaries added yet</p>
                  <button type="button" className="add-first-benef px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700">+ Add First Beneficiary</button>
                </div>

                {/* Add button - only show if beneficiaries exist */}
                <button type="button" className="add-benef hidden px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700">+ Add beneficiary</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="w-full space-y-6">
          <div id="smsfWrap" className="space-y-4" />

          {/* Welcome Screen */}
          {smsfCount === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="text-5xl mb-6">💰</div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Do you have a Self-Managed Super Fund?</h3>
              <p className="text-slate-600 text-center mb-8 max-w-md">Add details about your SMSF, including trustees, members, and pension accounts.</p>
              <Button
                onClick={() => addEntry()}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30"
              >
                + Add SMSF
              </Button>
            </div>
          ) : (
            <>
              {/* Pills Navigation */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                <div id="smsfPills" className="flex gap-2" />
                {smsfCount < MAX_SMSF && (
                  <button
                    onClick={() => addEntry()}
                    className="ml-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0 shadow-sm"
                  >
                    + Add SMSF
                  </button>
                )}
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