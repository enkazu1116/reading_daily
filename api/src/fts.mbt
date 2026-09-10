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
  @gen.delete_fts(
    db,
    @gen.DeleteFtsParams::new(doc_type, doc_id),
  )
  let tokens = tokenize(text)
  if tokens.length() == 0 {
    return
  }
  @gen.insert_fts(
    db,
    @gen.InsertFtsParams::new(doc_type, doc_id, user_id, tokens),
  )
}

///|
pub async fn delete_fts(
  db : @cloudflare.D1Database,
  doc_type : String,
  doc_id : String,
) -> Unit raise @cloudflare.D1Error {
  @gen.delete_fts(db, @gen.DeleteFtsParams::new(doc_type, doc_id))
}
