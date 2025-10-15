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

## 🚀 Production Deployment

ChoreQuest can be deployed using three different Supabase options. All options use the same ChoreQuest Docker container, which automatically initializes the database on first run.

### Prerequisites

- Docker and Docker Compose installed
- Git (for cloning the repository)

### Deployment Options

#### Option A: Local Supabase CLI (Development/Testing)

**Best for:** Quick local development and testing

```bash
# 1. Start local Supabase
npx supabase start

# 2. Get credentials
npx supabase status
# Copy: API URL, anon key, service_role key

# 3. Configure ChoreQuest
cp .env.production.example .env.production
# Edit .env.production with credentials from step 2

# 4. Build and deploy ChoreQuest
docker compose --env-file .env.production -f docker-compose.prod.yml build
docker compose --env-file .env.production -f docker-compose.prod.yml up -d

# 5. Access application
# ChoreQuest: http://localhost:3000
# Database auto-initializes on first run
```

#### Option B: Hosted Supabase (supabase.com)

**Best for:** Production deployments without infrastructure management

```bash
# 1. Create Supabase project
# Go to https://supabase.com and create a new project

# 2. Get credentials from Supabase Dashboard
# Project Settings → API
# Copy: Project URL, anon/public key, service_role key
# ⚠️ Use "anon key" not "publishable key" (JWT format: eyJ...)

# 3. Run database migrations
# In Supabase Dashboard → SQL Editor
# Copy and run each migration from supabase/migrations/*.sql in order

# 4. Configure ChoreQuest
cp .env.production.example .env.production
# Edit .env.production with credentials from step 2

# 5. Build and deploy ChoreQuest
docker compose --env-file .env.production -f docker-compose.prod.yml build
docker compose --env-file .env.production -f docker-compose.prod.yml up -d

# 6. Access application
# ChoreQuest: http://localhost:3000
```

#### Option C: Self-Hosted Supabase Docker (Full Control)

**Best for:** Production deployments with full infrastructure control

This is a **two-step process**: First deploy Supabase, then deploy ChoreQuest.

**Quick Start (Docker Compose for everything)**

```bash
# In one terminal: run Supabase stack
cd supabase-docker
cp .env.example .env  # edit secrets before production!
docker compose up -d

# In a second terminal: deploy ChoreQuest app
cd ..
cp .env.production.example .env.production  # add Supabase credentials
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build

# Verify both stacks
docker compose -f supabase-docker/docker-compose.yml ps
docker compose --env-file .env.production -f docker-compose.prod.yml ps
```

**Step 1: Deploy Supabase**

```bash
# 1. Configure Supabase
cd supabase-docker
cp .env.example .env
# Edit .env and CHANGE DEFAULT PASSWORDS!

# 2. Start Supabase
docker compose up -d

# Wait 30-60 seconds for services to start
docker compose ps  # Verify all services are healthy

# 3. Access Supabase Studio
# Open: http://localhost:8000
# Login: supabase / this_password_is_insecure_and_should_be_updated
# ⚠️ Change these credentials immediately!

# 4. Get API credentials from .env file
# The keys are already in your supabase-docker/.env file
cd supabase-docker
cat .env | grep -E "ANON_KEY=|SERVICE_ROLE_KEY="
# Copy these JWT tokens (starting with eyJ...)
```

**Step 2: Deploy ChoreQuest**

```bash
# 5. Configure ChoreQuest
cd ..  # Back to project root
cp .env.production.example .env.production

# Edit .env.production with the following:
# IMPORTANT: Client needs localhost, server needs container name
NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000  # For browser
SUPABASE_INTERNAL_URL=http://supabase-kong:8000  # For server-side migrations
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key-from-supabase/.env>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key-from-supabase/.env>

# 6. Build ChoreQuest with Supabase credentials
docker compose --env-file .env.production -f docker-compose.prod.yml build

# 7. Deploy ChoreQuest
docker compose --env-file .env.production -f docker-compose.prod.yml up -d

# 8. Verify deployment
# ChoreQuest: http://localhost:3000
# Supabase Studio: http://localhost:8000
# Database auto-initializes and migrates on first run
```

#### Local Smoke Test Checklist

Use this checklist before promoting a release:

1. `docker compose -f supabase-docker/docker-compose.yml ps` shows all Supabase containers as `healthy`.
2. `docker compose --env-file .env.production -f docker-compose.prod.yml ps` shows the `app` container as `healthy`.
3. `docker compose --env-file .env.production -f docker-compose.prod.yml logs -f app` includes `Prisma schema loaded` and `Database migrations complete`.
4. Visit `http://localhost:3000/api/health` and confirm the JSON response reports `"status":"ok"` and `"version":"0.2.0"`.
5. Run `npm run test` locally for regression coverage (optional but recommended).

### Portainer Deployment

**Works with all three Supabase options**

1. **Setup Supabase** (choose your option):
   - Option A: Run `npx supabase start` on your server
   - Option B: Create project at supabase.com
   - Option C: Deploy Supabase stack in Portainer first

2. **Get Supabase credentials** (see option-specific instructions above)

3. **Deploy ChoreQuest in Portainer**:
   - Stacks → Add Stack
   - Name: `chorequest`
   - Build method: **Repository**
   - Repository URL: `https://github.com/your-org/ChoreQuest`
   - Compose path: `docker-compose.prod.yml`

4. **Add Environment Variables**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
   ```

5. **Deploy Stack**

6. **Verify**: Access ChoreQuest at `http://your-server:3000`

### Important Notes

⚠️ **Supabase Keys:** Always use the "anon key" from Supabase, NOT the "publishable key". The correct key is a JWT token (3 parts separated by dots, starting with `eyJ...`).

⚠️ **Security:** For production deployments:
- Change all default passwords (Option C)
- Use HTTPS with SSL/TLS certificates
- Set up regular database backups
- Review and secure all environment variables
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
