-- Books domain queries. Run `npm run db:generate` to regenerate src/db/gen/books/.

-- name: GetBookByGoogleBooksId :one
SELECT
  id,
  google_books_id,
  title,
  authors,
  description,
  thumbnail_url,
  page_count,
  created_at
FROM books
WHERE google_books_id = ?
LIMIT 1;

-- name: GetBookById :one
SELECT
  id,
  google_books_id,
  title,
  authors,
  description,
  thumbnail_url,
  page_count,
  created_at
FROM books
WHERE id = ?
LIMIT 1;

-- name: InsertBook :exec
INSERT INTO books (
  id,
  google_books_id,
  title,
  authors,
  description,
  thumbnail_url,
  page_count,
  created_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
