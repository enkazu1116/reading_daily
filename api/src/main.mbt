// MoonBit-first Cloudflare Worker for reading_daily API.
// Registers globalThis.__appServerFetch via extern "js"; src/worker.ts forwards requests.

///|
async fn handle_health(ctx : @mars.Context) -> Unit raise Error {
  ctx.json(Json::object({ "ok": Json::boolean(true) }))
}

///|
async fn cors_middleware(ctx : @mars.Context) -> Unit raise Error {
  let origin = cors_origin()
  ctx.set_header("Access-Control-Allow-Origin", origin)
  ctx.set_header("Access-Control-Allow-Credentials", "true")
  if ctx.meth() == @http.RequestMethod::Options {
    ctx.set_header(
      "Access-Control-Allow-Methods",
      "GET, POST, PATCH, DELETE, OPTIONS",
    )
    ctx.set_header(
      "Access-Control-Allow-Headers",
      "Content-Type, Cf-Access-Authenticated-User-Email",
    )
    ctx.set_header("Access-Control-Max-Age", "86400")
    ctx.text("", status=204)
  }
}

///|
async fn not_found(ctx : @mars.Context) -> Unit raise Error {
  ctx.json(Json::object({ "error": Json::string("Not found") }), status=404)
}

///|
fn build_app() -> @mars.Server {
  let app = @mars.Server::new()
  app.middleware(@mars.handler(cors_middleware))
  app.get("/health", @mars.handler(handle_health))
  app.get("/readings", @mars.handler(handle_list_readings))
  app.post("/readings", @mars.handler(handle_create_reading))
  app.post("/readings/from-book", @mars.handler(handle_create_reading_from_book))
  app.get("/readings/:id", @mars.handler(handle_get_reading))
  app.patch("/readings/:id", @mars.handler(handle_patch_reading))
  app.delete("/readings/:id", @mars.handler(handle_delete_reading))
  app.get("/books/search", @mars.handler(handle_books_search))
  app.get("/search", @mars.handler(handle_search))
  app.get("/stats", @mars.handler(handle_stats))
  app.all("*", @mars.handler(not_found))
  app
}

///|
extern "js" fn register_cloudflare_fetch(handler : @mars.AppHandler) -> Unit =
  #| (handler) => {
  #|   globalThis.__appServerFetch = async (request, env, ctx) => {
  #|     globalThis.__appServerEnv = env ?? {};
  #|     globalThis.__appServerCtx = ctx;
  #|     return handler(request);
  #|   };
  #| }

///|
fn main {
  register_cloudflare_fetch(build_app().to_handler())
}
