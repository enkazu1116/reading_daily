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

API を別途起動する場合は `PUBLIC_API_URL=http://localhost:48721` を設定し、API 側で `CORS_ORIGIN=http://localhost:43123` を指定してください。詳細は [web/README.md](web/README.md) を参照。
