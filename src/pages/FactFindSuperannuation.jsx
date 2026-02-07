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
import { ArrowRight, ArrowLeft, Plus, Landmark, DollarSign, Wallet, UserPlus, BarChart3, Settings } from 'lucide-react';

export default function FactFindSuperannuation() {
  const navigate = useNavigate();
  const { factFind, loading: ffLoading } = useFactFind();
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [currentTab, setCurrentTab] = useState('super');
  const [activeIndex, setActiveIndex] = useState(0);
  const [superCount, setSuperCount] = useState(0);
  const [pensionCount, setPensionCount] = useState(0);
  const [annuityCount, setAnnuityCount] = useState(0);

  const globalStateRef = React.useRef({
    super_accounts: [],
    currentTab: 'super',
    activeIdx: {
      super: 0,
      pension: 0,
      annuities: 0
    }
  });

  const wrapForTab = useCallback((tab) => {
    const id = tab === 'super' ? 'superWrap' : tab === 'pension' ? 'pensionWrap' : 'annuitiesWrap';
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
        } else if (input.type === 'checkbox') {
          const baseName = input.name.replace(/__\d+$/, '');
          if (!data[baseName]) data[baseName] = [];
          if (input.checked) data[baseName].push(input.value);
        } else if (input.type !== 'button') {
          data[input.name] = input.value;
        }
      });

      // Multi-select
      const multiSelects = card.querySelectorAll('select[multiple]');
      multiSelects.forEach(select => {
        data[select.name] = [...select.selectedOptions].map(o => o.value);
      });

      const benefRows = card.querySelectorAll('tbody.benef-list tr');
      data.beneficiaries = Array.from(benefRows).map(row => ({
        benef_who: row.querySelector('select[name="benef_who"]')?.value || '',
        benef_pct: row.querySelector('input[name="benef_pct"]')?.value || '',
        benef_type: row.querySelector('select[name="benef_type"]')?.value || ''
      }));

      const portfolioRows = card.querySelectorAll('tbody.portfolio-list tr');
      data.portfolio = Array.from(portfolioRows).map(row => ({
        asset_type: row.querySelector('select[name="asset_type"]')?.value || '',
        asset_desc: row.querySelector('input[name="asset_desc"]')?.value || '',
        portfolio_pct: row.querySelector('input[name="portfolio_pct"]')?.value || ''
      }));

      return data;
    });
  }, [wrapForTab]);

  const renumber = useCallback((tab) => {
    const wrap = wrapForTab(tab);
    if (!wrap) return;

    [...wrap.querySelectorAll('.entry')].forEach((card, i) => {
      const idxSpan = card.querySelector('.idx');
      if (idxSpan) idxSpan.textContent = i + 1;

      if (tab === 'super') {
        card.querySelectorAll('input[type="radio"][name^="sg"]')
          .forEach(r => { r.name = 'sg__' + (i + 1); });
      }

      if (tab === 'annuities') {
        card.querySelectorAll('input[type="radio"][name^="a_type"]')
          .forEach(r => { r.name = 'a_type__' + (i + 1); });
        card.querySelectorAll('input[type="radio"][name^="a_life"]')
          .forEach(r => { r.name = 'a_life__' + (i + 1); });
        card.querySelectorAll('input[type="radio"][name^="a_rev"]')
          .forEach(r => { r.name = 'a_rev__' + (i + 1); });
      }
    });
  }, [wrapForTab]);

  const updatePills = useCallback((tab, index) => {
    const pillsId = tab === 'super' ? 'superPills' : tab === 'pension' ? 'pensionPills' : 'annuitiesPills';
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

      const nameInput = card.querySelector('input[name="fund_name"]');
      let displayName = nameInput?.value?.trim();
      if (!displayName) {
        displayName = tab === 'super' ? `Super ${i + 1}` : tab === 'pension' ? `Pension ${i + 1}` : `Annuity ${i + 1}`;
      }

      pill.className = `px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
        isActive
          ? 'bg-white border-blue-500 text-blue-700 shadow-sm'
          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
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

    const nameInput = card.querySelector('input[name="fund_name"]');
    if (nameInput && data.fund_name) nameInput.value = data.fund_name;

    if (tab === 'super') {
      const ownerSelect = card.querySelector('select[name="owner"]');
      if (ownerSelect) {
        // Populate with principal names
        ownerSelect.innerHTML = '<option value="">Select owner…</option>';
        const clientName = factFind?.personal?.client?.first_name 
          ? `${factFind.personal.client.first_name} ${factFind.personal.client.last_name}`.trim()
          : null;
        const partnerName = factFind?.personal?.partner?.first_name 
          ? `${factFind.personal.partner.first_name} ${factFind.personal.partner.last_name}`.trim()
          : null;
        
        if (clientName) ownerSelect.innerHTML += `<option value="client">${clientName}</option>`;
        if (partnerName) ownerSelect.innerHTML += `<option value="partner">${partnerName}</option>`;
        
        if (data.owner) ownerSelect.value = data.owner;
      }

      const balanceInput = card.querySelector('input[name="balance"]');
      if (balanceInput && data.balance) balanceInput.value = data.balance;

      if (data.sg) {
        card.querySelectorAll('input[type="radio"][name^="sg"]').forEach(r => {
          r.checked = r.value === data.sg;
        });
      }

      const productInput = card.querySelector('input[name="product"]');
      if (productInput && data.product) productInput.value = data.product;

      const salarySacInput = card.querySelector('input[name="salary_sacrifice"]');
      if (salarySacInput && data.salary_sacrifice) salarySacInput.value = data.salary_sacrifice;

      const afterTaxInput = card.querySelector('input[name="after_tax"]');
      if (afterTaxInput && data.after_tax) afterTaxInput.value = data.after_tax;

      const spouseInput = card.querySelector('input[name="spouse_received"]');
      if (spouseInput && data.spouse_received) spouseInput.value = data.spouse_received;

      const splitInput = card.querySelector('input[name="split_received"]');
      if (splitInput && data.split_received) splitInput.value = data.split_received;

      const concessionalInput = card.querySelector('input[name="concessional"]');
      if (concessionalInput && data.concessional) concessionalInput.value = data.concessional;

      const unpInput = card.querySelector('input[name="unp"]');
      if (unpInput && data.unp) unpInput.value = data.unp;

      const taxableInput = card.querySelector('input[name="taxable_portion"]');
      if (taxableInput && data.taxable_portion) taxableInput.value = data.taxable_portion;

      const taxFreeInput = card.querySelector('input[name="tax_free"]');
      if (taxFreeInput && data.tax_free) taxFreeInput.value = data.tax_free;
    }

    if (tab === 'pension') {
      const ownerSelect = card.querySelector('select[name="owner"]');
      if (ownerSelect) {
        // Populate with principal names
        ownerSelect.innerHTML = '<option value="">Select owner…</option>';
        const clientName = factFind?.personal?.client?.first_name 
          ? `${factFind.personal.client.first_name} ${factFind.personal.client.last_name}`.trim()
          : null;
        const partnerName = factFind?.personal?.partner?.first_name 
          ? `${factFind.personal.partner.first_name} ${factFind.personal.partner.last_name}`.trim()
          : null;
        
        if (clientName) ownerSelect.innerHTML += `<option value="client">${clientName}</option>`;
        if (partnerName) ownerSelect.innerHTML += `<option value="partner">${partnerName}</option>`;
        
        if (data.owner) ownerSelect.value = data.owner;
      }

      const pTypeSelect = card.querySelector('select[name="p_type"]');
      if (pTypeSelect && data.p_type) pTypeSelect.value = data.p_type;

      const pBalanceInput = card.querySelector('input[name="p_balance"]');
      if (pBalanceInput && data.p_balance) pBalanceInput.value = data.p_balance;

      const pProviderInput = card.querySelector('input[name="p_provider"]');
      if (pProviderInput && data.p_provider) pProviderInput.value = data.p_provider;

      const pIncomeInput = card.querySelector('input[name="p_income"]');
      if (pIncomeInput && data.p_income) pIncomeInput.value = data.p_income;

      const pFrequencySelect = card.querySelector('select[name="p_frequency"]');
      if (pFrequencySelect && data.p_frequency) pFrequencySelect.value = data.p_frequency;

      const pDeductibleInput = card.querySelector('input[name="p_deductible"]');
      if (pDeductibleInput && data.p_deductible) pDeductibleInput.value = data.p_deductible;

      const pTaxfreePctInput = card.querySelector('input[name="p_taxfree_pct"]');
      if (pTaxfreePctInput && data.p_taxfree_pct) pTaxfreePctInput.value = data.p_taxfree_pct;

      const pIndexRateInput = card.querySelector('input[name="p_index_rate"]');
      if (pIndexRateInput && data.p_index_rate) pIndexRateInput.value = data.p_index_rate;

      const pPurchaseInput = card.querySelector('input[name="p_purchase"]');
      if (pPurchaseInput && data.p_purchase) pPurchaseInput.value = data.p_purchase;

      const pStartInput = card.querySelector('input[name="p_start"]');
      if (pStartInput && data.p_start) pStartInput.value = data.p_start;

      const pTermInput = card.querySelector('input[name="p_term"]');
      if (pTermInput && data.p_term) pTermInput.value = data.p_term;
    }

    if (tab === 'annuities') {
      const ownersSelect = card.querySelector('select[name="owners"]');
      if (ownersSelect) {
        // Populate with principal names
        ownersSelect.innerHTML = '';
        const clientName = factFind?.personal?.client?.first_name 
          ? `${factFind.personal.client.first_name} ${factFind.personal.client.last_name}`.trim()
          : null;
        const partnerName = factFind?.personal?.partner?.first_name 
          ? `${factFind.personal.partner.first_name} ${factFind.personal.partner.last_name}`.trim()
          : null;
        
        if (clientName) {
          const opt = document.createElement('option');
          opt.value = 'client';
          opt.textContent = clientName;
          ownersSelect.appendChild(opt);
        }
        if (partnerName) {
          const opt = document.createElement('option');
          opt.value = 'partner';
          opt.textContent = partnerName;
          ownersSelect.appendChild(opt);
        }
        
        if (Array.isArray(data.owners)) {
          [...ownersSelect.options].forEach(opt => {
            opt.selected = data.owners.includes(opt.value);
          });
        }
      }

      if (data.a_type) {
        card.querySelectorAll('input[type="radio"][name^="a_type"]').forEach(r => {
          r.checked = r.value === data.a_type;
        });
      }

      if (data.a_life) {
        card.querySelectorAll('input[type="radio"][name^="a_life"]').forEach(r => {
          r.checked = r.value === data.a_life;
        });
      }

      const aPurchaseDateInput = card.querySelector('input[name="a_purchase_date"]');
      if (aPurchaseDateInput && data.a_purchase_date) aPurchaseDateInput.value = data.a_purchase_date;

      const aPurchasePriceInput = card.querySelector('input[name="a_purchase_price"]');
      if (aPurchasePriceInput && data.a_purchase_price) aPurchasePriceInput.value = data.a_purchase_price;

      const aResidualInput = card.querySelector('input[name="a_residual"]');
      if (aResidualInput && data.a_residual) aResidualInput.value = data.a_residual;

      const aTermInput = card.querySelector('input[name="a_term"]');
      if (aTermInput && data.a_term) aTermInput.value = data.a_term;

      const aIncomeInput = card.querySelector('input[name="a_income"]');
      if (aIncomeInput && data.a_income) aIncomeInput.value = data.a_income;

      const aDeductibleInput = card.querySelector('input[name="a_deductible"]');
      if (aDeductibleInput && data.a_deductible) aDeductibleInput.value = data.a_deductible;

      const aTaxfreePctInput = card.querySelector('input[name="a_taxfree_pct"]');
      if (aTaxfreePctInput && data.a_taxfree_pct) aTaxfreePctInput.value = data.a_taxfree_pct;

      const aIndexRateInput = card.querySelector('input[name="a_index_rate"]');
      if (aIndexRateInput && data.a_index_rate) aIndexRateInput.value = data.a_index_rate;

      if (data.a_rev) {
        card.querySelectorAll('input[type="radio"][name^="a_rev"]').forEach(r => {
          r.checked = r.value === data.a_rev;
        });
      }
    }

    if (tab !== 'annuities' && Array.isArray(data.beneficiaries) && data.beneficiaries.length > 0) {
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

    if (tab !== 'annuities' && Array.isArray(data.portfolio) && data.portfolio.length > 0) {
      const portfolioContainer = card.querySelector('.portfolio-list');
      if (portfolioContainer) {
        portfolioContainer.innerHTML = '';
        data.portfolio.forEach((port) => {
          const row = createPortfolioRow(card, port);
          portfolioContainer.appendChild(row);
        });
      }
      const portfolioTable = card.querySelector('.portfolio-list-table');
      const portfolioEmpty = card.querySelector('.portfolio-list-empty');
      const portfolioBtn = card.querySelector('.add-portfolio');
      portfolioTable?.classList.remove('hidden');
      portfolioEmpty?.classList.add('hidden');
      portfolioBtn?.classList.remove('hidden');
    }
  }, []);

  const createBeneficiaryRow = useCallback((card, data = {}) => {
    const row = document.createElement('tr');
    row.className = 'benef-row border-b border-slate-100 hover:bg-purple-50/50';

    const clientName = factFind?.personal?.client?.first_name 
      ? `${factFind.personal.client.first_name} ${factFind.personal.client.last_name}`.trim()
      : 'Client';

    const partnerName = factFind?.personal?.partner?.first_name 
      ? `${factFind.personal.partner.first_name} ${factFind.personal.partner.last_name}`.trim()
      : null;

    const childrenOptions = factFind?.dependants?.children
      ?.map((c, i) => `<option value="child-${i}">${c.child_name || `Child ${i + 1}`}</option>`)
      .join('') || '';

    const dependantsOptions = factFind?.dependants?.dependants_list
      ?.map((d, i) => `<option value="dependent-${i}">${d.dep_name || `Dependant ${i + 1}`}</option>`)
      .join('') || '';

    row.innerHTML = `
      <td class="py-2 px-2">
        <select name="benef_who" class="w-full px-2 py-1.5 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500">
          <option value="">Select…</option>
          <option value="client">${clientName}</option>
          ${partnerName ? `<option value="partner">${partnerName}</option>` : ''}
          ${childrenOptions}
          ${dependantsOptions}
        </select>
      </td>
      <td class="py-2 px-2">
        <input type="text" name="benef_pct" placeholder="e.g. 50%" class="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
      </td>
      <td class="py-2 px-2">
        <select name="benef_type" class="w-full px-2 py-1.5 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500">
          <option value="">Select…</option>
          <option value="1">Binding</option>
          <option value="2">Non-binding</option>
          <option value="3">Reversionary</option>
        </select>
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

    if (data?.benef_who) row.querySelector('select[name="benef_who"]').value = data.benef_who;
    if (data?.benef_pct) row.querySelector('input[name="benef_pct"]').value = data.benef_pct;
    if (data?.benef_type) row.querySelector('select[name="benef_type"]').value = data.benef_type;

    return row;
  }, [factFind]);

  const createPortfolioRow = useCallback((card, data = {}) => {
    const row = document.createElement('tr');
    row.className = 'portfolio-row border-b border-slate-100 hover:bg-orange-50/50';

    row.innerHTML = `
      <td class="py-2 px-2">
        <select name="asset_type" class="w-full px-2 py-1.5 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500">
          <option value="">Select…</option>
          <option value="12">Australian equities</option>
          <option value="13">International equities</option>
          <option value="14">Australian fixed interest</option>
          <option value="15">International fixed interest</option>
          <option value="16">Property</option>
          <option value="17">Cash</option>
          <option value="18">Alternatives</option>
        </select>
      </td>
      <td class="py-2 px-2">
        <input type="text" name="asset_desc" placeholder="Notes / product / code" class="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
      </td>
      <td class="py-2 px-2">
        <input type="number" name="portfolio_pct" placeholder="0.00" step="0.01" min="0" class="w-full px-2 py-1.5 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
      </td>
      <td class="py-2 px-2 text-center">
        <button type="button" class="remove-portfolio text-red-500 hover:text-red-700 text-xs font-medium">Remove</button>
      </td>
    `;

    const removeBtn = row.querySelector('.remove-portfolio');
    removeBtn.onclick = (e) => {
      e.preventDefault();
      row.remove();
    };

    if (data?.asset_type) row.querySelector('select[name="asset_type"]').value = data.asset_type;
    if (data?.asset_desc) row.querySelector('input[name="asset_desc"]').value = data.asset_desc;
    if (data?.portfolio_pct) row.querySelector('input[name="portfolio_pct"]').value = data.portfolio_pct;

    return row;
  }, []);

  const addEntry = useCallback((tab, existingData = null) => {
    const wrap = wrapForTab(tab);
    if (!wrap) return;

    const templateId = tab === 'super' ? 'superTemplate' : tab === 'pension' ? 'pensionTemplate' : 'annuitiesTemplate';
    const node = cloneTemplateDiv(templateId);
    if (!node) return;

    wrap.appendChild(node);

    if (existingData) {
      fillCardFromData(node, tab, existingData);
    }

    renumber(tab);
    const newCount = wrap.querySelectorAll('.entry').length;
    if (tab === 'super') {
      setSuperCount(newCount);
    } else if (tab === 'pension') {
      setPensionCount(newCount);
    } else {
      setAnnuityCount(newCount);
    }

    const newIndex = newCount - 1;
    setActiveIndex(newIndex);
    updatePills(tab, newIndex);
    showOnlyActiveEntry(tab, newIndex);
  }, [wrapForTab, cloneTemplateDiv, fillCardFromData, renumber, updatePills, showOnlyActiveEntry]);

  const removeEntry = useCallback(async (node, tab) => {
    node.remove();
    const wrap = wrapForTab(tab);
    if (!wrap) return;
    const remaining = wrap.querySelectorAll('.entry').length;
    renumber(tab);

    if (tab === 'super') {
      setSuperCount(remaining);
    } else if (tab === 'pension') {
      setPensionCount(remaining);
    } else {
      setAnnuityCount(remaining);
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
      const superFunds = readTabToArray('super').map(a => ({ ...a, account_type: 'super' }));
      const pensions = readTabToArray('pension').map(a => ({ ...a, account_type: 'pension' }));
      const annuities = readTabToArray('annuities').map(a => ({ ...a, account_type: 'annuity' }));
      
      globalStateRef.current.super_accounts = [...superFunds, ...pensions, ...annuities];
      globalStateRef.current.currentTab = tab;
      globalStateRef.current.activeIdx = {
        super: tab === 'super' ? (remaining > 0 ? Math.max(0, remaining - 1) : 0) : globalStateRef.current.activeIdx?.super || 0,
        pension: tab === 'pension' ? (remaining > 0 ? Math.max(0, remaining - 1) : 0) : globalStateRef.current.activeIdx?.pension || 0,
        annuities: tab === 'annuities' ? (remaining > 0 ? Math.max(0, remaining - 1) : 0) : globalStateRef.current.activeIdx?.annuities || 0
      };

      await base44.entities.FactFind.update(factFind.id, {
        superannuation: {
          super_accounts: globalStateRef.current.super_accounts,
          currentTab: globalStateRef.current.currentTab,
          activeIdx: globalStateRef.current.activeIdx
        }
      });
    }
  }, [wrapForTab, renumber, showOnlyActiveEntry, updatePills, factFind?.id, readTabToArray]);

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
    if (factFind?.id && factFind.superannuation) {
      globalStateRef.current.super_accounts = factFind.superannuation.super_accounts || [];
      globalStateRef.current.currentTab = factFind.superannuation.currentTab || 'super';
      globalStateRef.current.activeIdx = factFind.superannuation.activeIdx || { super: 0, pension: 0, annuities: 0 };
    }
  }, [factFind?.id]);

  useEffect(() => {
    if (!ffLoading && factFind?.id) {
      setTimeout(() => {
        const superWrap = document.getElementById('superWrap');
        const pensionWrap = document.getElementById('pensionWrap');
        const annuitiesWrap = document.getElementById('annuitiesWrap');

        if (superWrap) superWrap.innerHTML = '';
        if (pensionWrap) pensionWrap.innerHTML = '';
        if (annuitiesWrap) annuitiesWrap.innerHTML = '';

        // Load accounts by type
        const superAccounts = globalStateRef.current.super_accounts.filter(a => a.account_type === 'super');
        const pensions = globalStateRef.current.super_accounts.filter(a => a.account_type === 'pension');
        const annuities = globalStateRef.current.super_accounts.filter(a => a.account_type === 'annuity');

        if (superAccounts.length > 0) {
          superAccounts.forEach((data) => {
            addEntry('super', data);
          });
        }

        if (pensions.length > 0) {
          pensions.forEach((data) => {
            addEntry('pension', data);
          });
        }

        if (annuities.length > 0) {
          annuities.forEach((data) => {
            addEntry('annuities', data);
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
    const updateTableVisibility = (card, type) => {
      const table = type === 'benef' ? card.querySelector('.benef-list-table') : card.querySelector('.portfolio-list-table');
      const empty = type === 'benef' ? card.querySelector('.benef-list-empty') : card.querySelector('.portfolio-list-empty');
      const addBtn = type === 'benef' ? card.querySelector('.add-benef') : card.querySelector('.add-portfolio');
      const list = type === 'benef' ? card.querySelector('.benef-list') : card.querySelector('.portfolio-list');

      const hasRows = list.querySelectorAll(type === 'benef' ? 'tr.benef-row' : 'tr.portfolio-row').length > 0;

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
      if (e.target.closest('.add-first-benef') || e.target.closest('.add-benef')) {
        e.preventDefault();
        const card = e.target.closest('.entry');
        const list = card.querySelector('.benef-list');
        const row = createBeneficiaryRow(card);
        list.appendChild(row);
        updateTableVisibility(card, 'benef');
      }
      if (e.target.closest('.add-first-portfolio') || e.target.closest('.add-portfolio')) {
        e.preventDefault();
        const card = e.target.closest('.entry');
        const list = card.querySelector('.portfolio-list');
        const row = createPortfolioRow(card);
        list.appendChild(row);
        updateTableVisibility(card, 'portfolio');
      }
      if (e.target.closest('.entry-remove')) {
        e.preventDefault();
        const node = e.target.closest('.entry');
        removeEntry(node, currentTab);
      }
      if (e.target.closest('.remove-benef')) {
        const card = e.target.closest('.entry');
        setTimeout(() => updateTableVisibility(card, 'benef'), 0);
      }
      if (e.target.closest('.remove-portfolio')) {
        const card = e.target.closest('.entry');
        setTimeout(() => updateTableVisibility(card, 'portfolio'), 0);
      }
    };

    const inputHandler = (e) => {
      if (e.target.matches('input[name="fund_name"]')) {
        updatePills(currentTab, activeIndex);
      }
      clearTimeout(window._superSaveTimeout);
      window._superSaveTimeout = setTimeout(() => {
        saveSuperState();
      }, 500);
    };

    document.addEventListener('click', clickHandler);
    document.addEventListener('input', inputHandler);
    return () => {
      document.removeEventListener('click', clickHandler);
      document.removeEventListener('input', inputHandler);
    };
  }, [currentTab, activeIndex, updatePills, removeEntry, createBeneficiaryRow, createPortfolioRow]);

  const saveSuperState = useCallback(async () => {
    if (!factFind?.id) return;

    try {
      const superFunds = readTabToArray('super').map(a => ({ ...a, account_type: 'super' }));
      const pensions = readTabToArray('pension').map(a => ({ ...a, account_type: 'pension' }));
      const annuities = readTabToArray('annuities').map(a => ({ ...a, account_type: 'annuity' }));
      
      globalStateRef.current.super_accounts = [...superFunds, ...pensions, ...annuities];
      globalStateRef.current.currentTab = currentTab;
      globalStateRef.current.activeIdx = {
        super: currentTab === 'super' ? activeIndex : globalStateRef.current.activeIdx?.super || 0,
        pension: currentTab === 'pension' ? activeIndex : globalStateRef.current.activeIdx?.pension || 0,
        annuities: currentTab === 'annuities' ? activeIndex : globalStateRef.current.activeIdx?.annuities || 0
      };

      await base44.entities.FactFind.update(factFind.id, {
        superannuation: {
          super_accounts: globalStateRef.current.super_accounts,
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
      if (!sectionsCompleted.includes('superannuation')) {
        sectionsCompleted.push('superannuation');
      }

      await base44.entities.FactFind.update(factFind.id, {
        superannuation: {
          super_accounts: globalStateRef.current.super_accounts,
          currentTab: globalStateRef.current.currentTab,
          activeIdx: globalStateRef.current.activeIdx
        },
        sections_completed: sectionsCompleted,
        completion_percentage: Math.round((sectionsCompleted.length / 14) * 100)
      });

      navigate(createPageUrl('FactFindInvestment') + `?id=${factFind.id}`);
    } catch (error) {
      toast.error('Failed to save data');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate(createPageUrl('FactFindSMSF') + `?id=${factFind?.id || ''}`);
  };

  if (ffLoading) {
    return (
      <FactFindLayout currentSection="superannuation" factFind={factFind}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </FactFindLayout>
    );
  }

  const currentCount = currentTab === 'super' ? superCount : currentTab === 'pension' ? pensionCount : annuityCount;
  const tabLabels = { super: 'Superannuation', pension: 'Pension', annuities: 'Annuities' };

  return (
    <FactFindLayout currentSection="superannuation" factFind={factFind}>
      <FactFindHeader
        title="Retirement products"
        description="Record super funds, pensions, and annuities."
        factFind={factFind}
        user={user}
      />

      {/* Hidden Templates */}
      <div id="superTemplate" style={{ display: 'none' }}>
        <div className="entry bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-4">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Superannuation <span className="idx">1</span></h3>
              <p className="text-xs text-slate-500 mt-1">Fill in the details below</p>
            </div>
            <button type="button" className="entry-remove px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100">Remove</button>
          </div>

          <div className="space-y-6">
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-3">
                <h3 className="text-blue-700 font-semibold flex items-center gap-2">
                  <Landmark className="w-5 h-5" />
                  Fund Details
                </h3>
              </div>
              <div className="p-4">
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Fund name</label>
                    <input type="text" name="fund_name" placeholder="e.g. Australian Super" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Product</label>
                    <select name="product" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm">
                      <option value="">Select product…</option>
                    </select>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Owner</label>
                    <select name="owner" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm">
                      <option value="">Select owner…</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Balance</label>
                    <div className="flex items-center">
                      <span className="text-slate-500 mr-2">$</span>
                      <input type="number" name="balance" placeholder="0.00" step="0.01" min="0" className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-green-50 border-l-4 border-green-500 p-3">
                <h3 className="text-green-700 font-semibold flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Contributions
                </h3>
              </div>
              <div className="p-4">
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Super guarantee?</label>
                  <label className="flex items-center gap-2"><input type="radio" name="sg__1" value="1" className="w-4 h-4" /><span className="text-sm">Yes</span></label>
                  <label className="flex items-center gap-2"><input type="radio" name="sg__1" value="2" className="w-4 h-4" /><span className="text-sm">No</span></label>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Salary sacrifice</label>
                  <div className="flex items-center"><span className="text-slate-500 mr-2">$</span><input type="number" name="salary_sacrifice" placeholder="0.00" step="0.01" min="0" className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm" /></div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">After tax</label>
                  <div className="flex items-center"><span className="text-slate-500 mr-2">$</span><input type="number" name="after_tax" placeholder="0.00" step="0.01" min="0" className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm" /></div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Spouse received</label>
                  <div className="flex items-center"><span className="text-slate-500 mr-2">$</span><input type="number" name="spouse_received" placeholder="0.00" step="0.01" min="0" className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm" /></div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Split received</label>
                  <div className="flex items-center"><span className="text-slate-500 mr-2">$</span><input type="number" name="split_received" placeholder="0.00" step="0.01" min="0" className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm" /></div>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Concessional contribution</label>
                <div className="flex items-center"><span className="text-slate-500 mr-2">$</span><input type="number" name="concessional" placeholder="0.00" step="0.01" min="0" className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm" /></div>
              </div>
            </div>
          </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-amber-50 border-l-4 border-amber-500 p-3">
                <h3 className="text-amber-700 font-semibold flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  Tax Components
                </h3>
              </div>
              <div className="p-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">UNP amount</label>
                  <div className="flex items-center"><span className="text-slate-500 mr-2">$</span><input type="number" name="unp" placeholder="0.00" step="0.01" min="0" className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm" /></div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Taxable portion</label>
                  <div className="flex items-center"><span className="text-slate-500 mr-2">$</span><input type="number" name="taxable_portion" placeholder="0.00" step="0.01" min="0" className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm" /></div>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Tax free portion</label>
                <div className="flex items-center"><span className="text-slate-500 mr-2">$</span><input type="number" name="tax_free" placeholder="0.00" step="0.01" min="0" className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm" /></div>
              </div>
            </div>
          </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-amber-50 border-l-4 border-amber-500 p-3">
                <h3 className="text-amber-700 font-semibold flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Beneficiaries
                </h3>
              </div>
              <div className="p-4">
                <div className="benef-container">
                <div className="benef-list-table hidden mb-3 overflow-x-auto">
                  <table className="w-full text-xs border-collapse min-w-[600px]">
                    <thead><tr className="border-b border-purple-200"><th className="text-left py-2 px-2">Who</th><th className="text-left py-2 px-2">%</th><th className="text-left py-2 px-2">Type</th><th className="w-16"></th></tr></thead>
                    <tbody className="benef-list"></tbody>
                  </table>
                </div>
                <div className="benef-list-empty text-center py-4">
                  <p className="text-sm text-slate-600 mb-3">No beneficiaries added yet</p>
                  <button type="button" className="add-first-benef inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Plus className="w-4 h-4" />
                    Add First Beneficiary
                  </button>
                </div>
                <button type="button" className="add-benef hidden inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Plus className="w-4 h-4" />
                  Add Beneficiary
                </button>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-amber-50 border-l-4 border-amber-500 p-3">
                <h3 className="text-amber-700 font-semibold flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Portfolio
                </h3>
              </div>
              <div className="p-4">
                <div className="portfolio-container">
                <div className="portfolio-list-table hidden mb-3 overflow-x-auto">
                  <table className="w-full text-xs border-collapse min-w-[600px]">
                    <thead><tr className="border-b border-orange-200"><th className="text-left py-2 px-2">Asset Type</th><th className="text-left py-2 px-2">Desc</th><th className="text-left py-2 px-2">%</th><th className="w-16"></th></tr></thead>
                    <tbody className="portfolio-list"></tbody>
                  </table>
                </div>
                <div className="portfolio-list-empty text-center py-4">
                  <p className="text-sm text-slate-600 mb-3">No portfolio assets added yet</p>
                  <button type="button" className="add-first-portfolio inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Plus className="w-4 h-4" />
                    Add First Asset
                  </button>
                </div>
                <button type="button" className="add-portfolio hidden inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Plus className="w-4 h-4" />
                  Add Asset
                </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="pensionTemplate" style={{ display: 'none' }}>
        <div className="entry bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-4">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-lg font-bold text-slate-900">Pension <span className="idx">1</span></h3>
            <button type="button" className="entry-remove px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100">Remove</button>
          </div>
          <div className="space-y-6">
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-3">
                <h3 className="text-blue-700 font-semibold flex items-center gap-2">
                  <Landmark className="w-5 h-5" />
                  Pension Details
                </h3>
              </div>
              <div className="p-4">
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Pension name</label>
                  <input type="text" name="fund_name" placeholder="e.g. XYZ Pension" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Owner</label>
                  <select name="owner" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"><option value="">Select owner…</option></select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Type</label>
                  <select name="p_type" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"><option value="">Select…</option><option value="1">Account based</option><option value="2">Term allocated</option><option value="3">Lifetime</option><option value="4">Defined benefit</option><option value="5">Foreign - UK</option><option value="6">Foreign - Other</option><option value="7">Transition to retirement</option></select>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Balance</label>
                  <div className="flex items-center"><span className="text-slate-500 mr-2">$</span><input type="number" name="p_balance" placeholder="0.00" step="0.01" min="0" className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm" /></div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Provider</label>
                  <input type="text" name="p_provider" placeholder="" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
                </div>
              </div>
            </div>
          </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-green-50 border-l-4 border-green-500 p-3">
                <h3 className="text-green-700 font-semibold flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Income
                </h3>
              </div>
              <div className="p-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Income</label>
                  <div className="flex items-center"><span className="text-slate-500 mr-2">$</span><input type="number" name="p_income" placeholder="0.00" step="0.01" min="0" className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm" /></div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Frequency</label>
                  <select name="p_frequency" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"><option value="">Select…</option><option value="1">Weekly</option><option value="2">Fortnightly</option><option value="3">Monthly</option><option value="4">Quarterly</option><option value="5">Annual</option></select>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Deductible amount</label>
                  <div className="flex items-center"><span className="text-slate-500 mr-2">$</span><input type="number" name="p_deductible" placeholder="0.00" step="0.01" min="0" className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm" /></div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Tax free %</label>
                  <input type="text" name="p_taxfree_pct" placeholder="e.g. 50%" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
                </div>
              </div>
            </div>
          </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-amber-50 border-l-4 border-amber-500 p-3">
                <h3 className="text-amber-700 font-semibold flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Settings
                </h3>
              </div>
              <div className="p-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Index rate</label>
                  <input type="text" name="p_index_rate" placeholder="" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Purchase price</label>
                  <div className="flex items-center"><span className="text-slate-500 mr-2">$</span><input type="number" name="p_purchase" placeholder="0.00" step="0.01" min="0" className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm" /></div>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Start date</label>
                  <input type="date" name="p_start" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Term</label>
                  <input type="text" name="p_term" placeholder="" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
                </div>
              </div>
            </div>
          </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-amber-50 border-l-4 border-amber-500 p-3">
                <h3 className="text-amber-700 font-semibold flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Beneficiaries
                </h3>
              </div>
              <div className="p-4">
                <div className="benef-container">
                <div className="benef-list-table hidden mb-3 overflow-x-auto">
                  <table className="w-full text-xs border-collapse min-w-[600px]">
                    <thead><tr className="border-b border-purple-200"><th className="text-left py-2 px-2">Who</th><th className="text-left py-2 px-2">%</th><th className="text-left py-2 px-2">Type</th><th className="w-16"></th></tr></thead>
                    <tbody className="benef-list"></tbody>
                  </table>
                </div>
                <div className="benef-list-empty text-center py-4">
                  <p className="text-sm text-slate-600 mb-3">No beneficiaries added</p>
                  <button type="button" className="add-first-benef inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Plus className="w-4 h-4" />
                    Add First
                  </button>
                </div>
                <button type="button" className="add-benef hidden inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Plus className="w-4 h-4" />
                  Add Beneficiary
                </button>
                </div>
              </div>
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-amber-50 border-l-4 border-amber-500 p-3">
                <h3 className="text-amber-700 font-semibold flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Portfolio
                </h3>
              </div>
              <div className="p-4">
                <div className="portfolio-container">
                <div className="portfolio-list-table hidden mb-3 overflow-x-auto">
                  <table className="w-full text-xs border-collapse min-w-[600px]">
                    <thead><tr className="border-b border-orange-200"><th className="text-left py-2 px-2">Asset</th><th className="text-left py-2 px-2">Desc</th><th className="text-left py-2 px-2">%</th><th className="w-16"></th></tr></thead>
                    <tbody className="portfolio-list"></tbody>
                  </table>
                </div>
                <div className="portfolio-list-empty text-center py-4">
                  <p className="text-sm text-slate-600 mb-3">No assets added</p>
                  <button type="button" className="add-first-portfolio inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Plus className="w-4 h-4" />
                    Add First
                  </button>
                </div>
                <button type="button" className="add-portfolio hidden inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Plus className="w-4 h-4" />
                  Add Asset
                </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="annuitiesTemplate" style={{ display: 'none' }}>
        <div className="entry bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-4">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-lg font-bold text-slate-900">Annuity <span className="idx">1</span></h3>
            <button type="button" className="entry-remove px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100">Remove</button>
          </div>
          <div className="space-y-6">
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-3">
                <h3 className="text-blue-700 font-semibold flex items-center gap-2">
                  <Landmark className="w-5 h-5" />
                  Annuity Details
                </h3>
              </div>
              <div className="p-4">
              <div className="mb-4">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Annuity name</label>
                <input type="text" name="fund_name" placeholder="e.g. ABC Annuity" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Owner(s) - Hold Ctrl/Cmd for multiple</label>
                <select name="owners" multiple size={2} className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"></select>
              </div>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div><label className="block text-sm font-semibold text-slate-700 mb-2">Type</label><label className="flex items-center gap-2"><input type="radio" name="a_type__1" value="1" className="w-4 h-4" /><span className="text-sm">Superannuation</span></label><label className="flex items-center gap-2"><input type="radio" name="a_type__1" value="2" className="w-4 h-4" /><span className="text-sm">Non-superannuation</span></label></div>
                <div><label className="block text-sm font-semibold text-slate-700 mb-2">Lifetime annuity?</label><label className="flex items-center gap-2"><input type="radio" name="a_life__1" value="1" className="w-4 h-4" /><span className="text-sm">Yes</span></label><label className="flex items-center gap-2"><input type="radio" name="a_life__1" value="2" className="w-4 h-4" /><span className="text-sm">No</span></label></div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Purchase date</label>
                  <input type="date" name="a_purchase_date" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Purchase price</label>
                  <div className="flex items-center"><span className="text-slate-500 mr-2">$</span><input type="number" name="a_purchase_price" placeholder="0.00" step="0.01" min="0" className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm" /></div>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Residual value</label>
                  <div className="flex items-center"><span className="text-slate-500 mr-2">$</span><input type="number" name="a_residual" placeholder="0.00" step="0.01" min="0" className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm" /></div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Term</label>
                  <input type="text" name="a_term" placeholder="" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
                </div>
              </div>
            </div>
          </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-green-50 border-l-4 border-green-500 p-3">
                <h3 className="text-green-700 font-semibold flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Payments
                </h3>
              </div>
              <div className="p-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Income</label>
                  <div className="flex items-center"><span className="text-slate-500 mr-2">$</span><input type="number" name="a_income" placeholder="0.00" step="0.01" min="0" className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm" /></div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Deductible</label>
                  <div className="flex items-center"><span className="text-slate-500 mr-2">$</span><input type="number" name="a_deductible" placeholder="0.00" step="0.01" min="0" className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm" /></div>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Tax free %</label>
                  <input type="text" name="a_taxfree_pct" placeholder="e.g. 50%" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Index rate</label>
                  <input type="text" name="a_index_rate" placeholder="" className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm" />
                </div>
              </div>
              <div className="mt-4"><label className="block text-sm font-semibold text-slate-700 mb-2">Reversionary?</label><label className="flex items-center gap-2"><input type="radio" name="a_rev__1" value="1" className="w-4 h-4" /><span className="text-sm">Yes</span></label><label className="flex items-center gap-2"><input type="radio" name="a_rev__1" value="2" className="w-4 h-4" /><span className="text-sm">No</span></label></div>
            </div>
          </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="w-full space-y-6">
          {/* Tabs - Part of form content */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setCurrentTab('super');
                setActiveIndex(0);
                setTimeout(() => updatePills('super', 0), 0);
              }}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                currentTab === 'super'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Superannuation
            </button>
            <button
              onClick={() => {
                setCurrentTab('pension');
                setActiveIndex(0);
                setTimeout(() => updatePills('pension', 0), 0);
              }}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                currentTab === 'pension'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Pension
            </button>
            <button
              onClick={() => {
                setCurrentTab('annuities');
                setActiveIndex(0);
                setTimeout(() => updatePills('annuities', 0), 0);
              }}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                currentTab === 'annuities'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Annuities
            </button>
          </div>

          <div id="superWrap" style={{ display: currentTab === 'super' ? 'block' : 'none' }} className="space-y-4" />
          <div id="pensionWrap" style={{ display: currentTab === 'pension' ? 'block' : 'none' }} className="space-y-4" />
          <div id="annuitiesWrap" style={{ display: currentTab === 'annuities' ? 'block' : 'none' }} className="space-y-4" />

          {currentCount === 0 ? (
            <div className="border border-gray-200 rounded-lg p-12 text-center bg-white">
              <div className="text-5xl mb-4">{currentTab === 'super' ? '🏦' : currentTab === 'pension' ? '🕰️' : '📈'}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Do you have any {tabLabels[currentTab].toLowerCase()}?
              </h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                {currentTab === 'super' ? 'Add details about your superannuation funds, balances, and contributions.' : 
                 currentTab === 'pension' ? 'Add details about your pension accounts and income streams.' :
                 'Add details about your annuity products and payment structures.'}
              </p>
              <button onClick={() => addEntry(currentTab)} className="inline-flex items-center gap-2 px-6 py-2.5 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium transition-colors">
                <Plus className="w-4 h-4" />
                Add First {tabLabels[currentTab]}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between mb-4">
              <div id={currentTab === 'super' ? 'superPills' : currentTab === 'pension' ? 'pensionPills' : 'annuitiesPills'} className="flex items-center gap-2" />
              <button onClick={() => addEntry(currentTab)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-dashed border-gray-300 text-gray-500 hover:border-blue-500 hover:text-blue-600 transition-colors">
                <Plus className="w-4 h-4" />
                Add {tabLabels[currentTab]}
              </button>
            </div>
          )}

          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <Button onClick={handleBack} variant="outline" disabled={saving} className="border-slate-300"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
                <Button onClick={handleNext} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">{saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" /> : <>Save & continue<ArrowRight className="w-4 h-4 ml-2" /></>}</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </FactFindLayout>
  );
}