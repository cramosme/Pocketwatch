import {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
  Products,
  CountryCode,
  JWKPublicKey,
} from "plaid";
import { supabaseAdmin } from "../../database/supabase";
import { encrypt, decrypt } from "../../lib/crypto";
import { ServiceError } from "../../lib/errors";
import type {
  PlaidTransaction,
  PlaidAccount,
  PlaidCreditCardAccount,
} from "../../types/plaid";

const PLAID_ENV = process.env.PLAID_ENV;
if ( !PLAID_ENV || !(PLAID_ENV in PlaidEnvironments) ) {
  throw new Error(
    `PLAID_ENV must be one of: sandbox, development, production. Got: ${PLAID_ENV}`
  );
}

if (!process.env.PLAID_CLIENT_ID) {
  throw new Error("PLAID_CLIENT_ID is not set");
}
if (!process.env.PLAID_SECRET) {
  throw new Error("PLAID_SECRET is not set");
}

// SDK client init
const config = new Configuration({
  basePath: PlaidEnvironments[PLAID_ENV as keyof typeof PlaidEnvironments],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
      "PLAID-SECRET": process.env.PLAID_SECRET,
    },
  },
});

const plaid = new PlaidApi(config);

// Internal helper that pulls encrypted access token from DB, decrypts,
// and returns the plaintext to the calling function. Plaintext discarded
// locally in each function after they return
async function getDecryptedToken(plaidItemId: string): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from("plaid_items")
    .select("access_token")
    .eq("id", plaidItemId)
    .single();

  if( error || !data ){
    throw new ServiceError("PLAID_ITEM_NOT_FOUND", "Connected bank not found");
  }

  return decrypt(data.access_token);
}

// Wraps Plaid SDK call so their error shape gets normalized to custom one
async function callPlaid<T>(label: string, fn: () => Promise<T>): Promise<T> {
  try{
    return await fn();
  } catch( err: any ){
    const plaidCode = err?.response?.data?.error_code ?? "PLAID_UNKNOWN";
    const plaidMessage = err?.response?.data?.error_message ?? err.message;

    console.error(`[plaid.service] ${label} failed`, {
      plaidCode,
      plaidMessage,
      requestId: err?.response?.data?.request_id,
    });

    throw new ServiceError(plaidCode, plaidMessage);
  }
}

// Creates Plaid link token tied to a user. Mobile uses this token to open the plaid
// link ui, which is what the user interacts with to pick a bank and authenticate.
export async function createLinkToken(userId: string): Promise<{
  linkToken: string;
  expiration: string;
}> {
  return callPlaid("createLinkToken", async () => {
    const response = await plaid.linkTokenCreate({
      user: { client_user_id: userId },
      client_name: "Pocketwatch",
      products: [Products.Transactions, Products.Liabilities],
      country_codes: [CountryCode.Us],
      language: "en",
      webhook: process.env.PLAID_WEBHOOK_URL,
      android_package_name: "com.crillo.pocketwatch",
    });

    return{
      linkToken: response.data.link_token,
      expiration: response.data.expiration,
    };
  });
}

export async function exchangePublicToken(
  userId: string,
  publicToken: string,
  institution: { id: string, name: string }
) : Promise<{ plaidItemId: string }> {
  // Exchange public token with Plaid
  const { accessToken, itemId } = await callPlaid("exchangePublicToken", async () => {
    const response = await plaid.itemPublicTokenExchange({
      public_token: publicToken,
    });
    return {
      accessToken: response.data.access_token,
      itemId: response.data.item_id,
    };
  });

  // Anything that throws here leaves an orphaned active token on Plaid's side
  // so have to take care of that by removing the item
  try{
    // Encrypt the token before storing
    const encryptedToken = encrypt(accessToken);
  
    // Insert row of items
    const { data, error } = await supabaseAdmin
      .from("plaid_items")
      .insert({
        user_id: userId,
        access_token: encryptedToken,
        item_id: itemId,
        institution_id: institution.id,
        institution_name: institution.name,
      })
      .select("id")
      .single();
  
    if( error || !data ){
      throw new ServiceError(
        "PLAID_ITEM_INSERT_FAILED",
        `Could not save connection: ${error?.message}`
      );
    }
  
    return{ plaidItemId: data.id };
  } catch (insertErr){
    try {
      await plaid.itemRemove({ access_token: accessToken });
    } catch (cleanupErr: unknown) {
      const message = cleanupErr instanceof Error ? cleanupErr.message : "unknown";
      console.error("[plaid.service] orphaned token cleanup failed", {
        itemId,
        userId,
        cleanupError: message,
      });
    }
    throw insertErr;
  }
}

// Fetches one page of cursor based sync
export async function syncTransactions(plaidItemId: string) : Promise<{
  added: PlaidTransaction[];
  modified: PlaidTransaction[];
  removed: { transaction_id: string }[];
  nextCursor: string;
  hasMore: boolean;
}> {
  const { data: itemRow, error: itemError } = await supabaseAdmin
    .from("plaid_items")
    .select("transaction_cursor, access_token")
    .eq("id", plaidItemId)
    .single();

  if( itemError || !itemRow ){
    throw new ServiceError("PLAID_ITEM_NOT_FOUND", "Connected bank not found");
  }

  // Since we are already making one DB call here, we can just decrypt the token instead
  // of doing 2 queries if we used helper function
  const accessToken = decrypt(itemRow.access_token);

  return callPlaid("syncTransactions", async () => {
    const response = await plaid.transactionsSync({
      access_token: accessToken,
      cursor: itemRow.transaction_cursor ?? "",
    });

    return {
      added: response.data.added,
      modified: response.data.modified,
      removed: response.data.removed,
      nextCursor: response.data.next_cursor,
      hasMore: response.data.has_more,
    };
  });
}

// Fetches every account under connected itme (checking, savings, credit).
// Used during initial exchange to populate bank_accounts table.
export async function fetchAccounts(plaidItemId: string): Promise<PlaidAccount[]> {
  const accessToken = await getDecryptedToken(plaidItemId);

  return callPlaid("fetchAccounts", async () => {
    const response = await plaid.accountsGet({ access_token: accessToken });
    return response.data.accounts;
  });
}


// Fetches credit-card-specific data (statement balance, due date, minimum
// payment, billing cycle) for any credit accounts under this item.
export async function fetchCCAccounts(
  plaidItemId: string
): Promise<PlaidCreditCardAccount[]> {
  const accessToken = await getDecryptedToken(plaidItemId);

  return callPlaid("fetchCCAccounts", async () => {
    const response = await plaid.liabilitiesGet({ access_token: accessToken });
    // liabilities.credit is null on items with no credit cards
    return response.data.liabilities.credit ?? [];
  });
}


// Disconnects an item from Plaid. After this, the access_token is revoked
// on Plaid's side and any further SDK calls with it will fail.
export async function removeItem(plaidItemId: string): Promise<void> {
  const accessToken = await getDecryptedToken(plaidItemId);

  return callPlaid("removeItem", async () => {
    await plaid.itemRemove({ access_token: accessToken });
  });
}

// Fetches the public JWK Plaid used to sign a webhook, looked up by the kid from
// the webhook's JWT header. Only webhook.service calls this, and only on a cache
// miss, so it stays a thin pass-through like the other SDK wrappers.
export async function fetchWebhookVerificationKey(
  kid: string
): Promise<JWKPublicKey> {
  return callPlaid("fetchWebhookVerificationKey", async () => {
    const response = await plaid.webhookVerificationKeyGet({ key_id: kid });
    return response.data.key;
  });
}