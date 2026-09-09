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
  description = "Workers script name for the API stub."
  value       = cloudflare_workers_script.api.script_name
}

output "public_api_url" {
  description = "PUBLIC_API_URL value to set on Pages (also written to deployment_configs)."
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

output "migration_command" {
  description = "Command to apply D1 schema migrations after terraform apply."
  value       = "wrangler d1 execute ${cloudflare_d1_database.main.name} --remote --file=${path.module}/migrations/0001_init.sql"
}
