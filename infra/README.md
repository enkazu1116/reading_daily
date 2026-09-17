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

## シークレット管理（Infisical CLI）

**Cloudflare API トークンは `terraform.tfvars` に書きません。**  
[Infisical CLI](https://infisical.com/docs/cli/overview) の `infisical run` で Terraform プロセスに環境変数を注入し、Terraform / Cloudflare Provider はその値だけを参照します。

### Infisical 座標（非機密）

| 項目 | 値 |
|------|-----|
| プロジェクト ID | `5d0b78bf-495f-4f22-ab0e-dbd343181518` |
| 環境 | `dev` |

### Infisical に登録するシークレット

| シークレット名 | 用途 |
|----------------|------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare Terraform Provider および D1 マイグレーション（`apply-migrations.sh`） |

Cloudflare Provider は `CLOUDFLARE_API_TOKEN` 環境変数を自動的に読み取ります（`TF_VAR_*` への変換は不要）。

### 非機密の Terraform 変数

```sh
cd infra
cp terraform.tfvars.example terraform.tfvars
# account_id, workers_dev_subdomain, access_allowed_emails などを設定
```

| 変数 | 説明 |
|------|------|
| `account_id` | Cloudflare アカウント ID |
| `workers_dev_subdomain` | workers.dev サブドメイン |

## Quick start

```sh
# 1) Infisical CLI にログイン（初回のみ）
infisical login

# 2) 非機密 tfvars
cd infra
cp terraform.tfvars.example terraform.tfvars
# 編集: account_id, workers_dev_subdomain, access_allowed_emails

# 3) Terraform（シークレットは Infisical から注入）
chmod +x scripts/tf.sh
./scripts/tf.sh init
./scripts/tf.sh plan
./scripts/tf.sh apply
```

`scripts/tf.sh` は内部で次と同等です:

```sh
infisical run \
  --projectId=5d0b78bf-495f-4f22-ab0e-dbd343181518 \
  --env=dev \
  -- terraform "$@"
```

別プロジェクト / 環境を使う場合:

```sh
INFISICAL_PROJECT_ID="<other-project-id>" INFISICAL_ENV=staging ./scripts/tf.sh plan
```

### 構文チェックのみ（シークレット不要）

```sh
cd infra
terraform init
terraform fmt -check -recursive
terraform validate
```

初回 apply では `infra/worker/worker.mjs` のスタブがアップロードされ、スクリプトとバインディングが作成されます。

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

Optional: `apply_d1_migrations = true` in tfvars runs `../api/migrations/0001_init.sql`（`CLOUDFLARE_API_TOKEN` は `./scripts/tf.sh` 経由で Infisical から注入）。

Worker 用の Google Books API キー（本番値）:

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
