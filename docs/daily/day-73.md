# Day 73 — Extended public API endpoints (compensation, insiders, screener)

Date: 2026-04-20

## Scope

- Implement three Next.js App Router route handlers under
  `apps/web/app/api/v1/{compensation,insiders,screener}/route.ts` that
  materialize the existing public API contracts
  (`CompanyCompensationResponse`, `CompanyInsidersResponse`,
  `ScreenerResult`).
- Keep filters sane and the responses strictly aligned with the read-model
  contracts declared in `packages/schemas/src/api/{compensation,insiders,
  screener}.ts`. Do not add envelope fields the schemas don't declare.
- Preserve only public-safe provenance on each row (SEC accession, filing
  date, form, primary-document URL, filing-index URL) and keep internal
  raw-storage provenance (checksums, parser/normalizer versions, ingest-job
  IDs, raw XML / HTML, internal surrogate keys) off the public surface.
- Add `apps/web/tests/api-extended.spec.ts` covering query-param parsing,
  envelope shape, transaction-class classification, screener filter
  parity, and provenance-leakage assertions — purely offline, no network.
- No changes to API auth, the docs site, pricing, CI, schema, or Python
  services.

## Files created / updated

- **Created** `apps/web/app/api/v1/compensation/route.ts` — `GET` handler.
- **Created** `apps/web/app/api/v1/compensation/helpers.ts` — pure helpers
  (query parsing, source index, row / history projection, envelope
  builder). See "Helpers module rationale" below.
- **Created** `apps/web/app/api/v1/insiders/route.ts` — `GET` handler.
- **Created** `apps/web/app/api/v1/insiders/helpers.ts` — pure helpers
  (query parsing, `transactionClass` classifier, row projection, envelope
  builder).
- **Created** `apps/web/app/api/v1/screener/route.ts` — `GET` handler.
- **Created** `apps/web/app/api/v1/screener/helpers.ts` — pure helpers
  (min/max query parsing per metric, mirrored `SAMPLE_ROWS`,
  `filterScreenerRows` wrapper).
- **Created** `apps/web/tests/api-extended.spec.ts` — 35 unit tests.
- **Created** `docs/daily/day-73.md` — this file.

### Helpers module rationale

Next.js 15 fails the production build if `route.ts` exports anything other
than the HTTP verbs (`GET`, `POST`, …) and a small fixed set of segment
config keys (`dynamic`, `revalidate`, `runtime`, …). Tests need to import
the pure projection / parsing logic directly, so the logic lives alongside
`route.ts` in a sibling `helpers.ts` module. This is the same pattern Day
72 established for the core endpoints, and it is a strictly necessary
supporting change relative to the Day 73 allow-list — otherwise the
`api-extended.spec.ts` acceptance test cannot run without starting Next in
server mode and hitting SEC over the network. No other files outside the
allow-list were modified.

## Contract adherence

Each route emits exactly the envelope defined in
`packages/schemas/src/api/*`.

| Endpoint                | Envelope type                  | `apiVersion` |
| ----------------------- | ------------------------------ | ------------ |
| `/api/v1/compensation`  | `CompanyCompensationResponse`  | `"1"`        |
| `/api/v1/insiders`      | `CompanyInsidersResponse`      | `"1"`        |
| `/api/v1/screener`      | `ScreenerResult`               | n/a (1)      |

(1) The screener v1 contract is intentionally a bare
`{ filtersApplied, rows, totalMatched }` shape — the schema does not
declare an `apiVersion` / `generatedAt` wrapper. Adding one would broaden
the contract beyond the read model and would violate today's rollback rule.
`filtersApplied` is itself the public echo of the normalized filter tree.

`apiVersion` on the compensation and insiders envelopes is stamped from the
`COMPENSATION_API_VERSION` and `INSIDERS_API_VERSION` constants exported
by the schema modules — there is no duplicated literal, so a future schema
version bump flows through automatically. `generatedAt` is the API
response time (ISO 8601 UTC), not an internal DB write time.

### `/api/v1/compensation`

- Query params: `companyId` (required; digits-only or zero-padded).
- Data source: `getCompanyCompensation()` from
  `apps/web/lib/api/compensation.ts` (SEC proxy statements).
- Projection:
  - Builds an accession → source index from the internal `sources[]`.
  - Each public row re-attaches `form` from the index; every history
    point re-attaches `latestFilingDate` from the index. The internal
    data model omits those redundant fields; the public schema carries
    them per-row for traceability.
  - Row-level fields written on the wire: `executiveName`, `title`,
    `fiscalYear`, `totalCompensationUsd`, `accession`, `filingDate`,
    `form`, `sourceUrl`.
  - History-level fields: `executiveName`, `fiscalYear`,
    `totalCompensationUsd`, `latestAccession`, `latestFilingDate`,
    `latestSourceUrl`.
- Error shape: `400 { error }` on invalid input, `502 { error }` on
  upstream SEC failure.

### `/api/v1/insiders`

- Query params: `companyId` (required), `role` (optional; one of
  `all | director | officer | ten_percent_owner | other`; anything else
  normalizes to `all`, matching `normalizeInsiderRoleFilter`).
- Data source: `getCompanyInsiders()` from
  `apps/web/lib/api/insiders.ts` (SEC Form 3 / 4 / 5 XML).
- `transactionClass` derivation (stable projection):

  | Row state                                                       | Class              |
  | ---------------------------------------------------------------- | ------------------ |
  | `isDerivative = true`                                            | `derivative_event` |
  | `transactionCode=null ∧ shares=null ∧ acquiredOrDisposed=null`   | `holdings_change`  |
  | `code ∈ {A, M, X, G}` and direction `A`                          | `grant`            |
  | `code = P` and direction `A`                                     | `buy`              |
  | `code = S` and direction `D`                                     | `sell`             |
  | anything else                                                    | `ambiguous`        |

  The policy is narrow on purpose: `ambiguous` is a first-class value,
  not missing data, so downstream clients never have to second-guess a
  silent fallback. The internal `transactionCode` is still emitted on
  the wire (and is a matter of public SEC record), so clients who want a
  different interpretation can roll their own.
- Error shape: `400 { error }` on invalid input, `502 { error }` on
  upstream SEC failure.

### `/api/v1/screener`

- Query params (all optional; min / max accepted as finite decimals):
  - size:      `minMarketCap`, `maxMarketCap`, `minRevenue`,
               `maxRevenue`, `minAssets`, `maxAssets`
  - growth:    `minRevenueGrowth`, `maxRevenueGrowth`,
               `minEarningsGrowth`, `maxEarningsGrowth`
  - margin:    `minGrossMargin`, `maxGrossMargin`,
               `minOperatingMargin`, `maxOperatingMargin`,
               `minNetMargin`, `maxNetMargin`
  - leverage:  `minLiabilitiesToEquity`, `maxLiabilitiesToEquity`,
               `minLiabilitiesToAssets`, `maxLiabilitiesToAssets`
  - liquidity: `minCurrentRatio`, `maxCurrentRatio`,
               `minQuickRatio`, `maxQuickRatio`
- Growth and margin are decimals (e.g. `minRevenueGrowth=0.10` for
  "at least 10%"), matching the internal read model.
- Non-numeric bounds throw a descriptive `400` error
  (`minMarketCap must be a finite number`). `min > max` on any range is
  rejected by `normalizeScreenerFilters` with `Invalid range: min (…)
  exceeds max (…)`.
- Data source: `getScreenerRows()` which returns a `SAMPLE_ROWS` list
  mirrored from `apps/web/app/screener/page.tsx`. Until a screener corpus
  is persisted, this is the same data the UI renders, so the API output
  is identical to what the page shows. When the real read model lands it
  replaces `getScreenerRows()` in a single swap.
- The response is exactly `{ filtersApplied, rows, totalMatched }` — no
  `apiVersion`, no `generatedAt`, matching the schema and the existing
  internal `ScreenerResult` type.
- Error shape: `400 { error }` on invalid input (bad numeric, `min > max`).

## Provenance posture (public vs. internal)

Public provenance kept on each response:

| Contract     | Public provenance kept on the wire                                                                                              |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| compensation | `rows[].{accession, filingDate, form, sourceUrl}`, `history[].{latestAccession, latestFilingDate, latestSourceUrl}`, `sources[]` |
| insiders     | `rows[].{accession, filingDate, form, primaryDocument, primaryDocUrl, filingIndexUrl, issuerCik}`, `sources[]`                   |
| screener     | `filtersApplied` (public echo); rows carry `companyId` and `ticker` only                                                         |

Compensation and insiders both carry an envelope-level `generatedAt` so a
caller can tell how fresh the server-side view is, distinct from the
filing age. Screener does not (its schema does not declare one).

Internal raw-storage fields that are deliberately **not** exposed on any
of the three endpoints:

- Row-level `raw_artifact_id`, `source_checksum` / `checksum_sha256`,
  `parser_version` / `normalizer_version`, `ingest_job_id`,
  `source_fetched_at`, `recorded_at`, `normalized_at`.
- Internal surrogate keys: `insiderId`, `executiveId`, `compSummaryId`,
  `compAwardId`, `issuerId`.
- Raw XML (Form 3/4/5) and raw HTML (proxy filings). Parsed rows only.
- Parser heuristics state (which table layout matched, which regex passes
  fired, how many rows were rejected).
- Summary Compensation Table component-level breakdowns (salary, bonus,
  stock awards, option awards). v1 publishes the top-line
  `totalCompensationUsd` only.

The `api-extended.spec.ts` suite includes dedicated tests per endpoint
that serialize the envelope and assert none of
`checksum`, `sha256`, `rawArtifactId`, `raw_artifact_id`,
`parserVersion`, `parser_version`, `ingestJobId`, `ingest_job_id`,
`sourceFetchedAt`, `normalizerVersion`, `insiderId`, `rawXml`,
`compSummaryId`, `executiveId`, `compAwardId`, or `recordedAt`
appear in the serialized response.

## Rollback rule check

Rollback rule: **revert if endpoints are broader than the read-model
contract allows.**

- Every route emits the exact envelope type declared in
  `packages/schemas/src/api/*`, stamped with `apiVersion` from the schema's
  own literal where declared. There is no duplicate literal in route code
  and no drift possible.
- All three envelopes type-check cleanly against the schema module
  (verified via `pnpm typecheck`).
- No route adds fields beyond what the schema declares. The
  `buildCompensationResponse`, `buildInsidersResponse`, and
  `buildScreenerResponse` functions have return types explicitly
  annotated as the schema type, so a drift would fail the TypeScript build.
- The screener envelope is asserted to carry exactly
  `{ filtersApplied, rows, totalMatched }` — a dedicated test asserts
  the top-level key set, so any accidental broadening fails immediately.
- `api-extended.spec.ts` envelope-shape tests assert `apiVersion`,
  `generatedAt`, and top-level collection names
  (`rows`, `history`, `sources` for compensation; `rows`, `sources` for
  insiders; `filtersApplied`, `rows`, `totalMatched` for screener).

If a future change proposes to surface any internal raw-storage field on
these responses, the right place is a new v2 envelope or an admin-only
contract, not the public v1 surface.

## Forbidden scope — confirmed untouched

- **API auth** — no auth added, no auth surface touched. These endpoints
  remain unauthenticated, matching the core endpoints shipped on Day 72.
- **Docs site** — `apps/docs/**` untouched. No changes to
  `docs/architecture/`, `docs/operations/`, or any content route.
- **Pricing** — `apps/web/app/(marketing)/**` untouched.
- **Python services** — no changes.
- **Database** — no schema changes, no migrations.
- **CI** — `.github/workflows/ci.yml` untouched.

## Verification

Run from the repo root in Windows PowerShell:

```powershell
git fetch origin claude/setup-monorepo-inspection-025kT
git checkout claude/setup-monorepo-inspection-025kT
git pull origin claude/setup-monorepo-inspection-025kT

pnpm install

# Day 73 acceptance tests (per the brief):
pnpm --filter web test -- api-extended.spec.ts ; if (-not $?) { pnpm --filter web test }
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
- `pnpm --filter web test` — 430 tests pass, 0 failures (395 prior + 35
  new in `api-extended.spec.ts`).
- `pnpm --filter web build` — emits dynamic routes
  `ƒ /api/v1/compensation`, `ƒ /api/v1/insiders`, `ƒ /api/v1/screener`
  alongside the Day 72 routes.

## Risks / follow-ups

- **Screener corpus is still a sample.** `getScreenerRows()` returns a
  mirrored `SAMPLE_ROWS` list that duplicates the fixture in
  `apps/web/app/screener/page.tsx`. The two lists are identical today;
  consolidating them onto a shared `apps/web/lib/api/screener-samples.ts`
  module is a natural refactor but is outside today's allow-list and
  would have no runtime effect until an ingested corpus exists.
- **Compensation parser coverage is still heuristic.** The underlying
  `getCompanyCompensation` returns what the HTML parser could extract;
  rows it could not parse do not appear in the public response (and are
  not counted anywhere). Expanding coverage (or surfacing a "filings
  consulted vs. rows parsed" hint) is a v2 candidate, not a v1
  contract change.
- **`transactionClass` classifier is narrow.** Only `{P, S, A, M, X, G}`
  are mapped; everything else (F, J, D-as-direction with other codes,
  etc.) becomes `ambiguous`. This is deliberate for Day 73. Extending
  the mapping is safe inside the `ambiguous` bucket; widening it into
  new classes would need a schema enum update.
- **No rate limiting / auth.** These endpoints are unauthenticated and
  have no per-caller quota. Day 73 stays scope-limited to the read
  contract; rate limiting, API keys, and CORS posture remain downstream
  concerns.
- **Helpers mirror scope.** The three new `helpers.ts` files follow the
  Day 72 pattern. If Next.js's route-segment export rules ever relax, the
  helpers can fold back into their `route.ts` — but today they are a
  strictly necessary supporting file so the pure logic is unit-testable.
