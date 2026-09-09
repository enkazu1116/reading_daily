import { resolveFinishedAt } from '../src/readings-status.ts';
import { tokenize } from '../src/tokenizer/fallback.ts';

const fixedNow = () => '2026-09-09T12:00:00.000Z';

// finished_at: set on transition to finished, clear on leave finished, unchanged otherwise
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

// ASCII tokenizer: lowercase a-z must be word chars (matches Moonbit)
const asciiTokens = tokenize('Hello hello WORLD');
for (const token of ['hello', 'world']) {
  if (!asciiTokens.includes(token)) {
    throw new Error(`expected token "${token}" in "${asciiTokens}"`);
  }
}

console.log('verify: readings-status + tokenizer ok');
