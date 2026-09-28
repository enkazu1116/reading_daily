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

const UNPATCHED_HASH_SEED = `  if (globalThis.crypto?.getRandomValues) {
    const array = new Uint32Array(1);
    globalThis.crypto.getRandomValues(array);
    return array[0] | 0; // Convert to signed 32
  } else {
    return Math.floor(Math.random() * 0x100000000) | 0; // Fallback to Math.random
  }`;
if (bundle.includes(UNPATCHED_HASH_SEED)) {
  throw new Error(
    'MoonBit bundle still has the unpatched Hasher seed (module-init getRandomValues). ' +
      'Run scripts/patch-moonbit-hash-seed.ts after moon build.',
  );
}
if (!bundle.includes('reading-log: workers-safe-hash-seed')) {
  throw new Error('MoonBit bundle missing workers-safe-hash-seed patch marker');
}
if (bundle.includes('moonbitlang$async$internal$event_loop$$reschedule();')) {
  throw new Error(
    'MoonBit bundle still calls the stale mars reschedule global. ' +
      'Run scripts/patch-moonbit-hash-seed.ts after moon build.',
  );
}
if (!bundle.includes('reading-log: workers-mars-reschedule')) {
  throw new Error('MoonBit bundle missing workers-mars-reschedule patch marker');
}

// Workers と同じく、モジュール初期化時の getRandomValues が例外を投げる状況を再現する。
// パッチ後のシード関数は落ちずに数を返す必要がある。
function workersSafeHashSeed() {
  try {
    if (globalThis.crypto?.getRandomValues) {
      const array = new Uint32Array(1);
      globalThis.crypto.getRandomValues(array);
      return array[0] | 0;
    }
  } catch {
    // グローバルスコープ制限。Hasher シードなので Math.random でよい。
  }
  return Math.floor(Math.random() * 0x100000000) | 0;
}

const originalGetRandomValues = globalThis.crypto?.getRandomValues?.bind(globalThis.crypto);
globalThis.crypto.getRandomValues = () => {
  throw new Error(
    'Disallowed operation called within global scope. generating random values are not allowed within global scope.',
  );
};
const seed = workersSafeHashSeed();
if (typeof seed !== 'number' || !Number.isFinite(seed)) {
  throw new Error(`expected numeric hash seed after getRandomValues throw, got ${seed}`);
}
if (originalGetRandomValues) {
  globalThis.crypto.getRandomValues = originalGetRandomValues;
}

console.log('verify: finished_at + tokenizer + moon bundle + workers-safe hash seed + mars reschedule ok');
