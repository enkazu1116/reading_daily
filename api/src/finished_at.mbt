///|
pub fn resolve_finished_at(
  existing_status : String?,
  existing_finished_at : String?,
  next_status : String?,
  status_in_body : Bool,
  now : String,
) -> String? {
  if !status_in_body {
    return existing_finished_at
  }
  let next = next_status.unwrap_or(existing_status.unwrap_or(""))
  let prev = existing_status.unwrap_or("")
  if next == "finished" && prev != "finished" {
    return Some(now)
  }
  if prev == "finished" && next != "finished" {
    return None
  }
  existing_finished_at
}

///|
pub fn is_valid_status(status : String) -> Bool {
  status == "tsundoku" || status == "reading" || status == "finished"
}
