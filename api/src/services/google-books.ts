import type { Book } from '../types';
import { bookSearchText, upsertFts } from '../fts';
import { nowIso } from '../time';
import type { Tokenizer } from '../tokenizer';

const CACHE_TTL_SECONDS = 3600;

export interface GoogleBookVolume {
  id: string;
  volumeInfo: {
    title?: string;
    authors?: string[];
    description?: string;
    imageLinks?: { thumbnail?: string; smallThumbnail?: string };
    pageCount?: number;
  };
}

export interface GoogleBooksSearchResult {
  id: string;
  googleBooksId: string;
  title: string | null;
  authors: string | null;
  description: string | null;
  thumbnailUrl: string | null;
  pageCount: number | null;
}

function mapVolume(item: GoogleBookVolume): GoogleBooksSearchResult {
  const info = item.volumeInfo ?? {};
  return {
    id: item.id,
    googleBooksId: item.id,
    title: info.title ?? null,
    authors: info.authors?.join(', ') ?? null,
    description: info.description ?? null,
    thumbnailUrl: info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail ?? null,
    pageCount: info.pageCount ?? null,
  };
}

export async function searchGoogleBooks(
  cache: KVNamespace,
  apiKey: string,
  query: string,
): Promise<GoogleBooksSearchResult[]> {
  const cacheKey = `books:search:${query.toLowerCase()}`;
  const cached = await cache.get(cacheKey, 'json');
  if (cached) {
    return cached as GoogleBooksSearchResult[];
  }

  const url = new URL('https://www.googleapis.com/books/v1/volumes');
  url.searchParams.set('q', query);
  url.searchParams.set('key', apiKey);
  url.searchParams.set('maxResults', '20');

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Google Books API error: ${response.status}`);
  }

  const payload = (await response.json()) as { items?: GoogleBookVolume[] };
  const results = (payload.items ?? []).map(mapVolume);

  await cache.put(cacheKey, JSON.stringify(results), {
    expirationTtl: CACHE_TTL_SECONDS,
  });

  return results;
}

export async function fetchGoogleBookById(
  cache: KVNamespace,
  apiKey: string,
  googleBooksId: string,
): Promise<GoogleBooksSearchResult | null> {
  const cacheKey = `books:volume:${googleBooksId}`;
  const cached = await cache.get(cacheKey, 'json');
  if (cached) {
    return cached as GoogleBooksSearchResult;
  }

  const url = new URL(`https://www.googleapis.com/books/v1/volumes/${encodeURIComponent(googleBooksId)}`);
  url.searchParams.set('key', apiKey);

  const response = await fetch(url.toString());
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Google Books API error: ${response.status}`);
  }

  const item = (await response.json()) as GoogleBookVolume;
  const result = mapVolume(item);
  await cache.put(cacheKey, JSON.stringify(result), { expirationTtl: CACHE_TTL_SECONDS });
  return result;
}

export async function findOrCreateBook(
  db: D1Database,
  tokenizer: Tokenizer,
  volume: GoogleBooksSearchResult,
): Promise<Book> {
  const existing = await db
    .prepare('SELECT * FROM books WHERE google_books_id = ?')
    .bind(volume.googleBooksId)
    .first<Book>();

  if (existing) return existing;

  const id = crypto.randomUUID();
  const createdAt = nowIso();

  await db
    .prepare(
      `INSERT INTO books (id, google_books_id, title, authors, description, thumbnail_url, page_count, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      volume.googleBooksId,
      volume.title,
      volume.authors,
      volume.description,
      volume.thumbnailUrl,
      volume.pageCount,
      createdAt,
    )
    .run();

  await upsertFts(
    db,
    tokenizer,
    'book',
    id,
    '',
    bookSearchText({
      title: volume.title,
      authors: volume.authors,
      description: volume.description,
    }),
  );

  const book = await db.prepare('SELECT * FROM books WHERE id = ?').bind(id).first<Book>();
  return book!;
}
