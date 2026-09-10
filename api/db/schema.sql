-- Canonical D1 schema for reading-log API.
-- Source of truth for migrations: api/migrations/0001_init.sql
-- Apply locally: npm run migrate:local

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
  finished_at TEXT,
  created_at TEXT,
  updated_at TEXT
);

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

CREATE VIRTUAL TABLE IF NOT EXISTS search_fts USING fts5(
  doc_type,
  doc_id,
  user_id,
  tokens,
  tokenize = 'unicode61'
);
