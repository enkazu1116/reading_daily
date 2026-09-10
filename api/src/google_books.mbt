///|
pub struct GoogleBookResult {
  id : String
  google_books_id : String
  title : String?
  authors : String?
  description : String?
  thumbnail_url : String?
  page_count : Int?
}

///|
fn map_volume_json(item : Json) -> GoogleBookResult? {
  guard item is Object(root) else { return None }
  let id = match root.get("id") {
    Some(String(s)) => s
    _ => return None
  }
  let info = match root.get("volumeInfo") {
    Some(Object(v)) => v
    _ => Map::new()
  }
  let title = match info.get("title") {
    Some(String(s)) => Some(s)
    _ => None
  }
  let authors = match info.get("authors") {
    Some(Array(arr)) => {
      let joined : Array[String] = []
      for author in arr {
        if author is String(s) {
          joined.push(s)
        }
      }
      if joined.is_empty() {
        None
      } else {
        Some(joined.join(", "))
      }
    }
    _ => None
  }
  let description = match info.get("description") {
    Some(String(s)) => Some(s)
    _ => None
  }
  let thumbnail = match info.get("imageLinks") {
    Some(Object(links)) =>
      match links.get("thumbnail") {
        Some(String(s)) => Some(s)
        _ =>
          match links.get("smallThumbnail") {
            Some(String(s)) => Some(s)
            _ => None
          }
      }
    _ => None
  }
  let page_count = match info.get("pageCount") {
    Some(Number(n, ..)) => Some(n.to_int())
    _ => None
  }
  Some({
    id,
    google_books_id: id,
    title,
    authors,
    description,
    thumbnail_url: thumbnail,
    page_count,
  })
}

///|
fn google_book_to_json(item : GoogleBookResult) -> Json {
  Json::object({
    "id": Json::string(item.id),
    "googleBooksId": Json::string(item.google_books_id),
    "title": optional_json_string(item.title),
    "authors": optional_json_string(item.authors),
    "description": optional_json_string(item.description),
    "thumbnailUrl": optional_json_string(item.thumbnail_url),
    "pageCount": match item.page_count {
      Some(v) => Json::number(v.to_double())
      None => Json::null()
    },
  })
}

///|
fn parse_cached_results(raw : String) -> Array[GoogleBookResult] {
  let payload = @json.parse(raw) catch { _ => return [] }
  let results : Array[GoogleBookResult] = []
  match payload {
    Array(items) =>
      for item in items {
        if item is Object(obj) {
          let mapped = GoogleBookResult::{
            id: match obj.get("id") {
              Some(String(s)) => s
              _ => ""
            },
            google_books_id: match obj.get("googleBooksId") {
              Some(String(s)) => s
              _ => ""
            },
            title: match obj.get("title") {
              Some(String(s)) => Some(s)
              _ => None
            },
            authors: match obj.get("authors") {
              Some(String(s)) => Some(s)
              _ => None
            },
            description: match obj.get("description") {
              Some(String(s)) => Some(s)
              _ => None
            },
            thumbnail_url: match obj.get("thumbnailUrl") {
              Some(String(s)) => Some(s)
              _ => None
            },
            page_count: match obj.get("pageCount") {
              Some(Number(n, ..)) => Some(n.to_int())
              _ => None
            },
          }
          if mapped.id.length() > 0 {
            results.push(mapped)
          }
        }
      }
    _ => ()
  }
  results
}

///|
pub async fn search_google_books(
  cache : @cloudflare.KVNamespace,
  api_key : String,
  query : String,
) -> Result[Array[GoogleBookResult], String] {
  let cache_key = "books:search:" + string_to_lower(query)
  let cached = cache.get(cache_key)
  if cached is Some(raw) {
    return Ok(parse_cached_results(raw))
  }
  let url = "https://www.googleapis.com/books/v1/volumes?q=" +
    encode_uri_component(query) +
    "&key=" +
    encode_uri_component(api_key) +
    "&maxResults=20"
  let body = match fetch_text_result(url) {
    Err(msg) => return Err(msg)
    Ok(value) => value
  }
  let payload = @json.parse(body) catch {
    _ => return Err("Failed to parse Google Books response")
  }
  let results : Array[GoogleBookResult] = []
  match payload {
    Object(obj) =>
      match obj.get("items") {
        Some(Array(items)) =>
          for item in items {
            if map_volume_json(item) is Some(mapped) {
              results.push(mapped)
            }
          }
        _ => ()
      }
    _ => ()
  }
  let json_results : Array[Json] = []
  for item in results {
    json_results.push(google_book_to_json(item))
  }
  cache.put(cache_key, json_stringify(Json::array(json_results)), expirationTtl=3600)
  Ok(results)
}

///|
pub async fn fetch_google_book_by_id(
  cache : @cloudflare.KVNamespace,
  api_key : String,
  google_books_id : String,
) -> Result[GoogleBookResult?, String] {
  let cache_key = "books:volume:" + google_books_id
  let cached = cache.get(cache_key)
  if cached is Some(raw) {
    let payload = @json.parse(raw) catch { _ => return Ok(None) }
    if payload is Object(map) {
      return Ok(Some(GoogleBookResult::{
        id: match map.get("id") {
          Some(String(s)) => s
          _ => google_books_id
        },
        google_books_id: match map.get("googleBooksId") {
          Some(String(s)) => s
          _ => google_books_id
        },
        title: match map.get("title") {
          Some(String(s)) => Some(s)
          _ => None
        },
        authors: match map.get("authors") {
          Some(String(s)) => Some(s)
          _ => None
        },
        description: match map.get("description") {
          Some(String(s)) => Some(s)
          _ => None
        },
        thumbnail_url: match map.get("thumbnailUrl") {
          Some(String(s)) => Some(s)
          _ => None
        },
        page_count: match map.get("pageCount") {
          Some(Number(n, ..)) => Some(n.to_int())
          _ => None
        },
      }))
    }
  }
  let url = "https://www.googleapis.com/books/v1/volumes/" +
    encode_uri_component(google_books_id) +
    "?key=" +
    encode_uri_component(api_key)
  let body = match fetch_text_result(url) {
    Err(msg) =>
      if msg.contains("HTTP 404") {
        return Ok(None)
      } else {
        return Err(msg)
      }
    Ok(value) => value
  }
  let item = @json.parse(body) catch {
    _ => return Err("Failed to parse Google Books response")
  }
  if map_volume_json(item) is Some(mapped) {
    cache.put(cache_key, json_stringify(google_book_to_json(mapped)), expirationTtl=3600)
    return Ok(Some(mapped))
  }
  Ok(None)
}

///|
extern "js" fn encode_uri_component(value : String) -> String =
  #| (value) => encodeURIComponent(value)
