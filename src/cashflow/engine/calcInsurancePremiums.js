/* ─── calcInsurancePremiums ─── extracted from CashflowModelInner ─── */

/**
 * Calculates insurance premium projections for a client.
 * Separates non-super and inside-super premiums with inflation bands.
 *
 * @param {Object} ctx — { N_YEARS, engineData }
 * @param {string} clientKey — "client1" or "client2"
 * @returns {Object} { nonSuperLifeVals, nonSuperTpdVals, nonSuperTraumaVals, nonSuperIpVals, nonSuperTotalVals, superTotalVals }
 */
export const calcInsurancePremiums = (ctx, clientKey) => {
  const { N_YEARS, engineData } = ctx;
  const policies = (engineData.insurance?.policies || []).filter(p => p.pol_insured === clientKey);
  const isNonSuper = (p) => {
    const env = (p.pol_tax_env || p.pol_structure || "").toLowerCase();
    return !env.includes("super") || env.includes("non");
  };

  // Inflation bands from advice request (same as premium projection page)
  const insData = engineData.advice_request?.adv_insurance || {};
  const personData = insData[clientKey] || {};
  const savedBands = personData.assumptions?.inflation_bands || [{ rate: 2.5, years: 10 }, { rate: 3.0, years: 20 }];
  const inflationMult = [];
  let cumMult = 1;
  let bandIdx = 0, yearInBand = 0;
  for (let y = 0; y < N_YEARS; y++) {
    inflationMult.push(cumMult);
    const band = savedBands[bandIdx];
    if (band) {
      cumMult *= (1 + (band.rate || 0) / 100);
      yearInBand++;
      if (yearInBand >= (band.years || 999) && bandIdx < savedBands.length - 1) { bandIdx++; yearInBand = 0; }
    }
  }

  // Non-super premium arrays
  const nonSuperLifeVals = new Array(N_YEARS).fill(0);
  const nonSuperTpdVals = new Array(N_YEARS).fill(0);
  const nonSuperTraumaVals = new Array(N_YEARS).fill(0);
  const nonSuperIpVals = new Array(N_YEARS).fill(0);
  const nonSuperTotalVals = new Array(N_YEARS).fill(0);

  // Inside super premium arrays (for reference / super fee deduction later)
  const superTotalVals = new Array(N_YEARS).fill(0);

  policies.forEach(pol => {
    const nonSuper = isNonSuper(pol);
    for (let y = 0; y < N_YEARS; y++) {
      if (pol.premium_life && parseFloat(pol.premium_life)) {
        const v = Math.round((parseFloat(pol.premium_life)) * inflationMult[y]);
        if (nonSuper) nonSuperLifeVals[y] += v; else superTotalVals[y] += v;
      }
      if (pol.premium_tpd && parseFloat(pol.premium_tpd)) {
        const v = Math.round((parseFloat(pol.premium_tpd)) * inflationMult[y]);
        if (nonSuper) nonSuperTpdVals[y] += v; else superTotalVals[y] += v;
      }
      if (pol.premium_trauma && parseFloat(pol.premium_trauma)) {
        const v = Math.round((parseFloat(pol.premium_trauma)) * inflationMult[y]);
        if (nonSuper) nonSuperTraumaVals[y] += v; else superTotalVals[y] += v;
      }
      if (pol.premium_ip && parseFloat(pol.premium_ip)) {
        const v = Math.round((parseFloat(pol.premium_ip)) * inflationMult[y]);
        if (nonSuper) nonSuperIpVals[y] += v; else superTotalVals[y] += v;
      }
    }
  });
  for (let y = 0; y < N_YEARS; y++) {
    nonSuperTotalVals[y] = nonSuperLifeVals[y] + nonSuperTpdVals[y] + nonSuperTraumaVals[y] + nonSuperIpVals[y];
  }

  return { nonSuperLifeVals, nonSuperTpdVals, nonSuperTraumaVals, nonSuperIpVals, nonSuperTotalVals, superTotalVals };
};
