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

## シークレット管理（Infisical）

**Cloudflare API トークンなどの機密情報は `terraform.tfvars` に書きません。**  
Terraform は [Infisical Terraform Provider](https://registry.terraform.io/providers/Infisical/infisical/latest/docs) 経由で、plan/apply 時に Infisical から読み込みます（ephemeral リソース — state に保存されません）。

### 1. Infisical にシークレットを登録

本リポジトリの既定座標:

| 項目 | 値 |
|------|-----|
| プロジェクト / workspace ID | `5d0b78bf-495f-4f22-ab0e-dbd343181518` |
| 環境 | `dev` |

上記プロジェクトの `dev` 環境に、少なくとも次を登録します。

| シークレット名 | 内容 |
|----------------|------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API トークン（Workers / Pages / D1 / KV / Zero Trust 権限） |

フォルダはデフォルト `/` です。別フォルダを使う場合は `infisical_secrets_folder` を `terraform.tfvars` で指定します。

### 2. Machine Identity で認証（推奨）

[Universal Auth](https://infisical.com/docs/documentation/platform/identities/universal-auth) のクライアント ID / シークレットを、**シェル環境変数**で渡します（リポジトリや tfvars にコミットしない）。

```sh
export INFISICAL_AUTH_METHOD="universal"
export INFISICAL_UNIVERSAL_AUTH_CLIENT_ID="<machine-identity-client-id>"
export INFISICAL_UNIVERSAL_AUTH_CLIENT_SECRET="<machine-identity-client-secret>"
```

セルフホストの場合:

```sh
export INFISICAL_HOST="https://your-infisical.example.com"
```

### 3. 非機密の Terraform 変数

```sh
cd infra
cp terraform.tfvars.example terraform.tfvars
# account_id, workers_dev_subdomain, access_allowed_emails などを設定
# ※ API トークンは Infisical 側のみ（tfvars には書かない）
# ※ infisical_workspace_id / infisical_env_slug は example と variable default に既定値あり
```

| 変数 | 説明 |
|------|------|
| `infisical_workspace_id` | Infisical プロジェクト ID（既定: `5d0b78bf-495f-4f22-ab0e-dbd343181518`） |
| `infisical_env_slug` | 環境スラッグ（既定: `dev`） |
| `account_id` | Cloudflare アカウント ID |
| `workers_dev_subdomain` | workers.dev サブドメイン |

### 4. Terraform の実行

```sh
cd infra
terraform init
terraform fmt -check -recursive
terraform validate
terraform plan
terraform apply
```

**前提:** Terraform **1.10 以上**（ephemeral リソース用）。

### 代替: Infisical CLI で環境変数を注入

Provider を使わず CLI で `TF_VAR_*` を渡す運用も可能です（本リポジトリの既定は Provider 方式）。

```sh
# Infisical CLI にログイン済みであること
infisical run --env=dev --projectId="5d0b78bf-495f-4f22-ab0e-dbd343181518" -- \
  terraform -chdir=infra plan
```

CLI 側で `CLOUDFLARE_API_TOKEN` を export し、Terraform 変数にマッピングする場合は、別途 `TF_VAR_` またはラッパースクリプトが必要です。通常は上記 Provider 方式を使ってください。

## Quick start（まとめ）

```sh
# 1) Infisical 認証
export INFISICAL_AUTH_METHOD="universal"
export INFISICAL_UNIVERSAL_AUTH_CLIENT_ID="..."
export INFISICAL_UNIVERSAL_AUTH_CLIENT_SECRET="..."

# 2) 非機密 tfvars
cd infra
cp terraform.tfvars.example terraform.tfvars
# 編集: account_id, workers_dev_subdomain, access_allowed_emails
# （Infisical 座標は既定: project 5d0b78bf-495f-4f22-ab0e-dbd343181518 / env dev）

# 3) apply
terraform init
terraform plan
terraform apply
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

Optional: `apply_d1_migrations = true` in tfvars runs `../api/migrations/0001_init.sql`（`CLOUDFLARE_API_TOKEN` は Infisical から渡されます）。

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
