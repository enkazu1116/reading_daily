-- FTS domain queries. Run `npm run db:generate` to regenerate src/db/gen/fts/.

-- name: DeleteFts :exec
DELETE FROM search_fts WHERE doc_type = ? AND doc_id = ?;

-- name: InsertFts :exec
INSERT INTO search_fts (doc_type, doc_id, user_id, tokens)
VALUES (?, ?, ?, ?);

-- name: SearchFts :many
SELECT doc_type, doc_id, user_id
FROM search_fts
WHERE tokens MATCH ?
  AND (user_id = ? OR (doc_type = 'book' AND user_id = ''))
ORDER BY rank;
