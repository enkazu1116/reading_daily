export interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  GOOGLE_BOOKS_API_KEY: string;
  CORS_ORIGIN: string;
}

export type ReadingStatus = 'tsundoku' | 'reading' | 'finished';

export interface Reading {
  id: string;
  user_id: string;
  book_id: string | null;
  title: string | null;
  author: string | null;
  status: ReadingStatus | null;
  current_page: number;
  total_pages: number;
  memo: string;
  google_books_id: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Book {
  id: string;
  google_books_id: string;
  title: string | null;
  authors: string | null;
  description: string | null;
  thumbnail_url: string | null;
  page_count: number | null;
  created_at: string;
}

export interface StatsResponse {
  finished: number;
  reading: number;
  tsundoku: number;
  pagesThisMonth: number;
}
