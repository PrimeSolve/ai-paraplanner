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
    const initFactFind = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const urlId = params.get('id');

        // Try to get FactFind from URL first
        if (urlId) {
          const finds = await base44.entities.FactFind.filter({ id: urlId });
          if (finds[0]) {
            setFactFind(finds[0]);
            setLoading(false);
            return;
          }
        }

        // Get client email from navigation chain
        const clientNav = navigationChain?.find(n => n.type === 'client');
        if (!clientNav?.id) {
          setError('No client found');
          setLoading(false);
          return;
        }

        // Load client record by email (id is actually the email)
        const clients = await base44.entities.Client.filter({ email: clientNav.id });
        const client = clients[0];

        if (!client) {
          setError('Client not found');
          setLoading(false);
          return;
        }

        // Check if client already has a FactFind
        if (client.fact_find_id) {
          const existingFactFind = await base44.entities.FactFind.filter({
            id: client.fact_find_id
          });
          if (existingFactFind[0]) {
            setFactFind(existingFactFind[0]);
            setLoading(false);
            return;
          }
        }

        // Create new FactFind
        const newFactFind = await base44.entities.FactFind.create({
          status: 'in_progress',
          completion_percentage: 0,
          sections_completed: [],
          personal: {
            first_name: client.first_name || '',
            last_name: client.last_name || '',
            email: clientNav.id
          }
        });

        // Link FactFind to Client
        await base44.entities.Client.update(client.id, {
          fact_find_id: newFactFind.id
        });

        setFactFind(newFactFind);
        setLoading(false);
      } catch (err) {
        console.error('Error initializing FactFind:', err);
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
    if (!factFind?.id) return;

    // Clear existing timeout for this section
    if (saveTimeoutRef.current[sectionName]) {
      clearTimeout(saveTimeoutRef.current[sectionName]);
    }

    // Debounce the save
    saveTimeoutRef.current[sectionName] = setTimeout(async () => {
      try {
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
        setFactFind(updated);
      } catch (err) {
        console.error(`Error saving ${sectionName}:`, err);
      }
    }, 1000);
  };

  return { factFind, loading, error, setFactFind, updateSection };
}