export interface User {
  id: string;
  email: string;
  name: string;
  familyId: string;
  role: 'GUILD_MASTER' | 'HERO' | 'YOUNG_HERO';
  createdAt: Date;
  updatedAt: Date;
}

export interface Character {
  id: string;
  userId: string;
  name: string;
  class: 'KNIGHT' | 'MAGE' | 'RANGER' | 'ROGUE' | 'HEALER';
  level: number;
  xp: number;
  gold: number;
  gems: number;
  honorPoints: number;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Family {
  id: string;
  name: string;
  code: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  goldReward: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  category: 'DAILY' | 'WEEKLY' | 'BOSS_BATTLE';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'APPROVED';
  assignedToId?: string;
  createdById: string;
  familyId: string;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface BossBattle {
  id: string;
  name: string;
  description: string;
  totalHp: number;
  currentHp: number;
  familyId: string;
  status: 'ACTIVE' | 'DEFEATED' | 'EXPIRED';
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}