#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/infra/docker/docker-compose.yml"

if ! command -v docker >/dev/null 2>&1; then
  echo "error: docker is required but not found in PATH" >&2
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "error: docker compose v2 is required but not available" >&2
  exit 1
fi

cd "$ROOT_DIR"

if command -v pnpm >/dev/null 2>&1; then
  echo "pnpm detected in PATH; skipping corepack enable"
else
  if ! command -v corepack >/dev/null 2>&1; then
    echo "error: neither pnpm nor corepack is available in PATH" >&2
    exit 1
  fi
  corepack enable
fi

pnpm install --no-frozen-lockfile

docker compose -f "$COMPOSE_FILE" up -d

echo "bootstrap complete"
echo "- web:           http://localhost:3000"
echo "- postgres:      localhost:5432"
echo "- clickhouse:    localhost:8123"
echo "- object store:  http://localhost:9001 (S3 API on :9001, console on :9002)"
