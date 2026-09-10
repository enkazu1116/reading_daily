///|
fn optional_string_field(body : Json, field : String) -> String? {
  match body {
    Object(obj) =>
      match obj.get(field) {
        Some(String(s)) => Some(s)
        Some(Null) => None
        _ => None
      }
    _ => None
  }
}

///|
fn optional_int_field(body : Json, field : String) -> Int? {
  match body {
    Object(obj) =>
      match obj.get(field) {
        Some(Number(n, ..)) => Some(n.to_int())
        _ => None
      }
    _ => None
  }
}

///|
async fn handle_list_readings(ctx : @mars.Context) -> Unit raise Error {
  if !require_auth(ctx) {
    ()
  } else if get_db() is None {
    ctx.json(
      Json::object({ "error": Json::string("Database not configured") }),
      status=500,
    )
  } else {
    let db = get_db().unwrap()
    let user_id = get_user_id(ctx).unwrap()
    let rows = @gen.list_readings_by_user(
      db,
      @gen.ListReadingsByUserParams::new(user_id),
    )
    let readings : Array[Json] = []
    for row in rows {
      readings.push(list_reading_row_to_json(row))
    }
    ctx.json(Json::object({ "readings": Json::array(readings) }))
  }
}

///|
async fn handle_create_reading(ctx : @mars.Context) -> Unit raise Error {
  if !require_auth(ctx) {
    ()
  } else if get_db() is None {
    ctx.json(
      Json::object({ "error": Json::string("Database not configured") }),
      status=500,
    )
  } else if ctx.body_json() is None {
    ctx.json(Json::object({ "error": Json::string("Invalid JSON body") }), status=400)
  } else {
    let db = get_db().unwrap()
    let user_id = get_user_id(ctx).unwrap()
    let body = ctx.body_json().unwrap()
    let status = optional_string_field(body, "status")
    if status is Some(s) && !is_valid_status(s) {
      ctx.json(Json::object({ "error": Json::string("Invalid status") }), status=400)
    } else {
      let resolved_status = status.unwrap_or("tsundoku")
      let timestamp = now_iso()
      let finished_at = if resolved_status == "finished" {
        Some(timestamp)
      } else {
        None
      }
      let id = random_uuid()
      @gen.insert_reading(
        db,
        @gen.InsertReadingParams::new(
          id,
          user_id,
          optional_string_field(body, "bookId"),
          optional_string_field(body, "title"),
          optional_string_field(body, "author"),
          Some(resolved_status),
          match optional_int_field(body, "currentPage") {
            Some(v) => Some(int64_from_int(v))
            None => Some(int64_from_int(0))
          },
          match optional_int_field(body, "totalPages") {
            Some(v) => Some(int64_from_int(v))
            None => Some(int64_from_int(0))
          },
          Some(optional_string_field(body, "memo").unwrap_or("")),
          optional_string_field(body, "googleBooksId"),
          finished_at,
          Some(timestamp),
          Some(timestamp),
        ),
      )
      if @gen.get_reading_by_id(
        db,
        @gen.GetReadingByIdParams::new(id, user_id),
      ) is Some(saved) {
        upsert_fts(
          db,
          "reading",
          saved.id,
          saved.user_id,
          reading_search_text(saved.title, saved.author, saved.memo),
        )
        ctx.json(
          Json::object({ "reading": reading_row_to_json(saved) }),
          status=201,
        )
      } else {
        ctx.json(
          Json::object({ "error": Json::string("Failed to create reading") }),
          status=500,
        )
      }
    }
  }
}

///|
async fn handle_create_reading_from_book(ctx : @mars.Context) -> Unit raise Error {
  if !require_auth(ctx) {
    ()
  } else if get_db() is None {
    ctx.json(
      Json::object({ "error": Json::string("Database not configured") }),
      status=500,
    )
  } else if get_cache() is None {
    ctx.json(
      Json::object({ "error": Json::string("Cache not configured") }),
      status=500,
    )
  } else if google_books_api_key() is None {
    ctx.json(
      Json::object({ "error": Json::string("Google Books API key is not configured") }),
      status=503,
    )
  } else if ctx.body_json() is None {
    ctx.json(Json::object({ "error": Json::string("Invalid JSON body") }), status=400)
  } else if optional_string_field(ctx.body_json().unwrap(), "googleBooksId") is None {
    ctx.json(
      Json::object({ "error": Json::string("googleBooksId is required") }),
      status=400,
    )
  } else {
    let db = get_db().unwrap()
    let cache = get_cache().unwrap()
    let api_key = google_books_api_key().unwrap()
    let user_id = get_user_id(ctx).unwrap()
    let google_books_id = optional_string_field(
      ctx.body_json().unwrap(),
      "googleBooksId",
    ).unwrap()
    match fetch_google_book_by_id(cache, api_key, google_books_id) {
      Err(msg) =>
        ctx.json(Json::object({ "error": Json::string(msg) }), status=502)
      Ok(None) =>
        ctx.json(Json::object({ "error": Json::string("Book not found") }), status=404)
      Ok(Some(vol)) => {
        let book_row : @gen.GetBookByIdRow = match @gen.get_book_by_google_books_id(
          db,
          @gen.GetBookByGoogleBooksIdParams::new(Some(vol.google_books_id)),
        ) {
          Some(existing) =>
            @gen.get_book_by_id(db, @gen.GetBookByIdParams::new(existing.id)).unwrap()
          None => {
            let book_id = random_uuid()
            let created_at = now_iso()
            @gen.insert_book(
              db,
              @gen.InsertBookParams::new(
                book_id,
                Some(vol.google_books_id),
                vol.title,
                vol.authors,
                vol.description,
                vol.thumbnail_url,
                match vol.page_count {
                  Some(v) => Some(int64_from_int(v))
                  None => None
                },
                Some(created_at),
              ),
            )
            upsert_fts(
              db,
              "book",
              book_id,
              "",
              book_search_text(vol.title, vol.authors, vol.description),
            )
            @gen.get_book_by_id(db, @gen.GetBookByIdParams::new(book_id)).unwrap()
          }
        }
        let id = random_uuid()
        let timestamp = now_iso()
        @gen.insert_reading(
          db,
          @gen.InsertReadingParams::new(
            id,
            user_id,
            Some(book_row.id),
            book_row.title,
            book_row.authors,
            Some("tsundoku"),
            Some(int64_from_int(0)),
            match book_row.page_count {
              Some(v) => Some(v)
              None => Some(int64_from_int(0))
            },
            Some(""),
            book_row.google_books_id,
            None,
            Some(timestamp),
            Some(timestamp),
          ),
        )
        let reading = @gen.get_reading_by_id(
          db,
          @gen.GetReadingByIdParams::new(id, user_id),
        ).unwrap()
        upsert_fts(
          db,
          "reading",
          reading.id,
          reading.user_id,
          reading_search_text(reading.title, reading.author, reading.memo),
        )
        ctx.json(
          Json::object({
            "reading": reading_row_to_json(reading),
            "book": book_row_to_json(book_row),
          }),
          status=201,
        )
      }
    }
  }
}

///|
async fn handle_get_reading(ctx : @mars.Context) -> Unit raise Error {
  if !require_auth(ctx) {
    ()
  } else if get_db() is None {
    ctx.json(
      Json::object({ "error": Json::string("Database not configured") }),
      status=500,
    )
  } else {
    let db = get_db().unwrap()
    let user_id = get_user_id(ctx).unwrap()
    let id = ctx.param("id").unwrap_or("")
    match @gen.get_reading_by_id(
      db,
      @gen.GetReadingByIdParams::new(id, user_id),
    ) {
      Some(reading) =>
        ctx.json(Json::object({ "reading": reading_row_to_json(reading) }))
      None => ctx.json(Json::object({ "error": Json::string("Not found") }), status=404)
    }
  }
}

///|
async fn handle_patch_reading(ctx : @mars.Context) -> Unit raise Error {
  if !require_auth(ctx) {
    ()
  } else if get_db() is None {
    ctx.json(
      Json::object({ "error": Json::string("Database not configured") }),
      status=500,
    )
  } else if ctx.body_json() is None {
    ctx.json(Json::object({ "error": Json::string("Invalid JSON body") }), status=400)
  } else {
    let db = get_db().unwrap()
    let user_id = get_user_id(ctx).unwrap()
    let id = ctx.param("id").unwrap_or("")
    let body = ctx.body_json().unwrap()
    if @gen.get_reading_by_id(
      db,
      @gen.GetReadingByIdParams::new(id, user_id),
    ) is None {
      ctx.json(Json::object({ "error": Json::string("Not found") }), status=404)
    } else {
      let current = @gen.get_reading_by_id(
        db,
        @gen.GetReadingByIdParams::new(id, user_id),
      ).unwrap()
      let status_field = optional_string_field(body, "status")
      if status_field is Some(s) && !is_valid_status(s) {
        ctx.json(Json::object({ "error": Json::string("Invalid status") }), status=400)
      } else {
        let status_in_body = status_field is Some(_)
        let next_status = opt_status(status_field, current.status)
        let finished_at = resolve_finished_at(
          current.status,
          current.finished_at,
          next_status,
          status_in_body,
          now_iso(),
        )
        let updated_at = now_iso()
        @gen.update_reading(
          db,
          @gen.UpdateReadingParams::new(
            opt_string(optional_string_field(body, "bookId"), current.book_id),
            opt_string(optional_string_field(body, "title"), current.title),
            opt_string(optional_string_field(body, "author"), current.author),
            next_status,
            match optional_int_field(body, "currentPage") {
              Some(v) => Some(int64_from_int(v))
              None => current.current_page
            },
            match optional_int_field(body, "totalPages") {
              Some(v) => Some(int64_from_int(v))
              None => current.total_pages
            },
            Some(opt_string(optional_string_field(body, "memo"), current.memo).unwrap_or("")),
            opt_string(optional_string_field(body, "googleBooksId"), current.google_books_id),
            finished_at,
            Some(updated_at),
            id,
            user_id,
          ),
        )
        let updated = @gen.get_reading_by_id(
          db,
          @gen.GetReadingByIdParams::new(id, user_id),
        ).unwrap()
        upsert_fts(
          db,
          "reading",
          updated.id,
          updated.user_id,
          reading_search_text(updated.title, updated.author, updated.memo),
        )
        ctx.json(Json::object({ "reading": reading_row_to_json(updated) }))
      }
    }
  }
}

///|
async fn handle_delete_reading(ctx : @mars.Context) -> Unit raise Error {
  if !require_auth(ctx) {
    ()
  } else if get_db() is None {
    ctx.json(
      Json::object({ "error": Json::string("Database not configured") }),
      status=500,
    )
  } else {
    let db = get_db().unwrap()
    let user_id = get_user_id(ctx).unwrap()
    let id = ctx.param("id").unwrap_or("")
    if @gen.get_reading_by_id(
      db,
      @gen.GetReadingByIdParams::new(id, user_id),
    ) is None {
      ctx.json(Json::object({ "error": Json::string("Not found") }), status=404)
    } else {
      delete_fts(db, "reading", id)
      @gen.delete_reading(db, @gen.DeleteReadingParams::new(id, user_id))
      ctx.text("", status=204)
    }
  }
}
