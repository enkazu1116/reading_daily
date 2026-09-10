# reading_daily — web

読書記録アプリの SvelteKit フロントエンド（Cloudflare Pages）。

## ローカル開発

```bash
npm install
npm run dev
```

| サービス | ポート | 環境変数 |
|----------|--------|----------|
| web (このディレクトリ) | `43123` | `PUBLIC_API_URL`（既定: `http://localhost:48721`） |
| api (`../api`) | `48721` | `CORS_ORIGIN=http://localhost:43123` |

`.env` の例:

```env
PUBLIC_API_URL=http://localhost:48721
```

## ビルド

```bash
npm run build
```

出力: `.svelte-kit/cloudflare`

## 画面

- `/` — 検索・統計・読書記録一覧
- `/add` — 本の追加（Google Books 検索 / 手動入力）
- `/readings/:id` — 読書記録の編集・削除

## プロジェクト構成

```
src/
  app.css              # 全スタイル（単一の CSS ソース）
  lib/
    api/               # 型定義 + HTTP クライアント
    stores/            # stats・一覧・詳細などの状態
    components/        # 再利用 UI コンポーネント
    utils/             # 表示用ヘルパー
  routes/              # 薄いページ（コンポーネント合成 + データ配線）
```
