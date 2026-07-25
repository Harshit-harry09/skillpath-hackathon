/**
 * Company Type Detector — O(1) keyword Map lookup.
 * Saves LLM tokens by classifying JD company type locally.
 */

const COMPANY_KEYWORDS = new Map<string, string>([
  ["startup",    "startup"],
  ["seed",       "startup"],
  ["series a",   "startup"],
  ["series b",   "startup"],
  ["fast-paced", "startup"],
  ["equity",     "startup"],
  ["scale-up",   "scaleup"],
  ["scaleup",    "scaleup"],
  ["hyper-growth","scaleup"],
  ["series c",   "scaleup"],
  ["series d",   "scaleup"],
  ["agency",     "agency"],
  ["clients",    "agency"],
  ["consulting",  "agency"],
  ["client-facing","agency"],
]);

export function detectCompanyType(jdText: string): string {
  const text = jdText.toLowerCase();
  for (const [keyword, type] of COMPANY_KEYWORDS) {
    if (text.includes(keyword)) return type;
  }
  return "enterprise";
}
