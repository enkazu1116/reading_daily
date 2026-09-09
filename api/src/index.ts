import { Hono } from 'hono';
import type { Env } from './types';
import { requireAuth } from './auth';
import { booksRoutes } from './routes/books';
import { readingsRoutes } from './routes/readings';
import { searchRoutes } from './routes/search';
import { statsRoutes } from './routes/stats';

const app = new Hono<{ Bindings: Env; Variables: { userId: string } }>();

app.use('*', async (c, next) => {
  const origin = c.env.CORS_ORIGIN || 'http://localhost:43123';
  if (c.req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Cf-Access-Authenticated-User-Email',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  await next();

  c.res.headers.set('Access-Control-Allow-Origin', origin);
  c.res.headers.set('Access-Control-Allow-Credentials', 'true');
});

app.get('/health', (c) => c.json({ ok: true }));

app.use('/readings/*', requireAuth);
app.use('/readings', requireAuth);
app.route('/readings', readingsRoutes);

app.use('/books/*', requireAuth);
app.route('/books', booksRoutes);

app.use('/search/*', requireAuth);
app.use('/search', requireAuth);
app.route('/search', searchRoutes);

app.use('/stats/*', requireAuth);
app.use('/stats', requireAuth);
app.route('/stats', statsRoutes);

app.notFound((c) => c.json({ error: 'Not found' }, 404));

export default app;
