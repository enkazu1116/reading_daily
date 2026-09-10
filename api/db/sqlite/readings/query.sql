-- Readings domain queries. Run `npm run db:generate` to regenerate src/db/gen/readings/.
-- Use anonymous `?` placeholders only (no sqlc.arg mix).

-- name: ListReadingsByUser :many
SELECT
  id,
  user_id,
  book_id,
  title,
  author,
  status,
  current_page,
  total_pages,
  memo,
  google_books_id,
  finished_at,
  created_at,
  updated_at
FROM readings
WHERE user_id = ?
ORDER BY updated_at DESC;

-- name: GetReadingById :one
SELECT
  id,
  user_id,
  book_id,
  title,
  author,
  status,
  current_page,
  total_pages,
  memo,
  google_books_id,
  finished_at,
  created_at,
  updated_at
FROM readings
WHERE id = ? AND user_id = ?
LIMIT 1;

-- name: InsertReading :exec
INSERT INTO readings (
  id,
  user_id,
  book_id,
  title,
  author,
  status,
  current_page,
  total_pages,
  memo,
  google_books_id,
  finished_at,
  created_at,
  updated_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);

-- name: UpdateReading :exec
UPDATE readings
SET
  book_id = ?,
  title = ?,
  author = ?,
  status = ?,
  current_page = ?,
  total_pages = ?,
  memo = ?,
  google_books_id = ?,
  finished_at = ?,
  updated_at = ?
WHERE id = ? AND user_id = ?;

-- name: DeleteReading :exec
DELETE FROM readings WHERE id = ? AND user_id = ?;

-- name: GetStatsCounts :one
SELECT
  SUM(CASE WHEN status = 'finished' THEN 1 ELSE 0 END) AS finished,
  SUM(CASE WHEN status = 'reading' THEN 1 ELSE 0 END) AS reading,
  SUM(CASE WHEN status = 'tsundoku' THEN 1 ELSE 0 END) AS tsundoku
FROM readings
WHERE user_id = ?;

-- name: GetStatsPagesThisMonth :one
SELECT COALESCE(SUM(total_pages), 0) AS pages_this_month
FROM readings
WHERE user_id = sqlc.arg(user_id)
  AND status = 'finished'
  AND finished_at IS NOT NULL
  AND finished_at >= sqlc.arg(month_start)
  AND finished_at < sqlc.arg(month_end);
