// Australian Tax Calculations — 2025/26 brackets
// Pure functions: no closure dependencies

// Income tax brackets 2025/26
export const calcTax = (ti) => {
  if (ti <= 18200) return 0;
  if (ti <= 45000) return Math.round((ti - 18200) * 0.16);
  if (ti <= 135000) return Math.round(4288 + (ti - 45000) * 0.30);
  if (ti <= 190000) return Math.round(31288 + (ti - 135000) * 0.37);
  return Math.round(51638 + (ti - 190000) * 0.45);
};

// Low Income Tax Offset (LITO) 2025/26
export const calcLITO = (ti) => {
  if (ti <= 45000) return 700;
  if (ti <= 66667) return Math.round(700 - (ti - 45000) * 0.05);
  return 0;
};

// Marginal tax rate
export const calcMarginalRate = (ti) => {
  if (ti <= 18200) return 0;
  if (ti <= 45000) return 0.16;
  if (ti <= 135000) return 0.30;
  if (ti <= 190000) return 0.37;
  return 0.45;
};

// Medicare levy (2% above $26,000 threshold)
export const calcMedicare = (ti) => ti > 26000 ? Math.round(ti * 0.02) : 0;

// Calculate net after-tax salary for a wage earner
export const calcNetSalary = (grossAnnual, superIncluded) => {
  if (!grossAnnual || grossAnnual <= 0) return 0;
  const taxableIncome = superIncluded === "1"
    ? Math.round(grossAnnual / 1.115)
    : grossAnnual;
  let tax = 0;
  if (taxableIncome <= 18200) tax = 0;
  else if (taxableIncome <= 45000) tax = (taxableIncome - 18200) * 0.16;
  else if (taxableIncome <= 135000) tax = 4288 + (taxableIncome - 45000) * 0.30;
  else if (taxableIncome <= 190000) tax = 31288 + (taxableIncome - 135000) * 0.37;
  else tax = 51638 + (taxableIncome - 190000) * 0.45;
  let lito = 0;
  if (taxableIncome <= 37500) lito = 700;
  else if (taxableIncome <= 45000) lito = 700 - (taxableIncome - 37500) * 0.05;
  else if (taxableIncome <= 66667) lito = 325 - (taxableIncome - 45000) * 0.015;
  const medicare = taxableIncome > 26000 ? taxableIncome * 0.02 : 0;
  const netTax = Math.max(0, tax - lito) + medicare;
  return Math.round(taxableIncome - netTax);
};

// Quick inline net salary calculation (used by holdings & savings engines)
// Same logic as calcNetSalary but takes raw gross without the super inclusion check
export const calcNetSalaryQuick = (gross) => {
  if (!gross || gross <= 0) return 0;
  let tax = 0;
  if (gross <= 18200) tax = 0;
  else if (gross <= 45000) tax = (gross - 18200) * 0.16;
  else if (gross <= 135000) tax = 4288 + (gross - 45000) * 0.30;
  else if (gross <= 190000) tax = 31288 + (gross - 135000) * 0.37;
  else tax = 51638 + (gross - 190000) * 0.45;
  const lito = gross <= 37500 ? 700 : gross <= 45000 ? 700 - (gross - 37500) * 0.05 : gross <= 66667 ? Math.max(0, 325 - (gross - 45000) * 0.015) : 0;
  const medicare = gross > 26000 ? gross * 0.02 : 0;
  return Math.round(gross - Math.max(0, tax - lito) - medicare);
};
