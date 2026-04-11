#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/infra/docker/docker-compose.yml"

if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: docker is required but not installed." >&2
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "ERROR: docker compose v2 is required but not available." >&2
  exit 1
fi

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "ERROR: compose file not found at $COMPOSE_FILE" >&2
  exit 1
fi

echo "Validating compose file..."
docker compose -f "$COMPOSE_FILE" config >/dev/null

echo "Starting local infrastructure (postgres, clickhouse, object-storage, web, ingest-sec)..."
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans

echo "Bootstrap complete."
echo "- Web:            http://localhost:3000"
echo "- Postgres:       localhost:5432"
echo "- ClickHouse HTTP:http://localhost:8123"
echo "- MinIO API:      http://localhost:9002"
echo "- MinIO Console:  http://localhost:9001"
echo
echo "Inspect status with: docker compose -f $COMPOSE_FILE ps"
