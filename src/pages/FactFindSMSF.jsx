import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import FactFindLayout from '../components/factfind/FactFindLayout';
import FactFindHeader from '../components/factfind/FactFindHeader';
import { useFactFind } from '../components/factfind/useFactFind';
import { useFactFindEntities } from '../components/factfind/useFactFindEntities';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ArrowRight, ArrowLeft, Plus, Landmark, Wallet, UserPlus, Edit } from 'lucide-react';

const MAX_SMSF = 2;

export default function FactFindSMSF() {
  const navigate = useNavigate();
  const { factFind, loading: ffLoading } = useFactFind();
  const principalsOnly = useFactFindEntities(factFind, { types: ['Principal'] });
  const beneficiaryEntities = useFactFindEntities(factFind, { types: ['Principal', 'Dependant'] });
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [smsfCount, setSmsfCount] = useState(0);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [editingAccountIndex, setEditingAccountIndex] = useState(null);
  const [accountForm, setAccountForm] = useState({
    owner: '',
    tax_environment: '',
    fund_percentage: '',
    balance: '',
    tax_free_amt: '',
    tax_free_pct: '',
    unp_amt: '',
    super_guarantee: '',
    salary_sacrifice: '',
    after_tax: ''
  });

  const globalStateRef = React.useRef({
    smsf_details: [],
    activeIndex: 0
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

      // Read account rows with their nested beneficiaries
      const acctRows = card.querySelectorAll('tbody.acct-list tr.acct-row');
      data.accounts = Array.from(acctRows).map((row, acctIdx) => {
        const accountId = `account_${acctIdx}`;
        
        // Find beneficiaries for this specific account
        const benefRows = card.querySelectorAll('tbody.benef-list tr.benef-row');
        const accountBeneficiaries = Array.from(benefRows)
          .filter(bRow => bRow.querySelector('select[name="benef_account"]')?.value === accountId)
          .map(bRow => ({
            entity_id: bRow.querySelector('select[name="benef_who"]')?.value || '',
            beneficiary_type: bRow.querySelector('select[name="benef_type"]')?.value || '',
            entitlement: bRow.querySelector('input[name="benef_entitlement"]')?.value || ''
          }));
        
        return {
          id: accountId,
          owner: row.getAttribute('data-owner') || '',
          tax_environment: row.getAttribute('data-tax-env') || '',
          fund_percentage: row.getAttribute('data-fund-pct') || '',
          balance: row.getAttribute('data-balance') || '',
          tax_free_amt: row.getAttribute('data-tax-free-amt') || '',
          tax_free_pct: row.getAttribute('data-tax-free-pct') || '',
          unp_amt: row.getAttribute('data-unp-amt') || '',
          super_guarantee: row.getAttribute('data-super-guarantee') || '',
          salary_sacrifice: row.getAttribute('data-salary-sacrifice') || '',
          after_tax: row.getAttribute('data-after-tax') || '',
          beneficiaries: accountBeneficiaries
        };
      });

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

    const wrap = wrapForTab();
    if (!wrap) return;

    pillsContainer.innerHTML = '';
    const cards = [...wrap.querySelectorAll('.entry')];

    cards.forEach((card, i) => {
      const pill = document.createElement('button');
      const isActive = i === index;
      pill.type = 'button';

      const nameInput = card.querySelector('input[name="smsf_name"]');
      const displayName = nameInput?.value?.trim() || `SMSF ${i + 1}`;

      pill.className = `px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
        isActive
          ? 'bg-white border-blue-500 text-blue-700 shadow-sm'
          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
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
      
      // Fill beneficiaries from nested data
      const benefContainer = card.querySelector('.benef-list');
      if (benefContainer) {
        benefContainer.innerHTML = '';
        
        // Flatten beneficiaries from all accounts
        data.accounts.forEach((acct, acctIdx) => {
          if (Array.isArray(acct.beneficiaries)) {
            acct.beneficiaries.forEach((benef) => {
              const row = createBeneficiaryRow(card, {
                benef_account: acct.id || `account_${acctIdx}`,
                benef_who: benef.entity_id,
                benef_type: benef.beneficiary_type,
                benef_entitlement: benef.entitlement
              });
              benefContainer.appendChild(row);
            });
          }
        });
      }
      
      const benefTable = card.querySelector('.benef-list-table');
      const benefEmpty = card.querySelector('.benef-list-empty');
      const benefBtn = card.querySelector('.add-benef');
      
      // Update beneficiary section visibility
      updateBeneficiaryVisibility(card);
    }
  }, []);

  // ============================================
  // ACCOUNT MODAL FUNCTIONS
  // ============================================

  const openAddAccountModal = () => {
    setAccountForm({
      owner: '',
      tax_environment: '',
      fund_percentage: '',
      balance: '',
      tax_free_amt: '',
      tax_free_pct: '',
      unp_amt: '',
      super_guarantee: '',
      salary_sacrifice: '',
      after_tax: ''
    });
    setEditingAccountIndex(null);
    setAccountModalOpen(true);
  };

  const openEditAccountModal = (accountIndex) => {
    const wrap = wrapForTab();
    if (!wrap) return;
    const cards = [...wrap.querySelectorAll('.entry')];
    const card = cards[activeIndex];
    if (!card) return;

    const acctRows = card.querySelectorAll('tbody.acct-list tr.acct-row');
    const row = acctRows[accountIndex];
    if (!row) return;

    setAccountForm({
      owner: row.getAttribute('data-owner') || '',
      tax_environment: row.getAttribute('data-tax-env') || '',
      fund_percentage: row.getAttribute('data-fund-pct') || '',
      balance: row.getAttribute('data-balance') || '',
      tax_free_amt: row.getAttribute('data-tax-free-amt') || '',
      tax_free_pct: row.getAttribute('data-tax-free-pct') || '',
      unp_amt: row.getAttribute('data-unp-amt') || '',
      super_guarantee: row.getAttribute('data-super-guarantee') || '',
      salary_sacrifice: row.getAttribute('data-salary-sacrifice') || '',
      after_tax: row.getAttribute('data-after-tax') || ''
    });
    setEditingAccountIndex(accountIndex);
    setAccountModalOpen(true);
  };

  const saveAccount = async () => {
    const wrap = wrapForTab();
    if (!wrap) return;
    const cards = [...wrap.querySelectorAll('.entry')];
    const card = cards[activeIndex];
    if (!card) return;

    const list = card.querySelector('.acct-list');
    if (!list) return;

    if (editingAccountIndex !== null) {
      // Update existing row
      const row = list.querySelectorAll('.acct-row')[editingAccountIndex];
      if (row) {
        updateAccountRow(row, accountForm);
      }
    } else {
      // Add new row
      const row = createAccountRow(card, accountForm);
      list.appendChild(row);
    }

    // Update account table visibility
    updateAccountTableVisibility(card);

    // Update beneficiary section visibility (accounts now exist)
    updateBeneficiaryVisibility(card);

    // Refresh beneficiary dropdowns
    refreshBeneficiaryDropdowns(card);

    // Save to database
    await saveSmsfState();

    setAccountModalOpen(false);
    toast.success(editingAccountIndex !== null ? 'Account updated' : 'Account added');
  };

  const removeAccount = async (accountIndex) => {
    const wrap = wrapForTab();
    if (!wrap) return;
    const cards = [...wrap.querySelectorAll('.entry')];
    const card = cards[activeIndex];
    if (!card) return;

    const acctRows = card.querySelectorAll('tbody.acct-list tr.acct-row');
    const row = acctRows[accountIndex];
    if (!row) return;

    row.remove();

    // Update account table visibility
    updateAccountTableVisibility(card);

    // Update beneficiary section visibility (check if accounts still exist)
    updateBeneficiaryVisibility(card);

    // Refresh beneficiary dropdowns
    refreshBeneficiaryDropdowns(card);

    // Save to database
    await saveSmsfState();
    toast.success('Account removed');
  };

  const updateAccountTableVisibility = (card) => {
    const list = card.querySelector('.acct-list');
    const hasRows = list ? list.querySelectorAll('.acct-row').length > 0 : false;
    const acctTable = card.querySelector('.acct-list-table');
    const acctEmpty = card.querySelector('.acct-list-empty');

    if (hasRows) {
      acctTable?.classList.remove('hidden');
      acctEmpty?.classList.add('hidden');
    } else {
      acctTable?.classList.add('hidden');
      acctEmpty?.classList.remove('hidden');
    }
  };

  const updateBeneficiaryVisibility = (card) => {
    const acctList = card.querySelector('.acct-list');
    const hasAccounts = acctList ? acctList.querySelectorAll('.acct-row').length > 0 : false;
    const benefList = card.querySelector('.benef-list');
    const hasBeneficiaries = benefList ? benefList.querySelectorAll('.benef-row').length > 0 : false;
    
    const benefTable = card.querySelector('.benef-list-table');
    const benefEmptyNoAccounts = card.querySelector('.benef-list-empty-no-accounts');
    const benefEmpty = card.querySelector('.benef-list-empty');

    if (!hasAccounts) {
      // No accounts - show "add account first" message
      benefEmptyNoAccounts?.classList.remove('hidden');
      benefEmpty?.classList.add('hidden');
      benefTable?.classList.add('hidden');
    } else if (hasBeneficiaries) {
      // Accounts exist and beneficiaries added
      benefEmptyNoAccounts?.classList.add('hidden');
      benefEmpty?.classList.add('hidden');
      benefTable?.classList.remove('hidden');
    } else {
      // Accounts exist but no beneficiaries
      benefEmptyNoAccounts?.classList.add('hidden');
      benefEmpty?.classList.remove('hidden');
      benefTable?.classList.add('hidden');
    }
  };

  const refreshBeneficiaryDropdowns = (card) => {
    const benefRows = card.querySelectorAll('.benef-row');
    const acctList = card.querySelector('.acct-list');
    const acctRows = acctList ? Array.from(acctList.querySelectorAll('.acct-row')) : [];

    benefRows.forEach(bRow => {
      const acctSelect = bRow.querySelector('select[name="benef_account"]');
      if (acctSelect) {
        const currentValue = acctSelect.value;
        
        if (acctRows.length === 0) {
          acctSelect.disabled = true;
          acctSelect.innerHTML = '<option value="">Add an account above first</option>';
        } else {
          const accountOptions = acctRows.map((acctRow, idx) => {
            const ownerId = acctRow.getAttribute('data-owner') || '';
            const ownerEntity = principalsOnly.find(e => e.id === ownerId);
            const ownerName = ownerEntity ? ownerEntity.label : 'Unknown';
            return `<option value="account_${idx}">${ownerName} - Account ${idx + 1}</option>`;
          }).join('');
          
          acctSelect.disabled = false;
          acctSelect.innerHTML = `
            <option value="">Select account…</option>
            ${accountOptions}
          `;
          acctSelect.value = currentValue;
        }
      }
    });
  };

  const updateAccountRow = (row, data) => {
    row.setAttribute('data-owner', data.owner || '');
    row.setAttribute('data-tax-env', data.tax_environment || '');
    row.setAttribute('data-fund-pct', data.fund_percentage || '');
    row.setAttribute('data-balance', data.balance || '');
    row.setAttribute('data-tax-free-amt', data.tax_free_amt || '');
    row.setAttribute('data-tax-free-pct', data.tax_free_pct || '');
    row.setAttribute('data-unp-amt', data.unp_amt || '');
    row.setAttribute('data-super-guarantee', data.super_guarantee || '');
    row.setAttribute('data-salary-sacrifice', data.salary_sacrifice || '');
    row.setAttribute('data-after-tax', data.after_tax || '');

    const ownerEntity = principalsOnly.find(e => e.id === data.owner);
    const ownerName = ownerEntity ? ownerEntity.label : 'Unknown';
    const taxEnvLabel = data.tax_environment === '1' ? 'Accumulation' : data.tax_environment === '2' ? 'Pension' : 'N/A';
    const fundPct = data.fund_percentage ? `${data.fund_percentage}%` : 'N/A';
    const balance = data.balance ? `$${parseFloat(data.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A';

    const ownerCell = row.querySelector('.acct-owner-cell');
    const taxEnvCell = row.querySelector('.acct-tax-env-cell');
    const fundPctCell = row.querySelector('.acct-fund-pct-cell');
    const balanceCell = row.querySelector('.acct-balance-cell');

    if (ownerCell) ownerCell.textContent = ownerName;
    if (taxEnvCell) taxEnvCell.textContent = taxEnvLabel;
    if (fundPctCell) fundPctCell.textContent = fundPct;
    if (balanceCell) balanceCell.textContent = balance;
  };

  // ============================================
  // CREATE ACCOUNT ROW (Summary Table)
  // ============================================

  const createAccountRow = useCallback((card, data = {}) => {
    const row = document.createElement('tr');
    row.className = 'acct-row border-b border-slate-100 hover:bg-orange-50/50';
    
    // Store data as attributes
    row.setAttribute('data-owner', data.owner || '');
    row.setAttribute('data-tax-env', data.tax_environment || '');
    row.setAttribute('data-fund-pct', data.fund_percentage || '');
    row.setAttribute('data-balance', data.balance || '');
    row.setAttribute('data-tax-free-amt', data.tax_free_amt || '');
    row.setAttribute('data-tax-free-pct', data.tax_free_pct || '');
    row.setAttribute('data-unp-amt', data.unp_amt || '');
    row.setAttribute('data-super-guarantee', data.super_guarantee || '');
    row.setAttribute('data-salary-sacrifice', data.salary_sacrifice || '');
    row.setAttribute('data-after-tax', data.after_tax || '');

    const ownerEntity = principalsOnly.find(e => e.id === data.owner);
    const ownerName = ownerEntity ? ownerEntity.label : 'Unknown';
    const taxEnvLabel = data.tax_environment === '1' ? 'Accumulation' : data.tax_environment === '2' ? 'Pension' : 'N/A';
    const fundPct = data.fund_percentage ? `${data.fund_percentage}%` : 'N/A';
    const balance = data.balance ? `$${parseFloat(data.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A';

    row.innerHTML = `
      <td class="py-3 px-3 acct-owner-cell font-medium text-slate-800">${ownerName}</td>
      <td class="py-3 px-3 acct-tax-env-cell text-slate-600">${taxEnvLabel}</td>
      <td class="py-3 px-3 text-right acct-fund-pct-cell text-slate-800">${fundPct}</td>
      <td class="py-3 px-3 text-right acct-balance-cell font-medium text-slate-800">${balance}</td>
      <td class="py-3 px-3 text-right">
        <button type="button" class="edit-acct px-3 py-1 text-xs font-medium text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors mr-2">Details</button>
        <button type="button" class="remove-acct text-xs font-medium text-red-600 hover:text-red-700 transition-colors">Remove</button>
      </td>
    `;

    return row;
  }, [principalsOnly]);

  // ============================================
  // CREATE BENEFICIARY ROW
  // ============================================

  const createBeneficiaryRow = useCallback((card, data = {}) => {
    const row = document.createElement('tr');
    row.className = 'benef-row border-b border-slate-100 hover:bg-purple-50/50';

    // Get accounts from the card to build dropdown AND filter beneficiaries
    const acctList = card.querySelector('.acct-list');
    const acctRows = acctList ? Array.from(acctList.querySelectorAll('.acct-row')) : [];

    // Build account options with owner names
    const accountOptions = acctRows.map((acctRow, idx) => {
      const ownerId = acctRow.getAttribute('data-owner') || '';
      const ownerEntity = principalsOnly.find(e => e.id === ownerId);
      const ownerName = ownerEntity ? ownerEntity.label : 'Unknown';
      return `<option value="account_${idx}">${ownerName} - Account ${idx + 1}</option>`;
    }).join('');

    // Get the selected account to filter beneficiary options
    const selectedAccountId = data?.benef_account || '';
    const selectedAcctRow = selectedAccountId ? acctRows[parseInt(selectedAccountId.split('_')[1])] : null;
    const accountOwnerId = selectedAcctRow?.getAttribute('data-owner') || '';
    
    // Build entity options from beneficiaryEntities, excluding the account owner
    const entityOptions = beneficiaryEntities
      .filter(entity => entity.id !== accountOwnerId)
      .map(entity => 
        `<option value="${entity.id}">${entity.label} (${entity.type})</option>`
      ).join('');
    
    // Add Estate as a static option
    const estateOption = '<option value="estate">Estate</option>';
    
    // Show message if no accounts exist
    const noAccountsMessage = acctRows.length === 0 
      ? '<option value="">Add an account above first</option>' 
      : '';

    row.innerHTML = `
      <td class="py-3 px-3">
        <select name="benef_account" class="benef-account-select w-full px-2 py-1.5 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500" ${acctRows.length === 0 ? 'disabled' : ''}>
          <option value="">Select account…</option>
          ${noAccountsMessage}
          ${accountOptions}
        </select>
      </td>
      <td class="py-3 px-3">
        <select name="benef_who" class="w-full px-2 py-1.5 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500">
          <option value="">Select entity…</option>
          ${entityOptions}
          ${estateOption}
        </select>
      </td>
      <td class="py-3 px-3">
        <select name="benef_type" class="w-full px-2 py-1.5 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500">
          <option value="">Select…</option>
          <option value="binding">Binding</option>
          <option value="non-binding">Non-binding</option>
          <option value="lapsing">Lapsing binding</option>
          <option value="non-lapsing">Non-lapsing binding</option>
        </select>
      </td>
      <td class="py-3 px-3 text-right">
        <input type="text" name="benef_entitlement" placeholder="e.g. 50%" class="w-full px-2 py-1.5 border border-slate-300 rounded text-xs text-right focus:outline-none focus:ring-1 focus:ring-blue-500" />
      </td>
      <td class="py-3 px-3 text-right">
        <button type="button" class="remove-benef text-xs font-medium text-red-600 hover:text-red-700 transition-colors">Remove</button>
      </td>
    `;

    const removeBtn = row.querySelector('.remove-benef');
    if (removeBtn) {
      removeBtn.onclick = async (e) => {
        e.preventDefault();
        row.remove();
        
        // Save to database immediately
        if (factFind?.id) {
          const updatedDetails = readTabToArray();
          globalStateRef.current.smsf_details = updatedDetails;
          
          await base44.entities.FactFind.update(factFind.id, {
            smsf: {
              smsf_details: globalStateRef.current.smsf_details,
              activeIndex: globalStateRef.current.activeIndex
            }
          });
        }
      };
    }

    if (data?.benef_account) {
      const el = row.querySelector('select[name="benef_account"]');
      if (el) el.value = data.benef_account;
    }
    if (data?.benef_who) {
      const el = row.querySelector('select[name="benef_who"]');
      if (el) el.value = data.benef_who;
    }
    if (data?.benef_type) {
      const el = row.querySelector('select[name="benef_type"]');
      if (el) el.value = data.benef_type;
    }
    if (data?.benef_entitlement) {
      const el = row.querySelector('input[name="benef_entitlement"]');
      if (el) el.value = data.benef_entitlement;
    }

    // Add change listener to account dropdown to update beneficiary options
    const acctSelect = row.querySelector('select[name="benef_account"]');
    if (acctSelect) {
      acctSelect.addEventListener('change', function() {
        const selectedIdx = this.value ? parseInt(this.value.split('_')[1]) : -1;
        const selectedAcctRow = selectedIdx >= 0 ? acctRows[selectedIdx] : null;
        const accountOwnerId = selectedAcctRow?.querySelector('select[name="acct_owner"]')?.value || '';
        
        // Rebuild beneficiary options excluding the account owner
        const whoSelect = row.querySelector('select[name="benef_who"]');
        if (whoSelect) {
          const currentValue = whoSelect.value;
          const filteredOptions = beneficiaryEntities
            .filter(entity => entity.id !== accountOwnerId)
            .map(entity => 
              `<option value="${entity.id}">${entity.label} (${entity.type})</option>`
            ).join('');
          
          whoSelect.innerHTML = `
            <option value="">Select entity…</option>
            ${filteredOptions}
            <option value="estate">Estate</option>
          `;
          
          // Restore value if still valid
          if (currentValue && currentValue !== accountOwnerId) {
            whoSelect.value = currentValue;
          }
        }
      });
    }

    return row;
  }, [beneficiaryEntities, principalsOnly, factFind?.id, readTabToArray]);

  // ============================================
  // ADD ENTRY
  // ============================================

  const addEntry = useCallback((existingData = null) => {
    const wrap = wrapForTab();
    if (!wrap) return;

    const currentCount = wrap.querySelectorAll('.entry').length;
    
    if (currentCount >= MAX_SMSF) {
      toast.error(`Maximum ${MAX_SMSF} SMSFs allowed`);
      return;
    }

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
    
    // Use setTimeout to ensure state updates before showing entry
    setTimeout(() => {
      updatePills(newIndex);
      showOnlyActiveEntry(newIndex);
    }, 0);
  }, [wrapForTab, cloneTemplateDiv, fillCardFromData, renumber, updatePills, showOnlyActiveEntry]);

  // ============================================
  // REMOVE ENTRY
  // ============================================

  const removeEntry = useCallback(async (node) => {
    node.remove();
    const wrap = wrapForTab();
    if (!wrap) return;
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

    // Save to database immediately
    if (factFind?.id) {
      const updatedDetails = readTabToArray();
      globalStateRef.current.smsf_details = updatedDetails;
      
      await base44.entities.FactFind.update(factFind.id, {
        smsf: {
          smsf_details: globalStateRef.current.smsf_details,
          activeIndex: remaining > 0 ? Math.max(0, remaining - 1) : 0
        }
      });
    }
  }, [wrapForTab, renumber, showOnlyActiveEntry, updatePills, factFind?.id, readTabToArray]);

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
    if (factFind?.id && factFind.smsf) {
      globalStateRef.current.smsf_details = factFind.smsf.smsf_details || [];
      globalStateRef.current.activeIndex = factFind.smsf.activeIndex || 0;
    }
  }, [factFind?.id]);

  // ============================================
  // SAVE STATE
  // ============================================

  const saveSmsfState = useCallback(async () => {
    if (!factFind?.id) return;

    try {
      globalStateRef.current.smsf_details = readTabToArray();
      globalStateRef.current.activeIndex = activeIndex;

      await base44.entities.FactFind.update(factFind.id, {
        smsf: {
          smsf_details: globalStateRef.current.smsf_details,
          activeIndex: globalStateRef.current.activeIndex
        }
      });
    } catch (error) {
      console.error('Save failed:', error);
    }
  }, [factFind?.id, readTabToArray, activeIndex]);

  // ============================================
  // INITIALIZE DOM
  // ============================================

  useEffect(() => {
    if (!ffLoading && factFind?.id) {
      setTimeout(() => {
        const wrap = wrapForTab();
        if (!wrap) return; // Exit early if wrap not ready
        
        wrap.innerHTML = '';

        if (globalStateRef.current.smsf_details?.length > 0) {
          globalStateRef.current.smsf_details.forEach((smsfData) => {
            addEntry(smsfData);
          });
        }

        const activeIdx = globalStateRef.current.activeIndex || 0;
        setActiveIndex(activeIdx);
        updatePills(activeIdx);
        showOnlyActiveEntry(activeIdx);
      }, 50);
    }
  }, [ffLoading, factFind?.id, addEntry, updatePills, showOnlyActiveEntry]);

  // ============================================
  // SETUP INPUT LISTENERS
  // ============================================

  useEffect(() => {
    const updateTableVisibility = (card, type) => {
      const container = type === 'acct' ? card.querySelector('.acct-container') : card.querySelector('.benef-container');
      const table = type === 'acct' ? card.querySelector('.acct-list-table') : card.querySelector('.benef-list-table');
      const empty = type === 'acct' ? card.querySelector('.acct-list-empty') : card.querySelector('.benef-list-empty');
      const list = type === 'acct' ? card.querySelector('.acct-list') : card.querySelector('.benef-list');

      const hasRows = list ? list.querySelectorAll(type === 'acct' ? '.acct-row' : '.benef-row').length > 0 : false;

      if (hasRows) {
        table?.classList.remove('hidden');
        empty?.classList.add('hidden');
      } else {
        table?.classList.add('hidden');
        empty?.classList.remove('hidden');
      }

      // For beneficiaries, also handle the "no accounts" state
      if (type === 'benef') {
        const acctList = card.querySelector('.acct-list');
        const hasAccounts = acctList ? acctList.querySelectorAll('.acct-row').length > 0 : false;
        const emptyNoAccounts = card.querySelector('.benef-list-empty-no-accounts');
        
        if (!hasAccounts) {
          // No accounts - show "add account first" message
          emptyNoAccounts?.classList.remove('hidden');
          empty?.classList.add('hidden');
          table?.classList.add('hidden');
        } else {
          // Accounts exist
          emptyNoAccounts?.classList.add('hidden');
          if (hasRows) {
            table?.classList.remove('hidden');
            empty?.classList.add('hidden');
          } else {
            table?.classList.add('hidden');
            empty?.classList.remove('hidden');
          }
        }
      }
    };

    const clickHandler = (e) => {
      if (e.target.closest('.add-first-acct') || e.target.closest('.add-acct')) {
        e.preventDefault();
        openAddAccountModal();
      }
      if (e.target.closest('.edit-acct')) {
        e.preventDefault();
        const row = e.target.closest('.acct-row');
        const card = e.target.closest('.entry');
        if (!card || !row) return;
        const acctRows = card.querySelectorAll('tbody.acct-list tr.acct-row');
        const accountIndex = Array.from(acctRows).indexOf(row);
        if (accountIndex >= 0) {
          openEditAccountModal(accountIndex);
        }
      }
      if (e.target.closest('.remove-acct')) {
        e.preventDefault();
        const row = e.target.closest('.acct-row');
        const card = e.target.closest('.entry');
        if (!card || !row) return;
        const acctRows = card.querySelectorAll('tbody.acct-list tr.acct-row');
        const accountIndex = Array.from(acctRows).indexOf(row);
        if (accountIndex >= 0) {
          removeAccount(accountIndex);
        }
      }
      if (e.target.closest('.add-first-benef') || e.target.closest('.add-benef')) {
        e.preventDefault();
        const card = e.target.closest('.entry');
        if (!card) return;
        
        const list = card.querySelector('.benef-list');
        if (!list) return;
        const row = createBeneficiaryRow(card);
        list.appendChild(row);
        updateTableVisibility(card, 'benef');
      }
      if (e.target.closest('.entry-remove')) {
        e.preventDefault();
        const node = e.target.closest('.entry');
        removeEntry(node);
      }
      if (e.target.closest('.remove-benef')) {
        const card = e.target.closest('.entry');
        if (card) setTimeout(() => updateTableVisibility(card, 'benef'), 0);
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
  }, [activeIndex, updatePills, removeEntry, createBeneficiaryRow, principalsOnly, saveSmsfState]);

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
        smsf: {
          smsf_details: globalStateRef.current.smsf_details,
          activeIndex: globalStateRef.current.activeIndex
        },
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

  if (ffLoading) {
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
        user={user}
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
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-3">
                <h3 className="text-blue-700 font-semibold flex items-center gap-2">
                  <Landmark className="w-5 h-5" />
                  SMSF Details
                </h3>
              </div>
              <div className="p-4">
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
          </div>

            {/* Account Information Section */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-amber-50 border-l-4 border-amber-500 p-3">
                <h3 className="text-amber-700 font-semibold flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  Account Information
                </h3>
              </div>
              <div className="p-4">
              
              <div className="acct-container">
                {/* Summary Table */}
                <div className="acct-list-table hidden">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-2 px-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Account Owner</th>
                        <th className="text-left py-2 px-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Tax Environment</th>
                        <th className="text-right py-2 px-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">% of Fund</th>
                        <th className="text-right py-2 px-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Balance</th>
                        <th className="text-right py-2 px-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="acct-list">
                      {/* Account rows go here */}
                    </tbody>
                  </table>
                  <div className="mt-4">
                    <button type="button" className="add-acct inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                      <Plus className="w-4 h-4" />
                      Add Account
                    </button>
                  </div>
                </div>

                {/* Empty state */}
                <div className="acct-list-empty text-center py-6">
                  <p className="text-sm text-slate-600 mb-3">No accounts added yet</p>
                  <button type="button" className="add-first-acct inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                    <Plus className="w-4 h-4" />
                    Add First Account
                  </button>
                </div>
              </div>
            </div>
          </div>

            {/* Beneficiaries Section */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-amber-50 border-l-4 border-amber-500 p-3">
                <h3 className="text-amber-700 font-semibold flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Beneficiaries
                </h3>
              </div>
              <div className="p-4">
              
              <div className="benef-container">
                {/* Table with headers */}
                <div className="benef-list-table hidden overflow-x-auto">
                  <table className="w-full text-sm border-collapse min-w-[700px]">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-2 px-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Beneficiary Account</th>
                        <th className="text-left py-2 px-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Who is Beneficiary</th>
                        <th className="text-left py-2 px-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Beneficiary Type</th>
                        <th className="text-right py-2 px-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Entitlement</th>
                        <th className="text-right py-2 px-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="benef-list">
                      {/* Beneficiary rows go here */}
                    </tbody>
                  </table>
                  <div className="mt-4">
                    <button type="button" className="add-benef inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                      <Plus className="w-4 h-4" />
                      Add Beneficiary
                    </button>
                  </div>
                </div>

                {/* Empty state - no accounts */}
                <div className="benef-list-empty-no-accounts text-center py-6">
                  <p className="text-sm text-slate-600 mb-2">Add an account above before adding beneficiaries</p>
                </div>

                {/* Empty state - accounts exist but no beneficiaries */}
                <div className="benef-list-empty hidden text-center py-6">
                  <p className="text-sm text-slate-600 mb-3">No beneficiaries added yet</p>
                  <button type="button" className="add-first-benef inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                    <Plus className="w-4 h-4" />
                    Add Beneficiary
                  </button>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>

      {/* Account Modal */}
      <Dialog open={accountModalOpen} onOpenChange={setAccountModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingAccountIndex !== null ? 'Account Details' : 'Add SMSF Account'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Account Owner</label>
              <select
                value={accountForm.owner}
                onChange={(e) => setAccountForm({ ...accountForm, owner: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select…</option>
                {principalsOnly.map(entity => (
                  <option key={entity.id} value={entity.id}>{entity.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Tax Environment</label>
              <select
                value={accountForm.tax_environment}
                onChange={(e) => setAccountForm({ ...accountForm, tax_environment: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select…</option>
                <option value="1">Accumulation</option>
                <option value="2">Pension</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">% of Fund Owned</label>
              <div className="flex items-center">
                <input
                  type="number"
                  value={accountForm.fund_percentage}
                  onChange={(e) => setAccountForm({ ...accountForm, fund_percentage: e.target.value })}
                  placeholder="0"
                  step="0.01"
                  min="0"
                  max="100"
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-2 text-slate-500">%</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Account Balance</label>
              <div className="flex items-center">
                <span className="text-slate-500 mr-2">$</span>
                <input
                  type="number"
                  value={accountForm.balance}
                  onChange={(e) => setAccountForm({ ...accountForm, balance: e.target.value })}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Tax Free Amount</label>
              <div className="flex items-center">
                <span className="text-slate-500 mr-2">$</span>
                <input
                  type="number"
                  value={accountForm.tax_free_amt}
                  onChange={(e) => setAccountForm({ ...accountForm, tax_free_amt: e.target.value })}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Tax Free %</label>
              <input
                type="text"
                value={accountForm.tax_free_pct}
                onChange={(e) => setAccountForm({ ...accountForm, tax_free_pct: e.target.value })}
                placeholder="e.g. 30%"
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">UNP Amount</label>
              <div className="flex items-center">
                <span className="text-slate-500 mr-2">$</span>
                <input
                  type="number"
                  value={accountForm.unp_amt}
                  onChange={(e) => setAccountForm({ ...accountForm, unp_amt: e.target.value })}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Super Guarantee?</label>
              <select
                value={accountForm.super_guarantee}
                onChange={(e) => setAccountForm({ ...accountForm, super_guarantee: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select…</option>
                <option value="1">Yes</option>
                <option value="2">No</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Salary Sacrifice</label>
              <input
                type="number"
                value={accountForm.salary_sacrifice}
                onChange={(e) => setAccountForm({ ...accountForm, salary_sacrifice: e.target.value })}
                placeholder="0"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">After Tax</label>
              <div className="flex items-center">
                <span className="text-slate-500 mr-2">$</span>
                <input
                  type="number"
                  value={accountForm.after_tax}
                  onChange={(e) => setAccountForm({ ...accountForm, after_tax: e.target.value })}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAccountModalOpen(false)}>Cancel</Button>
            <Button onClick={saveAccount} className="bg-blue-600 hover:bg-blue-700">Save Account</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="w-full space-y-6">
          <div id="smsfWrap" className="space-y-4" />

          {/* Welcome Screen */}
          {smsfCount === 0 ? (
            <div className="border border-gray-200 rounded-lg p-12 text-center bg-white">
              <div className="text-5xl mb-4">🏦</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Do you have a Self-Managed Super Fund?
              </h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Add details about your SMSF, including accounts, balances, and beneficiaries.
              </p>
              <button
                onClick={() => addEntry()}
                className="inline-flex items-center gap-2 px-6 py-2.5 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add First SMSF
              </button>
            </div>
          ) : (
            <>
              {/* Pills Navigation - SEPARATED: Items left, Add right */}
              <div className="flex items-center justify-between mb-4">
                <div id="smsfPills" className="flex items-center gap-2" />
                {smsfCount < MAX_SMSF && (
                  <button
                    onClick={() => addEntry()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-dashed border-gray-300 text-gray-500 hover:border-blue-500 hover:text-blue-600 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add SMSF
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