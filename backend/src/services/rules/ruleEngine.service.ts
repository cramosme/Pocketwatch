import { supabaseAdmin } from "../../database/supabase";
import { ServiceError } from "../../lib/errors";
import { Database } from "../../types/database";

// Types
type TransactionUpdate = Database["public"]["Tables"]["transactions"]["Update"];

type MerchantRule = {
  id: string;
  merchant_pattern: string;
  match_type: string;
  envelope_id: string | null;
  custom_category: string | null;
  confidence: number | null;
};

type BankAccount = {
  id: string;
  restricted_to_envelope_ids: string[] | null;
  default_envelope_id: string | null;
  auto_reimburse_fees: boolean | null;
};

type TransactionRow = {
  id: string;
  account_id: string;
  amount: number;
  date: string;
  merchant_name_normalized: string | null;
  plaid_category: string | null;
  is_pending: boolean | null;
};

type TransactionType =
  | "REGULAR"
  | "INTERNAL_TRANSFER"
  | "REFUND"
  | "P2P_CREDIT"
  | "P2P_DEBIT"
  | "CC_PAYMENT"
  | "INCOME";

type CategorizeResult = {
  envelope_id: string | null;
  transaction_type: TransactionType;
  custom_category: string | null;
  confidence: number;
  flag_reason: string | null;
  paired_transaction_id?: string | null; // set only on INTERNAL_TRANSFER legs
};

const FLAG_THRESHOLD = 0.7;

// Known patterns for positive transaction detection
const PAYROLL_PATTERNS = [
  "ADP", "GUSTO", "PAYCHEX", "PAYROLL", "DIRECT DEPOSIT", "DIRECT DEP",
  "PAYLOCITY", "CERIDIAN", "WORKDAY",
];

const GIG_PATTERNS = [
  "DOORDASH PAY", "UBER DRIVER", "LYFT DRIVER", "INSTACART PAY",
  "GRUBHUB PAY", "STRIPE TRANSFER", "STRIPE PAYOUT",
];

const P2P_PATTERNS = ["VENMO", "CASH APP", "PAYPAL", "ZELLE"];

const FEE_REIMBURSE_PATTERNS = [
  "ATM REBATE", "ATM FEE REFUND", "ATM FEE REBATE",
  "FOREIGN FEE REFUND", "FOREIGN TXN FEE REFUND",
  "FEE REIMBURSEMENT", "FEE REVERSAL",
];

// Helpers
function matchesPattern(
  normalized: string,
  pattern: string,
  matchType: string
): boolean {
  switch (matchType) {
    case "exact":
      return normalized === pattern;
    case "prefix":
      return normalized.startsWith(pattern);
    case "contains":
      return normalized.includes(pattern);
    default:
      return false;
  }
}

function matchesList(normalized: string, patterns: string[]): boolean {
  return patterns.some(
    (p) => normalized === p || normalized.startsWith(p)
  );
}

// Rule layers for negative (spending) transactions
function applyAccountBinding(
  account: BankAccount | undefined
): CategorizeResult | null {
  if (!account) return null;
  const restricted = account.restricted_to_envelope_ids;
  if (!restricted || restricted.length === 0) return null;

  const envelopeId =
    restricted.length === 1
      ? restricted[0]
      : account.default_envelope_id ?? restricted[0];

  return {
    envelope_id: envelopeId,
    transaction_type: "REGULAR",
    custom_category: null,
    confidence: 1.0,
    flag_reason: null,
  };
}

function applyMerchantRules(
  normalized: string,
  rules: MerchantRule[]
): CategorizeResult | null {
  // Try exact, then prefix, then contains — first match wins within each tier
  for (const matchType of ["exact", "prefix", "contains"] as const) {
    for (const rule of rules) {
      if (rule.match_type === matchType && matchesPattern(normalized, rule.merchant_pattern, matchType)) {
        const isExact = matchType === "exact";
        return {
          envelope_id: rule.envelope_id,
          transaction_type: "REGULAR",
          custom_category: rule.custom_category,
          confidence: rule.confidence ?? (isExact ? 0.9 : 0.8),
          flag_reason: null,
        };
      }
    }
  }
  return null;
}

// Plaid detailed categories follow a PRIMARY_DETAILED pattern.
// More specific matches go first; broad primary matches catch the rest.
// Confidence is 0.75 for broad primary matches, 0.8 for specific detailed matches.
const PLAID_CATEGORY_MAP: [string, string, number][] = [
  // Food detailed matters here (Groceries vs Dining)
  ["FOOD_AND_DRINK_GROCERIES",              "Groceries",      0.8],
  ["FOOD_AND_DRINK_SUPERSTORES",            "Groceries",      0.75],
  ["FOOD_AND_DRINK_RESTAURANTS",            "Dining",         0.8],
  ["FOOD_AND_DRINK_FAST_FOOD",              "Dining",         0.8],
  ["FOOD_AND_DRINK_COFFEE",                 "Dining",         0.8],
  ["FOOD_AND_DRINK_BEER_WINE_AND_LIQUOR",   "Dining",         0.75],
  ["FOOD_AND_DRINK_VENDING_MACHINES",       "Dining",         0.75],
  ["FOOD_AND_DRINK",                        "Dining",         0.7],

  // Transportation; gas is distinct
  ["TRANSPORTATION_GAS",                    "Gas",            0.8],
  ["TRANSPORTATION_PARKING",                "Transportation", 0.8],
  ["TRANSPORTATION_PUBLIC_TRANSIT",         "Transportation", 0.8],
  ["TRANSPORTATION_TAXIS_AND_RIDE_SHARES",  "Transportation", 0.8],
  ["TRANSPORTATION_TOLLS",                  "Transportation", 0.8],
  ["TRANSPORTATION",                        "Transportation", 0.75],

  // Rent & Utilities; rent is distinct
  ["RENT_AND_UTILITIES_RENT",                       "Rent",      0.8],
  ["RENT_AND_UTILITIES_GAS_AND_ELECTRICITY",        "Utilities", 0.8],
  ["RENT_AND_UTILITIES_INTERNET_AND_CABLE",         "Utilities", 0.8],
  ["RENT_AND_UTILITIES_TELEPHONE",                  "Utilities", 0.8],
  ["RENT_AND_UTILITIES_WATER",                      "Utilities", 0.8],
  ["RENT_AND_UTILITIES_SEWAGE_AND_WASTE_MANAGEMENT","Utilities", 0.8],
  ["RENT_AND_UTILITIES",                            "Utilities", 0.75],

  // Everything else broad primary categories
  ["GENERAL_MERCHANDISE_SUPERSTORES",       "Shopping",        0.75],
  ["GENERAL_MERCHANDISE_CLOTHING_AND_ACCESSORIES", "Shopping",  0.8],
  ["GENERAL_MERCHANDISE_ELECTRONICS",       "Shopping",        0.8],
  ["GENERAL_MERCHANDISE_BOOKSTORES_AND_NEWSSTANDS", "Shopping", 0.8],
  ["GENERAL_MERCHANDISE_DEPARTMENT_STORES", "Shopping",        0.75],
  ["GENERAL_MERCHANDISE_DISCOUNT_STORES",   "Shopping",        0.75],
  ["GENERAL_MERCHANDISE_ONLINE_MARKETPLACES","Shopping",       0.75],
  ["GENERAL_MERCHANDISE_PET_SUPPLIES",      "Shopping",        0.8],
  ["GENERAL_MERCHANDISE_SPORTING_GOODS",    "Shopping",        0.8],
  ["GENERAL_MERCHANDISE_TOBACCO_AND_VAPE",  "Shopping",        0.8],
  ["GENERAL_MERCHANDISE",                   "Shopping",        0.7],

  ["ENTERTAINMENT_MUSIC_AND_AUDIO",         "Entertainment",   0.8],
  ["ENTERTAINMENT_SPORTING_EVENTS",         "Entertainment",   0.8],
  ["ENTERTAINMENT_TV_AND_MOVIES",           "Entertainment",   0.8],
  ["ENTERTAINMENT_VIDEO_GAMES",             "Entertainment",   0.8],
  ["ENTERTAINMENT_CASINOS_AND_GAMBLING",    "Entertainment",   0.8],
  ["ENTERTAINMENT",                         "Entertainment",   0.75],

  ["PERSONAL_CARE_GYMS_AND_FITNESS_CENTERS","Personal Care",   0.8],
  ["PERSONAL_CARE_HAIR_AND_BEAUTY",         "Personal Care",   0.8],
  ["PERSONAL_CARE_LAUNDRY_AND_DRY_CLEANING","Personal Care",   0.8],
  ["PERSONAL_CARE",                         "Personal Care",   0.75],

  ["MEDICAL_DENTAL_CARE",                   "Medical",         0.8],
  ["MEDICAL_EYE_CARE",                      "Medical",         0.8],
  ["MEDICAL_PHARMACIES_AND_SUPPLEMENTS",    "Medical",         0.8],
  ["MEDICAL_VETERINARY_SERVICES",           "Medical",         0.8],
  ["MEDICAL",                               "Medical",         0.75],

  ["HOME_IMPROVEMENT_FURNITURE",            "Home",            0.8],
  ["HOME_IMPROVEMENT_HARDWARE",             "Home",            0.8],
  ["HOME_IMPROVEMENT",                      "Home",            0.75],

  ["TRAVEL_FLIGHTS",                        "Travel",          0.8],
  ["TRAVEL_LODGING",                        "Travel",          0.8],
  ["TRAVEL_RENTAL_CARS",                    "Travel",          0.8],
  ["TRAVEL",                                "Travel",          0.75],

  ["GENERAL_SERVICES_ACCOUNTING_AND_FINANCIAL_PLANNING", "Services", 0.8],
  ["GENERAL_SERVICES_AUTOMOTIVE",           "Services",        0.8],
  ["GENERAL_SERVICES_CHILDCARE",            "Services",        0.8],
  ["GENERAL_SERVICES_CONSULTING_AND_LEGAL", "Services",        0.8],
  ["GENERAL_SERVICES_EDUCATION",            "Education",       0.8],
  ["GENERAL_SERVICES_INSURANCE",            "Insurance",       0.8],
  ["GENERAL_SERVICES_POSTAGE_AND_SHIPPING", "Services",        0.8],
  ["GENERAL_SERVICES_STORAGE",              "Services",        0.8],
  ["GENERAL_SERVICES",                      "Services",        0.75],

  ["GOVERNMENT_AND_NON_PROFIT_DONATIONS",   "Donations",       0.8],
  ["GOVERNMENT_AND_NON_PROFIT_TAX_PAYMENT", "Taxes",           0.8],
  ["GOVERNMENT_AND_NON_PROFIT",             "Government",      0.75],

  ["BANK_FEES_ATM_FEES",                    "Bank Fees",       0.8],
  ["BANK_FEES_FOREIGN_TRANSACTION_FEES",    "Bank Fees",       0.8],
  ["BANK_FEES_INSUFFICIENT_FUNDS",          "Bank Fees",       0.8],
  ["BANK_FEES_INTEREST_CHARGE",             "Bank Fees",       0.8],
  ["BANK_FEES_OVERDRAFT_FEES",              "Bank Fees",       0.8],
  ["BANK_FEES",                             "Bank Fees",       0.75],
];

function applyPlaidFallback(
  plaidCategory: string | null
): CategorizeResult | null {
  if (!plaidCategory) return null;

  const cat = plaidCategory.toUpperCase();

  for (const [prefix, category, confidence] of PLAID_CATEGORY_MAP) {
    if (cat.startsWith(prefix)) {
      return {
        envelope_id: null,
        transaction_type: "REGULAR",
        custom_category: category,
        confidence,
        flag_reason: null,
      };
    }
  }

  return null;
}

// Positive transaction detection (runs top to bottom, first match wins)
async function detectPositiveType(
  txn: TransactionRow,
  userId: string,
  accountMap: Map<string, BankAccount>
): Promise<CategorizeResult> {
  const normalized = txn.merchant_name_normalized ?? "";

  // 1. Payroll / gig pattern
  if (matchesList(normalized, PAYROLL_PATTERNS) || matchesList(normalized, GIG_PATTERNS)) {
    return {
      envelope_id: null,
      transaction_type: "INCOME",
      custom_category: "Income",
      confidence: 0.9,
      flag_reason: null,
    };
  }

  // 2. Refund pairing. same merchant debited within 60 days
  if (normalized) {
    const sixtyDaysAgo = new Date(txn.date);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const { data: match } = await supabaseAdmin
      .from("transactions")
      .select("id, envelope_id")
      .eq("user_id", userId)
      .eq("merchant_name_normalized", normalized)
      .lt("amount", 0)
      .gte("date", sixtyDaysAgo.toISOString().slice(0, 10))
      .lte("date", txn.date)
      .is("removed_at", null)
      .order("date", { ascending: false })
      .limit(1);

    if (match && match.length > 0) {
      return {
        envelope_id: match[0].envelope_id,
        transaction_type: "REFUND",
        custom_category: "Refund",
        confidence: 0.85,
        flag_reason: null,
      };
    }
  }

  // 3. Internal transfer pairing. +X in this account, -X in another within 3 days.
  {
    const threeDaysAgo = new Date(txn.date);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const threeDaysAfter = new Date(txn.date);
    threeDaysAfter.setDate(threeDaysAfter.getDate() + 3);

    const { data: match } = await supabaseAdmin
      .from("transactions")
      .select("id, account_id")
      .eq("user_id", userId)
      .neq("account_id", txn.account_id)
      .eq("amount", -txn.amount)
      .gte("date", threeDaysAgo.toISOString().slice(0, 10))
      .lte("date", threeDaysAfter.toISOString().slice(0, 10))
      .is("removed_at", null)
      .limit(1);

    if (match && match.length > 0) {
      return {
        envelope_id: null,
        transaction_type: "INTERNAL_TRANSFER",
        custom_category: null,
        confidence: 0.9,
        flag_reason: null,
        paired_transaction_id: match[0].id,
      };
    }
  }


  // 4. P2P credit
  if (matchesList(normalized, P2P_PATTERNS)) {
    return {
      envelope_id: null,
      transaction_type: "P2P_CREDIT",
      custom_category: "P2P",
      confidence: 0.85,
      flag_reason: null,
    };
  }

  // 5. Auto-reimburse fees
  const account = accountMap.get(txn.account_id);
  if (account?.auto_reimburse_fees && matchesList(normalized, FEE_REIMBURSE_PATTERNS)) {
    return {
      envelope_id: account.default_envelope_id,
      transaction_type: "REFUND",
      custom_category: "Fee Reimbursement",
      confidence: 0.9,
      flag_reason: null,
    };
  }

  // 6. Unknown positive — flag for user
  return {
    envelope_id: null,
    transaction_type: "REGULAR",
    custom_category: null,
    confidence: 0.0,
    flag_reason: "UNKNOWN_INCOME",
  };
}

// Main entry point
export async function categorizeTransactions(
  transactionIds: string[],
  userId: string
): Promise<void> {
  if (transactionIds.length === 0) return;

  // Load context once for the whole batch
  const [transactions, personalRules, globalRules, accounts] = await Promise.all([
    supabaseAdmin
      .from("transactions")
      .select("id, account_id, amount, date, merchant_name_normalized, plaid_category, is_pending")
      .in("id", transactionIds)
      .then((r) => {
        if (r.error) throw new ServiceError("CATEGORIZE_LOAD_FAILED", r.error.message);
        return r.data as TransactionRow[];
      }),
    supabaseAdmin
      .from("merchant_rules")
      .select("id, merchant_pattern, match_type, envelope_id, custom_category, confidence")
      .eq("user_id", userId)
      .then((r) => (r.data ?? []) as MerchantRule[]),
    supabaseAdmin
      .from("merchant_rules")
      .select("id, merchant_pattern, match_type, envelope_id, custom_category, confidence")
      .is("user_id", null)
      .then((r) => (r.data ?? []) as MerchantRule[]),
    supabaseAdmin
      .from("bank_accounts")
      .select("id, restricted_to_envelope_ids, default_envelope_id, auto_reimburse_fees")
      .eq("user_id", userId)
      .then((r) => {
        const map = new Map<string, BankAccount>();
        for (const a of (r.data ?? []) as BankAccount[]) map.set(a.id, a);
        return map;
      }),
  ]);

  // Keyed by transaction id so each row is written exactly once, even when it gets
  // claimed as the other half of a transfer after being classified on its own.
  // The batch-update phase below is the SINGLE writer — nothing touches the
  // transactions table mid-loop anymore (that was the same-batch clobber).
  const updates = new Map<string, CategorizeResult>();
  const flags = new Map<string, { reason: string; confidence: number; category: string | null }>();

  // Ids present in THIS batch lets us know whether a transfer counterpart will
  // be iterated (and therefore needs skipping) vs. an existing row outside it.
  const batchIds = new Set(transactions.map((t) => t.id));
  // Counterpart legs already claimed by a detected transfer — skip on their turn.
  const handledAsPair = new Set<string>();

  for (const txn of transactions) {
    // Already written as the other half of a transfer detected earlier this batch.
    if (handledAsPair.has(txn.id)) continue;

    let result: CategorizeResult;

    if (txn.amount > 0) {
      // Positive transaction — income / refund / transfer / P2P / unknown
      result = await detectPositiveType(txn, userId, accounts);
    } else {
      // Negative (spending) — walk the rule layers
      const account = accounts.get(txn.account_id);
      const normalized = txn.merchant_name_normalized ?? "";

      result =
        applyAccountBinding(account) ??
        (normalized ? applyMerchantRules(normalized, personalRules) : null) ??
        (normalized ? applyMerchantRules(normalized, globalRules) : null) ??
        applyPlaidFallback(txn.plaid_category) ??
        {
          envelope_id: null,
          transaction_type: "REGULAR",
          custom_category: null,
          confidence: 0.0,
          flag_reason: "LOW_CONFIDENCE",
        };
    }

    // Flag if confidence is below threshold
    if (result.confidence < FLAG_THRESHOLD && !result.flag_reason) {
      result.flag_reason = "LOW_CONFIDENCE";
    }

    // Internal transfer: record BOTH legs here, pointing at each other, so the
    // batch phase writes them once. The counterpart may or may not be in this
    // batch — either way it's already persisted (sync upserts rows before
    // categorizing), so keying its update by id is safe.
    if (result.transaction_type === "INTERNAL_TRANSFER" && result.paired_transaction_id) {
      const counterpartId = result.paired_transaction_id;

      updates.set(txn.id, result); // this leg -> counterpart

      // Counterpart -> this leg. Overwrites any spending result it may have been
      // given if it was iterated before this leg.
      updates.set(counterpartId, {
        envelope_id: null,
        transaction_type: "INTERNAL_TRANSFER",
        custom_category: null,
        confidence: 0.9,
        flag_reason: null,
        paired_transaction_id: txn.id,
      });

      // Transfers aren't flagged: drop a stale flag the counterpart may have
      // picked up, and stop its own iteration from re-classifying it as spending.
      flags.delete(counterpartId);
      if (batchIds.has(counterpartId)) handledAsPair.add(counterpartId);
      continue;
    }

    updates.set(txn.id, result);

    if (result.flag_reason) {
      flags.set(txn.id, {
        reason: result.flag_reason,
        confidence: result.confidence,
        category: result.custom_category,
      });
    }
  }

  // Batch-update transactions. One update per row (results differ); collect the
  // responses and throw on the first error instead of letting a CHECK violation
  // (or any write failure) vanish silently.
  const updateResults = await Promise.all(
    [...updates.entries()].map(([id, result]) => {
      const payload: TransactionUpdate = {
        envelope_id: result.envelope_id,
        transaction_type: result.transaction_type,
        custom_category: result.custom_category,
        categorized_at: new Date().toISOString(),
      };
      // Only write the pairing column for transfer legs, so a normal update never
      // nulls out an existing pairing on an unrelated row.
      if (result.transaction_type === "INTERNAL_TRANSFER") {
        payload.paired_transaction_id = result.paired_transaction_id ?? null;
      }
      return supabaseAdmin.from("transactions").update(payload).eq("id", id);
    })
  );

  const updateError = updateResults.find((r) => r.error)?.error;
  if (updateError) {
    throw new ServiceError(
      "CATEGORIZE_UPDATE_FAILED",
      `Could not persist categorization: ${updateError.message}`
    );
  }

  // Batch-insert flags (skip if one already exists for that transaction).
  // onConflict requires a unique constraint on flags.transaction_id — see Commit 3;
  // if that constraint is missing this upsert errors, which we now surface.
  if (flags.size > 0) {
    const flagRows = [...flags.entries()].map(([transactionId, f]) => ({
      user_id: userId,
      transaction_id: transactionId,
      reason: f.reason,
      confidence_score: f.confidence,
      plaid_suggested_category: f.category,
      resolved: false,
    }));

    const { error: flagError } = await supabaseAdmin
      .from("flags")
      .upsert(flagRows, { onConflict: "transaction_id", ignoreDuplicates: true });

    if (flagError) {
      throw new ServiceError(
        "FLAG_UPSERT_FAILED",
        `Could not write flags: ${flagError.message}`
      );
    }
  }
}