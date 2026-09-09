import { Hono } from 'hono';
import type { Env, StatsResponse } from '../types';
import { getUserId } from '../auth';
import { getJstMonthRange } from '../time';

export const statsRoutes = new Hono<{ Bindings: Env; Variables: { userId: string } }>();

statsRoutes.get('/', async (c) => {
  const userId = getUserId(c)!;

  const counts = await c.env.DB.prepare(
    `SELECT
       SUM(CASE WHEN status = 'finished' THEN 1 ELSE 0 END) AS finished,
       SUM(CASE WHEN status = 'reading' THEN 1 ELSE 0 END) AS reading,
       SUM(CASE WHEN status = 'tsundoku' THEN 1 ELSE 0 END) AS tsundoku
     FROM readings
     WHERE user_id = ?`,
  )
    .bind(userId)
    .first<{ finished: number | null; reading: number | null; tsundoku: number | null }>();

  const { start, end } = getJstMonthRange();
  const pages = await c.env.DB.prepare(
    `SELECT COALESCE(SUM(total_pages), 0) AS pagesThisMonth
     FROM readings
     WHERE user_id = ?
       AND status = 'finished'
       AND finished_at IS NOT NULL
       AND finished_at >= ?
       AND finished_at < ?`,
  )
    .bind(userId, start, end)
    .first<{ pagesThisMonth: number | null }>();

  const response: StatsResponse = {
    finished: Number(counts?.finished ?? 0),
    reading: Number(counts?.reading ?? 0),
    tsundoku: Number(counts?.tsundoku ?? 0),
    pagesThisMonth: Number(pages?.pagesThisMonth ?? 0),
  };

  return c.json(response);
});
