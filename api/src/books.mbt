///|
async fn handle_books_search(ctx : @mars.Context) -> Unit raise Error {
  if !require_auth(ctx) {
    ()
  } else if ctx.query("q").map(fn(s) { normalize(s) }).unwrap_or("").length() == 0 {
    ctx.json(Json::object({ "error": Json::string("q is required") }), status=400)
  } else if google_books_api_key() is None {
    ctx.json(
      Json::object({ "error": Json::string("Google Books API key is not configured") }),
      status=503,
    )
  } else if google_books_api_key().unwrap() == "replace-me" {
    ctx.json(
      Json::object({ "error": Json::string("Google Books API key is not configured") }),
      status=503,
    )
  } else if get_cache() is None {
    ctx.json(
      Json::object({ "error": Json::string("Cache not configured") }),
      status=500,
    )
  } else {
    let q = ctx.query("q").map(fn(s) { normalize(s) }).unwrap_or("")
    let api_key = google_books_api_key().unwrap()
    let cache = get_cache().unwrap()
    match search_google_books(cache, api_key, q) {
      Err(msg) =>
        ctx.json(Json::object({ "error": Json::string(msg) }), status=502)
      Ok(results) => {
        let json_results : Array[Json] = []
        for item in results {
          json_results.push(
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
            }),
          )
        }
        ctx.json(Json::object({ "results": Json::array(json_results) }))
      }
    }
  }
}
