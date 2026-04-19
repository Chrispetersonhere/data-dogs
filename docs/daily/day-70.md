# Day 70 — Stabilize compensation and insider modules

Date: 2026-04-19

## Scope

- Stabilize the Day 64–69 compensation and insider surfaces. Cleanup-only pass.
- Fix UI inconsistencies between the compensation and insider pages (error heading, hero subtitle).
- Tighten labels that were imprecise about the underlying SEC form section.
- Improve source traceability on every "source link" anchor that did not already show an accession.
- Add `docs/weekly/week-10-review.md` and `docs/daily/day-70.md`.
- No new modules, no new features, no widened scope.

## Files touched

- `apps/web/app/company/[companyId]/compensation/page.tsx` — hero subtitle copy, error heading, history row source-link tooltip.
- `apps/web/app/company/[companyId]/insiders/page.tsx` — role-filter description copy, latest-activity row source-link tooltip.
- `apps/web/lib/api/compensation.ts` — thread `latestAccession` through `CompensationHistoryPoint`.
- `docs/weekly/week-10-review.md` — new.
- `docs/daily/day-70.md` — this file.

## Changes made

### `apps/web/app/company/[companyId]/compensation/page.tsx`

- Hero subtitle tightened. Was: `Real DEF 14A filing disclosures for CIK {cik}`. Now: `DEF 14A proxy disclosures for CIK {cik}. Every row links back to the SEC source filing.` The word "Real" was a holdover from the Day 64 delivery note and is not a property of the data; the replacement is a complete sentence that matches the parallel hero copy on `/company/[companyId]/insiders`.
- Error heading aligned with the hero label. Was `Compensation page unavailable`; now `Executive compensation unavailable`. The insiders page already used `Insider activity unavailable`, so the two pages now share the same `<{module} unavailable>` error shape.
- History row "source link" anchor gained a `title={row.latestAccession}` hover tooltip. The anchor still renders the text `source link` (required by `apps/web/tests/compensation-page.spec.ts`), but hovering now surfaces the accession without a layout change. The executive table anchor already renders the accession as its visible link text and did not need a tooltip.

### `apps/web/app/company/[companyId]/insiders/page.tsx`

- Role-filter description tightened. Was: `as declared on the cover page of each Form 4`. Now: `as declared in the reportingOwnerRelationship section of each Form 3, 4, or 5`. The page already filters Form 3/4/5 submissions and the role flags come out of `<reportingOwnerRelationship>`, not the cover page, so the prior copy was misleading and scoped too narrowly to Form 4.
- Latest-activity row "source link" anchor gained a `title={row.accession}` hover tooltip. Provenance parity with the compensation history row.

### `apps/web/lib/api/compensation.ts`

- Extended `CompensationHistoryPoint` with `latestAccession: string` and populated it in `buildHistory` from the same `CompensationRow.accession` we already carry through the executive table. Needed because the history table's `source link` anchor had no visible accession; surfacing the accession via a `title` attribute required the accession to exist on the view-model, not just the URL. `latestSourceUrl` is preserved, unchanged.

## Source traceability audit (diff summary)

| Surface                           | Before                          | After                                                |
| --------------------------------- | ------------------------------- | ---------------------------------------------------- |
| Compensation executive-table row  | accession as visible link text  | unchanged                                            |
| Compensation total-comp history   | "source link" (no accession)    | "source link" + `title={latestAccession}`            |
| Compensation source-links section | accession as visible link text  | unchanged                                            |
| Insider latest-activity row       | "source link" (no accession)    | "source link" + `title={accession}`                  |
| Insider filing drilldown          | accession as visible link text  | unchanged                                            |

No row loses any provenance field it previously displayed. Every `<a>` that previously rendered only generic text now also carries the accession as a tooltip, so the accession is one hover away on every surface.

## Explicit non-goals

- No Python service changes. `services/market-data/src/insider_ingest.py` and `services/market-data/src/normalize_insiders.py` were reviewed for traceability hygiene; both already carry `raw_insider_artifact_id`, `source_url`, `source_accession`, `source_fetched_at`, `source_checksum`, `parser_version`, `ingest_job_id`, `recorded_at`. No change needed.
- No new modules, no new chart types, no new API endpoints, no new DB tables, no new `packages/ui` exports.
- No changes to `packages/ui/src/components/company/governanceCards.tsx`. The `Forms 3, 4 and 5` copy and the `Summary Compensation Table` provenance line are already asserted by tests and already sit at the tightness level Day 70 targets.
- No changes to `apps/web/lib/charts/executivePayMix.ts` or `apps/web/lib/charts/insiderHeatmap.ts`. Both modules already carry full filing-level provenance (ticker, companyName, cik, fiscalYear/period, filingType, accession, filingDate) on the dataset envelope.

## Rollback rule check

Rollback rule: **revert any scope expansion beyond cleanup**.

- **Only labels and tooltips.** Page section structure, column sets, role filter options, fetch behavior, and parser logic are untouched.
- **No schema change to visible data.** `CompensationHistoryPoint` gains one derived field (`latestAccession`) copied from the already-present `CompensationRow.accession`; no new fetch, no new validation, no new shape on the wire.
- **No test surface change.** Every required-text fragment in `apps/web/tests/compensation-page.spec.ts` and `apps/web/tests/insiders-page.spec.ts` is still present on the checked-in page source, verbatim.
- **Provenance preserved.** Every filing referenced in the UI still points at the same SEC primary document URL as before; the tooltip is additive.

If the copy tightening is perceived as a regression (for instance, because the hero subtitle reads differently than Day 64 shipped), the revert is a one-liner per page and the `latestAccession` field can stay — it is not load-bearing on its own.

## Files created / updated

- **Updated** `apps/web/app/company/[companyId]/compensation/page.tsx`
- **Updated** `apps/web/app/company/[companyId]/insiders/page.tsx`
- **Updated** `apps/web/lib/api/compensation.ts`
- **Created** `docs/weekly/week-10-review.md`
- **Created** `docs/daily/day-70.md`

## Acceptance checks (PowerShell — copy-pasteable block)

Run from the repo root.

```powershell
pnpm install
pnpm lint
pnpm typecheck
pnpm --filter web build
$env:PYTHONPATH="services/parse-proxy"; python -m pytest services/parse-proxy/tests -q
$env:PYTHONPATH="services/market-data"; python -m pytest services/market-data/tests -q
```

The Day 70 brief explicitly names `pnpm lint`, `pnpm typecheck`, `pnpm --filter web build`, `pytest services/parse-proxy/tests -q`, and `pytest services/market-data/tests -q` as acceptance tests; the block above is those five plus `pnpm install` so a cold checkout goes green end-to-end.

Optional full web test pass (not required by the brief):

```powershell
pnpm --filter web test
```

## Risks / follow-ups

- The `title` tooltip is a hover affordance and does not appear on touch devices. The accession is already reachable via the "Filing drilldown" and "Source links" sections on both pages, so there is no provenance regression on mobile; a future day can add a visible accession column to the two in-row tables if the tooltip turns out to be insufficient on analyst workflows.
- `CompensationHistoryPoint.latestAccession` is newly added. No downstream consumer depends on it yet; if `apps/docs` or a future screener view starts consuming `getCompanyCompensation`, it should prefer `latestAccession` over re-parsing accession out of the URL.
- The role-filter description now mentions `reportingOwnerRelationship` by name. That is the actual XML tag in Form 3/4/5, but it is XML terminology in a UI surface; if it reads as too technical in user testing, the next cleanup day can rephrase to "as declared in the reporting owner relationship section of each Form 3, 4, or 5" (English prose, same meaning).
