# 読書記録 — Cloudflare Terraform

Cloudflare-only IaC for the reading-log stack on `enkazu1116/reading_daily`.

| Resource | Purpose |
|----------|---------|
| **Pages** | SvelteKit frontend (`web/`) |
| **Worker** | Script + bindings named `reading-log-api` (code from `api/` via Wrangler) |
| **D1** | `readings`, `books`, `search_fts` (`finished_at` included) |
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

Do **not** use the stub for production. Deploy from `api/`:

```sh
cd api
npm install
npm run build:wasm
npm run deploy
```

`worker.tf` uses `lifecycle.ignore_changes` on script content so later `terraform apply` will not overwrite Wrangler deploys. Keep managing D1 / KV / Access / binding *names* in Terraform; keep shipping Worker *code* with Wrangler.

Schema source of truth: `api/migrations/0001_init.sql` (mirrored under `infra/migrations/` for first-apply helpers).

```sh
cd api && npm run migrate:remote
# or: wrangler d1 execute reading-log --remote --file=./migrations/0001_init.sql
```

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
