# Day 69 — Governance and ownership summary cards

Date: 2026-04-19

## Scope

- Add `packages/ui/src/components/company/governanceCards.tsx` — a pure React component that renders three compact, factual cards (CEO/chair structure, recent insider activity, compensation highlights) plus a `summarizeGovernance(overview)` helper that projects the already-fetched `CompanyOverviewData` into the component's props.
- Wire the new component into `apps/web/app/company/[companyId]/page.tsx` immediately above the existing "Latest filings summary" section, spreading `summarizeGovernance(overview)` so the cards consume the same fetch the page already makes.
- Add `apps/web/tests/company-governance.spec.ts` — 18 `node:test` cases covering the `summarizeGovernance` helper, the component source structure, page wiring, and the `assertGovernanceCardsSource` guard exported for downstream use.
- Update `docs/daily/day-69.md` with scope, rollback-rule check, and a PowerShell-ready verification block.
- No changes outside the four files named in the brief.

## Changes made

### `packages/ui/src/components/company/governanceCards.tsx` (new)

Public surface:

- `GovernanceFiling` — `{ form, filingDate, accessionNumber }`. Keeps the three fields needed to trace any displayed filing back to SEC EDGAR.
- `GovernanceCardsProps` — the typed view model the component renders. Includes `companyName`, `stateOfIncorporation`, `fiscalYearEnd`, a `sampleSize` provenance field, and the latest + count pair for proxy and insider filings.
- `GovernanceOverviewInput` — the narrow subset of `CompanyOverviewData` that `summarizeGovernance` reads. Decoupled from the full overview type so the helper is not coupled to unrelated fields.
- `PROXY_FORMS` — `['DEF 14A', 'DEFA14A', 'PRE 14A']`. Exported as a `ReadonlyArray<string>` so a renderer or a test can use the same allow-list the classifier uses.
- `INSIDER_FORMS` — `['3', '3/A', '4', '4/A', '5', '5/A', 'SC 13D', 'SC 13D/A', 'SC 13G', 'SC 13G/A']`. Covers Section 16 reports and 5%-beneficial-ownership schedules with amendments.
- `summarizeGovernance(overview)` — pure function. Filters `overview.latestFilingsSummary` against `PROXY_FORMS` and `INSIDER_FORMS`, picks the first match from each bucket as the "latest" (the SEC submissions feed is already ordered newest-first), and copies issuer metadata verbatim. Returns `GovernanceCardsProps` with explicit `null` for absent filings — an absent proxy filing in the sample is a reported absence, not a lookup miss.
- `GovernanceCards(props)` — renders a `<section data-testid="governance-cards">` with a short provenance line followed by a 3-column responsive grid of `<article data-testid="governance-card">` cards. Each card carries a kicker, a title, a one-sentence factual lead citing the relevant SEC form, and a `<dl>` with 2–4 facts. Layout uses only design tokens from `../../styles/tokens`.

Factual-and-compact framing:

- Card 1 ("CEO and board chair structure") cites DEF 14A and shows registered issuer, state of incorporation, fiscal year end, and the latest DEF 14A on file.
- Card 2 ("Recent insider activity") cites Forms 3, 4 and 5 plus Schedules 13D and 13G, and shows the count and the most recent insider/ownership filing in the sampled filings.
- Card 3 ("Compensation highlights") cites the Summary Compensation Table of the DEF 14A, and shows the count and the most recent proxy filing in the sampled filings.

No new network fetches: every value the cards display is already in the `CompanyOverviewData` the page fetches on first render. No CEO/chair names, no executive totals, no insider volume are invented — the cards describe the filing footprint and point at where the deeper data lives (the compensation and insiders routes already ship those).

### `apps/web/app/company/[companyId]/page.tsx` (edited)

Two small edits:

- Added one import line: `GovernanceCards` and `summarizeGovernance` from the new module, using the same `../../../../../packages/ui/src/...` relative path the page already uses for `tokens`.
- Inserted `<GovernanceCards {...summarizeGovernance(overview)} />` immediately before the existing "Latest filings summary" section. Placement keeps the overview narrative linear: identity → identity history → filing counts → governance summary → filing detail table.

No other section was touched. The error fallback branch is unchanged.

### `apps/web/tests/company-governance.spec.ts` (new)

18 deterministic, offline tests grouped into three sections:

- `summarizeGovernance` unit tests — proxy/insider allow-lists stay in sync with their constants, issuer metadata copies verbatim, `sampleSize` equals the filing count, proxy and insider counts hand-match the `SAMPLE_OVERVIEW` fixture (Apple-shaped, 8 filings: 2 proxy, 3 insider incl. `SC 13G/A`), first-match-wins for the "latest" pickers, null/zero behaviour on an empty or non-matching sample, and unknown forms (`S-1`, `144`, `UPLOAD`) are not misclassified.
- Component source structural tests — `assertGovernanceCardsSource` asserts all required card topics, `DEF 14A`, `Forms 3, 4 and 5`, `Schedules 13D and 13G`, `Summary Compensation Table`, and both `data-testid` hooks are present; forbidden placeholders (`TODO`, `Coming soon`, `Placeholder`, `lorem`) are rejected; design-token import is required; no raw hex colour is used outside `rgba()` helpers.
- Page wiring tests — the page imports from the new module, references `GovernanceCards`, calls `summarizeGovernance`, and spreads `summarizeGovernance(overview)` into the component.

The exported `assertGovernanceCardsSource(source)` function mirrors the style of `assertCompanyOverviewMarkup` and `assertInsidersPageMarkup` so downstream checks can reuse it.

## Rollback rule check

Rollback rule: **revert if cards become bloated or speculative**.

- **Compact.** Three cards. Each card: one kicker, one title, one one-sentence factual lead, 2–4 fact rows. No images, no charts, no animations, no nested dashboards.
- **Factual.** Every numeric value is derived from filings already in `overview.latestFilingsSummary`; every textual claim cites the SEC form it is grounded in (DEF 14A, Forms 3/4/5, Schedules 13D/13G, Summary Compensation Table). There are no invented CEO names, no speculative board composition, no forecast pay numbers.
- **Provenance preserved.** `sampleSize` is surfaced in the body text ("latest N sampled filings"), and every "latest" card row renders `form · filingDate · accessionNumber`, which is enough to locate the filing on EDGAR. Absent filings render as `—`, not as zeros or hidden rows.
- **No silent schema changes.** `PROXY_FORMS` and `INSIDER_FORMS` are exported constants; a spec test asserts their membership so neither list can be widened silently.
- **Scope-contained.** No chart redesigns, no screener changes, no new API endpoints, no widening of `CompanyOverviewData`, no new package exports. Four files touched.

## Files created / updated

- **Created** `packages/ui/src/components/company/governanceCards.tsx`
- **Updated** `apps/web/app/company/[companyId]/page.tsx` (import + one render line)
- **Created** `apps/web/tests/company-governance.spec.ts`
- **Created** `docs/daily/day-69.md`

## Acceptance checks (PowerShell)

Run from the repo root. Copy-pasteable block:

```powershell
pnpm install
pnpm lint
pnpm typecheck
pnpm --filter web test -- company-governance.spec.ts
pnpm --filter web test
pnpm --filter web build
```

`pnpm --filter web test -- company-governance.spec.ts` is the acceptance-targeted form from the brief. `pnpm --filter web test` is the fallback and runs the full `apps/web` suite, which is the shape Turbo executes under `pnpm test`.

No `services/` files changed; Python suites are not required today. If you still want to exercise them:

```powershell
$env:PYTHONPATH="services/ingest-sec"; python -m pytest services/ingest-sec/tests -q
$env:PYTHONPATH="services/parse-xbrl"; python -m pytest services/parse-xbrl/tests -q
$env:PYTHONPATH="services/parse-proxy"; python -m pytest services/parse-proxy/tests -q
$env:PYTHONPATH="services/id-master"; python -m pytest services/id-master/tests -q
```

## Risks / follow-ups

- The "latest" filings are picked by the SEC submissions feed order. The feed is conventionally newest-first, but the helper does not re-sort by `filingDate`. If a future change to `getCompanyOverview` alters ordering, `latestProxyFiling` / `latestInsiderFiling` could point at a non-latest entry. When we wire the overview to a server-side sorted query, add an explicit sort inside `summarizeGovernance` and a corresponding test.
- The "count" fields are counts *within the displayed sample* (currently 8), not counts across the issuer's full EDGAR history. The UI labels this as "latest N sampled filings" so it is not misleading, but a deeper count would require widening `FilingCountSummary` in `apps/web/lib/api/company.ts`. Out of scope today; noted for a follow-up day.
- CEO/chair names, board chair designation, and compensation amounts are not embedded in these cards. Those values live in DEF 14A HTML and are already surfaced on `/company/[companyId]/compensation`. When the proxy parser (`services/parse-proxy`) emits a structured CEO/chair record, a follow-up day should extend `GovernanceCardsProps` with optional `ceoName` / `boardChair` fields and update the component to render them when present. `summarizeGovernance` is the extension point.
- `GovernanceCards` is imported via the same deep relative path the page already uses for `tokens`. If we later register a `./components/company` subpath in `packages/ui/package.json`, consumers should migrate both imports in one go so the style stays consistent.
