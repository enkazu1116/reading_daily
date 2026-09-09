import type { Context, Next } from 'hono';

export const ACCESS_EMAIL_HEADER = 'Cf-Access-Authenticated-User-Email';

export function getUserId(c: Context): string | null {
  return c.req.header(ACCESS_EMAIL_HEADER) ?? null;
}

export async function requireAuth(c: Context, next: Next): Promise<Response | void> {
  const userId = getUserId(c);
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  c.set('userId', userId);
  await next();
}
