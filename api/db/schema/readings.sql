-- Readings domain schema (sqlc input).
-- Full D1 schema: migrations/0001_init.sql and db/schema.sql

CREATE TABLE IF NOT EXISTS readings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  book_id TEXT,
  title TEXT,
  author TEXT,
  status TEXT,
  current_page INTEGER DEFAULT 0,
  total_pages INTEGER DEFAULT 0,
  memo TEXT DEFAULT '',
  google_books_id TEXT,
  finished_at TEXT NULL,
  created_at TEXT,
  updated_at TEXT
);
