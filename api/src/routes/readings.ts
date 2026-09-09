import { Hono } from 'hono';
import type { Env, Reading, ReadingStatus } from '../types';
import { getUserId } from '../auth';
import { deleteFts, readingSearchText, upsertFts } from '../fts';
import { fetchGoogleBookById, findOrCreateBook } from '../services/google-books';
import { getTokenizer } from '../tokenizer';
import { nowIso } from '../time';

const VALID_STATUSES: ReadingStatus[] = ['tsundoku', 'reading', 'finished'];

function isValidStatus(value: unknown): value is ReadingStatus {
  return typeof value === 'string' && VALID_STATUSES.includes(value as ReadingStatus);
}

function serializeReading(row: Reading) {
  return {
    id: row.id,
    userId: row.user_id,
    bookId: row.book_id,
    title: row.title,
    author: row.author,
    status: row.status,
    currentPage: row.current_page,
    totalPages: row.total_pages,
    memo: row.memo,
    googleBooksId: row.google_books_id,
    finishedAt: row.finished_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function indexReading(db: D1Database, reading: Reading): Promise<void> {
  const tokenizer = await getTokenizer();
  await upsertFts(
    db,
    tokenizer,
    'reading',
    reading.id,
    reading.user_id,
    readingSearchText({
      title: reading.title,
      author: reading.author,
      memo: reading.memo,
    }),
  );
}

export const readingsRoutes = new Hono<{ Bindings: Env; Variables: { userId: string } }>();

readingsRoutes.get('/', async (c) => {
  const userId = getUserId(c)!;
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM readings WHERE user_id = ? ORDER BY updated_at DESC',
  )
    .bind(userId)
    .all<Reading>();

  return c.json({ readings: (results ?? []).map(serializeReading) });
});

readingsRoutes.post('/', async (c) => {
  const userId = getUserId(c)!;
  const body = await c.req.json<Record<string, unknown>>();

  const status = body.status;
  if (status !== undefined && !isValidStatus(status)) {
    return c.json({ error: 'Invalid status' }, 400);
  }

  const id = crypto.randomUUID();
  const timestamp = nowIso();
  const resolvedStatus = (status as ReadingStatus | undefined) ?? 'tsundoku';
  const finishedAt = resolvedStatus === 'finished' ? timestamp : null;

  const reading: Reading = {
    id,
    user_id: userId,
    book_id: typeof body.bookId === 'string' ? body.bookId : null,
    title: typeof body.title === 'string' ? body.title : null,
    author: typeof body.author === 'string' ? body.author : null,
    status: resolvedStatus,
    current_page: typeof body.currentPage === 'number' ? body.currentPage : 0,
    total_pages: typeof body.totalPages === 'number' ? body.totalPages : 0,
    memo: typeof body.memo === 'string' ? body.memo : '',
    google_books_id: typeof body.googleBooksId === 'string' ? body.googleBooksId : null,
    finished_at: finishedAt,
    created_at: timestamp,
    updated_at: timestamp,
  };

  await c.env.DB.prepare(
    `INSERT INTO readings (
      id, user_id, book_id, title, author, status, current_page, total_pages,
      memo, google_books_id, finished_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      reading.id,
      reading.user_id,
      reading.book_id,
      reading.title,
      reading.author,
      reading.status,
      reading.current_page,
      reading.total_pages,
      reading.memo,
      reading.google_books_id,
      reading.finished_at,
      reading.created_at,
      reading.updated_at,
    )
    .run();

  await indexReading(c.env.DB, reading);
  return c.json({ reading: serializeReading(reading) }, 201);
});

readingsRoutes.post('/from-book', async (c) => {
  const userId = getUserId(c)!;
  const body = await c.req.json<{ googleBooksId?: string }>();
  if (!body.googleBooksId) {
    return c.json({ error: 'googleBooksId is required' }, 400);
  }

  const volume = await fetchGoogleBookById(c.env.CACHE, c.env.GOOGLE_BOOKS_API_KEY, body.googleBooksId);
  if (!volume) return c.json({ error: 'Book not found' }, 404);

  const tokenizer = await getTokenizer();
  const book = await findOrCreateBook(c.env.DB, tokenizer, volume);

  const id = crypto.randomUUID();
  const timestamp = nowIso();
  const reading: Reading = {
    id,
    user_id: userId,
    book_id: book.id,
    title: book.title,
    author: book.authors,
    status: 'tsundoku',
    current_page: 0,
    total_pages: book.page_count ?? 0,
    memo: '',
    google_books_id: book.google_books_id,
    finished_at: null,
    created_at: timestamp,
    updated_at: timestamp,
  };

  await c.env.DB.prepare(
    `INSERT INTO readings (
      id, user_id, book_id, title, author, status, current_page, total_pages,
      memo, google_books_id, finished_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      reading.id,
      reading.user_id,
      reading.book_id,
      reading.title,
      reading.author,
      reading.status,
      reading.current_page,
      reading.total_pages,
      reading.memo,
      reading.google_books_id,
      reading.finished_at,
      reading.created_at,
      reading.updated_at,
    )
    .run();

  await indexReading(c.env.DB, reading);
  return c.json({ reading: serializeReading(reading), book }, 201);
});

readingsRoutes.get('/:id', async (c) => {
  const userId = getUserId(c)!;
  const reading = await c.env.DB.prepare('SELECT * FROM readings WHERE id = ? AND user_id = ?')
    .bind(c.req.param('id'), userId)
    .first<Reading>();

  if (!reading) return c.json({ error: 'Not found' }, 404);
  return c.json({ reading: serializeReading(reading) });
});

readingsRoutes.patch('/:id', async (c) => {
  const userId = getUserId(c)!;
  const id = c.req.param('id');
  const existing = await c.env.DB.prepare('SELECT * FROM readings WHERE id = ? AND user_id = ?')
    .bind(id, userId)
    .first<Reading>();

  if (!existing) return c.json({ error: 'Not found' }, 404);

  const body = await c.req.json<Record<string, unknown>>();
  if (body.status !== undefined && !isValidStatus(body.status)) {
    return c.json({ error: 'Invalid status' }, 400);
  }

  const nextStatus = (body.status as ReadingStatus | undefined) ?? existing.status;
  let finishedAt = existing.finished_at;
  if (body.status !== undefined && nextStatus === 'finished' && existing.status !== 'finished') {
    finishedAt = nowIso();
  }

  const updated: Reading = {
    ...existing,
    book_id: typeof body.bookId === 'string' ? body.bookId : existing.book_id,
    title: typeof body.title === 'string' ? body.title : existing.title,
    author: typeof body.author === 'string' ? body.author : existing.author,
    status: nextStatus,
    current_page: typeof body.currentPage === 'number' ? body.currentPage : existing.current_page,
    total_pages: typeof body.totalPages === 'number' ? body.totalPages : existing.total_pages,
    memo: typeof body.memo === 'string' ? body.memo : existing.memo,
    google_books_id:
      typeof body.googleBooksId === 'string' ? body.googleBooksId : existing.google_books_id,
    finished_at: finishedAt,
    updated_at: nowIso(),
  };

  await c.env.DB.prepare(
    `UPDATE readings SET
      book_id = ?, title = ?, author = ?, status = ?, current_page = ?, total_pages = ?,
      memo = ?, google_books_id = ?, finished_at = ?, updated_at = ?
     WHERE id = ? AND user_id = ?`,
  )
    .bind(
      updated.book_id,
      updated.title,
      updated.author,
      updated.status,
      updated.current_page,
      updated.total_pages,
      updated.memo,
      updated.google_books_id,
      updated.finished_at,
      updated.updated_at,
      id,
      userId,
    )
    .run();

  await indexReading(c.env.DB, updated);
  return c.json({ reading: serializeReading(updated) });
});

readingsRoutes.delete('/:id', async (c) => {
  const userId = getUserId(c)!;
  const id = c.req.param('id');

  const existing = await c.env.DB.prepare('SELECT id FROM readings WHERE id = ? AND user_id = ?')
    .bind(id, userId)
    .first();

  if (!existing) return c.json({ error: 'Not found' }, 404);

  await deleteFts(c.env.DB, 'reading', id);
  await c.env.DB.prepare('DELETE FROM readings WHERE id = ? AND user_id = ?').bind(id, userId).run();
  return c.body(null, 204);
});
