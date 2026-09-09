/** Asia/Tokyo month boundaries as ISO8601 strings with +09:00 offset. */
export function getJstMonthRange(now = new Date()): { start: string; end: string } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(now);

  const year = Number(parts.find((p) => p.type === 'year')!.value);
  const month = Number(parts.find((p) => p.type === 'month')!.value);

  const start = `${year}-${String(month).padStart(2, '0')}-01T00:00:00+09:00`;

  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const end = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01T00:00:00+09:00`;

  return { start, end };
}

export function nowIso(): string {
  return new Date().toISOString();
}
