# Day 67 — Insider activity page

Date: 2026-04-19

## Scope

- Build the `/company/:companyId/insiders` page (Next.js App Router) with a premium layout, a latest-activity list, a role filter, and a filing drilldown section.
- Add `apps/web/lib/api/insiders.ts` that fetches SEC submissions, filters Form 3/4/5 primary documents, and parses each filing's reporter identity + transactions into `InsiderActivityRow` rows with full source provenance (accession, filing date, SEC primary-doc URL, filing-directory URL, issuer CIK).
- Keep the XML parser pure (dependency-free, no DOM) and expose it via `parseInsiderActivityForTest` so the spec can exercise it offline.
- Add `apps/web/tests/insiders-page.spec.ts` covering required page markup, the XML parser, role-filter normalization, row filtering by role, and the chronological comparator.
- No changes to the homepage, pricing, Python services, DB schema, or any workspace outside `apps/web` and `docs/daily`.

## Changes made

### `apps/web/lib/api/insiders.ts` (new)

Public surface:

- `InsiderRoleFilter` — `'all' | 'director' | 'officer' | 'ten_percent_owner' | 'other'`. `INSIDER_ROLE_FILTERS` exposes the full list so the page can render filter chips without duplicating the literal.
- `InsiderActivityRow` — one row per parsed transaction (or one placeholder row for a Form 3 with no transactions). Carries `accession`, `filingDate`, `form`, `primaryDocument`, `primaryDocUrl`, `filingIndexUrl`, and `issuerCik` so every rendered row is traceable back to the SEC filing it came from.
- `CompanyInsidersData` — view model consumed by the page: company name, CIK, active role filter, rows (already filtered + chronologically sorted), and `sources[]` (every Form 3/4/5 found in the recent submissions feed, regardless of whether its XML parsed cleanly).
- `normalizeInsiderRoleFilter(value)` — coerces an unknown search-param string to a canonical `InsiderRoleFilter`. Unknown / missing / empty values fall back to `'all'`, so a malformed URL cannot throw at render time.
- `rolesMatchFilter(roles, filter)` — pure predicate; `'all'` matches everything, every other filter matches only when the corresponding role flag is set.
- `filterInsiderActivityRows(rows, filter)` — row-level filter built on top of `rolesMatchFilter`.
- `compareInsiderRowsChronologically(a, b)` — newest transaction first, with deterministic tie-breakers (filingDate desc, then accession desc, then reporterName asc). This is the contract behind the rollback rule "revert if page is not chronological".
- `parseInsiderActivityFromXml({ xml, filing })` — pure Form 3/4/5 XML → rows.
- `parseInsiderActivityForTest(...)` — thin wrapper used by the spec that builds the `FilingCandidate` URLs from the same `padCik` / `accessionForPath` helpers used at runtime.
- `getCompanyInsiders(companyId, role)` — fetches `data.sec.gov/submissions/CIK<cik>.json`, filters recent filings to `{3, 3/A, 4, 4/A, 5, 5/A}`, sorts by filing date desc, caps at the 25 most recent filings, fetches each primary document that ends in `.xml`, and returns filtered + sorted rows capped at 200. `sources[]` is always populated from the submissions feed even when XML parsing yields zero rows, so the drilldown section never goes blank.

Parser notes:

- No external XML dependency. Two small regex-driven helpers (`xmlField` for the outer tag and `xmlValue` for the inner `<value>` most Form 4 fields wrap their payload in) are enough for the relevant subset of the Form 3/4/5 schema.
- `nonDerivativeTable` and `derivativeTable` are parsed separately so the page can flag derivative transactions explicitly (`isDerivative`).
- When a filing has a reportingOwner but zero transactions (valid for Form 3), the parser emits a single placeholder row with `transactionCode: null`, `shares: null`, `acquiredOrDisposed: null`, and `transactionDate` = filingDate, so the page still surfaces the relationship + source link without inventing numeric precision.
- If `reportingOwner` is absent the parser returns `[]` — the filing is simply dropped from the activity list but still shown under "Filing drilldown".

### `apps/web/app/company/[companyId]/insiders/page.tsx` (new)

Server component (App Router). Layout sections:

1. **Premium layout header** — company name, CIK, and a one-line description calling out that rows are newest first and every row is source-linked.
2. **Role filter** — pill-style links, one per `InsiderRoleFilter`. The active pill is rendered with a `data-active="true"` attribute for tests and accessibility. The `'all'` link drops the `?role=` query entirely so the canonical URL stays clean.
3. **Latest activity** — premium table with columns Transaction date, Reporter, Role, Security, Code, Shares, Price, Form, Filing date, Source. Shares carry a +/- prefix derived from `acquiredOrDisposed` to make flow direction readable at a glance. Empty states explain why the table is empty (selected role filter) instead of showing a blank card.
4. **Filing drilldown** — one entry per source filing, linking to both the primary document and the filing directory index. Always rendered from `sources[]`, even for filings whose XML we could not parse, so auditors can still reach the source.

Error fallback preserves the existing pattern from `compensation/page.tsx`: show a scoped error card, include the companyId, and surface `String(error)` in a muted sub-line.

### `apps/web/tests/insiders-page.spec.ts` (new)

14 tests, offline and deterministic:

- Page markup assertions: `assertInsidersPageMarkup` accepts full markup, rejects missing `Filing drilldown`, rejects `TODO` / `Placeholder` / `Coming soon` leakage.
- Page source scan: reads `page.tsx` and asserts every required section heading, table column, and link label (`source link`, `filing index`) is present in the checked-in page source.
- Chronological contract: asserts the page imports `getCompanyInsiders` (which is the public entrypoint that applies `compareInsiderRowsChronologically`).
- `normalizeInsiderRoleFilter` round-trips every canonical role, lower-cases upper-cased inputs, and falls back to `'all'` for `undefined` / `null` / `''` / unknown.
- `rolesMatchFilter` — director-only row matches `'director'` and `'all'` only.
- `filterInsiderActivityRows` — four single-role rows, one per role flag, correctly split by the four non-`'all'` filters; `'all'` returns all four.
- `parseInsiderActivityForTest` on a realistic Form 4:
  - extracts reporter name, reporter CIK (zero-padded to 10), and officer title verbatim;
  - extracts two transactions (S / D and A / A) with exact `shares`, `pricePerShare`, `sharesOwnedAfter`;
  - stamps `form`, `filingDate`, `accession`, `issuerCik`, `primaryDocUrl`, `filingIndexUrl` on every row.
- Derivative-table transactions are flagged `isDerivative: true`.
- A transactionless Form 3 emits exactly one row with `transactionCode: null`, `shares: null`, `acquiredOrDisposed: null`.
- Missing `reportingOwner` → empty array, not a placeholder row.
- `compareInsiderRowsChronologically` produces the expected order (`2026-03-15` latest, ties broken by filingDate desc, then accession desc).

## Rollback rule check

Rollback rule: revert if the page is not chronological, readable, and source-linked.

- **Chronological.** `getCompanyInsiders` always applies `compareInsiderRowsChronologically` before slicing. The comparator is exercised directly by `compareInsiderRowsChronologically sorts newest transaction first…`.
- **Readable.** Columns are labeled with human words (Transaction date, Reporter, Role, Security, Code, Shares, Price, Form, Filing date, Source). Share counts carry a +/- sign derived from `acquiredOrDisposed`. Officer title is embedded in the role cell when present so readers do not have to cross-reference the raw relationship XML. Empty states explain why the table is empty instead of rendering a bare card.
- **Source-linked.** Every row in Latest Activity has a `source link` anchor to the SEC primary document, and every filing in Filing drilldown has both a primary-doc link and a filing-directory link. `sources[]` is populated from the submissions feed, so even filings whose XML we fail to parse still appear in the drilldown. The spec asserts `source link` and `filing index` are both present in the checked-in page source.
- **Provenance preserved.** No row is emitted without `accession`, `filingDate`, `primaryDocUrl`, `filingIndexUrl`, and `issuerCik`. No numeric field is rescaled or rounded: shares and price are copied verbatim from the XML `<value>` payload (asserted by `parseInsiderActivityForTest extracts reporter, roles, and transactions with source provenance`).

## Acceptance checks

Run from the repo root. PowerShell-ready copy/paste block:

```powershell
pnpm install
pnpm lint
pnpm typecheck
pnpm --filter web test -- insiders-page.spec.ts
pnpm --filter web build
pnpm --filter web test
```

`pnpm --filter web test -- insiders-page.spec.ts` is the acceptance-targeted form (matches today's brief). `pnpm --filter web test` is the fallback and runs the full `apps/web` suite.

No `services/` files changed; Python suites are not required today. If you still want to exercise them:

```powershell
$env:PYTHONPATH="services/ingest-sec"; python -m pytest services/ingest-sec/tests -q
$env:PYTHONPATH="services/parse-xbrl"; python -m pytest services/parse-xbrl/tests -q
$env:PYTHONPATH="services/parse-proxy"; python -m pytest services/parse-proxy/tests -q
$env:PYTHONPATH="services/id-master"; python -m pytest services/id-master/tests -q
$env:PYTHONPATH="services/market-data"; python -m pytest services/market-data/tests -q
```

## Risks / follow-ups

- The page fetches Form 3/4/5 XMLs at render time. For companies with very active insiders (25 × ~100 KB filings on a cache miss) this can saturate the 10 req/sec SEC throttle the Python client enforces but the Next app does not yet share. A follow-up day should route the web fetch through a server-side helper that reads from the Day-65/66 in-memory store (or its future persisted form) instead of re-fetching SEC on every cache miss.
- The regex XML parser covers the fields we surface today; it is not a general Form 4 reader. Joint filings (multiple `reportingOwner` blocks) are represented by the first reporter only. If a follow-up day needs joint filings, extend `parseReporter` to return an array and fan out one row set per owner — bump a new `PAGE_PARSER_VERSION` constant when that happens so normalized output remains auditable.
- The page does not yet show the normalized `buy/sell/grant/derivative_event/holdings_change/ambiguous` class from the Day-66 normalizer. That requires the web app to consume the market-data service, which is out of scope today. The raw transaction code is surfaced in the `Code` column so analysts can cross-reference.
- Role filter is reporter-level (the flags the filer declared on the cover page). If we later want a transaction-level filter (e.g. "only open-market purchases") we should add a second filter chip row driven by the normalized class above rather than overloading `role`.
