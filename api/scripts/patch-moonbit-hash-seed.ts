#!/usr/bin/env node
// MoonBit JS 出力の Hasher 乱数シードを、Cloudflare Workers でも起動できるように直す。
//
// 背景:
//   moonbitlang/core の `builtin/hasher.mbt` は JS バックエンドで
//   モジュール初期化時に `crypto.getRandomValues` を呼んで Hasher の
//   プロセスワイドシードを決める。関数は存在するので `if (crypto?.getRandomValues)`
//   は真になるが、Workers はグローバルスコープでの乱数生成を禁止している
//   （"Disallowed operation called within global scope"）。
//   例外を握らずに投げるため、`wrangler dev` / isolate 起動そのものが失敗する。
//
// 方針:
//   MoonBit が FFI をほぼそのまま埋め込むので、その断片を try/catch で包み、
//   初期化時に投げられたら既存の Math.random フォールバックへ落とす。
//   Hasher シードはハッシュ洪水対策用であり、UUID などの暗号用途ではない。
//   リクエスト処理中の `crypto.randomUUID()` などには触れない。
//
// 使い方:
//   --apply   (既定) 生成 JS をその場で書き換える。`moon build` の直後に実行する。
//   --verify  未パッチのままなら非ゼロ終了。バンドル検査のゲート用。
//
// このスクリプトは冪等。パッチ済みなら何もしない。

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const mode = process.argv.includes("--verify") ? "verify" : "apply";
const explicitTarget = process.argv.find((arg, i, all) => {
  if (arg === "--target") return Boolean(all[i + 1]);
  return false;
});
const targetFromFlag = explicitTarget
  ? process.argv[process.argv.indexOf("--target") + 1]
  : undefined;

const root = resolve(import.meta.dirname, "..");
const defaultTarget = resolve(root, "_build/js/release/build/reading-log-api.js");
const target = resolve(targetFromFlag ?? defaultTarget);

const PATCH_MARKER = "reading-log: workers-safe-hash-seed";

// moonbitlang/core builtin/hasher.mbt の JS FFI を verbatim で探す。
// コンパイラがこの断片を改変したら、黙って通さず失敗させる。
const UNPATCHED_SEED = `  if (globalThis.crypto?.getRandomValues) {
    const array = new Uint32Array(1);
    globalThis.crypto.getRandomValues(array);
    return array[0] | 0; // Convert to signed 32
  } else {
    return Math.floor(Math.random() * 0x100000000) | 0; // Fallback to Math.random
  }`;

const PATCHED_SEED = `  /* ${PATCH_MARKER}
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
}

if (!existsSync(target)) {
  fail(`対象ファイルがありません: ${target}（先に moon build --target js --release を実行してください）`);
}

const source = readFileSync(target, "utf8");
const alreadyPatched = source.includes(PATCH_MARKER);
const hasUnpatched = source.includes(UNPATCHED_SEED);
const getRandomValuesCount = source.split("getRandomValues").length - 1;

if (mode === "verify") {
  if (hasUnpatched) {
    fail(
      `${target} に未パッチの Hasher シードが残っています。` +
        "`moon build` の直後にこのスクリプトを --apply で実行してください。",
    );
  }
  if (!alreadyPatched) {
    fail(
      `${target} に Workers 向けシードパッチの印 (${PATCH_MARKER}) がありません。` +
        "MoonBit の生成形が変わったか、パッチがスキップされています。",
    );
  }
  console.log(
    `patch-moonbit-hash-seed: verify ok (${target}, getRandomValues mentions=${getRandomValuesCount})`,
  );
  process.exit(0);
}

if (alreadyPatched && !hasUnpatched) {
  console.log(`patch-moonbit-hash-seed: already applied (${target})`);
  process.exit(0);
}

if (!hasUnpatched) {
  fail(
    `${target} から Hasher シードの FFI 断片を見つけられませんでした。` +
      "moonbitlang/core の random_seed 実装が変わった可能性があります。" +
      "生成 JS の getRandomValues を確認して、このスクリプトの検索文字列を更新してください。",
  );
}

const patched = source.replace(UNPATCHED_SEED, PATCHED_SEED);
if (patched === source) {
  fail(`${target} の書き換えに失敗しました（検索は当たったが置換結果が同じ）`);
}
if (patched.split(UNPATCHED_SEED).length - 1 !== 0) {
  fail(`${target} に未パッチの Hasher シードが残っています（複数箇所の可能性）`);
}

writeFileSync(target, patched);
console.log(`patch-moonbit-hash-seed: patched ${target}`);
