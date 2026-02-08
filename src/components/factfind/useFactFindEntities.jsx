import { useMemo } from 'react';

/**
 * Hook to build a unified list of all entities (principals, dependants, trusts, companies)
 * for use in relationship dropdowns across the fact find.
 * 
 * Returns array like:
 * [
 *   { id: 'client', label: 'Jimmy Jones', type: 'Principal' },
 *   { id: 'partner', label: 'Jane Jones', type: 'Principal' },
 *   { id: 'dep_0', label: 'Tom Jones', type: 'Dependant (Child)' },
 *   { id: 'trust_0', label: 'Jones Family Trust', type: 'Trust' },
 * ]
 * 
 * @param {object} factFind - The fact find data object
 * @param {object} [options] - Optional filters
 * @param {string} [options.excludeId] - Entity ID to exclude (e.g., prevent trust being its own beneficiary)
 * @param {string[]} [options.types] - Filter by type: ['Principal', 'Dependant', 'Dependant (Child)', 'Trust', 'Company', 'SMSF']
 */
export function useFactFindEntities(factFind, options = {}) {
  const { excludeId, types } = options;
  
  return useMemo(() => {
    const entities = [];

    // Add client principal
    if (factFind?.personal?.first_name) {
      const clientName = `${factFind.personal.first_name} ${factFind.personal.last_name || ''}`.trim();
      entities.push({
        id: 'client',
        label: clientName,
        type: 'Principal',
        person: 'client'
      });
    }

    // Add partner principal if exists
    if (factFind?.personal?.partner?.first_name) {
      const partnerName = `${factFind.personal.partner.first_name} ${factFind.personal.partner.last_name || ''}`.trim();
      entities.push({
        id: 'partner',
        label: partnerName,
        type: 'Principal',
        person: 'partner'
      });
    }

    // Add children dependants
    if (Array.isArray(factFind?.dependants?.children)) {
      factFind.dependants.children.forEach((child, i) => {
        if (child.child_name) {
          entities.push({
            id: `child_${i}`,
            label: child.child_name,
            type: 'Dependant (Child)',
            index: i
          });
        }
      });
    }

    // Add adult dependants
    if (Array.isArray(factFind?.dependants?.dependants_list)) {
      factFind.dependants.dependants_list.forEach((dep, i) => {
        if (dep.dep_name) {
          entities.push({
            id: `dependent_${i}`,
            label: dep.dep_name,
            type: 'Dependant',
            index: i
          });
        }
      });
    }

    // Add trusts
    if (Array.isArray(factFind?.trusts_companies?.entities)) {
      factFind.trusts_companies.entities.forEach((entity, i) => {
        if (entity.type === 'trust' && entity.trust_name) {
          entities.push({
            id: `trust_${i}`,
            label: entity.trust_name,
            type: 'Trust',
            index: i
          });
        }
      });
    }

    // Add companies
    if (Array.isArray(factFind?.trusts_companies?.entities)) {
      factFind.trusts_companies.entities.forEach((entity, i) => {
        if (entity.type === 'company' && entity.company_name) {
          entities.push({
            id: `company_${i}`,
            label: entity.company_name,
            type: 'Company',
            index: i
          });
        }
      });
    }

    // Add SMSFs
    if (Array.isArray(factFind?.smsf?.smsf_details)) {
      factFind.smsf.smsf_details.forEach((smsf, i) => {
        if (smsf.smsf_name) {
          entities.push({
            id: `smsf_${i}`,
            label: smsf.smsf_name,
            type: 'SMSF',
            index: i
          });
        }
      });
    }

    // Apply filters
    let filtered = entities;
    
    // Filter by excluded ID
    if (excludeId) {
      filtered = filtered.filter(e => e.id !== excludeId);
    }
    
    // Filter by types
    if (types && types.length > 0) {
      const normalizedTypes = types.map(t => t.toLowerCase());
      filtered = filtered.filter(e => {
        const entityType = e.type.toLowerCase();
        return normalizedTypes.some(t => entityType.includes(t));
      });
    }
    
    return filtered;
  }, [factFind, excludeId, types]);
}