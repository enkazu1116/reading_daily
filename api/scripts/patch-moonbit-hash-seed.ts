#!/usr/bin/env node
// MoonBit の JS 出力を Cloudflare Workers で動かすための後処理。
// `moon build --target js --release` の直後に実行する。冪等。
//
// 1) Hasher 乱数シード
//    moonbitlang/core の `builtin/hasher.mbt` はモジュール初期化時に
//    `crypto.getRandomValues` を呼ぶ。Workers には関数があるので
//    `if (crypto?.getRandomValues)` は真になるが、グローバルスコープでの
//    乱数生成は禁止（"Disallowed operation called within global scope"）。
//    握られない例外で isolate が起動せず、`wrangler dev` が即死する。
//    Hasher シードはハッシュ洪水対策用で暗号用途ではないので、
//    投げられたら既存の Math.random フォールバックへ落とす。
//    リクエスト処理中の `crypto.randomUUID()` は触らない。
//
// 2) mars の reschedule
//    シードを直すと isolate は起動するが、最初のリクエストで
//    `moonbitlang$async$internal$event_loop$$reschedule is not defined`
//    になる。mizchi/mars の FFI が古い JS バックエンドのグローバル名を
//    直書きしていて、今の moonc は `_M0FP...event__loop10reschedule` に
//    マングルするため。呼び出しをその実体へ付け替える。
//
// 使い方:
//   --apply   (既定) 生成 JS をその場で書き換える。
//   --verify  未パッチなら非ゼロ終了。

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const mode = process.argv.includes("--verify") ? "verify" : "apply";
const targetFlagIndex = process.argv.indexOf("--target");
const targetFromFlag =
  targetFlagIndex >= 0 ? process.argv[targetFlagIndex + 1] : undefined;

const root = resolve(import.meta.dirname, "..");
const defaultTarget = resolve(root, "_build/js/release/build/reading-log-api.js");
const target = resolve(targetFromFlag ?? defaultTarget);

const SEED_MARKER = "reading-log: workers-safe-hash-seed";
const RESCHEDULE_MARKER = "reading-log: workers-mars-reschedule";
const MARS_RESCHEDULE_GLOBAL =
  "moonbitlang$async$internal$event_loop$$reschedule();";

// moonbitlang/core builtin/hasher.mbt の JS FFI を verbatim で探す。
const UNPATCHED_SEED = `  if (globalThis.crypto?.getRandomValues) {
    const array = new Uint32Array(1);
    globalThis.crypto.getRandomValues(array);
    return array[0] | 0; // Convert to signed 32
  } else {
    return Math.floor(Math.random() * 0x100000000) | 0; // Fallback to Math.random
  }`;

const PATCHED_SEED = `  /* ${SEED_MARKER}
   * Workers はモジュール初期化時の crypto.getRandomValues を禁止する。
   * 関数自体は存在するので素の if チェックでは防げない。投げられたら
   * Hasher シード用途として Math.random に落とす（暗号用途ではない）。
   */
  try {
    if (globalThis.crypto?.getRandomValues) {
      const array = new Uint32Array(1);
      globalThis.crypto.getRandomValues(array);
      return array[0] | 0; // Convert to signed 32
    }
  } catch (_workersInitRngError) {
    // グローバルスコープ制限。Hasher シードなので暗号強度は不要。
  }
  return Math.floor(Math.random() * 0x100000000) | 0; // Fallback to Math.random`;

function fail(message: string): never {
  console.error(`patch-moonbit-hash-seed: ${message}`);
  process.exit(1);
  throw new Error(message);
}

function findEventLoopReschedule(source: string): string {
  const match = source.match(
    /function\s+(_M0\w*event__loop10reschedule)\s*\(/,
  );
  if (!match?.[1]) {
    fail(
      `${target} から moonbitlang/async の event_loop.reschedule 実体 ` +
        "(`function _M0…event__loop10reschedule`) を見つけられませんでした。" +
        "moonc のマングル規則が変わった可能性があります。",
    );
  }
  return match[1];
}

function applySeed(source: string): { source: string; changed: boolean } {
  if (source.includes(SEED_MARKER) && !source.includes(UNPATCHED_SEED)) {
    return { source, changed: false };
  }
  if (!source.includes(UNPATCHED_SEED)) {
    fail(
      `${target} から Hasher シードの FFI 断片を見つけられませんでした。` +
        "moonbitlang/core の random_seed 実装が変わった可能性があります。" +
        "生成 JS の getRandomValues を確認して、このスクリプトの検索文字列を更新してください。",
    );
  }
  const next = source.replace(UNPATCHED_SEED, PATCHED_SEED);
  if (next.includes(UNPATCHED_SEED)) {
    fail(`${target} に未パッチの Hasher シードが残っています（複数箇所の可能性）`);
  }
  return { source: next, changed: true };
}

function applyReschedule(source: string): { source: string; changed: boolean } {
  if (source.includes(RESCHEDULE_MARKER) && !source.includes(MARS_RESCHEDULE_GLOBAL)) {
    return { source, changed: false };
  }
  if (!source.includes(MARS_RESCHEDULE_GLOBAL)) {
    fail(
      `${target} に mizchi/mars の ffi_reschedule ` +
        "(`moonbitlang$async$internal$event_loop$$reschedule`) がありません。" +
        "mars が直ったか、生成形が変わっています。",
    );
  }
  const compiled = findEventLoopReschedule(source);
  const replacement = `/* ${RESCHEDULE_MARKER}
    * mars は古い JS グローバル名を直書きする。今の moonc は ${compiled} に
    * マングルするので、そちらを呼ぶ。リクエスト処理中なので setTimeout も許可される。
    */
   ${compiled}();`;
  const next = source.replace(MARS_RESCHEDULE_GLOBAL, replacement);
  if (next.includes(MARS_RESCHEDULE_GLOBAL)) {
    fail(`${target} の mars reschedule 呼び出しが残っています`);
  }
  return { source: next, changed: true };
}

if (!existsSync(target)) {
  fail(
    `対象ファイルがありません: ${target}（先に moon build --target js --release を実行してください）`,
  );
}

let source = readFileSync(target, "utf8");

if (mode === "verify") {
  if (source.includes(UNPATCHED_SEED)) {
    fail(
      `${target} に未パッチの Hasher シードが残っています。` +
        "`moon build` の直後にこのスクリプトを --apply で実行してください。",
    );
  }
  if (!source.includes(SEED_MARKER)) {
    fail(
      `${target} に Workers 向けシードパッチの印 (${SEED_MARKER}) がありません。`,
    );
  }
  if (source.includes(MARS_RESCHEDULE_GLOBAL)) {
    fail(
      `${target} に未パッチの mars ffi_reschedule グローバル呼び出しが残っています。`,
    );
  }
  if (!source.includes(RESCHEDULE_MARKER)) {
    fail(
      `${target} に mars reschedule パッチの印 (${RESCHEDULE_MARKER}) がありません。`,
    );
  }
  console.log(`patch-moonbit-hash-seed: verify ok (${target})`);
  process.exit(0);
}

const seed = applySeed(source);
source = seed.source;
const reschedule = applyReschedule(source);
source = reschedule.source;

if (!seed.changed && !reschedule.changed) {
  console.log(`patch-moonbit-hash-seed: already applied (${target})`);
  process.exit(0);
}

writeFileSync(target, source);
const bits = [
  seed.changed ? "hash-seed" : null,
  reschedule.changed ? "mars-reschedule" : null,
].filter(Boolean);
console.log(`patch-moonbit-hash-seed: patched ${bits.join(", ")} (${target})`);
