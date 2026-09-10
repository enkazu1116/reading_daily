# Terraform creates the Worker shell + bindings on first apply.
# Production CODE is deployed from ../api (wrangler main = src/worker.ts → MoonBit).
# lifecycle.ignore_changes prevents terraform apply from clobbering wrangler deploys.

resource "cloudflare_workers_script" "api" {
  account_id          = var.account_id
  script_name         = local.api_script_name
  content_file        = "${path.module}/worker/worker.mjs"
  content_sha256      = filesha256("${path.module}/worker/worker.mjs")
  main_module         = "worker.mjs"
  compatibility_date  = var.compatibility_date
  compatibility_flags = ["nodejs_compat"]

  bindings = [
    {
      name = "DB"
      type = "d1"
      id   = cloudflare_d1_database.main.id
    },
    {
      name         = "CACHE"
      type         = "kv_namespace"
      namespace_id = cloudflare_workers_kv_namespace.cache.id
    },
    {
      name = "GOOGLE_BOOKS_API_KEY"
      type = "secret_text"
      text = var.google_books_api_key_placeholder
    },
    {
      name = "CORS_ORIGIN"
      type = "plain_text"
      text = local.effective_cors_origin
    }
  ]

  lifecycle {
    ignore_changes = [
      content_file,
      content_sha256,
      main_module,
    ]
  }

  depends_on = [
    cloudflare_d1_database.main,
    cloudflare_workers_kv_namespace.cache
  ]
}

resource "cloudflare_workers_script_subdomain" "api" {
  account_id       = var.account_id
  script_name      = cloudflare_workers_script.api.script_name
  enabled          = true
  previews_enabled = false
}

resource "cloudflare_workers_route" "api" {
  count = var.zone_id != "" && var.api_hostname != "" ? 1 : 0

  zone_id = var.zone_id
  pattern = "${var.api_hostname}/*"
  script  = cloudflare_workers_script.api.script_name
}
