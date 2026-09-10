///|
async fn handle_search(ctx : @mars.Context) -> Unit raise Error {
  if !require_auth(ctx) {
    ()
  } else if ctx.query("q").map(fn(s) { normalize(s) }).unwrap_or("").length() == 0 {
    ctx.json(Json::object({ "error": Json::string("q is required") }), status=400)
  } else if get_db() is None {
    ctx.json(
      Json::object({ "error": Json::string("Database not configured") }),
      status=500,
    )
  } else {
    let db = get_db().unwrap()
    let user_id = get_user_id(ctx).unwrap()
    let prepared = prepare_query(
      ctx.query("q").map(fn(s) { normalize(s) }).unwrap_or(""),
    )
    if prepared.length() == 0 {
      ctx.json(Json::object({ "results": Json::array([]) }))
    } else {
      let rows = @gen.search_fts(
        db,
        @gen.SearchFtsParams::new(prepared, user_id),
      )
      let results : Array[Json] = []
      for row in rows {
        results.push(search_result_to_json(row))
      }
      ctx.json(Json::object({ "results": Json::array(results) }))
    }
  }
}
