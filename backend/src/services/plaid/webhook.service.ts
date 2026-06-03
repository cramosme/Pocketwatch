import { createHash, timingSafeEqual } from "node:crypto";
import { decodeProtectedHeader, importJWK, jwtVerify } from "jose";
import type { JWKPublicKey } from "plaid";
import { fetchWebhookVerificationKey } from "./plaid.service";
import { ServiceError } from "../../lib/errors";
import type { PlaidWebhookPayload } from "../../types/plaid";

// Plaid signs each webhook with an ES256 JWT in the Plaid-Verification header.
// The JWT carries a request_body_sha256 claim, so verifying it proves two things:
// Plaid sent the request (signature) and the body wasn't swapped (hash). Any
// failure throws 401. A failed check means the request simply isn't trusted.

// Verification keys are immutable per kid, so cache for the process lifetime.
// A cache miss is the only fetch trigger; no TTL needed.
const keyCache = new Map<string, JWKPublicKey>();

// Plaid recommends rejecting tokens older than ~5 min to bound replay attacks.
const MAX_TOKEN_AGE = "5 minutes";

async function getVerificationKey(kid: string): Promise<JWKPublicKey> {
  const cached = keyCache.get(kid);
  if (cached) return cached;

  const key = await fetchWebhookVerificationKey(kid);
  keyCache.set(kid, key);
  return key;
}

// Verifies a webhook end to end and returns the trusted, parsed payload. Throws
// ServiceError(401) on ANY failure, so a resolved promise is a guarantee of
// authenticity. The caller never reasons about partial trust or parses
// untrusted bytes itself.
export async function verifyWebhook(
  plaidVerificationJwt: string | undefined,
  rawBody: Buffer
): Promise<PlaidWebhookPayload> {
  if (!plaidVerificationJwt) {
    throw new ServiceError(
      "WEBHOOK_MISSING_SIGNATURE",
      "Missing Plaid-Verification header",
      401
    );
  }

  // Read the JWT header WITHOUT verifying only to learn which algorithm and
  // key to trust. Nothing here is trusted yet.
  let alg: string | undefined;
  let kid: string | undefined;
  try {
    const header = decodeProtectedHeader(plaidVerificationJwt);
    alg = header.alg;
    kid = header.kid;
  } catch {
    throw new ServiceError(
      "WEBHOOK_MALFORMED_JWT",
      "Could not decode verification header",
      401
    );
  }

  // Pin the algorithm. Rejecting anything but ES256 blocks alg-substitution
  // attacks (a forged "none" token, or an HMAC token signed with the public key).
  if (alg !== "ES256") {
    throw new ServiceError(
      "WEBHOOK_BAD_ALG",
      "Unexpected webhook signing algorithm",
      401
    );
  }
  if (!kid) {
    throw new ServiceError(
      "WEBHOOK_MISSING_KID",
      "Verification header has no key id",
      401
    );
  }

  // Real Plaid kids are short opaque ids. Cap length before the value can reach
  // the cache Map or an outbound key fetch, so a junk kid can't grow memory or
  // amplify into a Plaid call.
  if (kid.length > 100) {
    throw new ServiceError("WEBHOOK_BAD_KID", "Invalid key id", 401);
  }

  // Verify the signature against Plaid's public key for this kid. jwtVerify also
  // enforces maxTokenAge against the iat claim, so stale/replayed tokens die
  // here. algorithms is pinned again so the imported key can't be coerced.
  const jwk = await getVerificationKey(kid);
  let claims: { request_body_sha256?: string };
  try {
    // Plaid's JWKPublicKey carries extra metadata; jose only needs the EC curve
    // params. Pass just those to sidestep a structural type clash.
    const key = await importJWK(
      { kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y },
      "ES256"
    );
    const result = await jwtVerify(plaidVerificationJwt, key, {
      algorithms: ["ES256"],
      maxTokenAge: MAX_TOKEN_AGE,
    });
    claims = result.payload as { request_body_sha256?: string };
  } catch {
    throw new ServiceError(
      "WEBHOOK_INVALID_SIGNATURE",
      "Webhook signature verification failed",
      401
    );
  }

  // The signature signs a hash of the body, not the body itself. Confirm the
  // body we received matches that hash otherwise a valid token could be
  // replayed against a swapped payload.
  const expectedHash = claims.request_body_sha256;
  if (!expectedHash) {
    throw new ServiceError(
      "WEBHOOK_MISSING_BODY_HASH",
      "Verification token has no body hash",
      401
    );
  }

  const actualHash = createHash("sha256").update(rawBody).digest("hex");

  // Constant-time compare so response timing can't leak how many bytes matched.
  // timingSafeEqual requires equal lengths, so guard that first.
  const expectedBuf = Buffer.from(expectedHash, "hex");
  const actualBuf = Buffer.from(actualHash, "hex");
  if (
    expectedBuf.length !== actualBuf.length ||
    !timingSafeEqual(expectedBuf, actualBuf)
  ) {
    throw new ServiceError(
      "WEBHOOK_BODY_MISMATCH",
      "Webhook body did not match signature",
      401
    );
  }

  // Authenticated bytes — only now is JSON.parse operating on trusted input.
  return JSON.parse(rawBody.toString("utf8")) as PlaidWebhookPayload;
}