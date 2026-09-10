import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

function resolveFinishedAt(existing, nextStatus, statusInBody, now) {
  if (!statusInBody) return existing.finished_at;
  if (nextStatus === 'finished' && existing.status !== 'finished') return now();
  if (existing.status === 'finished' && nextStatus !== 'finished') return null;
  return existing.finished_at;
}

function tokenize(text) {
  const normalized = text.trim();
  if (!normalized) return '';
  const tokens = [];
  let i = 0;
  while (i < normalized.length) {
    const c = normalized[i];
    if (/\s/.test(c)) {
      i += 1;
      continue;
    }
    if (/[A-Za-z0-9_-]/.test(c)) {
      const start = i;
      while (i < normalized.length && /[A-Za-z0-9_-]/.test(normalized[i])) i += 1;
      tokens.push(normalized.slice(start, i).toLowerCase());
    } else {
      const start = i;
      while (i < normalized.length && !/\s/.test(normalized[i]) && !/[A-Za-z0-9_-]/.test(normalized[i])) {
        i += 1;
      }
      const segment = normalized.slice(start, i);
      if (segment.length === 1) tokens.push(segment);
      else {
        for (let j = 0; j + 1 < segment.length; j += 1) tokens.push(segment.slice(j, j + 2));
      }
    }
  }
  return tokens.join(' ');
}

const fixedNow = () => '2026-09-09T12:00:00.000Z';

const toFinished = resolveFinishedAt(
  { status: 'reading', finished_at: null },
  'finished',
  true,
  fixedNow,
);
if (toFinished !== fixedNow()) {
  throw new Error(`expected finished_at on transition to finished, got ${toFinished}`);
}

const cleared = resolveFinishedAt(
  { status: 'finished', finished_at: fixedNow() },
  'reading',
  true,
  fixedNow,
);
if (cleared !== null) {
  throw new Error(`expected finished_at cleared when leaving finished, got ${cleared}`);
}

const unchanged = resolveFinishedAt(
  { status: 'finished', finished_at: fixedNow() },
  'finished',
  false,
  fixedNow,
);
if (unchanged !== fixedNow()) {
  throw new Error(`expected finished_at unchanged on memo-only patch, got ${unchanged}`);
}

const asciiTokens = tokenize('Hello hello WORLD');
for (const token of ['hello', 'world']) {
  if (!asciiTokens.includes(token)) {
    throw new Error(`expected token "${token}" in "${asciiTokens}"`);
  }
}

const bundle = readFileSync(join(root, '_build/js/release/build/reading-log-api.js'), 'utf8');
if (!bundle.includes('__appServerFetch')) {
  throw new Error('MoonBit bundle missing __appServerFetch registration');
}

console.log('verify: finished_at + tokenizer + moon bundle ok');
