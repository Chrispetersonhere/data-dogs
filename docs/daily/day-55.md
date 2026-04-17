# Day 55 - Accessibility and Browser Sanity Pass

Date: 2026-04-17

## What changed

- Added keyboard-first navigation support on the marketing page with a skip link that targets the main content landmark (`#main-content`).
- Added explicit visible `:focus-visible` states for primary and secondary CTA links and for the skip link so keyboard focus is always apparent.
- Improved contrast in key marketing/UI text surfaces by replacing lower-contrast muted/accent text usage with `text.secondary` where the text is informational and not decorative.
- Increased contrast for the provenance example label text in `apps/web/app/(marketing)/page.module.css`.
- Added `apps/web/tests/accessibility.spec.ts` to lock in focus, keyboard-flow, and contrast safeguards.

## Acceptance criteria mapping

- **Contrast issues**: addressed in marketing provenance label plus `StatCard` and `PipelineStep` text color usage.
- **Focus states**: added dedicated `:focus-visible` styles for skip link and CTA links.
- **Keyboard flow**: added a skip link and stable main-content target id.
- **Obvious Safari/Chrome issues**: reduced reliance on subtle/low-contrast text cues and ensured focus outline visibility with explicit outline styles.
- **No new features**: this is a UI accessibility hardening pass only.

## Verification

- `pnpm --filter web build`
- `pnpm --filter web test -- accessibility.spec.ts`

## Risk / rollback

- Low-to-moderate risk: styling changes affect shared UI components (`StatCard`, `PipelineStep`), but changes are token-based and backwards compatible.
- Rollback by reverting this day’s commit if any visual regression appears; no schema, API, or data-path changes are included.

## Windows PowerShell verification notes

Use this exact block in Windows PowerShell from repo root:

```powershell
git fetch origin
$branch = git branch --show-current
if (-not $branch) { throw "Could not determine current branch. Run this inside the repo." }
git checkout $branch
git pull --ff-only
pnpm --filter web build
pnpm --filter web test -- accessibility.spec.ts
# fallback if your shell forwards args differently:
# pnpm --filter web test
```

If you want to switch to a specific branch, use `git checkout branch-name` (without `<` or `>`), because angle brackets are PowerShell operators.
