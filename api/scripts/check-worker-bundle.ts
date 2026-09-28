// Post-build sanity check for the bundled Worker.
//
// `moon build --target js --release` + `wrangler deploy --dry-run` can
// produce a bundle with subtle corruption: stray \x1f control bytes
// from the wasm host that emits the MoonBit JS (sqlc-gen-moonbit #17),
// a far-too-small file (moon produced an empty stub because of a
// transitive failure), or a missing marker that the worker entry
// relies on. None of these surface as a crash at deploy time — they
// surface as a hung worker on first request, which is hard to debug
// after the fact.
//
// This script enforces a minimum set of invariants. Extend
// REQUIRED_MARKERS when you add code paths that must appear in the
// bundle (e.g. a scheduled cron handler).

import { readFile, stat } from "node:fs/promises";

const target = process.argv[2];
if (!target) {
  console.error("usage: check-worker-bundle.ts <path-to-bundle.js>");
  process.exit(2);
}

let info;
try {
  info = await stat(target);
} catch (error) {
  console.error(`worker bundle check: cannot stat ${target}: ${error.message}`);
  process.exit(1);
}
if (!info.isFile()) {
  console.error(`worker bundle check: ${target} is not a file`);
  process.exit(1);
}
if (info.size < 1024) {
  console.error(
    `worker bundle check: ${target} is only ${info.size} bytes — moon build likely produced an empty / stub file`,
  );
  process.exit(1);
}

const content = await readFile(target, "utf8");

// Reject stray \x1f (Unit Separator). The MoonBit toolchain has been
// observed to leak this into emitted JS during wasm-host translation.
const usPositions = [];
for (let i = 0; i < content.length; i += 1) {
  if (content.charCodeAt(i) === 0x1f) {
    usPositions.push(i);
    if (usPositions.length >= 5) break;
  }
}
if (usPositions.length > 0) {
  console.error(
    `worker bundle check: ${usPositions.length}+ occurrence(s) of \\x1f in ${target} ` +
      `(first at offset ${usPositions[0]}). The bundle is corrupted — rebuild from a clean _build/.`,
  );
  process.exit(1);
}

// Each entry must appear somewhere in the bundle. Add one per code
// path you cannot afford to silently disappear (e.g. when adding a
// scheduled cron handler). Example pattern:
//   const REQUIRED_MARKERS = [
//     { needle: "globalThis.__appCronTick", reason: "scheduled cron forwarder" },
//   ];
const REQUIRED_MARKERS: Array<{ needle: string; reason: string }> = [
  {
    // esbuild はコメントを落とすので、パッチ後に残る try で囲んだシード初期化を見る。
    needle: "if (globalThis.crypto?.getRandomValues)",
    reason: "MoonBit Hasher シード（Workers 向け try/catch パッチ後も残る）",
  },
];

// MoonBit Hasher シード: 未パッチだと isolate 起動時に
// crypto.getRandomValues がグローバルスコープで投げられ、wrangler dev が死ぬ。
const PATCHED_HASH_SEED_TRY = `try {
    if (globalThis.crypto?.getRandomValues) {
      const array = new Uint32Array(1);
      globalThis.crypto.getRandomValues(array);`;
if (!content.includes(PATCHED_HASH_SEED_TRY)) {
  console.error(
    `worker bundle check: ${target} is missing the try/catch around MoonBit Hasher seed ` +
      "(module-init crypto.getRandomValues). Isolate startup will fail on Workers. " +
      "Run scripts/patch-moonbit-hash-seed.ts after moon build.",
  );
  process.exit(1);
}

// mizchi/mars が直書きする古いグローバル名。残っていると最初のリクエストで 500 になる。
if (content.includes("moonbitlang$async$internal$event_loop$$reschedule();")) {
  console.error(
    `worker bundle check: ${target} still calls the stale mars reschedule global. ` +
      "Run scripts/patch-moonbit-hash-seed.ts after moon build.",
  );
  process.exit(1);
}
if (!content.includes("event__loop10reschedule")) {
  console.error(
    `worker bundle check: ${target} is missing compiled event_loop.reschedule. ` +
      "MoonBit JS output shape may have changed.",
  );
  process.exit(1);
}

// moonbitlang/core の素の FFI。パッチ前のままバンドルされると isolate 起動で落ちる。
const FORBIDDEN_UNPATCHED_HASH_SEED = `  if (globalThis.crypto?.getRandomValues) {
    const array = new Uint32Array(1);
    globalThis.crypto.getRandomValues(array);
    return array[0] | 0; // Convert to signed 32
  } else {
    return Math.floor(Math.random() * 0x100000000) | 0; // Fallback to Math.random
  }`;
if (content.includes(FORBIDDEN_UNPATCHED_HASH_SEED)) {
  console.error(
    `worker bundle check: ${target} still contains the unpatched MoonBit Hasher seed ` +
      "(module-init crypto.getRandomValues). Run scripts/patch-moonbit-hash-seed.ts after moon build.",
  );
  process.exit(1);
}
for (const marker of REQUIRED_MARKERS) {
  if (!content.includes(marker.needle)) {
    console.error(
      `worker bundle check: missing marker "${marker.needle}" (${marker.reason}) in ${target}. ` +
        `Either the upstream moon output changed shape or src/worker.ts dropped its import. ` +
        `Investigate before re-running the build.`,
    );
    process.exit(1);
  }
}

console.log(`worker bundle check: ok (${target})`);
