///|
pub fn reading_search_text(title : String?, author : String?, memo : String?) -> String {
  let parts : Array[String] = []
  if title is Some(v) && v.length() > 0 {
    parts.push(v)
  }
  if author is Some(v) && v.length() > 0 {
    parts.push(v)
  }
  if memo is Some(v) && v.length() > 0 {
    parts.push(v)
  }
  parts.join(" ")
}

///|
pub fn book_search_text(
  title : String?,
  authors : String?,
  description : String?,
) -> String {
  let parts : Array[String] = []
  if title is Some(v) && v.length() > 0 {
    parts.push(v)
  }
  if authors is Some(v) && v.length() > 0 {
    parts.push(v)
  }
  if description is Some(v) && v.length() > 0 {
    parts.push(v)
  }
  parts.join(" ")
}

///|
pub async fn upsert_fts(
  db : @cloudflare.D1Database,
  doc_type : String,
  doc_id : String,
  user_id : String,
  text : String,
) -> Unit raise @cloudflare.D1Error {
  @fts.delete_fts(
    db,
    @fts.DeleteFtsParams::new(doc_type, doc_id),
  )
  let tokens = tokenize(text)
  if tokens.length() == 0 {
    return
  }
  @fts.insert_fts(
    db,
    @fts.InsertFtsParams::new(doc_type, doc_id, user_id, tokens),
  )
}

///|
pub async fn delete_fts(
  db : @cloudflare.D1Database,
  doc_type : String,
  doc_id : String,
) -> Unit raise @cloudflare.D1Error {
  @fts.delete_fts(db, @fts.DeleteFtsParams::new(doc_type, doc_id))
}
