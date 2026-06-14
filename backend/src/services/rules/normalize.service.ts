// POS terminal and payment processor prefixes that obscure the real merchant
const POS_PREFIXES = [
  /^SQ \*/,
  /^SQ\*/,
  /^TST\* ?/,
  /^CKE\*/,
  /^PP\*/,
];

// Variants that should collapse to a single canonical name.
// Tested AFTER POS prefix stripping, BEFORE location stripping.
const ALIASES: [RegExp, string][] = [
  [/^AMZN\b/, "AMAZON"],
  [/^AMZ\b/, "AMAZON"],
  [/^AMAZON PRIME\b/, "AMAZON PRIME"],
  [/^AMAZON\b.*/, "AMAZON"],
  [/^APPLE\.COM.*/, "APPLE"],
  [/^APPLE PAY.*/, "APPLE"],
  [/^GOOGLE \*/, "GOOGLE"],
  [/^WAL-?MART\b/, "WALMART"],
  [/^SAMS ?CLUB\b/, "SAMS CLUB"],
  [/^COSTCO\b.*/, "COSTCO"],
  [/^MCDONALD'?S\b/, "MCDONALDS"],
  [/^CHICK-?FIL-?A\b/, "CHICK FIL A"],
];

const US_STATES = new Set([
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
]);

// Trailing city/state/zip pattern: "TULSA OK", "SPRINGFIELD IL 62704"
function stripTrailingLocation(s: string): string {
  const tokens = s.split(/\s+/);
  if (tokens.length < 2) return s;

  // Walk backwards: optional zip, then state code, then everything before is the name
  let end = tokens.length;

  // Strip trailing zip (5 digits or 5+4)
  if (end > 0 && /^\d{5}(-\d{4})?$/.test(tokens[end - 1])) end--;

  // Strip 2-letter state code
  if (end > 0 && US_STATES.has(tokens[end - 1])) end--;

  // Only trim if we actually removed something AND there's still a name left
  if (end < tokens.length && end > 0) return tokens.slice(0, end).join(" ");
  return s;
}

export function normalizeMerchantName(raw: string | null): string | null {
  if (!raw) return null;

  let name = raw.toUpperCase().trim();

  // Strip POS prefixes
  for (const prefix of POS_PREFIXES) {
    name = name.replace(prefix, "");
  }

  // Apply known aliases (early return if matched, alias is already canonical)
  for (const [pattern, canonical] of ALIASES) {
    if (pattern.test(name)) return canonical;
  }

  // Strip store / reference numbers: "#1234", "57444350299"
  name = name.replace(/#\d+/g, "");
  name = name.replace(/\b\d{6,}\b/g, "");

  // Strip trailing location
  name = stripTrailingLocation(name);

  // Remove non-alphanumeric except spaces
  name = name.replace(/[^A-Z0-9 ]/g, "");

  // Collapse whitespace
  name = name.replace(/\s+/g, " ").trim();

  return name || null;
}
