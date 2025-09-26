-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('GUILD_MASTER', 'HERO', 'YOUNG_HERO');

-- CreateEnum
CREATE TYPE "public"."CharacterClass" AS ENUM ('KNIGHT', 'MAGE', 'RANGER', 'ROGUE', 'HEALER');

-- CreateEnum
CREATE TYPE "public"."QuestDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "public"."QuestCategory" AS ENUM ('DAILY', 'WEEKLY', 'BOSS_BATTLE');

-- CreateEnum
CREATE TYPE "public"."QuestStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'APPROVED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."BossBattleStatus" AS ENUM ('ACTIVE', 'DEFEATED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."TransactionType" AS ENUM ('QUEST_REWARD', 'BOSS_VICTORY', 'STORE_PURCHASE', 'REWARD_REFUND', 'BONUS_AWARD', 'SOS_HELP');

-- CreateEnum
CREATE TYPE "public"."RewardType" AS ENUM ('SCREEN_TIME', 'PRIVILEGE', 'PURCHASE', 'EXPERIENCE');

-- CreateTable
CREATE TABLE "public"."families" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "families_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL DEFAULT 'YOUNG_HERO',
    "familyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."characters" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "class" "public"."CharacterClass" NOT NULL DEFAULT 'KNIGHT',
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "gold" INTEGER NOT NULL DEFAULT 0,
    "gems" INTEGER NOT NULL DEFAULT 0,
    "honorPoints" INTEGER NOT NULL DEFAULT 0,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "characters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."quest_templates" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "xpReward" INTEGER NOT NULL,
    "goldReward" INTEGER NOT NULL,
    "difficulty" "public"."QuestDifficulty" NOT NULL,
    "category" "public"."QuestCategory" NOT NULL,
    "familyId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "classBonuses" JSONB,

    CONSTRAINT "quest_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."quest_instances" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "xpReward" INTEGER NOT NULL,
    "goldReward" INTEGER NOT NULL,
    "difficulty" "public"."QuestDifficulty" NOT NULL,
    "category" "public"."QuestCategory" NOT NULL,
    "status" "public"."QuestStatus" NOT NULL DEFAULT 'PENDING',
    "assignedToId" TEXT,
    "createdById" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "templateId" TEXT,
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quest_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."boss_battles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "totalHp" INTEGER NOT NULL,
    "currentHp" INTEGER NOT NULL,
    "familyId" TEXT NOT NULL,
    "status" "public"."BossBattleStatus" NOT NULL DEFAULT 'ACTIVE',
    "gemReward" INTEGER NOT NULL DEFAULT 50,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "boss_battles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."boss_battle_participants" (
    "id" TEXT NOT NULL,
    "bossBattleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "damageDealt" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "boss_battle_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."TransactionType" NOT NULL,
    "xpChange" INTEGER NOT NULL DEFAULT 0,
    "goldChange" INTEGER NOT NULL DEFAULT 0,
    "gemsChange" INTEGER NOT NULL DEFAULT 0,
    "honorChange" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT NOT NULL,
    "relatedId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rewards" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "public"."RewardType" NOT NULL,
    "cost" INTEGER NOT NULL,
    "familyId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reward_redemptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rewardId" TEXT NOT NULL,
    "cost" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "fulfilledAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "reward_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."achievements" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "condition" JSONB NOT NULL,
    "xpReward" INTEGER NOT NULL DEFAULT 0,
    "goldReward" INTEGER NOT NULL DEFAULT 0,
    "gemReward" INTEGER NOT NULL DEFAULT 0,
    "badgeUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_achievements" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sos_requests" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "helperId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "honorReward" INTEGER NOT NULL DEFAULT 5,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sos_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "families_code_key" ON "public"."families"("code");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "characters_userId_key" ON "public"."characters"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "boss_battle_participants_bossBattleId_userId_key" ON "public"."boss_battle_participants"("bossBattleId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_achievements_userId_achievementId_key" ON "public"."user_achievements"("userId", "achievementId");

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "public"."families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."characters" ADD CONSTRAINT "characters_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."quest_templates" ADD CONSTRAINT "quest_templates_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "public"."families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."quest_instances" ADD CONSTRAINT "quest_instances_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "public"."families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."quest_instances" ADD CONSTRAINT "quest_instances_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."quest_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."quest_instances" ADD CONSTRAINT "quest_instances_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."quest_instances" ADD CONSTRAINT "quest_instances_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."boss_battles" ADD CONSTRAINT "boss_battles_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "public"."families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."boss_battle_participants" ADD CONSTRAINT "boss_battle_participants_bossBattleId_fkey" FOREIGN KEY ("bossBattleId") REFERENCES "public"."boss_battles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."boss_battle_participants" ADD CONSTRAINT "boss_battle_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transactions" ADD CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rewards" ADD CONSTRAINT "rewards_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "public"."families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reward_redemptions" ADD CONSTRAINT "reward_redemptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reward_redemptions" ADD CONSTRAINT "reward_redemptions_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "public"."rewards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reward_redemptions" ADD CONSTRAINT "reward_redemptions_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_achievements" ADD CONSTRAINT "user_achievements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_achievements" ADD CONSTRAINT "user_achievements_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "public"."achievements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sos_requests" ADD CONSTRAINT "sos_requests_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sos_requests" ADD CONSTRAINT "sos_requests_helperId_fkey" FOREIGN KEY ("helperId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
