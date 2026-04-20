/**
 * Unit tests for API auth + rate limiting primitives.
 *
 * Fully offline. Tests exercise:
 *   - hashApiKey determinism + stability
 *   - extractApiKeyFromHeaders (Authorization Bearer, x-api-key, fallback)
 *   - isWellFormedApiKey shape enforcement
 *   - verifyApiKey: match / unknown / revoked / malformed branches
 *   - authenticateRequest integration of the above
 *   - generateApiKey: prefix + shape + round-trip verification
 *   - constantTimeEqualHex unequal-length short circuit
 *   - buildApiRequestLogEntry URL split, method normalization, nullable fields
 *   - InMemoryRateLimiter: allow-then-deny, window reset, multi-bucket isolation,
 *     sweep eviction, reset semantics, response headers
 *   - provenance: sanitized key never leaks keyHash or note
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  API_KEY_HEADER,
  API_KEY_LIVE_PREFIX,
  API_KEY_TEST_PREFIX,
  AUTHORIZATION_HEADER,
  authenticateRequest,
  buildApiRequestLogEntry,
  constantTimeEqualHex,
  extractApiKeyFromHeaders,
  generateApiKey,
  hashApiKey,
  httpStatusForAuthFailure,
  isWellFormedApiKey,
  verifyApiKey,
  type ApiKeyRecord,
} from '../lib/auth/apiKeys';
import {
  DEFAULT_QUOTAS,
  InMemoryRateLimiter,
  rateLimitHeaders,
  retryAfterHeader,
} from '../lib/auth/rateLimits';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeRecord(overrides: Partial<ApiKeyRecord> = {}): ApiKeyRecord {
  const issued = generateApiKey(API_KEY_LIVE_PREFIX);
  return {
    apiKeyId: 'key-1',
    keyHash: issued.keyHash,
    keyPrefix: issued.keyPrefix,
    ownerEmail: 'beta@example.com',
    scope: 'read',
    tier: 'beta',
    createdAt: '2026-04-20T00:00:00.000Z',
    revokedAt: null,
    lastUsedAt: null,
    ...overrides,
  };
}

function makeHeaders(entries: Record<string, string>): Headers {
  const h = new Headers();
  for (const [k, v] of Object.entries(entries)) {
    h.set(k, v);
  }
  return h;
}

// ---------------------------------------------------------------------------
// hashApiKey
// ---------------------------------------------------------------------------

test('hashApiKey is deterministic and produces a 64-char lowercase hex digest', () => {
  const hash1 = hashApiKey('dd_live_abcdef');
  const hash2 = hashApiKey('dd_live_abcdef');
  assert.equal(hash1, hash2);
  assert.match(hash1, /^[0-9a-f]{64}$/);
});

test('hashApiKey produces different digests for different inputs', () => {
  assert.notEqual(hashApiKey('dd_live_a'), hashApiKey('dd_live_b'));
});

// ---------------------------------------------------------------------------
// generateApiKey
// ---------------------------------------------------------------------------

test('generateApiKey produces a well-formed live key with a 48-hex suffix', () => {
  const issued = generateApiKey(API_KEY_LIVE_PREFIX);
  assert.ok(issued.rawKey.startsWith(API_KEY_LIVE_PREFIX));
  assert.equal(issued.keyPrefix, API_KEY_LIVE_PREFIX);
  assert.equal(issued.rawKey.length, API_KEY_LIVE_PREFIX.length + 48);
  assert.match(issued.rawKey.slice(API_KEY_LIVE_PREFIX.length), /^[0-9a-f]{48}$/);
  assert.equal(issued.keyHash, hashApiKey(issued.rawKey));
});

test('generateApiKey supports the test prefix', () => {
  const issued = generateApiKey(API_KEY_TEST_PREFIX);
  assert.ok(issued.rawKey.startsWith(API_KEY_TEST_PREFIX));
  assert.equal(issued.keyPrefix, API_KEY_TEST_PREFIX);
});

test('generateApiKey rejects unknown prefixes', () => {
  assert.throws(() => generateApiKey('evil_'), /Unknown api key prefix/);
});

test('generateApiKey produces unique keys across calls', () => {
  const a = generateApiKey();
  const b = generateApiKey();
  assert.notEqual(a.rawKey, b.rawKey);
  assert.notEqual(a.keyHash, b.keyHash);
});

// ---------------------------------------------------------------------------
// extractApiKeyFromHeaders
// ---------------------------------------------------------------------------

test('extractApiKeyFromHeaders returns null when no auth headers present', () => {
  assert.equal(extractApiKeyFromHeaders(makeHeaders({})), null);
});

test('extractApiKeyFromHeaders parses Authorization: Bearer <key>', () => {
  const h = makeHeaders({ [AUTHORIZATION_HEADER]: 'Bearer dd_live_abc123' });
  assert.equal(extractApiKeyFromHeaders(h), 'dd_live_abc123');
});

test('extractApiKeyFromHeaders accepts case-insensitive Bearer scheme', () => {
  const h = makeHeaders({ [AUTHORIZATION_HEADER]: 'bearer dd_live_abc123' });
  assert.equal(extractApiKeyFromHeaders(h), 'dd_live_abc123');
});

test('extractApiKeyFromHeaders tolerates leading/trailing whitespace', () => {
  const h = makeHeaders({ [AUTHORIZATION_HEADER]: '   Bearer   dd_live_abc123   ' });
  assert.equal(extractApiKeyFromHeaders(h), 'dd_live_abc123');
});

test('extractApiKeyFromHeaders ignores non-Bearer Authorization schemes', () => {
  const h = makeHeaders({ [AUTHORIZATION_HEADER]: 'Basic dXNlcjpwYXNz' });
  assert.equal(extractApiKeyFromHeaders(h), null);
});

test('extractApiKeyFromHeaders falls back to x-api-key when Authorization is absent', () => {
  const h = makeHeaders({ [API_KEY_HEADER]: 'dd_live_abc123' });
  assert.equal(extractApiKeyFromHeaders(h), 'dd_live_abc123');
});

test('extractApiKeyFromHeaders prefers Authorization over x-api-key when both present', () => {
  const h = makeHeaders({
    [AUTHORIZATION_HEADER]: 'Bearer dd_live_from_authorization',
    [API_KEY_HEADER]: 'dd_live_from_x_api_key',
  });
  assert.equal(extractApiKeyFromHeaders(h), 'dd_live_from_authorization');
});

test('extractApiKeyFromHeaders returns null for whitespace-only x-api-key', () => {
  const h = makeHeaders({ [API_KEY_HEADER]: '   ' });
  assert.equal(extractApiKeyFromHeaders(h), null);
});

// ---------------------------------------------------------------------------
// isWellFormedApiKey
// ---------------------------------------------------------------------------

test('isWellFormedApiKey accepts live + test keys with 48 hex suffix', () => {
  assert.equal(isWellFormedApiKey(generateApiKey(API_KEY_LIVE_PREFIX).rawKey), true);
  assert.equal(isWellFormedApiKey(generateApiKey(API_KEY_TEST_PREFIX).rawKey), true);
});

test('isWellFormedApiKey rejects wrong prefix / wrong length / non-hex suffix', () => {
  assert.equal(isWellFormedApiKey('evil_' + 'a'.repeat(48)), false);
  assert.equal(isWellFormedApiKey(API_KEY_LIVE_PREFIX + 'a'.repeat(47)), false);
  assert.equal(isWellFormedApiKey(API_KEY_LIVE_PREFIX + 'A'.repeat(48)), false); // uppercase
  assert.equal(isWellFormedApiKey(API_KEY_LIVE_PREFIX + 'z'.repeat(48)), false);
  assert.equal(isWellFormedApiKey(''), false);
});

// ---------------------------------------------------------------------------
// constantTimeEqualHex
// ---------------------------------------------------------------------------

test('constantTimeEqualHex returns true for identical strings', () => {
  assert.equal(constantTimeEqualHex('abc123', 'abc123'), true);
});

test('constantTimeEqualHex returns false for different same-length strings', () => {
  assert.equal(constantTimeEqualHex('abc123', 'abc124'), false);
});

test('constantTimeEqualHex returns false for unequal-length strings without throwing', () => {
  assert.equal(constantTimeEqualHex('abc', 'abcd'), false);
});

// ---------------------------------------------------------------------------
// verifyApiKey
// ---------------------------------------------------------------------------

test('verifyApiKey returns malformed for shape-invalid inputs', () => {
  const record = makeRecord();
  const result = verifyApiKey('not-a-real-key', [record]);
  assert.deepEqual(result, { ok: false, reason: 'malformed' });
});

test('verifyApiKey returns unknown_key when the raw key is not in the record list', () => {
  const r1 = makeRecord({ apiKeyId: 'k1' });
  const other = generateApiKey();
  const result = verifyApiKey(other.rawKey, [r1]);
  assert.deepEqual(result, { ok: false, reason: 'unknown_key' });
});

test('verifyApiKey matches by hash and returns a sanitized view with no hash or note', () => {
  const issued = generateApiKey();
  const record = makeRecord({
    apiKeyId: 'k-ok',
    keyHash: issued.keyHash,
    keyPrefix: issued.keyPrefix,
    ownerEmail: 'alice@example.com',
    scope: 'read_write',
    tier: 'standard',
  });
  const result = verifyApiKey(issued.rawKey, [record]);
  assert.equal(result.ok, true);
  if (!result.ok) {
    return;
  }
  assert.deepEqual(result.key, {
    apiKeyId: 'k-ok',
    keyPrefix: issued.keyPrefix,
    ownerEmail: 'alice@example.com',
    scope: 'read_write',
    tier: 'standard',
  });
  const json = JSON.stringify(result.key);
  assert.ok(!json.includes(issued.keyHash));
});

test('verifyApiKey returns revoked for a key whose record carries a revokedAt timestamp', () => {
  const issued = generateApiKey();
  const record = makeRecord({
    keyHash: issued.keyHash,
    keyPrefix: issued.keyPrefix,
    revokedAt: '2026-04-19T00:00:00.000Z',
  });
  const result = verifyApiKey(issued.rawKey, [record]);
  assert.deepEqual(result, { ok: false, reason: 'revoked' });
});

test('verifyApiKey handles an empty record list as unknown_key', () => {
  const issued = generateApiKey();
  assert.deepEqual(verifyApiKey(issued.rawKey, []), { ok: false, reason: 'unknown_key' });
});

// ---------------------------------------------------------------------------
// authenticateRequest
// ---------------------------------------------------------------------------

test('authenticateRequest returns missing when no headers are supplied', () => {
  const result = authenticateRequest(makeHeaders({}), []);
  assert.deepEqual(result, { ok: false, reason: 'missing' });
});

test('authenticateRequest integrates header extraction + verification', () => {
  const issued = generateApiKey();
  const record = makeRecord({
    apiKeyId: 'k-auth',
    keyHash: issued.keyHash,
    keyPrefix: issued.keyPrefix,
  });
  const result = authenticateRequest(
    makeHeaders({ [AUTHORIZATION_HEADER]: `Bearer ${issued.rawKey}` }),
    [record],
  );
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.key.apiKeyId, 'k-auth');
  }
});

test('httpStatusForAuthFailure maps reasons to 401/403', () => {
  assert.equal(httpStatusForAuthFailure('missing'), 401);
  assert.equal(httpStatusForAuthFailure('malformed'), 401);
  assert.equal(httpStatusForAuthFailure('unknown_key'), 401);
  assert.equal(httpStatusForAuthFailure('revoked'), 403);
});

// ---------------------------------------------------------------------------
// buildApiRequestLogEntry
// ---------------------------------------------------------------------------

test('buildApiRequestLogEntry splits absolute URL into path + queryString', () => {
  const entry = buildApiRequestLogEntry({
    apiRequestLogId: 'log-1',
    apiKeyId: 'k1',
    requestId: 'req-1',
    method: 'get',
    url: 'https://api.example.com/api/v1/filings?issuer=320193&pageSize=5',
    statusCode: 200,
    remoteIp: '203.0.113.7',
    userAgent: 'curl/8.0.0',
    responseMs: 42,
    rateLimitBucket: 'k1',
    rateLimitRemaining: 59,
    rateLimited: false,
    requestedAt: '2026-04-20T00:00:00.000Z',
  });
  assert.equal(entry.method, 'GET');
  assert.equal(entry.path, '/api/v1/filings');
  assert.equal(entry.queryString, 'issuer=320193&pageSize=5');
  assert.equal(entry.statusCode, 200);
  assert.equal(entry.rateLimited, false);
  assert.equal(entry.rateLimitRemaining, 59);
});

test('buildApiRequestLogEntry leaves queryString null when URL has no query', () => {
  const entry = buildApiRequestLogEntry({
    apiRequestLogId: 'log-2',
    apiKeyId: null,
    requestId: 'req-2',
    method: 'POST',
    url: 'https://api.example.com/api/v1/screener',
    statusCode: 429,
    remoteIp: null,
    userAgent: null,
    responseMs: null,
    rateLimitBucket: 'ip-203.0.113.7',
    rateLimitRemaining: 0,
    rateLimited: true,
    requestedAt: '2026-04-20T00:00:00.000Z',
  });
  assert.equal(entry.path, '/api/v1/screener');
  assert.equal(entry.queryString, null);
  assert.equal(entry.rateLimited, true);
  assert.equal(entry.apiKeyId, null);
});

test('buildApiRequestLogEntry tolerates a relative URL (no host)', () => {
  const entry = buildApiRequestLogEntry({
    apiRequestLogId: 'log-3',
    apiKeyId: null,
    requestId: 'req-3',
    method: 'GET',
    url: '/api/v1/companies?companyId=320193',
    statusCode: 200,
    remoteIp: null,
    userAgent: null,
    responseMs: 5,
    rateLimitBucket: null,
    rateLimitRemaining: null,
    rateLimited: false,
    requestedAt: '2026-04-20T00:00:00.000Z',
  });
  assert.equal(entry.path, '/api/v1/companies');
  assert.equal(entry.queryString, 'companyId=320193');
});

// ---------------------------------------------------------------------------
// Rate limiter
// ---------------------------------------------------------------------------

test('InMemoryRateLimiter allows up to the beta limit and denies the next call', () => {
  const limiter = new InMemoryRateLimiter();
  const quota = DEFAULT_QUOTAS.beta;
  const now = 1_700_000_000_000;

  for (let i = 0; i < quota.limit; i += 1) {
    const d = limiter.check('k1', 'beta', now);
    assert.equal(d.allowed, true);
    assert.equal(d.limit, quota.limit);
    assert.equal(d.remaining, quota.limit - (i + 1));
  }

  const denied = limiter.check('k1', 'beta', now);
  assert.equal(denied.allowed, false);
  assert.equal(denied.remaining, 0);
  assert.equal(denied.resetAt, now + quota.windowMs);
  assert.ok(denied.retryAfterSeconds >= 0 && denied.retryAfterSeconds <= 60);
});

test('InMemoryRateLimiter resets after the window closes', () => {
  const limiter = new InMemoryRateLimiter();
  const quota = DEFAULT_QUOTAS.beta;
  const start = 1_700_000_000_000;

  for (let i = 0; i < quota.limit; i += 1) {
    limiter.check('k2', 'beta', start);
  }
  assert.equal(limiter.check('k2', 'beta', start).allowed, false);

  const afterWindow = start + quota.windowMs;
  const decision = limiter.check('k2', 'beta', afterWindow);
  assert.equal(decision.allowed, true);
  assert.equal(decision.remaining, quota.limit - 1);
  assert.equal(decision.resetAt, afterWindow + quota.windowMs);
});

test('InMemoryRateLimiter isolates buckets from each other', () => {
  const limiter = new InMemoryRateLimiter();
  const quota = DEFAULT_QUOTAS.beta;
  const now = 1_700_000_000_000;

  for (let i = 0; i < quota.limit; i += 1) {
    limiter.check('keyA', 'beta', now);
  }
  assert.equal(limiter.check('keyA', 'beta', now).allowed, false);
  const other = limiter.check('keyB', 'beta', now);
  assert.equal(other.allowed, true);
  assert.equal(other.remaining, quota.limit - 1);
});

test('InMemoryRateLimiter supports different tiers with independent quotas', () => {
  const limiter = new InMemoryRateLimiter();
  const now = 1_700_000_000_000;
  const decision = limiter.check('internal-key', 'internal', now);
  assert.equal(decision.limit, DEFAULT_QUOTAS.internal.limit);
  assert.equal(decision.remaining, DEFAULT_QUOTAS.internal.limit - 1);
});

test('InMemoryRateLimiter.check rejects empty bucket and unknown tier', () => {
  const limiter = new InMemoryRateLimiter();
  assert.throws(() => limiter.check('', 'beta', 0), /non-empty bucket/);
  // @ts-expect-error deliberately pass an unknown tier
  assert.throws(() => limiter.check('b', 'enterprise', 0), /unknown tier/);
});

test('InMemoryRateLimiter reset(bucket) clears only that bucket', () => {
  const limiter = new InMemoryRateLimiter();
  const now = 1_700_000_000_000;
  limiter.check('a', 'beta', now);
  limiter.check('b', 'beta', now);
  assert.equal(limiter.size(), 2);
  limiter.reset('a');
  assert.equal(limiter.size(), 1);
  limiter.reset();
  assert.equal(limiter.size(), 0);
});

test('InMemoryRateLimiter.sweep evicts closed-window buckets', () => {
  const limiter = new InMemoryRateLimiter();
  const start = 1_700_000_000_000;
  limiter.check('old', 'beta', start);
  limiter.check('new', 'beta', start + DEFAULT_QUOTAS.beta.windowMs);
  assert.equal(limiter.size(), 2);
  const dropped = limiter.sweep(start + DEFAULT_QUOTAS.beta.windowMs);
  assert.equal(dropped, 1);
  assert.equal(limiter.size(), 1);
});

test('rateLimitHeaders / retryAfterHeader produce standard-shaped HTTP headers', () => {
  const limiter = new InMemoryRateLimiter();
  const now = 1_700_000_000_000;
  for (let i = 0; i < DEFAULT_QUOTAS.beta.limit; i += 1) {
    limiter.check('h', 'beta', now);
  }
  const denied = limiter.check('h', 'beta', now);
  const headers = { ...rateLimitHeaders(denied), ...retryAfterHeader(denied) };
  assert.equal(headers['RateLimit-Limit'], String(DEFAULT_QUOTAS.beta.limit));
  assert.equal(headers['RateLimit-Remaining'], '0');
  assert.ok(Number.isFinite(Number(headers['RateLimit-Reset'])));
  assert.equal(headers['Retry-After'], String(denied.retryAfterSeconds));

  const allowed = limiter.check('h-fresh', 'beta', now);
  assert.deepEqual(retryAfterHeader(allowed), {});
});
