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
[Infisical CLI](https://infisical.com/docs/cli/overview) の `infisical secrets get` でトークンを取得し、`scripts/tf.sh` が Terraform プロセスの `CLOUDFLARE_API_TOKEN` 環境変数として渡します。トークンをファイルへ保存したり、コマンドライン引数として渡したりはしません。

### Infisical 座標（必須・非機密）

リポジトリにはプロジェクト ID と環境名の既定値を持たせません。実行する環境に合わせて、次の環境変数を設定してください。

| 環境変数 | 内容 |
|----------|------|
| `INFISICAL_PROJECT_ID` | Infisical のプロジェクト ID |
| `INFISICAL_ENV` | Infisical の環境スラッグ（例: `dev`、`staging`、`prod`） |

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

# 2) Infisical の取得元を指定（値は自分の環境に合わせる）
export INFISICAL_PROJECT_ID="<your-infisical-project-id>"
export INFISICAL_ENV="dev"

# 3) 非機密 tfvars
cd infra
cp terraform.tfvars.example terraform.tfvars
# 編集: account_id, workers_dev_subdomain, access_allowed_emails

# 4) Terraform（API トークンは Infisical から取得して環境変数で渡す）
chmod +x scripts/tf.sh
./scripts/tf.sh init
./scripts/tf.sh plan
./scripts/tf.sh apply
```

`scripts/tf.sh` は、概ね次の処理を行います:

```sh
CLOUDFLARE_API_TOKEN="$(infisical secrets get CLOUDFLARE_API_TOKEN \
  --projectId="$INFISICAL_PROJECT_ID" \
  --env="$INFISICAL_ENV" \
  --plain)"
export CLOUDFLARE_API_TOKEN
terraform "$@"
```

プロジェクト ID または環境が未指定なら、誤った取得元を暗黙に使わず実行を中止します。別プロジェクト / 環境を一度だけ使う場合は、コマンドの前で指定できます:

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
