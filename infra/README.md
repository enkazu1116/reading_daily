# 読書記録 — Cloudflare Terraform

Cloudflare-only IaC for the reading-log stack on `enkazu1116/reading_daily`.

| Resource | Purpose |
|----------|---------|
| **Pages** | SvelteKit frontend (`web/`) |
| **Worker** | Script + bindings named `reading-log-api` (MoonBit-first code from `api/` via Wrangler) |
| **D1** | Database only — schema in `api/migrations/` |
| **KV** | Google Books / session cache |
| **Access** | Email allowlist on Pages + API hosts |
| **Bindings** | `DB` / `CACHE` / `GOOGLE_BOOKS_API_KEY` / `CORS_ORIGIN` |

## Quick start

```sh
cd infra
cp terraform.tfvars.example terraform.tfvars
# set account_id, token, workers_dev_subdomain, access_allowed_emails

terraform init
terraform plan
terraform apply
```

First apply may upload the stub at `infra/worker/worker.mjs` so the script and bindings exist.

## Deploy real API (required for production)

MoonBit-first Worker ([PR #4](https://github.com/enkazu1116/reading_daily/pull/4) / starterkit pattern):

- Wrangler `main` = `api/src/worker.ts` (thin TS → MoonBit `__appServerFetch`)
- Business logic in `api/src/main.mbt` (mars)

```sh
cd api
npm install
moon update   # MoonBit toolchain
npm run deploy   # moon build + wrangler deploy
```

`worker.tf` uses `lifecycle.ignore_changes` on script content so later `terraform apply` will not overwrite Wrangler deploys. Resources and binding **names** stay in Terraform; Worker **code** ships from `api/`.

## Migrations (single source of truth)

**Only** `api/migrations/` — do not keep a copy under `infra/`.

```sh
cd api && npm run migrate:remote
```

Optional: `apply_d1_migrations = true` in tfvars runs `../api/migrations/0001_init.sql`.

Secret:

```sh
wrangler secret put GOOGLE_BOOKS_API_KEY --name reading-log-api
```

## Worker bindings

| Binding | Type |
|---------|------|
| `DB` | D1 |
| `CACHE` | KV |
| `GOOGLE_BOOKS_API_KEY` | secret |
| `CORS_ORIGIN` | plain_text (`cors_origin` var; default Pages URL) |

Must match `api/wrangler.toml`.
