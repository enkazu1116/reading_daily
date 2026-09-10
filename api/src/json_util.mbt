///|
pub fn reading_row_to_json(row : @readings.GetReadingByIdRow) -> Json {
  Json::object({
    "id": Json::string(row.id),
    "userId": Json::string(row.user_id),
    "bookId": optional_json_string(row.book_id),
    "title": optional_json_string(row.title),
    "author": optional_json_string(row.author),
    "status": optional_json_string(row.status),
    "currentPage": Json::number(int_from_int64_opt(row.current_page).to_double()),
    "totalPages": Json::number(int_from_int64_opt(row.total_pages).to_double()),
    "memo": Json::string(row.memo.unwrap_or("")),
    "googleBooksId": optional_json_string(row.google_books_id),
    "finishedAt": optional_json_string(row.finished_at),
    "createdAt": optional_json_string(row.created_at),
    "updatedAt": optional_json_string(row.updated_at),
  })
}

///|
pub fn list_reading_row_to_json(row : @readings.ListReadingsByUserRow) -> Json {
  Json::object({
    "id": Json::string(row.id),
    "userId": Json::string(row.user_id),
    "bookId": optional_json_string(row.book_id),
    "title": optional_json_string(row.title),
    "author": optional_json_string(row.author),
    "status": optional_json_string(row.status),
    "currentPage": Json::number(int_from_int64_opt(row.current_page).to_double()),
    "totalPages": Json::number(int_from_int64_opt(row.total_pages).to_double()),
    "memo": Json::string(row.memo.unwrap_or("")),
    "googleBooksId": optional_json_string(row.google_books_id),
    "finishedAt": optional_json_string(row.finished_at),
    "createdAt": optional_json_string(row.created_at),
    "updatedAt": optional_json_string(row.updated_at),
  })
}

///|
pub fn book_row_to_json(row : @books.GetBookByIdRow) -> Json {
  book_fields_to_json(
    row.id,
    row.google_books_id,
    row.title,
    row.authors,
    row.description,
    row.thumbnail_url,
    row.page_count,
    row.created_at,
  )
}

///|
pub fn book_google_row_to_json(row : @books.GetBookByGoogleBooksIdRow) -> Json {
  book_fields_to_json(
    row.id,
    row.google_books_id,
    row.title,
    row.authors,
    row.description,
    row.thumbnail_url,
    row.page_count,
    row.created_at,
  )
}

///|
fn book_fields_to_json(
  id : String,
  google_books_id : String?,
  title : String?,
  authors : String?,
  description : String?,
  thumbnail_url : String?,
  page_count : Int64?,
  created_at : String?,
) -> Json {
  Json::object({
    "id": Json::string(id),
    "google_books_id": optional_json_string(google_books_id),
    "title": optional_json_string(title),
    "authors": optional_json_string(authors),
    "description": optional_json_string(description),
    "thumbnail_url": optional_json_string(thumbnail_url),
    "page_count": match page_count {
      Some(v) => Json::number(int_from_int64(v).to_double())
      None => Json::null()
    },
    "created_at": optional_json_string(created_at),
  })
}

///|
pub fn search_result_to_json(row : @fts.SearchFtsRow) -> Json {
  Json::object({
    "doc_type": Json::string(row.doc_type),
    "doc_id": Json::string(row.doc_id),
    "user_id": Json::string(row.user_id),
  })
}
