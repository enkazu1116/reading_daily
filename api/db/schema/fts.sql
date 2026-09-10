-- FTS search domain schema (sqlc input).
-- Full D1 schema: migrations/0001_init.sql and db/schema.sql

CREATE VIRTUAL TABLE IF NOT EXISTS search_fts USING fts5(
  doc_type,
  doc_id,
  user_id,
  tokens,
  tokenize = 'unicode61'
);
