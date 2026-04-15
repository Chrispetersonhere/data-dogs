# Day 35

## Scope
- Inspected mapping/restatement/statement/ratio fundamentals delivered in Days 29–34.
- Reduced duplication by consolidating numeric parsing logic shared by annual and quarterly statement builders.
- Tightened documentation to clarify stabilization-only intent and no feature expansion.
- Added Week 5 review document summarizing shipped fundamentals and risk posture.

## Files touched
- `services/parse-xbrl/src/statement_builder_annual.py`
- `services/parse-xbrl/src/statement_builder_quarterly.py`
- `docs/daily/day-35.md`
- `docs/weekly/week-5-review.md`

## Refactor notes (no new features)
- Reused `as_number` parser across both statement builders.
- Kept output shapes and formula behaviors unchanged.

## Acceptance
```bash
pytest services/parse-xbrl/tests -q
pnpm --filter web build
```
