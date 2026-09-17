# Secrets are read from Infisical at plan/apply time (not from terraform.tfvars).
# Authenticate the Infisical provider via environment variables — see README.md.

provider "infisical" {
  # host defaults to https://app.infisical.com; set INFISICAL_HOST for self-hosted.
}

ephemeral "infisical_secret" "cloudflare_api_token" {
  name         = var.infisical_cloudflare_api_token_secret_name
  env_slug     = var.infisical_env_slug
  workspace_id = var.infisical_workspace_id
  folder_path  = var.infisical_secrets_folder
}
