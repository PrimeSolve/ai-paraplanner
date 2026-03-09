import { useState, useEffect, useCallback, useRef } from 'react';
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
      return false;
    }

    // Skip save if the section data is identical to what we already have
    const existing = current[sectionName];
    if (existing !== undefined) {
      try {
        if (JSON.stringify(existing) === JSON.stringify(data)) {
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

      // Deep-merge for Client1FactFind: multiple pages write different sub-fields,
      // so we must preserve existing sub-fields when saving new ones.
      let sectionData = data;
      if (sectionName === 'Client1FactFind') {
        const existing = cleanData._client1_fact_find;
        if (existing && typeof existing === 'object' && !Array.isArray(existing)) {
          sectionData = { ...existing, ...data };
        }
      }

      const mapped = { [sectionName]: sectionData };
      const payload = {
        ...cleanData,
        ...mapped,
        client1_id: clientIdRef.current || _staleClientId,
      };

      await base44.entities.FactFind.update(current.id, payload);

      // Update local state
      setFactFind(prev => ({
        ...prev,
        ...mapped
      }));

      return true;
    } catch (err) {
      console.error(`Failed to save section "${sectionName}":`, err);
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
