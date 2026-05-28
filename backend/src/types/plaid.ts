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
