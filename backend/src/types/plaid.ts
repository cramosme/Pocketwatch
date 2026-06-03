// The subset of Plaid webhook payloads Pocketwatch acts on. Every webhook shares
// webhook_type + webhook_code + item_id; the handler narrows on webhook_code.
export interface PlaidWebhookBase {
  webhook_type: string;
  webhook_code: string;
  item_id: string;
}

// TRANSACTIONS / SYNC_UPDATES_AVAILABLE - new or changed transactions are ready
// to pull via /transactions/sync.
export interface TransactionsSyncWebhook extends PlaidWebhookBase {
  webhook_type: "TRANSACTIONS";
  webhook_code: "SYNC_UPDATES_AVAILABLE";
  initial_update_complete: boolean;
  historical_update_complete: boolean;
}

// ITEM / ERROR - the item entered an error state (e.g. login expired).
export interface ItemErrorWebhook extends PlaidWebhookBase {
  webhook_type: "ITEM";
  webhook_code: "ERROR";
  error: {
    error_type: string;
    error_code: string;
    error_message: string;
  } | null;
}

export type PlaidWebhookPayload =
  | TransactionsSyncWebhook
  | ItemErrorWebhook
  | PlaidWebhookBase;

import type {
  Transaction,
  AccountBase,
  CreditCardLiability,
} from "plaid";

// Using interface extension instead of type aliases so i can add
// own fields later if need be
export interface PlaidTransaction extends Transaction {}
export interface PlaidAccount extends AccountBase {}
export interface PlaidCreditCardAccount extends CreditCardLiability {}
