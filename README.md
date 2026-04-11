# Data Dogs

Monorepo for building a SEC-native financial data platform, with active implementation underway.

## Current State
Implemented baseline project scaffolding and initial product code:
- **Monorepo + build orchestration:** pnpm workspace + Turbo task graph.
- **Web app shell:** Next.js app in `apps/web`.
- **Shared UI package:** reusable primitives in `packages/ui`.
- **DB package skeleton:** SQL schema/migration scaffolding in `packages/db`.
- **SEC ingest service foundation:** Python SEC client with throttling/retry/timeout behavior and unit tests in `services/ingest-sec`.
- **CI baseline:** lint, typecheck, JS tests, and Python service tests.

## Run Locally
### Prerequisites
- Node.js 20+
- pnpm 10+
- Python 3.12+ (for Python service tests)

### Install dependencies
```bash
pnpm install
```

### Start the web app
```bash
pnpm --filter web dev
```

### Optional local infra
A Docker Compose setup is available under `infra/docker/docker-compose.yml` for local Postgres/Redis/MinIO and service wiring.

## Validation Commands
### Monorepo checks
```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

### Python ingest-sec tests
```bash
python -m pip install -r services/ingest-sec/requirements.txt
PYTHONPATH=services/ingest-sec python -m pytest services/ingest-sec/tests -q
```

## Documentation
- `docs/operations/local-dev.md` — local dev + infrastructure notes.
- `docs/operations/sec-client.md` — SEC client behavior and troubleshooting.
- `docs/roadmap/90-day-roadmap.md` — phased plan.
