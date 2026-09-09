#!/usr/bin/env bash
set -euo pipefail

: "${CLOUDFLARE_ACCOUNT_ID:?CLOUDFLARE_ACCOUNT_ID is required}"
: "${CLOUDFLARE_API_TOKEN:?CLOUDFLARE_API_TOKEN is required}"
: "${D1_DATABASE_NAME:?D1_DATABASE_NAME is required}"
: "${MIGRATION_FILE:?MIGRATION_FILE is required}"

if ! command -v wrangler >/dev/null 2>&1; then
  echo "wrangler CLI is required when apply_d1_migrations=true" >&2
  exit 1
fi

wrangler d1 execute "$D1_DATABASE_NAME" --remote --file="$MIGRATION_FILE"
