// Cloudflare Worker entrypoint.
// wrangler bundles this file + MoonBit JS output into dist/worker.js.

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
