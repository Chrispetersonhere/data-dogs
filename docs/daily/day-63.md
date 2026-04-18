# Day 63 — Compensation extraction stabilization

Date: 2026-04-18

## Scope
- Stabilize existing compensation extraction in `services/parse-proxy`.
- Fix parser fragility without adding features.
- Improve source linking fidelity for extracted facts.
- Document current extraction limitations.
- Keep changes constrained to Day 57–62 touched files plus day/week docs.

## Changes made
- Updated `parse_sct.py` to preserve original source line numbers even when table text includes blank lines.
- Updated `parse_sct.py` pipe-splitting behavior to preserve empty cells instead of dropping them, preventing column shift in sparse pipe-delimited rows.
- Updated `parse_grants.py` with the same line-number preservation and pipe-empty-cell handling.
- Updated `parse_governance.py` to:
  - preserve original source line numbers with blank lines;
  - include `source_accession` inside each `GovernanceLineRef` so every extracted governance fact carries both URL and accession-level linkage.
- Added regression tests covering blank-line line-number stability and pipe-delimited sparse-row robustness.

## Documented limitations (unchanged by design)
- Table extraction remains heuristic and text-block based; it does not parse HTML table structure.
- Multi-line wrapped cells are not stitched into single logical cells.
- Column detection is alias-based and may miss uncommon issuer-specific labels.
- Name extraction in governance facts is pattern-based and may under/over-match edge-case naming styles.
- Parser versions remain `v1` because this is a stabilization pass on existing interfaces rather than a new feature surface.

## Acceptance checks
- ✅ `pytest services/parse-proxy/tests -q`
- ⚠️ `pnpm --filter web build` (environment network/proxy prevented Corepack from downloading pnpm archive)

## Rollback rule check
- No scope expansion beyond stabilization was introduced; no new modules/features were added.
