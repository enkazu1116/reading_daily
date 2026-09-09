import type { ReadingStatus } from './types';
import { nowIso } from './time';

export function resolveFinishedAt(
  existing: { status: ReadingStatus | null; finished_at: string | null },
  nextStatus: ReadingStatus | null,
  statusInBody: boolean,
  now: () => string = nowIso,
): string | null {
  if (!statusInBody) {
    return existing.finished_at;
  }

  if (nextStatus === 'finished' && existing.status !== 'finished') {
    return now();
  }

  if (existing.status === 'finished' && nextStatus !== 'finished') {
    return null;
  }

  return existing.finished_at;
}
