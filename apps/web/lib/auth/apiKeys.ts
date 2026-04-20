/**
 * API key primitives for the public v1 API.
 *
 * Beta posture — intentionally minimal:
 *   - Keys are issued as `dd_<env>_<48 hex>` and shown once at creation.
 *   - Only the SHA-256 hash of the raw key is stored (see
 *     `packages/db/schema/013_api_keys.sql`).
 *   - Lookup is a constant-time comparison across the active-key list that
 *     the caller supplies; this module does not talk to the database and
 *     has no network dependencies, so it is pure and offline-testable.
 *   - Request logging produces an `ApiRequestLogEntry` row shaped for the
 *     `api_request_log` table. Route handlers (not this module) are the
 *     component that inserts it.
 *
 * This module exposes no secret material on its return values. `verifyApiKey`
 * returns a sanitized view (no hash, no internal note) so callers cannot
 * accidentally forward the stored hash back onto the public wire.
 */

import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export const AUTHORIZATION_HEADER = 'authorization';
export const API_KEY_HEADER = 'x-api-key';

/** Live-traffic prefix. Short + recognizable in logs / support tickets. */
export const API_KEY_LIVE_PREFIX = 'dd_live_';
/** Test / sandbox prefix. Same verification path, segregated in logs. */
export const API_KEY_TEST_PREFIX = 'dd_test_';

export type ApiKeyScope = 'read' | 'read_write' | 'admin';
export type ApiKeyTier = 'beta' | 'standard' | 'internal';

/**
 * Row shape persisted in `api_key`. Secret-bearing (`keyHash`) — never
 * include this in a response body; use `SanitizedApiKey` on the wire.
 */
export type ApiKeyRecord = {
  apiKeyId: string;
  keyHash: string;
  keyPrefix: string;
  ownerEmail: string;
  scope: ApiKeyScope;
  tier: ApiKeyTier;
  createdAt: string;
  revokedAt: string | null;
  lastUsedAt: string | null;
};

/** View of an authenticated key that is safe to pass to a route handler. */
export type SanitizedApiKey = {
  apiKeyId: string;
  keyPrefix: string;
  ownerEmail: string;
  scope: ApiKeyScope;
  tier: ApiKeyTier;
};

export type IssuedApiKey = {
  rawKey: string;
  keyHash: string;
  keyPrefix: string;
};

export type AuthFailureReason =
  | 'missing'
  | 'malformed'
  | 'unknown_key'
  | 'revoked';

export type AuthResult =
  | { ok: true; key: SanitizedApiKey }
  | { ok: false; reason: AuthFailureReason };

export type ApiRequestLogEntry = {
  apiRequestLogId: string;
  apiKeyId: string | null;
  requestId: string;
  method: string;
  path: string;
  queryString: string | null;
  statusCode: number;
  remoteIp: string | null;
  userAgent: string | null;
  responseMs: number | null;
  rateLimitBucket: string | null;
  rateLimitRemaining: number | null;
  rateLimited: boolean;
  requestedAt: string;
};

/**
 * Deterministic hex SHA-256 of the raw key. Used for both verification and
 * for computing the `key_hash` column at issuance time.
 */
export function hashApiKey(rawKey: string): string {
  return createHash('sha256').update(rawKey, 'utf8').digest('hex');
}

/**
 * Generate a new key. Raw key is `<prefix><48 lowercase hex>`. The caller
 * shows `rawKey` to the user exactly once and persists `keyHash` /
 * `keyPrefix`.
 */
export function generateApiKey(prefix: string = API_KEY_LIVE_PREFIX): IssuedApiKey {
  if (prefix !== API_KEY_LIVE_PREFIX && prefix !== API_KEY_TEST_PREFIX) {
    throw new Error(
      `Unknown api key prefix: ${prefix}. Expected ${API_KEY_LIVE_PREFIX} or ${API_KEY_TEST_PREFIX}.`,
    );
  }
  const rawKey = `${prefix}${randomBytes(24).toString('hex')}`;
  return { rawKey, keyHash: hashApiKey(rawKey), keyPrefix: prefix };
}

/**
 * Extract a raw API key from request headers. Supports both
 *   Authorization: Bearer <key>
 *   x-api-key: <key>
 * The `Authorization` header wins when both are present so the common
 * HTTP convention is authoritative.
 */
export function extractApiKeyFromHeaders(headers: Headers): string | null {
  const auth = headers.get(AUTHORIZATION_HEADER);
  if (auth) {
    const trimmed = auth.trim();
    // Case-insensitive "Bearer" prefix, single space, then the token.
    const match = /^Bearer\s+(\S+)\s*$/i.exec(trimmed);
    if (match) {
      return match[1];
    }
  }
  const xApiKey = headers.get(API_KEY_HEADER);
  if (xApiKey) {
    const trimmed = xApiKey.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }
  return null;
}

/**
 * Shape check on a raw key: must be one of the two recognized prefixes and
 * carry a 48-char lowercase hex suffix. This is a cheap early-reject before
 * the O(n) hash comparison.
 */
export function isWellFormedApiKey(rawKey: string): boolean {
  if (!rawKey.startsWith(API_KEY_LIVE_PREFIX) && !rawKey.startsWith(API_KEY_TEST_PREFIX)) {
    return false;
  }
  const prefix = rawKey.startsWith(API_KEY_LIVE_PREFIX)
    ? API_KEY_LIVE_PREFIX
    : API_KEY_TEST_PREFIX;
  const suffix = rawKey.slice(prefix.length);
  return /^[0-9a-f]{48}$/.test(suffix);
}

/**
 * Constant-time equal on hex strings. `timingSafeEqual` requires equal
 * length, so we short-circuit unequal-length inputs explicitly and compare
 * as bytes on equal-length inputs.
 */
export function constantTimeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  const aBuf = Buffer.from(a, 'utf8');
  const bBuf = Buffer.from(b, 'utf8');
  return timingSafeEqual(aBuf, bBuf);
}

function sanitize(record: ApiKeyRecord): SanitizedApiKey {
  return {
    apiKeyId: record.apiKeyId,
    keyPrefix: record.keyPrefix,
    ownerEmail: record.ownerEmail,
    scope: record.scope,
    tier: record.tier,
  };
}

/**
 * Verify a raw key against a list of stored records.
 *
 * Scans the entire list every call (even after a hit) so the response time
 * is proportional to the list size rather than to whether the key is
 * present — this closes the trivial side channel that short-circuiting
 * otherwise introduces.
 */
export function verifyApiKey(rawKey: string, records: readonly ApiKeyRecord[]): AuthResult {
  if (!isWellFormedApiKey(rawKey)) {
    return { ok: false, reason: 'malformed' };
  }
  const candidateHash = hashApiKey(rawKey);

  let matched: ApiKeyRecord | null = null;
  for (const record of records) {
    if (constantTimeEqualHex(record.keyHash, candidateHash)) {
      matched = record;
    }
  }

  if (!matched) {
    return { ok: false, reason: 'unknown_key' };
  }
  if (matched.revokedAt !== null) {
    return { ok: false, reason: 'revoked' };
  }
  return { ok: true, key: sanitize(matched) };
}

/**
 * Authenticate a request. Returns the sanitized key on success and a
 * typed failure reason on rejection. Callers translate the reason into
 * the right HTTP status (401 for missing/malformed/unknown, 403 for
 * revoked).
 */
export function authenticateRequest(
  headers: Headers,
  records: readonly ApiKeyRecord[],
): AuthResult {
  const raw = extractApiKeyFromHeaders(headers);
  if (!raw) {
    return { ok: false, reason: 'missing' };
  }
  return verifyApiKey(raw, records);
}

export function httpStatusForAuthFailure(reason: AuthFailureReason): 401 | 403 {
  return reason === 'revoked' ? 403 : 401;
}

export type BuildApiRequestLogEntryInput = {
  apiRequestLogId: string;
  apiKeyId: string | null;
  requestId: string;
  method: string;
  url: string;
  statusCode: number;
  remoteIp: string | null;
  userAgent: string | null;
  responseMs: number | null;
  rateLimitBucket: string | null;
  rateLimitRemaining: number | null;
  rateLimited: boolean;
  requestedAt: string;
};

/**
 * Build an append-only audit row for `api_request_log`. Splits the URL
 * into `path` + `queryString` so the table stays queryable without
 * regex-parsing on every analytical pass.
 */
export function buildApiRequestLogEntry(input: BuildApiRequestLogEntryInput): ApiRequestLogEntry {
  const { path, queryString } = splitUrl(input.url);
  return {
    apiRequestLogId: input.apiRequestLogId,
    apiKeyId: input.apiKeyId,
    requestId: input.requestId,
    method: input.method.toUpperCase(),
    path,
    queryString,
    statusCode: input.statusCode,
    remoteIp: input.remoteIp,
    userAgent: input.userAgent,
    responseMs: input.responseMs,
    rateLimitBucket: input.rateLimitBucket,
    rateLimitRemaining: input.rateLimitRemaining,
    rateLimited: input.rateLimited,
    requestedAt: input.requestedAt,
  };
}

function splitUrl(url: string): { path: string; queryString: string | null } {
  try {
    const parsed = new URL(url);
    const qs = parsed.search.startsWith('?') ? parsed.search.slice(1) : parsed.search;
    return { path: parsed.pathname, queryString: qs.length > 0 ? qs : null };
  } catch {
    const qIndex = url.indexOf('?');
    if (qIndex < 0) {
      return { path: url, queryString: null };
    }
    const qs = url.slice(qIndex + 1);
    return { path: url.slice(0, qIndex), queryString: qs.length > 0 ? qs : null };
  }
}
