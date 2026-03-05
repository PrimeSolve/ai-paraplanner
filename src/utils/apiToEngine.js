/**
 * Convert a client record from the PrimeSolve API format (snake_case)
 * into the shape expected by the cashflow modelling engine.
 *
 * The API returns fields like first_name, last_name, date_of_birth, etc.
 * The engine expects a nested structure with personal, financial, and
 * superannuation sections.
 */
export function apiToEngine(client) {
  if (!client) return null;

  return {
    id: client.id,
    personal: {
      firstName: client.first_name || '',
      lastName: client.last_name || '',
      dateOfBirth: client.date_of_birth || null,
      gender: client.gender || null,
      maritalStatus: client.marital_status || null,
      retirementAge: client.retirement_age || null,
      employmentStatus: client.employment_status || null,
      occupation: client.occupation || null,
      email: client.email || '',
      phone: client.phone || '',
    },
    financial: {
      income: client.income || null,
      expenses: client.expenses || null,
      assets: client.assets || [],
      liabilities: client.liabilities || [],
      investments: client.investments || [],
      cash: client.cash || null,
    },
    superannuation: {
      funds: client.super_funds || client.superannuation || [],
      balance: client.super_balance || null,
      contributions: client.super_contributions || null,
      insuranceInSuper: client.insurance_in_super || [],
    },
    insurance: {
      existing: client.insurance_existing || client.insurance || [],
    },
    dependants: client.dependants || [],
    goals: client.goals || client.objectives || [],
    riskProfile: client.risk_profile || null,
    adviser: {
      id: client.adviser_id || null,
      email: client.adviser_email || null,
    },
  };
}
