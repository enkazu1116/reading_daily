// Cloudflare Worker の入口。
// wrangler がこのファイルと MoonBit の JS 出力を dist/worker.js にまとめる。
//
// MoonBit の Hasher はモジュール読み込み時に乱数シードを取る。
// 素の生成コードはここで crypto.getRandomValues を呼ぶが、Workers は
// グローバルスコープでの乱数生成を禁止している。
// `scripts/patch-moonbit-hash-seed.ts` が moon build 直後にその呼び出しを
// try/catch + Math.random フォールバックへ書き換える。この import はその
// パッチ済みファイルを前提にしている。

import "../_build/js/release/build/reading-log-api.js";

declare global {
  // eslint-disable-next-line no-var
  var __appServerFetch:
    | ((
        request: Request,
        env: Record<string, unknown>,
        ctx: ExecutionContext,
      ) => Promise<Response> | Response)
    | undefined;
}

export default {
  fetch(
    request: Request,
    env: Record<string, unknown>,
    ctx: ExecutionContext,
  ): Promise<Response> | Response {
    if (typeof globalThis.__appServerFetch !== "function") {
      return new Response("app fetch handler not registered", {
        status: 500,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }
    return globalThis.__appServerFetch(request, env, ctx);
  },
};
