import { Hono } from 'hono';
import type { Env } from '../types';
import { getUserId } from '../auth';
import { getTokenizer } from '../tokenizer';

interface FtsRow {
  doc_type: string;
  doc_id: string;
  user_id: string;
}

export const searchRoutes = new Hono<{ Bindings: Env; Variables: { userId: string } }>();

searchRoutes.get('/', async (c) => {
  const q = c.req.query('q')?.trim();
  if (!q) {
    return c.json({ error: 'q is required' }, 400);
  }

  const userId = getUserId(c)!;
  const tokenizer = await getTokenizer();
  const prepared = tokenizer.prepareQuery(q);
  if (!prepared) {
    return c.json({ results: [] });
  }

  const { results } = await c.env.DB.prepare(
    `SELECT doc_type, doc_id, user_id
     FROM search_fts
     WHERE tokens MATCH ?
       AND (user_id = ? OR (doc_type = 'book' AND user_id = ''))
     ORDER BY rank`,
  )
    .bind(prepared, userId)
    .all<FtsRow>();

  return c.json({ results: results ?? [] });
});
