# Supabase Self-Hosted Stack

The `supabase-docker` directory packages the official Supabase Docker stack with pinned image tags and configuration that matches the production-ready setup used for ChoreQuest. Domains and secrets in the examples use placeholders—swap them for your own values before deploying.

## 1. Prepare the Environment

```bash
cp .env.example .env
```

Update `.env` before starting the stack:

- `POSTGRES_PASSWORD`, `JWT_SECRET`, `ANON_KEY`, `SERVICE_ROLE_KEY`, `SECRET_KEY_BASE`, `VAULT_ENC_KEY`, `PG_META_CRYPTO_KEY` – generate fresh values for production.
- `SUPABASE_VOLUME_ROOT` – absolute path where the Supabase SQL/config assets live (for example `/path/to/supabase/volumes`).
- Replace every `localhost` URL (e.g. `SITE_URL`, `API_EXTERNAL_URL`, `SUPABASE_PUBLIC_URL`) with the public host you will expose.

The anon/service-role keys must be re-signed if you change `JWT_SECRET`.

## 2. Populate Volumes

The compose file expects the official Supabase `volumes/` directory structure. Download the matching release and copy the following directories into `SUPABASE_VOLUME_ROOT`:

- `db/` – SQL migrations (`jwt.sql`, `roles.sql`, `_supabase.sql`, etc.) and `data/` volume.
- `api/kong.yml` – Kong declarative config.
- `pooler/pooler.exs` – Supavisor pool definition.
- `storage/`, `functions/`, `logs/vector.yml`.

The repo keeps placeholders for reference; you must supply the full assets prior to boot.

## 3. Start Supabase

```bash
docker compose up -d
```

Docker creates a `supabase_default` network that the ChoreQuest app joins for internal traffic.

## 4. Verify Health

```bash
docker compose ps
docker compose logs -f kong
```

Services become healthy once Postgres finishes applying migrations (usually < 60 seconds).

## 5. Connectivity Reference

| Service | Host Port | Notes |
| --- | --- | --- |
| Kong Gateway / Supabase API | `5550` (HTTP), `5551` (HTTPS) | Reverse proxy to all Supabase services |
| Supabase Studio | `5550/studio` (proxied via Kong) | Configure DNS/SSL via your reverse proxy |
| Logflare (analytics) | `5552` | Useful for piping logs elsewhere |
| Postgres | `5553` | Connect as `postgres` using `POSTGRES_PASSWORD` |
| Supavisor (transaction pool) | `5554` | Use for pooled client connections |

When fronting the stack with Nginx/Traefik/Caddy, terminate TLS there and forward to `kong:8000` inside the Docker network.

## 6. Retrieve API Credentials

1. Open Supabase Studio (`https://<your-host>/project/<project-id>/settings/api`).
2. Copy the **Project URL**, **anon** key, and **service_role** key.
3. Mirror the values into the ChoreQuest `.env*` files (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`).

⚠️ Do **not** use the publishable key – the app requires the JWT-based anon key.

## 7. Maintenance

- **Update images**: `docker compose pull && docker compose up -d`.
- **Rotate secrets**: regenerate keys, update `.env`, and restart the affected services.
- **Backups**: run `pg_dump` against `supabase-db:5553` or enable WAL archiving.
- **Logs**: tail `docker compose logs -f <service>` or forward Logflare events.

## 8. Troubleshooting

- `docker compose logs -f db` – Postgres init issues (permissions, missing SQL files).
- `docker compose logs -f kong` – API routing and auth errors.
- `curl -I http://localhost:5550/health` – quickly test Kong.
- If health checks fail, confirm file permissions on everything under `SUPABASE_VOLUME_ROOT`.

## References

- [Supabase Self-Hosting Docs](https://supabase.com/docs/guides/self-hosting)
- [Supabase Docker Repository](https://github.com/supabase/supabase/tree/master/docker)
- [ChoreQuest README](../README.md) – application deployment guide.
