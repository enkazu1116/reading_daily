///|
/// Cloudflare Worker runtime helpers (JS FFI glue).

///|
extern "js" fn js_random_uuid() -> String =
  #| () => crypto.randomUUID()

///|
pub fn random_uuid() -> String {
  js_random_uuid()
}

///|
extern "js" fn js_now_iso() -> String =
  #| () => new Date().toISOString()

///|
pub fn now_iso() -> String {
  js_now_iso()
}

///|
extern "js" fn js_jst_month_range() -> (String, String) =
  #| () => {
  #|   const now = new Date();
  #|   const parts = new Intl.DateTimeFormat('en-CA', {
  #|     timeZone: 'Asia/Tokyo',
  #|     year: 'numeric',
  #|     month: '2-digit',
  #|   }).formatToParts(now);
  #|   const year = Number(parts.find((p) => p.type === 'year').value);
  #|   const month = Number(parts.find((p) => p.type === 'month').value);
  #|   const start = `${year}-${String(month).padStart(2, '0')}-01T00:00:00+09:00`;
  #|   const nextMonth = month === 12 ? 1 : month + 1;
  #|   const nextYear = month === 12 ? year + 1 : year;
  #|   const end = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01T00:00:00+09:00`;
  #|   return [start, end];
  #| }

///|
pub fn jst_month_range() -> (String, String) {
  js_jst_month_range()
}

///|
struct FetchTextResult {
  ok : Bool
  body : String
  error : String
}

///|
extern "js" fn js_fetch_text_result(url : String) -> @js_async.Promise[FetchTextResult] =
  #| async (url) => {
  #|   try {
  #|     const res = await fetch(url);
  #|     if (!res.ok) {
  #|       return { ok: false, body: "", error: `HTTP ${res.status}` };
  #|     }
  #|     return { ok: true, body: await res.text(), error: "" };
  #|   } catch (error) {
  #|     return { ok: false, body: "", error: String(error?.message || error) };
  #|   }
  #| }

///|
pub async fn fetch_text_result(url : String) -> Result[String, String] {
  let result = js_fetch_text_result(url).wait()
  if result.ok {
    Ok(result.body)
  } else {
    Err(result.error)
  }
}

///|
extern "js" fn js_env_string(name : String) -> String? =
  #| (name) => {
  #|   const env = globalThis.__appServerEnv ?? {};
  #|   const value = env[name];
  #|   return typeof value === 'string' ? value : undefined;
  #| }

///|
pub fn env_string(name : String) -> String? {
  js_env_string(name)
}

///|
extern "js" fn js_env_binding(name : String) -> @core.Any? =
  #| (name) => {
  #|   const env = globalThis.__appServerEnv ?? {};
  #|   const value = env[name];
  #|   return value === undefined ? undefined : value;
  #| }

///|
pub fn env_binding(name : String) -> @core.Any? {
  js_env_binding(name)
}

///|
pub fn get_db() -> @cloudflare.D1Database? {
  match env_binding("DB") {
    Some(v) => Some(@core.identity(v))
    None => None
  }
}

///|
pub fn get_cache() -> @cloudflare.KVNamespace? {
  match env_binding("CACHE") {
    Some(v) => Some(@core.identity(v))
    None => None
  }
}

///|
pub fn cors_origin() -> String {
  env_string("CORS_ORIGIN").unwrap_or("http://localhost:43123")
}

///|
pub fn google_books_api_key() -> String? {
  env_string("GOOGLE_BOOKS_API_KEY")
}

///|
pub fn int64_from_int(value : Int) -> Int64 {
  value.to_int64()
}

///|
extern "js" fn js_int64_to_int(value : Int64) -> Int =
  #| (value) => Number(value) | 0

///|
pub fn int_from_int64(value : Int64) -> Int {
  js_int64_to_int(value)
}

///|
pub fn int_from_int64_opt(value : Int64?) -> Int {
  match value {
    Some(v) => int_from_int64(v)
    None => 0
  }
}

///|
pub fn json_string_field(obj : Json, field : String) -> String? {
  match obj {
    Object(map) =>
      match map.get(field) {
        Some(String(s)) => Some(s)
        Some(Null) => None
        _ => None
      }
    _ => None
  }
}

///|
pub fn json_number_field(obj : Json, field : String) -> Int? {
  match obj {
    Object(map) =>
      match map.get(field) {
        Some(Number(n, ..)) => Some(n.to_int())
        _ => None
      }
    _ => None
  }
}

///|
pub fn opt_string(value : String?, fallback : String?) -> String? {
  match value {
    Some(v) => Some(v)
    None => fallback
  }
}

///|
pub fn opt_status(value : String?, fallback : String?) -> String? {
  opt_string(value, fallback)
}

///|
pub fn string_to_lower(text : String) -> String {
  let len = text.length()
  let out = StringBuilder::new()
  for i in 0..<len {
    let c = text.code_unit_at(i).unsafe_to_char()
    let code = c.to_int()
    if code >= 0x41 && code <= 0x5A {
      out.write_char(Char::from_int(code + 0x20))
    } else {
      out.write_char(c)
    }
  }
  out.to_string()
}

///|
pub fn json_stringify(value : Json) -> String {
  @js.JSON::stringify(@core.identity(value))
}

///|
pub fn optional_json_string(value : String?) -> Json {
  match value {
    Some(s) => Json::string(s)
    None => Json::null()
  }
}
