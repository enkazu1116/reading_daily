provider "cloudflare" {
  api_token = ephemeral.infisical_secret.cloudflare_api_token.value
}
