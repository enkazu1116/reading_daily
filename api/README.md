# reading-log API (Cloudflare Workers)

TypeScript + Hono API for the reading-log app. Deploy from this directory — **not** from `infra/worker/` (Terraform stub only).

## Stack

| Piece | Detail |
|-------|--------|
| Runtime | Cloudflare Workers (`reading-log-api`) |
| Framework | [Hono](https://hono.dev/) |
| Database | D1 (`DB`) — schema in `migrations/` |
| Cache | KV (`CACHE`) — Google Books responses |
| Search | D1 FTS5 (`search_fts`) + Moonbit WASM tokenizer |
| Auth | `Cf-Access-Authenticated-User-Email` header (Cloudflare Access) |

## Bindings (must match `infra/worker.tf`)

| Name | Type | Notes |
|------|------|-------|
| `DB` | D1 | database name `reading-log` |
| `CACHE` | KV | Google Books cache |
| `GOOGLE_BOOKS_API_KEY` | secret | set via `wrangler secret put` |
| `CORS_ORIGIN` | var | default local: `http://localhost:43123` |

Local dev: API **48721**, frontend **43123**.

## Replace Terraform stub

`infra/worker/worker.mjs` is a placeholder created by Terraform so bindings exist on first apply. **Production deploys must use this package:**

```sh
cd api
npm install
npm run build:wasm   # optional; TS fallback uses the same tokenizer algorithm
npm run deploy
```

After deploy, point Terraform at the real bundle (or manage the Worker only via Wrangler) — see `infra/README.md`.

## Setup

```sh
cd api
npm install
npm run build:wasm
npm run migrate:local
```

Create `.dev.vars` for local secrets:

```env
GOOGLE_BOOKS_API_KEY=your-key
```

## npm scripts

| Script | Description |
|--------|-------------|
| `npm run build:wasm` | Compile Moonbit tokenizer → `src/wasm/tokenizer.wasm` (skips if `moon` CLI missing) |
| `npm run build` | Alias for `build:wasm` (also runs before `wrangler dev` / deploy) |
| `npm run dev` | `wrangler dev` on port **48721** |
| `npm run deploy` | Deploy Worker to Cloudflare |
| `npm run migrate:local` | Apply `migrations/0001_init.sql` to local D1 |
| `npm run migrate:remote` | Apply migrations to remote D1 |
| `npm run typecheck` | TypeScript check |
| `npm run cf-typegen` | Generate Worker types from wrangler.toml |

## Moonbit tokenizer

Exports (WASM): `normalize`, `tokenize`, `prepare_query`.

- Japanese/CJK: character bigrams (`n=2`)
- ASCII: whitespace split + lowercase

If WASM or js-string builtins are unavailable in workerd, the TypeScript implementation in `src/tokenizer/fallback.ts` applies the same rules.

Requires [MoonBit](https://www.moonbitlang.com/download) for WASM builds:

```sh
cd api && npm run build:wasm
```

## Migrations

Source of truth: `api/migrations/0001_init.sql` (tables: `readings`, `books`, `search_fts`).

```sh
npm run migrate:local    # wrangler dev
npm run migrate:remote   # production D1
```

## Local development

```sh
npm run dev
```

Example requests (Access header simulates Cloudflare Access):

```sh
EMAIL="you@example.com"

curl -s http://localhost:48721/health

curl -s -H "Cf-Access-Authenticated-User-Email: $EMAIL" \
  http://localhost:48721/readings

curl -s -X POST http://localhost:48721/readings \
  -H "Content-Type: application/json" \
  -H "Cf-Access-Authenticated-User-Email: $EMAIL" \
  -d '{"title":"サンプル","author":"著者","status":"reading","totalPages":300}'

curl -s -H "Cf-Access-Authenticated-User-Email: $EMAIL" \
  "http://localhost:48721/books/search?q=村上春樹"

curl -s -H "Cf-Access-Authenticated-User-Email: $EMAIL" \
  "http://localhost:48721/search?q=サンプル"

curl -s -H "Cf-Access-Authenticated-User-Email: $EMAIL" \
  http://localhost:48721/stats
```

Missing `Cf-Access-Authenticated-User-Email` → **401**.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness (no auth) |
| GET/POST | `/readings` | List / create readings |
| GET/PATCH/DELETE | `/readings/:id` | Read / update / delete |
| POST | `/readings/from-book` | Create reading from `{ "googleBooksId": "..." }` |
| GET | `/books/search?q=` | Google Books search (KV cache) |
| GET | `/search?q=` | D1 FTS search |
| GET | `/stats` | `{ finished, reading, tsundoku, pagesThisMonth }` (JST month for pages) |

### `finished_at`

Set **only** when `status` changes **to** `finished`. Never cleared or updated on other status changes.

### Stats

`pagesThisMonth` sums `total_pages` for finished readings whose `finished_at` falls in the current **Asia/Tokyo** calendar month.
