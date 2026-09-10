# reading_daily

読書記録アプリ（Cloudflare monorepo）

| Directory | Purpose |
|-----------|---------|
| `web/` | SvelteKit frontend (Pages) |
| `api/` | Workers API — **deploy from here** (MoonBit-first + thin `worker.ts`; see `api/README.md`) |
| `infra/` | Terraform (D1, KV, Access, Pages). Worker stub at `infra/worker/` is replaced by `api/` on deploy |

Local ports: frontend **43123**, API **48721**. See `api/README.md` for setup, migrations, and curl examples.

