///|
fn is_whitespace(c : Char) -> Bool {
  c == ' ' || c == '\t' || c == '\n' || c == '\r'
}

///|
fn is_ascii_word_char(c : Char) -> Bool {
  let code = c.to_int()
  (code >= 0x30 && code <= 0x39) ||
  (code >= 0x41 && code <= 0x5A) ||
  (code >= 0x61 && code <= 0x7A) ||
  code == 0x2D || code == 0x5F
}

///|
fn to_lower_char(c : Char) -> Char {
  let code = c.to_int()
  if code >= 0x41 && code <= 0x5A {
    Char::from_int(code + 0x20)
  } else {
    c
  }
}

///|
fn trim(text : String) -> String {
  let len = text.length()
  if len == 0 {
    return ""
  }
  let mut start = 0
  while start < len && is_whitespace(text[start]) {
    start = start + 1
  }
  let mut end = len
  while end > start && is_whitespace(text[end - 1]) {
    end = end - 1
  }
  text[start:end]
}

///|
fn lower_ascii(text : String) -> String {
  let len = text.length()
  let mut out = StringBuilder::new()
  for i in 0..<len {
    out.write_char(to_lower_char(text[i]))
  }
  out.to_string()
}

///|
pub fn normalize(text : String) -> String {
  trim(text)
}

///|
pub fn tokenize(text : String) -> String {
  let normalized = normalize(text)
  let len = normalized.length()
  if len == 0 {
    return ""
  }
  let mut tokens : Array[String] = []
  let mut i = 0
  while i < len {
    let c = normalized[i]
    if is_whitespace(c) {
      i = i + 1
      continue
    }
    if is_ascii_word_char(c) {
      let start = i
      while i < len && is_ascii_word_char(normalized[i]) {
        i = i + 1
      }
      tokens.push(lower_ascii(normalized[start:i]))
    } else {
      let start = i
      while i < len && !is_whitespace(normalized[i]) && !is_ascii_word_char(normalized[i]) {
        i = i + 1
      }
      let segment = normalized[start:i]
      let seg_len = segment.length()
      if seg_len == 1 {
        tokens.push(segment)
      } else {
        let mut j = 0
        while j + 1 < seg_len {
          tokens.push(segment[j:j + 2])
          j = j + 1
        }
      }
    }
  }
  tokens.join(" ")
}

///|
pub fn prepare_query(query : String) -> String {
  tokenize(normalize(query))
}
