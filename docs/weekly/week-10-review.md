# Week 10 Review — Compensation and insider surfaces

Date: 2026-04-19

## Week objective

Ship the user-facing compensation and insider modules on top of the Week 9 parser foundation, keep every rendered row traceable back to its SEC source filing, and close the week with a stabilization pass.

## Delivered this week (Days 64–70)

- **Day 64 — Company compensation page.** Built `/company/[companyId]/compensation` with Executive table, Total comp history, and Source links sections. Added `apps/web/lib/api/compensation.ts` which fetches SEC submissions, selects recent `DEF 14A` / `DEFA14A` filings, builds SEC archive URLs, and heuristically extracts Summary Compensation Table rows. Carried `accession`, `filingDate`, and `sourceUrl` on every parsed row. Added `apps/web/tests/compensation-page.spec.ts` with required-text gates and person-name extraction cases (Jen-Hsun Huang, Luca Maestri, EVP-title exclusion, continuation rows).
- **Day 65 — Insider dataset ingest with raw + normalized separation.** Added `packages/db/schema/012_insiders.sql` and `services/market-data/src/insider_ingest.py` with an in-memory store that writes immutable raw artifacts keyed by checksum, upserts normalized `InsiderRecord` identities, and stages idempotent `InsiderTransactionRow` / `InsiderHoldingRow` rows. Every staged row carries the full provenance tuple `(raw_insider_artifact_id, source_url, source_accession, source_fetched_at, source_checksum, parser_version, ingest_job_id, recorded_at)`.
- **Day 66 — Normalize insider transactions into canonical classes.** Added `services/market-data/src/normalize_insiders.py`. Maps SEC Form 4 transaction codes × `(A | D)` direction into `{ buy, sell, grant, derivative_event, holdings_change, ambiguous }`. Codes `V`, `I`, `J` are always ambiguous; unknown codes and direction-less rules also resolve to `ambiguous` with an explicit human-readable reason. `NormalizedInsiderTransaction` copies provenance forward verbatim and adds `normalizer_version` + `normalized_at`.
- **Day 67 — Insider activity page.** Built `/company/[companyId]/insiders` with premium layout, role filter (All / Director / Officer / 10% owner / Other), a chronological Latest-activity table, and a Filing drilldown section. Added `apps/web/lib/api/insiders.ts` with a dependency-free Form 3/4/5 XML parser (`parseInsiderActivityFromXml`), `normalizeInsiderRoleFilter`, `rolesMatchFilter`, `filterInsiderActivityRows`, and `compareInsiderRowsChronologically`. `sources[]` is populated from the submissions feed even when a filing's XML fails to parse, so the drilldown never goes blank.
- **Day 68 — Premium Executive Pay Mix + Insider Activity Heatmap data layers.** Added `apps/web/lib/charts/executivePayMix.ts` (canonical Summary Compensation Table component keys in a fixed stacking order, stacked-segment layout, normalized 100% mix, grand-total aggregation, dataset validator) and `apps/web/lib/charts/insiderHeatmap.ts` (dense role × month grid with `transactionCount` / `netShares` / `grossShares`, row and column totals, `[0, 1]` intensity scale, dataset validator). Both datasets carry filing-level provenance (ticker, companyName, cik, fiscalYear/period, filingType, accession, filingDate). 43 offline tests in `apps/web/tests/charts-3.spec.ts`.
- **Day 69 — Governance + ownership summary cards.** Added `packages/ui/src/components/company/governanceCards.tsx` (three factual cards — CEO / board chair structure, Recent insider activity, Compensation highlights — citing the relevant SEC forms) and `summarizeGovernance(overview)` helper. Wired into `apps/web/app/company/[companyId]/page.tsx`. Provenance line calls out `PROXY_FORMS` and `INSIDER_FORMS` as exported constants so neither allow-list can widen silently.
- **Day 70 — Stabilization pass.** Cleanup-only. Aligned the compensation page error heading with the hero label (`Executive compensation unavailable`), tightened the compensation hero subtitle and the insiders role-filter description, and added `title={accession}` hover tooltips to the two remaining in-row "source link" anchors (compensation history, insiders latest-activity) so the accession is one hover away on every surface. Threaded `latestAccession` through `CompensationHistoryPoint` to back the history tooltip.

## Quality and verification status

- **Web tests** (`pnpm --filter web test`) green as of Day 70. Covering: `compensation-page.spec.ts`, `insiders-page.spec.ts`, `company-governance.spec.ts`, `charts-3.spec.ts`, plus the homepage and company overview spec files inherited from earlier weeks.
- **Web build** (`pnpm --filter web build`) green after Day 68 and Day 69.
- **Python services** (`pytest services/market-data/tests -q`, `pytest services/parse-proxy/tests -q`) green after Days 65 and 66.
- **Lint / typecheck** (`pnpm lint`, `pnpm typecheck`) remained green through the week; CI continues to run with `--max-warnings=0`.

## Provenance and auditability

Every Week 10 row is traceable to its SEC filing:

- Compensation rows carry `accession`, `filingDate`, and `sourceUrl`. The history row adds `latestAccession` (Day 70). Executive-table and Source-links anchors render the accession as visible link text; the history anchor surfaces it via `title`.
- Insider rows carry `accession`, `filingDate`, `form`, `primaryDocument`, `primaryDocUrl`, `filingIndexUrl`, and `issuerCik`. The latest-activity anchor surfaces the accession via `title` (Day 70); the filing drilldown anchor renders it as visible link text.
- `services/market-data` staged rows carry the full provenance tuple `(raw_insider_artifact_id, source_url, source_accession, source_fetched_at, source_checksum, parser_version, ingest_job_id, recorded_at)`.
- Chart datasets (pay mix, heatmap) carry filing-level metadata (ticker, CIK, fiscal period, filing type, accession, filing date) on the dataset envelope. Validators reject empty accessions and empty filing dates.

## Limitations and risk notes

- Compensation extraction remains heuristic HTML-table parsing. Irregular issuer layouts (multi-row name cells, interleaved non-SCT tables) can still drop rows. Day 64's stabilization fixes (person-name trimming, continuation-row name carry-over, filing-year exclusion) hold, but recall is not yet 100% on adversarial issuers.
- Insider XML parsing is regex-based and intentionally covers the Form 3/4/5 subset needed for the page. Filings that deviate from the standard `<reportingOwner>` / `<nonDerivativeTable>` / `<derivativeTable>` shape will surface under "Filing drilldown" but may not produce activity rows.
- Chart datasets for Day 68 are canonical snapshots (Apple FY 2023 pay mix, Apple CY 2024 insider heatmap). They are fixtures with real provenance metadata; the rendering path that wires a live issuer's data into these shapes has not been built.
- Governance cards describe the filing footprint, not the underlying CEO / board chair identities — those live inside the DEF 14A HTML and are surfaced on `/company/[companyId]/compensation`, not in the cards.

## Follow-ups for Week 11

- Wire the Executive Pay Mix and Insider Heatmap data-prep layers into actual rendered charts, and source their input from the live compensation and insider fetches rather than the fixture datasets.
- Extend `GovernanceCardsProps` with optional `ceoName` / `boardChair` fields and populate them when the proxy parser emits a structured governance fact record. `summarizeGovernance` is the extension point.
- Add cross-parser consistency checks between the Day 64 compensation parser output and the Day 66 normalized insider classes where an executive is both an officer and a Form 4 reporter.
- Evaluate whether the Day 70 `title` tooltips on "source link" anchors should become a visible accession column on mobile / touch devices, based on analyst feedback.
