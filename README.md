# ChoreQuest

ChoreQuest turns household responsibilities into a co-op RPG. Families create guilds, craft recurring quest lines, and earn in-game rewards for staying on top of chores. The repository includes working Docker + Supabase configuration using placeholder domains (e.g. `app.example.com`, `supabase.example.com`) so you can mirror the setup without leaking production credentials.

## Highlights
- **RPG-first UX** – Character classes, XP, gold, gems, streak bonuses, and boss encounters.
- **Recurring quest engine** – Templates generate daily/weekly quest instances with anti-dup safeguards.
- **Real-time collaboration** – Live claiming, releasing, and reassignment flows for family quests.
- **Robust auth & data layer** – Supabase Auth, PostgREST, Realtime, Storage, and Supavisor pooling.
- **Automated migrations** – On container startup the app runs checked-in Supabase SQL migrations before Next.js starts, with optional demo seeding toggled via `ENABLE_DB_BOOTSTRAP`.

## Tech Stack
- **App**: Next.js 15 (React 19), TypeScript, Tailwind, Radix UI.
- **Data**: Supabase (Postgres 15.8 + Supavisor + pgCron), Prisma ORM.
- **Realtime & Cron**: Supabase Realtime, server-side cron jobs hitting Next.js API routes.
- **Ops**: Docker, Docker Compose, Playwright/Jest test suites.

## Repository Map
- `app/`, `components/`, `lib/`, `hooks/`, `types/` – Next.js application.
- `prisma/` – Schema & migrations executed via Prisma + Supabase.
- `supabase-docker/` – Self-hosted Supabase compose stack and helper assets.
- `docker-compose.prod.yml` – Production deployment for the Next.js app (expects external Supabase).
- `.env*` – Working environment references matching the live deployment.

## Environment Overview

| Variable | Purpose | Working Value |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public URL browsers use | `https://supabase.example.com` |
| `SUPABASE_INTERNAL_URL` | Server-to-Supabase traffic; falls back to `SUPABASE_URL` | `https://supabase.example.com` |
| `SUPABASE_URL` | CLI/tests fallback for server usage | `https://supabase.example.com` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon JWT signed with `JWT_SECRET` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role JWT | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `JWT_SECRET` | JWT signing secret shared with Supabase stack | `your-super-secret-jwt-token-with-at-least-32-characters-long` |
| `POSTGRES_PASSWORD` | Supabase Postgres superuser password | `your-super-secret-and-long-postgres-password` |
| `DIRECT_DB_HOST`, `DIRECT_DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Direct Postgres target for startup migrations from inside the app container | `supabase-db`, `5432`, `postgres`, `postgres`, same password as above |
| `APP_HOST_BIND`, `PORT` | Optional host interface bind prefix and host port for the Next.js container | `10.10.50.2:`, `5555` |
| `NEXTAUTH_URL` | Public URL for callbacks and cron | `https://app.example.com` |
| `CRON_SECRET` | Auth token for scheduled quest jobs | `generate-a-long-random-string-here` |
| `ENABLE_DB_BOOTSTRAP` | Runs seed data after migrations when explicitly enabled | `true` |
| `SUPABASE_VOLUME_ROOT` | Host path where Supabase SQL/config assets live | `/path/to/supabase/volumes` |

All environment templates (`.env`, `.env.example`, `.env.dev.example`, `.env.production`, `.env.production.example`, and `supabase-docker/.env.example`) use placeholder domains and secrets—replace them with the values from your own Supabase deployment before going live.

## Local Development

1. **Clone & install**
   ```bash
   npm install
   ```
2. **Create `.env`**
   ```bash
   cp .env.example .env
   ```
   The default values point at the placeholder domain `supabase.example.com`. Swap in your actual Supabase URLs/keys for development.
3. **Apply local Supabase migrations when schema files change**
   ```bash
   npm run db:migrate:local
   ```
   This runs `npx supabase db push --local` against the local Supabase CLI stack, so it does not require `supabase link` or a globally installed Supabase CLI. Use `npm run db:reset:local` only when you intentionally want to reset local data; it runs `npx supabase db reset --local`.
4. **Start the dev server**
   ```bash
   npm run dev
   ```
   `npm run dev` runs a local-only Supabase migration preflight first. The preflight resolves the same admin target used by `scripts/admin-start-season.ts` (`SUPABASE_INTERNAL_URL`, then `SUPABASE_URL`, then `NEXT_PUBLIC_SUPABASE_URL`), applies pending local migrations with `npm run db:migrate:local`, and then checks the admin target with `SUPABASE_SERVICE_ROLE_KEY`. This keeps dev startup from claiming the seasons schema is ready while `supabase/migrations/20260326000001_add_seasons.sql` is still pending. If the local migration apply or schema check fails, fix that before relying on admin tooling. Remote/staging/production Supabase URLs are not probed or migrated by this dev-startup check; set `CHOREQUEST_SKIP_SUPABASE_PREFLIGHT=1` only if you deliberately need to bypass it.
5. Visit [http://localhost:3000](http://localhost:3000). Authentication and data flows will proxy against the configured Supabase instance.

## Self-Hosted Supabase (supabase-docker/)

The `supabase-docker` directory mirrors the official Supabase Docker stack with the exact versions currently deployed.

1. **Copy env template**
   ```bash
   cd supabase-docker
   cp .env.example .env
   ```
   - Update `POSTGRES_PASSWORD`, `JWT_SECRET`, `ANON_KEY`, `SERVICE_ROLE_KEY`, and `PG_META_CRYPTO_KEY` for your environment.
   - Set `SUPABASE_VOLUME_ROOT` to the host directory containing Supabase SQL/config assets (for example `/path/to/supabase/volumes`).
2. **Populate volumes**
   - Download the `volumes/` directory from the Supabase repository release you are targeting.
   - Copy the `db`, `api`, `pooler`, `storage`, `functions`, and `logs` assets into the folder referenced by `SUPABASE_VOLUME_ROOT`.
3. **Start Supabase**
   ```bash
   docker compose up -d
   ```
4. **Verify health**
   ```bash
   docker compose ps
   docker compose logs -f kong
   ```
5. **Studio access**
   - Supabase Studio: `https://supabase.example.com` (proxied by your reverse proxy)
   - Default credentials live in `supabase-docker/.env.example`. Change them immediately in production.
6. **Network**
   - Docker creates a `supabase_default` network. The ChoreQuest production compose file joins this network for secure, container-to-container traffic.

To upgrade Supabase in-place:
```bash
docker compose pull
docker compose up -d
```

## Production Deployment (Next.js App)

1. **Create the production env file**
   ```bash
   cp .env.production.example .env.production
   ```
   Ensure the Supabase values match the running Supabase stack. `SUPABASE_INTERNAL_URL` is for server-side Supabase HTTP/API calls through Kong; startup migrations use direct `psql` traffic instead. For the bundled self-hosted stack, keep `DIRECT_DB_HOST=supabase-db` and `DIRECT_DB_PORT=5432` so the app container reaches the database container on the shared `supabase_default` network. Do not use the host-published Postgres port (`5553`) for this container-to-container migration path. If production should listen only on the trusted host interface, set `APP_HOST_BIND=10.10.50.2:` with the trailing colon instead of carrying an uncommitted compose-file edit.
2. **Build & start the container**
   ```bash
   docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
   ```
3. **Health checks**
   ```bash
   docker compose --env-file .env.production -f docker-compose.prod.yml ps
   docker compose --env-file .env.production -f docker-compose.prod.yml logs -f app
   curl -I https://app.example.com/api/health
   ```
   Docker health probes `http://127.0.0.1:3000/api/health` from inside the
   container. The app still listens on `0.0.0.0:3000`; the explicit IPv4
   loopback avoids false unhealthy results on hosts/images where `localhost`
   resolves to `::1` before IPv4.
4. **Cron jobs**
   - Set `CRON_SECRET` in `.env.production`.
   - Configure your scheduler (e.g., systemd timer, GitHub Actions, managed cron) to hit:
     ```
     POST https://app.example.com/api/cron/generate-quests
     POST https://app.example.com/api/cron/expire-quests
     Authorization: Bearer <CRON_SECRET>
     ```

## Operations Playbook
- **Rotate secrets** – Update `supabase-docker/.env` and `.env.production`, regenerate anon/service keys tied to the new `JWT_SECRET`, then redeploy.
- **Backups** – From the Docker host, run `pg_dump` against the host-published Supabase Postgres port (`localhost:5553`, or the bound host interface) or configure Supabase WAL backups. From containers on `supabase_default`, use the direct service address `supabase-db:5432`.
- **Startup migrations** – The app container runs checked-in SQL migrations with `psql` before starting Next.js. A bad direct-DB target now fails startup rather than silently skipping migrations. If migrations must be handled externally for a deployment, set `SKIP_DB_MIGRATIONS=true` deliberately and document the external migration step.
- **Monitoring** – Supabase Logflare is exposed on `5552`. Pin dashboards or forward logs to your observability stack.
- **Image updates** – Pull the latest tags listed in `supabase-docker/docker-compose.yml` and rebuild the ChoreQuest app container when Next.js dependencies change.

### Safe season upgrade and start-new-season checklist

> **Do not deploy season-aware achievement evaluation until the seasons migration has been applied and the target family has been started/reset for the new season.** If the app evaluates old quest history before migration + start-season/reset are complete, users may unlock a large batch of historical achievements at once.

Use this checklist when promoting the season-aware achievement changes or starting a fresh achievement season:

1. **Apply the database migration before deployment or admin reset work.**
   - Local/dev Supabase CLI stack:
     ```bash
     npm run db:migrate:local
     ```
     This runs `npx supabase db push --local` and applies pending files such as `supabase/migrations/20260326000001_add_seasons.sql` without requiring a linked remote project.
   - Production/staging: apply the same checked-in migration through your normal Supabase migration process before rebuilding or restarting the app. Do not run ad-hoc production SQL from this README, and do not paste service-role credentials into shell history.

2. **Verify the admin script points at the intended Supabase target.**
   - `scripts/admin-start-season.ts` loads `.env.local` and `.env`, then uses the service-role Supabase client. Confirm `SUPABASE_INTERNAL_URL`/`SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are for the intended environment before running any apply command.
   - For local development, `npm run dev` runs `npm run db:preflight:local` first; that preflight applies pending local migrations and verifies the seasons schema against the same admin target.

3. **Discover the family id.**
   ```bash
   npx tsx scripts/admin-start-season.ts --list-families
   ```
   Copy the desired family UUID from the dry-run discovery output.

4. **Optionally discover users in that family.** Use this only when you want a targeted reset instead of the family-wide path:
   ```bash
   npx tsx scripts/admin-start-season.ts --family-id <family-uuid> --list-family-users
   ```

5. **Dry-run the start-season reset.** Choose exactly one reset-target mode:
   - Family-wide reset for every character in the family; explicit user ids are not required:
     ```bash
     npx tsx scripts/admin-start-season.ts \
       --family-id <family-uuid> \
       --name "Season 2" \
       --starts-at now \
       --all-users \
       --dry-run
     ```
   - Targeted reset for selected users only:
     ```bash
     npx tsx scripts/admin-start-season.ts \
       --family-id <family-uuid> \
       --name "Season 2" \
       --starts-at now \
       --reset-user <user-uuid> \
       --reset-user <another-user-uuid> \
       --dry-run
     ```
   The script rejects combining `--all-users` with `--reset-user`/`--user-id`; use either the family-wide path or the targeted path, not both.

6. **Review the audit output before applying.** Confirm the family, new season name, previous active seasons, target characters, and the `gold preserved <before>-><after>` lines are what you expect. The reset clears season-derived state such as XP, level, gems, honor, active family quest, and quest streaks while preserving spendable gold.

7. **Apply only after the dry run is correct.**
   ```bash
   npx tsx scripts/admin-start-season.ts \
     --family-id <family-uuid> \
     --name "Season 2" \
     --starts-at now \
     --all-users \
     --apply \
     --confirm-start-season-reset
   ```
   Use the targeted `--reset-user ...` form instead of `--all-users` if step 5 used selected users. `--apply` requires `--confirm-start-season-reset`; discovery helpers are dry-run only.

8. **Only then deploy/restart the season-aware app.** After migration + reset are complete, rebuild or restart the app through the normal production deployment process and monitor achievement activity for unexpected unlock bursts.

## Testing & QA
- `npm run lint` – ESLint + TypeScript checks.
- `npm run test` – Unit/integration tests (Jest).
- `npm run test:e2e` – End-to-end flow (Playwright).
- `npm run db:seed` – Seeds demo data; rerun after `db:reset`.

## Admin Scripts

A set of utility scripts are available in `scripts/` for administrative tasks and auditing. These can be run via `npx tsx scripts/<script-name>.ts`.

- **Audit Gold (Reconstruction)**: Reconstructs a user's theoretical gold balance by summing all approved quests and redemptions, comparing it to their current stored balance.
  ```bash
  npx tsx scripts/audit-gold-recalc.ts "Username"
  ```

- **Set Gold Balance**: Manually sets a user's gold balance and logs a transaction record (type: `BONUS_AWARD`).
  ```bash
  npx tsx scripts/admin-set-gold.ts "Username" <amount> "Reason for change"
  ```

## License

MIT © Brian Lucas. See `LICENSE` for details.
