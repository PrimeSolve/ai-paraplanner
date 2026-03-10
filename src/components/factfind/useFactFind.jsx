import { useState, useEffect, useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useRole } from '@/components/RoleContext';

/**
 * Convert PascalCase/camelCase keys to snake_case (no leading underscore).
 * Recursively processes nested objects and arrays.
 * e.g. 'Client1FactFind' → 'client1_fact_find', 'Incomes' → 'incomes'
 */
function toSnakeKeys(obj) {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(toSnakeKeys);
  if (typeof obj !== 'object') return obj;
  if (obj instanceof Date) return obj;

  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const snake = key.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
    result[snake] = toSnakeKeys(value);
  }
  return result;
}

/**
 * Normalize client1_fact_find sub-fields from wrapper objects to flat arrays
 * before sending to the API. The API expects List<T> for these fields but
 * the UI stores them as wrapper objects with metadata (activeIndex, currentTab).
 *
 * Also maps frontend field names (i_gross, e_disc, etc.) to API field names
 * (gross_salary, amount, etc.) so the SubmitFactFindDataRequest DTO can
 * deserialize them. The API's IncomeInput expects: { incomeType, employer,
 * grossSalary } — NOT { iGross, iType }.
 */
function normalizeFactFindForApi(data) {
  if (!data || typeof data !== 'object') return data;
  const result = { ...data };

  // ── Income field mapping: frontend i_* → API camelCase-friendly names ──
  // After this normalization, the proxy's snakeToCamelKeys converts:
  //   income_type → incomeType  (matches IncomeInput.incomeType)
  //   gross_salary → grossSalary (matches IncomeInput.grossSalary)
  //   salary_sacrifice → salarySacrifice (matches IncomeDto)
  //   fbt_exempt → fbtExempt (matches IncomeDto)
  if (Array.isArray(result.incomes)) {
    result.incomes = result.incomes.map(inc => {
      const mapped = { ...inc };
      // Map i_* fields → API field names
      if (inc.i_type !== undefined)      { mapped.income_type = inc.i_type; }
      if (inc.i_gross !== undefined)     { mapped.gross_salary = parseFloat(inc.i_gross) || 0; }
      if (inc.i_super_inc !== undefined) { mapped.salary_sacrifice = inc.i_super_inc; }
      if (inc.i_fbt !== undefined)       { mapped.fbt_exempt = inc.i_fbt === '1'; }
      return mapped;
    });
  }

  // ── Expense field mapping: frontend e_* → API names ──
  // API ExpenseInput expects: { category, amount, frequency }
  if (Array.isArray(result.expenses)) {
    result.expenses = result.expenses.map(exp => {
      const mapped = { ...exp };
      if (exp.e_disc !== undefined) { mapped.amount = parseFloat(exp.e_disc) || 0; }
      if (exp.e_freq !== undefined) { mapped.frequency = exp.e_freq; }
      return mapped;
    });
  }

  // ── List wrapper flattening ──

  // Dependants: wrapper → flat array with dep_type discriminator
  if (result.dependants && !Array.isArray(result.dependants)) {
    const children = (result.dependants.children || []).map(c => ({ ...c, dep_type: 'child' }));
    const deps = (result.dependants.dependants_list || []).map(d => ({ ...d, dep_type: 'dependant' }));
    result.dependants = [...children, ...deps];
  }

  // InsurancePolicies: wrapper → flat array (strip activeIdx metadata)
  if (result.insurance_policies && !Array.isArray(result.insurance_policies)) {
    result.insurance_policies = result.insurance_policies.policies || [];
  }

  // Investments: wrapper → flat array with inv_type discriminator
  if (result.investments && !Array.isArray(result.investments)) {
    const wraps = (result.investments.wraps || []).map(w => ({ ...w, inv_type: 'wrap' }));
    const bonds = (result.investments.bonds || []).map(b => ({ ...b, inv_type: 'bond' }));
    result.investments = [...wraps, ...bonds];
  }

  // TrustsCompanies: wrapper → flat array (strip currentTab/activeIndex metadata)
  if (result.trusts_companies && !Array.isArray(result.trusts_companies)) {
    result.trusts_companies = result.trusts_companies.entities || [];
  }

  // Smsf: wrapper → flat array (strip activeIndex metadata)
  if (result.smsf && !Array.isArray(result.smsf)) {
    result.smsf = result.smsf.smsf_details || [];
  }

  return result;
}

/**
 * Hook to manage FactFind initialization and auto-creation
 * - Waits for navigationChain to be ready
 * - Loads existing FactFind or creates new one
 * - Provides updateSection() for saving section data
 */
export function useFactFind() {
  const { navigationChain } = useRole();
  const [factFind, setFactFind] = useState(null);
  const [clientId, setClientId] = useState(null);
  const [clientEmail, setClientEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const factFindRef = useRef(null);
  factFindRef.current = factFind;
  const clientIdRef = useRef(null);
  clientIdRef.current = clientId;

  // Extract client record ID at render time
  const clientNav = navigationChain?.find(n => n.type === 'client');
  const navClientId = clientNav?.id;

  useEffect(() => {
    // Don't run until we have a client ID from the navigation chain
    if (!navClientId) {
      setLoading(false);
      return;
    }

    async function initFactFind() {
      try {
        setLoading(true);

        // 1. Get Client record by its database ID
        const clients = await base44.entities.Client.filter({ id: navClientId });

        if (!clients || clients.length === 0) {
          throw new Error(`No client found with id: ${navClientId}`);
        }

        const client = clients[0];

        // Store the Client ID and email for syncing
        setClientId(client.id);
        setClientEmail(client.email || null);

        // 2. Check if Client has existing FactFind
        if (client.fact_find_id) {
          const existing = await base44.entities.FactFind.filter({ id: client.fact_find_id });
          if (existing[0]) {
            setFactFind(existing[0]);
          } else {
            throw new Error('FactFind ID exists on Client but record not found');
          }
        } else {
          // 3. Create new FactFind
          const newFactFind = await base44.entities.FactFind.create({
            client_id: client.id,
            personal: {
              first_name: client.first_name || '',
              last_name: client.last_name || '',
              email: client.email || '',
              phone: client.phone || '',
              notes: client.notes || '',
            },
            status: 'in_progress',
            sections_completed: []
          });

          // 4. Link to Client (preserve all existing fields)
           await base44.entities.Client.update(client.id, {
             ...client,
             fact_find_id: newFactFind.id
           });

          setFactFind(newFactFind);
        }
      } catch (err) {
        console.error('useFactFind error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    initFactFind();
  }, [navClientId]);

  const updateSection = useCallback(async (sectionName, data) => {
    const current = factFindRef.current;
    if (!current?.id) {
      console.log('[updateSection] ABORT: no current factFind id');
      return false;
    }

    // Convert section name to snake_case key matching the proxy's convention
    // e.g. 'Client1FactFind' → 'client1_fact_find'
    const sectionKey = sectionName
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '');

    // Normalize incoming data keys to snake_case so the proxy's
    // snakeToCamelKeys correctly converts them to the API's camelCase
    const normalizedData = toSnakeKeys(data);

    console.log(`[updateSection] CALLED with sectionName="${sectionName}", sectionKey="${sectionKey}"`);
    console.log('[updateSection] raw data received:', JSON.stringify(data, null, 2));
    console.log('[updateSection] normalizedData:', JSON.stringify(normalizedData, null, 2));

    // Skip save if the section data is identical to what we already have
    const existing = current[sectionKey];
    console.log(`[updateSection] existing local state for "${sectionKey}":`, existing !== undefined ? 'EXISTS' : 'UNDEFINED');
    if (existing !== undefined) {
      try {
        if (JSON.stringify(existing) === JSON.stringify(normalizedData)) {
          console.log('[updateSection] SKIP: data identical to local state');
          return true;
        }
      } catch (_) {
        // If stringify fails, proceed with save
      }
    }

    try {
      // FETCH CURRENT DATA FROM DATABASE (not local state)
      const records = await base44.entities.FactFind.filter({ id: current.id });
      const currentData = records[0];
      console.log('[updateSection] DB record keys:', Object.keys(currentData));

      // Strip metadata fields and client_id from current data
      // (client_id from the DB may be a blank GUID; we always set it explicitly below)
      const {
        id: _id,
        created_date: _cd,
        updated_date: _ud,
        created_by: _cb,
        created_by_id: _cbi,
        entity_name: _en,
        app_id: _ai,
        is_sample: _is,
        is_deleted: _idl,
        deleted_date: _dd,
        environment: _env,
        client1_id: _staleClientId,
        ...cleanData
      } = currentData;

      console.log('[updateSection] cleanData keys:', Object.keys(cleanData));
      console.log(`[updateSection] cleanData["${sectionKey}"] exists?`, sectionKey in cleanData);
      console.log('[updateSection] cleanData["client1_profile"] exists?', 'client1_profile' in cleanData);

      // Deep-merge for client1_fact_find: multiple pages write different sub-fields,
      // so we must preserve existing sub-fields when saving new ones.
      let sectionData = normalizedData;
      if (sectionKey === 'client1_fact_find') {
        const existingSection = cleanData[sectionKey];
        if (existingSection && typeof existingSection === 'object' && !Array.isArray(existingSection)) {
          sectionData = { ...existingSection, ...normalizedData };
          console.log('[updateSection] deep-merged with existing client1_fact_find');
        }
      }

      // Write new data under the correct snake_case key (replaces any old value)
      cleanData[sectionKey] = sectionData;

      // Normalize client1_fact_find wrapper objects → flat arrays before API call.
      // The API expects List<T> for dependants, insurance_policies, investments,
      // trusts_companies, and smsf — but the UI stores them as wrapper objects.
      if (cleanData.client1_fact_find && typeof cleanData.client1_fact_find === 'object') {
        cleanData.client1_fact_find = normalizeFactFindForApi(cleanData.client1_fact_find);
      }

      const payload = {
        ...cleanData,
        client1_id: clientIdRef.current || _staleClientId,
      };

      console.log('[updateSection] FINAL PAYLOAD keys:', Object.keys(payload));
      console.log('[updateSection] FINAL PAYLOAD:', JSON.stringify(payload, null, 2));

      await base44.entities.FactFind.update(current.id, payload);
      console.log('[updateSection] API update DONE');

      // Update local state with snake_case key
      setFactFind(prev => ({
        ...prev,
        [sectionKey]: sectionData
      }));

      return true;
    } catch (err) {
      console.error(`[updateSection] FAILED for section "${sectionName}":`, err);
      return false;
    }
  }, []);

  return {
    factFind,
    loading,
    error,
    updateSection,
    setFactFind,
    clientEmail,
    clientId
  };
}
