#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/infra/docker/docker-compose.yml"

if [[ "${OSTYPE:-}" == msys* || "${OSTYPE:-}" == cygwin* || "${OSTYPE:-}" == win32* ]]; then
  echo "[bootstrap] Windows shell detected. Run this script via Git Bash or WSL: bash infra/scripts/bootstrap.sh"
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "Error: docker is required but not installed or not on PATH." >&2
  echo "Install Docker Desktop and reopen your shell, then run: docker --version" >&2
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "Error: docker compose v2 is required but not available." >&2
  echo "Verify with: docker compose version" >&2
  exit 1
fi

echo "Validating compose file: $COMPOSE_FILE"
docker compose -f "$COMPOSE_FILE" config >/dev/null

echo "Starting local development stack (core infra only)..."
docker compose -f "$COMPOSE_FILE" up -d postgres clickhouse object-storage

echo "Core infrastructure is up."
echo "Start app workloads with:"
echo "  docker compose -f $COMPOSE_FILE up -d web ingest-sec"
echo "Stop everything with:"
echo "  docker compose -f $COMPOSE_FILE down"
