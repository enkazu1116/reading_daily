#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MOONBIT_DIR="$ROOT/moonbit"
OUT_DIR="$ROOT/src/wasm"
OUT_WASM="$OUT_DIR/tokenizer.wasm"

mkdir -p "$OUT_DIR"

if ! command -v moon >/dev/null 2>&1; then
  echo "moon CLI not found — skipping WASM build (TypeScript fallback will be used at runtime)"
  exit 0
fi

cd "$MOONBIT_DIR"
moon build --target wasm --release

BUILT=""
for candidate in \
  "target/wasm/release/build/tokenizer/tokenizer.wasm" \
  "target/wasm/release/tokenizer.wasm" \
  "target/wasm/release/build/reading_tokenizer/reading_tokenizer.wasm"; do
  if [[ -f "$candidate" ]]; then
    BUILT="$candidate"
    break
  fi
done

if [[ -z "$BUILT" ]]; then
  echo "WASM artifact not found after moon build — TypeScript fallback will be used"
  exit 0
fi

cp "$BUILT" "$OUT_WASM"
echo "Built $OUT_WASM"
