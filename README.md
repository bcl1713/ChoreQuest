# ChoreQuest

ChoreQuest turns household responsibilities into a co-op RPG. Families create guilds, craft recurring quest lines, and earn in-game rewards for staying on top of chores. The repository includes working Docker + Supabase configuration using placeholder domains (e.g. `app.example.com`, `supabase.example.com`) so you can mirror the setup without leaking production credentials.

## Highlights
- **RPG-first UX** – Character classes, XP, gold, gems, streak bonuses, and boss encounters.
- **Recurring quest engine** – Templates generate daily/weekly quest instances with anti-dup safeguards.
- **Real-time collaboration** – Live claiming, releasing, and reassignment flows for family quests.
- **Robust auth & data layer** – Supabase Auth, PostgREST, Realtime, Storage, and Supavisor pooling.
- **Automated bootstrap** – On first boot the app runs Prisma migrations, syncs Supabase policies, and seeds demo data (toggle via `ENABLE_DB_BOOTSTRAP`).

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
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Prisma bootstrap credentials (point at Supabase Postgres) | `supabase-db`, `5553`, `postgres`, `postgres`, same password as above |
| `PORT` | Host port for the Next.js container | `5555` |
| `NEXTAUTH_URL` | Public URL for callbacks and cron | `https://app.example.com` |
| `CRON_SECRET` | Auth token for scheduled quest jobs | `generate-a-long-random-string-here` |
| `ENABLE_DB_BOOTSTRAP` | Runs migrations + seed on first boot | `true` |
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
3. **Run Prisma migrations + generate client (optional for read-only work)**
   ```bash
   npm run db:generate
   npm run db:migrate
   ```
4. **Start the dev server**
   ```bash
   npm run dev
   ```
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
   Ensure the Supabase values match the running Supabase stack.
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
- **Backups** – Run `pg_dump` against the Supabase Postgres service (`supabase-db:5553`) or configure Supabase WAL backups.
- **Monitoring** – Supabase Logflare is exposed on `5552`. Pin dashboards or forward logs to your observability stack.
- **Image updates** – Pull the latest tags listed in `supabase-docker/docker-compose.yml` and rebuild the ChoreQuest app container when Next.js dependencies change.

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
