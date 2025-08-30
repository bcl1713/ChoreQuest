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

### Prerequisites
- Node.js 20+
- Docker (optional, for database)
- Git

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database configuration
   ```

3. **Start development services**
   ```bash
   # With Docker (recommended)
   npm run docker:dev
   
   # Generate Prisma client
   npm run db:generate
   
   # Run database migrations (when you have a database)
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
