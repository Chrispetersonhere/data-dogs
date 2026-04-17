# Monitoring Baseline (Day 53)

This folder contains lightweight observability defaults for local/prod parity checks.

## Health checks

- Web health path: `/healthz`
- Ingestion worker health: process-level readiness (container up + logs flowing)

## Log contract

Structured logs must include:

- `timestamp`
- `event`
- `level`
- `request_id`
- optional `job_id`

## Rollback guard

If logs become noisy or unreadable, revert Day 53 observability commits.
