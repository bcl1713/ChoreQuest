# ChoreQuest 🏰⚔️

A fantasy RPG-themed family chore management system that transforms household tasks into epic adventures. Built with modern web technologies and designed for families who want to gamify their daily routines.

## ✨ Features

### 🎮 Fantasy RPG Experience
- **Character Classes**: Choose from Knight, Mage, Ranger, Rogue, or Healer
- **Experience & Leveling**: Gain XP for completed tasks
- **Currency System**: Earn gold, gems, and honor points
- **Boss Battles**: Collaborative family challenges

### 👨‍👩‍👧‍👦 Family-Focused
- **Family Guilds**: Private groups with join codes
- **Role-Based Access**: Guild Master, Hero, and Young Hero roles
- **Real-time Updates**: Live activity feed for family interactions
- **SOS System**: Request and provide help between family members

### ♻️ Recurring Quest System
- **Quest Templates**: Build daily or weekly quest blueprints for individuals or the entire guild
- **Automated Generation**: Cron-backed jobs spawn quest instances every cycle with idempotent safeguards
- **Hero Claiming Flow**: Family quests can be claimed, released, or reassigned without leaving the dashboard
- **Streaks & Bonuses**: Track consecutive completions and apply volunteer/streak multipliers to rewards
- **Preset Library**: One-click starter templates covering common household chores

### 📱 Modern Tech Stack
- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS with fantasy theme
- **Database**: PostgreSQL with Prisma ORM
- **Real-time**: Socket.io for live updates
- **Testing**: Jest with Testing Library (TDD approach)
- **Infrastructure**: Docker for development environment

## 🚀 Getting Started

### 🐳 Quick Start for Production

ChoreQuest can be deployed in three ways depending on your needs:

- **Option A**: Local Supabase (fastest for development/testing)
- **Option B**: Hosted Supabase (easiest for production, no infrastructure)
- **Option C**: Self-hosted Supabase (full control, runs in Docker)

**👉 See the [Production Deployment](#-production-deployment) section below for complete step-by-step instructions for all three options, including Portainer deployment.**

### ✨ What Happens Automatically

When you deploy ChoreQuest with Docker:

1. **🗄️ Database Detection**: Automatically checks if database is initialized
2. **🔄 Migrations**: Runs all Supabase migrations if needed
3. **🌱 Demo Data**: Seeds demo family data on first run
4. **🔍 Health Checks**: Monitors application health
5. **🚀 Ready to Use**: Visit the URL and start creating your family guild!

### 🔧 Development Setup

For local development:

#### Prerequisites
- Node.js 20+
- Docker and Docker Compose
- Git

#### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # .env is automatically configured for local development
   ```
   - Set a unique value for `CRON_SECRET` so scheduled jobs can authenticate requests.
   - (Optional) Add `RECURRING_TEST_INTERVAL_MINUTES=15` to shorten cycles when demoing recurring quests locally.

3. **Start development services**
   ```bash
   # Start PostgreSQL and Redis
   npm run docker:dev

   # Generate Prisma client and run migrations
   npm run db:generate
   npm run db:migrate
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Visit the application**
   Open [http://localhost:3000](http://localhost:3000) to see ChoreQuest in action!

## 🔁 Recurring Quest System

### Core Concepts
- **Quest templates** define difficulty, rewards, recurrence pattern (`DAILY`, `WEEKLY`, or `CUSTOM`), and optional character assignments.
- **Quest instances** are generated each cycle with cached recurrence metadata so dashboards and streak logic never need to join templates.
- **Family quests** stay in `AVAILABLE` status until a hero claims them; individual quests spawn per assigned character automatically.

### Cron Scheduling
- `instrumentation.ts` boots `lib/cron-jobs.ts` when the server starts in a Node.js runtime; jobs run every five minutes.
- Requests to `/api/cron/generate-quests` and `/api/cron/expire-quests` require an `Authorization: Bearer <CRON_SECRET>` header.
- Set `NEXTAUTH_URL` (or `VERCEL_URL`) and `CRON_SECRET` in the environment so self-hosted deployments can reach the API routes.
- For manual backfills you can trigger the endpoints locally:
  ```bash
  curl -X POST http://localhost:3000/api/cron/generate-quests \
    -H "Authorization: Bearer $CRON_SECRET"
  ```
- Add `RECURRING_TEST_INTERVAL_MINUTES` to `.env` to shorten cycles during demos (e.g. `5` to regenerate quests every 5 minutes).

### API Surface
- `POST /api/quest-templates` / `PATCH /api/quest-templates/:id` / `DELETE /api/quest-templates/:id` for CRUD operations.
- `PATCH /api/quest-templates/:id/pause` toggles recurring templates without deleting them; `GET /api/quest-templates?familyId=...` lists active templates.
- `GET /api/quest-templates/presets` exposes curated starter templates that the dashboard surfaces.
- `POST /api/quests/:id/claim`, `/release`, and `/assign` manage family quest claiming, releasing, and GM assignments with anti-hoarding checks.
- `GET /api/streaks` and `GET /api/streaks/leaderboard?familyId=...` surface streak metrics for analytics dashboards.
- Cron routes (`/api/cron/generate-quests`, `/api/cron/expire-quests`) are idempotent and safe to run in parallel jobs.

### UI Enhancements
- **Quest Template Manager** lets Guild Masters create, edit, pause, or delete recurring templates inline.
- **Family Quest Claiming** panel shows heroes which family quests are available, claimed, or missed in real time.
- **Preset Template Library** provides one-click import of common chores grouped by household category.
- **Quest Conversion Wizard** upgrades ad-hoc quests into recurring templates without re-entering data.
- **Streak Display** highlights active streaks, volunteer bonuses, and longest-run achievements inside the dashboard.

### Analytics Hooks
- New Supabase SQL helpers—`get_completion_rate_by_template`, `get_most_missed_quests`, and `get_volunteer_patterns`—power the admin insights views.
- `character_quest_streaks` table stores rolling streak counts and longest streaks per character/template pair.
- Volunteer and streak bonuses are cached on each quest instance so reward payouts remain deterministic during approvals.

## 📝 Available Scripts

### Development
- `npm run dev` - Start Next.js development server with Turbopack
- `npm run build` - Build production application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint code quality checks

### Database
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:reset` - Reset database to initial state
- `npm run db:seed` - Seed database with test data
- `npm run db:studio` - Open Prisma Studio GUI

### Docker
- `npm run docker:dev` - Start PostgreSQL and Redis containers
- `npm run docker:down` - Stop all containers

### Testing
- `npm run test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report

## 🏗️ Project Structure

```
ChoreQuest/
├── app/                    # Next.js app router pages
├── components/             # Reusable React components
│   ├── ui/                # Basic UI components
│   ├── game/              # Game-specific components
│   └── layout/            # Layout components
├── lib/                   # Utility libraries
│   ├── prisma.ts          # Database client
│   ├── auth.ts            # Authentication utilities
│   └── generated/         # Generated Prisma client
├── types/                 # TypeScript type definitions
├── utils/                 # Utility functions
├── hooks/                 # Custom React hooks
├── store/                 # State management
├── tests/                 # Test files
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration tests
│   └── e2e/               # End-to-end tests
├── prisma/                # Database schema and migrations
├── docker-compose.yml     # Docker development environment
└── docs/                  # Project documentation
```

## 🎯 Development Roadmap

### Phase 1: MVP (Current)
- [x] Project foundation and setup
- [x] Database schema design
- [x] Fantasy UI theme
- [x] Testing framework
- [ ] User authentication
- [ ] Basic quest system
- [ ] Character creation
- [ ] Family management

### Phase 2: Game Enhancement
- [ ] Avatar customization
- [ ] Real-time updates
- [ ] Boss battle system
- [ ] Achievement system
- [ ] Animated UI elements

### Phase 3: Social Features
- [ ] Leaderboard system
- [ ] SOS help requests
- [ ] Family activity feed
- [ ] Parent analytics dashboard

### Phase 4: Advanced Features
- [ ] Home Assistant integration
- [ ] Seasonal events
- [ ] Mobile PWA
- [ ] Advanced reporting

## 🧪 Testing Strategy

ChoreQuest follows Test-Driven Development (TDD) principles:

- **Unit Tests (70%)**: Individual components and functions
- **Integration Tests (25%)**: API endpoints and database operations
- **E2E Tests (5%)**: Complete user workflows

Target: **80%+ code coverage** across all modules.

## 🚀 Deployment (Preferred)

The recommended way to run ChoreQuest is a single-host Docker Compose stack that includes both Supabase and the app. It keeps everything local, mirrors production behaviour, and remains repeatable.

### Prerequisites

- Docker & Docker Compose
- Git
- A LAN IP or hostname that all of your devices can reach (e.g. `192.168.86.114`)

### 1. Set up Supabase

```bash
cd supabase-docker
cp .env.example .env
./bin/fetch-volumes.sh              # downloads Kong/Vector/config SQL assets
```

Edit `supabase-docker/.env`:

- Rotate every secret (`POSTGRES_PASSWORD`, `JWT_SECRET`, keys, dashboard creds, …).
- Replace all `localhost` references that face the outside world:
  ```
  SITE_URL=http://<your-host>:3000
  API_EXTERNAL_URL=http://<your-host>:8000
  SUPABASE_PUBLIC_URL=http://<your-host>:8000
  ADDITIONAL_REDIRECT_URLS=http://<your-host>:3000
  ```
- Adjust SMTP/OpenAI/etc. as needed.

Then launch Supabase:

```bash
docker compose up -d
docker compose ps                # wait until everything reports healthy
```

> Need to pin a specific Supabase release? Run `SUPABASE_REF=<git-ref> ./bin/fetch-volumes.sh` before `docker compose up`.

### 2. Configure ChoreQuest

```bash
cd ..
cp .env.production.example .env.production
```

Edit `.env.production` so the application and every client know where Supabase lives:

```
NEXT_PUBLIC_SUPABASE_URL=http://<your-host>:8000      # browsers/mobile devices
SUPABASE_INTERNAL_URL=http://supabase-kong:8000       # container-to-container traffic
SUPABASE_URL=http://<your-host>:8000                  # optional fallback for tests/CLI
NEXT_PUBLIC_SUPABASE_ANON_KEY=<copy from supabase-docker/.env>
SUPABASE_SERVICE_ROLE_KEY=<copy from supabase-docker/.env>
DB_PASSWORD=<same POSTGRES_PASSWORD as Supabase stack>

NEXTAUTH_URL=http://<your-host>:3000                  # must match the URL users visit
CRON_SECRET=<generate-a-strong-random-string>
```

### 3. Start ChoreQuest

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

### 4. Verify

```bash
docker compose -f supabase-docker/docker-compose.yml ps
docker compose --env-file .env.production -f docker-compose.prod.yml ps
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f app
```

- First boot runs migrations automatically. Health checks may show “unhealthy” until Supabase finishes initialising.
- Visit `http://<your-host>:3000/api/health` — expect `{ "status": "ok", "version": "0.2.0", … }`.
- Optionally run `npm run test` locally for extra assurance.

### 5. Daily Use

- App: `http://<your-host>:3000`
- Supabase Studio: `http://<your-host>:8000`
- Update or restart: rerun the same `docker compose … up -d` commands (include `--build` after pulling new code).

### Alternative Deployments

Hosted Supabase or the Supabase CLI still work — copy the relevant values into `.env.production` and skip the Supabase Docker stack. Portainer users can point a stack at this repo and provide the same environment variables.

#### Portainer Stack

1. Package the environment values you would normally place in `.env.production`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_INTERNAL_URL` (if you are also running Supabase in Portainer; otherwise omit)
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXTAUTH_URL`
   - `CRON_SECRET`
   - Any optional overrides (`SUPABASE_URL`, `DB_PASSWORD`, etc.)
2. In Portainer:
   - Stacks → **Add Stack** → enter a stack name (e.g. `chorequest`).
   - Choose the **Repository** method, supply `https://github.com/your-org/ChoreQuest`, and set `docker-compose.prod.yml` as the compose path.
   - Paste the environment variables collected in step 1.
3. Deploy the stack, then open the Portainer console for the Supabase services (if you are hosting Supabase there as well) and ensure the same LAN host/IP values are used so mobile devices stay authenticated.

⚠️ **Supabase Keys:** Always use the "anon key" from Supabase, NOT the "publishable key". The correct key is a JWT token (3 parts separated by dots, starting with `eyJ...`).

⚠️ **Security:** For production deployments:
- Change all default passwords (Option C)
- Use HTTPS with SSL/TLS certificates
- Set up regular database backups
- Review and secure all environment variables
- Testing from another device on your network? Set `NEXT_PUBLIC_SUPABASE_URL` to a reachable host/IP (e.g. `http://<server-ip>:8000`) while keeping `SUPABASE_INTERNAL_URL` pointed at the Docker service (`http://supabase-kong:8000`).
- Keep Docker images updated

⚠️ **Database Initialization:** The ChoreQuest container automatically:
- Detects if the database is initialized
- Runs all migrations from `supabase/migrations/` if needed
- Seeds demo data from `supabase/seed.sql` if needed
- Skips initialization if database already exists

### Troubleshooting

**Build fails with "Missing NEXT_PUBLIC_SUPABASE_URL"**
- Ensure your `.env.production` file has all required variables
- Variables must be set at build time (can't be added after building)

**"Invalid family code" for all codes**
- Check that you're using the "anon key" not "publishable key"
- Verify the key is a JWT token (starts with `eyJ...`)

**Database tables don't exist**
- Check container logs: `docker logs chorequest-app`
- Verify Supabase is running and accessible
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is correctly set

**Can't connect to Supabase**
- Verify Supabase URL is accessible from the container
- Check that Supabase services are running: `docker ps` (Option C)
- Test API: `curl <SUPABASE_URL>/rest/v1/`

**Need to reset the database? (Option C - Self-hosted)**

To completely reset the Supabase database and start fresh:

```bash
cd supabase-docker

# Stop containers and remove volumes
docker compose down -v

# Remove persistent data directory (requires sudo)
sudo rm -rf ./volumes/db/data

# Start fresh
docker compose up -d

# Restart ChoreQuest to re-run migrations
cd ..
docker restart chorequest-app
```

This will give you a clean database and re-run all migrations on the ChoreQuest app startup.

## 🎨 Design Philosophy

### Fantasy RPG Theme
- Medieval/fantasy color palette with gold, gems, and magical elements
- Typography using fantasy fonts (Cinzel, Orbitron)
- Consistent iconography with emojis and fantasy symbols
- Dark theme optimized for family evening use

### Family-First Design
- Multi-user experience within single household
- Positive reinforcement over punishment
- Age-appropriate interfaces for different family members
- Real-time collaboration features

## 🔧 Technology Choices

### Frontend
- **Next.js 15**: Latest App Router with Turbopack for fast development
- **React 19**: Modern React with concurrent features
- **TypeScript**: Full type safety throughout the application
- **Tailwind CSS**: Utility-first styling with custom fantasy theme

### Backend
- **PostgreSQL**: Robust relational database for complex family relationships
- **Prisma ORM**: Type-safe database operations with excellent DX
- **Redis**: Caching and session management
- **Socket.io**: Real-time bidirectional event-based communication

### Infrastructure
- **Docker**: Consistent development environment
- **GitHub Actions**: CI/CD pipeline (planned)
- **Vercel**: Serverless deployment (planned)

---

**Ready to transform your family's chores into epic adventures? The quest awaits!** 🏰✨
