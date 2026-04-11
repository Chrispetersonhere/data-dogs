# ADR-0001: Monorepo Tooling Baseline

- **Status:** Accepted
- **Date:** 2026-04-11

## Context
We need a minimal, production-safe monorepo bootstrap that can scale across web apps, backend services, shared packages, and documentation, without introducing framework-specific bloat on Day 2.

## Decision
Adopt a pnpm workspace with Turborepo task orchestration at the repository root.

### Baseline choices
- Package manager: `pnpm`
- Workspace declaration: `pnpm-workspace.yaml`
- Task runner: `turbo`
- Root scripts: `lint`, `typecheck`, `test`, `build`, `format`
- Shared TypeScript baseline: `tsconfig.base.json`
- Shared formatting/editor rules: `.prettierrc`, `.editorconfig`
- Shared lint baseline: `.eslintrc.cjs`

## Consequences
### Positive
- Consistent developer entrypoints from root.
- Scalable task orchestration as packages and services are added.
- Minimal Day 2 footprint with no application logic changes.

### Trade-offs
- Lint/typecheck/test/build behavior is intentionally skeletal until package-level scripts/configs exist.
- Further ADRs will be needed for framework-specific lint and test standards.
