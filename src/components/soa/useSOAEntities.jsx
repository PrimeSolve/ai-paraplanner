import { useState, useCallback, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Hook to generate a unified list of entities from SOA Request's linked Fact Find
 * Used for entity dropdowns in New Trusts, Companies, SMSF, and Products sections
 */
export function useSOAEntities(soaRequestId) {
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEntities = async () => {
      if (!soaRequestId) {
        setLoading(false);
        return;
      }

      try {
        // Load SOA Request to get fact_find_id
        const requests = await base44.entities.SOARequest.filter({ id: soaRequestId });
        if (!requests[0] || !requests[0].fact_find_id) {
          setLoading(false);
          return;
        }

        // Load FactFind
        const factFinds = await base44.entities.FactFind.filter({ id: requests[0].fact_find_id });
        if (!factFinds[0]) {
          setLoading(false);
          return;
        }

        const ff = factFinds[0];
        const entityList = [];

        // Client principal
        if (ff.personal?.first_name || ff.personal?.last_name) {
          entityList.push({
            id: 'client',
            label: `${ff.personal.first_name || ''} ${ff.personal.last_name || ''}`.trim(),
            type: 'principal',
            color: '#2563eb'
          });
        }

        // Partner principal
        if (ff.personal?.partner?.first_name || ff.personal?.partner?.last_name) {
          entityList.push({
            id: 'partner',
            label: `${ff.personal.partner.first_name || ''} ${ff.personal.partner.last_name || ''}`.trim(),
            type: 'principal',
            color: '#7c3aed'
          });
        }

        // Children
        const children = ff.dependants?.children || [];
        children.forEach((child, idx) => {
          const name = `${child.first_name || ''} ${child.last_name || ''}`.trim() || `Child ${idx + 1}`;
          entityList.push({
            id: `child_${idx}`,
            label: name,
            type: 'child',
            color: '#10b981'
          });
        });

        // Adult dependants
        const dependants = ff.dependants?.dependants_list || [];
        dependants.forEach((dep, idx) => {
          const name = `${dep.first_name || ''} ${dep.last_name || ''}`.trim() || `Dependant ${idx + 1}`;
          entityList.push({
            id: `dependant_${idx}`,
            label: name,
            type: 'dependant',
            color: '#f59e0b'
          });
        });

        // Trusts & Companies from entities array
        const tcEntities = ff.trusts_companies?.entities || [];
        tcEntities.forEach((entity, idx) => {
          if (entity.type === 'trust') {
            entityList.push({
              id: `trust_${idx}`,
              label: entity.trust_name || entity.name || `Trust ${idx + 1}`,
              type: 'trust',
              color: '#ef4444'
            });
          } else if (entity.type === 'company') {
            entityList.push({
              id: `company_${idx}`,
              label: entity.company_name || entity.name || `Company ${idx + 1}`,
              type: 'company',
              color: '#f97316'
            });
          }
        });

        // SMSFs
        const smsfs = ff.smsf?.smsf_details || [];
        smsfs.forEach((smsf, idx) => {
          entityList.push({
            id: `smsf_${idx}`,
            label: smsf.name || smsf.smsf_name || `SMSF ${idx + 1}`,
            type: 'smsf',
            color: '#ef4444'
          });
        });

        console.log('useSOAEntities - loaded entities:', entityList);
        console.log('useSOAEntities - entity count:', entityList.length);
        console.log('useSOAEntities - types:', entityList.map(e => e.type));
        setEntities(entityList);
      } catch (error) {
        console.error('Failed to load SOA entities:', error);
      } finally {
        setLoading(false);
      }
    };

    loadEntities();
  }, [soaRequestId]);

  // Helper to filter by types
  const getByTypes = useCallback((typeArray) => {
    return entities.filter(e => typeArray.includes(e.type));
  }, [entities]);

  return {
    entities,
    loading,
    getByTypes
  };
}