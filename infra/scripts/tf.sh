#!/usr/bin/env bash
# Run Terraform with secrets injected from Infisical.
# Usage: ./scripts/tf.sh [terraform args...]
#   e.g. ./scripts/tf.sh init
#        ./scripts/tf.sh plan
#        ./scripts/tf.sh apply
#
# Override Infisical coordinates:
#   INFISICAL_PROJECT_ID=... INFISICAL_ENV=staging ./scripts/tf.sh plan

set -euo pipefail

INFISICAL_PROJECT_ID="${INFISICAL_PROJECT_ID:-5d0b78bf-495f-4f22-ab0e-dbd343181518}"
INFISICAL_ENV="${INFISICAL_ENV:-dev}"

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

exec infisical run \
  --projectId="${INFISICAL_PROJECT_ID}" \
  --env="${INFISICAL_ENV}" \
  -- terraform "$@"
