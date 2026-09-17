resource "cloudflare_zero_trust_access_policy" "allowlist" {
  account_id = var.account_id
  name       = "${var.project_name}-allowlist"
  decision   = "allow"

  # Provider v5 reusable policy: include is an attribute list (not a block).
  # precedence belongs on the application association, not here.
  include = [
    for addr in var.access_allowed_emails : {
      email = {
        email = addr
      }
    }
  ]
}

resource "cloudflare_zero_trust_access_application" "app" {
  account_id = var.account_id
  name       = var.project_name
  type       = "self_hosted"
  # Primary hostname; must already be owned by account_id (Pages project + workers.dev route).
  domain = local.pages_domain

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

  # Error 12130 ("domain does not belong to zone") occurs when Access is created
  # before the account owns the hostnames, or when account_id / workers_dev_subdomain
  # refer to different Cloudflare accounts.
  depends_on = [
    cloudflare_pages_project.web,
    cloudflare_workers_script_subdomain.api,
  ]
}
