///|
pub let access_email_header = "Cf-Access-Authenticated-User-Email"

///|
pub let user_id_key = "userId"

///|
pub fn get_user_id(ctx : @mars.Context) -> String? {
  ctx.get(user_id_key)
}

///|
pub fn require_auth(ctx : @mars.Context) -> Bool {
  match ctx.header(access_email_header) {
    Some(email) => {
      if email.length() == 0 {
        ctx.json(
          Json::object({ "error": Json::string("Unauthorized") }),
          status=401,
        )
        false
      } else {
        ctx.set(user_id_key, email)
        true
      }
    }
    None => {
      ctx.json(
        Json::object({ "error": Json::string("Unauthorized") }),
        status=401,
      )
      false
    }
  }
}
