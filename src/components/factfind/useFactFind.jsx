import { useState, useEffect, useCallback, useMemo } from 'react';
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

  const navClientId = useMemo(() => {
    return navigationChain?.find(n => n.type === 'client')?.id;
  }, [navigationChain]);

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
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    initFactFind();
  }, [navClientId]); // Depend on navClientId, not navigationChain

  const updateSection = useCallback(async (sectionName, data) => {
    if (!factFind?.id) {
      return false;
    }

    try {

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

      // All sections are stored as top-level keys on the FactFind record,
      // matching how every page reads them (e.g. factFind.personal,
      // factFind.income_expenses, factFind.superannuation, etc.).
      const mapped = { [sectionName]: data };

      // Merge mapped data into the clean payload, preserving existing top-level fields
      const payload = { ...cleanData, ...mapped };

      await base44.entities.FactFind.update(factFind.id, payload);

      // Update local state
      setFactFind(prev => ({
        ...prev,
        ...mapped
      }));

      return true;
    } catch (err) {
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