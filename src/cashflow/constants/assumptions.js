// ═══════════════════════════════════════════════════════════════
// Australian Age Pension Engine — Dynamic Social Security Assessment
// Assets test + Income test (with deeming) → lower of two → pension entitlement
// Rates as at 20 March 2025 (couple combined, homeowners)
// ═══════════════════════════════════════════════════════════════

export const AGE_PENSION_PARAMS = {
  // Pension age
  pensionAge: 67,
  // Maximum fortnightly rates (couple combined, each gets half)
  maxFortnightCouple: 1732.00,        // $866.00 each × 2
  maxAnnualCouple: 45032.00,          // 26 fortnights × $1,732
  maxFortnightSingle: 1144.40,
  maxAnnualSingle: 29754.40,
  // Energy supplement (couple combined)
  energySupCouple: 372.80,            // $186.40 each × 2 per year
  // Assets test thresholds (couple combined, homeowners)
  assetsThresholdCoupleHO: 451500,
  assetsCutoffCoupleHO: 1012500,
  // Assets test (couple, NON-homeowner)
  assetsThresholdCoupleNHO: 654500,
  assetsCutoffCoupleNHO: 1215500,
  // Assets test (single, homeowner)
  assetsThresholdSingleHO: 301750,
  assetsCutoffSingleHO: 674000,
  // Assets test (single, NON-homeowner)
  assetsThresholdSingleNHO: 504750,
  assetsCutoffSingleNHO: 877000,
  // Assets test taper
  assetsReductionRate: 3.00,          // $3.00 per fortnight per $1,000 over threshold
  // Income test thresholds (couple combined)
  incomeThresholdCouple: 360,         // Per fortnight combined
  incomeReductionRate: 0.25,          // 25 cents per dollar over threshold per person
  // Income test (single)
  incomeThresholdSingle: 212,
  // Deeming rates
  deemingThresholdCouple: 99200,      // Combined threshold
  deemingThresholdSingle: 60400,
  deemingRateLower: 0.0025,           // 0.25% on first portion
  deemingRateUpper: 0.0225,           // 2.25% on balance above threshold
  // CPI indexation (applied to thresholds annually)
  cpiRate: 0.025,
  // Rent Assistance (non-homeowners, couple combined)
  rentAssistMaxCouple: 4680.40,       // Max annual ($180.02/fn × 26)
  rentAssistThresholdCouple: 258.00,  // Min rent/fn before RA kicks in (couple)
  rentAssistMaxSingle: 4237.60,       // Max annual ($163.00/fn × 26)
  rentAssistThresholdSingle: 141.80,  // Min rent/fn (single)
  rentAssistRate: 0.75,               // 75c per dollar of rent above threshold
};
