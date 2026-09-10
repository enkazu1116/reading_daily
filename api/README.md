# reading-log API (MoonBit-first Cloudflare Worker)

MoonBit-primary Workers API for the reading_daily app. Business logic lives in `src/*.mbt`; `src/worker.ts` is thin glue that forwards requests to `globalThis.__appServerFetch` registered by `src/main.mbt` (same pattern as [cloudflare-starterkit-mbt](https://github.com/mizchi/cloudflare-starterkit-mbt)).

Deploy from this directory — **not** from `infra/worker/` (Terraform stub only).

## Stack

| Piece | Detail |
|-------|--------|
| Runtime | Cloudflare Workers (`reading-log-api`) |
| App | MoonBit + [@mars](https://github.com/mizchi/mars.mbt) routing |
| Database | D1 (`DB`) via **sqlc-gen-moonbit** |
| Cache | KV (`CACHE`) — Google Books responses |
| Search | D1 FTS5 + MoonBit tokenizer (`src/tokenizer.mbt`) |
| Auth | `Cf-Access-Authenticated-User-Email` header |

## Layout

```
api/
  src/
    main.mbt          # routes + handlers
    worker.ts         # wrangler entry → __appServerFetch
    tokenizer.mbt     # Japanese bigram + ASCII word tokenizer
    db/gen/
      readings/       # sqlc output: readings CRUD + stats
      books/          # sqlc output: books CRUD
      fts/            # sqlc output: FTS search index
  db/
    schema.sql        # canonical full schema (mirrors migrations)
    schema/           # per-domain schema inputs for sqlc
    sqlite/           # per-domain query inputs for sqlc
  migrations/         # SOURCE OF TRUTH for D1 schema (infra points here)
  sqlc.yaml           # one sqlc package per domain
  wrangler.toml       # main = src/worker.ts
```

## Bindings

| Name | Type | Notes |
|------|------|-------|
| `DB` | D1 | database name `reading-log` |
| `CACHE` | KV | Google Books cache |
| `GOOGLE_BOOKS_API_KEY` | secret | `wrangler secret put` |
| `CORS_ORIGIN` | var | default `http://localhost:43123` |

Local dev: API **48721**, frontend **43123**.

## Prerequisites

- [MoonBit](https://www.moonbitlang.com/download) (nightly recommended; tested with 0.1.20260909)
- [sqlc](https://docs.sqlc.dev/) v1.31+
- Node.js 20+

```sh
# MoonBit (if not installed)
curl -fsSL https://cli.moonbitlang.com/install/unix.sh | bash

# sqlc
go install github.com/sqlc-dev/sqlc/cmd/sqlc@latest
```

## Setup

```sh
cd api
npm install
moon update
npm run db:generate   # first time / after query changes
npm run build
npm run migrate:local
```

Create `.dev.vars`:

```env
GOOGLE_BOOKS_API_KEY=your-key
```

## npm scripts

| Script | Description |
|--------|-------------|
| `npm run build` | `moon build --target js --release` + wrangler dry-run bundle check |
| `npm run check` | `moon check` + `tsc --noEmit` |
| `npm run db:generate` | `sqlc generate` + `patch-int64-binds.ts` (Int64 → Number for D1) |
| `npm run db:verify` | Int64 bind patch `--verify` + SQL placeholder mix check (CI gate) |
| `npm run dev` | Build + `wrangler dev` on port **48721** |
| `npm run deploy` | Build + deploy Worker |
| `npm run deploy:dry-run` | Build only (includes wrangler `--dry-run`) |
| `npm run migrate:local` | Apply `migrations/0001_init.sql` to local D1 |
| `npm run migrate:remote` | Apply migrations to remote D1 |
| `npm run test` | MoonBit tests + `scripts/verify.mjs` |

## Migrations

**Source of truth:** `api/migrations/0001_init.sql` (also mirrored in `db/schema.sql` for sqlc).

`wrangler.toml` sets `migrations_dir = "migrations"` so `infra/` and wrangler stay aligned.

## Local development

```sh
npm run dev
```

Example requests (Access header simulates Cloudflare Access):

```sh
EMAIL="you@example.com"
BASE="http://localhost:48721"

curl -s "$BASE/health"

curl -s -H "Cf-Access-Authenticated-User-Email: $EMAIL" \
  "$BASE/readings"

curl -s -X POST "$BASE/readings" \
  -H "Content-Type: application/json" \
  -H "Cf-Access-Authenticated-User-Email: $EMAIL" \
  -d '{"title":"サンプル","author":"著者","status":"reading","totalPages":300}'

curl -s -H "Cf-Access-Authenticated-User-Email: $EMAIL" \
  "$BASE/books/search?q=村上春樹"

curl -s -H "Cf-Access-Authenticated-User-Email: $EMAIL" \
  "$BASE/search?q=サンプル"

curl -s -H "Cf-Access-Authenticated-User-Email: $EMAIL" \
  "$BASE/stats"
```

Missing `Cf-Access-Authenticated-User-Email` → **401**.

## Endpoints (unchanged contract)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness (no auth) |
| GET/POST | `/readings` | List / create |
| GET/PATCH/DELETE | `/readings/:id` | Read / update / delete |
| POST | `/readings/from-book` | `{ "googleBooksId": "..." }` |
| GET | `/books/search?q=` | Google Books (KV cache) |
| GET | `/search?q=` | D1 FTS |
| GET | `/stats` | `{ finished, reading, tsundoku, pagesThisMonth }` (JST month) |

### `finished_at`

- Set when `status` changes **to** `finished`
- Cleared when leaving `finished`
- Unchanged on memo/page-only updates

## Infra note

`infra/worker/worker.mjs` is a Terraform placeholder. Production deploys use this package:

```sh
cd api && npm run deploy
```

`wrangler.toml` `main` must point at `src/worker.ts` (MoonBit bundle imported from `_build/js/release/build/reading-log-api.js`).
