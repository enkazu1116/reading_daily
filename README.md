# reading_daily

読書記録アプリ（Cloudflare monorepo）

## 構成

| Directory | Purpose |
|-----------|---------|
| `web/` | SvelteKit frontend (Cloudflare Pages) — see [web/README.md](web/README.md) |
| `api/` | Workers API — **deploy from here** (MoonBit-first + thin `worker.ts`; see [api/README.md](api/README.md)) |
| `infra/` | Terraform (D1, KV, Access, Pages). Worker stub at `infra/worker/` is replaced by `api/` on deploy |

## Local development

| Service | Port | Notes |
|---------|------|-------|
| web | `43123` | `PUBLIC_API_URL=http://localhost:48721` |
| api | `48721` | `CORS_ORIGIN=http://localhost:43123` |

### web

```bash
cd web
npm install
npm run dev
```

Frontend: single `src/app.css`, `lib/api` · `lib/stores` · `lib/components` · `lib/utils`, thin `routes/`. Details in [web/README.md](web/README.md).

### api

MoonBit-first stack, D1 migrations, sqlc, and curl examples: [api/README.md](api/README.md).
