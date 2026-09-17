#!/usr/bin/env bash
# Run Terraform with the Cloudflare API token fetched from Infisical.
# Usage: ./scripts/tf.sh [terraform args...]
#   e.g. ./scripts/tf.sh init
#        ./scripts/tf.sh plan
#        ./scripts/tf.sh apply
#
# Required Infisical coordinates:
#   INFISICAL_PROJECT_ID=... INFISICAL_ENV=... ./scripts/tf.sh plan

set -euo pipefail

: "${INFISICAL_PROJECT_ID:?INFISICAL_PROJECT_ID is required}"
: "${INFISICAL_ENV:?INFISICAL_ENV is required}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

if ! command -v infisical >/dev/null 2>&1; then
  echo "error: infisical CLI is required. See infra/README.md" >&2
  exit 1
fi

if ! command -v terraform >/dev/null 2>&1; then
  echo "error: terraform is required." >&2
  exit 1
fi

cd "$INFRA_DIR"

CLOUDFLARE_API_TOKEN="$(
  infisical secrets get CLOUDFLARE_API_TOKEN \
    --projectId="${INFISICAL_PROJECT_ID}" \
    --env="${INFISICAL_ENV}" \
    --plain
)"

if [[ -z "$CLOUDFLARE_API_TOKEN" ]]; then
  echo "error: CLOUDFLARE_API_TOKEN is empty in Infisical." >&2
  exit 1
fi

export CLOUDFLARE_API_TOKEN
exec terraform "$@"
