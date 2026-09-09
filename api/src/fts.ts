import type { Tokenizer } from './tokenizer';

export async function upsertFts(
  db: D1Database,
  tokenizer: Tokenizer,
  docType: 'reading' | 'book',
  docId: string,
  userId: string,
  text: string,
): Promise<void> {
  const tokens = tokenizer.tokenize(text);
  await db
    .prepare('DELETE FROM search_fts WHERE doc_type = ? AND doc_id = ?')
    .bind(docType, docId)
    .run();

  if (!tokens) return;

  await db
    .prepare(
      'INSERT INTO search_fts (doc_type, doc_id, user_id, tokens) VALUES (?, ?, ?, ?)',
    )
    .bind(docType, docId, userId, tokens)
    .run();
}

export async function deleteFts(
  db: D1Database,
  docType: 'reading' | 'book',
  docId: string,
): Promise<void> {
  await db
    .prepare('DELETE FROM search_fts WHERE doc_type = ? AND doc_id = ?')
    .bind(docType, docId)
    .run();
}

export function readingSearchText(input: {
  title?: string | null;
  author?: string | null;
  memo?: string | null;
}): string {
  return [input.title, input.author, input.memo].filter(Boolean).join(' ');
}

export function bookSearchText(input: {
  title?: string | null;
  authors?: string | null;
  description?: string | null;
}): string {
  return [input.title, input.authors, input.description].filter(Boolean).join(' ');
}
