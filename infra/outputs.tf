output "d1_database_id" {
  description = "D1 database UUID."
  value       = cloudflare_d1_database.main.id
}

output "d1_database_name" {
  description = "D1 database name."
  value       = cloudflare_d1_database.main.name
}

output "kv_namespace_id" {
  description = "KV namespace ID for Google Books / session cache."
  value       = cloudflare_workers_kv_namespace.cache.id
}

output "api_worker_name" {
  description = "Workers script name (deploy code from api/ via wrangler; main = src/worker.ts)."
  value       = cloudflare_workers_script.api.script_name
}

output "public_api_url" {
  description = "PUBLIC_API_URL value for Pages."
  value       = local.public_api_url
}

output "pages_project_name" {
  description = "Cloudflare Pages project name."
  value       = cloudflare_pages_project.web.name
}

output "pages_url" {
  description = "Default Pages hostname."
  value       = "https://${local.pages_domain}"
}

output "access_application_id" {
  description = "Cloudflare Access application ID."
  value       = cloudflare_zero_trust_access_application.app.id
}

output "api_deploy_command" {
  description = "Deploy MoonBit-first Worker (wrangler main = api/src/worker.ts)."
  value       = "cd api && npm install && moon update && npm run deploy"
}

output "migration_command" {
  description = "Apply D1 schema from api/ (source of truth)."
  value       = "cd api && npm run migrate:remote"
}
