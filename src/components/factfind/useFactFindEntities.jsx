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
 * @param {string[]} [options.types] - Filter by type: ['Principal', 'Dependant', 'Dependant (Child)', 'Trust', 'Company', 'SMSF', 'Wrap', 'Bond']
 */
export function useFactFindEntities(factFind, options = {}) {
  const { excludeId, types } = options;
  
  return useMemo(() => {
    const entities = [];

    const getColorByType = (type) => {
      const typeKey = type.toLowerCase();
      if (typeKey.includes('principal')) {
        // Determine if client or partner - default to blue
        return '#3B82F6'; // Will be updated per entity below
      }
      if (typeKey.includes('child')) return '#22C55E';
      if (typeKey === 'dependant') return '#F59E0B';
      if (typeKey.includes('trust')) return '#EF4444';
      if (typeKey.includes('company')) return '#F97316';
      if (typeKey.includes('smsf')) return '#92400E';
      if (typeKey.includes('wrap')) return '#3B82F6';
      if (typeKey.includes('bond')) return '#3B82F6';
      return '#6B7280'; // Grey default
    };

    // Add client principal
    if (factFind?.personal?.first_name) {
      const clientName = `${factFind.personal.first_name} ${factFind.personal.last_name || ''}`.trim();
      entities.push({
        id: 'client',
        label: clientName,
        type: 'Principal',
        person: 'client',
        color: '#3B82F6'
      });
    }

    // Add partner principal if exists
    if (factFind?.personal?.partner?.first_name) {
      const partnerName = `${factFind.personal.partner.first_name} ${factFind.personal.partner.last_name || ''}`.trim();
      entities.push({
        id: 'partner',
        label: partnerName,
        type: 'Principal',
        person: 'partner',
        color: '#8B5CF6'
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
            index: i,
            color: '#22C55E'
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
            index: i,
            color: '#F59E0B'
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
            index: i,
            color: '#EF4444'
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
            index: i,
            color: '#F97316'
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
            index: i,
            color: '#92400E'
          });
        }
      });
    }

    // Add Wraps
    if (Array.isArray(factFind?.investment?.wraps)) {
      factFind.investment.wraps.forEach((wrap, i) => {
        if (wrap.platform_name) {
          entities.push({
            id: `wrap_${i}`,
            label: wrap.platform_name,
            type: 'Wrap',
            index: i,
            color: '#3B82F6'
          });
        }
      });
    }

    // Add Bonds
    if (Array.isArray(factFind?.investment?.bonds)) {
      factFind.investment.bonds.forEach((bond, i) => {
        if (bond.product_name) {
          entities.push({
            id: `bond_${i}`,
            label: bond.product_name,
            type: 'Bond',
            index: i,
            color: '#3B82F6'
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