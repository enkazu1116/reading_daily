variable "cloudflare_api_token" {
  description = "Cloudflare API token with Workers, Pages, D1, KV, and Zero Trust permissions."
  type        = string
  sensitive   = true
}

variable "account_id" {
  description = "Cloudflare account ID."
  type        = string
}

variable "zone_id" {
  description = "Cloudflare zone ID for custom-domain Worker routes and zone-scoped Access apps. Leave empty for account-level apps on pages.dev / workers.dev."
  type        = string
  default     = ""
}

variable "project_name" {
  description = "Base name for Pages, Workers, D1, and KV resources."
  type        = string
  default     = "reading-log"
}

variable "production_branch" {
  description = "Git branch deployed to Pages production."
  type        = string
  default     = "main"
}

variable "access_allowed_emails" {
  description = "Email addresses allowed through Cloudflare Access."
  type        = list(string)
}

variable "workers_dev_subdomain" {
  description = "Account workers.dev subdomain (Dashboard → Workers → workers.dev). Required when api_hostname is empty."
  type        = string
  default     = ""
}

variable "api_hostname" {
  description = "Optional custom API hostname (e.g. api.example.com). Requires zone_id and a matching Workers route."
  type        = string
  default     = ""
}

variable "compatibility_date" {
  description = "Workers runtime compatibility date."
  type        = string
  default     = "2024-09-01"
}

variable "google_books_api_key_placeholder" {
  description = "Placeholder value for GOOGLE_BOOKS_API_KEY secret binding. Replace via dashboard or wrangler secret put after apply."
  type        = string
  default     = "replace-me"
  sensitive   = true
}

variable "apply_d1_migrations" {
  description = "When true, run D1 migration SQL via wrangler after the database is created (requires wrangler CLI and CLOUDFLARE_API_TOKEN)."
  type        = bool
  default     = false
}

variable "cors_origin" {
  description = "Allowed CORS origin for the API Worker (Pages origin). Empty defaults to https://<project_name>.pages.dev."
  type        = string
  default     = ""
}
