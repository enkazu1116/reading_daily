resource "cloudflare_pages_project" "web" {
  account_id        = var.account_id
  name              = var.project_name
  production_branch = var.production_branch

  build_config = {
    build_command   = "npm run build"
    destination_dir = ".svelte-kit/cloudflare"
    root_dir        = "web"
  }

  deployment_configs = {
    production = {
      compatibility_date  = var.compatibility_date
      compatibility_flags = ["nodejs_compat"]
      env_vars = {
        PUBLIC_API_URL = {
          type  = "plain_text"
          value = local.public_api_url
        }
      }
      services = {
        API = {
          service = cloudflare_workers_script.api.script_name
        }
      }
    }
    preview = {
      compatibility_date  = var.compatibility_date
      compatibility_flags = ["nodejs_compat"]
      env_vars = {
        PUBLIC_API_URL = {
          type  = "plain_text"
          value = local.public_api_url
        }
      }
      services = {
        API = {
          service = cloudflare_workers_script.api.script_name
        }
      }
    }
  }

  depends_on = [cloudflare_workers_script.api]
}
