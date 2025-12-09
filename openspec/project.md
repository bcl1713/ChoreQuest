# Project Context

## Purpose
ChoreQuest turns household responsibilities into a co-op RPG: families form guilds, craft recurring quest lines, and earn XP, gold, and rewards for completing chores with real-time collaboration.

## Tech Stack
- Next.js 15 (App Router) with React 19, TypeScript 5, Turbopack dev/build, Tailwind CSS 4, Headless UI, Framer Motion, and Lucide icons.
- Data layer: Supabase Postgres 15.8 (assume self-hosted Docker stack by default, hosted Supabase also works) with Auth, PostgREST, Realtime, Storage, pgCron, and Supavisor pooling; Prisma schema/migrations target the Supabase database (no separate Prisma DB).
- API/services: Next.js API routes using Supabase client + Zod validation; cron flows via `node-cron` hitting secure API endpoints bootstrapped in `instrumentation.ts`.
- Testing: Jest (unit/jsdom + integration/node via ts-jest), Testing Library, Playwright for e2e flows.
- Ops: Docker + Docker Compose for app and Supabase stacks (`supabase-docker/`), optional Redis, NGINX reverse proxy, env templates for dev/prod.

## Project Conventions

### Code Style
- TypeScript strict mode with `@/*` path alias; functional React components with hooks/contexts for state.
- ESLint extends `next/core-web-vitals` and `next/typescript`; run `npm run lint` and avoid `eslint-disable` unless explicitly justified.
- Tailwind utility-first styling; shared UI in `components/`, logic in `lib/`, hooks in `hooks/`, types in `types/`; prefer `data-testid` for DOM querying in tests.

### Architecture Patterns
- Next.js App Router with API routes under `app/api/**` for CRUD, cron endpoints, and Supabase interactions; mix of server/client components.
- Supabase is the source of truth with RLS enforcing family isolation; Prisma migrations keep schema in sync and bootstrap controlled via `ENABLE_DB_BOOTSTRAP`.
- Auth/realtime contexts provide sessions and live updates; quest/streak/reward logic lives in `lib/*` services consumed by dashboards/components.
- Cron jobs scheduled through `instrumentation.ts` → `lib/cron-jobs.ts` invoke Next.js API routes authenticated via `CRON_SECRET`; recurring quest engine generates/expires instances with streak + volunteer bonus handling.

### Testing Strategy
- TDD encouraged (red-green-refactor) before implementing fixes/features.
- Unit: `npm run test:unit` (Jest/jsdom) covering components/hooks/lib; integration: `npm run test:integration` (Jest/node, ts-jest) using `.env.local`.
- E2E: `npm run test:e2e` (Playwright) for critical user journeys.
- Quality gate before PRs: `npm run build && npm run lint && npm run test`; avoid skipped tests in CI.

### Git Workflow
- Gitflow: branch from `develop` for features/bugfixes/refactors; hotfixes branch from `main` for release-critical fixes.
- Branch naming: `feature/<name>`, `bugfix/<issue>-<name>`, `refactor/<name>`, `hotfix/<issue>-<name>`; do not commit directly to `main` or `develop`.
- Use PRs with squash merge after checks pass.

## Domain Context
- Gamified family chore platform: guild masters and heroes manage quests, approvals/denials, and rewards with RPG elements (XP, gold, gems, streaks, volunteer bonuses).
- Recurring quest templates generate daily/weekly instances with anti-dup safeguards; dashboards surface progress bars, leaderboards, and approval queues with realtime updates.
- Reward store supports redemption requests and approvals; streak tracking and quest history fuel family-level transparency.
- Self-hosted Supabase stack powers auth/storage/realtime; cron endpoints drive quest generation/expiration.

## Important Constraints
- `.env*` templates use placeholder `*.example.com` domains/keys—replace with real Supabase values before production; keep secrets out of the repo.
- RLS/family isolation assumptions must remain intact when altering data flows.
- Avoid adding `eslint-disable` directives without prior justification; prefer fixing lint violations.
- Cron routes require matching `CRON_SECRET` between scheduler and app; ensure bootstrap/seed (`ENABLE_DB_BOOTSTRAP`) is safe for the target environment.

## External Dependencies
- Supabase services (Auth, PostgREST, Realtime, Storage, pgCron, Supavisor) accessed via configured URLs/keys.
- Prisma CLI/migrations for schema management; Supabase Docker stack in `supabase-docker/` plus optional Redis.
- Node Cron calling internal Next.js API routes for scheduled tasks; JWT signing via `jsonwebtoken` for service/cron tokens.
- Docker Compose stacks for app + Supabase/Redis/NGINX; Let's Encrypt/NGINX expected in deployment environments.
