import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useRole } from '@/components/RoleContext';

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

  console.log('=== useFactFind HOOK ===');
  console.log('navigationChain:', navigationChain);

  // Extract client record ID at render time
  const clientNav = navigationChain?.find(n => n.type === 'client');
  console.log('clientNav:', clientNav);

  const navClientId = clientNav?.id;
  console.log('navClientId:', navClientId);

  useEffect(() => {
    // Don't run until we have a client ID from the navigation chain
    if (!navClientId) {
      console.log('useFactFind: No navClientId yet, waiting...');
      setLoading(false);
      return;
    }

    console.log('useFactFind: navClientId available, initializing...', navClientId);

    async function initFactFind() {
      try {
        setLoading(true);
        console.log('=== initFactFind START ===');

        // 1. Get Client record by its database ID
        const clients = await base44.entities.Client.filter({ id: navClientId });
        console.log('Client query result:', clients);

        if (!clients || clients.length === 0) {
          throw new Error(`No client found with id: ${navClientId}`);
        }
        
        const client = clients[0];
        console.log('Client found:', client);
        
        // Store the Client ID and email for syncing
        setClientId(client.id);
        setClientEmail(client.email || null);
        console.log('Stored clientId:', client.id, 'clientEmail:', client.email);

        // 2. Check if Client has existing FactFind
        if (client.fact_find_id) {
          console.log('Loading existing FactFind:', client.fact_find_id);
          const existing = await base44.entities.FactFind.filter({ id: client.fact_find_id });
          if (existing[0]) {
            console.log('Loaded FactFind:', existing[0]);
            setFactFind(existing[0]);
          } else {
            throw new Error('FactFind ID exists on Client but record not found');
          }
        } else {
          // 3. Create new FactFind
          console.log('Creating new FactFind for client:', client.id);
          const newFactFind = await base44.entities.FactFind.create({
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
          console.log('Created FactFind:', newFactFind);

          // 4. Link to Client (preserve all existing fields)
           await base44.entities.Client.update(client.id, {
             ...client,
             fact_find_id: newFactFind.id
           });
           console.log('Linked FactFind to Client');

          setFactFind(newFactFind);
        }

        console.log('=== initFactFind SUCCESS ===');
      } catch (err) {
        console.error('useFactFind error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    initFactFind();
  }, [navClientId]); // Depend on navClientId, not navigationChain

  const updateSection = useCallback(async (sectionName, data) => {
    if (!factFind?.id) {
      console.error('updateSection: No FactFind ID');
      return false;
    }

    try {
      console.log(`Saving section "${sectionName}":`, data);

      // FETCH CURRENT DATA FROM DATABASE (not local state)
      const current = await base44.entities.FactFind.filter({ id: factFind.id });
      const currentData = current[0];

      // Strip metadata fields from current data
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
        ...cleanData
      } = currentData;

      // Build the existing client1FactFind from clean data
      const existingClient1 = cleanData.client1FactFind || {};

      // Top-level passthrough keys
      const TOP_LEVEL_KEYS = [
        'super_tax', 'dependants', 'trusts_companies',
        'advice_reason', 'risk_profile',
        'sections_completed', 'completion_percentage'
      ];

      // Map frontend section keys into the API structure
      const mapSectionToPayload = (section, value, client1) => {
        switch (section) {
          case 'personal':
            return { client1FactFind: { ...client1, personal: value } };
          case 'income_expenses':
            return {
              client1FactFind: {
                ...client1,
                ...(value.incomes !== undefined ? { incomes: value.incomes } : {}),
                ...(value.expenses !== undefined ? { expenses: value.expenses } : {})
              }
            };
          case 'superannuation':
            return { client1FactFind: { ...client1, superFunds: value } };
          case 'investment':
            return { client1FactFind: { ...client1, investments: value } };
          case 'assets_liabilities':
            return {
              client1FactFind: {
                ...client1,
                ...(value.properties !== undefined ? { properties: value.properties } : {}),
                ...(value.debts !== undefined ? { debts: value.debts } : {})
              }
            };
          case 'insurance':
            return { client1FactFind: { ...client1, insurance: value } };
          default:
            if (TOP_LEVEL_KEYS.includes(section)) {
              return { [section]: value };
            }
            // Unknown section — pass through at top level
            return { [section]: value };
        }
      };

      const mapped = mapSectionToPayload(sectionName, data, existingClient1);

      // Merge mapped data into the clean payload, preserving existing top-level fields
      const payload = { ...cleanData, ...mapped };

      await base44.entities.FactFind.update(factFind.id, payload);

      // Update local state
      setFactFind(prev => ({
        ...prev,
        ...mapped
      }));

      console.log(`Section "${sectionName}" saved successfully`);
      return true;
    } catch (err) {
      console.error(`Failed to save section "${sectionName}":`, err);
      return false;
    }
  }, [factFind?.id]);

  return {
    factFind,
    loading,
    error,
    updateSection,
    setFactFind,
    clientEmail,
    clientId // Return the stored Client.id
  };
}