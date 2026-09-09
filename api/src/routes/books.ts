import { Hono } from 'hono';
import type { Env } from '../types';
import { searchGoogleBooks } from '../services/google-books';

export const booksRoutes = new Hono<{ Bindings: Env; Variables: { userId: string } }>();

booksRoutes.get('/search', async (c) => {
  const q = c.req.query('q')?.trim();
  if (!q) {
    return c.json({ error: 'q is required' }, 400);
  }

  if (!c.env.GOOGLE_BOOKS_API_KEY || c.env.GOOGLE_BOOKS_API_KEY === 'replace-me') {
    return c.json({ error: 'Google Books API key is not configured' }, 503);
  }

  try {
    const results = await searchGoogleBooks(c.env.CACHE, c.env.GOOGLE_BOOKS_API_KEY, q);
    return c.json({ results });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Search failed';
    return c.json({ error: message }, 502);
  }
});
