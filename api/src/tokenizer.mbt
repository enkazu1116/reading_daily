///|
fn char_at(text : String, index : Int) -> Char {
  text.code_unit_at(index).unsafe_to_char()
}

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
  while start < len && is_whitespace(char_at(text, start)) {
    start = start + 1
  }
  let mut end = len
  while end > start && is_whitespace(char_at(text, end - 1)) {
    end = end - 1
  }
  text[start:end].to_string()
}

///|
fn lower_ascii(text : String) -> String {
  let len = text.length()
  let out = StringBuilder::new()
  for i in 0..<len {
    out.write_char(to_lower_char(char_at(text, i)))
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
  let tokens : Array[String] = []
  let mut i = 0
  while i < len {
    let c = char_at(normalized, i)
    if is_whitespace(c) {
      i = i + 1
      continue
    }
    if is_ascii_word_char(c) {
      let start = i
      while i < len && is_ascii_word_char(char_at(normalized, i)) {
        i = i + 1
      }
      tokens.push(lower_ascii(normalized[start:i].to_string()))
    } else {
      let start = i
      while i < len &&
        !is_whitespace(char_at(normalized, i)) &&
        !is_ascii_word_char(char_at(normalized, i)) {
        i = i + 1
      }
      let segment = normalized[start:i].to_string()
      let seg_len = segment.length()
      if seg_len == 1 {
        tokens.push(segment)
      } else {
        let mut j = 0
        while j + 1 < seg_len {
          tokens.push(segment[j:j + 2].to_string())
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
