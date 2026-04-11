#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/infra/docker/docker-compose.yml"

if ! command -v docker >/dev/null 2>&1; then
  echo "Error: docker is required but not installed." >&2
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "Error: docker compose is required but not available." >&2
  exit 1
fi

echo "Validating compose file: $COMPOSE_FILE"
docker compose -f "$COMPOSE_FILE" config >/dev/null

echo "Starting local development stack..."
docker compose -f "$COMPOSE_FILE" up -d postgres clickhouse object-storage

echo "Core infrastructure is up."
echo "Run these commands to start app workloads:"
echo "  docker compose -f $COMPOSE_FILE up -d web ingest-sec"
echo "To stop everything:"
echo "  docker compose -f $COMPOSE_FILE down"
