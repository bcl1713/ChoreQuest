---
id: 202508281550-Technical-Design-Documnent
aliases:
  - "ChoreQuest: Technical Design Document"
tags: []
---

# ChoreQuest: Technical Design Document

## Version 2.0

**Project**: ChoreQuest Fantasy Chore Management System  
**Architecture**: Full-Stack Web Application with Real-Time Features  
**Deployment Target**: Self-Hosted Docker Container  
**Development Approach**: Mobile-First Responsive Design

---

## 🏗️ System Architecture Overview

### High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Mobile/Web    │    │   Load Balancer  │    │  Home Assistant │
│    Clients      │◄──►│     (NGINX)      │◄──►│   Integration   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                       ┌────────▼────────┐
                       │   React/Next.js │
                       │    Frontend     │
                       └────────┬────────┘
                                │
                       ┌────────▼────────┐
                       │  Node.js/Express│
                       │   API Server    │
                       └────────┬────────┘
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                 │
    ┌─────────▼────────┐ ┌─────▼─────┐ ┌────────▼────────┐
    │   PostgreSQL     │ │   Redis   │ │   Socket.IO     │
    │   Database       │ │   Cache   │ │  WebSocket      │
    └──────────────────┘ └───────────┘ └─────────────────┘
```

### Core Components

**🖥️ Frontend (Client-Side)**

- **React 18 + Next.js 15**: Server-side rendering and static generation
- **Progressive Web App**: Installable web application with offline capabilities
- **Real-Time UI**: Socket.io client for live updates and notifications
- **Mobile-First Design**: Responsive across all device sizes

**⚙️ Backend (Server-Side)**

- **Node.js/Express API**: RESTful endpoints with TypeScript
- **GraphQL Layer**: Flexible data queries for complex family relationships
- **Socket.io Server**: WebSocket management for real-time features
- **Background Jobs**: Quest scheduling, notifications, and maintenance tasks

**💾 Data Layer**

- **PostgreSQL**: Primary database for all persistent data
- **Redis**: Session storage, caching, and real-time data
- **File Storage**: Avatar images and achievement badges (local filesystem)

**🔧 Infrastructure**

- **Docker Compose**: Containerized deployment and development
- **NGINX**: Reverse proxy, static file serving, and SSL termination
- **Let's Encrypt**: Automated SSL certificate management

---

## 🛠️ Technology Stack

### Frontend Technologies

**Core Framework**

```json
{
  "next": "^15.0.0",
  "react": "^18.3.0",
  "typescript": "^5.4.0",
  "@types/react": "^18.3.0"
}
```

**UI & Styling**

```json
{
  "tailwindcss": "^3.4.0",
  "framer-motion": "^11.0.0",
  "@headlessui/react": "^2.0.0",
  "lucide-react": "^0.263.1"
}
```

**State Management & Data Fetching**

```json
{
  "@tanstack/react-query": "^5.28.0",
  "zustand": "^4.5.0",
  "socket.io-client": "^4.7.0"
}
```

**PWA & Mobile Features**

```json
{
  "next-pwa": "^5.6.0",
  "workbox-webpack-plugin": "^7.0.0"
}
```

### Backend Technologies

**Core Server**

```json
{
  "express": "^4.19.0",
  "cors": "^2.8.5",
  "helmet": "^7.1.0",
  "compression": "^1.7.4",
  "typescript": "^5.4.0",
  "@types/express": "^4.17.21"
}
```

**Database & ORM**

```json
{
  "prisma": "^5.12.0",
  "@prisma/client": "^5.12.0",
  "pg": "^8.11.0",
  "@types/pg": "^8.11.0"
}
```

**Authentication & Security**

```json
{
  "jsonwebtoken": "^9.0.2",
  "bcrypt": "^5.1.0",
  "express-rate-limit": "^7.2.0",
  "express-validator": "^7.0.0"
}
```

**Real-Time & Background Processing**

```json
{
  "socket.io": "^4.7.0",
  "redis": "^4.6.0",
  "node-cron": "^3.0.3",
  "bull": "^4.12.0"
}
```

### Infrastructure & Deployment

**Containerization**

```dockerfile
# Docker Compose Services
- app (Next.js + Node.js)
- postgres (Database)
- redis (Cache & Sessions)
- nginx (Reverse Proxy)
```

**Development Tools**

```json
{
  "nodemon": "^3.1.0",
  "concurrently": "^8.2.0",
  "eslint": "^8.57.0",
  "prettier": "^3.2.0",
  "jest": "^29.7.0",
  "supertest": "^6.3.0"
}
```

---

## 🗄️ Database Design

### Core Schema Structure

**Users & Family Management**

```sql
-- Family structure and user management
CREATE TABLE families (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  invite_code VARCHAR(20) UNIQUE NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  family_id INTEGER REFERENCES families(id),
  role user_role NOT NULL DEFAULT 'player',
  display_name VARCHAR(50) NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE user_role AS ENUM ('guild_master', 'co_guild_master', 'hero', 'young_hero');

-- Character progression system
CREATE TABLE characters (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  class character_class NOT NULL,
  level INTEGER DEFAULT 1 CHECK (level > 0),
  xp INTEGER DEFAULT 0 CHECK (xp >= 0),
  gold INTEGER DEFAULT 0 CHECK (gold >= 0),
  gems INTEGER DEFAULT 0 CHECK (gems >= 0),
  honor_points INTEGER DEFAULT 0 CHECK (honor_points >= 0),
  avatar_config JSONB DEFAULT '{}',
  abilities_unlocked TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE character_class AS ENUM ('knight', 'mage', 'ranger', 'rogue', 'healer');
```

**Quest Management System**

```sql
-- Quest templates and instances
CREATE TABLE quest_templates (
  id SERIAL PRIMARY KEY,
  family_id INTEGER REFERENCES families(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category quest_category NOT NULL,
  difficulty quest_difficulty DEFAULT 'easy',
  base_xp INTEGER NOT NULL CHECK (base_xp > 0),
  base_gold INTEGER NOT NULL CHECK (base_gold > 0),
  base_gems INTEGER DEFAULT 0,
  estimated_minutes INTEGER,
  requirements JSONB DEFAULT '{}',
  bonus_objectives JSONB DEFAULT '[]',
  is_daily BOOLEAN DEFAULT false,
  is_weekly BOOLEAN DEFAULT false,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE quest_category AS ENUM (
  'cleaning', 'organization', 'maintenance', 'outdoor', 'pet_care',
  'academic', 'creative', 'helping', 'cooking', 'personal_care'
);

CREATE TYPE quest_difficulty AS ENUM ('easy', 'medium', 'hard', 'epic');

CREATE TABLE quest_instances (
  id SERIAL PRIMARY KEY,
  template_id INTEGER REFERENCES quest_templates(id),
  assigned_to INTEGER REFERENCES users(id),
  assigned_by INTEGER REFERENCES users(id),
  status quest_status DEFAULT 'available',
  priority INTEGER DEFAULT 1,
  due_date TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  verified_by INTEGER REFERENCES users(id),
  verification_notes TEXT,
  bonus_achieved BOOLEAN DEFAULT false,
  xp_awarded INTEGER DEFAULT 0,
  gold_awarded INTEGER DEFAULT 0,
  gems_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE quest_status AS ENUM (
  'available', 'accepted', 'in_progress', 'completed',
  'verified', 'rejected', 'expired'
);
```

**Boss Battle System**

```sql
-- Boss battles and group challenges
CREATE TABLE boss_battles (
  id SERIAL PRIMARY KEY,
  family_id INTEGER REFERENCES families(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  boss_type boss_battle_type NOT NULL,
  max_hp INTEGER NOT NULL CHECK (max_hp > 0),
  current_hp INTEGER NOT NULL CHECK (current_hp >= 0),
  status boss_status DEFAULT 'active',
  loot_table JSONB DEFAULT '{}',
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE boss_battle_type AS ENUM ('mini_boss', 'major_boss', 'raid_boss');
CREATE TYPE boss_status AS ENUM ('active', 'completed', 'abandoned');

CREATE TABLE boss_participants (
  id SERIAL PRIMARY KEY,
  boss_id INTEGER REFERENCES boss_battles(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  damage_dealt INTEGER DEFAULT 0,
  abilities_used JSONB DEFAULT '[]',
  last_action TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  rewards_claimed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Individual boss actions/damage events
CREATE TABLE boss_damage_log (
  id SERIAL PRIMARY KEY,
  boss_id INTEGER REFERENCES boss_battles(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  quest_completed INTEGER REFERENCES quest_instances(id),
  damage_amount INTEGER NOT NULL,
  ability_used VARCHAR(50),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Economy & Rewards**

```sql
-- Transaction logging and reward management
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  type transaction_type NOT NULL,
  amount INTEGER NOT NULL,
  currency currency_type NOT NULL,
  reference_id INTEGER, -- Links to quest, boss, reward, etc.
  reference_type VARCHAR(50),
  description TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE transaction_type AS ENUM ('earned', 'spent', 'transfer', 'bonus', 'penalty');
CREATE TYPE currency_type AS ENUM ('gold', 'gems', 'honor_points');

CREATE TABLE rewards (
  id SERIAL PRIMARY KEY,
  family_id INTEGER REFERENCES families(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category reward_category NOT NULL,
  tier INTEGER NOT NULL CHECK (tier > 0),
  cost_gold INTEGER DEFAULT 0,
  cost_gems INTEGER DEFAULT 0,
  cost_honor_points INTEGER DEFAULT 0,
  max_redemptions INTEGER, -- NULL for unlimited
  is_active BOOLEAN DEFAULT true,
  real_world_item BOOLEAN DEFAULT true,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE reward_category AS ENUM (
  'screen_time', 'privileges', 'money', 'experiences',
  'items', 'cosmetic', 'consumable'
);

CREATE TABLE reward_redemptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  reward_id INTEGER REFERENCES rewards(id),
  status redemption_status DEFAULT 'pending',
  quantity INTEGER DEFAULT 1,
  total_cost_gold INTEGER DEFAULT 0,
  total_cost_gems INTEGER DEFAULT 0,
  total_cost_honor_points INTEGER DEFAULT 0,
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_by INTEGER REFERENCES users(id),
  approved_at TIMESTAMP,
  fulfilled_at TIMESTAMP,
  notes TEXT
);

CREATE TYPE redemption_status AS ENUM ('pending', 'approved', 'fulfilled', 'rejected', 'expired');
```

**Social Features & Analytics**

```sql
-- Achievement system
CREATE TABLE achievements (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  unlock_criteria JSONB NOT NULL,
  reward_xp INTEGER DEFAULT 0,
  reward_gold INTEGER DEFAULT 0,
  reward_gems INTEGER DEFAULT 0,
  badge_image VARCHAR(255),
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_achievements (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  achievement_id INTEGER REFERENCES achievements(id),
  progress JSONB DEFAULT '{}',
  unlocked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, achievement_id)
);

-- Family interaction and messaging
CREATE TABLE family_messages (
  id SERIAL PRIMARY KEY,
  family_id INTEGER REFERENCES families(id),
  sender_id INTEGER REFERENCES users(id),
  message_type message_type DEFAULT 'general',
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP
);

CREATE TYPE message_type AS ENUM ('general', 'sos_request', 'celebration', 'system');

-- Activity feed and notifications
CREATE TABLE activity_feed (
  id SERIAL PRIMARY KEY,
  family_id INTEGER REFERENCES families(id),
  user_id INTEGER REFERENCES users(id),
  activity_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Database Indexes & Performance

**Critical Indexes**

```sql
-- Performance optimization indexes
CREATE INDEX idx_users_family_id ON users(family_id);
CREATE INDEX idx_characters_user_id ON characters(user_id);
CREATE INDEX idx_quest_instances_assigned_to ON quest_instances(assigned_to);
CREATE INDEX idx_quest_instances_status ON quest_instances(status);
CREATE INDEX idx_quest_instances_due_date ON quest_instances(due_date);
CREATE INDEX idx_boss_battles_family_id ON boss_battles(family_id);
CREATE INDEX idx_boss_battles_status ON boss_battles(status);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_activity_feed_family_id_created ON activity_feed(family_id, created_at DESC);

-- Composite indexes for common queries
CREATE INDEX idx_quest_instances_user_status ON quest_instances(assigned_to, status);
CREATE INDEX idx_characters_level_class ON characters(level DESC, class);
CREATE INDEX idx_user_achievements_user_unlocked ON user_achievements(user_id, unlocked_at);
```

---

## 🚀 API Design

### RESTful API Structure

**Base URL Structure**

```
https://chorequest.local/api/v1/
```

**Authentication Endpoints**

```typescript
// Authentication & User Management
POST / auth / register; // Create new family or join existing
POST / auth / login; // User authentication
POST / auth / refresh; // Refresh JWT token
POST / auth / logout; // Invalidate session
POST / auth / forgot - password; // Password reset request
POST / auth / reset - password; // Complete password reset

// Family Management
GET / families / profile; // Current family information
PATCH / families / profile; // Update family settings
POST / families / invite; // Generate invite code
POST / families / join; // Join family with invite code
```

**Core Game Endpoints**

```typescript
// Character Management
GET    /characters/me          // Current user's character
PATCH  /characters/me          // Update character (avatar, settings)
POST   /characters/abilities   // Activate special abilities
GET    /characters/leaderboard // Family leaderboard data

// Quest System
GET    /quests                 // Available quests for current user
POST   /quests                 // Create new quest (admin only)
GET    /quests/templates       // Quest template library
POST   /quests/templates       // Create quest template
GET    /quests/:id             // Quest details
PATCH  /quests/:id             // Update quest status
POST   /quests/:id/accept      // Accept available quest
POST   /quests/:id/complete    // Mark quest as completed
POST   /quests/:id/verify      // Verify quest completion (parent)
DELETE /quests/:id             // Cancel/delete quest

// Boss Battle System
GET    /boss-battles           // Active family boss battles
POST   /boss-battles           // Create new boss battle
GET    /boss-battles/:id       // Boss battle details
POST   /boss-battles/:id/join  // Join boss battle
POST   /boss-battles/:id/damage // Deal damage to boss
GET    /boss-battles/:id/log   // Damage and activity log
```

**Economy & Rewards**

```typescript
// Economy Management
GET    /transactions           // User transaction history
POST   /transactions/transfer  // Transfer currency between users
GET    /rewards                // Available rewards store
POST   /rewards                // Create reward (admin only)
POST   /rewards/:id/redeem     // Redeem reward
GET    /redemptions            // User's redemption history
PATCH  /redemptions/:id        // Approve/fulfill redemption (parent)

// Achievements & Progress
GET    /achievements           // Available achievements
GET    /achievements/progress  // User's achievement progress
POST   /achievements/claim     // Claim completed achievement
```

**Social Features**

```typescript
// Family Communication
GET / messages; // Family message feed
POST / messages; // Send message to family
POST / messages / sos; // Send help request
POST / messages / celebrate; // Send celebration message

// Activity & Analytics
GET / activity; // Family activity feed
GET / analytics / family; // Family progress analytics (parent)
GET / analytics / personal; // Personal progress analytics
```

### Home Assistant Integration API

**Dedicated HA Endpoints**

```typescript
// Home Assistant Integration Routes
GET    /api/ha/family-stats           // Overall family metrics
GET    /api/ha/player/:id/status      // Individual player status
GET    /api/ha/active-quests          // Current active quests
GET    /api/ha/completed-today        // Today's completions
POST   /api/ha/create-emergency-quest // Auto-create urgent quest
POST   /api/ha/webhook/:event         // Webhook receiver for HA events

// WebSocket Events for Real-Time HA Integration
WebSocket /api/ha/events              // Live quest updates stream
```

**HA Integration Data Formats**

```typescript
interface HAFamilyStats {
  family_id: string;
  active_members: number;
  daily_completion_rate: number;
  weekly_completion_rate: number;
  active_boss_battles: number;
  total_xp_today: number;
  current_streak_days: number;
}

interface HAPlayerStatus {
  user_id: string;
  character_name: string;
  level: number;
  xp: number;
  class: string;
  active_quests: number;
  completed_today: number;
  last_active: string;
}

interface HAEmergencyQuest {
  title: string;
  description: string;
  category: string;
  priority: "low" | "medium" | "high" | "critical";
  auto_assign?: string[]; // User IDs
  bonus_multiplier?: number;
  expires_in_hours?: number;
}
```

---

## 🎨 Frontend Architecture

### Component Structure

**App Organization**

```
src/
├── app/                    # Next.js 15 App Router
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Main app pages
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   └── layout.tsx         # Root layout
├── components/            # Reusable components
│   ├── ui/               # Base UI components
│   ├── game/             # Game-specific components
│   ├── forms/            # Form components
│   └── layout/           # Layout components
├── hooks/                # Custom React hooks
├── lib/                  # Utilities and configurations
├── store/                # State management
├── types/                # TypeScript type definitions
└── utils/                # Helper functions
```

**Key Component Categories**

**🎮 Game Components**

```typescript
// Character & Avatar System
components/game/character/
├── CharacterCard.tsx          // Character display card
├── CharacterCreation.tsx      // New character setup
├── AvatarCustomizer.tsx       // Avatar appearance editor
├── LevelProgressBar.tsx       // XP and level display
└── AbilitiesList.tsx          // Special abilities panel

// Quest Management
components/game/quests/
├── QuestBoard.tsx             // Available quests display
├── QuestCard.tsx              // Individual quest component
├── QuestDetails.tsx           // Quest detail modal
├── QuestCreator.tsx           // Admin quest creation
└── QuestProgress.tsx          // Quest completion tracking

// Boss Battle System
components/game/battles/
├── BossBattleCard.tsx         // Boss battle overview
├── BossHealthBar.tsx          // HP visualization
├── DamageLog.tsx              // Combat history
├── ParticipantsList.tsx       // Active participants
└── BossLootDisplay.tsx        // Rewards preview
```

**📱 Mobile-First Design Patterns**

**Responsive Breakpoints**

```typescript
// Tailwind configuration
const screens = {
  'xs': '475px',    // Large phones
  'sm': '640px',    // Small tablets
  'md': '768px',    // Tablets
  'lg': '1024px',   // Small laptops
  'xl': '1280px',   // Large laptops
  '2xl': '1536px',  // Desktops
}

// Component responsive patterns
<div className="
  grid grid-cols-1 gap-4
  sm:grid-cols-2 sm:gap-6
  lg:grid-cols-3 lg:gap-8
">
  {/* Quest cards adapt to screen size */}
</div>
```

**Touch-Friendly UI Elements**

```typescript
// Minimum touch target sizes (44px minimum)
const TouchButton = ({ children, ...props }) => (
  <button
    className="
      min-h-[44px] min-w-[44px] p-3
      text-lg font-medium rounded-lg
      active:scale-95 transition-transform
      focus:ring-2 focus:ring-offset-2
    "
    {...props}
  >
    {children}
  </button>
);
```

### State Management Strategy

**Global State with Zustand**

```typescript
// Character state store
interface CharacterStore {
  character: Character | null;
  xp: number;
  level: number;
  gold: number;
  gems: number;
  honorPoints: number;
  updateCharacter: (updates: Partial<Character>) => void;
  addXP: (amount: number) => void;
  spendCurrency: (type: CurrencyType, amount: number) => boolean;
}

const useCharacterStore = create<CharacterStore>((set, get) => ({
  character: null,
  xp: 0,
  level: 1,
  gold: 0,
  gems: 0,
  honorPoints: 0,

  updateCharacter: (updates) =>
    set((state) => ({
      character: state.character ? { ...state.character, ...updates } : null,
    })),

  addXP: (amount) =>
    set((state) => {
      const newXP = state.xp + amount;
      const newLevel = calculateLevel(newXP);

      // Level up celebration logic
      if (newLevel > state.level) {
        showLevelUpCelebration(newLevel);
      }

      return { xp: newXP, level: newLevel };
    }),

  spendCurrency: (type, amount) => {
    const state = get();
    if (state[type] >= amount) {
      set({ [type]: state[type] - amount });
      return true;
    }
    return false;
  },
}));
```

**Server State with React Query**

```typescript
// Quest data fetching and caching
export const useQuests = (filter?: QuestFilter) => {
  return useQuery({
    queryKey: ["quests", filter],
    queryFn: () => api.getQuests(filter),
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
  });
};

export const useCompleteQuest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (questId: string) => api.completeQuest(questId),
    onSuccess: (data) => {
      // Invalidate and refetch quest data
      queryClient.invalidateQueries({ queryKey: ["quests"] });

      // Update character progress
      const characterStore = useCharacterStore.getState();
      characterStore.addXP(data.xpAwarded);

      // Show success celebration
      showQuestCompletionToast(data);
    },
    onError: (error) => {
      showErrorToast("Failed to complete quest");
    },
  });
};
```

### Animation & Visual Feedback

**Framer Motion Integration**

```typescript
// Quest completion celebration
const QuestCompletionAnimation = ({ quest, onComplete }) => {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="fixed inset-0 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ y: 50 }}
        animate={{ y: 0 }}
        className="bg-gradient-to-r from-yellow-400 to-orange-500
                   rounded-lg p-6 shadow-2xl max-w-sm mx-4"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          ⚔️ Quest Complete! ⚔️
        </motion.div>

        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          +{quest.xpAwarded} XP | +{quest.goldAwarded} Gold
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

// Level up celebration with confetti effect
const LevelUpCelebration = ({ newLevel, newAbilities }) => {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: [0, 1.2, 1] }}
      transition={{ duration: 0.6 }}
      className="fixed inset-0 flex items-center justify-center z-50"
    >
      {/* Confetti particles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{
            x: "50vw",
            y: "50vh",
            rotate: 0,
            scale: 0
          }}
          animate={{
            x: `${Math.random() * 100}vw`,
            y: `${Math.random() * 100}vh`,
            rotate: Math.random() * 360,
            scale: 1
          }}
          transition={{
            duration: 2,
            delay: Math.random() * 0.5
          }}
          className="absolute w-4 h-4 bg-yellow-400 rounded-full"
        />
      ))}

      <div className="bg-purple-600 text-white rounded-lg p-8 text-center">
        <h2 className="text-3xl font-bold mb-2">LEVEL UP!</h2>
        <p className="text-xl mb-4">Level {newLevel} Achieved!</p>
        {newAbilities.map(ability => (
          <p key={ability} className="text-sm">🆕 Unlocked: {ability}</p>
        ))}
      </div>
    </motion.div>
  );
};
```

---

## ⚡ Real-Time Features

### Socket.io Implementation

**Server-Side Socket Management**

```typescript
// Socket.io server setup
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

interface SocketData {
  userId: string;
  familyId: string;
  characterName: string;
}

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"],
  },
});

// Authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;

    const user = await getUserById(decoded.userId);
    if (!user) {
      return next(new Error("User not found"));
    }

    socket.data = {
      userId: user.id,
      familyId: user.family_id,
      characterName: user.character?.name || user.display_name,
    };

    next();
  } catch (error) {
    next(new Error("Authentication failed"));
  }
});

// Connection handling
io.on("connection", (socket) => {
  const { userId, familyId, characterName } = socket.data;

  // Join family room for targeted updates
  socket.join(`family_${familyId}`);

  // Announce user online
  socket.to(`family_${familyId}`).emit("user_online", {
    userId,
    characterName,
    timestamp: new Date().toISOString(),
  });

  // Handle quest completion broadcasts
  socket.on("quest_completed", async (questData) => {
    // Broadcast to family members
    socket.to(`family_${familyId}`).emit("family_activity", {
      type: "quest_completed",
      user: characterName,
      quest: questData.questName,
      xp: questData.xpAwarded,
      timestamp: new Date().toISOString(),
    });

    // Update boss battle if applicable
    if (questData.bossBattleId) {
      await handleBossDamage(questData.bossBattleId, questData.damage);

      const updatedBoss = await getBossBattle(questData.bossBattleId);
      io.to(`family_${familyId}`).emit("boss_update", updatedBoss);

      // Check if boss defeated
      if (updatedBoss.current_hp <= 0) {
        io.to(`family_${familyId}`).emit("boss_defeated", {
          bossName: updatedBoss.name,
          participants: updatedBoss.participants,
          loot: updatedBoss.loot_table,
        });
      }
    }
  });

  // Handle SOS help requests
  socket.on("send_sos", (sosData) => {
    socket.to(`family_${familyId}`).emit("sos_request", {
      from: characterName,
      questName: sosData.questName,
      message: sosData.message,
      urgency: sosData.urgency,
      questId: sosData.questId,
      timestamp: new Date().toISOString(),
    });
  });

  // Handle boss battle participation
  socket.on("join_boss_battle", async (bossId) => {
    socket.join(`boss_${bossId}`);

    socket.to(`boss_${bossId}`).emit("new_participant", {
      characterName,
      joinedAt: new Date().toISOString(),
    });
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    socket.to(`family_${familyId}`).emit("user_offline", {
      userId,
      characterName,
      timestamp: new Date().toISOString(),
    });
  });
});
```

**Client-Side Socket Integration**

```typescript
// React hook for Socket.io connection
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/store/auth";

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const { user, token } = useAuthStore();

  useEffect(() => {
    if (!token || !user) return;

    const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
      auth: { token },
      autoConnect: true,
    });

    socketInstance.on("connect", () => {
      setConnected(true);
      console.log("Connected to ChoreQuest server");
    });

    socketInstance.on("disconnect", () => {
      setConnected(false);
      console.log("Disconnected from ChoreQuest server");
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [token, user]);

  return { socket, connected };
};

// Real-time family activity feed
export const useFamilyActivity = () => {
  const { socket } = useSocket();
  const [activities, setActivities] = useState<FamilyActivity[]>([]);

  useEffect(() => {
    if (!socket) return;

    const handleActivity = (activity: FamilyActivity) => {
      setActivities((prev) => [activity, ...prev.slice(0, 49)]); // Keep latest 50

      // Show toast notification for certain activities
      if (activity.type === "quest_completed") {
        showActivityToast(activity);
      }
    };

    const handleSOSRequest = (sosData: SOSRequest) => {
      showSOSNotification(sosData);
      setActivities((prev) => [
        {
          type: "sos_request",
          user: sosData.from,
          message: `${sosData.from} needs help with ${sosData.questName}`,
          timestamp: sosData.timestamp,
          urgency: sosData.urgency,
        },
        ...prev,
      ]);
    };

    socket.on("family_activity", handleActivity);
    socket.on("sos_request", handleSOSRequest);

    return () => {
      socket.off("family_activity", handleActivity);
      socket.off("sos_request", handleSOSRequest);
    };
  }, [socket]);

  return { activities };
};
```

---

## 🔐 Security & Authentication

### JWT Authentication Strategy

**Token Structure & Management**

```typescript
interface JWTPayload {
  userId: string;
  familyId: string;
  role: UserRole;
  iat: number;
  exp: number;
}

// Token generation
export const generateTokens = (user: User) => {
  const payload: JWTPayload = {
    userId: user.id,
    familyId: user.family_id,
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 15 * 60, // 15 minutes
  };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET!);

  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.REFRESH_SECRET!,
    { expiresIn: "7d" },
  );

  return { accessToken, refreshToken };
};

// Middleware for protected routes
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;

    // Verify user still exists and is active
    const user = await getUserById(decoded.userId);
    if (!user || user.family_id !== decoded.familyId) {
      return res.status(403).json({ error: "Invalid token" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

// Role-based authorization
export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
};
```

### Input Validation & Sanitization

**Request Validation with Zod**

```typescript
import { z } from "zod";

// Quest creation validation
export const createQuestSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  category: z.enum([
    "cleaning",
    "organization",
    "maintenance",
    "outdoor",
    "pet_care",
    "academic",
  ]),
  difficulty: z.enum(["easy", "medium", "hard", "epic"]),
  baseXP: z.number().int().min(1).max(1000),
  baseGold: z.number().int().min(0).max(500),
  baseGems: z.number().int().min(0).max(50),
  estimatedMinutes: z.number().int().min(1).max(480),
  assignedTo: z.string().uuid().optional(),
  dueDate: z.string().datetime().optional(),
  bonusObjectives: z
    .array(
      z.object({
        description: z.string().max(200),
        bonusXP: z.number().int().min(0).max(100),
        bonusGold: z.number().int().min(0).max(50),
      }),
    )
    .max(3)
    .optional(),
});

// Validation middleware
export const validateRequest = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Validation failed",
          details: error.errors,
        });
      }
      next(error);
    }
  };
};
```

---

## 🚢 Deployment & Infrastructure

### Docker Configuration

**Docker Compose Setup**

```yaml
# docker-compose.yml
version: "3.8"

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: chorequest-app
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/chorequest
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - REFRESH_SECRET=${REFRESH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    volumes:
      - uploads:/app/uploads
      - ./logs:/app/logs

  postgres:
    image: postgres:15-alpine
    container_name: chorequest-db
    environment:
      - POSTGRES_DB=chorequest
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: chorequest-cache
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    container_name: chorequest-proxy
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
      - uploads:/var/www/uploads:ro
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  uploads:
```

**Application Dockerfile**

```dockerfile
# Dockerfile
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Build stage
FROM base AS builder
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine AS production
WORKDIR /app

# Install production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Set ownership
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["npm", "start"]
```

---

## ⚡ Performance Considerations

### Database Optimization

**Query Performance & Indexing**

```sql
-- Critical performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quest_instances_user_status_priority
ON quest_instances(assigned_to, status, priority DESC, due_date ASC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quest_instances_family_active
ON quest_instances(family_id, status) WHERE status IN ('available', 'accepted', 'in_progress');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_user_recent
ON transactions(user_id, timestamp DESC);

-- Partial indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_boss_battles_active
ON boss_battles(family_id, created_at DESC) WHERE status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_characters_leaderboard
ON characters(family_id, level DESC, xp DESC);
```

### Caching Strategy

**Redis Caching Implementation**

```typescript
class CacheManager {
  private redis: Redis;
  private defaultTTL = 300; // 5 minutes default

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
      password: process.env.REDIS_PASSWORD,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
  }

  // Family leaderboard caching
  async getFamilyLeaderboard(
    familyId: string,
  ): Promise<LeaderboardData | null> {
    const key = `leaderboard:family:${familyId}`;
    const cached = await this.redis.get(key);

    if (cached) {
      return JSON.parse(cached);
    }

    // Fetch from database
    const leaderboard = await this.computeFamilyLeaderboard(familyId);

    // Cache for 5 minutes
    await this.redis.setex(key, this.defaultTTL, JSON.stringify(leaderboard));

    return leaderboard;
  }

  // Quest data caching with invalidation
  async getUserQuests(userId: string, refresh = false): Promise<Quest[]> {
    const key = `quests:user:${userId}`;

    if (!refresh) {
      const cached = await this.redis.get(key);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    const quests = await this.fetchUserQuestsFromDB(userId);
    await this.redis.setex(key, 60, JSON.stringify(quests)); // 1 minute cache

    return quests;
  }

  // Invalidate related caches on updates
  async invalidateUserCaches(userId: string): Promise<void> {
    const pattern = `*:user:${userId}`;
    const keys = await this.redis.keys(pattern);

    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
}

export const cacheManager = new CacheManager();
```

---

## 🔧 Development Workflow

### Test Driven Development (TDD) Approach

**Development Methodology** This project follows a strict Test Driven
Development approach to ensure code quality, maintainability, and confidence in
functionality. All features must be developed using the Red-Green-Refactor
cycle.

**TDD Implementation Strategy**

**Red-Green-Refactor Cycle**

```
1. RED: Write a failing test that defines desired functionality
2. GREEN: Write minimal code to make the test pass
3. REFACTOR: Improve code quality while keeping tests green
4. REPEAT: Continue cycle for each new feature/requirement
```

**TDD Guidelines by Layer**

**🧪 API/Backend TDD Process**

```typescript
// Example TDD cycle for quest creation API
describe("POST /api/quests", () => {
  // RED: Write failing test first
  it("should create quest when user has admin role", async () => {
    const adminUser = await createTestUser({ role: "guild_master" });
    const questData = {
      name: "Test Quest",
      category: "cleaning",
      baseXP: 50,
      baseGold: 25,
    };

    const response = await request(app)
      .post("/api/quests")
      .set("Authorization", `Bearer ${adminUser.token}`)
      .send(questData)
      .expect(201);

    expect(response.body.quest.name).toBe("Test Quest");

    // Verify quest was saved to database
    const savedQuest = await getQuestById(response.body.quest.id);
    expect(savedQuest).toBeTruthy();
  });

  // Additional test cases...
});

// GREEN: Implement minimal code to pass test
// REFACTOR: Improve code quality, extract functions, etc.
```

**🎨 Frontend Component TDD Process**

```typescript
// Example TDD cycle for QuestCard component
describe('QuestCard Component', () => {
  // RED: Write failing test first
  it('should display quest information correctly', () => {
    const mockQuest = {
      id: '1',
      name: 'Clean Kitchen',
      baseXP: 50,
      baseGold: 25,
      status: 'available'
    };

    render(<QuestCard quest={mockQuest} onAccept={jest.fn()} />);

    expect(screen.getByText('Clean Kitchen')).toBeInTheDocument();
    expect(screen.getByText('50 XP')).toBeInTheDocument();
    expect(screen.getByText('25 Gold')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /accept quest/i })).toBeInTheDocument();
  });

  // GREEN: Create minimal component to pass test
  // REFACTOR: Add styling, accessibility, error handling
});
```

**📊 Database/Service TDD Process**

```typescript
// Example TDD cycle for quest service
describe("QuestService", () => {
  let questService: QuestService;
  let testDB: TestDatabase;

  beforeEach(async () => {
    testDB = await setupTestDatabase();
    questService = new QuestService(testDB.pool);
  });

  // RED: Write failing test first
  it("should award XP and gold when quest is verified", async () => {
    const user = await testDB.createUser({ xp: 100, gold: 50 });
    const quest = await testDB.createQuest({
      assignedTo: user.id,
      baseXP: 25,
      baseGold: 15,
    });

    await questService.verifyQuestCompletion(quest.id, user.id);

    const updatedUser = await testDB.getUserById(user.id);
    expect(updatedUser.character.xp).toBe(125); // 100 + 25
    expect(updatedUser.character.gold).toBe(65); // 50 + 15
  });

  // GREEN: Implement service method to pass test
  // REFACTOR: Extract award calculation logic, add validation
});
```

**TDD Best Practices for ChoreQuest**

**Test Categories and Coverage**

```typescript
// Unit Tests (70% of test suite)
- Pure functions and utilities
- Individual component behavior
- Service class methods
- API endpoint logic

// Integration Tests (25% of test suite)
- Database operations with real DB
- API routes with authentication
- Component integration with hooks/context
- Real-time Socket.io events

// End-to-End Tests (5% of test suite)
- Complete user workflows
- Cross-browser compatibility
- Mobile responsive behavior
- Performance under load
```

**TDD Development Rules**

**Mandatory TDD Rules**

1. **No production code without failing test**: Every line of production code
   must be preceded by a failing test
2. **Minimal test code**: Write only enough test code to make the test fail
   meaningfully
3. **Minimal production code**: Write only enough production code to make the
   failing test pass
4. **Refactor fearlessly**: Clean up code while maintaining green tests
5. **Test first, always**: Even for bug fixes, write the failing test that
   reproduces the issue first

**TDD Workflow Integration**

```bash
# Development workflow with TDD
npm run test:watch     # Keep tests running during development
npm run test:coverage  # Ensure coverage thresholds are met
npm run lint          # Code quality checks
npm run build         # Verify production build works

# Pre-commit hooks enforce TDD compliance
- All tests must pass
- Coverage must be above 80%
- No untested code can be committed
```

**Testing Tools and Configuration**

```json
{
  "jest": {
    "watchMode": true,
    "coverage": {
      "threshold": {
        "global": {
          "branches": 80,
          "functions": 80,
          "lines": 80,
          "statements": 80
        }
      }
    }
  }
}
```

**TDD for Different Feature Types**

**🆕 New Feature Development**

1. Write acceptance test (E2E) that describes user story
2. Write failing unit tests for each component/service needed
3. Implement minimal code to pass unit tests
4. Integrate components and pass acceptance test
5. Refactor entire feature while keeping tests green

**🐛 Bug Fix Process**

1. Write failing test that reproduces the bug
2. Verify test fails for the right reason
3. Fix the bug with minimal code change
4. Verify test now passes
5. Refactor if needed while keeping tests green

**🔄 Refactoring Process**

1. Ensure full test coverage before refactoring
2. Run all tests to confirm green state
3. Make small, incremental changes
4. Run tests after each change
5. Never refactor without green tests

**TDD Benefits for ChoreQuest**

- **Confidence**: Every feature is thoroughly tested before deployment
- **Documentation**: Tests serve as living documentation of system behavior
- **Design**: TDD drives better API and component design
- **Debugging**: When bugs occur, tests help isolate the issue quickly
- **Refactoring**: Safe to improve code knowing tests will catch regressions
- **Collaboration**: Clear test specifications help team coordination

### Development Environment Setup

**Local Development Configuration**

```bash
# .env.local
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/chorequest_dev
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-dev-jwt-secret-key
REFRESH_SECRET=your-dev-refresh-secret-key
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# Development database settings
POSTGRES_PASSWORD=password
REDIS_PASSWORD=dev-redis-password

# Feature flags for development
ENABLE_DEBUG_MODE=true
ENABLE_MOCK_NOTIFICATIONS=true
SKIP_EMAIL_VERIFICATION=true
```

**Package.json Scripts**

```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:db\" \"npm run dev:next\"",
    "dev:next": "next dev",
    "dev:db": "docker-compose -f docker-compose.dev.yml up -d postgres redis",
    "build": "npm run build:db && next build",
    "build:db": "prisma generate && prisma db push",
    "start": "next start",
    "lint": "next lint --fix",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:e2e": "playwright test",
    "db:migrate": "prisma migrate dev",
    "db:seed": "tsx scripts/seed.ts",
    "docker:build": "docker build -t chorequest:latest .",
    "docker:dev": "docker-compose -f docker-compose.dev.yml up",
    "docker:prod": "docker-compose up -d"
  }
}
```

---

## 🧪 Testing Strategy

### Unit Testing with Jest

**Jest Configuration**

```javascript
// jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/components/(.*): '<rootDir>/src/components/$1',
    '^@/lib/(.*): '<rootDir>/src/lib/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};

module.exports = createJestConfig(customJestConfig);
```

### End-to-End Testing with Playwright

**E2E Test Example**

```typescript
// e2e/quest-completion.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Quest Completion Flow", () => {
  test("user can complete a basic daily quest", async ({ page }) => {
    // Login
    await page.goto("/login");
    await page.fill("[data-testid=email-input]", "test@family.com");
    await page.fill("[data-testid=password-input]", "testpassword");
    await page.click("[data-testid=login-button]");

    // Accept quest
    await page.click("[data-testid=quest-board-tab]");
    const questCard = page.locator("[data-testid=quest-card]").first();
    await questCard.locator("[data-testid=accept-quest-btn]").click();

    // Complete quest
    await page.click("[data-testid=active-quests-tab]");
    await page.locator("[data-testid=complete-quest-btn]").first().click();
    await page.click("[data-testid=submit-completion-btn]");

    // Verify completion
    await expect(
      page.locator("[data-testid=quest-completion-success]"),
    ).toBeVisible();
  });
});
```

---

## 📊 Monitoring & Maintenance

### Application Monitoring

**Health Check Endpoints**

```typescript
// pages/api/health.ts
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const healthStatus = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    services: {
      database: "connected",
      redis: "connected",
      websockets: "active",
    },
  };

  try {
    // Check database
    await pool.query("SELECT 1");

    // Check Redis
    await redis.ping();

    res.status(200).json(healthStatus);
  } catch (error) {
    healthStatus.status = "unhealthy";
    res.status(503).json(healthStatus);
  }
}
```

### Maintenance Scripts

**Automated Backup**

```bash
#!/bin/bash
# backup.sh - Database backup script

BACKUP_DIR="/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="chorequest_backup_${TIMESTAMP}.sql"

# Create backup
docker exec chorequest-db pg_dump -U postgres -d chorequest > "$BACKUP_DIR/$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_DIR/$BACKUP_FILE"

# Clean up old backups (keep last 7 days)
find "$BACKUP_DIR" -name "chorequest_backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
```

### Environment Variables Reference

```bash
# Required Environment Variables
DATABASE_URL=postgresql://user:pass@localhost:5432/chorequest
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret-key
REFRESH_SECRET=your-refresh-secret-key
NEXTAUTH_URL=https://your-domain.com

# Optional Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
ADMIN_EMAIL=admin@your-domain.com

# Feature Flags
ENABLE_DEBUG_MODE=false
ENABLE_SEASONAL_EVENTS=true
ENABLE_HOME_ASSISTANT=true
```

---

## 📝 Conclusion

This Technical Design Document provides a comprehensive blueprint for building
ChoreQuest, a gamified family chore management system. The architecture balances
scalability, performance, and maintainability while ensuring a delightful user
experience across all devices.

### Key Technical Highlights

**🏗️ Architecture**: Modern full-stack design with React/Next.js frontend,
Node.js/Express backend, PostgreSQL database, and Redis caching, all
containerized with Docker.

**⚡ Performance**: Optimized with database indexing, Redis caching, code
splitting, and efficient asset management.

**🔒 Security**: Comprehensive security measures including JWT authentication,
input validation, and rate limiting.

**📱 Mobile-First**: Responsive design with PWA capabilities and touch-friendly
interfaces.

**🔄 Real-Time**: WebSocket integration for live family interactions and
collaborative boss battles.

**🧪 Quality Assurance**: Robust testing strategy with unit, integration, and
end-to-end testing.

**📊 Monitoring**: Built-in health checks, performance monitoring, and automated
maintenance.

### Development Readiness

This document provides everything needed to begin implementation:

- Complete database schema with optimized indexes
- Detailed API specifications
- Frontend component architecture
- Security implementation guidelines
- Deployment and infrastructure configuration
- Testing strategies and monitoring systems

The modular design allows for iterative development, starting with the MVP and
gradually adding advanced features.

---

**Document Version**: 2.0  
**Last Updated**: [Current Date]  
**Status**: Ready for Implementation  
**Next Steps**: Begin Phase 1 development with MVP feature set

---

_Ready to transform chores into epic family adventures! 🏰⚔️_
