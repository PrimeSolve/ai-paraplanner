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
 */
export function useFactFindEntities(factFind) {
  return useMemo(() => {
    console.log('=== useFactFindEntities DEBUG ===');
    console.log('factFind:', factFind);
    console.log('factFind.personal:', factFind?.personal);
    console.log('factFind.dependants:', factFind?.dependants);
    console.log('factFind.trusts_companies:', factFind?.trusts_companies);
    
    const entities = [];

    // Add client principal
    if (factFind?.personal?.first_name) {
      const clientName = `${factFind.personal.first_name} ${factFind.personal.last_name || ''}`.trim();
      console.log('Adding client:', clientName);
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
      console.log('Adding partner:', partnerName);
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
          console.log('Adding child:', child.child_name);
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
          console.log('Adding dependant:', dep.dep_name);
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
          console.log('Adding trust:', entity.trust_name);
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
          console.log('Adding company:', entity.company_name);
          entities.push({
            id: `company_${i}`,
            label: entity.company_name,
            type: 'Company',
            index: i
          });
        }
      });
    }

    console.log('Final entities array:', entities);
    return entities;
  }, [factFind]);
}