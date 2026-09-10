-- Books domain schema (sqlc input).
-- Full D1 schema: migrations/0001_init.sql and db/schema.sql

CREATE TABLE IF NOT EXISTS books (
  id TEXT PRIMARY KEY,
  google_books_id TEXT UNIQUE,
  title TEXT,
  authors TEXT,
  description TEXT,
  thumbnail_url TEXT,
  page_count INTEGER,
  created_at TEXT
);
