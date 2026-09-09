resource "cloudflare_d1_database" "main" {
  account_id = var.account_id
  name       = var.project_name
}

resource "terraform_data" "d1_migrations" {
  count = var.apply_d1_migrations ? 1 : 0

  triggers_replace = {
    database_id  = cloudflare_d1_database.main.id
    migration    = filesha256("${path.module}/migrations/0001_init.sql")
    account_id   = var.account_id
  }

  provisioner "local-exec" {
    command = "${path.module}/scripts/apply-migrations.sh"
    environment = {
      CLOUDFLARE_ACCOUNT_ID = var.account_id
      CLOUDFLARE_API_TOKEN  = var.cloudflare_api_token
      D1_DATABASE_NAME      = cloudflare_d1_database.main.name
      MIGRATION_FILE        = "${path.module}/migrations/0001_init.sql"
    }
  }

  depends_on = [cloudflare_d1_database.main]
}
