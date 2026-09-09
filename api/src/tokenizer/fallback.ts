const WS = /[\t\n\r ]+/;

function isAsciiWordChar(code: number): boolean {
  return (
    (code >= 0x30 && code <= 0x39) ||
    (code >= 0x41 && code <= 0x5a) ||
    (code >= 0x61 && code <= 0x7a) ||
    code === 0x2d ||
    code === 0x5f
  );
}

function trim(text: string): string {
  return text.trim();
}

function lowerAscii(text: string): string {
  return text.toLowerCase();
}

export function normalize(text: string): string {
  return trim(text);
}

export function tokenize(text: string): string {
  const normalized = normalize(text);
  if (!normalized) return '';

  const tokens: string[] = [];
  let i = 0;

  while (i < normalized.length) {
    const code = normalized.charCodeAt(i);
    if (WS.test(normalized[i]!)) {
      i += 1;
      continue;
    }

    if (isAsciiWordChar(code)) {
      const start = i;
      while (i < normalized.length && isAsciiWordChar(normalized.charCodeAt(i))) {
        i += 1;
      }
      tokens.push(lowerAscii(normalized.slice(start, i)));
      continue;
    }

    const start = i;
    while (
      i < normalized.length &&
      !WS.test(normalized[i]!) &&
      !isAsciiWordChar(normalized.charCodeAt(i))
    ) {
      i += 1;
    }
    const segment = normalized.slice(start, i);
    if (segment.length === 1) {
      tokens.push(segment);
    } else {
      for (let j = 0; j + 1 < segment.length; j += 1) {
        tokens.push(segment.slice(j, j + 2));
      }
    }
  }

  return tokens.join(' ');
}

export function prepareQuery(query: string): string {
  return tokenize(normalize(query));
}
