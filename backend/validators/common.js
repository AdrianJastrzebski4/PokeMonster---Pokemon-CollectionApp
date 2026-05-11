function isInt(n) {
  return Number.isInteger(n);
}

function isNonEmptyString(v, minLen = 1, maxLen = 9999) {
  if (typeof v !== "string") return false;
  const s = v.trim();
  return s.length >= minLen && s.length <= maxLen;
}

function isNullableDate(v) {
  if (v === null || v === undefined || v === "") return true;
  
  return /^\d{4}-\d{2}-\d{2}$/.test(String(v));
}

function isNullableNumber(v) {
  if (v === null || v === undefined || v === "") return true;
  return Number.isFinite(Number(v));
}

module.exports = { isInt, isNonEmptyString, isNullableDate, isNullableNumber };