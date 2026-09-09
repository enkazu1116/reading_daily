# 読書記録 — Cloudflare Terraform

Cloudflare-only IaC for the reading-log stack on `enkazu1116/reading_daily`:

| Resource | Purpose |
|----------|---------|
| **Pages** | SvelteKit frontend (`web/`) |
| **Worker** | API stub (`infra/worker/`) — replace with `api/` when ready |
| **D1** | `readings`, `books`, FTS (`search_fts`), includes `finished_at` |
| **KV** | Google Books / session cache |
| **Access** | Email allowlist on Pages + API hosts; `Cf-Access-Authenticated-User-Email` |
| **Secret / env** | `GOOGLE_BOOKS_API_KEY` (secret) + `CORS_ORIGIN` (plain_text) |

## Quick start

```sh
cd infra
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars — set account_id, token, workers_dev_subdomain, emails

terraform init
terraform plan
terraform apply
```

## Worker bindings (must match `api/wrangler.toml`)

| Binding | Type |
|---------|------|
| `DB` | D1 |
| `CACHE` | KV |
| `GOOGLE_BOOKS_API_KEY` | secret |
| `CORS_ORIGIN` | plain_text (`cors_origin` var; default Pages URL) |

## After apply

1. D1 migrations: `wrangler d1 execute reading-log --remote --file=./migrations/0001_init.sql`
2. Real Books key: `wrangler secret put GOOGLE_BOOKS_API_KEY --name reading-log-api`
3. Connect the GitHub repo to Pages (build root `web`, command `npm run build`, output `.svelte-kit/cloudflare`)

See also `terraform output` for `public_api_url` / `pages_url`.
