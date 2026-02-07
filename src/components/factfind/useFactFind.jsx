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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  console.log('=== useFactFind HOOK ===');
  console.log('navigationChain:', navigationChain);
  
  // Extract clientEmail at render time
  const clientNav = navigationChain?.find(n => n.type === 'client');
  console.log('clientNav:', clientNav);
  
  const clientEmail = clientNav?.id;
  console.log('clientEmail:', clientEmail);

  useEffect(() => {
    // Don't run until we have a client email
    if (!clientEmail) {
      console.log('useFactFind: No clientEmail yet, waiting...');
      setLoading(false);
      return;
    }

    console.log('useFactFind: clientEmail available, initializing...', clientEmail);

    async function initFactFind() {
      try {
        setLoading(true);
        console.log('=== initFactFind START ===');

        // 1. Get Client record
        const clients = await base44.entities.Client.filter({ email: clientEmail });
        console.log('Client query result:', clients);
        
        if (!clients || clients.length === 0) {
          throw new Error(`No client found with email: ${clientEmail}`);
        }
        
        const client = clients[0];
        console.log('Client found:', client);

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
              client: {
                first_name: client.first_name || '',
                last_name: client.last_name || '',
                email: clientEmail
              }
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
  }, [clientEmail]); // Depend on clientEmail, not navigationChain

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
      
      // Merge new data with current database data
      const updatedData = {
        ...currentData,
        [sectionName]: data
      };
      
      // Remove any metadata fields that shouldn't be in the update
      delete updatedData.id;
      delete updatedData.created_date;
      delete updatedData.updated_date;
      delete updatedData.created_by;
      delete updatedData.created_by_id;
      delete updatedData.entity_name;
      delete updatedData.app_id;
      delete updatedData.is_sample;
      delete updatedData.is_deleted;
      delete updatedData.deleted_date;
      delete updatedData.environment;
      
      await base44.entities.FactFind.update(factFind.id, updatedData);
      
      // Update local state
      setFactFind(prev => ({
        ...prev,
        [sectionName]: data
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
    clientId: factFind?.client_id // Add clientId for syncing with Client entity
  };
}