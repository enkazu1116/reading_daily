resource "cloudflare_zero_trust_access_policy" "allowlist" {
  account_id = var.account_id
  name       = "${var.project_name}-allowlist"
  decision   = "allow"
  precedence = 1

  dynamic "include" {
    for_each = var.access_allowed_emails
    content {
      email = {
        email = include.value
      }
    }
  }
}

resource "cloudflare_zero_trust_access_application" "app" {
  account_id = var.account_id
  name       = var.project_name
  type       = "self_hosted"
  domain     = local.pages_domain

  destinations = [
    for host in local.access_domains : {
      type = "public"
      uri  = host
    }
  ]

  policies = [
    {
      id         = cloudflare_zero_trust_access_policy.allowlist.id
      precedence = 1
    }
  ]

  session_duration = "24h"
}
