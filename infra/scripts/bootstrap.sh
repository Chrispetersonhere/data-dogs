#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/infra/docker/docker-compose.yml"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "error: required command '$1' not found" >&2
    exit 1
  fi
}

require_cmd docker
require_cmd pnpm

if ! docker compose version >/dev/null 2>&1; then
  echo "error: docker compose plugin is required" >&2
  exit 1
fi

echo "[bootstrap] installing workspace dependencies"
(cd "$ROOT_DIR" && pnpm install)

echo "[bootstrap] validating docker compose config"
docker compose -f "$COMPOSE_FILE" config >/dev/null

echo "[bootstrap] starting local infrastructure"
docker compose -f "$COMPOSE_FILE" up -d postgres clickhouse object-storage ingest-sec

echo "[bootstrap] local infrastructure is up"
echo "[bootstrap] start the web app with: docker compose -f $COMPOSE_FILE up web"
