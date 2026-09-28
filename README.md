# reading_daily

読書記録アプリ（Cloudflare monorepo）

## 構成

| ディレクトリ | 説明 |
|-------------|------|
| `web/` | SvelteKit フロントエンド（Cloudflare Pages） |
| `api/` | Workers API（TypeScript + Moonbit WASM） |
| `infra/` | Terraform |

各ディレクトリは独立して開発・デプロイできます。`web/` は現時点で実装済みです。

## ローカル開発

### web

```bash
cd web
npm install
npm run dev   # http://localhost:43123
```

API を別途起動する場合は `PUBLIC_API_URL=http://localhost:48721` を設定し、API 側で `CORS_ORIGIN=http://localhost:43123` を指定してください（`api/.dev.vars.example` を `.dev.vars` にコピー）。詳細は [web/README.md](web/README.md) を参照。

## 手動デプロイ

Workers Builds（Git 連携の自動ビルド）は使わない。D1 / KV / `CORS_ORIGIN` などのバインディングは `api/wrangler.toml` で管理する。Terraform は D1・KV・Worker シェルなどの箱を作るだけで、バインディングは `ignore_changes` により書き換えない。

### API

```bash
cd api
npm run deploy
npm run migrate:remote
```

デプロイ後、`GET /health` で生存確認する（認証不要）。

### Web

`PUBLIC_API_URL` は Vite のビルド時変数なので、ビルド時に API の URL を渡す。値は Terraform の output `public_api_url`（カスタムホストが無ければ `https://reading-log-api.<workers-dev-subdomain>.workers.dev`）。

```bash
cd web
PUBLIC_API_URL='https://reading-log-api.<workers-dev-subdomain>.workers.dev' npm run build
npx wrangler pages deploy .svelte-kit/cloudflare --project-name reading-log
```

Pages プロジェクト名は `infra/` の `var.project_name`（既定 `reading-log`）。`web/wrangler.jsonc` の `name` は `web` のままなので、デプロイ時は `--project-name reading-log` を付ける。
