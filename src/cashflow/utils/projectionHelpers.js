// Projection helper utilities — pure functions for the engine

// Age at start of a financial year (1 July)
export const ageAtFYStart = (dob, currentFY) => {
  if (!dob) return null;
  const d = new Date(dob);
  const fyStart = new Date(currentFY, 6, 1); // 1 July of current FY
  let a = fyStart.getFullYear() - d.getFullYear();
  if (fyStart.getMonth() < d.getMonth() || (fyStart.getMonth() === d.getMonth() && fyStart.getDate() < d.getDate())) a--;
  return a;
};

// Classify asset type into category
export const assetCategory = (typeCode) => {
  if (["1", "18", "19", "20"].includes(typeCode)) return "property";
  if (["8", "9", "10", "11"].includes(typeCode)) return "defensive";
  if (["12", "13", "26", "42"].includes(typeCode)) return "growth";
  return "lifestyle";
};

// Asset type display names
export const assetTypeMap = {
  "1": "Principal Residence", "19": "Principal Residence (Absent)", "18": "Investment Property",
  "20": "Holiday Home", "2": "Car", "8": "Savings Account", "9": "Term Deposits",
  "12": "Australian Shares", "13": "International Shares", "26": "Managed Funds",
  "10": "Bonds - Australian", "11": "Bonds - International", "7": "Lifestyle - Other", "42": "Investment - Other",
};

// Debt tax deductibility
export const debtDeductible = (typeCode) => ["2", "3"].includes(typeCode) ? "100%" : "0%";

// Offset account weight factor: average proportion of year each periodic payment sits in offset
export const offsetWeightFactor = (freq) => {
  const interval = 365 / freq;
  let sumDays = 0;
  for (let k = 1; k <= freq; k++) {
    sumDays += Math.max(0, 365 - k * interval);
  }
  return sumDays / (365 * freq);
};

// Debt frequency display labels
export const debtFreqLabel = { "52": "Weekly", "26": "Fortnightly", "12": "Monthly", "4": "Quarterly", "1": "Annually" };

// Life expectancy constants
export const LE_FEMALE = 88;
export const LE_MALE = 85;

// Compute current financial year
export const getCurrentFY = () => {
  const now = new Date();
  return now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
};

// Build projection year labels
export const buildProjYears = (length, currentFY) =>
  Array.from({ length }, (_, i) => `${currentFY + i}/${currentFY + i + 1}`);

// Short year labels (e.g. "2025/26")
export const toShortYears = (projYears) =>
  projYears.map(y => { const p = y.split("/"); return p[0].slice(-4) + "/" + p[1].slice(-2); });
