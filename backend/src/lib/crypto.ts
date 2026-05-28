import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// Using AES-256-GCM to securely encrypt and decrypt tokens.
// Decode once and validate length so malformed key fails at startup
// rather than on first encrypt call
const KEY_BASE64 = process.env.PLAID_TOKEN_ENCRYPTION_KEY;
if( !KEY_BASE64 ){
  throw new Error("PLAID_TOKEN_ENCRYPTION_KEY is not set");
}

const KEY = Buffer.from(KEY_BASE64, "base64");
if( KEY.length !== 32 ){
  throw new Error("KEY is not 32 bytes. Regenerate.");
}

// Standard for IV size. Needs to be unique for EVERY individual encryption
// with the same key. Reusing is bad. Dont do it. Big no no
const IV_LENGTH = 12;

// Auth tag size. Verified on decrypt to check if there was any tampering
// with the ciphertext
const AUTH_TAG_LENGTH = 16;

// Encrypts plaintext string with AES-256-GCM
// Returns concatenated string of form: IV || authTag || ciphertext
// Used to encrypt plaid access tokens
export function encrypt(plaintext: string): string {
  // New IV on every call. randomBytes is cryptographically secure on Node.
  const IV = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", KEY, IV);

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf-8"),
    cipher.final(),
  ]);

  // Auth tag only available after final() has been called
  const authTag = cipher.getAuthTag();

  // Create a single base64 string with each part
  // Can split it apart using key using offsets
  return Buffer.concat([IV, authTag, ciphertext]).toString("base64");
}

// Decrypts a base64 string produced by encrypt()
// Throws if the ciphertext was tampered with, the key is wrong, or the input is malformed
export function decrypt(packed: string): string {
  const buf = Buffer.from(packed, "base64");

  // Quick length check in case input got truncated
  if( buf.length < IV_LENGTH + AUTH_TAG_LENGTH ) {
    throw new Error("Ciphertext too short to contain IV and authTag");
  }

  // Split the packed buffer back into its three components
  const IV = buf.subarray(0, IV_LENGTH);
  const authTag = buf.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = buf.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv("aes-256-gcm", KEY, IV);
  decipher.setAuthTag(authTag);

  // final() throws if the auth tag doesn't validate against ciphertext
  // This is what checks against tampering
  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return plaintext.toString("utf-8");
}