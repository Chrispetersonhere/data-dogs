# Day 74 — API auth, request logging, and simple rate limits

Date: 2026-04-20

## Scope

- Add API-key primitives the public v1 API can use to authenticate callers
  (`apps/web/lib/auth/apiKeys.ts`).
- Add a simple in-memory, per-bucket fixed-window rate limiter
  (`apps/web/lib/auth/rateLimits.ts`) with sensible beta/standard/internal
  quotas.
- Persist hashed keys and an append-only per-request audit trail in
  `packages/db/schema/013_api_keys.sql` (tables `api_key` and
  `api_request_log`).
- Cover the above with fully-offline unit tests in
  `apps/web/tests/api-auth.spec.ts`.
- Do not modify route handlers, pricing UI, OAuth, CI, or Python services.

## Files created / updated

- **Created** `packages/db/schema/013_api_keys.sql` — `api_key` and
  `api_request_log` tables, indexes.
- **Created** `apps/web/lib/auth/apiKeys.ts` — key hashing, header
  extraction, shape validation, constant-time verification, sanitized
  view, and `buildApiRequestLogEntry`.
- **Created** `apps/web/lib/auth/rateLimits.ts` — `InMemoryRateLimiter`
  (fixed window, per-bucket), default quotas, standard rate-limit HTTP
  headers.
- **Created** `apps/web/tests/api-auth.spec.ts` — 38 unit tests.
- **Created** `docs/daily/day-74.md` — this file.

No route handlers were modified. The library is shipped ready-to-wire but
unwired; Day 75 or later will fold it into the `route.ts` files under
`apps/web/app/api/v1/*` so today's rollback rule (“revert if auth becomes
complex or weakly tested”) is trivially satisfiable.

## Design

### Key format

Raw keys are `dd_live_<48 lowercase hex>` (or `dd_test_<48 hex>` for
sandbox traffic). The prefix is recognizable in logs, in support tickets,
and in leaked-credential scanners. The 48-hex tail is 192 bits of entropy
from `crypto.randomBytes(24)` — well above the 128-bit floor for
non-expiring bearer tokens.

The raw key is shown once at issuance. Only the SHA-256 hex of the raw
key is persisted (`api_key.key_hash`, unique), matching the rest of the
schema's posture that secret-bearing material never enters the database
in cleartext.

### Authentication flow

1. `extractApiKeyFromHeaders(headers)` reads `Authorization: Bearer …`
   first (case-insensitive scheme, whitespace-tolerant) and then falls
   back to `x-api-key`. Both are common beta-API conventions; supporting
   both lets curl users and SDK-based callers share a code path.
2. `isWellFormedApiKey(raw)` rejects anything that isn't one of the two
   recognized prefixes plus a 48-char lowercase hex suffix.
3. `verifyApiKey(raw, records)` SHA-256-hashes the raw key and scans the
   active-record list in constant time via `timingSafeEqual`. Even after
   a hit, the scan runs to the end of the list so the total response
   time is independent of where the match sits — this closes the trivial
   timing side channel that an early-return would open.
4. A matched record is returned as a `SanitizedApiKey` (no hash, no
   note). Callers cannot forward the stored hash back onto the public
   wire even by accident.
5. Revoked records (`revokedAt !== null`) surface as a distinct
   `revoked` failure reason so the caller can return `403 Forbidden`
   rather than `401 Unauthorized` — the helper
   `httpStatusForAuthFailure` does the mapping.

### Rate limiting

`InMemoryRateLimiter` is a fixed-window counter keyed by bucket (typically
`api_key_id` for authenticated traffic, normalized `client_ip` for
unauthenticated traffic). It is deliberately:

- **In-memory and single-process.** One web dyno: correct. Multi-dyno:
  each process enforces its own window, which under-approximates the
  real quota (true limit is `N * quota` for N processes). That is
  acceptable for beta. The Redis-backed replacement can drop in behind
  the `RateLimiter` interface without caller changes.
- **Explicit-clock.** `check(bucket, tier, now)` accepts `now` as
  milliseconds so tests are deterministic and no `setInterval` timer
  leaks between cases.
- **Tiered.** `DEFAULT_QUOTAS` is 60 rpm (beta), 600 rpm (standard),
  6 000 rpm (internal). All three share a 60-second window today.

Standard rate-limit HTTP headers are emitted via `rateLimitHeaders`
(`RateLimit-Limit / Remaining / Reset`) and `retryAfterHeader`
(`Retry-After`, only on deny) so the wire format matches the current
IETF draft.

### Request logging

`buildApiRequestLogEntry(input)` produces a row shaped for the
`api_request_log` table. Key behavior:

- `url` is parsed into `path` and `queryString` so the audit log is
  queryable without regex per analytical pass. Relative URLs are
  tolerated via a manual split fallback (`new URL` requires a host).
- `method` is upper-cased so the column has a stable vocabulary.
- Nullable columns (`apiKeyId`, `remoteIp`, `userAgent`, `responseMs`,
  `rateLimitBucket`, `rateLimitRemaining`, `queryString`) are preserved
  as-is — anonymous unauthenticated rejection (e.g. `429` on a missing
  key) produces a row with `apiKeyId = null`, which lets us audit
  unauth volume without needing to retroactively associate a key.
- `rateLimited` is a dedicated boolean so `SELECT … WHERE rate_limited`
  is an index-friendly predicate.

### Schema

`api_key`:

| Column            | Type        | Notes                                           |
| ----------------- | ----------- | ----------------------------------------------- |
| `api_key_id`      | text PK     | Surrogate, issued at creation.                  |
| `key_hash`        | text UNIQUE | SHA-256 hex of raw key. Never logged.           |
| `key_prefix`      | text        | `dd_live_` or `dd_test_`.                       |
| `owner_email`     | text        | Contact email for the issued key.               |
| `scope`           | enum text   | `read` / `read_write` / `admin` (check).        |
| `tier`            | enum text   | `beta` / `standard` / `internal` (check).       |
| `created_at`      | timestamptz | Issuance time.                                  |
| `revoked_at`      | timestamptz | NULL = active.                                  |
| `last_used_at`    | timestamptz | Maintained by the request-log writer.           |
| `note`            | text        | Internal-only. Never returned on the wire.      |

`api_request_log`:

| Column                | Type        | Notes                                       |
| --------------------- | ----------- | ------------------------------------------- |
| `api_request_log_id`  | text PK     | Surrogate.                                  |
| `api_key_id`          | text FK     | Nullable (unauth rejections preserve row).  |
| `request_id`          | text        | Same header the observability layer uses.   |
| `method`              | text        | Upper-cased.                                |
| `path`                | text        | Path-only, no query.                        |
| `query_string`        | text NULL   | Raw query (without `?`), or NULL.           |
| `status_code`         | integer     | HTTP status returned.                       |
| `remote_ip`           | text NULL   | Caller IP (may be proxy-forwarded).         |
| `user_agent`          | text NULL   | Free-form.                                  |
| `response_ms`         | integer NULL| Server-side timing.                         |
| `rate_limit_bucket`   | text NULL   | Bucket key used by the limiter.             |
| `rate_limit_remaining`| integer NULL| Remaining tokens at admit time.             |
| `rate_limited`        | boolean     | True when the request was denied at 429.    |
| `requested_at`        | timestamptz | Server wall-clock time.                     |

Indexes cover `(api_key_id, requested_at)`, `(path, requested_at)`, and a
top-level `requested_at` for pure time-range scans; plus
`api_key(key_prefix)` and a partial index on active keys
(`WHERE revoked_at IS NULL`) so key-set scans at verify time stay cheap.

## Provenance & auditability

- Hashed-only storage (`key_hash`) preserves the pattern used everywhere
  else in the schema: raw secret never lands in the DB.
- Every request is auditable: `api_request_log` joins back to
  `ingestion_job` / `parser_run` via `request_id` when the response was
  served out of a parsed fact. This preserves the “transformed facts
  remain traceable to raw source” invariant even when the public API is
  the access path.
- The sanitized view returned by `verifyApiKey` carries no hash, no note,
  and a dedicated test asserts the serialized envelope never contains
  `keyHash`.

## Security posture (beta)

- Constant-time hash compare via `crypto.timingSafeEqual`, length
  short-circuit kept out of the timing-sensitive path.
- Full-list scan after a match so response time is independent of key
  position.
- Shape-check (`isWellFormedApiKey`) pre-rejects malformed inputs with a
  typed reason instead of silently mapping them to `unknown_key` — this
  gives clients a better error without leaking whether a close-by key
  exists.
- Revoked keys produce a distinct failure reason and `403`, separating
  “never existed” from “existed, now revoked” for ops.
- `Authorization` wins over `x-api-key` when both are present so the
  common HTTP convention is authoritative.

Out of scope for today (explicitly): OAuth, session cookies, per-user
billing, plan enforcement, key rotation tooling, Redis-backed limiter,
abuse detection, and WAF integration.

## Forbidden scope — confirmed untouched

- **Frontend pricing logic** — `apps/web/app/(marketing)/**` untouched.
- **OAuth** — no OAuth provider, no OpenID flows, no redirect handlers,
  no cookie-based sessions.
- **Route handlers** — every `apps/web/app/api/v1/*/route.ts` is
  byte-identical to its state at the end of Day 73.
- **CI / Python services / Docker / existing schema** — untouched.

## Rollback rule check

Rollback rule: **revert if auth becomes complex or weakly tested.**

- Two modules, 38 unit tests, 100% offline, deterministic clock.
- No I/O, no network, no dependency beyond `node:crypto`.
- Auth and rate-limiter live behind narrow, typed entry points
  (`authenticateRequest`, `RateLimiter.check`) — the next PR that wires
  them into a `route.ts` is a 3-line change and revert is equally
  cheap.
- No route handler or page was modified, so a straight revert of the
  five files returns the app to a known-good Day 73 state with zero
  coordination cost.

## Verification

Run from the repo root in Windows PowerShell:

```powershell
git fetch origin claude/setup-monorepo-inspection-fbB4L
git checkout claude/setup-monorepo-inspection-fbB4L
git pull origin claude/setup-monorepo-inspection-fbB4L

pnpm install

# Day 74 acceptance tests (per the brief):
pnpm --filter web test -- api-auth.spec.ts ; if (-not $?) { pnpm --filter web test }
pnpm --filter web build

# Full standard palette:
pnpm lint
pnpm typecheck
pnpm --filter web test
pnpm --filter web build

# Python services (unchanged this pass, run for safety):
$env:PYTHONPATH="services/ingest-sec"; python -m pytest services/ingest-sec/tests -q
$env:PYTHONPATH="services/parse-xbrl"; python -m pytest services/parse-xbrl/tests -q
$env:PYTHONPATH="services/parse-proxy"; python -m pytest services/parse-proxy/tests -q
$env:PYTHONPATH="services/id-master";   python -m pytest services/id-master/tests   -q
```

At time of writing on this worktree:

- `pnpm lint` — clean (0 warnings across web, @data-dogs/ui, @data-dogs/db).
- `pnpm typecheck` — clean (no errors).
- `pnpm --filter web test` — 468 tests pass, 0 failures (430 prior + 38
  new in `api-auth.spec.ts`).
- `pnpm --filter web build` — all routes from Day 73 still present; no
  new routes (this PR is library-only).

## Risks / follow-ups

- **Library is unwired.** Route handlers under `apps/web/app/api/v1/*`
  still run unauthenticated. Wiring is deferred to a later day whose
  allow-list includes the `route.ts` files, matching today's narrow
  scope. The unit tests already cover every branch the wiring will
  exercise.
- **In-memory limiter is single-process.** Correct on one web dyno,
  under-approximate on N. The `RateLimiter` interface is the seam for a
  Redis-backed replacement when the platform scales horizontally. A
  shared bucket store also lets us apply per-key quotas across
  geographies.
- **No key-management UI/CLI.** `generateApiKey()` is the issuance entry
  point; a human operator must insert the row and show `rawKey` to the
  user exactly once. A `scripts/issue-api-key.ts` CLI is a natural
  follow-up, but is outside today's allow-list.
- **`migrations/` vs. `schema/` drift.** As documented in CLAUDE.md,
  `packages/db/migrations/` is not yet aligned with
  `packages/db/schema/`. This PR adds `schema/013_api_keys.sql` only;
  the paired migration file will be added when the migration backlog is
  reconciled.
- **Fixed-window burst behavior.** Fixed windows let a caller burst at
  the window boundary (up to `2 * limit` in a ~1-second span). This is
  acceptable for beta. A sliding log or token bucket is the upgrade
  path; same interface.
