import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useRole } from '@/components/RoleContext';

/**
 * Hook to manage FactFind initialization and auto-creation
 * - Loads existing FactFind from URL params or Client record
 * - Creates new FactFind if none exists
 * - Links FactFind to Client via fact_find_id
 * - Provides updateSection() for auto-saving section data
 */
export function useFactFind() {
  const [factFind, setFactFind] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { navigationChain } = useRole();
  const saveTimeoutRef = useRef({});

  useEffect(() => {
    // Don't run until we have navigationChain
    if (!navigationChain || navigationChain.length === 0) {
      console.log('⏳ Waiting for navigationChain...');
      return;
    }

    const initFactFind = async () => {
      console.log('🔍 useFactFind: Starting initialization');
      console.log('Navigation chain:', navigationChain);
      
      try {
        const params = new URLSearchParams(window.location.search);
        const urlId = params.get('id');
        console.log('URL ID:', urlId);

        // Try to get FactFind from URL first
        if (urlId) {
          console.log('Attempting to load FactFind by ID:', urlId);
          const finds = await base44.entities.FactFind.filter({ id: urlId });
          console.log('FactFind search result:', finds);
          if (finds[0]) {
            console.log('✅ FactFind loaded from URL:', finds[0].id);
            setFactFind(finds[0]);
            setLoading(false);
            return;
          }
        }

        // Get client email from navigation chain
        const clientNav = navigationChain?.find(n => n.type === 'client');
        console.log('Client from nav chain:', clientNav);
        
        if (!clientNav?.id) {
          console.log('❌ No client found in navigation chain');
          setError('No client found');
          setLoading(false);
          return;
        }

        // Load client record by email (id is actually the email)
        console.log('Loading client by email:', clientNav.id);
        const clients = await base44.entities.Client.filter({ email: clientNav.id });
        const client = clients[0];
        console.log('Client found:', client);

        if (!client) {
          console.log('❌ Client not found in database');
          setError('Client not found');
          setLoading(false);
          return;
        }

        // Check if client already has a FactFind
        if (client.fact_find_id) {
          console.log('Client has fact_find_id:', client.fact_find_id);
          const existingFactFind = await base44.entities.FactFind.filter({
            id: client.fact_find_id
          });
          console.log('Existing FactFind lookup result:', existingFactFind);
          if (existingFactFind[0]) {
            console.log('✅ FactFind loaded from Client record:', existingFactFind[0].id);
            setFactFind(existingFactFind[0]);
            setLoading(false);
            return;
          }
        }

        // Create new FactFind
        console.log('📝 Creating new FactFind...');
        const newFactFind = await base44.entities.FactFind.create({
          status: 'in_progress',
          completion_percentage: 0,
          sections_completed: [],
          personal: {
            client: {
              first_name: client.first_name || '',
              last_name: client.last_name || '',
              email: clientNav.id
            }
          }
        });
        console.log('✅ New FactFind created:', newFactFind.id);

        // Link FactFind to Client
        console.log('🔗 Linking FactFind to Client...');
        await base44.entities.Client.update(client.id, {
          fact_find_id: newFactFind.id
        });
        console.log('✅ Client updated with fact_find_id');

        // Update URL with new ID
        window.history.replaceState({}, '', `?id=${newFactFind.id}`);

        setFactFind(newFactFind);
        setLoading(false);
      } catch (err) {
        console.error('❌ Error initializing FactFind:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    initFactFind();
  }, [navigationChain]);

  /**
   * Update a section of the FactFind
   * Auto-saves after 1 second of inactivity (debounced)
   * Marks section as completed
   */
  const updateSection = async (sectionName, sectionData) => {
    if (!factFind?.id) {
      console.log('⚠️ updateSection: No factFind.id, skipping save');
      return;
    }

    console.log(`📝 updateSection triggered for: ${sectionName}`);

    // Clear existing timeout for this section
    if (saveTimeoutRef.current[sectionName]) {
      clearTimeout(saveTimeoutRef.current[sectionName]);
    }

    // Debounce the save
    saveTimeoutRef.current[sectionName] = setTimeout(async () => {
      try {
        console.log(`💾 Saving ${sectionName} to FactFind ${factFind.id}`, sectionData);
        
        const updateData = {
          [sectionName]: sectionData
        };

        // Mark section as completed if not already
        const sectionsCompleted = [...(factFind.sections_completed || [])];
        if (!sectionsCompleted.includes(sectionName)) {
          sectionsCompleted.push(sectionName);
          updateData.sections_completed = sectionsCompleted;
          updateData.completion_percentage = Math.round((sectionsCompleted.length / 14) * 100);
        }

        const updated = await base44.entities.FactFind.update(factFind.id, updateData);
        console.log(`✅ ${sectionName} saved successfully`);
        setFactFind(updated);
      } catch (err) {
        console.error(`❌ Error saving ${sectionName}:`, err);
      }
    }, 1000);
  };

  return { factFind, loading, error, setFactFind, updateSection };
}