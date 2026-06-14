import { supabaseAdmin } from "../../database/supabase";
import { ServiceError } from "../../lib/errors";
import {
  syncTransactions,
  fetchAccounts,
  fetchCCAccounts,
} from "./plaid.service";
import type {
  PlaidAccount,
  PlaidCreditCardAccount,
  PlaidTransaction,
} from "../../types/plaid";
import type { Database } from "../../types/database";
import { normalizeMerchantName } from "../rules/normalize.service";
import { categorizeTransactions } from "../rules/ruleEngine.service";

type BankAccountInsert = Database["public"]["Tables"]["bank_accounts"]["Insert"];
type CreditCardInsert = Database["public"]["Tables"]["credit_card_details"]["Insert"];
type TransactionInsert = Database["public"]["Tables"]["transactions"]["Insert"];

// Plaid never sends more than 500, but need this so cursor bug doesnt spin forever
const MAX_SYNC_PAGES = 500;

// Maps plaid_account_id to DB bank_accounts.id
type AccountMap = Map<string, string>;

type PopulateAccountsResult = {
  accountMap: AccountMap;
  // Account IDs we intentionally didn't store (investment, loan, etc.).
  // Used by the transaction sync to distinguish a deliberate drop from a
  // genuine missing-account bug.
  skippedAccountIds: Set<string>;
};

// Narrow the accounts to the 3 the app uses. Skip everything else (loans, investments)
function mapAccountType(
  account: PlaidAccount
): "checking" | "savings" | "credit" | null {
  if( account.type === "credit" ) return "credit";
  if( account.type === "depository" ) {
    if( account.subtype === "checking" ) return "checking";
    if( account.subtype === "savings" ) return "savings";
  }
  return null;
}

// Upserts bank accounts. Upsert instead of insert so re-run refreshes balances instead
// of failing on duplicates
export async function populateAccounts(
  plaidItemId: string,
  userId: string,
  accounts: PlaidAccount[]
): Promise<PopulateAccountsResult> {
  const now = new Date().toISOString();
  const skippedAccountIds = new Set<string>();

  const rows: BankAccountInsert[] = [];
  for( const account of accounts ) {
    const type = mapAccountType(account);
    if(!type){
      skippedAccountIds.add(account.account_id); // Intentiional skip
      continue;
    }

    rows.push({
      user_id: userId,
      plaid_item_id: plaidItemId,
      plaid_account_id: account.account_id,
      name: account.name,
      type,
      current_balance: account.balances.current,
      available_balance: account.balances.available,
      is_primary: false,
      last_synced: now,
    });
  }

  const { data, error } = await supabaseAdmin
    .from("bank_accounts")
    .upsert(rows, { onConflict: "plaid_account_id" })
    .select("id, plaid_account_id");

  if( error || !data ){
    throw new ServiceError(
      "BANK_ACCOUNT_UPSERT_FAILED",
      `Could not save accounts: ${error?.message}`
    );
  }

  const map: AccountMap = new Map();
  for( const row of data ){
    map.set(row.plaid_account_id, row.id);
  }
  return { accountMap: map, skippedAccountIds };
}

// Upserts credit card specific data
export async function populateCreditCardDetails(
  accountMap: AccountMap,
  accounts: PlaidAccount[],
  ccAccounts: PlaidCreditCardAccount[]
): Promise<void> {
  if( ccAccounts.length === 0 ) return; // No credit cards

  const rows: CreditCardInsert[] = [];
  for( const cc of ccAccounts ){
    // Account id can be null on a liability, cant link without it
    if (!cc.account_id) continue;

    const bankAccountId = accountMap.get(cc.account_id);
    if(!bankAccountId){
      console.error("[sync.service] CC account not in map", {
        plaidAccountId: cc.account_id,
      });
      continue;
    }

    const account = accounts.find((a) => a.account_id === cc.account_id);

    rows.push({
      account_id: bankAccountId,
      credit_limit: account?.balances.limit ?? null,
      current_balance: account?.balances.current ?? null,
      last_statement_balance: cc.last_statement_balance ?? null,
      last_statement_date: cc.last_statement_issue_date ?? null,
      next_payment_due_date: cc.next_payment_due_date ?? null,
      minimum_payment: cc.minimum_payment_amount ?? null,
    });
  }

  if (rows.length === 0) return;

  const { error } = await supabaseAdmin
    .from("credit_card_details")
    .upsert(rows, { onConflict: "account_id" });

  if( error ){
    throw new ServiceError(
      "CC_DETAILS_UPSERT_FAILED",
      `Could not save credit card details: ${error.message}`
    );
  }
}

// Maps plaid transaction onto insert shape
function mapTransaction(
  transaction: PlaidTransaction,
  userId: string,
  accountMap: AccountMap
): TransactionInsert | null {
  const bankAccountId = accountMap.get(transaction.account_id);
  if(!bankAccountId) return null;

  return {
    user_id: userId,
    account_id: bankAccountId,
    plaid_transaction_id: transaction.transaction_id,
    amount: -transaction.amount, // Plaid be doing weird things (+ on money out/- on money in) 
    date: transaction.date,
    // merchant_name is the maintained field; fall back to the deprecated `name`
    // (raw description) only when null, which is common for transfers and
    // unrecognized merchants. `name` has no non-deprecated equivalent for the
    // raw description on /transactions/sync, so this fallback is intentional.
    merchant_name: transaction.merchant_name ?? transaction.name,
    merchant_name_normalized: normalizeMerchantName(transaction.merchant_name ?? transaction.name),
    plaid_category: transaction.personal_finance_category?.detailed ?? null,
    is_pending: transaction.pending,
    categorized_at: null,
  };
}

// Batch upsert keyed on plaid_transaction_id (so it can be re-runnable).
// Returns the DB ids of rows that were actually written so downstream
// processing (rule engine) knows exactly which transactions to categorize.
async function upsertTransactions(
  rows: TransactionInsert[],
  update: boolean
): Promise<string[]> {
  if(rows.length === 0) return [];

  const { data, error } = await supabaseAdmin
    .from("transactions")
    .upsert(rows, {
      onConflict: "plaid_transaction_id",
      ignoreDuplicates: !update,
    })
    .select("id");

  if( error ){
    throw new ServiceError(
      "TRANSACTION_UPSERT_FAILED",
      `Could not write transactions: ${error.message}`
    );
  }

  return (data ?? []).map((r) => r.id);
}

// Soft-delete: Plaid says these transactions no longer exist, but for consistent
// UI we won't hard delete. In case its tied to something else
async function markTransactionsRemoved(
  removed: { transaction_id: string }[]
): Promise<void> {
  if (removed.length === 0) return;

  const ids = removed.map((r) => r.transaction_id);
  const { error } = await supabaseAdmin
    .from("transactions")
    .update({ removed_at: new Date().toISOString() })
    .in("plaid_transaction_id", ids);

  if (error) {
    throw new ServiceError(
      "TRANSACTION_REMOVE_FAILED",
      `Could not mark transactions removed: ${error.message}`
    );
  }
}

// Persists the cursor after a page's rows are safely written. Isolated so the
// ordering contract (rows before cursor) is obvious at the call site.
async function persistCursor(
  plaidItemId: string,
  nextCursor: string
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("plaid_items")
    .update({ transaction_cursor: nextCursor })
    .eq("id", plaidItemId);

  if (error) {
    throw new ServiceError(
      "CURSOR_PERSIST_FAILED",
      `Could not save sync cursor: ${error.message}`
    );
  }
}

// Rebuilds the plaid_account_id to bank_account.id map from DB for an existing
// item. Used by webhook-triggered syncs where there's no fresh Plaid payload.
export async function loadAccountMap(plaidItemId: string): Promise<AccountMap> {
  const { data, error } = await supabaseAdmin
    .from("bank_accounts")
    .select("id, plaid_account_id")
    .eq("plaid_item_id", plaidItemId);

  if (error || !data) {
    throw new ServiceError(
      "ACCOUNT_MAP_LOAD_FAILED",
      `Could not load account map: ${error?.message}`
    );
  }

  const map: AccountMap = new Map();
  for (const row of data) {
    map.set(row.plaid_account_id, row.id);
  }
  return map;
}

// Drives the cursor loop to completion. syncTransactions reads the stored cursor
// from the DB on each call, so persisting it between pages is what advances the
// loop and makes a mid-sync crash resume from the last saved page. Order per
// page is load-coupled: write rows FIRST, persist cursor only after, so a crash
// between them just re-processes an idempotent page.
export async function syncItemTransactions(
  plaidItemId: string,
  userId: string,
  accountMap: AccountMap,
  skippedAccountIds: Set<string>
): Promise<void> {
  try {
    let hasMore = true;
    let pages = 0;
    let hasRefreshedAccounts = false;

    while (hasMore) {
      if (pages++ >= MAX_SYNC_PAGES) {
        throw new ServiceError(
          "SYNC_PAGE_LIMIT_EXCEEDED",
          "Transaction sync exceeded the page safety limit"
        );
      }

      const page = await syncTransactions(plaidItemId);

      const added: TransactionInsert[] = [];
      for (const txn of page.added) {
        let row = mapTransaction(txn, userId, accountMap);

        if (row) {
          added.push(row);
        } else if (skippedAccountIds.has(txn.account_id)) {
          // Intentionally skipped account type (investment, loan)
        } else if (!hasRefreshedAccounts) {
          // Unknown account likely opened after initial sync. Pull a fresh
          // account list from Plaid, upsert into DB, and merge the results into
          // our working map + skip set so the rest of this sync sees them too.
          const freshAccounts = await fetchAccounts(plaidItemId);
          const refreshed = await populateAccounts(plaidItemId, userId, freshAccounts);
          for (const [plaidId, dbId] of refreshed.accountMap) {
            accountMap.set(plaidId, dbId);
          }
          for (const id of refreshed.skippedAccountIds) {
            skippedAccountIds.add(id);
          }
          hasRefreshedAccounts = true;

          // Retry this transaction with the updated map
          row = mapTransaction(txn, userId, accountMap);
          if (row) {
            added.push(row);
          } else if (skippedAccountIds.has(txn.account_id)) {
            // check skipped again
          } else {
            console.error("[sync.service] transaction on unknown account after refresh", {
              plaidAccountId: txn.account_id,
              plaidTransactionId: txn.transaction_id,
            });
          }
        } else {
          // Already refreshed this run, if still unknown, genuinely missing
          console.error("[sync.service] transaction on unknown account", {
            plaidAccountId: txn.account_id,
            plaidTransactionId: txn.transaction_id,
          });
        }
      }

      const modified: TransactionInsert[] = [];
      for (const txn of page.modified) {
        const row = mapTransaction(txn, userId, accountMap);
        if (row) modified.push(row);
      }

      await upsertTransactions(added, false);
      await upsertTransactions(modified, true);
      await markTransactionsRemoved(page.removed);

      await persistCursor(plaidItemId, page.nextCursor);
      hasMore = page.hasMore;
    }

    // Categorize everything still pending for this user. Driven by a durable DB
    // query (categorized_at IS NULL) rather than an in-memory list of this run's
    // upserts, so a crash anywhere — including after the cursor fully advanced but
    // before categorization ran — is recovered on the next sync: those rows are
    // still unstamped and get swept here. Also backfills rows orphaned by an
    // earlier crash. categorizeTransactions stamps categorized_at on success.
    const { data: pending, error: pendingError } = await supabaseAdmin
      .from("transactions")
      .select("id")
      .eq("user_id", userId)
      .is("categorized_at", null)
      .is("removed_at", null);

    if (pendingError) {
      throw new ServiceError(
        "CATEGORIZE_QUEUE_LOAD_FAILED",
        `Could not load uncategorized transactions: ${pendingError.message}`
      );
    }

    if (pending && pending.length > 0) {
      await categorizeTransactions(
        pending.map((r) => r.id),
        userId
      );
    }

    // Success: stamp sync time and clear any prior error so mobile's retry UX resets.
    const { error } = await supabaseAdmin
      .from("plaid_items")
      .update({ last_synced: new Date().toISOString(), last_error: null })
      .eq("id", plaidItemId);

    if (error) {
      throw new ServiceError(
        "PLAID_ITEM_UPDATE_FAILED",
        `Could not finalize sync: ${error.message}`
      );
    }
  } catch (err: unknown) {
    // Record the error code on the item so mobile can show a retry state, then
    // rethrow so the caller still sees the failure. The cursor is already saved
    // per successful page, so a retry resumes, not restarts.
    if (err instanceof ServiceError) {
      await supabaseAdmin
        .from("plaid_items")
        .update({ last_error: err.code })
        .eq("id", plaidItemId);
    }
    throw err;
  }
}

// Full first-time pull after a bank connects: fetch each payload once, then
// write in dependency order. Accounts first (transactions and CC details both
// resolve through the account map), CC details next, transactions last.
export async function runInitialSync(
  plaidItemId: string,
  userId: string
): Promise<void> {
  const accounts = await fetchAccounts(plaidItemId);
  const { accountMap, skippedAccountIds } = await populateAccounts(plaidItemId, userId, accounts);

  const ccAccounts = await fetchCCAccounts(plaidItemId);
  await populateCreditCardDetails(accountMap, accounts, ccAccounts);

  await syncItemTransactions(plaidItemId, userId, accountMap, skippedAccountIds);
}