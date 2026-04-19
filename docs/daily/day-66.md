# Day 66 — Normalize insider transactions

Date: 2026-04-19

## Scope
- Add `services/market-data/src/normalize_insiders.py` that classifies staged `InsiderTransactionRow`s from Day 65 into five required classes: `buy`, `sell`, `grant`, `derivative_event`, `holdings_change`.
- Surface ambiguity explicitly. Codes whose direction is inherently undetermined (V, I, J), unknown codes, and any code/direction combination not covered by the rule table resolve to an explicit `ambiguous` class with a human-readable `normalized_reason`.
- Preserve full source provenance on every normalized row (raw artifact id, source url, accession, fetched_at, checksum, parser version, ingest job id, recorded_at) and stamp a distinct `normalizer_version` + `normalized_at` on top.
- Add `services/market-data/tests/test_normalize_insiders.py` covering all five required classes, every ambiguous pathway, the direction-mismatch guard, provenance carry-over, and batch order preservation.
- No page work, no API/auth work, no schema change. The in-memory Day-65 ingest contract is consumed as-is.

## Changes made

### `services/market-data/src/normalize_insiders.py`
New module. Public surface:
- `NORMALIZER_VERSION = "market-data.normalize_insiders.v1"` — stamped on every produced row, independent of upstream `parser_version`, so reclassification is auditable even when raw + staged rows are unchanged.
- `NORMALIZED_CLASSES` — frozenset of the six allowed values (`buy`, `sell`, `grant`, `derivative_event`, `holdings_change`, `ambiguous`). `ambiguous` is the explicit sixth value; callers must not drop it.
- `classify_transaction_code(transaction_code, acquired_or_disposed) -> (class, reason)` — pure function driving the mapping. `reason` is `None` for clean hits and a short explanation for every ambiguous path.
- `normalize_transaction(row: InsiderTransactionRow) -> NormalizedInsiderTransaction` — applies the classifier to a single staged row, copies every provenance field verbatim, and stamps `normalizer_version` + `normalized_at`.
- `normalize_transactions(rows)` — order-preserving vectorized helper.
- `NormalizedInsiderTransaction` — frozen dataclass with the same shape as `InsiderTransactionRow` plus `normalized_class`, `normalized_ambiguous`, `normalized_reason`, `normalizer_version`, `normalized_at`.

### SEC Form 4 code → normalized class mapping

Mapping is keyed on `(transaction_code, acquired_or_disposed)`. Any key not listed resolves to `ambiguous` with a reason.

| Code | Meaning (SEC Form 4)                                                       | A      | D      |
|------|-----------------------------------------------------------------------------|--------|--------|
| P    | Open-market / private purchase                                              | buy    | —      |
| S    | Open-market / private sale                                                  | —      | sell   |
| A    | Grant, award, or other acquisition under Rule 16b-3(d)                      | grant  | —      |
| D    | Disposition to the issuer under Rule 16b-3(e)                               | —      | sell   |
| F    | Payment of exercise price / tax liability with securities                   | holdings_change | holdings_change |
| M    | Exercise or conversion of derivative exempt under Rule 16b-3                | derivative_event | derivative_event |
| C    | Conversion of derivative security                                           | derivative_event | derivative_event |
| E    | Expiration of short derivative position                                     | derivative_event | derivative_event |
| H    | Expiration/cancellation of long derivative position with value received     | derivative_event | derivative_event |
| O    | Exercise of out-of-the-money derivative                                     | derivative_event | derivative_event |
| X    | Exercise of in-the-money / at-the-money derivative                          | derivative_event | derivative_event |
| K    | Transaction in equity swap or similar instrument                            | derivative_event | derivative_event |
| G    | Bona fide gift                                                              | holdings_change | holdings_change |
| L    | Small acquisition under Rule 16a-6                                          | buy    | —      |
| W    | Acquisition or disposition by will or laws of descent                       | holdings_change | holdings_change |
| Z    | Deposit into or withdrawal from voting trust                                | holdings_change | holdings_change |
| U    | Disposition pursuant to a tender of shares in a change of control           | —      | sell   |
| V    | Transaction voluntarily reported earlier than required                      | ambiguous | ambiguous |
| I    | Discretionary transaction under Rule 16b-3(f)                               | ambiguous | ambiguous |
| J    | Other acquisition or disposition                                            | ambiguous | ambiguous |

Direction mismatches are **not** silently reclassified. Example: a `P` with direction `D` stays `ambiguous` with a reason naming both the code and the direction; it is not flipped into `sell`. The same holds for `S` + `A`, `A` + `D`, etc. This is the concrete mechanism for the rollback rule.

### `services/market-data/tests/test_normalize_insiders.py`
New test module. With `@pytest.mark.parametrize`, the suite expands to 43 assertions covering:
- Clean classification for each of the 5 required classes (P/S/A/D/U/L plus the full derivative and holdings-change families).
- `V`, `I`, `J` always ambiguous regardless of direction.
- Unknown codes (e.g. `Q`) ambiguous with `unknown transaction_code: Q`.
- Direction-mismatch guard (`P`+`D`, `S`+`A`) ambiguous with a direction-specific reason.
- Invalid inputs (empty code, non-A/D direction) raise `ValueError`.
- End-to-end normalization from `ingest_insider_dataset` → `normalize_transaction`: provenance fields copy verbatim, `normalizer_version` and `normalized_at` are stamped, and numeric precision (`shares`, `price_per_share`, `shares_owned_after`) is not altered.
- Ambiguous rows still preserve the underlying source row unchanged for audit.
- Batch normalization preserves order and covers all 5 required classes plus one ambiguous in a single filing; each normalized row still links back to its own raw artifact + accession.
- `normalizer_version` is stable across rows.

## Rollback rule check
Rollback rule: revert if normalization invents precision that source data does not support.
- No numeric fields are re-scaled, rounded, or derived; `shares`, `price_per_share`, and `shares_owned_after` are copied verbatim from the staged row (asserted in `test_normalize_does_not_mutate_numeric_precision`).
- Every code/direction combination that the SEC spec leaves undetermined (V, I, J) or that does not appear in the rule table resolves to `ambiguous` with an explicit reason — never to a guessed class. Asserted in `test_inherently_ambiguous_codes_stay_ambiguous`, `test_unknown_code_is_ambiguous_with_reason`, and `test_direction_mismatch_is_ambiguous_not_silently_flipped`.
- A direction that contradicts the code (e.g. `P` with direction `D`, `S` with direction `A`) is flagged ambiguous with both the code and the direction in the reason, rather than silently flipped.
- `normalized_ambiguous` is a boolean alongside `normalized_class` so downstream consumers cannot drop the flag by accident.
- Provenance columns on every normalized row match the staged row 1:1; `normalizer_version` is a separate field from `parser_version` so a reclassification cannot be mistaken for a re-parse.

## Acceptance checks
- ✅ `PYTHONPATH=services/market-data python -m pytest services/market-data/tests/test_normalize_insiders.py -q` → 43 passed.

## Additional verification (requested palette)
- ⚠️ `pnpm lint` — `turbo` is not installed in this sandbox (no `pnpm install`). No JS/TS files changed today, so lint scope is unaffected.
- ⚠️ `pnpm typecheck` — same as above; no TS files changed.
- ⚠️ `pnpm --filter web test` — no web files changed.
- ⚠️ `pnpm --filter web build` — no web files changed.
- ✅ `PYTHONPATH=services/ingest-sec python -m pytest services/ingest-sec/tests -q` → 14 passed.
- ✅ `PYTHONPATH=services/parse-xbrl python -m pytest services/parse-xbrl/tests -q` → 29 passed.
- ✅ `PYTHONPATH=services/parse-proxy python -m pytest services/parse-proxy/tests -q` → 16 passed.
- ✅ `PYTHONPATH=services/id-master python -m pytest services/id-master/tests -q` → 18 passed.
- ✅ `PYTHONPATH=services/market-data python -m pytest services/market-data/tests -q` → 52 passed (9 from Day 65 + 43 new).

## Risks / follow-ups
- Normalization is still in-memory. A follow-up day should (a) add a `normalized_insider_transaction` table to `packages/db/schema/012_insiders.sql` (or a new `013_…` file) with `normalized_class`, `normalized_ambiguous`, `normalized_reason`, `normalizer_version`, `normalized_at`, and a foreign key back to `insider_transaction`; and (b) persist `NormalizedInsiderTransaction` rows via the real store.
- Holdings rows (`InsiderHoldingRow`) are not classified today; they remain snapshot-only. If a future consumer needs flow-vs-snapshot semantics, add a sibling normalizer for holdings deltas.
- Edge code `V` (voluntarily reported earlier than required) is correctly treated as ambiguous because `V` in isolation does not carry the underlying economic event. If the parser upstream can pair `V` with its true underlying code, the mapping can be refined — but only then, not by guessing here.
- The mapping table here is the authoritative source. If SEC guidance changes (new code, redefined direction), bump `NORMALIZER_VERSION` rather than silently adjusting so old rows remain traceable to the exact rule set that produced them.
