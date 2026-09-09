locals {
  api_script_name = "${var.project_name}-api"
  pages_domain    = "${var.project_name}.pages.dev"
  effective_cors_origin = var.cors_origin != "" ? var.cors_origin : "https://${local.pages_domain}"

  public_api_url = var.api_hostname != "" ? "https://${var.api_hostname}" : (
    var.workers_dev_subdomain != "" ?
    "https://${local.api_script_name}.${var.workers_dev_subdomain}.workers.dev" :
    "https://${local.api_script_name}.<workers-dev-subdomain>.workers.dev"
  )

  access_domains = compact([
    local.pages_domain,
    var.api_hostname != "" ? var.api_hostname : (
      var.workers_dev_subdomain != "" ?
      "${local.api_script_name}.${var.workers_dev_subdomain}.workers.dev" :
      null
    )
  ])
}
